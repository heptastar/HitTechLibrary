import { NextRequest, NextResponse } from 'next/server';
import { jwtVerify } from 'jose'; // Import jwtVerify from jose
import { getRequestContext } from '@cloudflare/next-on-pages';
import { cookies } from 'next/headers'; // Import cookies

// Define the expected type for the request body
interface CreateBookRequestBody {
    title: string;
    description?: string;
    author: string;
    isbn?: string;
    publication_year?: number;
    genre?: string;
    is_available?: boolean;
    stock?: number; // Added stock field
}

// Define the runtime environment for Cloudflare Pages Functions
export const runtime = 'edge';

// TODO: Get JWT signing key from environment variables/secrets
// Ensure your JWT_SECRET is a strong, random string and kept secret.
// It should be at least 32 bytes for HS256.
const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-key-change-this'; // REPLACE with your actual secret key binding name

export async function POST(req: NextRequest) {
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
        const userrank = payload.userrank as number; // Assuming userrank is in the payload

        // Example: Restrict book creation to users with userrank >= 2
        if (userrank < 2) {
            return NextResponse.json({ error: 'Forbidden: Insufficient rank to create books' }, { status: 403 });
        }

        const body = await req.json() as CreateBookRequestBody;
        const { title, description, author, isbn, publication_year, genre, is_available, stock } = body; // Extracted stock

        // Basic validation (add more robust validation as needed)
        if (!title || !author) {
            return NextResponse.json({ error: 'Title and Author are required' }, { status: 400 });
        }

        // Access the D1 database binding
        const { env } = getRequestContext();
        const db = env.DB; // 'DB' is the binding name from wrangler.jsonc

        // Insert book into the database
        const result = await db.prepare(
            `INSERT INTO books (title, description, author, isbn, publication_year, genre, is_available, stock)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?)` // Added stock column
        ).bind(title, description, author, isbn, publication_year, genre, is_available ?? true, stock ?? 0) // Added stock value with default 0
        .run(); // Use .run() for INSERT statements in D1

        // D1 .run() returns { success: boolean, meta: object }
        if (!result.success) {
             console.error('Database insert failed:', result);
             return NextResponse.json({ error: 'Failed to create book in database' }, { status: 500 });
        }

        return NextResponse.json({ message: 'Book created successfully' }, { status: 201 });

    } catch (error) {
        console.error('Error creating book:', error);
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