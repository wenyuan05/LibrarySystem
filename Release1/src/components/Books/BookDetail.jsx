import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { booksAPI, borrowAPI } from '../../utils/api';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import './Books.css';

const BookDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { showToast } = useToast();
  const [book, setBook] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // 加载书籍详情
  useEffect(() => {
    const fetchBookDetail = async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await booksAPI.getById(id);
        setBook(data);
      } catch (err) {
        console.error('Failed to load book detail:', err);
        const errorMessage = 'Failed to load book detail. Please try again.';
        setError(errorMessage);
        showToast(errorMessage, 'error');
      } finally {
        setLoading(false);
      }
    };

    fetchBookDetail();
  }, [id, showToast]);

  // 处理借阅
  const handleBorrow = async () => {
    if (!user) {
      showToast('Please login first', 'error');
      navigate('/login');
      return;
    }

    if (book.available_copies <= 0) {
      showToast('Book is not available', 'error');
      return;
    }

    try {
      await borrowAPI.borrow(user.id, book.id);
      showToast('Book borrowed successfully', 'success');
      // 重新加载书籍详情
      const updatedBook = await booksAPI.getById(id);
      setBook(updatedBook);
    } catch (err) {
      console.error('Failed to borrow book:', err);
      showToast('Failed to borrow book. Please try again.', 'error');
    }
  };

  // 处理返回
  const handleBack = () => {
    navigate(-1);
  };

  if (loading) {
    return (
      <div className="book-detail-section card fade-in">
        <h2>Loading...</h2>
      </div>
    );
  }

  if (error || !book) {
    return (
      <div className="book-detail-section card fade-in">
        <h2>Book Detail</h2>
        <div className="error-message">
          {error || 'Book not found'}
          <button onClick={handleBack} className="btn-primary">Back</button>
        </div>
      </div>
    );
  }

  return (
    <div className="book-detail-section card fade-in">
      <div className="book-detail-header">
        <button onClick={handleBack} className="btn-secondary">Back</button>
        <h2>Book Detail</h2>
      </div>

      <div className="book-detail-content">
        <div className="book-info">
          <h3>{book.title}</h3>
          <p className="author">by {book.author}</p>
          
          <div className="book-meta">
            <p><strong>ISBN:</strong> {book.isbn}</p>
            {book.publisher && <p><strong>Publisher:</strong> {book.publisher}</p>}
            {book.publication_date && <p><strong>Publication Date:</strong> {book.publication_date}</p>}
            <p><strong>Total Copies:</strong> {book.total_copies}</p>
            <p><strong>Available Copies:</strong> {book.available_copies}</p>
          </div>

          {book.description && (
            <div className="book-description">
              <h4>Description</h4>
              <p>{book.description}</p>
            </div>
          )}

          <div className="book-actions">
            {user && (
              <button 
                onClick={handleBorrow} 
                className="btn-primary"
                disabled={book.available_copies <= 0}
              >
                {book.available_copies > 0 ? 'Borrow Book' : 'Not Available'}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default BookDetail;