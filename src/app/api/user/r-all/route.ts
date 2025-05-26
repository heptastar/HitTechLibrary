import { getRequestContext } from '@cloudflare/next-on-pages';
import { jwtVerify } from 'jose'; // Import jwtVerify
import { cookies } from 'next/headers'; // Import cookies

export const runtime = 'edge';

// Define the expected type for the JWT payload
interface JwtPayload {
  id: number;
  email: string;
  userrank: number;
  is_active: boolean;
  name?: string;
}

export async function GET() {
  try {
    // --- Authentication Check ---
    const cookieStore = cookies();
    const authToken = (await cookieStore).get('auth_token');

    if (!authToken) {
      return new Response(JSON.stringify({ error: 'Authentication token not found' }), {
        status: 401, // Unauthorized
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const { env } = getRequestContext();
    const jwtSecret = process.env.JWT_SECRET;

    if (!jwtSecret) {
        console.error('JWT_SECRET environment variable not set.');
         return new Response(JSON.stringify({ error: 'Server configuration error' }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' },
        });
    }

    const secret = new TextEncoder().encode(jwtSecret);
    let payload: JwtPayload;

    try {
      const verificationResult = await jwtVerify(authToken.value, secret) as { payload: JwtPayload };
      payload = verificationResult.payload;
    } catch (verificationError: any) {
      console.error('JWT verification failed:', verificationError);
      return new Response(JSON.stringify({ error: 'Invalid or expired token' }), {
        status: 401, // Unauthorized
        headers: { 'Content-Type': 'application/json' },
      });
    }
    // --- End Authentication Check ---

    // --- Authorization Check ---
    // Only allow users with userrank 3 (admin) to retrieve all users
    if (payload.userrank !== 3) {
         return new Response(JSON.stringify({ error: 'Forbidden: You do not have permission to access this resource' }), {
            status: 403, // Forbidden
            headers: { 'Content-Type': 'application/json' },
        });
    }
    // --- End Authorization Check ---


    const db = env.DB;

    const { results } = await db.prepare('SELECT id, email, name, userrank, is_active, created_at, updated_at FROM users').all();

    return new Response(JSON.stringify(results), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });

  } catch (error: any) {
    console.error('Retrieve all users API error:', error);
    return new Response(JSON.stringify({ error: 'An unexpected error occurred', details: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}