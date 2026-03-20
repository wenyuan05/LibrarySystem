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
  const [copies, setCopies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [borrowRecord, setBorrowRecord] = useState(null);
  const [countdown, setCountdown] = useState(0);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [selectedCopyId, setSelectedCopyId] = useState(null);

  // 加载书籍详情和副本信息
  useEffect(() => {
    fetchBookDetails();
  }, [id]);

  // 倒计时效果
  useEffect(() => {
    let interval;
    if (countdown > 0) {
      interval = setInterval(() => {
        setCountdown(prev => {
          if (prev <= 1) {
            clearInterval(interval);
            // 倒计时结束，重新加载书籍信息
            fetchBookDetails();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [countdown]);

  const fetchBookDetails = async () => {
    try {
      setLoading(true);
      setError(null);
      const [bookData, copiesData] = await Promise.all([
        booksAPI.getById(id),
        booksAPI.getCopies(id)
      ]);
      setBook(bookData);
      setCopies(copiesData);
      setBorrowRecord(null);
      setCountdown(0);
    } catch (err) {
      setError('Failed to load book details');
      showToast('Failed to load book details', 'error');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // 处理借阅书籍
  const [isBorrowing, setIsBorrowing] = useState(false);
  
  const handleBorrow = async () => {
    try {
      if (!user?.id) {
        throw new Error('User not authenticated');
      }
      if (isBorrowing) {
        return; // 防止重复点击
      }
      setIsBorrowing(true);
      const result = await borrowAPI.borrow(user.id, book.id);
      setBorrowRecord(result);
      setSelectedCopyId(result.copy_id);
      // 计算倒计时（分钟转换为秒）
      const confirmMinutes = 60; // 默认60分钟
      setCountdown(confirmMinutes * 60);
      showToast('Borrow request initiated. Please confirm within the time limit.', 'success');
    } catch (err) {
      showToast(err.message, 'error');
      console.error(err);
    } finally {
      setIsBorrowing(false);
    }
  };

  // 处理确认借阅
  const handleConfirmBorrow = async () => {
    try {
      if (!borrowRecord?.id) {
        throw new Error('No borrow record found');
      }
      await borrowAPI.confirmBorrow(borrowRecord.id, selectedCopyId);
      showToast('Borrow confirmed successfully', 'success');
      setShowConfirmModal(false);
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

  // 格式化倒计时
  const formatCountdown = () => {
    const minutes = Math.floor(countdown / 60);
    const seconds = countdown % 60;
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
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
              <span>Total: {copies.length}</span>
              <span>Available: {copies.filter(c => c.status === 'available').length}</span>
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

          {/* 副本信息 */}
          <div className="book-copies-section">
            <h3>Copies</h3>
            <div className="copies-list">
              {copies.map(copy => (
                <div key={copy.id} className={`copy-item status-${copy.status}`}>
                  <span className="copy-id">Copy ID: {copy.id}</span>
                  <span className={`copy-status status-badge status-${copy.status}`}>
                    {copy.status === 'available' ? 'Available' : 
                     copy.status === 'borrowed' ? 'Borrowed' : 
                     copy.status === 'borrowing' ? 'Borrowing' : 
                     copy.status === 'reserved' ? 'Reserved' : copy.status}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {user && user.role === 'user' && (
            <div className="book-actions">
              {!borrowRecord && book.status === 'available' && (
                <button 
                  className="btn-primary borrow-button"
                  onClick={handleBorrow}
                  disabled={isBorrowing}
                >
                  {isBorrowing ? 'Processing...' : 'Borrow Now'}
                </button>
              )}
              {borrowRecord && countdown > 0 && (
                <div className="borrow-pending">
                  <div className="countdown">
                    <span>Time left to confirm:</span>
                    <span className="countdown-timer">{formatCountdown()}</span>
                  </div>
                  <button 
                    className="btn-primary confirm-button"
                    onClick={() => setShowConfirmModal(true)}
                  >
                    Confirm Borrowing
                  </button>
                </div>
              )}
              {!borrowRecord && book.status !== 'available' && (
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

      {/* 确认借阅模态框 */}
      {showConfirmModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h3>Confirm Borrowing</h3>
            <div className="modal-body">
              <p><strong>User:</strong> {user?.name}</p>
              <p><strong>Book:</strong> {book.title}</p>
              <div className="copy-selection">
                <label>Select Copy:</label>
                <select 
                  value={selectedCopyId} 
                  onChange={(e) => setSelectedCopyId(parseInt(e.target.value))}
                >
                  {copies.filter(c => c.status === 'borrowing' || c.status === 'available').map(copy => (
                    <option key={copy.id} value={copy.id}>
                      Copy ID: {copy.id} ({copy.status === 'borrowing' ? 'Selected' : 'Available'})
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div className="modal-actions">
              <button 
                className="btn-secondary"
                onClick={() => setShowConfirmModal(false)}
              >
                Cancel
              </button>
              <button 
                className="btn-primary"
                onClick={handleConfirmBorrow}
              >
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BookDetailsPage;