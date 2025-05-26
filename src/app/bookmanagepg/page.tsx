'use client'; // Add this line to make it a client component

import React, { useState, useEffect } from 'react'; // Import useState and useEffect
import Link from 'next/link'; // Import Link for navigation

// Define a type for the book data
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


// Define a type for the API response
interface BooksApiResponse {
  books: Book[];
  pagination: {
    current_page: number;
    items_per_page: number;  
    total_items: number;
    total_pages: number;
  };
}

// Define a type for the error response
interface ErrorResponse {
  error: string;
}

const BookManagePage = () => {
  const [books, setBooks] = useState<Book[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [booksPerPage,setBooksPerPage] = useState(10); // Number of books per page
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false); // State for modal visibility
  const [totalItems, setTotalItems] = useState(0); // Add state for total items
  const [totalPages, setTotalPages] = useState(0); // Add state for total pages
  const [newBook, setNewBook] = useState({
    // State for new book form inputs
    title: '',
    author: '',
    description: '', // Added description
    isbn: '',
    publication_year: '', // Renamed from published_year
    genre: '',
    is_available: true, // Added is_available, defaulting to true
    stock: 0, // Initialize stock as a number
  });
  const [createLoading, setCreateLoading] = useState(false); // State for create book loading
  const [createError, setCreateError] = useState<string | null>(null); // State for create book error

  // Use effect to fetch books when the page or books per page changes
  useEffect(() => {
    fetchBooks(currentPage, booksPerPage);
  }, [currentPage, booksPerPage]);

  // Function to fetch books
  const fetchBooks = async (page: number, limit: number) => {
    setLoading(true);
    setError(null);
    const url = `/api/book/r-all?page=${page}&limit=${limit}`;
    console.log('Fetching books from URL:', url); // Log the URL

    try {
      const response = await fetch(url);
      console.log('API Response Status:', response.status); // Log the response status

      if (!response.ok) {
        const errorData = await response.json() as ErrorResponse;
        throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
      }

      const data = await response.json() as BooksApiResponse;
      console.log('API Response Data:', data); // Log the response data

      // Assuming the API returns an array of books and total count
      setBooks(data.books);
      setTotalItems(data.pagination.total_items);
      setTotalPages(Math.ceil(data.pagination.total_items / booksPerPage));

      // currentPage, booksPerPage
      console.log('Setting currentPage and booksPerPage:@bookmanagepg===', page, limit);
      setCurrentPage(page);
      setBooksPerPage(limit);
      
    } catch (err: any) {
      setError(err.message || 'Failed to fetch books');
      console.error('Failed to fetch books:', err);
    } finally {
      setLoading(false);
    }
  };

  // Handle input changes for the new book form
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    // Handle checkbox input specifically for boolean value
    // Handle number input by converting value to number, default to 0 if empty or invalid
    const newValue = type === 'checkbox' ? (e.target as HTMLInputElement).checked : (type === 'number' ? parseInt(value, 10) || 0 : value);
    setNewBook((prev) => ({
      ...prev,
      [name]: newValue,
    }));
  };

  // Handle new book form submission
  const handleCreateBook = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreateLoading(true);
    setCreateError(null);

    try {
      const response = await fetch('/api/book/c', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...newBook,
          publication_year: parseInt(newBook.publication_year as any, 10), // Convert year to number
          // stock is already a number from state
          // is_available is already boolean from input change
        }),
      });

      if (!response.ok) {
        const errorData = await response.json() as ErrorResponse;
        throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
      }

      // Assuming successful creation returns the new book or a success message
      // const result = await response.json();
      alert('Book created successfully!');
      setIsModalOpen(false); // Close modal on success
      setNewBook({ // Reset form
        title: '',
        author: '',
        description: '', // Reset description
        isbn: '',
        publication_year: '',
        genre: '',
        is_available: true, // Reset is_available
        stock: 0, // Reset stock
      });


      fetchBooks(currentPage, booksPerPage); // Refresh the book list after creation with current pagination

    } catch (err: any) {
      setCreateError(err.message || 'Failed to create book');
      alert(`Failed to create book: ${err.message}`);
      console.error('Failed to create book:', err);
    } finally {
      setCreateLoading(false);
    }
  };

  // Function to handle book deletion
  const handleDeleteBook = async (bookId: number) => {
    if (window.confirm('Are you sure you want to delete this book?')) {
      try {
        const response = await fetch(`/api/book/d?id=${bookId}`, { // Modified URL to use query parameter
          method: 'DELETE',
        });

        if (!response.ok) {
          const errorData = await response.json() as ErrorResponse;
          throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
        }

        alert('Book deleted successfully!');
        fetchBooks(currentPage, booksPerPage); // Refresh the book list after deletion with current pagination
      } catch (err: any) {
        alert(`Failed to delete book: ${err.message}`);
        console.error('Failed to delete book:', err);
      }
    }
  };

  // Get current books for pagination
  // const indexOfLastBook = currentPage * booksPerPage;
  // console.log('indexOfLastBook@bookmanagepg===', indexOfLastBook); // Log the index of the last book
  // const indexOfFirstBook = indexOfLastBook - booksPerPage;
  // console.log('indexOfFirstBook@bookmanagepg===', indexOfFirstBook); // Log the index of the last book
  // const currentBooks = books.slice(indexOfFirstBook, indexOfLastBook);
  // console.log('currentBooks@bookmanagepg===0===', currentBooks); // Log the current books
  // console.log('currentPage@bookmanagepg==1=', currentPage); // Log the current books
  // console.log('currentPage', currentPage); // Log the current books
 
  // Change page
  // const paginate = (pageNumber: number) => setCurrentPage(pageNumber);
  const paginate = (pageNumber: number) =>{
    console.log('currentPage@bookmanagepg==2=', currentPage); // Log the current books
    // setCurrentPage(pageNumber);
    if (pageNumber >= 1 && pageNumber <= totalPages) {
      setCurrentPage(pageNumber);
    }
  } 
 
  // setCurrentPage(currentPage);

  // Calculate total pages
  // REMOVE this line: const totalPages = Math.ceil(books.length / booksPerPage);

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
          <div>
            <ul className="flex space-x-4">
              <li>
                {/* Updated classes for elevated white button with blue text and fixed size */}
                <Link href="/" className="font-bold px-3 py-2 rounded shadow bg-white text-blue-700 hover:bg-gray-100 transition-colors w-32 h-10 flex items-center justify-center">
                  Home
                </Link>
              </li>
              {/* Removed Book Manage button */}
              <li>
                {/* Updated classes for elevated white button with blue text and fixed size */}
                <button
                  onClick={() => fetchBooks(currentPage, booksPerPage)} // Wrap fetchBooks call in an arrow function
                  className="px-3 py-2 rounded shadow bg-white text-blue-700 hover:bg-gray-100 transition-colors focus:outline-none w-32 h-10 flex items-center justify-center font-bold"
                >
                  List All Books
                </button>
              </li>
              <li>
                {/* Button to open the create book modal */}
                <button
                  onClick={() => setIsModalOpen(true)}
                  className="px-3 py-2 rounded shadow bg-white text-blue-700 hover:bg-gray-100 transition-colors focus:outline-none w-32 h-10 flex items-center justify-center font-bold"
                >
                  Create New Book
                </button>
              </li>
              {/* Add other navigation links as needed */}
            </ul>
          </div>
        </div>
      </nav>

      {/* Page Body */}
      <div style={{ padding: '20px' }}>
        {/* Removed: <h1>Hello World</h1> */}
        {/* Removed: <p>This is the Book Management Page.</p> */}

        {/* Display Loading, Error, or Books Table */}
        {loading && <p>Loading books...</p>}
        {error && <p className="text-red-500">Error: {error}</p>}

        {!loading && !error && books.length > 0 && (
          <div className="mt-8">
            <h2 className="text-xl font-semibold mb-4">Book List</h2>
            <table className="min-w-full bg-white border border-gray-300">
              <thead>
                <tr>
                  <th className="px-4 py-2 text-left">ID</th>
                  <th className="px-4 py-2 text-left">Title</th>
                  <th className="px-4 py-2 text-left">Description</th>
                  <th className="px-4 py-2 text-left">Author</th>
                  <th className="px-4 py-2 text-left">ISBN</th>
                  <th className="px-4 py-2 text-left">Publication Year</th>
                  <th className="px-4 py-2 text-left">Genre</th>
                  <th className="px-4 py-2 text-left">Available</th>
                  <th className="px-4 py-2 text-left">Stock</th> {/* Add Stock header */}
                  <th className="px-4 py-2 text-left">Actions</th>
                </tr>
              </thead>
              <tbody>
                {books.map((book) => (
                  <tr key={book.id}>
                    <td className="py-2 px-4 border-b text-center">{book.id}</td><td className="py-2 px-4 border-b">{book.title}</td><td className="py-2 px-4 border-b">{book.description}</td><td className="py-2 px-4 border-b">{book.author}</td><td className="py-2 px-4 border-b">{book.isbn}</td><td className="py-2 px-4 border-b text-center">{book.publication_year}</td><td className="py-2 px-4 border-b">{book.genre}</td><td className="py-2 px-4 border-b text-center">{book.is_available ? 'Yes' : 'No'}</td><td className="py-2 px-4 border-b text-center">{book.stock}</td> {/* Display Stock value */}
                    <td className="border-b px-4 py-2">
                    <button
                      onClick={() => {
                        window.location.href = `/bookmanagepg/updatepg?id=${book.id}`;
                      }}
                      className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-1 px-2 rounded mr-2"
                    >
                      Edit
                    </button>
                      <button
                        onClick={() => handleDeleteBook(book.id)}
                        className="bg-red-500 hover:bg-red-700 text-white font-bold py-1 px-2 rounded"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Pagination Controls */}
            <div className="flex justify-center mt-4 space-x-2">
              <button
                onClick={() => paginate(currentPage - 1)}
                disabled={currentPage === 1}
                className="px-4 py-2 bg-blue-500 text-white rounded disabled:opacity-50"
              >
                Previous
              </button>
              <span>Page {currentPage} of {totalPages}</span>
              <button
                onClick={() => paginate(currentPage + 1)}
                disabled={currentPage === totalPages}
                className="px-4 py-2 bg-blue-500 text-white rounded disabled:opacity-50"
              >
                Next
              </button>
            </div>
          </div>
        )}

        {!loading && !error && books.length === 0 && (
           <p className="mt-8">No books found. Click 'List All Books' to fetch.</p>
        )}

      </div>

      {/* Create Book Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full flex justify-center items-center">
          <div className="bg-white p-8 rounded-lg shadow-xl w-full max-w-lg">
            <h2 className="text-2xl font-bold mb-4 text-gray-800">Create New Book</h2>
            <form onSubmit={handleCreateBook}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Column 1 */}
                <div>
                  <div className="mb-4">
                    <label htmlFor="title" className="block text-gray-700 text-sm font-bold mb-2">Title:</label>
                    <input
                      type="text"
                      id="title"
                      name="title"
                      value={newBook.title}
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
                      value={newBook.author}
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
                      value={newBook.isbn}
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
                      value={newBook.publication_year}
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
                      value={newBook.description}
                      onChange={handleInputChange}
                      className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                      rows={4} // Added rows for better text area size
                    />
                  </div>
                  <div className="mb-4">
                    <label htmlFor="genre" className="block text-gray-700 text-sm font-bold mb-2">Genre:</label>
                    <input
                      type="text"
                      id="genre"
                      name="genre"
                      value={newBook.genre}
                      onChange={handleInputChange}
                      className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                      required
                    />
                  </div>
                  <div className="mb-4">
                    <label htmlFor="stock" className="block text-gray-700 text-sm font-bold mb-2">Stock:</label>
                    <input
                      type="number"
                      id="stock"
                      name="stock"
                      value={newBook.stock}
                      onChange={handleInputChange}
                      className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                      required
                    />
                  </div>
                  <div className="mb-4">
                    <label htmlFor="is_available" className="block text-gray-700 text-sm font-bold mb-2">Is Available:</label>
                    <input
                      type="checkbox"
                      id="is_available"
                      name="is_available"
                      checked={newBook.is_available}
                      onChange={handleInputChange}
                      className="leading-tight"
                    />
                  </div>
                </div>
              </div>
              {createError && <p className="text-red-500 text-sm mb-4">Error: {createError}</p>}
              <div className="flex items-center justify-between">
                <button
                  type="submit"
                  className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
                  disabled={createLoading}
                >
                  {createLoading ? 'Creating...' : 'Create Book'}
                </button>
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="inline-block align-baseline font-bold text-sm text-blue-500 hover:text-blue-800"
                  disabled={createLoading}
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
  
    </div>
  );
};

export default BookManagePage;
