'use client';

import React, { useState, useEffect, FormEvent } from 'react'; // Added FormEvent
import Link from 'next/link';
import { useRouter } from 'next/navigation';

// Define types for book data and pagination
interface Book {
  id: number;
  title: string;
  description: string | null;
  author: string;
  isbn: string | null;
  publication_year: number | null;
  genre: string | null;
  is_available: boolean;
  created_at: string;
  updated_at: string;
  stock: number; // Assuming stock is part of the Book interface from your API
}


interface Pagination {
  total_items: number;
  current_page: number;
  items_per_page: number;
  total_pages: number;
}

// Define a type for the expected search API response
interface SearchApiResponse {
  books: Book[];
  pagination: Pagination;
}

// Define a type for the expected error response
interface ErrorResponse {
  error: string;
}

// Define a type for the user data
interface User {
  name: string;
  userrank: number;
  email: string;
}

// Define interfaces for the API response types (can be at the top of the file)
interface LendingSuccessResponse {
  lending_id: number;
  message?: string;
}

interface LendingErrorResponse {
  error: string;
}

const BorrowPage = () => {
  const [user, setUser] = useState<User | null>(null);
  const router = useRouter();

  // State for search functionality
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Book[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState<Pagination | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10; // Define items per page for search results
  const [lendingStatus, setLendingStatus] = useState<string | null>(null); // For borrow success/error messages

  // Fetch user data on component mount
  useEffect(() => {
    const fetchUser = async () => {
      try {
        const res = await fetch('/api/auth/jwt');
        if (res.ok) {
          const userData: User = await res.json();
          setUser(userData);
        } else {
          setUser(null);
          // Optional: Redirect to login if not authenticated
          // router.push('/loginpg');
        }
      } catch (err) {
        console.error('Failed to fetch user:', err);
        setUser(null);
        // Optional: Redirect to login on error
        // router.push('/loginpg');
      }
    };

    fetchUser();
  }, []);

  // Function to handle search
  const handleSearch = async (page: number = 1) => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      setPagination(null);
      setError(null);
      return;
    }

    setLoading(true);
    setError(null);
    setLendingStatus(null); // Clear lending status on new search
    setCurrentPage(page);

    try {
      const res = await fetch(
        `/api/book/se?query=${encodeURIComponent(searchQuery)}&page=${page}&limit=${itemsPerPage}`
      );

      if (res.ok) {
        // Explicitly type the data received from the API
        const data: SearchApiResponse = await res.json();
        setSearchResults(data.books);
        setPagination(data.pagination);
      } else {
        // Explicitly type the error data received from the API
        const errorData: ErrorResponse = await res.json();
        setError(errorData.error || 'Failed to fetch search results');
        setSearchResults([]);
        setPagination(null);
      }
    } catch (err) {
      console.error('Error during search:', err);
      setError('An unexpected error occurred during search.');
      setSearchResults([]);
      setPagination(null);
    } finally {
      setLoading(false);
    }
  };

  // Trigger search when currentPage or itemsPerPage changes (for pagination)
  useEffect(() => {
    if (searchQuery.trim()) {
      handleSearch(currentPage);
    }
  }, [currentPage, itemsPerPage]); // Add searchQuery to dependencies if you want search to re-run when query changes after initial search

  // State for the borrow modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedBook, setSelectedBook] = useState<Book | null>(null);
  const [borrowUserId, setBorrowUserId] = useState('');
  const [dueDate, setDueDate] = useState('');

  // Function to handle borrowing a book
  const openBorrowModal = (book: Book) => {
    if (!user) {
      alert('You must be logged in to borrow books.');
      router.push('/loginpg'); // Redirect to login if not logged in
      return;
    }

    if (!book.is_available || book.stock <= 0) {
        alert('This book is currently not available or out of stock.');
        return;
    }

    setSelectedBook(book);
    // Set default due date (14 days from now)
    const defaultDueDate = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    setDueDate(defaultDueDate);
    setBorrowUserId(''); // Clear previous user ID
    setIsModalOpen(true);
  };

  // Function to handle the submission of the borrow form from the modal
  const handleConfirmBorrow = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault(); // Prevent default form submission

    if (!selectedBook || !borrowUserId.trim() || !dueDate) {
      alert('User ID and Due Date are required.');
      return;
    }

    const userId = parseInt(borrowUserId, 10);
    if (isNaN(userId)) {
      alert('Invalid User ID format.');
      return;
    }

    setLendingStatus('Processing...');
    setIsModalOpen(false); // Close modal before API call

    try {
      const response = await fetch('/api/lendi/c', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          user_id: userId,
          book_id: selectedBook.id,
          due_date: dueDate,
        }),
      });

      const result = await response.json();

      if (response.ok) {
        const successData = result as LendingSuccessResponse;
        setLendingStatus(`Book '${selectedBook.title}' borrowed successfully! Lending ID: ${successData.lending_id}`);
        alert(`Book '${selectedBook.title}' borrowed successfully! Lending ID: ${successData.lending_id}`);
        handleSearch(currentPage); // Refresh search results
      } else {
        const errorData = result as LendingErrorResponse;
        setLendingStatus(`Failed to borrow book: ${errorData.error || 'Unknown error'}`);
        alert(`Failed to borrow book: ${errorData.error || 'Unknown error'}`);
      }
    } catch (err: any) {
      console.error('Error borrowing book:', err);
      const errorMessage = err.response?.data?.error || err.message || 'An unexpected error occurred';
      setLendingStatus(`An error occurred: ${errorMessage}`);
      alert(`An error occurred: ${errorMessage}`);
    } finally {
      setSelectedBook(null);
      setBorrowUserId('');
      setDueDate('');
    }
  };

  return (
    <div>
      {/* Navbar with blue gradient and logo */}
      <nav className="bg-gradient-to-r from-blue-500 to-blue-700 p-4 text-white shadow-lg">
        <div className="container mx-auto flex justify-between items-center">
          {/* Site Title or Logo */}
          <div className="text-2xl font-bold">
            Library Admin
          </div>

          {/* Navigation Links */}
          <div className="flex items-center space-x-4">
            <ul className="flex space-x-4">
              <li>
                {/* Updated classes for elevated white button with blue text and fixed size */}
                <Link href="/" className="px-3 py-1 rounded shadow bg-white text-blue-700 hover:bg-gray-100 transition-colors w-32 h-10 flex items-center justify-center font-bold">
                  Home
                </Link>
              </li>
              {/* Conditionally render Book Manage link based on user rank */}
              {user && user.userrank >= 3 && (
                <li>
                  {/* Updated classes for elevated white button with blue text and fixed size */}
                  {/* <Link href="/bookmanagepg" className="px-3 py-1 rounded shadow bg-white text-blue-700 hover:bg-gray-100 transition-colors w-32 h-10 flex items-center justify-center">
                    Book Manage
                  </Link> */}
                </li>
              )}
              <li>
                {/* Added Lend Info button */}
                <Link href="/borrowpg/lendi-r-one" className="px-3 py-1 font-bold rounded shadow bg-white text-blue-700 hover:bg-gray-100 transition-colors w-32 h-10 flex items-center justify-center">
                  Lend Info
                </Link>
              </li>
              {/* Add other navigation links as needed */}
            </ul>
          </div>
        </div>
      </nav>

      {/* Page Body */}
      <div style={{ padding: '20px' }}>
        <h1>Explore Books by Search</h1>
        {/* Search Bar */}
        <div className="flex items-center mt-4">
          <input
            type="text"
            placeholder="input book name or author or ISBN"
            className="px-3 py-2 rounded-l shadow text-gray-700 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-600 w-full bg-blue-100"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyPress={(e) => { if (e.key === 'Enter') { handleSearch(); } }}
          />
          <button
            className="px-4 py-2 rounded-r shadow bg-blue-700 text-white hover:bg-blue-800 transition-colors"
            onClick={() => handleSearch()}
            disabled={loading}
          >
            {loading ? 'Searching...' : 'Search'}
          </button>
        </div>

        {/* Display Lending Status */}
        {lendingStatus && <p className={`mt-4 ${lendingStatus.startsWith('Failed') || lendingStatus.startsWith('An error') ? 'text-red-500' : 'text-green-500'}`}>{lendingStatus}</p>}

        {/* Display Search Results */}
        <div className="mt-8">
          {error && <p className="text-red-500">Error: {error}</p>}

          {!loading && searchResults.length > 0 && (
            <div className="overflow-x-auto">
              <table className="min-w-full bg-white border border-gray-200">
                <thead>
                  <tr>
                    <th className="py-2 px-4 border-b text-left">ID</th>
                    <th className="py-2 px-4 border-b text-left">Title</th>
                    <th className="py-2 px-4 border-b text-left">Author</th>
                    <th className="py-2 px-4 border-b text-left">ISBN</th>
                    <th className="py-2 px-4 border-b text-left">Available</th>
                    <th className="py-2 px-4 border-b text-left">Stock</th>
                    <th className="py-2 px-4 border-b text-left">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {searchResults.map((book) => (
                    <tr key={book.id} className="hover:bg-gray-100">
                      <td className="py-2 px-4 border-b text-left">{book.id}</td>
                      <td className="py-2 px-4 border-b text-left">{book.title}</td>
                      <td className="py-2 px-4 border-b text-left">{book.author}</td>
                      <td className="py-2 px-4 border-b text-left">{book.isbn || 'N/A'}</td>
                      <td className="py-2 px-4 border-b text-left">{book.is_available ? 'Yes' : 'No'}</td>
                      <td className="py-2 px-4 border-b text-left">{book.stock}</td>
                      <td className="py-2 px-4 border-b text-left">
                        {/* Ensure 'user' is in scope here from useState */}
                        {book.is_available && book.stock > 0 && user && user.userrank > 2 ? (
                          <button
                            onClick={() => openBorrowModal(book)} // Changed to openBorrowModal
                            className="px-3 py-1 rounded shadow bg-green-500 text-white hover:bg-green-600 transition-colors text-sm"
                          >
                            lend
                          </button>
                        ) : (
                          <button
                            className="px-3 py-1 rounded shadow bg-gray-400 text-white text-sm cursor-not-allowed"
                            disabled
                          >
                            lend
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {!loading && searchResults.length === 0 && searchQuery.trim() && !error && (
            <p className="text-gray-600">No results found for "{searchQuery}".</p>
          )}

          {/* Pagination Controls */}
          {pagination && pagination.total_pages > 1 && (
            <div className="flex justify-center mt-4 space-x-2">
              <button
                onClick={() => handleSearch(currentPage - 1)}
                disabled={currentPage <= 1 || loading}
                className="px-4 py-2 rounded shadow bg-blue-500 text-white disabled:opacity-50"
              >
                Previous
              </button>
              <span className="py-2 px-4">
                Page {currentPage} of {pagination.total_pages}
              </span>
              <button
                onClick={() => handleSearch(currentPage + 1)}
                disabled={currentPage >= pagination.total_pages || loading}
                className="px-4 py-2 rounded shadow bg-blue-500 text-white disabled:opacity-50"
              >
                Next
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Borrow Modal */} 
      {isModalOpen && selectedBook && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full flex justify-center items-center z-50">
          <div className="relative p-8 border w-full max-w-md shadow-lg rounded-md bg-white">
            <div className="text-center">
              <h3 className="text-2xl font-bold text-gray-900">Borrow Book: {selectedBook.title}</h3>
              <form onSubmit={handleConfirmBorrow} className="mt-4 space-y-4">
                <div>
                  <label htmlFor="userId" className="block text-sm font-medium text-gray-700 text-left">User ID:</label>
                  <input
                    type="number"
                    id="userId"
                    name="userId"
                    value={borrowUserId}
                    onChange={(e) => setBorrowUserId(e.target.value)}
                    required
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                  />
                </div>
                <div>
                  <label htmlFor="dueDate" className="block text-sm font-medium text-gray-700 text-left">Due Date:</label>
                  <input
                    type="date"
                    id="dueDate"
                    name="dueDate"
                    value={dueDate}
                    onChange={(e) => setDueDate(e.target.value)}
                    required
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                    min={new Date().toISOString().split('T')[0]} // Prevent selecting past dates
                  />
                </div>
                <div className="items-center gap-4 flex">
                  <button
                    type="submit"
                    className="w-full px-4 py-2 bg-green-500 text-white text-base font-medium rounded-md shadow-sm hover:bg-green-600 focus:outline-none focus:ring-2 focus:ring-green-300"
                  >
                    Confirm Borrow
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setIsModalOpen(false);
                      setSelectedBook(null);
                    }}
                    className="w-full px-4 py-2 bg-gray-300 text-gray-800 text-base font-medium rounded-md shadow-sm hover:bg-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-300"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BorrowPage;