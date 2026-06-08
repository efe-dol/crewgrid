import { notFound } from 'next/navigation';
import { cookies } from 'next/headers';
import jwt from 'jsonwebtoken';
import { createAdminClient } from '@/utils/supabase/admin';
import EditContactPageClient from './EditContactPageClient';

export default async function Page({ params }: { params: { id: string } }) {
  const contactId = params.id;

  const cookieStore = await cookies();
  const accessTokenCookie = cookieStore.get('access_token');

  if (!accessTokenCookie?.value) {
    return notFound();
  }

  let decodedToken: any;
  try {
    decodedToken = jwt.verify(
        accessTokenCookie.value,
        process.env.JWT_SECRET!
    );
  } catch {
    return notFound();
  }

  const userId = decodedToken.sub;

  const supabase = createAdminClient();

  const { data: userRecord, error: userError } = await supabase
      .from('users')
      .select('role_id, contact_id, roles(name)')
      .eq('auth_user_id', userId)
      .single();

  if (!userRecord || userError) {
    return notFound();
  }

  const userRoleName =
      (userRecord as any).roles?.name || decodedToken.role;

  let canEdit = false;

  if (
      userRoleName === 'Administrator' ||
      userRoleName === 'Manager'
  ) {
    canEdit = true;
  } else if (userRecord.contact_id === contactId) {
    canEdit = true;
  }

  if (!canEdit) {
    return notFound();
  }

  const { data: contact, error: contactError } = await supabase
      .from('contacts')
      .select('*')
      .eq('id', contactId)
      .single();

  if (!contact || contactError) {
    return notFound();
  }

  return (
      <EditContactPageClient
          initialData={contact}
          contactId={contactId}
          userId={userId}
          userRole={userRoleName}
      />
  );
}