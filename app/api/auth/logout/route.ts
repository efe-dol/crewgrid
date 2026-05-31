import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import jwt from 'jsonwebtoken';
import { createAdminClient } from '@/utils/supabase/admin';

export async function POST() {
  try {
    const cookieStore = await cookies();
    const accessToken = cookieStore.get('access_token')?.value;
    const refreshToken = cookieStore.get('refresh_token')?.value;

    if (!process.env.JWT_SECRET) throw new Error('JWT_SECRET is not configured');
    const jwtSecret = process.env.JWT_SECRET;
    
    // Try to decode access token to find session ID to invalidate
    let sessionId = null;
    try {
      if (accessToken) {
        const decoded = jwt.verify(accessToken, jwtSecret, { ignoreExpiration: true }) as any;
        sessionId = decoded.sessionId;
      } else if (refreshToken) {
        const decoded = jwt.verify(refreshToken, jwtSecret, { ignoreExpiration: true }) as any;
        sessionId = decoded.sessionId;
      }
    } catch (e) {
      // Ignore jwt decode errors on logout
    }

    if (sessionId) {
      const supabase = createAdminClient();
      await supabase
        .from('login_sessions')
        .update({ 
          is_active: false,
          logout_timestamp: new Date().toISOString()
        })
        .eq('id', sessionId);
    }

    cookieStore.delete('refresh_token');
    cookieStore.delete('access_token');

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Logout error:', error);
    // Still clear cookies on error
    const cookieStore = await cookies();
    cookieStore.delete('refresh_token');
    cookieStore.delete('access_token');
    return NextResponse.json({ success: true });
  }
}
