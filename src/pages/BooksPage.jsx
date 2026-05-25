import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useToast } from '../context/ToastContext';
import { useAuth } from '../context/AuthContext';
import BookList from '../components/Books/BookList';
import { booksAPI, borrowAPI, categoryAPI, statsAPI, usersAPI } from '../utils/api';

const BooksPage = () => {
  const BOOKS_PER_PAGE = 12;
  const [books, setBooks] = useState([]);
  const [filteredBooks, setFilteredBooks] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [quickFilter, setQuickFilter] = useState('all');
  const [categories, setCategories] = useState([]);
  const [booksLoading, setBooksLoading] = useState(true);
  const [categoriesLoading, setCategoriesLoading] = useState(true);
  const [popularBooks, setPopularBooks] = useState([]);
  const [recentBorrowed, setRecentBorrowed] = useState([]);
  const [activeReservations, setActiveReservations] = useState([]);
  const { user } = useAuth();
  const { showToast } = useToast();
  const dropdownRef = useRef(null);

  const fetchBooks = useCallback(async (category = 'all', search = '') => {
    try {
      setBooksLoading(true);
      let data;

      if (category !== 'all' || search.trim() !== '') {
        data = await booksAPI.search(search, category === 'all' ? null : category);
      } else {
        data = await booksAPI.getAll();
      }

      setBooks(data);
    } catch (err) {
      console.error('Failed to load books:', err);
      showToast(err.message || 'Failed to load books', 'error');
    } finally {
      setBooksLoading(false);
    }
  }, [showToast]);

  const fetchCategories = useCallback(async () => {
    try {
      setCategoriesLoading(true);
      const data = await categoryAPI.getAll();
      setCategories(data);
    } catch (err) {
      console.error('Failed to load categories:', err);
    } finally {
      setCategoriesLoading(false);
    }
  }, []);

  const fetchPopularBooks = useCallback(async () => {
    try {
      const data = await statsAPI.getPopularBooksStats(10);
      setPopularBooks(data);
    } catch (err) {
      console.error('Failed to load popular books:', err);
    }
  }, []);

  const fetchRecentBorrowed = useCallback(async () => {
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
  }, [user?.id]);

  const fetchActiveReservations = useCallback(async () => {
    if (!user?.id) {
      setActiveReservations([]);
      return;
    }

    try {
      const records = await borrowAPI.getReservations(user.id);
      setActiveReservations((records || []).filter(record => ['active', 'pending'].includes(record.status)));
    } catch (err) {
      console.error('Failed to load reservation records:', err);
      setActiveReservations([]);
    }
  }, [user?.id]);

  const handleBookUpdated = (updatedBook) => {
    setBooks(prevBooks => prevBooks.map(book =>
      book.id === updatedBook.id ? updatedBook : book
    ));
  };

  const handleBookDeleted = (bookId) => {
    setBooks(prevBooks => prevBooks.filter(book => book.id !== bookId));
  };

  useEffect(() => {
    fetchBooks();
    fetchCategories();
    fetchPopularBooks();
  }, [fetchBooks, fetchCategories, fetchPopularBooks]);

  useEffect(() => {
    fetchRecentBorrowed();
    fetchActiveReservations();
  }, [fetchRecentBorrowed, fetchActiveReservations]);

  const handleSearchChange = (e) => {
    const term = e.target.value;
    setSearchTerm(term);
    setCurrentPage(1);
    fetchBooks(selectedCategory, term);
  };

  const handleCategoryChange = (e) => {
    const category = e.target.value;
    setSelectedCategory(category);
    setCurrentPage(1);
    fetchBooks(category, searchTerm);
  };

  const handleSearchClick = () => {
    setCurrentPage(1);
    fetchBooks(selectedCategory, searchTerm);
  };

  useEffect(() => {
    const reservedBookIds = new Set(activeReservations.map(record => Number(record.book_id)));
    const nextBooks = books.filter(book => {
      if (quickFilter === 'available') return Number(book.available_copies || 0) > 0;
      if (quickFilter === 'borrowed') return Number(book.available_copies || 0) === 0;
      if (quickFilter === 'reserved') return reservedBookIds.has(Number(book.id));
      return true;
    });

    setFilteredBooks(nextBooks);
  }, [books, quickFilter, activeReservations]);

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

  const totalPages = Math.max(1, Math.ceil(filteredBooks.length / BOOKS_PER_PAGE));
  const pagedBooks = useMemo(() => {
    const startIndex = (currentPage - 1) * BOOKS_PER_PAGE;
    return filteredBooks.slice(startIndex, startIndex + BOOKS_PER_PAGE);
  }, [filteredBooks, currentPage]);
  const pageStart = filteredBooks.length === 0 ? 0 : (currentPage - 1) * BOOKS_PER_PAGE + 1;
  const pageEnd = Math.min(currentPage * BOOKS_PER_PAGE, filteredBooks.length);

  useEffect(() => {
    setCurrentPage(prev => Math.min(Math.max(prev, 1), totalPages));
  }, [totalPages]);

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
              <button type="button" className="search-button" onClick={handleSearchClick}>
                <img src="/放大镜.svg" alt="Search" />
              </button>
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
                  onClick={() => {
                    setQuickFilter(filter.id);
                    setCurrentPage(1);
                  }}
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
                {selectedCategory === 'all'
                  ? 'All Categories'
                  : categories.find(cat => cat.id === selectedCategory)?.name || 'Select Category'}
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

        <BookList
          books={pagedBooks}
          loading={booksLoading}
          onBookUpdated={handleBookUpdated}
          onBookDeleted={handleBookDeleted}
          onReservationsChanged={fetchActiveReservations}
        />
        {!booksLoading && filteredBooks.length > 0 && (
          <div className="books-pagination" aria-label="Books pagination">
            <div className="books-pagination-summary">
              Showing {pageStart}-{pageEnd} of {filteredBooks.length}
            </div>
            <div className="books-pagination-controls">
              <button
                type="button"
                onClick={() => setCurrentPage(1)}
                disabled={currentPage === 1}
              >
                First
              </button>
              <button
                type="button"
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                disabled={currentPage === 1}
              >
                Previous
              </button>
              <span>Page {currentPage} of {totalPages}</span>
              <button
                type="button"
                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                disabled={currentPage === totalPages}
              >
                Next
              </button>
              <button
                type="button"
                onClick={() => setCurrentPage(totalPages)}
                disabled={currentPage === totalPages}
              >
                Last
              </button>
            </div>
          </div>
        )}
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
