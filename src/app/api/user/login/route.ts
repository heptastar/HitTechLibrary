import { getRequestContext } from '@cloudflare/next-on-pages';
import bcrypt from 'bcryptjs'; // Assuming bcryptjs is used for password hashing
import { SignJWT } from 'jose'; // Import SignJWT from jose

// Define the expected type for the request body
interface LoginRequestBody {
  email: string;
  password: string;
}

// Define the runtime environment for Cloudflare Pages Functions
export const runtime = 'edge';

export async function POST(request: Request) {
  try {
    // Cast the request body to the defined interface
    const { email, password } = await request.json() as LoginRequestBody;

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

    // Find the user by email
    const user = await db.prepare(
      'SELECT id, email, userrank, is_active, password FROM users WHERE email = ?'
    ).bind(email).first();

    // Check if user exists and verify password
    if (!user) {
      return new Response(JSON.stringify({ error: 'Invalid credentials' }), {
        status: 401, // Unauthorized
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // TODO: Implement password verification using bcryptjs
    // const passwordMatch = await bcrypt.compare(password, user.password);
    // For now, assuming password is not hashed (replace this with bcrypt.compare)
    const passwordMatch = password === user.password; // REPLACE THIS LINE

    if (!passwordMatch) {
       return new Response(JSON.stringify({ error: 'Invalid credentials' }), {
        status: 401, // Unauthorized
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Check if user is active
    if (!user.is_active) {
       return new Response(JSON.stringify({ error: 'Account is inactive' }), {
        status: 403, // Forbidden
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Prepare payload for JWT
    const jwtPayload = {
      id: user.id,
      email: user.email,
      userrank: user.userrank,
      is_active: user.is_active,
      // Add other relevant user data here
    };

    // TODO: Get JWT signing key from environment variables/secrets
    // Ensure your JWT_SECRET is a strong, random string and kept secret.
    // It should be at least 32 bytes for HS256.
    const jwtSecret = process.env.JWT_SECRET || 'your-super-secret-key-change-this'; // REPLACE with your actual secret key binding name

    if (!jwtSecret) {
        console.error('JWT_SECRET environment variable not set.');
         return new Response(JSON.stringify({ error: 'Server configuration error' }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' },
        });
    }

    // Create the JWT
    const secret = new TextEncoder().encode(jwtSecret);
    const jwt = await new SignJWT(jwtPayload)
      .setProtectedHeader({ alg: 'HS256' }) // Use HS256 algorithm
      .setIssuedAt()
      .setExpirationTime('2h') // Token expires in 2 hours (adjust as needed)
      .sign(secret);

    // Set the JWT as an HTTP-only cookie
    // The cookie name, domain, path, and expiration should be configured appropriately
    const cookieName = 'auth_token'; // Choose a name for your cookie
    const cookieOptions = `HttpOnly; Secure; Path=/; SameSite=Strict; Max-Age=${60 * 60 * 2}`; // Max-Age in seconds (2 hours)

    const response = new Response(JSON.stringify({ message: 'Login successful' }), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Set-Cookie': `${cookieName}=${jwt}; ${cookieOptions}`,
      },
    });

    return response;

  } catch (error: any) {
    // Handle other potential errors (e.g., JSON parsing error, database connection issues)
    console.error('Login API error:', error);

    return new Response(JSON.stringify({ error: 'An unexpected error occurred', details: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}