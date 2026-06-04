import React, { useState, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { useToast } from '../context/ToastContext';
import BookList from '../components/Books/BookList';
import AddBookForm from '../components/Books/AddBookForm';
import EditBookForm from '../components/Books/EditBookForm';
import CopyManagementModal from '../components/Books/CopyManagementModal';
import { booksAPI } from '../utils/api';

const BookManagementPage = () => {
  const [books, setBooks] = useState([]);
  const [filteredBooks, setFilteredBooks] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [booksLoading, setBooksLoading] = useState(true);
  const [editingBook, setEditingBook] = useState(null);
  const [managingCopiesBook, setManagingCopiesBook] = useState(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const { showToast } = useToast();

  // Load books data
  const fetchBooks = useCallback(async () => {
    try {
      setBooksLoading(true);
      const data = await booksAPI.getAll();
      setBooks(data);
    } catch (err) {
      console.error('Failed to load books:', err);
      const errorMessage = 'Failed to load books. Please try again.';
      showToast(errorMessage, 'error');
    } finally {
      setBooksLoading(false);
    }
  }, [showToast]);

  // Handle book addition
  const handleBookAdded = (newBook) => {
    if (newBook) {
      setBooks(prevBooks => [...prevBooks, newBook]);
    } else {
      fetchBooks();
    }
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
  }, [fetchBooks]);

  // Handle book edit
  const handleBookEdit = (updatedBook) => {
    setBooks(prevBooks => prevBooks.map(book => 
      book.id === updatedBook.id ? updatedBook : book
    ));
  };

  // Handle search input change
  const handleSearchChange = (e) => {
    const term = e.target.value;
    setSearchTerm(term);
  };

  // Handle search button click
  const handleSearchClick = () => {
    if (searchTerm.trim() === '') {
      setFilteredBooks(books);
    } else {
      const filtered = books.filter(book => 
        book.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        book.author.toLowerCase().includes(searchTerm.toLowerCase()) ||
        book.isbn.includes(searchTerm)
      );
      setFilteredBooks(filtered);
    }
  };

  // Update filtered books when books list changes
  useEffect(() => {
    setFilteredBooks(books);
  }, [books]);



  return (
    <div className="book-management-section card fade-in">
      <h2>Book Management</h2>
      
      {/* Action Bar */}
      <div className="action-bar">
        <div className="action-buttons">
          <button 
            className="btn-primary"
            onClick={() => setShowAddForm(true)}
          >
            Add New Book
          </button>
          {/* 暂时隐藏导出按钮，待权限问题解决后再恢复 */}
          {/* <button 
            className="btn-secondary"
            onClick={async () => {
              try {
                // 使用booksAPI.export()方法来调用导出接口
                const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api';
                const token = sessionStorage.getItem('user') ? JSON.parse(sessionStorage.getItem('user')).token : '';
                
                const response = await fetch(`${API_BASE_URL}/books/export`, {
                  method: 'GET',
                  headers: {
                    'Authorization': `Bearer ${token}`,
                    'Accept': 'text/csv'
                  }
                });
                
                if (!response.ok) {
                  const errorData = await response.json().catch(() => ({}));
                  throw new Error(errorData.error || `Request failed with status ${response.status}`);
                }
                
                const blob = await response.blob();
                const url = window.URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.style.display = 'none';
                a.href = url;
                a.download = `books_${new Date().toISOString().split('T')[0]}.csv`;
                document.body.appendChild(a);
                a.click();
                window.URL.revokeObjectURL(url);
              } catch (error) {
                console.error('Export failed:', error);
                showToast('Export failed. Please try again.', 'error');
              }
            }}
          >
            Export Books
          </button> */}
        </div>
        <div className="management-search-bar">
          <div className="search-input-container">
            <input
              type="text"
              placeholder="Search books by title, author, or ISBN..."
              value={searchTerm}
              onChange={handleSearchChange}
              className="search-input"
            />
          </div>
          <button className="search-button" onClick={handleSearchClick}>
            <img src="/放大镜.svg" alt="Search" />
          </button>
        </div>
      </div>
      
      {/* Add Book Form */}
      {showAddForm && createPortal(
        <div className="modal-overlay add-book-modal-overlay" onClick={() => setShowAddForm(false)}>
          <div className="modal-content add-book-modal" onClick={(e) => e.stopPropagation()}>
            <AddBookForm
              onCancel={() => setShowAddForm(false)}
              onBookAdded={(newBook) => {
                handleBookAdded(newBook);
                setShowAddForm(false);
              }}
            />
          </div>
        </div>,
        document.body
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

      {managingCopiesBook && (
        <CopyManagementModal
          book={managingCopiesBook}
          onClose={() => setManagingCopiesBook(null)}
          onBookUpdated={(updatedBook) => {
            handleBookUpdated(updatedBook);
            setManagingCopiesBook(updatedBook);
          }}
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
        onManageCopies={setManagingCopiesBook}
      />
    </div>
  );
};

export default BookManagementPage;
