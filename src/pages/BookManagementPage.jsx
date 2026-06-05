import React, { useState, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { useToast } from '../context/ToastContext';
import BookList from '../components/Books/BookList';
import AddBookForm from '../components/Books/AddBookForm';
import EditBookForm from '../components/Books/EditBookForm';
import CopyManagementModal from '../components/Books/CopyManagementModal';
import { booksAPI } from '../utils/api';
import { scrollToListTop } from '../utils/scrollToListTop';

const BookManagementPage = () => {
  const BOOKS_PER_PAGE = 12;
  const [books, setBooks] = useState([]);
  const [filteredBooks, setFilteredBooks] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const [booksLoading, setBooksLoading] = useState(true);
  const [editingBook, setEditingBook] = useState(null);
  const [managingCopiesBook, setManagingCopiesBook] = useState(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
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
    setCurrentPage(1);
  };

  // Update filtered books when books list changes without disrupting the current page.
  useEffect(() => {
    if (searchTerm.trim() === '') {
      setFilteredBooks(books);
      return;
    }

    const normalizedSearch = searchTerm.toLowerCase();
    setFilteredBooks(books.filter(book =>
      book.title.toLowerCase().includes(normalizedSearch) ||
      book.author.toLowerCase().includes(normalizedSearch) ||
      book.isbn.includes(searchTerm)
    ));
  }, [books, searchTerm]);

  const totalPages = Math.max(1, Math.ceil(filteredBooks.length / BOOKS_PER_PAGE));
  const pageStartIndex = (currentPage - 1) * BOOKS_PER_PAGE;
  const pagedBooks = filteredBooks.slice(pageStartIndex, pageStartIndex + BOOKS_PER_PAGE);
  const pageStart = filteredBooks.length === 0 ? 0 : pageStartIndex + 1;
  const pageEnd = Math.min(currentPage * BOOKS_PER_PAGE, filteredBooks.length);

  useEffect(() => {
    setCurrentPage(prev => Math.min(Math.max(prev, 1), totalPages));
  }, [totalPages]);

  const handlePageChange = (nextPage) => {
    setCurrentPage(nextPage);
    scrollToListTop('#managed-books-list-top');
  };

  const handleExportBooks = async () => {
    try {
      setIsExporting(true);
      const blob = await booksAPI.export();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `books_with_copies_${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      showToast('Book data exported successfully.', 'success');
    } catch (error) {
      console.error('Export failed:', error);
      showToast(error.message || 'Export failed. Please try again.', 'error');
    } finally {
      setIsExporting(false);
    }
  };

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
          <button
            className="btn-secondary"
            onClick={handleExportBooks}
            disabled={isExporting}
          >
            {isExporting ? 'Exporting...' : 'Export Books & Copies'}
          </button>
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
      {editingBook && createPortal(
        <EditBookForm 
          book={editingBook}
          onEditComplete={(updatedBook) => {
            handleBookEdit(updatedBook);
            setEditingBook(null);
          }}
          onCancel={() => setEditingBook(null)}
        />,
        document.body
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
      <div id="managed-books-list-top" />
      <BookList 
        books={pagedBooks}
        loading={booksLoading}
        onBookUpdated={handleBookUpdated}
        onBookDeleted={handleBookDeleted}
        showEditButton={true}
        onEditBook={setEditingBook}
        onManageCopies={setManagingCopiesBook}
      />
      {!booksLoading && filteredBooks.length > 0 && (
        <div className="books-pagination" aria-label="Managed books pagination">
          <div className="books-pagination-summary">
            Showing {pageStart}-{pageEnd} of {filteredBooks.length}
          </div>
          <div className="books-pagination-controls">
            <button
              type="button"
              onClick={() => handlePageChange(1)}
              disabled={currentPage === 1}
            >
              First
            </button>
            <button
              type="button"
              onClick={() => handlePageChange(Math.max(1, currentPage - 1))}
              disabled={currentPage === 1}
            >
              Previous
            </button>
            <span>Page {currentPage} of {totalPages}</span>
            <button
              type="button"
              onClick={() => handlePageChange(Math.min(totalPages, currentPage + 1))}
              disabled={currentPage === totalPages}
            >
              Next
            </button>
            <button
              type="button"
              onClick={() => handlePageChange(totalPages)}
              disabled={currentPage === totalPages}
            >
              Last
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default BookManagementPage;
