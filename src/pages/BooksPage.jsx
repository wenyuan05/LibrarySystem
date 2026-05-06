import React, { useState, useEffect, useRef } from 'react';
import { useToast } from '../context/ToastContext';
import { useAuth } from '../context/AuthContext';
import BookList from '../components/Books/BookList';
import { booksAPI, categoryAPI, statsAPI, usersAPI } from '../utils/api';

const BooksPage = () => {
  const [books, setBooks] = useState([]);
  const [filteredBooks, setFilteredBooks] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [quickFilter, setQuickFilter] = useState('all');
  const [categories, setCategories] = useState([]);
  const [booksLoading, setBooksLoading] = useState(true);
  const [categoriesLoading, setCategoriesLoading] = useState(true);
  const [popularBooks, setPopularBooks] = useState([]);
  const [recentBorrowed, setRecentBorrowed] = useState([]);
  const { user } = useAuth();
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

  const fetchRecentBorrowed = async () => {
    if (!user?.id) return;

    try {
      const data = await usersAPI.getBorrowRecords(user.id);
      const records = (data.records || [])
        .filter(record => record.status !== 'borrowing')
        .sort((a, b) => Number(b.id || 0) - Number(a.id || 0))
        .slice(0, 5);
      setRecentBorrowed(records);
    } catch (err) {
      console.error('Failed to load recent borrowed records:', err);
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

  useEffect(() => {
    fetchRecentBorrowed();
  }, [user]);

  // Handle search input change
  const handleSearchChange = (e) => {
    const term = e.target.value;
    setSearchTerm(term);
    // When search term changes, reload books data
    fetchBooks(selectedCategory, term);
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
    const nextBooks = books.filter(book => {
      if (quickFilter === 'available') return Number(book.available_copies || 0) > 0;
      if (quickFilter === 'borrowed') return Number(book.available_copies || 0) === 0;
      if (quickFilter === 'reserved') return book.status === 'reserved';
      return true;
    });

    setFilteredBooks(nextBooks);
  }, [books, quickFilter]);

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

  const totalBooks = books.length;
  const availableCopies = books.reduce((sum, book) => sum + Number(book.available_copies || 0), 0);
  const totalCopies = books.reduce((sum, book) => sum + Number(book.total_copies || 0), 0);
  const unavailableBooks = books.filter(book => Number(book.available_copies || 0) === 0).length;
  const topBorrowCount = popularBooks[0]?.borrow_count || 0;

  const dashboardStats = [
    { label: 'Total Books', value: totalBooks, hint: 'Catalog titles' },
    { label: 'Available Copies', value: availableCopies, hint: `${totalCopies} total copies` },
    { label: 'Unavailable Titles', value: unavailableBooks, hint: 'Currently out of stock' },
    { label: 'Top Borrow Count', value: topBorrowCount, hint: 'Most borrowed title' }
  ];

  return (
    <div className="books-page-shell fade-in">
      <div className="books-section card">
        <div className="books-dashboard-header">
          <div>
            <span className="dashboard-eyebrow">Inventory Dashboard</span>
            <h2>Books</h2>
          </div>
          <span className="dashboard-count">{filteredBooks.length} shown</span>
        </div>

        <div className="books-stats-row">
          {dashboardStats.map(stat => (
            <div className="books-stat-card" key={stat.label}>
              <span>{stat.label}</span>
              <strong>{stat.value}</strong>
              <small>{stat.hint}</small>
            </div>
          ))}
        </div>
        
        {/* 搜索和筛选栏 */}
        <div className="books-toolbar">
          <div className="search-and-filter">
            <div className="books-search-bar">
              <div className="books-search-input-container">
                <span className="books-search-input-icon" aria-hidden="true"></span>
                <input
                  type="text"
                  placeholder="Search books by title, author, or ISBN..."
                  value={searchTerm}
                  onChange={handleSearchChange}
                  className="books-search-input"
                />
              </div>
            </div>
            <div className="quick-filter-group" aria-label="Book availability filters">
              {[
                { id: 'all', label: 'All' },
                { id: 'available', label: 'Available' },
                { id: 'borrowed', label: 'Borrowed' },
                { id: 'reserved', label: 'Reserved' }
              ].map(filter => (
                <button
                  type="button"
                  key={filter.id}
                  className={quickFilter === filter.id ? 'active' : ''}
                  onClick={() => setQuickFilter(filter.id)}
                >
                  {filter.label}
                </button>
              ))}
            </div>
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
      </div>

      <aside className="books-sidebar">
        <section className="sidebar-widget popular-books-section">
          <div className="popular-books-header">
            <div>
              <h3>Popular Books</h3>
              <p>Top 10 most borrowed</p>
            </div>
          </div>
          {popularBooks.length > 0 ? (
            <div className="popular-books-list">
              {popularBooks.map((book, index) => (
                <div className="popular-book-item" key={book.id}>
                  <span className="popular-book-rank">{index + 1}</span>
                  <div className="popular-book-info">
                    <strong>{book.title}</strong>
                    <span>{book.author}</span>
                  </div>
                  <span className="popular-book-count">{book.borrow_count}</span>
                </div>
              ))}
            </div>
          ) : (
            <p className="sidebar-empty">No borrow data yet.</p>
          )}
        </section>

        <section className="sidebar-widget recently-borrowed-widget">
          <h3>Recently Borrowed</h3>
          {recentBorrowed.length > 0 ? (
            <div className="recent-list">
              {recentBorrowed.map(record => (
                <div className="recent-item" key={record.id}>
                  <strong>{record.title}</strong>
                  <span>{record.borrow_date || 'No date'} · {record.status}</span>
                </div>
              ))}
            </div>
          ) : (
            <p className="sidebar-empty">No recent records.</p>
          )}
        </section>

        <section className="sidebar-widget system-stats-widget">
          <h3>System Stats</h3>
          <div className="system-stat-row">
            <span>Availability rate</span>
            <strong>{totalCopies ? Math.round((availableCopies / totalCopies) * 100) : 0}%</strong>
          </div>
          <div className="system-stat-row">
            <span>Recent records</span>
            <strong>{recentBorrowed.length}</strong>
          </div>
          <div className="system-stat-row">
            <span>Categories</span>
            <strong>{categories.length}</strong>
          </div>
        </section>
      </aside>
    </div>
  );
};

export default BooksPage;
