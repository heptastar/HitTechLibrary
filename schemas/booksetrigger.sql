
-- Create triggers to keep the FTS index in sync with the books table

-- Trigger to update books_fts after an INSERT on books
CREATE TRIGGER books_ai AFTER INSERT ON books BEGIN INSERT INTO books_fts (rowid, title, description, author, isbn)VALUES (new.id, new.title, new.description, new.author, new.isbn);END;

-- Trigger to update books_fts after a DELETE on books
CREATE TRIGGER books_ad AFTER DELETE ON books BEGIN DELETE FROM books_fts WHERE rowid = old.id;END;

-- Trigger to update books_fts after an UPDATE on books
CREATE TRIGGER books_au AFTER UPDATE ON books BEGIN DELETE FROM books_fts WHERE rowid = old.id;INSERT INTO books_fts (rowid, title, description, author, isbn) VALUES (new.id, new.title, new.description, new.author, new.isbn);END;

-- Optional: Initial population of the FTS table from existing data
-- INSERT INTO books_fts (rowid, title, description, author, isbn) SELECT id, title, description, author, isbn FROM books;