import { notFound } from 'next/navigation';
import { cookies } from 'next/headers';
import jwt from 'jsonwebtoken';
import { createAdminClient } from '@/utils/supabase/admin';
import EditContactPageClient from './EditContactPageClient';

export default async function Page({ params }: { params: { id: string } }) {
  const contactId = params.id;
  
  // Get access token from HTTP-only cookie
  const cookieStore = await cookies();
  const accessTokenCookie = cookieStore.get('access_token');
  
  if (!accessTokenCookie?.value) {
    return notFound(); // Middleware should redirect, but fail-safe
  }
  
  // Verify JWT token and extract claims
  let decodedToken: any;
  try {
    decodedToken = jwt.verify(accessTokenCookie.value!, process.env.JWT_SECRET!);
  } catch (err) {
    return notFound();
  }

  const userId = decodedToken.sub;
  
  // Use admin client to check authorization and fetch data
  const supabase = createAdminClient();
  
  // Get user record with role information
  const { data: userRecord, error: userError } = await supabase
    .from('users')
    .select('role_id, contact_id, roles(name)')
    .eq('auth_user_id', userId)
    .single();
    
  if (!userRecord || userError) {
    return notFound();
  }

  const userRoleName = (userRecord as any).roles?.name || decodedToken.role;
  
  // Authorization Check: Can this user edit this contact?
  let canEdit = false;
  
  if (userRoleName === 'Administrator') {
    canEdit = true; // Admins can edit all contacts
  } else if (userRoleName === 'Manager') {
    canEdit = true; // Managers can edit all contacts
  } else if (userRecord.contact_id === contactId) {
    // Regular users can only edit their own linked contact record
    canEdit = true;
  }

  if (!canEdit) {
    return notFound(); // Or show "Access Denied" message instead
  }

  // Fetch contact data from database
  const { data: contact, error: contactError } = await supabase
    .from('contacts')
    .select('*')
    .eq('id', contactId)
    .single();

  if (!contact || contactError) {
    return notFound();
  }

  // Pass all data to client component via props
  return (
    <EditContactPageClient 
      initialData={contact}
      contactId={contactId}
      userId={userId}
      userRole={userRoleName}
    />
  );
}