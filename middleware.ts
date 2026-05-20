import { NextResponse, type NextRequest } from "next/server";
import { jwtVerify } from 'jose';

export async function middleware(request: NextRequest) {
  // We no longer forcefully redirect here to let AuthOverlay handle logic,
  // or we could specifically allow /crewgrid/home and redirect others. 
  // Let's just return NextResponse.next() since AuthOverlay handles route blocking.
  
  return NextResponse.next();
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};