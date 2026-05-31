import { NextResponse } from 'next/server';
import { createAdminClient } from '@/utils/supabase/admin';
import { createClient } from '@/utils/supabase/server';

export async function GET() {
  try {
    const supabaseSession = await createClient();
    const { data: { user }, error: authError } = await (await supabaseSession).auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Nicht authentifiziert' }, { status: 401 });
    }

    const supabase = createAdminClient();
    
    // Fetch all licenses
    const { data: licenses, error } = await supabase
      .from('licenses')
      .select('*');

    if (error) {
      throw error;
    }

    // Get current active sessions
    const { data: activeSessions, error: sessionError } = await supabase
      .from('login_sessions')
      .select('license_id, users(role_id, roles(name))')
      .eq('is_active', true);

    if (sessionError) {
      throw sessionError;
    }

    // Process available slots
    const availableLicenses = licenses.map((license) => {
      // Calculate current users for this license
      const sessionsForLicense = activeSessions.filter(s => s.license_id === license.id);
      const activeUserCount = sessionsForLicense.length;
      
      const roleBreakdown: Record<string, number> = {};
      sessionsForLicense.forEach((session: any) => {
        const roleName = session.users?.roles?.name;
        if (roleName) {
          roleBreakdown[roleName] = (roleBreakdown[roleName] || 0) + 1;
        }
      });

      return {
        ...license,
        active_users: activeUserCount,
        role_breakdown: roleBreakdown
      };
    });

    return NextResponse.json(availableLicenses);
  } catch (error) {
    console.error('Error fetching licenses:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
