import React, { useState, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { useParams, useNavigate, useLocation, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/useAuth';
import { useToast } from '../context/ToastContext';
import { booksAPI, borrowAPI, systemAPI, usersAPI } from '../utils/api';
import './BookDetailsPage.css';

const BookDetailsPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const { user } = useAuth();
  const { showToast } = useToast();
  const [book, setBook] = useState(null);
  const [copies, setCopies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [borrowRecord, setBorrowRecord] = useState(null);
  const [countdown, setCountdown] = useState(0);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [selectedCopyId, setSelectedCopyId] = useState(null);
  const [borrowFeatureEnabled, setBorrowFeatureEnabled] = useState(true);
  const [reservationFeatureEnabled, setReservationFeatureEnabled] = useState(true);

  const fetchBookDetails = useCallback(async () => {
    try {
      setLoading(true);
      const [bookData, copiesData] = await Promise.all([
        booksAPI.getById(id),
        booksAPI.getCopies(id)
      ]);
      setBook(bookData);
      setCopies(copiesData);
      // 不要重置borrowRecord和countdown，保持当前状态
    } catch (err) {
      showToast('Failed to load book details', 'error');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [id, showToast]);

  // 加载书籍详情和副本信息
  useEffect(() => {
    const loadData = async () => {
      await fetchBookDetails();
      // 检查用户是否有该书籍的borrowing状态记录
      if (user?.id) {
        try {
          const data = await usersAPI.getBorrowRecords(user.id);
          const bookBorrowRecord = data.records.find(record => record.book_id === parseInt(id) && record.status === 'borrowing');
          if (bookBorrowRecord) {
            setBorrowRecord(bookBorrowRecord);
            setSelectedCopyId(bookBorrowRecord.copy_id || null);
            // 计算倒计时
            if (bookBorrowRecord.confirm_deadline) {
              const deadline = new Date(bookBorrowRecord.confirm_deadline);
              const now = new Date();
              const diffInSeconds = Math.max(0, Math.floor((deadline - now) / 1000));
              setCountdown(diffInSeconds);
            }
          }
        } catch (err) {
          console.error('Failed to check borrow records:', err);
        }
      }
    };
    loadData();
  }, [fetchBookDetails, id, user?.id]);

  useEffect(() => {
    const fetchFeatureFlags = async () => {
      if (!user?.id) return;

      try {
        const flags = await systemAPI.getFeatureFlags();
        setBorrowFeatureEnabled(flags.borrow_enabled !== false);
        setReservationFeatureEnabled(flags.reservation_enabled !== false);
      } catch (err) {
        console.error('Failed to fetch feature flags:', err);
      }
    };

    fetchFeatureFlags();
  }, [user?.id]);

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
  }, [countdown, fetchBookDetails]);

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
      if (!borrowFeatureEnabled) {
        throw new Error('Borrowing is currently disabled by the system administrator');
      }
      
      // 检查用户是否有未结清的罚款
      const fines = await borrowAPI.getUserFines(user.id);
      const totalFine = fines
        .filter(fine => fine.fine_status === 'unpaid')
        .reduce((sum, fine) => sum + fine.fine, 0);
      if (totalFine > 0) {
        throw new Error('You have unpaid fines and cannot borrow books');
      }
      
      setIsBorrowing(true);
      const result = await borrowAPI.borrow(user.id, book.id);
      setBorrowRecord(result);
      setSelectedCopyId(result.copy_id || null);
      // 计算倒计时（从 confirm_deadline 计算）
      if (result.confirm_deadline) {
        const deadline = new Date(result.confirm_deadline);
        const now = new Date();
        const diffInSeconds = Math.max(0, Math.floor((deadline - now) / 1000));
        setCountdown(diffInSeconds);
      } else {
        // 回退到默认60分钟
        setCountdown(60 * 60);
      }
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
      if (!selectedCopyId) {
        throw new Error('Please select a copy before confirming');
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

  const closeConfirmModal = () => {
    setShowConfirmModal(false);
  };

  const handleCancelBorrowLock = async () => {
    try {
      if (!borrowRecord?.id) {
        throw new Error('No borrow record found');
      }

      const result = await borrowAPI.cancelBorrowLock(borrowRecord.id);
      setShowConfirmModal(false);
      setBorrowRecord(null);
      setSelectedCopyId(null);
      setCountdown(0);
      await fetchBookDetails();
      showToast(result.message, 'success');
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
    const from = location.state?.from || searchParams.get('returnTo');
    const fallback = user?.role === 'librarian' ? '/book-management' : '/books';

    if (from && from.startsWith('/')) {
      navigate(from);
      return;
    }

    navigate(fallback);
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

  if (!book) {
    return (
      <div className="error-message">
        Book not found
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
            <span className={`status-badge status-${copies.filter(c => c.status === 'available').length > 0 ? 'available' : 'borrowed'}`}>
              {copies.filter(c => c.status === 'available').length > 0 ? 'Available' : 'Not Available'}
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
                  {copy.location && (
                    <span className="copy-location">Location: {copy.location}</span>
                  )}
                </div>
              ))}
            </div>
          </div>

          {user && user.role === 'user' && (
            <div className="book-actions">
              {!borrowRecord && copies.filter(c => c.status === 'available').length > 0 && (
                <button 
                  className="btn-primary borrow-button"
                  onClick={handleBorrow}
                  disabled={isBorrowing || !borrowFeatureEnabled}
                >
                  {borrowFeatureEnabled ? (isBorrowing ? 'Processing...' : 'Borrow Now') : 'Borrowing Disabled'}
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
                    onClick={() => {
                      if (!borrowFeatureEnabled) return;
                      const availableCopy = copies.find(
                        copy => copy.status === 'available' || copy.id === borrowRecord.copy_id
                      );
                      setSelectedCopyId(selectedCopyId || availableCopy?.id || null);
                      setShowConfirmModal(true);
                    }}
                    disabled={!borrowFeatureEnabled}
                  >
                    {borrowFeatureEnabled ? 'Confirm Borrowing' : 'Borrowing Disabled'}
                  </button>
                </div>
              )}
              {!borrowRecord && copies.filter(c => c.status === 'available').length <= 0 && (
                <button
                  className="btn-secondary reserve-button"
                  onClick={handleReserve}
                  disabled={!reservationFeatureEnabled}
                >
                  {reservationFeatureEnabled ? 'Reserve' : 'Reservations Disabled'}
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* 确认借阅模态框 */}
      {showConfirmModal && createPortal((
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h3>Confirm Borrowing</h3>
              <button
                type="button"
                className="modal-close"
                onClick={closeConfirmModal}
                aria-label="Close confirm modal"
              >
                <img src="/打叉.svg" alt="" />
              </button>
            </div>
            <div className="modal-body">
              <p><strong>User:</strong> {user?.name}</p>
              <p><strong>Book:</strong> {book.title}</p>
              <div className="confirm-countdown">
                <span>Time left to confirm:</span>
                <strong>{formatCountdown()}</strong>
              </div>
              <div className="copy-selection">
                <label>Select Copy:</label>
                <select 
                  value={selectedCopyId || ''}
                  onChange={(e) => setSelectedCopyId(parseInt(e.target.value))}
                >
                  {copies.filter(c => c.status === 'available' || c.id === borrowRecord?.copy_id).map(copy => (
                    <option key={copy.id} value={copy.id}>
                      Copy ID: {copy.id} ({copy.status === 'available' ? 'Available' : 'Previously selected'})
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div className="modal-actions">
              <button
                className="btn-secondary"
                onClick={closeConfirmModal}
              >
                Not Now
              </button>
              <button
                className="btn-danger"
                onClick={handleCancelBorrowLock}
              >
                Cancel Lock
              </button>
              <button 
                className="btn-primary"
                onClick={handleConfirmBorrow}
                disabled={!selectedCopyId || !borrowFeatureEnabled}
              >
                {borrowFeatureEnabled ? 'Confirm' : 'Borrowing Disabled'}
              </button>
            </div>
          </div>
        </div>
      ), document.body)}
    </div>
  );
};

export default BookDetailsPage;
