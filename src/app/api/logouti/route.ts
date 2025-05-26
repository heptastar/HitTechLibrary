import { NextResponse } from 'next/server';
export const runtime = 'edge';

export async function POST() {
  const response = NextResponse.json({ message: 'Logged out successfully' });

  // Set the cookie to expire in the past to remove it
  response.cookies.set('auth_token', '', { expires: new Date(0), path: '/' });

  return response;
}