import { NextRequest, NextResponse } from 'next/server';
import { getRequestContext } from '@cloudflare/next-on-pages';

// Define the runtime environment for Cloudflare Pages Functions
export const runtime = 'edge';

/**
 * Postman Example:
 * GET http://localhost:3000/api/book/r-all
 *
 * No request body is required for this GET request.
 *
 * This endpoint retrieves all books from the database.
 */
export async function GET(req: NextRequest) {
    try {
        const { searchParams } = new URL(req.url);
        const page = parseInt(searchParams.get('page') || '1', 10); // Default to page 1
        const limit = parseInt(searchParams.get('limit') || '10', 10); // Default to 10 items per page

        // Ensure page and limit are positive integers
        const validPage = Math.max(1, page);
        const validLimit = Math.max(1, limit);

        const offset = (validPage - 1) * validLimit;

        // Access the D1 database binding
        const { env } = getRequestContext();
        const db = env.DB; // 'DB' is the binding name from wrangler.jsonc

        // Retrieve books with pagination
        const { results } = await db.prepare(
            `SELECT * FROM books LIMIT ? OFFSET ?`
        ).bind(validLimit, offset).all(); // Use .all() to get multiple rows

        // Optional: Get total count for pagination metadata
        const { count } = await db.prepare(
            `SELECT COUNT(*) as count FROM books`
        ).first() as { count: number }; // Use .first() to get a single row with count

        return NextResponse.json({
            books: results,
            pagination: {
                total_items: count,
                current_page: validPage,
                items_per_page: validLimit,
                total_pages: Math.ceil(count / validLimit),
            },
        }, { status: 200 });

    } catch (error) {
        console.error('Error retrieving all books:', error);
        if (error instanceof Error) {
            return NextResponse.json({ error: 'An unexpected error occurred', details: error.message }, { status: 500 });
        }
         return NextResponse.json({ error: 'An unexpected error occurred' }, { status: 500 });
    }
}