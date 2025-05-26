import { getRequestContext } from '@cloudflare/next-on-pages';

// Define the expected type for the request body
interface RegisterRequestBody {
  name?: string; // Name is optional based on your SQL schema
  email: string;
  password: string;
}

// Define the runtime environment for Cloudflare Pages Functions
export const runtime = 'edge';

export async function POST(request: Request) {
  try {
    // Cast the request body to the defined interface
    const { name, email, password } = await request.json() as RegisterRequestBody;

    // Basic validation
    if (!email || !password) {
      return new Response(JSON.stringify({ error: 'Email and password are required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Access the D1 database binding
    const { env } = getRequestContext();
    const db = env.DB; // 'DB' is the binding name from wrangler.jsonc

    // TODO: Hash the password before storing it in the database
    // You should use a library like bcryptjs for secure password hashing.
    // const hashedPassword = await bcrypt.hash(password, 10);

    // Insert the new user into the database
    const result = await db.prepare(
      'INSERT INTO users (name, email, password) VALUES (?, ?, ?)'
    ).bind(name, email, password /* Use hashedPassword here */).run();

    // Check if insertion was successful
    if (result.success) {
      return new Response(JSON.stringify({ message: 'User registered successfully', userId: result.meta.last_row_id }), {
        status: 201,
        headers: { 'Content-Type': 'application/json' },
      });
    } else {
      // Handle potential errors, e.g., unique email constraint violation
      console.error('Database insertion failed:', result.error);
      return new Response(JSON.stringify({ error: 'Failed to register user', details: result.error }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }

  } catch (error: any) {
    // Handle other potential errors (e.g., JSON parsing error, database connection issues)
    console.error('Registration API error:', error);

    // Check if the error is due to a unique constraint violation (email already exists)
    if (error.message && error.message.includes('UNIQUE constraint failed: users.email')) {
       return new Response(JSON.stringify({ error: 'Email address already exists' }), {
        status: 409, // Conflict
        headers: { 'Content-Type': 'application/json' },
      });
    }


    return new Response(JSON.stringify({ error: 'An unexpected error occurred', details: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}

// You might also want to add other HTTP methods like GET, PUT, DELETE if needed
// export async function GET(request: Request) { ... }