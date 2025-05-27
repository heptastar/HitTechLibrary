'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import BookCardOnHomePgComp from '../components/bookcardonhomepgcomp';

interface Book {
  id: number;
  title: string;
  author: string;
  publication_year: number;
  isbn: string;
  genre: string;
  stock: number;
  description: string;
  is_available: boolean;
  created_at: string;
  updated_at: string;
}

interface User {
  id: number;
  name: string;
  userrank: number;
  email: string;
}

interface BookResponse {
  books: Book[];
  pagination: {
    current_page: number;
    items_per_page: number;  
    total_items: number;
    total_pages: number;
  };
}

export default function Home() {
  const [user, setUser] = useState<User | null>(null);
  const [books, setBooks] = useState<Book[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [booksPerPage] = useState(10);
  const [totalBooksCount, setTotalBooksCount] = useState(0);
  const [isLanguageDropdownOpen, setIsLanguageDropdownOpen] = useState(false); // State for language dropdown
  // Removed showUserInfoDialog state
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
        }
      } catch (err) {
        console.error('Failed to fetch user:', err);
        setUser(null);
      }
    };

    fetchUser();
  }, []);

  useEffect(() => {
    // Modify fetchBooks to accept page and perPage
    const fetchBooks = async (page: number, perPage: number) => {
      try {
        setLoading(true);
        setError(null);
        // Include page and perPage as query parameters
        const res = await fetch(`/api/book/r-all?page=${page}&perPage=${perPage}`);
        if (res.ok) {
          const data: BookResponse = await res.json();
          console.log('Fetched book data:', data.books);
          console.log('Fetched pagination data:', data.pagination);
          if (Array.isArray(data.books)) {
            // Set books directly as API returns the correct page
            setBooks(data.books);
            // Use total_items from the new pagination structure
            setTotalBooksCount(data.pagination.total_items);
          } else {
            console.error('API response books is not an array:', data);
            setBooks([]);
            setTotalBooksCount(0);
            setError('Invalid book data format');
          }
        } else {
          setError('Failed to fetch books');
          setBooks([]);
          setTotalBooksCount(0);
        }
      } catch (err) {
        console.error('Failed to fetch books:', err);
        setError('Failed to fetch books');
        setBooks([]);
        setTotalBooksCount(0);
      } finally {
        setLoading(false);
      }
    };

    // Call fetchBooks with current page and books per page
    fetchBooks(currentPage, booksPerPage);
    // Add currentPage to the dependency array
  }, [currentPage, booksPerPage]); // Add booksPerPage if it can change

  // Remove client-side slicing
  // const indexOfLastBook = currentPage * booksPerPage;
  // const indexOfFirstBook = indexOfLastBook - booksPerPage;
  // const currentBooks = Array.isArray(books) ? books.slice(indexOfFirstBook, lastBookIndex) : [];

  // currentBooks is now simply the books state
  const currentBooks = books;

  // Add debug logs to verify values
  console.log('Books array length:', books.length);
  console.log('Total books count (from API):', totalBooksCount);
  console.log('Current page:', currentPage);
  console.log('Books per page:', booksPerPage);
  // Remove slicing index logs as they are no longer relevant for display
  // console.log('First book index:', indexOfFirstBook);
  // console.log('Last book index:', indexOfLastBook);


  // Log the current books to verify
  console.log('Current books:', currentBooks);

  console.log('Current books for display:', currentBooks);

  const paginate = (pageNumber: number) => {
    // Only update page if it's a valid page number
    if (pageNumber >= 1 && pageNumber <= totalPages) {
      setCurrentPage(pageNumber);
    }
  };

  // Calculate total pages based on totalBooksCount
  const totalPages = Math.ceil(totalBooksCount / booksPerPage);

  return (
    // This div is the flex container, set to column direction and minimum height of screen
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

            {/* Add the new button linking to userlendinfopg */}
            {user && (
              <Link href="/userlendinfopg" className="font-bold bg-white hover:bg-gray-200 text-blue-700 px-3 py-1 rounded shadow">
                My Borrows
              </Link>
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

      <main className="container mx-auto p-6">
        <h1 className="text-4xl font-bold text-center text-gray-800 mb-8">Welcome to the HitTechLibrary</h1>

      

        {loading && <p className="text-center text-gray-700">Loading books...</p>}
        {error && <p className="text-center text-red-500">Error: {error}</p>}

        {!loading && !error && books.length === 0 && (
          <p className="text-center text-gray-700">No books found.</p>
        )}

        {!loading && !error && currentBooks.length > 0 && (
          <div className="overflow-x-auto">
            <table className="min-w-full bg-white shadow-md rounded">
              <thead>
                <tr>
                  <th className="py-2 px-4 border-b border-gray-200 bg-blue-200 text-left text-sm font-semibold text-gray-600">ID</th>
                  <th className="py-2 px-4 border-b border-gray-200 bg-blue-200 text-left text-sm font-semibold text-gray-600">Title</th>
                  <th className="py-2 px-4 border-b border-gray-200 bg-blue-200 text-left text-sm font-semibold text-gray-600">Author</th>
                  <th className="py-2 px-4 border-b border-gray-200 bg-blue-200 text-left text-sm font-semibold text-gray-600">Publication Year</th>
                  <th className="py-2 px-4 border-b border-gray-200 bg-blue-200 text-left text-sm font-semibold text-gray-600">ISBN</th>
                  <th className="py-2 px-4 border-b border-gray-200 bg-blue-200 text-left text-sm font-semibold text-gray-600">Genre</th>
                  <th className="py-2 px-4 border-b border-gray-200 bg-blue-200 text-left text-sm font-semibold text-gray-600">Stock</th>
                  <th className="py-2 px-4 border-b border-gray-200 bg-blue-200 text-left text-sm font-semibold text-gray-600">Available</th>
                </tr>
              </thead>
              <tbody>
                {currentBooks.map((book) => (
                  <tr key={book.id} className="hover:bg-gray-50">
                    <td className="py-2 px-4 border-b border-gray-200 text-sm text-gray-700">{book.id}</td>
                    <td className="py-2 px-4 border-b border-gray-200 text-sm text-gray-700">{book.title}</td>
                    <td className="py-2 px-4 border-b border-gray-200 text-sm text-gray-700">{book.author}</td>
                    <td className="py-2 px-4 border-b border-gray-200 text-sm text-gray-700">{book.publication_year}</td>
                    <td className="py-2 px-4 border-b border-gray-200 text-sm text-gray-700">{book.isbn}</td>
                    <td className="py-2 px-4 border-b border-gray-200 text-sm text-gray-700">{book.genre}</td>
                    <td className="py-2 px-4 border-b border-gray-200 text-sm text-gray-700">{book.stock}</td>
                    <td className="py-2 px-4 border-b border-gray-200 text-sm text-gray-700">{book.is_available ? 'Yes' : 'No'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination controls */}
        {!loading && !error && totalBooksCount > booksPerPage && (
          <div className="flex justify-center mt-6 space-x-2">
            {Array.from({ length: totalPages }, (_, i) => (
              <button
                key={i + 1}
                onClick={() => paginate(i + 1)}
                className={`px-4 py-2 text-sm font-medium rounded ${currentPage === i + 1 ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}
              >
                {i + 1}
              </button>
            ))}
          </div>
        )}
      </main>

      {/* This main content area grows to fill available space */}
      <main className="container mx-auto p-4 flex-grow">
        {/* ... existing code ... */}
      </main>

      {/* The footer remains at the bottom */}
      <footer className="bg-blue-500 text-white text-center p-4">
        <div className="container mx-auto">
          {/* Updated footer text with a link */}
          <p>&copy; 2023 HitTechLibrary dev and maintained by <a href="https://www.hit2023.com" target="_blank" rel="noopener noreferrer" className="underline hover:text-blue-300">Heptastar Intelligent Tech</a>. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
