import { NextResponse } from 'next/server';
import { createAdminClient } from '@/utils/supabase/admin';
import jwt from 'jsonwebtoken';
import { cookies, headers } from 'next/headers';

export async function GET() {
  try {
    const cookieStore = await cookies();
    const headerMap = await headers();
    
    // Get access token from cookie or Authorization header
    let accessToken = cookieStore.get('access_token')?.value;
    if (!accessToken) {
      const authHeader = headerMap.get('authorization');
      if (authHeader?.startsWith('Bearer ')) {
        accessToken = authHeader.slice(7);
      }
    }

    if (!accessToken) {
      return NextResponse.json({ error: 'Nicht authentifiziert' }, { status: 401 });
    }

    // Verify JWT token and extract user ID
    let decodedToken: any;
    try {
      decodedToken = jwt.verify(accessToken, process.env.JWT_SECRET!);
    } catch {
      return NextResponse.json({ error: 'Ungültiger Token' }, { status: 401 });
    }

    const userId = decodedToken.sub;

    const supabase = createAdminClient();

    // Check for active session in login_sessions
    const { data: activeSession } = await supabase
      .from('login_sessions')
      .select('id, is_active, users!inner(first_name, last_name, roles(name))')
      .eq('user_id', userId)
      .eq('is_active', true)
      .single();

    if (!activeSession) {
      return NextResponse.json({ isActive: false });
    }

    // Get email from users table since it's not in login_sessions join
    const { data: userData } = await supabase
      .from('users')
      .select('email')
      .eq('auth_user_id', userId)
      .single();

    return NextResponse.json({
      isActive: true,
      sessionId: activeSession.id,
      user: {
        id: userId,
        email: userData?.email || decodedToken.email,
        firstName: (activeSession as any).users.first_name,
        lastName: (activeSession as any).users.last_name,
        role: (activeSession as any).users.roles.name
      }
    });
  } catch (error) {
    console.error('Session status error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
