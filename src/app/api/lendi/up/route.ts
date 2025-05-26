import { NextRequest, NextResponse } from 'next/server';
import { jwtVerify, JWTPayload } from 'jose';
import { getRequestContext } from '@cloudflare/next-on-pages';
import { cookies } from 'next/headers';

interface UpdateLendingRequestBody {
  lending_id: number;
  returned_date?: string; // YYYY-MM-DD format
  status?: 'borrowed' | 'returned' | 'overdue';
  // Add other fields that can be updated, e.g., notes, extended_due_date
}

interface AppJwtPayload extends JWTPayload {
  id: number;
  email: string;
  userrank: number;
}

interface Book {
  id: number;
  stock: number;
  is_available: 0 | 1;
}

interface LendingRecord {
    id: number;
    book_id: number;
    status: string;
}

export const runtime = 'edge';

const JWT_SECRET = process.env.JWT_SECRET;

/*
Postman Example for PUT /api/lendi/up:

URL: {{your_base_url}}/api/lendi/up
Method: PUT
Headers:
  Content-Type: application/json
  Cookie: auth_token={{your_jwt_auth_token}} (Replace with a valid token for a user with userrank > 2)

Body (raw JSON) - Example for returning a book:
{
    "lending_id": 1, // ID of the lending record to update
    "returned_date": "2024-07-15",
    "status": "returned"
}

Body (raw JSON) - Example for marking as overdue:
{
    "lending_id": 2,
    "status": "overdue"
}

Success Response (200 OK):
{
    "message": "Lending record updated successfully."
}

Error Response Examples:

400 Bad Request (Invalid Input):
{
    "error": "Lending ID is required and must be a number."
}
{
    "error": "No valid fields provided for update or invalid status value."
}

401 Unauthorized (Missing or Invalid Token):
{
    "error": "Authentication required: No auth_token cookie found."
}
{
    "error": "Invalid or expired authentication token."
}

403 Forbidden (Insufficient Privileges):
{
    "error": "Forbidden: You do not have sufficient privileges to perform this action."
}

404 Not Found (Lending Record Not Found):
{
    "error": "Lending record not found."
}

500 Internal Server Error:
{
    "error": "Server configuration error: JWT_SECRET is missing."
}
{
    "error": "Failed to update lending record in database."
}
{
    "error": "An unexpected error occurred.",
    "details": "..."
}
*/

export async function PUT(req: NextRequest) {
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

    if (payload.userrank <= 2) {
      return NextResponse.json({ error: 'Forbidden: You do not have sufficient privileges to perform this action.' }, { status: 403 });
    }

    const body = await req.json() as UpdateLendingRequestBody;
    const { lending_id, returned_date, status } = body;

    if (typeof lending_id !== 'number') {
      return NextResponse.json({ error: 'Lending ID is required and must be a number.' }, { status: 400 });
    }

    const validStatuses = ['borrowed', 'returned', 'overdue'];
    if (status && !validStatuses.includes(status)) {
        return NextResponse.json({ error: 'Invalid status value. Allowed values are: borrowed, returned, overdue.' }, { status: 400 });
    }

    const { env } = getRequestContext();
    const db = env.DB;

    // Check if the lending record exists
    const lendingRecord = await db.prepare('SELECT id, book_id, status FROM lendings WHERE id = ?')
                                  .bind(lending_id)
                                  .first<LendingRecord>();

    if (!lendingRecord) {
      return NextResponse.json({ error: 'Lending record not found.' }, { status: 404 });
    }

    // Build the update query dynamically
    const updateFields: string[] = [];
    const bindings: (string | number | null)[] = [];

    if (returned_date !== undefined) {
      updateFields.push('returned_date = ?');
      bindings.push(returned_date || null); // Handle empty string as null if desired, or validate format
    }
    if (status !== undefined) {
      updateFields.push('status = ?');
      bindings.push(status);
    }

    if (updateFields.length === 0) {
      return NextResponse.json({ error: 'No valid fields provided for update.' }, { status: 400 });
    }

    updateFields.push('updated_at = CURRENT_TIMESTAMP');
    bindings.push(lending_id); // For the WHERE clause

    const updateQuery = `UPDATE lendings SET ${updateFields.join(', ')} WHERE id = ?`;
    const updateResult = await db.prepare(updateQuery).bind(...bindings).run();

    if (!updateResult.success) {
      console.error('Database update failed for lending record:', updateResult.error || 'Unknown error');
      return NextResponse.json({ error: 'Failed to update lending record in database.' }, { status: 500 });
    }

    // If the book is being returned, update book stock
    if (status === 'returned' && lendingRecord.status !== 'returned') { // Check previous status to avoid multiple increments
        const bookUpdateResult = await db.prepare(
            'UPDATE books SET stock = stock + 1, is_available = 1 WHERE id = ?'
        ).bind(lendingRecord.book_id).run();

        if (!bookUpdateResult.success) {
            console.error('Failed to update book stock after return:', bookUpdateResult.error || 'Unknown error');
            // Log this error, but the lending record update was successful.
            // Consider a compensating transaction or alert for manual review if this is critical.
        }
    }

    return NextResponse.json({ message: 'Lending record updated successfully.' }, { status: 200 });

  } catch (error: any) {
    console.error('Error updating lending record:', error);
    if (error.name === 'JWSInvalid' || error.name === 'JWSSignatureVerificationFailed' || error.name === 'JWTExpired' || error.name === 'JWTClaimValidationFailed') {
      return NextResponse.json({ error: 'Invalid or expired authentication token.' }, { status: 401 });
    }
    if (error instanceof SyntaxError) { // JSON parsing error
      return NextResponse.json({ error: 'Invalid request body: Malformed JSON.' }, { status: 400 });
    }
    return NextResponse.json({ error: 'An unexpected error occurred.', details: error.message || 'No additional details' }, { status: 500 });
  }
}