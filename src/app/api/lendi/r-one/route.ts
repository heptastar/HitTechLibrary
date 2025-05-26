import { NextRequest, NextResponse } from 'next/server';
import { jwtVerify, JWTPayload } from 'jose';
import { getRequestContext } from '@cloudflare/next-on-pages';
import { cookies } from 'next/headers';

// Define the expected type for your JWT payload
interface AppJwtPayload extends JWTPayload {
    id: number;
    email: string;
    userrank: number;
    // Add other properties if they exist in your JWT payload
}

// Define the expected structure of the joined data
interface LendingWithBookData {
    lending_id: number;
    user_id: number;
    book_id: number;
    borrowed_date: string;
    due_date: string | null;
    returned_date: string | null;
    status: string;
    lending_created_at: string;
    lending_updated_at: string;
    book_title: string;
    book_author: string;
    book_isbn: string;
    book_publication_year: number; // Changed from book_published_year
    book_genre: string;
    book_stock: number; // Correctly included
    book_is_available: number; // Assuming 1 for true, 0 for false
    // Add other book fields you want to include
}

 
export const runtime = 'edge';

const JWT_SECRET = process.env.JWT_SECRET;

export async function GET(req: NextRequest) {
    if (!JWT_SECRET) {
        console.error('JWT_SECRET environment variable not set.');
        return NextResponse.json({ error: 'Server configuration error: JWT_SECRET is missing.' }, { status: 500 });
    }

    const cookieStore = await cookies();
    const authToken = cookieStore.get('auth_token');

    if (!authToken) {
        return NextResponse.json({ error: 'Authentication required: No auth_token cookie found.' }, { status: 401 });
    }

    try {
        const secret = new TextEncoder().encode(JWT_SECRET);
        const { payload } = await jwtVerify(authToken.value, secret) as { payload: AppJwtPayload };

        const { searchParams } = new URL(req.url);
        const userIdQuery = searchParams.get('user_id');

        if (!userIdQuery) {
            return NextResponse.json({ error: 'user_id query parameter is required.' }, { status: 400 });
        }

        const user_id = parseInt(userIdQuery, 10);
        if (isNaN(user_id)) {
            return NextResponse.json({ error: 'user_id must be a valid number.' }, { status: 400 });
        }

        const { env } = getRequestContext();
        const db = env.DB;

        // Modified SQL query to JOIN lendings with books table
        const stmt = db.prepare(`
            SELECT
                l.id as lending_id,
                l.user_id,
                l.book_id,
                l.borrowed_date,
                l.due_date,
                l.returned_date,
                l.status,
                l.created_at as lending_created_at,
                l.updated_at as lending_updated_at,
                b.title as book_title,
                b.author as book_author,
                b.isbn as book_isbn,
                b.publication_year as book_publication_year, -- Changed from b.published_year
                b.genre as book_genre,
                b.stock as book_stock, -- Correctly included
                b.is_available as book_is_available -- Correctly included
            FROM lendings l
            JOIN books b ON l.book_id = b.id
            WHERE l.user_id = ?
            ORDER BY l.borrowed_date DESC
        `).bind(user_id);

        const { results } = await stmt.all<LendingWithBookData>();

        if (!results || results.length === 0) {
            return NextResponse.json({ message: 'No lending records found for this user.', data: [] }, { status: 200 });
        }

        return NextResponse.json({ data: results }, { status: 200 });

    } catch (error: any) {
        console.error('Error retrieving lending records:', error);
        if (error.name === 'JWSInvalid' || error.name === 'JWSSignatureVerificationFailed' || error.name === 'JWTExpired' || error.name === 'JWTClaimValidationFailed') {
            return NextResponse.json({ error: 'Invalid or expired authentication token.' }, { status: 401 });
        }
        return NextResponse.json({ error: 'An unexpected error occurred.', details: error.message || 'No additional details' }, { status: 500 });
    }
}

/*
Postman Example for GET /api/lendi/r-one:

URL: {{your_base_url}}/api/lendi/r-one?user_id=1
Method: GET
Headers:
  Cookie: auth_token={{your_jwt_auth_token}}

Success Response (200 OK with data):
{
    "data": [
        {
            "lending_id": 1,
            "user_id": 1,
            "book_id": 101,
            "borrowed_date": "2023-10-01T10:00:00Z",
            "due_date": "2023-10-15",
            "returned_date": null,
            "status": "borrowed",
            "lending_created_at": "2023-10-01T10:00:00Z",
            "lending_updated_at": "2023-10-01T10:00:00Z",
            "book_title": "The Great Gatsby",
            "book_author": "F. Scott Fitzgerald",
            "book_isbn": "9780743273565",
            "book_publication_year": 1925, // Changed from book_published_year
            "book_genre": "Classic",
            "book_stock": 5, // Correctly included
            "book_is_available": 1
        },
        // ... more records
    ]
}

Success Response (200 OK, no data found):
{
    "message": "No lending records found for this user.",
    "data": []
}

Error Response Examples:

400 Bad Request (Missing user_id):
{
    "error": "user_id query parameter is required."
}

400 Bad Request (Invalid user_id format):
{
    "error": "user_id must be a valid number."
}

401 Unauthorized (Missing or Invalid Token):
{
    "error": "Authentication required: No auth_token cookie found."
}

500 Internal Server Error:
{
    "error": "Server configuration error: JWT_SECRET is missing."
}
*/