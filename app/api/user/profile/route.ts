import { NextResponse } from 'next/server';
import { createAdminClient } from '@/utils/supabase/admin';
import { createClient } from '@/utils/supabase/server';

export async function POST(request: Request) {
  try {
    const supabaseSession = await createClient();
    const { data: { user }, error: authError } = await (await supabaseSession).auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Nicht authentifiziert' }, { status: 401 });
    }

    const body = await request.json();
    const { userId, first_name, last_name, initials, phone, mobile, employee_id } = body;

    if (!userId) {
      return NextResponse.json({ error: 'Missing userId' }, { status: 400 });
    }

    // Verify that the user is updating their own profile
    const supabaseAdmin = createAdminClient();
    const { data: dbUser, error: checkError } = await supabaseAdmin
      .from('users')
      .select('auth_user_id')
      .eq('id', userId)
      .single();

    if (checkError || !dbUser) {
      return NextResponse.json({ error: 'Benutzer nicht gefunden' }, { status: 404 });
    }

    if (dbUser.auth_user_id !== user.id) {
      return NextResponse.json({ error: 'Unzureichende Berechtigungen' }, { status: 403 });
    }

    // Perform the update using admin client to bypass RLS "Admins only" restriction
    const { error: updateError } = await supabaseAdmin
      .from('users')
      .update({
        first_name,
        last_name,
        initials,
        phone,
        mobile,
        employee_id: employee_id === "null" || employee_id === "" ? null : employee_id
      })
      .eq('id', userId);

    if (updateError) {
      return NextResponse.json({ error: updateError.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Serverfehler' }, { status: 500 });
  }
}
