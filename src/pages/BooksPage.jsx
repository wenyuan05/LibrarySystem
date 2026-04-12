import React, { useState, useEffect, useRef } from 'react';
import { useToast } from '../context/ToastContext';
import BookList from '../components/Books/BookList';
import { booksAPI, categoryAPI, statsAPI } from '../utils/api';

const BooksPage = () => {
  const [books, setBooks] = useState([]);
  const [filteredBooks, setFilteredBooks] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [categories, setCategories] = useState([]);
  const [booksLoading, setBooksLoading] = useState(true);
  const [categoriesLoading, setCategoriesLoading] = useState(true);
  const [popularBooks, setPopularBooks] = useState([]);
  const { showToast } = useToast();
  const dropdownRef = useRef(null);

  // Load books data
  const fetchBooks = async (category = 'all', search = '') => {
    try {
      setBooksLoading(true);
      let data;
      
      // If there's a category or search term, use search API
      if (category !== 'all' || search.trim() !== '') {
        data = await booksAPI.search(search, category === 'all' ? null : category);
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

  // Load categories data
  const fetchCategories = async () => {
    try {
      setCategoriesLoading(true);
      const data = await categoryAPI.getAll();
      setCategories(data);
    } catch (err) {
      console.error('Failed to load categories:', err);
    } finally {
      setCategoriesLoading(false);
    }
  };

  // Load popular books data
  const fetchPopularBooks = async () => {
    try {
      const data = await statsAPI.getPopularBooksStats(10);
      setPopularBooks(data);
    } catch (err) {
      console.error('Failed to load popular books:', err);
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

  // Load books and categories on component mount
  useEffect(() => {
    fetchBooks();
    fetchCategories();
    fetchPopularBooks();
  }, []);

  // Handle search input change
  const handleSearchChange = (e) => {
    const term = e.target.value;
    setSearchTerm(term);
    // When search term changes, reload books data
    fetchBooks(selectedCategory, term);
  };

  // Handle search button click
  const handleSearchClick = () => {
    fetchBooks(selectedCategory, searchTerm);
  };

  // Handle category selection
  const handleCategoryChange = (e) => {
    const category = e.target.value;
    setSelectedCategory(category);
    // When category changes, reload books data
    fetchBooks(category, searchTerm);
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
      
      {/* 搜索和筛选栏 */}
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
            <img src="/放大镜.svg" alt="Search" />
          </button>
        </div>
        <div className="category-filter">
          <div className="category-dropdown" ref={dropdownRef}>
            <button
              className="category-dropdown-toggle"
              onClick={(e) => {
                e.stopPropagation();
                const dropdownMenu = document.querySelector('.category-dropdown-menu');
                if (dropdownMenu) {
                  dropdownMenu.classList.toggle('show');
                }
              }}
              disabled={categoriesLoading}
            >
              {selectedCategory === 'all' ? 'All Categories' : 
                categories.find(cat => cat.id === selectedCategory)?.name || 'Select Category'}
              <span className="dropdown-arrow">▼</span>
            </button>
            <div className="category-dropdown-menu">
              <button
                className={`dropdown-item ${selectedCategory === 'all' ? 'active' : ''}`}
                onClick={(e) => {
                  e.stopPropagation();
                  handleCategoryChange({ target: { value: 'all' } });
                  const dropdownMenu = document.querySelector('.category-dropdown-menu');
                  if (dropdownMenu) {
                    dropdownMenu.classList.remove('show');
                  }
                }}
              >
                All Categories
              </button>
              {categories.map(category => (
                <button
                  key={category.id}
                  className={`dropdown-item ${selectedCategory === category.id ? 'active' : ''}`}
                  onClick={(e) => {
                    e.stopPropagation();
                    handleCategoryChange({ target: { value: category.id } });
                    const dropdownMenu = document.querySelector('.category-dropdown-menu');
                    if (dropdownMenu) {
                      dropdownMenu.classList.remove('show');
                    }
                  }}
                >
                  {category.name}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* 书籍列表 */}
      <BookList 
        books={filteredBooks}
        loading={booksLoading}
        onBookUpdated={handleBookUpdated}
        onBookDeleted={handleBookDeleted}
      />

      {/* Popular Books */}
      {popularBooks.length > 0 && (
        <div className="popular-books-section" style={{ marginTop: '30px' }}>
          <h3>Popular Books Top 10</h3>
          <table className="stats-table">
            <thead>
              <tr>
                <th>Rank</th>
                <th>Title</th>
                <th>Author</th>
                <th>Borrow Count</th>
              </tr>
            </thead>
            <tbody>
              {popularBooks.map((book, index) => (
                <tr key={book.id}>
                  <td>{index + 1}</td>
                  <td>{book.title}</td>
                  <td>{book.author}</td>
                  <td>{book.borrow_count}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default BooksPage;