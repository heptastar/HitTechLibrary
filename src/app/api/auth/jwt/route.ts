import { getRequestContext } from '@cloudflare/next-on-pages';
import { jwtVerify } from 'jose'; // Import jwtVerify from jose
import { cookies } from 'next/headers'; // Import cookies

// Define the runtime environment for Cloudflare Pages Functions
export const runtime = 'edge';

// Define the expected type for the JWT payload
interface JwtPayload {
  id: number;
  email: string;
  userrank: number;
  is_active: boolean;
  name?: string; // Assuming name is included in the payload
  // Add other properties if they exist in your JWT payload
}

export async function GET(request: Request) {
  try {
    // Access the cookie store
    const cookieStore = cookies();
    const authToken = (await cookieStore).get('auth_token');

    // Check if the auth_token cookie exists
    if (!authToken) {
      return new Response(JSON.stringify({ error: 'Authentication token not found' }), {
        status: 401, // Unauthorized
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Access the environment variables using getRequestContext
    const { env } = getRequestContext();
    const jwtSecret = process.env.JWT_SECRET; // Use your actual secret key binding name

    if (!jwtSecret) {
        console.error('JWT_SECRET environment variable not set.');
         return new Response(JSON.stringify({ error: 'Server configuration error' }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' },
        });
    }

    const secret = new TextEncoder().encode(jwtSecret);

    try {
      // Verify and decode the JWT
      const { payload } = await jwtVerify(authToken.value, secret) as { payload: JwtPayload };

      // Return the user's name and userrank
      return new Response(JSON.stringify({
        id: payload.id,
        name: payload.name,
        userrank: payload.userrank,
        email: payload.email // Optionally include email
      }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });

    } catch (verificationError: any) {
      console.error('JWT verification failed:', verificationError);
      // If JWT verification fails (e.g., expired, invalid signature)
      return new Response(JSON.stringify({ error: 'Invalid or expired token' }), {
        status: 401, // Unauthorized
        headers: { 'Content-Type': 'application/json' },
      });
    }

  } catch (error: any) {
    // Handle other potential errors
    console.error('Auth JWT API error:', error);

    return new Response(JSON.stringify({ error: 'An unexpected error occurred', details: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}