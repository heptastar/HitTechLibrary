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

export async function GET(request: Request) {
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


    const db = env.DB;

    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('id');
    const userEmail = searchParams.get('email');

    if (!userId && !userEmail) {
      return new Response(JSON.stringify({ error: 'Either user ID or email is required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // --- Authorization Check ---
    const isAdmin = payload.userrank === 3;
    const isRequestingOwnInfo = (userId && parseInt(userId, 10) === payload.id) || (userEmail && userEmail === payload.email);

    if (!isAdmin && !isRequestingOwnInfo) {
         return new Response(JSON.stringify({ error: 'Forbidden: You can only retrieve your own information' }), {
            status: 403, // Forbidden
            headers: { 'Content-Type': 'application/json' },
        });
    }
    // --- End Authorization Check ---


    let user;
    if (userId) {
      user = await db.prepare('SELECT id, email, name, userrank, is_active, created_at, updated_at FROM users WHERE id = ?').bind(userId).first();
    } else if (userEmail) {
      user = await db.prepare('SELECT id, email, name, userrank, is_active, created_at, updated_at FROM users WHERE email = ?').bind(userEmail).first();
    }

    if (!user) {
      return new Response(JSON.stringify({ error: 'User not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify(user), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });

  } catch (error: any) {
    console.error('Retrieve user API error:', error);
    return new Response(JSON.stringify({ error: 'An unexpected error occurred', details: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}