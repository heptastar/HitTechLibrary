import { getRequestContext } from '@cloudflare/next-on-pages';
import { jwtVerify } from 'jose'; // Import jwtVerify
import { cookies } from 'next/headers'; // Import cookies

export const runtime = 'edge';

// Define the expected type for the request body
interface UpdateUserRequestBody {
  id?: number;
  email?: string;
  name?: string;
  userrank?: number;
  is_active?: boolean;
  password?: string; // Note: Handle password updates carefully, likely requiring old password verification
}

// Define the expected type for the JWT payload
interface JwtPayload {
  id: number;
  email: string;
  userrank: number;
  is_active: boolean;
  name?: string;
}

export async function PUT(request: Request) {
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

    const { id, email, ...updateFields } = await request.json() as UpdateUserRequestBody;

    if (!id && !email) {
      return new Response(JSON.stringify({ error: 'Either user ID or email is required for update' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // --- Authorization Check ---
    const isAdmin = payload.userrank === 3;
    const isUpdatingOwnInfo = (id && id === payload.id) || (email && email === payload.email);

    if (!isAdmin && !isUpdatingOwnInfo) {
         return new Response(JSON.stringify({ error: 'Forbidden: You can only update your own information' }), {
            status: 403, // Forbidden
            headers: { 'Content-Type': 'application/json' },
        });
    }

    // Prevent non-admins from changing userrank or is_active
    if (!isAdmin) {
        if (updateFields.userrank !== undefined || updateFields.is_active !== undefined) {
             return new Response(JSON.stringify({ error: 'Forbidden: You do not have permission to change user rank or active status' }), {
                status: 403, // Forbidden
                headers: { 'Content-Type': 'application/json' },
            });
        }
    }
    // --- End Authorization Check ---


    // Build the update query dynamically based on provided fields
    const fieldsToUpdate = Object.keys(updateFields).filter(key => updateFields[key as keyof typeof updateFields] !== undefined);

    if (fieldsToUpdate.length === 0) {
      return new Response(JSON.stringify({ message: 'No fields provided for update' }), { // Changed from error to message
        status: 200, // Changed from 400 to 200 as it's not an error, just nothing to update
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Change const to let here
    let setClauses = fieldsToUpdate.map(field => `${field} = ?`).join(', ');
    const bindValues = fieldsToUpdate.map(field => updateFields[field as keyof typeof updateFields]);

    // Add updated_at timestamp
    setClauses += ', updated_at = CURRENT_TIMESTAMP';

    let query;
    let finalBindValues;

    if (id) {
      query = `UPDATE users SET ${setClauses} WHERE id = ?`;
      finalBindValues = [...bindValues, id];
    } else { // email
      query = `UPDATE users SET ${setClauses} WHERE email = ?`;
      finalBindValues = [...bindValues, email];
    }

    const result = await db.prepare(query).bind(...finalBindValues).run();

    if (result.success) {
       if (result.meta.changes === 0) {
         return new Response(JSON.stringify({ message: 'User not found or no changes made' }), {
           status: 404, // Not Found if no rows were affected
           headers: { 'Content-Type': 'application/json' },
         });
       }
      return new Response(JSON.stringify({ message: 'User updated successfully', changes: result.meta.changes }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    } else {
      console.error('Database update failed:', result.error);
      return new Response(JSON.stringify({ error: 'Failed to update user', details: result.error }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }

  } catch (error: any) {
    console.error('Update user API error:', error);
    return new Response(JSON.stringify({ error: 'An unexpected error occurred', details: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}