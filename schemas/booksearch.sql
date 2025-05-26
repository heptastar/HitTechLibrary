-- Create the FTS5 virtual table for full-text search
CREATE VIRTUAL TABLE books_fts USING fts5(
    title,
    description,
    author,
    isbn,
    content='books', -- Link to the original books table
    content_rowid='id',
    tokenize='unicode61'
);
