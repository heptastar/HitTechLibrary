import { getRequestContext } from '@cloudflare/next-on-pages';
import { jwtVerify } from 'jose'; // Import jwtVerify
import { cookies } from 'next/headers'; // Import cookies

export const runtime = 'edge';

interface DeleteUserRequestBody {
  id?: number;
  email?: string;
}

// Define the expected type for the JWT payload
interface JwtPayload {
  id: number;
  email: string;
  userrank: number;
  is_active: boolean;
  name?: string;
}

export async function DELETE(request: Request) {
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
    // Only allow users with userrank 3 (admin) to delete users
    if (payload.userrank !== 3) {
         return new Response(JSON.stringify({ error: 'Forbidden: You do not have permission to delete users' }), {
            status: 403, // Forbidden
            headers: { 'Content-Type': 'application/json' },
        });
    }
    // --- End Authorization Check ---


    const db = env.DB;

    const { id, email } = await request.json() as DeleteUserRequestBody;

    if (!id && !email) {
      return new Response(JSON.stringify({ error: 'Either user ID or email is required for deletion' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    let result;
    if (id) {
      result = await db.prepare('DELETE FROM users WHERE id = ?').bind(id).run();
    } else { // email
      result = await db.prepare('DELETE FROM users WHERE email = ?').bind(email).run();
    }


    if (result.success) {
       if (result.meta.changes === 0) {
         return new Response(JSON.stringify({ message: 'User not found or already deleted' }), {
           status: 404, // Not Found if no rows were affected
           headers: { 'Content-Type': 'application/json' },
         });
       }
      return new Response(JSON.stringify({ message: 'User deleted successfully', changes: result.meta.changes }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    } else {
      console.error('Database deletion failed:', result.error);
      return new Response(JSON.stringify({ error: 'Failed to delete user', details: result.error }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }

  } catch (error: any) {
    console.error('Delete user API error:', error);
    return new Response(JSON.stringify({ error: 'An unexpected error occurred', details: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}