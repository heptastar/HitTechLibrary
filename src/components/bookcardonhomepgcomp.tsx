import React from 'react';

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
  stock: number;
}

interface BookCardProps {
  book: Book;
}

const BookCardOnHomePgComp: React.FC<BookCardProps> = ({ book }) => {
  return (
    <div className="border rounded-lg p-4 shadow-md bg-white">
      <h3 className="text-lg font-semibold text-gray-800 mb-1">{book.title}</h3>
      <p className="text-gray-600 text-sm mb-1">by {book.author}</p>
      {book.publication_year && <p className="text-gray-600 text-sm mb-1">Published: {book.publication_year}</p>}
      {book.genre && <p className="text-gray-600 text-sm mb-1">Genre: {book.genre}</p>}
      {book.isbn && <p className="text-gray-600 text-sm mb-1">ISBN: {book.isbn}</p>}
      {book.description && <p className="text-gray-700 text-sm mt-2">{book.description}</p>}
      <p className="text-gray-700 text-sm mt-2">Stock: {book.stock}</p>
      <p className={`text-sm mt-1 ${book.is_available ? 'text-green-600' : 'text-red-600'}`}>
        Status: {book.is_available ? 'Available' : 'Not Available'}
      </p>
    </div>
  );
};

export default BookCardOnHomePgComp;