import React, { useState, useEffect, useCallback } from 'react';
import { statsAPI } from '../utils/api';
import { useToast } from '../context/ToastContext';
import './StatsPage.css';

const StatsSkeletonLoader = () => (
  <div className="stats-page">
    <div className="stats-content">
      <h2>Borrowing Business Statistics</h2>

      <div className="stats-overview">
        <h3>Overall Statistics</h3>
        <div className="stats-cards">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="stat-card skeleton">
              <div className="skeleton-icon"></div>
              <div className="skeleton-text"></div>
              <div className="skeleton-number"></div>
            </div>
          ))}
        </div>
      </div>

      <div className="stats-grid">
        <div className="stats-grid-item monthly-stats">
          <div className="monthly-header">
            <h3>Monthly Borrowing Statistics</h3>
            <div className="skeleton-selector"></div>
          </div>
          <div className="monthly-chart-container">
            <div className="monthly-chart-new">
              {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map(month => (
                <div key={month} className="month-bar-new">
                  <div className="bar-container">
                    <div className="bar-new skeleton"></div>
                  </div>
                  <div className="skeleton-label small"></div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="stats-grid-item popular-books-stats">
          <h3>Popular Books</h3>
          <div className="skeleton-table">
            {[1, 2, 3, 4, 5].map(row => (
              <div key={row} className="skeleton-row">
                <div className="skeleton-cell rank"></div>
                <div className="skeleton-cell title"></div>
                <div className="skeleton-cell author"></div>
                <div className="skeleton-cell count"></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  </div>
);

const StatsPage = () => {
  const { showToast } = useToast();
  const [borrowStats, setBorrowStats] = useState(null);
  const [monthlyStats, setMonthlyStats] = useState([]);
  const [popularBooks, setPopularBooks] = useState([]);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [isLoading, setIsLoading] = useState(true);

  // Get borrowing business statistics
  const fetchBorrowStats = useCallback(async () => {
    try {
      const data = await statsAPI.getBorrowStats();
      setBorrowStats(data);
    } catch (error) {
      showToast('Failed to fetch borrowing statistics', 'error');
      console.error('Error fetching borrow stats:', error);
    }
  }, [showToast]);

  // Get monthly borrowing statistics
  const fetchMonthlyStats = useCallback(async (year) => {
    try {
      const data = await statsAPI.getMonthlyStats(year);
      setMonthlyStats(data);
    } catch (error) {
      showToast('Failed to fetch monthly statistics', 'error');
      console.error('Error fetching monthly stats:', error);
    }
  }, [showToast]);

  // Get popular books statistics
  const fetchPopularBooks = useCallback(async () => {
    try {
      const data = await statsAPI.getPopularBooksStats();
      setPopularBooks(data);
    } catch (error) {
      showToast('Failed to fetch popular books statistics', 'error');
      console.error('Error fetching popular books stats:', error);
    }
  }, [showToast]);

  // Fetch all statistics on initialization
  useEffect(() => {
    const fetchAllStats = async () => {
      setIsLoading(true);
      await Promise.all([
        fetchBorrowStats(),
        fetchMonthlyStats(selectedYear),
        fetchPopularBooks()
      ]);
      setIsLoading(false);
    };

    fetchAllStats();
  }, [fetchBorrowStats, fetchMonthlyStats, fetchPopularBooks, selectedYear]);

  // Handle year selection change
  const handleYearChange = (e) => {
    setSelectedYear(parseInt(e.target.value));
  };

  // Calculate maximum borrow count for popular books, used for data bars
  const maxBorrowCount = popularBooks.length > 0 
    ? Math.max(...popularBooks.map(book => book.borrow_count)) 
    : 1;

  if (isLoading) {
    return <StatsSkeletonLoader />;
  }

  return (
    <div className="stats-page">
      <div className="stats-content">
        <h2>Borrowing Business Statistics</h2>

        {/* Overall Statistics */}
        <div className="stats-overview">
          <h3>Overall Statistics</h3>
          <div className="stats-cards">
            <div className="stat-card total-borrows">
              <div className="stat-icon">📚</div>
              <h4>Total Borrows</h4>
              <p className="stat-number">{borrowStats?.total_borrows || 0}</p>
              <div className="stat-bg-icon">📚</div>
            </div>
            <div className="stat-card total-returns">
              <div className="stat-icon">✅</div>
              <h4>Total Returns</h4>
              <p className="stat-number">{borrowStats?.total_returns || 0}</p>
              <div className="stat-bg-icon">✅</div>
            </div>
            <div className="stat-card current-borrows">
              <div className="stat-icon">⏳</div>
              <h4>Currently Borrowed</h4>
              <p className="stat-number">{borrowStats?.current_borrows || 0}</p>
              <div className="stat-bg-icon">⏳</div>
            </div>
            <div className="stat-card avg-days">
              <div className="stat-icon">🕒</div>
              <h4>Average Borrow Days</h4>
              <p className="stat-number">{borrowStats?.avg_borrow_days || 0} days</p>
              <div className="stat-bg-icon">🕒</div>
            </div>
          </div>
        </div>

        {/* Responsive Layout: Monthly Statistics and Popular Books */}
        <div className="stats-grid">
          {/* Monthly Statistics */}
          <div className="stats-grid-item monthly-stats">
            <div className="monthly-header">
              <h3>Monthly Borrowing Statistics</h3>
              <div className="year-selector">
                <select 
                  id="year" 
                  value={selectedYear} 
                  onChange={handleYearChange}
                  className="year-select"
                >
                  {Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - i).map(year => (
                    <option key={year} value={year}>{year}</option>
                  ))}
                </select>
              </div>
            </div>
            <div className="monthly-chart-container">
              <div className="monthly-chart-new">
                {monthlyStats.length > 0 ? (
                  <>
                    {/* Calculate statistics */}
                    {(() => {
                      const maxBorrowCount = Math.max(...monthlyStats.map(m => m.borrow_count));
                      
                      return monthlyStats.map((item) => {
                        // Simple direct height calculation to ensure clear differences
                        const height = (item.borrow_count / maxBorrowCount) * 200; // Maximum height 200px
                        
                        return (
                          <div key={item.month} className="month-bar-new">
                            <div className="bar-container">
                              <div 
                                className="bar-new" 
                                style={{ 
                                  height: `${height}px`,
                                  minHeight: '20px'
                                }}
                              >
                                <span className="bar-value">{item.borrow_count}</span>
                              </div>
                            </div>
                            <div className="month-label-new">{item.month}</div>
                          </div>
                        );
                      });
                    })()}
                  </>
                ) : (
                  <div className="no-data">No monthly statistics data</div>
                )}
              </div>
            </div>
          </div>

          {/* Popular Books */}
          <div className="stats-grid-item popular-books-stats">
            <h3>Popular Books</h3>
            {popularBooks.length === 0 ? (
              <p className="no-data">No data available</p>
            ) : (
              <div className="stats-table">
                <div className="table-header">
                  <div className="table-cell">Rank</div>
                  <div className="table-cell">Title</div>
                  <div className="table-cell">Author</div>
                  <div className="table-cell">Borrow Count</div>
                </div>
                <div className="table-body">
                  {popularBooks.map((book, index) => {
                    const borrowPercentage = (book.borrow_count / maxBorrowCount) * 100;
                    return (
                      <div key={book.id} className="table-row">
                        <div className="table-cell">
                          <div className={`rank-badge ${index < 3 ? `rank-${index + 1}` : ''}`}>
                            {index + 1}
                          </div>
                        </div>
                        <div className="table-cell">{book.title}</div>
                        <div className="table-cell">{book.author}</div>
                        <div className="table-cell">
                          <div className="borrow-count-container">
                            <div className="borrow-count">{book.borrow_count}</div>
                            <div className="borrow-bar">
                              <div 
                                className="borrow-bar-fill" 
                                style={{ width: `${borrowPercentage}%` }}
                              />
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default StatsPage;
