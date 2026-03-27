import React, { useState, useEffect, useRef } from 'react';
import { useToast } from '../context/ToastContext';
import BookList from '../components/Books/BookList';
import { booksAPI } from '../utils/api';
import releaseConfig from '../config/releaseConfig';

const BooksPage = () => {
  const [books, setBooks] = useState([]);
  const [filteredBooks, setFilteredBooks] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [booksLoading, setBooksLoading] = useState(true);
  const { showToast } = useToast();

  // Load books data
  const fetchBooks = async (search = '') => {
    try {
      setBooksLoading(true);
      let data;
      
      // If there's a search term, use search API
      if (search.trim() !== '') {
        data = await booksAPI.search(search);
      } else {
        // Otherwise get all books
        data = await booksAPI.getAll();
      }
      
      setBooks(data);
    } catch (err) {
      console.error('Failed to load books:', err);
      showToast(err.message || 'Failed to load books', 'error');
    } finally {
      setBooksLoading(false);
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
  }, []);

  // Handle search input change
  const handleSearchChange = (e) => {
    const term = e.target.value;
    setSearchTerm(term);
    // When search term changes, reload books data
    fetchBooks(term);
  };

  // Handle search button click
  const handleSearchClick = () => {
    fetchBooks(searchTerm);
  };

  // Update filtered books when books list changes
  useEffect(() => {
    setFilteredBooks(books);
  }, [books]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        const dropdownMenu = document.querySelector('.category-dropdown-menu');
        if (dropdownMenu) {
          dropdownMenu.classList.remove('show');
        }
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  return (
    <div className="books-section card fade-in">
      <h2>Books</h2>
      
      {/* 搜索栏 */}
      <div className="search-and-filter">
        <div className="search-bar">
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
            🔍
          </button>
        </div>
      </div>

      {/* 书籍列表 */}
      <BookList 
        books={filteredBooks}
        loading={booksLoading}
        onBookUpdated={handleBookUpdated}
        onBookDeleted={handleBookDeleted}
      />


    </div>
  );
};

export default BooksPage;