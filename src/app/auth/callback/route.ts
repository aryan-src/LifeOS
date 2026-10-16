import { type NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const { origin } = new URL(request.url);
  const forwardedHost = request.headers.get('x-forwarded-host');
  const forwardedProto = request.headers.get('x-forwarded-proto') ?? 'https';
  const baseOrigin = forwardedHost
    ? `${forwardedProto}://${forwardedHost}`
    : origin;

  return NextResponse.redirect(`${baseOrigin}/`);
}
