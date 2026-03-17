import React, { useState, useEffect } from 'react';
import { useToast } from '../context/ToastContext';
import BookList from '../components/Books/BookList';
import AddBookForm from '../components/Books/AddBookForm';
import EditBookForm from '../components/Books/EditBookForm';
import { booksAPI } from '../utils/api';

const BookManagementPage = () => {
  const [books, setBooks] = useState([]);
  const [filteredBooks, setFilteredBooks] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [booksLoading, setBooksLoading] = useState(true);
  const [editingBook, setEditingBook] = useState(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [error, setError] = useState(null);
  const { showToast } = useToast();

  // Load books data
  const fetchBooks = async () => {
    try {
      setBooksLoading(true);
      setError(null);
      const data = await booksAPI.getAll();
      setBooks(data);
    } catch (err) {
      console.error('Failed to load books:', err);
      const errorMessage = 'Failed to load books. Please try again.';
      setError(errorMessage);
      showToast(errorMessage, 'error');
    } finally {
      setBooksLoading(false);
    }
  };

  // Handle book addition
  const handleBookAdded = (newBook) => {
    setBooks(prevBooks => [...prevBooks, newBook]);
  };

  // Handle book update
  const handleBookUpdated = (updatedBook) => {
    setBooks(prevBooks => prevBooks.map(book => 
      book.id === updatedBook.id ? updatedBook : book
    ));
  };

  // Handle book deletion
  const handleBookDeleted = (bookId) => {
    setBooks(prevBooks => prevBooks.filter(book => book.id !== bookId));
  };

  // Load books on component mount
  useEffect(() => {
    fetchBooks();
  }, []);

  // Handle book edit
  const handleBookEdit = (updatedBook) => {
    setBooks(prevBooks => prevBooks.map(book => 
      book.id === updatedBook.id ? updatedBook : book
    ));
  };

  // Handle search
  const handleSearch = (e) => {
    const term = e.target.value;
    setSearchTerm(term);
    if (term.trim() === '') {
      setFilteredBooks(books);
    } else {
      const filtered = books.filter(book => 
        book.title.toLowerCase().includes(term.toLowerCase()) ||
        book.author.toLowerCase().includes(term.toLowerCase()) ||
        book.isbn.includes(term)
      );
      setFilteredBooks(filtered);
    }
  };

  // Update filtered books when books list changes
  useEffect(() => {
    setFilteredBooks(books);
  }, [books]);

  if (error) {
    return (
      <div className="book-management-section card fade-in">
        <h2>Book Management</h2>
        <div className="error-message">
          {error}
          <button onClick={fetchBooks} className="btn-primary">Retry</button>
        </div>
      </div>
    );
  }

  return (
    <div className="book-management-section card fade-in">
      <h2>Book Management</h2>
      
      {/* Action Bar */}
      <div className="action-bar">
        <button 
          className="btn-primary"
          onClick={() => setShowAddForm(!showAddForm)}
        >
          {showAddForm ? 'Cancel' : 'Add New Book'}
        </button>
        <div className="search-bar">
          <input
            type="text"
            placeholder="Search books by title, author, or ISBN..."
            value={searchTerm}
            onChange={handleSearch}
            className="search-input"
          />
        </div>
      </div>
      
      {/* Add Book Form */}
      {showAddForm && (
        <AddBookForm 
          onBookAdded={(newBook) => {
            handleBookAdded(newBook);
            setShowAddForm(false);
          }}
        />
      )}
      
      {/* Edit Book Form */}
      {editingBook && (
        <EditBookForm 
          book={editingBook}
          onEditComplete={(updatedBook) => {
            handleBookEdit(updatedBook);
            setEditingBook(null);
          }}
          onCancel={() => setEditingBook(null)}
        />
      )}

      {/* Book List (with edit functionality) */}
      <BookList 
        books={filteredBooks}
        loading={booksLoading}
        onBookUpdated={handleBookUpdated}
        onBookDeleted={handleBookDeleted}
        showEditButton={true}
        onEditBook={setEditingBook}
      />
    </div>
  );
};

export default BookManagementPage;