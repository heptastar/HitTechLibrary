import { NextRequest, NextResponse } from 'next/server';
import { jwtVerify, JWTPayload } from 'jose'; // Import JWTPayload for type safety
import { getRequestContext } from '@cloudflare/next-on-pages';
import { cookies } from 'next/headers';

interface CreateLendingRequestBody {
    user_id: number;
    book_id: number;
    due_date?: string; // Optional, can be calculated or set by admin/system
}

// Define the expected type for your JWT payload more specifically if possible
interface AppJwtPayload extends JWTPayload {
    id: number;
    email: string;
    userrank: number;
    // Add other properties if they exist in your JWT payload
}

export const runtime = 'edge';

// It's crucial to get JWT_SECRET from environment variables in production
const JWT_SECRET = process.env.JWT_SECRET;

/*
Postman Example for POST /api/lendi/c:

URL: {{your_base_url}}/api/lendi/c
Method: POST
Headers:
  Content-Type: application/json
  Cookie: auth_token={{your_jwt_auth_token}} (Replace with a valid token)

Body (raw JSON):
{
    "user_id": 1,  // Replace with an existing user ID
    "book_id": 1,  // Replace with an existing and available book ID
    "due_date": "2024-12-31" // Optional: YYYY-MM-DD format. If omitted, defaults to 14 days from now.
}

Success Response (201 Created):
{
    "message": "Book lent successfully.",
    "lending_id": 123 // ID of the new lending record
}

Error Response Examples:

400 Bad Request (Invalid Input):
{
    "error": "User ID and Book ID must be numbers and are required."
}

401 Unauthorized (Missing or Invalid Token):
{
    "error": "Authentication required: No auth_token cookie found."
}
{
    "error": "Invalid or expired authentication token."
}

404 Not Found (Book Not Found):
{
    "error": "Book not found."
}

409 Conflict (Book Not Available/Out of Stock):
{
    "error": "Book is not available for lending or out of stock."
}

500 Internal Server Error:
{
    "error": "Server configuration error: JWT_SECRET is missing."
}
{
    "error": "Failed to create lending record in database."
}
{
    "error": "An unexpected error occurred.",
    "details": "..."
}
*/

export async function POST(req: NextRequest) {
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

        // Authorization check: Only allow users with userrank > 2
        if (payload.userrank <= 2) {
            return NextResponse.json({ error: 'Forbidden: You do not have sufficient privileges to perform this action.' }, { status: 403 });
        }

        // Example: Check if the user performing the action is the one lending the book, or an admin
        // This depends on your application's authorization rules.
        // For now, we'll assume any authenticated user can create a lending record if they provide a valid user_id.
        // You might want to restrict this so users can only lend books for themselves unless they are admins.
        // const userIdFromToken = payload.id;
        // const userRankFromToken = payload.userrank;

        const body = await req.json() as CreateLendingRequestBody;
        const { user_id, book_id, due_date } = body;

        if (typeof user_id !== 'number' || typeof book_id !== 'number') {
            return NextResponse.json({ error: 'User ID and Book ID must be numbers and are required.' }, { status: 400 });
        }

        const { env } = getRequestContext();
        const db = env.DB;

        // Start a transaction if your DB supports it and you need atomicity for multiple operations
        // D1 does not support multi-statement transactions in a single .prepare or .batch call in the same way traditional SQL dbs do.
        // You'd typically handle this by ensuring each step succeeds or manually rolling back/compensating.

        // 1. Check if the book is available and get its current stock
        const bookInfo = await db.prepare(
            'SELECT is_available, stock FROM books WHERE id = ?'
        ).bind(book_id).first<{ is_available: number; stock: number }>();

        if (!bookInfo) {
            return NextResponse.json({ error: 'Book not found.' }, { status: 404 });
        }
        if (!bookInfo.is_available || bookInfo.stock <= 0) {
            return NextResponse.json({ error: 'Book is not available for lending or out of stock.' }, { status: 409 }); // 409 Conflict
        }

        // 2. Create a new lending record
        const finalDueDate = due_date || new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]; // Default 14 days


        const insertLendingResult = await db.prepare(
            `INSERT INTO lendings (user_id, book_id, due_date, status)
             VALUES (?, ?, ?, 'borrowed')`
        ).bind(user_id, book_id, finalDueDate)
        .run();

        if (!insertLendingResult.success) {
            console.error('Database insert failed for lending:', insertLendingResult.error || 'Unknown error');
            return NextResponse.json({ error: 'Failed to create lending record in database.' }, { status: 500 });
        }

        // 3. Decrement book stock and potentially update availability
        const newStock = bookInfo.stock - 1;
        const newAvailability = newStock > 0 ? 1 : 0; // 1 for true, 0 for false

        const updateBookResult = await db.prepare(
            'UPDATE books SET stock = ?, is_available = ? WHERE id = ?'
        ).bind(newStock, newAvailability, book_id).run();

        if (!updateBookResult.success) {
            console.error('Failed to update book stock/availability after lending:', updateBookResult.error || 'Unknown error');
            // This is a critical issue. The lending record was created, but book status wasn't updated.
            // You might need a compensating action or a background job to fix inconsistencies.
            // For now, we'll return success for lending but log the error.
        }

        return NextResponse.json({
            message: 'Book lent successfully.',
            lending_id: insertLendingResult.meta?.last_row_id
        }, { status: 201 });

    } catch (error: any) {
        console.error('Error creating lending record:', error);
        if (error.name === 'JWSInvalid' || error.name === 'JWSSignatureVerificationFailed' || error.name === 'JWTExpired' || error.name === 'JWTClaimValidationFailed') {
            return NextResponse.json({ error: 'Invalid or expired authentication token.' }, { status: 401 });
        }
        if (error instanceof SyntaxError) { // JSON parsing error
            return NextResponse.json({ error: 'Invalid request body: Malformed JSON.' }, { status: 400 });
        }
        return NextResponse.json({ error: 'An unexpected error occurred.', details: error.message || 'No additional details' }, { status: 500 });
    }
}