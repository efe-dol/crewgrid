import { NextResponse } from 'next/server';
import { createAdminClient } from '@/utils/supabase/admin';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import crypto from 'crypto';
import jwt from 'jsonwebtoken';

export async function POST(request: Request) {
  try {
    const cookieStore = await cookies();
    const supabaseUserClient = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll();
          },
          setAll(cookiesToSet) {
            try {
              cookiesToSet.forEach(({ name, value, options }) =>
                cookieStore.set(name, value, options)
              )
            } catch {}
          }
        }
      }
    );

    const { data: authData, error: authError } = await supabaseUserClient.auth.getUser();
    if (authError || !authData.user) {
      return NextResponse.json({ error: 'Nicht authentifiziert bei Supabase.' }, { status: 401 });
    }

    const { licenseId } = await request.json();
    if (!licenseId) {
      return NextResponse.json({ error: 'Lizenz fehlt.' }, { status: 400 });
    }

    const supabase = createAdminClient();

    // Fetch user with role
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('*, roles(name)')
      .eq('auth_user_id', authData.user.id)
      .single();

    if (userError || !user) {
      return NextResponse.json({ error: 'Benutzerkonto nicht gefunden.' }, { status: 401 });
    }

    if (!user.is_active) {
      return NextResponse.json({ error: 'Konto ist deaktiviert.' }, { status: 403 });
    }

    // Check License Limits
    const { data: license, error: licenseError } = await supabase
      .from('licenses')
      .select('*')
      .eq('id', licenseId)
      .single();

    if (licenseError || !license) {
      return NextResponse.json({ error: 'Gewählte Lizenz nicht gefunden.' }, { status: 400 });
    }

    const roleName = user.roles.name;

    // FEHLERBEHEBUNG: Bevor wir ein neues Login zulassen,
    // beenden wir alle vorherigen "hängengebliebenen" Sessions dieses Benutzers.
    await supabase
      .from('login_sessions')
      .update({ is_active: false, logout_timestamp: new Date().toISOString() })
      .eq('user_id', user.id)
      .eq('is_active', true);

    // Get active sessions for this license
    const { data: activeSessions, error: sessionError } = await supabase
      .from('login_sessions')
      .select('users!inner(role_id, roles(name))')
      .eq('license_id', licenseId)
      .eq('is_active', true);

    if (sessionError) throw sessionError;

    // Check total limits
    if (license.max_concurrent_users && activeSessions.length >= license.max_concurrent_users) {
       return NextResponse.json({ error: 'Lizenz ausgeschöpft. Bitte versuchen Sie es später.' }, { status: 403 });
    }

    // Check role-specific limits
    if (license.max_concurrent_per_role && license.max_concurrent_per_role[roleName] !== undefined) {
      const activeForRole = activeSessions.filter((s: any) => s.users?.roles?.name === roleName).length;
      if (activeForRole >= license.max_concurrent_per_role[roleName]) {
        return NextResponse.json({ error: 'Lizenz für diese Rolle ausgeschöpft. Bitte versuchen Sie es später.' }, { status: 403 });
      }
    }

    const ip = request.headers.get('x-forwarded-for') || 'unknown';
    const userAgent = request.headers.get('user-agent') || 'Unknown';

    // Create session token hash
    const sessionToken = crypto.randomBytes(32).toString('hex');
    const tokenHash = crypto.createHash('sha256').update(sessionToken).digest('hex');

    // Insert Login Session
    const { data: session, error: insertSessionError } = await supabase
      .from('login_sessions')
      .insert({
        user_id: user.id,
        license_id: licenseId,
        ip_address: ip,
        user_agent: userAgent,
        token_hash: tokenHash,
        is_active: true
      })
      .select()
      .single();

    if (insertSessionError) throw insertSessionError;

    // Update last login
    await supabase.from('users').update({ last_login: new Date().toISOString() }).eq('id', user.id);

    // Audit log
    await supabase.from('audit_logs').insert({
      user_id: user.id,
      action: 'LOGIN',
      table_name: 'login_sessions',
      record_id: session.id,
      ip_address: ip,
      user_agent: userAgent,
      new_data: { status: 'success', license_id: licenseId }
    });

    // Generate JWTs
    if (!process.env.JWT_SECRET) throw new Error('JWT_SECRET is not configured');
    const jwtSecret = process.env.JWT_SECRET;
    
    const accessToken = jwt.sign(
      { 
        sub: user.id, 
        email: user.email, 
        role: roleName,
        sessionId: session.id 
      },
      jwtSecret,
      { expiresIn: '15m' }
    );

    const refreshToken = jwt.sign(
      { 
        sub: user.id, 
        sessionId: session.id,
        tokenHash
      },
      jwtSecret,
      { expiresIn: '7d' }
    );

    // Set HTTP-Only Cookie for Refresh Token
    cookieStore.set('refresh_token', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 7 * 24 * 60 * 60 // 7 days
    });

    cookieStore.set('access_token', accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 15 * 60 // 15 mins
    });

    return NextResponse.json({ 
      success: true, 
      user: {
        id: user.id,
        email: user.email,
        firstName: user.first_name,
        lastName: user.last_name,
        initials: user.initials,
        role: roleName
      }
    });

  } catch (error) {
    console.error('Session creation error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
