-- Migration script for creating the lendings table

CREATE TABLE lendings (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    book_id INTEGER NOT NULL,
    borrowed_date TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    due_date TEXT,
    returned_date TEXT,
    status TEXT NOT NULL DEFAULT 'borrowed', -- e.g., 'borrowed', 'returned', 'overdue'
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (book_id) REFERENCES books(id) ON DELETE CASCADE
);

-- Optional: Add indexes for performance on foreign keys
CREATE INDEX idx_lendings_user_id ON lendings(user_id);
CREATE INDEX idx_lendings_book_id ON lendings(book_id);