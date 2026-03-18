import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { booksAPI, borrowAPI } from '../utils/api';
import './BookDetailsPage.css';

const BookDetailsPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { showToast } = useToast();
  const [book, setBook] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // 加载书籍详情
  useEffect(() => {
    fetchBookDetails();
  }, [id]);

  const fetchBookDetails = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await booksAPI.getById(id);
      setBook(data);
    } catch (err) {
      setError('Failed to load book details');
      showToast('Failed to load book details', 'error');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // 处理借阅书籍
  const handleBorrow = async () => {
    try {
      if (!user?.id) {
        throw new Error('User not authenticated');
      }
      const result = await borrowAPI.borrow(user.id, book.id);
      showToast(result.message, 'success');
      // 重新加载书籍详情
      fetchBookDetails();
    } catch (err) {
      showToast(err.message, 'error');
      console.error(err);
    }
  };

  // 处理预约书籍
  const handleReserve = async () => {
    try {
      if (!user?.id) {
        throw new Error('User not authenticated');
      }
      const result = await borrowAPI.reserve(user.id, book.id);
      showToast(result.message, 'success');
    } catch (err) {
      showToast(err.message, 'error');
      console.error(err);
    }
  };

  // 处理返回列表
  const handleBack = () => {
    navigate('/books');
  };

  if (loading) {
    return <div className="loading">Loading book details...</div>;
  }

  if (error || !book) {
    return (
      <div className="error-message">
        {error || 'Book not found'}
        <button onClick={handleBack} className="btn-primary">Back to Books</button>
      </div>
    );
  }

  return (
    <div className="book-details-page card fade-in">
      <button className="back-button" onClick={handleBack}>
        ← Back
      </button>
      
      <div className="book-details-container">
        <div className="book-cover-section">
          <div className="book-cover">
            {book.cover_image ? (
              <img src={book.cover_image} alt={book.title} />
            ) : (
              <div className="placeholder-cover">
                <span>{book.title.charAt(0)}</span>
              </div>
            )}
          </div>
          <div className="book-status">
            <span className={`status-badge status-${book.status}`}>
              {book.status === 'available' ? 'Available' : 
               book.status === 'borrowed' ? 'Borrowed' : 
               book.status === 'reserved' ? 'Reserved' : book.status}
            </span>
            <div className="copies-info">
              <span>Total: {book.total_copies}</span>
              <span>Available: {book.available_copies}</span>
            </div>
          </div>
        </div>

        <div className="book-info-section">
          <h1>{book.title}</h1>
          <h2>{book.author}</h2>
          
          <div className="book-meta">
            {book.publisher && (
              <div className="meta-item">
                <span className="meta-label">Publisher:</span>
                <span className="meta-value">{book.publisher}</span>
              </div>
            )}
            {book.publish_date && (
              <div className="meta-item">
                <span className="meta-label">Publish Date:</span>
                <span className="meta-value">{book.publish_date}</span>
              </div>
            )}
            {book.language && (
              <div className="meta-item">
                <span className="meta-label">Language:</span>
                <span className="meta-value">{book.language}</span>
              </div>
            )}
            {book.page_count && (
              <div className="meta-item">
                <span className="meta-label">Page Count:</span>
                <span className="meta-value">{book.page_count}</span>
              </div>
            )}
            <div className="meta-item">
              <span className="meta-label">ISBN:</span>
              <span className="meta-value">{book.isbn}</span>
            </div>
          </div>

          <div className="book-description">
            <h3>Description</h3>
            <p>{book.description || 'No description available.'}</p>
          </div>

          {user && user.role === 'user' && (
            <div className="book-actions">
              {book.status === 'available' && (
                <button 
                  className="btn-primary borrow-button"
                  onClick={handleBorrow}
                >
                  Borrow Now
                </button>
              )}
              {book.status !== 'available' && (
                <button 
                  className="btn-secondary reserve-button"
                  onClick={handleReserve}
                >
                  Reserve
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default BookDetailsPage;