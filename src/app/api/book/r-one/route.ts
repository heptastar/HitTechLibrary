import { NextRequest, NextResponse } from 'next/server';
// Removed: import { jwtVerify } from 'jose';
import { getRequestContext } from '@cloudflare/next-on-pages';

// Define the runtime environment for Cloudflare Pages Functions
export const runtime = 'edge';

// Removed: JWT_SECRET constant
// const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-key-change-this';

export async function GET(req: NextRequest) {
    // Removed: JWT extraction and verification logic
    // const authHeader = req.headers.get('Authorization');
    // const token = authHeader?.split(' ')[1];

    // if (!token) {
    //     return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    // }

    try {
        // Removed: JWT verification using jose
        // const secret = new TextEncoder().encode(JWT_SECRET);
        // const { payload } = await jwtVerify(token, secret);

        // Removed: Optional access to user info from payload
        // const userId = payload.id;
        // const userrank = payload.userrank as number;

        // Removed: Example restriction based on user rank
        // if (userrank < 1) {
        //     return NextResponse.json({ error: 'Forbidden: Insufficient rank to view books' }, { status: 403 });
        // }

        const { searchParams } = new URL(req.url);
        const bookId = searchParams.get('id');

        if (!bookId) {
            return NextResponse.json({ error: 'Book ID is required' }, { status: 400 });
        }

        // Access the D1 database binding
        const { env } = getRequestContext();
        const db = env.DB; // 'DB' is the binding name from wrangler.jsonc

        // Retrieve book from the database by ID
        const book = await db.prepare(
            'SELECT * FROM books WHERE id = ?'
        ).bind(bookId).first(); // Use .first() to get a single row

        if (!book) {
            return NextResponse.json({ error: 'Book not found' }, { status: 404 });
        }

        return NextResponse.json(book, { status: 200 });

    } catch (error) {
        console.error('Error retrieving book:', error);
        if (error instanceof Error) {
             // Removed: Handle JWT verification errors specifically
            // if (error.name === 'JWSInvalid' || error.name === 'JWSSignatureVerificationFailed' || error.name === 'JWTExpired') {
            //      return NextResponse.json({ error: 'Invalid or expired token' }, { status: 401 });
            // }
            return NextResponse.json({ error: 'An unexpected error occurred', details: error.message }, { status: 500 });
        }
         return NextResponse.json({ error: 'An unexpected error occurred' }, { status: 500 });
    }
}