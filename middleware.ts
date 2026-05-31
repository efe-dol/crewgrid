import { type NextRequest, NextResponse } from "next/server";
import { updateSession } from "@/utils/supabase/middleware";
import { createAdminClient } from '@/utils/supabase/admin';
import jwt from 'jsonwebtoken';

// ============================================================================
// Route Protection Configuration
// ============================================================================

interface RouteRule {
  pattern: RegExp;
  requiredRoles?: string[]; // If specified, only these roles can access
  allowedStates?: ('not-authenticated' | 'authenticated-no-session' | 'full-session')[];
}

const ROUTE_RULES: RouteRule[] = [
  // Public routes - accessible by anyone (everything not starting with /crewgrid)
  { pattern: /^\/((?!crewgrid).)*/, allowedStates: ['not-authenticated', 'authenticated-no-session', 'full-session'] },
  
  // Admin-only routes
  { pattern: /^\/crewgrid\/(admin|administration)/, requiredRoles: ['Administrator'], allowedStates: ['full-session'] },
  
  // Manager and Administrator routes (reports, analytics)  
  { pattern: /^\/crewgrid\/(reports|analytics|statistics)/, requiredRoles: ['Manager', 'Administrator'], allowedStates: ['full-session'] },
  
  // Settings routes - require full session
  { pattern: /^\/crewgrid\/settings/, requiredRoles: ['Administrator', 'Manager', 'Mitarbeiter'], allowedStates: ['full-session'] },
];

// ============================================================================
// Middleware Logic
// ============================================================================

export async function middleware(request: NextRequest) {
  const { nextUrl } = request;
  
  // Refresh Supabase session (handles token refresh)
  await updateSession(request);

  // Find matching route rule
  let matchedRule: RouteRule | undefined;
  for (const rule of ROUTE_RULES) {
    if (rule.pattern.test(nextUrl.pathname)) {
      matchedRule = rule;
      break;
    }
  }

  // If no specific rule matches, apply default crewgrid protection
  if (!matchedRule && nextUrl.pathname.startsWith('/crewgrid')) {
    matchedRule = { pattern: /^\/crewgrid.*/, allowedStates: ['full-session'] };
  }

  // Skip protection for matching public routes
  if (!matchedRule) {
    return NextResponse.next();
  }

  // Extract access token from cookies
  const accessTokenCookie = request.cookies.get('access_token');

  // State 1: Not authenticated at all (no access token)
  if (!accessTokenCookie?.value) {
    if (matchedRule.allowedStates?.includes('not-authenticated')) {
      return NextResponse.next();
    }
    return NextResponse.redirect(new URL('/', request.url));
  }

  // Verify JWT token signature and claims
  let decodedToken: any;
  try {
    decodedToken = jwt.verify(accessTokenCookie.value, process.env.JWT_SECRET!);
  } catch {
    // Token invalid/expired - redirect to login
    return NextResponse.redirect(new URL('/', request.url));
  }

  // Verify token subject matches Supabase user (use admin client for full access)
  const supabaseAdmin = createAdminClient();

  const { data: authData, error: authError } = await supabaseAdmin.auth.getUser()
  if (authError || !authData.user || authData.user.id !== decodedToken.sub) {
    return NextResponse.redirect(new URL('/', request.url));
  }

  // Check for active session in login_sessions table using service role
  const adminSupabase = createAdminClient();

  const { data: activeSession } = await adminSupabase
    .from('login_sessions')
    .select('is_active')
    .eq('user_id', authData.user.id)
    .eq('is_active', true)
    .single();

  // State 2: Authenticated but no active session (licensed) 
  if (!activeSession) {
    if (matchedRule.allowedStates?.includes('authenticated-no-session')) {
      return NextResponse.next();
    }
    // Redirect to home - AuthOverlay will show license selection
    const redirectUrl = new URL('/', request.url);
    redirectUrl.searchParams.set('returnUrl', nextUrl.pathname);
    return NextResponse.redirect(redirectUrl);
  }

  // State 3: Full session active - check role requirements
  if (matchedRule.requiredRoles) {
    const { data: userData } = await adminSupabase
      .from('users')
      .select('roles(name)')
      .eq('auth_user_id', authData.user.id)
      .single();
    
    const userRole = (userData as any)?.roles?.name;
    if (!userRole || !matchedRule.requiredRoles.includes(userRole)) {
      // Unauthorized - insufficient privileges
      return NextResponse.redirect(new URL('/crewgrid', request.url));
    }
  }

  // All checks passed - allow access
  return NextResponse.next();
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
