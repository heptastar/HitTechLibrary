import { NextRequest, NextResponse } from 'next/server';
import { getRequestContext } from '@cloudflare/next-on-pages';

// Define the runtime environment for Cloudflare Pages Functions
export const runtime = 'edge';

/**
 * Postman Example:
 * GET http://localhost:3000/api/book/se?query=search_term&page=1&limit=10
 *
 * Query parameters:
 * - query: The search term for full-text search (required).
 * - page: The page number for pagination (optional, defaults to 1).
 * - limit: The number of items per page for pagination (optional, defaults to 10).
 *
 * This endpoint performs a full-text search on the books table.
 */
export async function GET(req: NextRequest) {
    try {
        const { searchParams } = new URL(req.url);
        const searchQuery = searchParams.get('query');
        const page = parseInt(searchParams.get('page') || '1', 10); // Default to page 1
        const limit = parseInt(searchParams.get('limit') || '10', 10); // Default to 10 items per page

        if (!searchQuery) {
            return NextResponse.json({ error: 'Search query is required' }, { status: 400 });
        }

        // Ensure page and limit are positive integers
        const validPage = Math.max(1, page);
        const validLimit = Math.max(1, limit);

        const offset = (validPage - 1) * validLimit;

        // Access the D1 database binding
        const { env } = getRequestContext();
        const db = env.DB; // 'DB' is the binding name from wrangler.jsonc

        // Perform full-text search using FTS5 and join with the books table
        // We select from books and join with books_fts on rowid = books.id
        // The MATCH operator is used on the books_fts table
        const { results } = await db.prepare(
            `SELECT b.* FROM books b JOIN books_fts bf ON b.id = bf.rowid WHERE bf.books_fts MATCH ? LIMIT ? OFFSET ?`
        ).bind(searchQuery, validLimit, offset).all();

        // Get total count of matching items for pagination metadata
        // This requires a separate query using COUNT(*)
        const { count } = await db.prepare(
            `SELECT COUNT(*) as count FROM books_fts WHERE books_fts MATCH ?`
        ).bind(searchQuery).first() as { count: number };

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
        console.error('Error performing full-text search:', error);
        if (error instanceof Error) {
            return NextResponse.json({ error: 'An unexpected error occurred', details: error.message }, { status: 500 });
        }
         return NextResponse.json({ error: 'An unexpected error occurred' }, { status: 500 });
    }
}