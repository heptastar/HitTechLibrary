'use client';

import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState, Suspense } from 'react';
import SearchParamsHandler from './search-params-handler';

// Define the expected type for the API response
interface LoginApiResponse {
  message?: string;
  error?: string;
  details?: string;
}

export default function LoginPage() {
  const router = useRouter();
  const [successMessage, setSuccessMessage] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleMessageFound = (message: string) => {
    setSuccessMessage(message);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await fetch('/api/user/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json() as LoginApiResponse;

      if (response.ok) {
        router.push('/');
      } else {
        setError(data.error || 'Login failed. Please try again.');
      }
    } catch (err: any) {
      console.error('Login error:', err);
      setError('An unexpected error occurred. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      {/* Wrap the SearchParamsHandler in a Suspense boundary */}
      <Suspense fallback={<div>Loading...</div>}>
        <SearchParamsHandler onMessageFound={handleMessageFound} />
      </Suspense>

      {/* Navigation Bar */}
      <nav className="bg-gradient-to-r from-blue-500 to-blue-700 p-4 text-white shadow-lg">
        <div className="container mx-auto flex justify-between items-center">
          {/* Site Title or Logo */}
          <div className="text-2xl font-bold">
            Library
          </div>

          {/* Navigation Links */}
          <div>
            {/* Link back to Home */}
            <Link href="/" passHref>
              <span className="font-bold bg-white hover:bg-gray-200 text-blue-700 px-3 py-1 rounded shadow mr-4 cursor-pointer">Home</span>
            </Link>
            {/* Link to Register page */}
            <Link href="/registerpg" passHref>
               <span className="font-bold bg-white hover:bg-gray-200 text-blue-700 px-3 py-1 rounded shadow cursor-pointer">Register</span>
            </Link>
          </div>
        </div>
      </nav>

      {/* Login Form Section */}
      <div className="container mx-auto px-4 py-8 flex justify-center items-center min-h-[calc(100vh-64px)]">
        <div className="w-full max-w-md bg-white p-8 rounded-lg shadow-md">
          <h1 className="text-2xl font-bold text-center mb-6 text-gray-800">Login to Your Account</h1>

          {/* Display success message if exists */}
          {successMessage && (
            <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded relative mb-4" role="alert">
              <span className="block sm:inline">{successMessage}</span>
            </div>
          )}

           {/* Display error message if exists */}
          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4" role="alert">
              <span className="block sm:inline">{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit}>
            {/* Rest of the form remains unchanged */}
            <div className="mb-4">
              <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="email">
                Email
              </label>
              <input
                className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                id="email"
                type="email"
                placeholder="Email Address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
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
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            <div className="flex items-center justify-between">
              <button
                className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline transition duration-300 disabled:opacity-50"
                type="submit"
                disabled={loading}
              >
                {loading ? 'Logging In...' : 'Login'}
              </button>
              {/* Link to Register page */}
              <Link href="/registerpg" passHref>
                <span className="inline-block align-baseline font-bold text-sm text-blue-600 hover:text-blue-800 cursor-pointer">
                  Don't have an account? Register
                </span>
              </Link>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}