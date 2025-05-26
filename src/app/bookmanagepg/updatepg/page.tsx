'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation'; // Import useRouter for navigation

// Define a type for the book data (can be imported if in a shared file)
interface Book {
  id: number;
  title: string;
  description: string;
  author: string;
  isbn: string;
  publication_year: number;
  genre: string;
  is_available: boolean;
  created_at: string;
  updated_at: string;
  stock: number; // Add the stock field
}

// Define a type for the error response
interface ErrorResponse {
  error: string;
}

const UpdateBookPage = () => {
  const router = useRouter(); // Initialize useRouter
  const [bookId, setBookId] = useState<string | null>(null);
  const [book, setBook] = useState<Book | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState<Partial<Book>>({}); // State for form data
  const [updateLoading, setUpdateLoading] = useState(false); // State for update loading
  const [updateError, setUpdateError] = useState<string | null>(null); // State for update error

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const id = urlParams.get('id');
    setBookId(id);

    if (id) {
      const fetchBook = async () => {
        setLoading(true);
        setError(null);
        try {
          const response = await fetch(`/api/book/r-one?id=${id}`);
          if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
          }
          const data = await response.json() as Book; // Explicitly cast data to Book type
          setBook(data);
          setFormData(data); // Initialize form data with fetched book data
        } catch (err: any) {
          setError(err.message);
          console.error('Failed to fetch book:', err);
        } finally {
          setLoading(false);
        }
      };
      fetchBook();
    } else {
      setError('No book ID provided.');
      setLoading(false);
    }
  }, [bookId]); // Depend on bookId to refetch if it changes

  // Handle form input changes
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    const newValue = type === 'checkbox' ? (e.target as HTMLInputElement).checked : value;
    setFormData((prev) => ({ ...prev, [name]: newValue }));
  };

  // Handle form submission (Update Book)
  const handleUpdateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setUpdateLoading(true);
    setUpdateError(null);

    if (!bookId) {
      setUpdateError('Book ID is missing.');
      setUpdateLoading(false);
      return;
    }

    try {
      const response = await fetch('/api/book/up', {
        method: 'PUT', // Use PUT method for updates
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          id: parseInt(bookId, 10), // Include the book ID
          ...formData,
          // Ensure publication_year is a number if it's not already
          publication_year: typeof formData.publication_year === 'string' ? parseInt(formData.publication_year, 10) : formData.publication_year,
          // is_available is already boolean from input change
          // Ensure stock is a number if it's not already
          stock: typeof formData.stock === 'string' ? parseInt(formData.stock, 10) : formData.stock,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json() as ErrorResponse;
        throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
      }

      // Assuming successful update returns the updated book or a success message
      // const result = await response.json();
      alert('Book updated successfully!');
      router.push('/bookmanagepg'); // Navigate back to the book management page

    } catch (err: any) {
      setUpdateError(err.message);
      console.error('Failed to update book:', err);
    } finally {
      setUpdateLoading(false);
    }
  };

  return (
    <div>
      {/* Gradient Blue Navbar Placeholder */}
      <nav className="bg-gradient-to-r from-blue-500 to-blue-700 text-white p-4">
        <div className="container mx-auto">
          <h1 className="text-xl font-bold">Update Book</h1>
        </div>
      </nav>

      <main className="container mx-auto p-4">
        <h2 className="text-2xl font-bold mb-4">Update Book</h2>

        {loading && <p>Loading book data...</p>}
        {error && <p className="text-red-500">Error: {error}</p>}

        {!loading && !error && book && (
          <form onSubmit={handleUpdateSubmit} className="max-w-2xl mx-auto">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Column 1 */}
              <div>
                <div className="mb-4">
                  <label htmlFor="title" className="block text-gray-700 text-sm font-bold mb-2">Title:</label>
                  <input
                    type="text"
                    id="title"
                    name="title"
                    value={formData.title || ''}
                    onChange={handleInputChange}
                    className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                    required
                  />
                </div>
                <div className="mb-4">
                  <label htmlFor="author" className="block text-gray-700 text-sm font-bold mb-2">Author:</label>
                  <input
                    type="text"
                    id="author"
                    name="author"
                    value={formData.author || ''}
                    onChange={handleInputChange}
                    className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                    required
                  />
                </div>
                <div className="mb-4">
                  <label htmlFor="isbn" className="block text-gray-700 text-sm font-bold mb-2">ISBN:</label>
                  <input
                    type="text"
                    id="isbn"
                    name="isbn"
                    value={formData.isbn || ''}
                    onChange={handleInputChange}
                    className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                    required
                  />
                </div>
                <div className="mb-4">
                  <label htmlFor="publication_year" className="block text-gray-700 text-sm font-bold mb-2">Published Year:</label>
                  <input
                    type="number"
                    id="publication_year"
                    name="publication_year"
                    value={formData.publication_year || ''}
                    onChange={handleInputChange}
                    className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                    required
                  />
                </div>
              </div>

              {/* Column 2 */}
              <div>
                <div className="mb-4">
                  <label htmlFor="description" className="block text-gray-700 text-sm font-bold mb-2">Description:</label>
                  <textarea
                    id="description"
                    name="description"
                    value={formData.description || ''}
                    onChange={handleInputChange}
                    className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                    rows={4}
                  />
                </div>
                <div className="mb-4">
                  <label htmlFor="genre" className="block text-gray-700 text-sm font-bold mb-2">Genre:</label>
                  <input
                    type="text"
                    id="genre"
                    name="genre"
                    value={formData.genre || ''}
                    onChange={handleInputChange}
                    className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                    required
                  />
                </div>
                {/* Add input for stock */}
                <div className="mb-4">
                  <label htmlFor="stock" className="block text-gray-700 text-sm font-bold mb-2">Stock:</label>
                  <input
                    type="number"
                    id="stock"
                    name="stock"
                    value={formData.stock || ''}
                    onChange={handleInputChange}
                    className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                    required
                  />
                </div>
                <div className="mb-4">
                  <label htmlFor="is_available" className="block text-gray-700 text-sm font-bold mb-2">Available:</label>
                  <input
                    type="checkbox"
                    id="is_available"
                    name="is_available"
                    checked={formData.is_available || false}
                    onChange={handleInputChange}
                    className="mr-2 leading-tight"
                  />
                  <span className="text-sm text-gray-700">Is Available</span>
                </div>
              </div>
            </div>

            {updateError && <p className="text-red-500 text-sm mb-4">Error: {updateError}</p>}

            <div className="flex items-center justify-between mt-6">
              <button
                type="submit"
                className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
                disabled={updateLoading}
              >
                {updateLoading ? 'Updating...' : 'Update Book'}
              </button>
              {/* Add a cancel button or link back to book management page */}
              <button
                type="button"
                onClick={() => router.push('/bookmanagepg')}
                className="inline-block align-baseline font-bold text-sm text-blue-500 hover:text-blue-800"
                disabled={updateLoading}
              >
                Cancel
              </button>
            </div>
          </form>
        )}

        {!loading && !error && !book && bookId && (
          <p>Book with ID {bookId} not found.</p>
        )}

      </main>
    </div>
  );
};

export default UpdateBookPage;