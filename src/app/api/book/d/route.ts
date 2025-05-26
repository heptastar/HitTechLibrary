// Postman Example:
/*
DELETE /api/book/d?id={{book_id}}
Headers:
  Cookie: auth_token={{your_auth_token}}
*/
import { NextRequest, NextResponse } from 'next/server';
import { jwtVerify } from 'jose';
import { getRequestContext } from '@cloudflare/next-on-pages';
import { cookies } from 'next/headers'; // Import cookies

// Define the runtime environment for Cloudflare Pages Functions
export const runtime = 'edge';

// TODO: Get JWT signing key from environment variables/secrets
// Ensure your JWT_SECRET is a strong, random string and kept secret.
// It should be at least 32 bytes for HS256.
const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-key-change-this'; // REPLACE with your actual secret key binding name

export async function DELETE(req: NextRequest) {
    // Access the cookie store
    const cookieStore = cookies();
    const authToken = (await cookieStore).get('auth_token');

    if (!authToken) {
        return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    try {
        // Verify JWT token using jose
        const secret = new TextEncoder().encode(JWT_SECRET);
        const { payload } = await jwtVerify(authToken.value, secret);

        // Optional: Access user info from payload if needed for authorization
        // const userId = payload.id;
        // const userrank = payload.userrank as number; // Assuming userrank is in the payload

        // Example: Restrict book deletion to users with userrank >= 3 (e.g., admins)
        // if ((payload.userrank as number) < 3) {
        //     return NextResponse.json({ error: 'Forbidden: Insufficient rank to delete books' }, { status: 403 });
        // }

        const { searchParams } = new URL(req.url);
        const bookId = searchParams.get('id');

        if (!bookId) {
            return NextResponse.json({ error: 'Book ID is required for deletion' }, { status: 400 });
        }

        // Access the D1 database binding
        const { env } = getRequestContext();
        const db = env.DB; // 'DB' is the binding name from wrangler.jsonc

        // Prepare and execute the delete statement
        const deleteResult = await db.prepare(
            'DELETE FROM books WHERE id = ?'
        ).bind(bookId).run();

        // Check if the deletion was successful (at least one row affected)
        if (deleteResult.meta.changes === 0) { // Access changes from meta
             // Could mean book not found
             const bookExists = await db.prepare('SELECT id FROM books WHERE id = ?').bind(bookId).first();
             if (!bookExists) {
                 return NextResponse.json({ error: 'Book not found' }, { status: 404 });
             } else {
                 // This case is unlikely if the book existed but changes was 0, but included for robustness
                 return NextResponse.json({ message: 'Book deletion attempted, but no changes were reported' }, { status: 200 });
             }
        }

        return NextResponse.json({ message: 'Book deleted successfully' }, { status: 200 });

    } catch (error) {
        console.error('Error deleting book:', error);
        if (error instanceof Error) {
             // Handle JWT verification errors specifically
            if (error.name === 'JWSInvalid' || error.name === 'JWSSignatureVerificationFailed' || error.name === 'JWTExpired') {
                 return NextResponse.json({ error: 'Invalid or expired token' }, { status: 401 });
            }
            return NextResponse.json({ error: 'An unexpected error occurred', details: error.message }, { status: 500 });
        }
         return NextResponse.json({ error: 'An unexpected error occurred' }, { status: 500 });
    }
}