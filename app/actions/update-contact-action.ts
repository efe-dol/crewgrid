import { cookies } from 'next/headers';
import { createAdminClient } from '@/utils/supabase/admin';
import jwt from 'jsonwebtoken';
import { revalidatePath } from 'next/cache';

interface UpdateContactActionParams {
  contactId: string;
  userId: string;
  role: string;
  updatedData: {
    entity_type?: string;
    contact_type?: string[];
    salutation?: string;
    title?: string;
    first_name?: string;
    last_name?: string;
    company?: string;
    department?: string;
    position?: string;
    birthday?: string;
    nickname?: string;
    greeting?: string;
    current_class?: string;
    notes?: string;
    primary_language?: string;
    addresses?: any[];
    communication?: any[];
    search_index?: string[];
    updated_at: string;
  };
}

export async function updateContactAction(params: UpdateContactActionParams) {
  try {
    const { contactId, userId, role, updatedData } = params;
    
    // Verify JWT token from cookie
    const cookieStore = await cookies();
    const accessTokenCookie = cookieStore.get('access_token');
    
    if (!accessTokenCookie?.value) {
      return { success: false, error: 'Keine gültige Sitzung gefunden.' };
    }
    
    // Decode and validate token
    let decodedToken: any;
    try {
      decodedToken = jwt.verify(accessTokenCookie.value!, process.env.JWT_SECRET!);
    } catch (err) {
      return { success: false, error: 'Sitzungstoken abgelaufen oder ungültig.' };
    }
    
    // Verify token subject matches provided userId
    if (decodedToken.sub !== userId) {
      return { success: false, error: 'Token-Benutzer-Abweichung erkannt.' };
    }

    // Use admin client for authorization check and update
    const supabase = createAdminClient();
    
    // Get user record with role information
    const { data: userRecord, error: userError } = await supabase
      .from('users')
      .select('role_id, contact_id, roles(name)')
      .eq('auth_user_id', userId)
      .single();
    
    if (userError || !userRecord) {
      return { success: false, error: 'Benutzerkonto nicht gefunden.' };
    }

    // Verify user is active (cast to any for type inference)
    if (!(userRecord as any).is_active) {
      return { success: false, error: 'Ihr Konto ist deaktiviert. Kontaktieren Sie den Administrator.' };
    }

    const userRoleName = (userRecord as any).roles?.name || role;
    
    // Authorization Logic:
    // - Administrator: Can edit ANY contact
    // - Manager: Can edit all contacts (with potential department restrictions in future)
    // - Mitarbeiter/Viewer: Can only edit their own linked contact record
    let authorized = false;
    
    if (userRoleName === 'Administrator') {
      authorized = true;
    } else if (userRoleName === 'Manager') {
      authorized = true; // Managers can edit all contacts
    } else if (userRecord.contact_id === contactId) {
      // User is editing their own linked contact record
      authorized = true;
    }
    
    if (!authorized) {
      return { 
        success: false, 
        error: 'Keine Berechtigung: Sie können diesen Kontakt nicht bearbeiten.' 
      };
    }

    // Perform the update (authorization verified)
    const { data: updatedContact, error: updateError } = await supabase
      .from('contacts')
      .update(updatedData)
      .eq('id', contactId)
      .select('*')
      .single();
      
    if (updateError) {
      console.error('Update error:', updateError);
      return { success: false, error: 'Datenbankfehler beim Aktualisieren.' };
    }

    // Audit logging - record the modification
    await supabase.from('audit_logs').insert({
      user_id: (userRecord as any).id,
      action: 'UPDATE',
      entity_type: 'contacts',
      entity_id: contactId,
      details: {
        updated_fields: Object.keys(updatedData),
        new_data: updatedData
      }
    });

    // Revalidate the employees list page to show updated data
    revalidatePath('/crewgrid/employees');

    return { success: true, data: updatedContact };
  } catch (error) {
    console.error('Update contact action error:', error);
    return { success: false, error: 'Interne Server-Fehler beim Speichern.' };
  }
}
