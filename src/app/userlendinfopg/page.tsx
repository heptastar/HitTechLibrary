'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

interface User {
  id: number;
  name: string;
  userrank: number;
  email: string;
}

// Define the expected structure of the lending data
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
    book_publication_year: number;
    book_genre: string;
    book_stock: number;
    book_is_available: number;
}

// Define the expected structure of the API response
interface LendingApiResponse {
  data: LendingWithBookData[];
  message?: string; // Optional message field for success with no data
}

// Define the expected structure of the API error response
interface LendingApiErrorResponse {
  error: string;
  details?: string; // Optional details field
}

export default function UserLendInfoPage() {
  const [user, setUser] = useState<User | null>(null);
  const [lendingData, setLendingData] = useState<LendingWithBookData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    const fetchUser = async () => {
      try {
        console.log('Fetching user data...');
        const res = await fetch('/api/auth/jwt');
        console.log('User fetch response status:', res.status);
        if (res.ok) {
          const userData: User = await res.json();
          console.log('User data fetched successfully:', userData);
          setUser(userData);
        } else {
          console.log('Failed to fetch user data, status:', res.status);
          setUser(null);
          setLoading(false); // Stop loading if user fetch fails
        }
      } catch (err) {
        console.error('Failed to fetch user:', err);
        setUser(null);
        setError('Failed to load user data.');
        setLoading(false); // Stop loading if user fetch fails
      }
    };

    fetchUser();
  }, []);

  useEffect(() => {
    const fetchLendingData = async (userId: number) => {
      try {
        setLoading(true);
        setError(null);
        console.log(`Fetching lending data for user ID: ${userId}...`);
        const res = await fetch(`/api/lendi/r-one?user_id=${userId}`);
        console.log('Lending data fetch response status:', res.status);

        if (res.ok) {
          // Explicitly type the successful result
          const result: LendingApiResponse = await res.json();
          console.log('Lending data fetched successfully:', result);
          setLendingData(result.data || []); // Assuming the data is in a 'data' field
        } else {
          // Explicitly type the error result
          const errorData: LendingApiErrorResponse = await res.json();
          console.error('Failed to fetch lending data, status:', res.status, 'error:', errorData);
          setError(errorData.error || 'Failed to load lending data.');
          setLendingData([]);
        }
      } catch (err) {
        console.error('Error fetching lending data:', err);
        setError('An error occurred while fetching lending data.');
        setLendingData([]);
      } finally {
        setLoading(false);
      }
    };

    if (user) {
      fetchLendingData(user.id);
    }
  }, [user]); // Fetch data whenever the user state changes

  return (
    <div className="flex flex-col min-h-screen bg-blue-100">
      <nav className="bg-gradient-to-r from-blue-500 to-white-900 p-4 text-white shadow-md">
        <div className="container mx-auto flex justify-between items-center">
          <Link href="/" className="text-2xl font-bold">HitTechLibrary</Link>

          <div className="flex items-center space-x-4">

            {/* Conditionally render Borrow link based on user rank */}
            {user && user.userrank > 2 && (
              <Link href="/borrowpg" className="font-bold bg-white hover:bg-gray-200 text-blue-700 px-3 py-1 rounded shadow">
                Lend
              </Link>
            )}

            {/* Conditional rendering for Book Manage button */}
            {user && user.userrank === 3 && (
              <Link href="/bookmanagepg" className="font-bold bg-white hover:bg-gray-200 text-blue-700 px-3 py-1 rounded shadow">
                Book Manage
              </Link>
            )}

            {user ? (
              <div
                className="cursor-pointer"
                onClick={() => {
                  // Display user rank and email in an alert
                  alert(`User Rank: ${user.userrank}\nEmail: ${user.email}\nUser Id: ${user.id}`);
                }}
              >
                {/* Display first two characters of email as avatar */}
                <div className="w-8 h-8 rounded-full bg-orange-500 flex items-center justify-center text-white font-bold">
                  {user.email.substring(0, 2).toUpperCase()}
                </div>
              </div>
            ) : (
              <div></div>
            )}

            {/* Language Dropdown Button - Always visible */}

            {user ? (
              <>

                <button
                  onClick={async () => {
                    try {
                      // Make a POST request to the logout API
                      const res = await fetch('/api/logouti', {
                        method: 'POST',
                      });

                      if (res.ok) {
                        // Redirect to login page after successful logout
                        router.push('/loginpg');
                      } else {
                        // Handle logout error
                        console.error('Logout failed');
                        alert('Logout failed. Please try again.');
                      }
                    } catch (error) {
                      console.error('Error during logout:', error);
                      alert('An error occurred during logout.');
                    }
                  }}
                  className="font-bold bg-white hover:bg-gray-200 text-blue-700 px-3 py-1 rounded shadow"
                >
                  Logout
                </button>
              </>
            ) : (
              <Link href="/loginpg" className="font-bold bg-white hover:bg-gray-200 text-blue-700 px-3 py-1 rounded shadow">
                Login
              </Link>
            )}
          </div>
        </div>
      </nav>

      <main className="flex-grow container mx-auto p-4">
        <h1 className="text-2xl font-bold text-center mb-6">My Borrowed Books</h1>

        {loading && <p className="text-center">Loading lending records...</p>}
        {error && <p className="text-center text-red-500">Error: {error}</p>}

        {!loading && !error && lendingData.length > 0 && (
          <div className="overflow-x-auto">
            <table className="min-w-full bg-white shadow-md rounded-lg overflow-hidden">
              <thead className="bg-blue-500 text-white">
                <tr>
                  <th className="py-3 px-4 text-left">Book Title</th>
                  <th className="py-3 px-4 text-left">Author</th>
                  <th className="py-3 px-4 text-left">Borrowed Date</th>
                  <th className="py-3 px-4 text-left">Due Date</th>
                  <th className="py-3 px-4 text-left">Returned Date</th>
                  <th className="py-3 px-4 text-left">Status</th>
                </tr>
              </thead>
              <tbody>
                {lendingData.map((record) => (
                  <tr key={record.lending_id} className="border-b border-gray-200 hover:bg-gray-100">
                    <td className="py-3 px-4">{record.book_title}</td>
                    <td className="py-3 px-4">{record.book_author}</td>
                    <td className="py-3 px-4">{new Date(record.borrowed_date).toLocaleDateString()}</td>
                    <td className="py-3 px-4">{record.due_date ? new Date(record.due_date).toLocaleDateString() : 'N/A'}</td>
                    <td className="py-3 px-4">{record.returned_date ? new Date(record.returned_date).toLocaleDateString() : 'Not Returned'}</td>
                    <td className="py-3 px-4">{record.status}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {!loading && !error && lendingData.length === 0 && (
          <p className="text-center">No lending records found for this user.</p>
        )}

      </main>

      {/* Footer - Optional, but good practice */}
      <footer className="bg-blue-500 p-4 text-white text-center mt-8">
        <div className="container mx-auto">
          <p>&copy; 2024 HitTechLibrary. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}