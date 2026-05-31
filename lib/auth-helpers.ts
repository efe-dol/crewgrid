import { createServerClient } from '@supabase/ssr';
import { createAdminClient } from '@/utils/supabase/admin';
import jwt from 'jsonwebtoken';
import { cookies } from 'next/headers';

export interface AuthResult {
  isAuthenticated: boolean;
  hasActiveSession: boolean;
  user?: any;
  role?: string;
  error?: string;
}

/**
 * Verify authentication state including:
 * - JWT token validity
 * - Active session in login_sessions table
 * - User role information
 */
export async function verifyAuthentication(): Promise<AuthResult> {
  const cookieStore = await cookies();
  
  // Get access token from HTTP-only cookie
  const accessTokenCookie = cookieStore.get('access_token');
  if (!accessTokenCookie?.value) {
    return { isAuthenticated: false, hasActiveSession: false };
  }

  // Verify JWT signature and extract claims
  let decodedToken: any;
  try {
    decodedToken = jwt.verify(accessTokenCookie.value, process.env.JWT_SECRET!);
  } catch (err) {
    return { 
      isAuthenticated: false, 
      hasActiveSession: false,
      error: 'Ungültiger oder abgelaufener Token' 
    }; 
  }

  // Verify token claims match current user (use admin client for full access)
  const supabaseAdmin = createAdminClient();

  const { data: authData, error: authError } = await supabaseAdmin.auth.getUser()
  if (authError || !authData.user || authData.user.id !== decodedToken.sub) {
    return { isAuthenticated: false, hasActiveSession: false, error: 'Token-Benutzer-Abweichung' };
  }

  // Check for active session in login_sessions table
  const adminSupabase = createAdminClient();
  const { data: activeSession } = await adminSupabase
    .from('login_sessions')
    .select('id, is_active, users!users(role_id)')
    .eq('user_id', authData.user.id)
    .eq('is_active', true)
    .single();

  if (!activeSession) {
    return { 
      isAuthenticated: true, 
      hasActiveSession: false, 
      error: 'Keine aktive Lizenssession gefunden' 
    };
  }

  // Get user details with role
  const { data: userData } = await adminSupabase
    .from('users')
    .select('*, roles(name)')
    .eq('auth_user_id', authData.user.id)
    .single();

  return {
    isAuthenticated: true,
    hasActiveSession: true,
    user: userData,
    role: (userData as any)?.roles?.name || decodedToken.role
  };
}

/**
 * Create a role check function for middleware
 */
export function requiresRole(requiredRoles: string[]): (result: AuthResult) => boolean {
  return (result): boolean => {
    if (!result.hasActiveSession) return false;
    if (!result.role) return false;
    return requiredRoles.includes(result.role);
  };
}

/**
 * Route protection configuration
 */
export interface RouteRule {
  pattern: RegExp;
  requiredRoles?: string[]; // If specified, only these roles can access
  allowedStates?: ('not-authenticated' | 'authenticated-no-session' | 'full-session')[];
}

/**
 * Default route protection rules
 */
export const DEFAULT_ROUTE_RULES: RouteRule[] = [
  // Public routes - accessible by anyone (everything not starting with /crewgrid)
  { pattern: /^\/((?!crewgrid).)*/, allowedStates: ['not-authenticated', 'authenticated-no-session', 'full-session'] },
  
  // Admin-only routes
  { pattern: /^\/crewgrid\/(admin|administration)/, requiredRoles: ['Administrator'], allowedStates: ['full-session'] },
  
  // Manager and Administrator routes (reports, analytics)  
  { pattern: /^\/crewgrid\/(reports|analytics|statistics)/, requiredRoles: ['Manager', 'Administrator'], allowedStates: ['full-session'] },
  
  // Settings routes - require full session
  { pattern: /^\/crewgrid\/settings/, requiredRoles: ['Administrator', 'Manager', 'Mitarbeiter'], allowedStates: ['full-session'] },
];
