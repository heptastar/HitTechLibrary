'use client'; // Add this line to make it a Client Component

import { useState } from 'react';
import { useRouter } from 'next/navigation'; // Import useRouter
import Head from 'next/head'; // Import Head if you need to set page title etc.
import Link from 'next/link'; // Import Link

// Define the expected type for the API response
interface RegisterApiResponse {
  message?: string; // Success message
  userId?: number; // User ID on success
  error?: string; // Error message
  details?: string; // Optional error details
}

export default function RegisterPage() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false); // Add loading state
  const router = useRouter(); // Initialize useRouter

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(''); // Clear previous errors
    setLoading(true); // Set loading state

    try {
      const response = await fetch('/api/user/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ name, email, password }),
      });

      // Cast the response data to the defined interface
      const data = await response.json() as RegisterApiResponse;

      if (response.ok) {
        // Registration successful, redirect to login page with a success message
        router.push('/loginpg?message=Registration successful! Please log in.');
      } else {
        // Registration failed, display error message
        setError(data.error || 'Registration failed. Please try again.');
      }
    } catch (err: any) {
      console.error('Registration error:', err);
      setError('An unexpected error occurred. Please try again later.');
    } finally {
      setLoading(false); // Reset loading state
    }
  };

  return (
    <div>
      {/* Optional: Add Head for page title */}
      {/*
      <Head>
        <title>Register - Library</title>
      </Head>
      */}

      {/* Navigation Bar */}
      <nav className="bg-gradient-to-r from-blue-500 to-blue-700 p-4 text-white shadow-lg">
        <div className="container mx-auto flex justify-between items-center">
          {/* Site Title or Logo - Wrapped with Link */}
          <Link href="/" passHref>
            <div className="text-2xl font-bold cursor-pointer"> {/* Added cursor-pointer */}
              Library
            </div>
          </Link>

          {/* Navigation Links (optional, could link back to home or login) */}
          <div>
            {/* Example: Link back to Home */}
            {/* <a href="/" className="text-white hover:underline mr-4">Home</a> */}
            {/* Example: Link to Login page (if you create one) */}
            {/* <a href="/loginpg" className="text-white hover:underline">Login</a> */}
          </div>
        </div>
      </nav>

      {/* Registration Form Section */}
      <div className="container mx-auto px-4 py-8 flex justify-center items-center min-h-[calc(100vh-64px)]"> {/* Adjust min-h based on nav height */}
        <div className="w-full max-w-md bg-white p-8 rounded-lg shadow-md">
          <h1 className="text-2xl font-bold text-center mb-6 text-gray-800">Register for an Account</h1>

          {/* Display error message if exists */}
          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4" role="alert">
              <span className="block sm:inline">{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit}> {/* Add onSubmit handler */}
            <div className="mb-4">
              <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="name">
                Name
              </label>
              <input
                className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                id="name"
                type="text"
                placeholder="Your Name"
                value={name} // Bind value to state
                onChange={(e) => setName(e.target.value)} // Update state on change
              />
            </div>
            <div className="mb-4">
              <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="email">
                Email
              </label>
              <input
                className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                id="email"
                type="email"
                placeholder="Email Address"
                value={email} // Bind value to state
                onChange={(e) => setEmail(e.target.value)} // Update state on change
                required // Make email required
              />
            </div>
            <div className="mb-6">
              <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="password">
                Password
              </label>
              <input
                className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 mb-3 leading-tight focus:outline-none focus:shadow-outline"
                id="password"
                type="password"
                placeholder="********"
                value={password} // Bind value to state
                onChange={(e) => setPassword(e.target.value)} // Update state on change
                required // Make password required
              />
            </div>
             {/* Optional: Add a field for user rank if needed during registration */}
             {/*
             <div className="mb-4">
               <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="userrank">
                 User Rank
               </label>
               <input
                 className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                 id="userrank"
                 type="number"
                 defaultValue={0} // Default rank
               />
             </div>
             */}
            <div className="flex items-center justify-between">
              <button
                className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline transition duration-300 disabled:opacity-50"
                type="submit" // Change type to submit
                disabled={loading} // Disable button while loading
              >
                {loading ? 'Registering...' : 'Register'} {/* Change button text based on loading state */}
              </button>
              {/* Optional: Link to Login page */}
              {/* <a className="inline-block align-baseline font-bold text-sm text-blue-600 hover:text-blue-800" href="/loginpg">
                Already have an account? Login
              </a> */}
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}