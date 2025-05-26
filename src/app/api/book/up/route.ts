import { NextRequest, NextResponse } from 'next/server';
import { jwtVerify } from 'jose';
import { getRequestContext } from '@cloudflare/next-on-pages';
import { cookies } from 'next/headers'; // Import cookies

// Define the runtime environment for Cloudflare Pages Functions
export const runtime = 'edge';

// Define the expected type for the request body
interface UpdateBookRequestBody {
    id: number; // Assuming id is a number based on SQL schema
    title?: string;
    description?: string;
    author?: string;
    isbn?: string;
    publication_year?: number;
    genre?: string;
    is_available?: boolean;
    stock?: number; // Added stock field
    // Add other updateable fields here
    [key: string]: any; // Add index signature to allow string indexing
}

// TODO: Get JWT signing key from environment variables/secrets
// Ensure your JWT_SECRET is a strong, random string and kept secret.
// It should be at least 32 bytes for HS256.
const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-key-change-this'; // REPLACE with your actual secret key binding name

// Postman Example:
/*
PUT /api/book/up
Headers:
  Cookie: auth_token={{your_auth_token}}
Body (raw, JSON):
{
  "id": 1, // The ID of the book to update
  "title": "Updated Title",
  "author": "New Author",
  "is_available": false
  // Include any other fields you want to update
}
*/
export async function PUT(req: NextRequest) {
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

        // Example: Restrict book updates to users with userrank >= 3 (e.g., admins)
        // if ((payload.userrank as number) < 3) {
        //     return NextResponse.json({ error: 'Forbidden: Insufficient rank to update books' }, { status: 403 });
        // }

        // Cast the request body to the defined interface
        const { id, ...updates } = await req.json() as UpdateBookRequestBody;

        if (!id) {
            return NextResponse.json({ error: 'Book ID is required for update' }, { status: 400 });
        }

        // Build the update query dynamically based on provided fields
        const fieldsToUpdate = Object.keys(updates).filter(key => {
            // Filter out any fields that are not in the schema or should not be updated this way
            const validFields = ['title', 'description', 'author', 'isbn', 'publication_year', 'genre', 'is_available', 'stock']; // Added 'stock'
            return validFields.includes(key);
        });

        if (fieldsToUpdate.length === 0) {
            return NextResponse.json({ error: 'No valid fields provided for update' }, { status: 400 });
        }

        const setClauses = fieldsToUpdate.map(field => `${field} = ?`).join(', ');
        const values = fieldsToUpdate.map(field => updates[field]); // This line is now valid due to index signature

        // Add updated_at timestamp
        const updateQuery = `UPDATE books SET ${setClauses}, updated_at = CURRENT_TIMESTAMP WHERE id = ?`;
        values.push(id);

        // Access the D1 database binding
        const { env } = getRequestContext();
        const db = env.DB; // 'DB' is the binding name from wrangler.jsonc

        // Prepare and execute the update statement
        const updateResult = await db.prepare(updateQuery).bind(...values).run();

        // Check if the update was successful (at least one row affected)
        if (updateResult.meta.changes === 0) { // Access changes from meta
             // Could mean book not found
             const bookExists = await db.prepare('SELECT id FROM books WHERE id = ?').bind(id).first();
             if (!bookExists) {
                 return NextResponse.json({ error: 'Book not found' }, { status: 404 });
             } else {
                 // This case is unlikely if the book existed but changes was 0, but included for robustness
                 return NextResponse.json({ message: 'Book update attempted, but no changes were reported' }, { status: 200 });
             }
        }

        return NextResponse.json({ message: 'Book updated successfully' }, { status: 200 });

    } catch (error) {
        console.error('Error updating book:', error);
        if (error instanceof Error) {
             // Handle JWT verification errors specifically
            if (error.name === 'JWSInvalid' || error.name === 'JWSSignatureVerificationFailed' || error.name === 'JWTExpired') {
                 return NextResponse.json({ error: 'Invalid or expired token' }, { status: 401 });
            } else if (error.message.includes('unrecognized token')) {
                 // Handle potential SQL errors from invalid fields
                 return NextResponse.json({ error: 'Invalid field in update request' }, { status: 400 });
            }
            return NextResponse.json({ error: 'An unexpected error occurred', details: error.message }, { status: 500 });
        }
         return NextResponse.json({ error: 'An unexpected error occurred' }, { status: 500 });
    }
}