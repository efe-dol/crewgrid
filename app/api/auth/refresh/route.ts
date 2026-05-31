import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import jwt from 'jsonwebtoken';
import { createAdminClient } from '@/utils/supabase/admin';

export async function POST() {
  try {
    const cookieStore = await cookies();
    const refreshToken = cookieStore.get('refresh_token')?.value;

    if (!refreshToken) {
      return NextResponse.json({ error: 'No refresh token' }, { status: 401 });
    }

    if (!process.env.JWT_SECRET) throw new Error('JWT_SECRET is not configured');
    const jwtSecret = process.env.JWT_SECRET;
    
    // Verify refresh token
    const decoded = jwt.verify(refreshToken, jwtSecret) as any;
    
    const supabase = createAdminClient();

    // Verify session in database
    const { data: session, error } = await supabase
      .from('login_sessions')
      .select('*, users(email, is_active, roles(name))')
      .eq('id', decoded.sessionId)
      .eq('token_hash', decoded.tokenHash)
      .eq('is_active', true)
      .single();

    if (error || !session || !session.users?.is_active) {
      // Invalidate if tampered or deactivated
      if (session) {
        await supabase.from('login_sessions').update({ is_active: false }).eq('id', session.id);
      }
      cookieStore.delete('refresh_token');
      cookieStore.delete('access_token');
      return NextResponse.json({ error: 'Invalid session' }, { status: 401 });
    }

    // Generate new Access Token
    const accessToken = jwt.sign(
      { 
        sub: session.user_id, 
        email: session.users.email, 
        role: session.users.roles.name,
        sessionId: session.id 
      },
      jwtSecret,
      { expiresIn: '15m' }
    );

    cookieStore.set('access_token', accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 15 * 60 // 15 mins
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Refresh token error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
