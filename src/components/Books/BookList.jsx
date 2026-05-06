import React, { useState, useEffect } from 'react';
import { motion as Motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { booksAPI, borrowAPI, usersAPI } from '../../utils/api';
import Barcode from '../Barcode';
import SkeletonLoader from './SkeletonLoader';
import './Books.css';

const BookList = ({ books = [], loading = false, onBookUpdated, onBookDeleted, showEditButton = false, onEditBook, onManageCopies }) => {
  const [borrowRecords, setBorrowRecords] = useState([]);
  const [reservationRecords, setReservationRecords] = useState([]);
  const { user } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();

  // 获取用户借阅记录
  useEffect(() => {
    const fetchBorrowRecords = async () => {
      if (user?.id) {
        try {
          const data = await usersAPI.getBorrowRecords(user.id);
          // 过滤出未归还的借阅记录
          const activeRecords = data.records.filter(record => !record.return_date);
          setBorrowRecords(activeRecords);
        } catch (err) {
          console.error('Failed to fetch borrow records:', err);
        }
      }
    };

    // 获取用户预约记录
    const fetchReservationRecords = async () => {
      if (user?.id) {
        try {
          const records = await borrowAPI.getReservations(user.id);
          // 过滤出活跃的预约记录
          const activeReservations = records.filter(record => record.status === 'active');
          setReservationRecords(activeReservations);
        } catch (err) {
          console.error('Failed to fetch reservation records:', err);
        }
      }
    };

    fetchBorrowRecords();
    fetchReservationRecords();
  }, [user]);

  // 获取所有书籍的副本信息
  useEffect(() => {
    const fetchCopiesForAllBooks = async () => {
      if (books.length > 0) {
        try {
          const copiesMap = new Map();
          for (const book of books) {
            const copiesData = await booksAPI.getCopies(book.id);
            copiesMap.set(book.id, copiesData);
          }
          setCopies(copiesMap);
        } catch (err) {
          console.error('Failed to fetch copies for books:', err);
        }
      }
    };

    fetchCopiesForAllBooks();
  }, [books]);



  // 处理书籍删除（管理员）
  const handleDeleteBook = async (id) => {
    if (window.confirm('Are you sure you want to delete this book?')) {
      try {
        await booksAPI.delete(id);
        if (onBookDeleted) {
          onBookDeleted(id);
        }
        showToast('Book deleted successfully', 'success');
      } catch (err) {
        showToast('Failed to delete book', 'error');
        console.error(err);
      }
    }
  };

  // 处理借阅书籍（用户）
  const [borrowingBooks, setBorrowingBooks] = useState(new Set());
  const [borrowRecordsMap, setBorrowRecordsMap] = useState(new Map()); // 存储借阅记录
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [selectedBookId, setSelectedBookId] = useState(null);
  const [selectedBorrowRecord, setSelectedBorrowRecord] = useState(null);
  const [selectedCopyId, setSelectedCopyId] = useState(null);
  const [copies, setCopies] = useState(new Map()); // 存储书籍副本信息
  
  const handleBorrowBook = async (bookId) => {
    try {
      if (!user?.id) {
        throw new Error('User not authenticated');
      }
      if (borrowingBooks.has(bookId)) {
        return; // 防止重复点击
      }
      setBorrowingBooks(prev => new Set([...prev, bookId]));
      // 先获取书籍副本信息
      const copiesData = await booksAPI.getCopies(bookId);
      setCopies(prev => new Map([...prev, [bookId, copiesData]]));
      const result = await borrowAPI.borrow(user.id, bookId);
      setBorrowRecordsMap(prev => new Map([...prev, [bookId, result]]));
      setSelectedCopyId(result.copy_id || copiesData.find(copy => copy.status === 'available')?.id || null);
      setSelectedBookId(bookId);
      setSelectedBorrowRecord(result);
      // 重新获取书籍数据，确保与后端同步
      const updatedBook = await booksAPI.getById(bookId);
      if (updatedBook) {
        if (onBookUpdated) {
          onBookUpdated(updatedBook);
        }
      }
      showToast('Borrow request initiated. Please confirm.', 'success');
      setShowConfirmModal(true);
    } catch (err) {
      showToast(err.message, 'error');
      console.error(err);
    } finally {
      setBorrowingBooks(prev => {
        const newSet = new Set(prev);
        newSet.delete(bookId);
        return newSet;
      });
    }
  };
  
  // 处理确认借阅
  const handleConfirmBorrow = async () => {
    try {
      if (!selectedBorrowRecord?.id) {
        throw new Error('No borrow record found');
      }
      if (!selectedCopyId) {
        throw new Error('Please select a copy before confirming');
      }
      await borrowAPI.confirmBorrow(selectedBorrowRecord.id, selectedCopyId);
      showToast('Borrow confirmed successfully', 'success');
      setShowConfirmModal(false);
      // 重新获取书籍数据，确保与后端同步
      if (selectedBookId) {
        const updatedBook = await booksAPI.getById(selectedBookId);
        if (updatedBook && onBookUpdated) {
          onBookUpdated(updatedBook);
        }
      }
      // 重新获取借阅记录
      const data = await usersAPI.getBorrowRecords(user.id);
      const activeRecords = data.records.filter(record => !record.return_date);
      setBorrowRecords(activeRecords);
      // 从borrowRecordsMap中移除已确认的借阅记录
      setBorrowRecordsMap(prev => {
        const newMap = new Map(prev);
        newMap.delete(selectedBookId);
        return newMap;
      });
    } catch (err) {
      showToast(err.message, 'error');
      console.error(err);
    }
  };

  // 处理归还书籍（用户）
  const handleReturnBook = async (bookId) => {
    try {
      if (!user?.id) {
        throw new Error('User not authenticated');
      }
      await borrowAPI.return(user.id, bookId);
      // 从用户的借阅记录中移除
      setBorrowRecords(prevRecords => prevRecords.filter(record => record.book_id !== bookId));
      showToast('Return request submitted successfully. Waiting for librarian approval.', 'success');
    } catch (err) {
      showToast(err.message, 'error');
      console.error(err);
    }
  };

  // 处理预约书籍（用户）
  const handleReserveBook = async (bookId) => {
    try {
      if (!user?.id) {
        throw new Error('User not authenticated');
      }
      const result = await borrowAPI.reserve(user.id, bookId);
      // 重新获取预约记录
      const records = await borrowAPI.getReservations(user.id);
      const activeReservations = records.filter(record => record.status === 'active');
      setReservationRecords(activeReservations);
      showToast(result.message, 'success');
    } catch (err) {
      showToast(err.message, 'error');
      console.error(err);
    }
  };

  // 处理取消预约（用户）
  const handleCancelReservation = async (reservationId) => {
    try {
      if (!user?.id) {
        throw new Error('User not authenticated');
      }
      const result = await borrowAPI.cancelReservation(reservationId);
      // 重新获取预约记录
      const records = await borrowAPI.getReservations(user.id);
      const activeReservations = records.filter(record => record.status === 'active');
      setReservationRecords(activeReservations);
      showToast(result.message, 'success');
    } catch (err) {
      showToast(err.message, 'error');
      console.error(err);
    }
  };

  if (loading) {
    return <SkeletonLoader count={5} />;
  }

  // 动画变量
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.5,
        ease: "easeOut"
      }
    }
  };

  return (
    <div className="book-list">
      <h3>Books</h3>
      <Motion.div
        className="book-grid"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        {books.map(book => {
          // 检查书籍是否正在借阅中
          const isBorrowing = borrowRecordsMap.has(book.id);
          const borrowRecord = borrowRecordsMap.get(book.id);
          
          return (
            <Motion.div 
              key={book.id} 
              variants={itemVariants}
              className="book-card"
              onClick={() => navigate(`/books/${book.id}`)}
              style={{ cursor: 'pointer' }}
            >
              <div className="book-card-header">
                <span className={`status-badge ${book.available_copies > 0 ? 'status-available' : 'status-borrowed'}`}>
                  {book.available_copies > 0 ? 'Available' : 'Not Available'}
                </span>
                <span className="book-id">ID: {book.id}</span>
              </div>
              <h4 className="book-title">{book.title}</h4>
              <p className="book-author">by {book.author}</p>
              <p className="book-isbn">ISBN: {book.isbn}</p>
              {book.publisher && <p className="book-publisher">Publisher: {book.publisher}</p>}
              {book.publication_date && <p className="book-date">Published: {book.publication_date}</p>}
              <p className="book-copies">Available: {copies.get(book.id)?.filter(c => c.status === 'available').length || 0}/{copies.get(book.id)?.length || 0}</p>
              <div className="book-actions">
                {user.role === 'user' ? (
                  // 检查书籍是否真的可用：状态为available且没有未归还的借阅记录
                  isBorrowing ? (
                    <button 
                      className="btn-primary"
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedBookId(book.id);
                        setSelectedBorrowRecord(borrowRecord);
                        setSelectedCopyId(
                          borrowRecord.copy_id ||
                          copies.get(book.id)?.find(copy => copy.status === 'available')?.id ||
                          null
                        );
                        setShowConfirmModal(true);
                      }}
                    >
                      Confirm Borrow
                    </button>
                  ) : copies.get(book.id)?.filter(c => c.status === 'available').length > 0 ? (
                    <button 
                      className="btn-warning"
                      onClick={(e) => { e.stopPropagation(); handleBorrowBook(book.id); }}
                      disabled={borrowingBooks.has(book.id)}
                    >
                      {borrowingBooks.has(book.id) ? 'Processing...' : 'Borrow'}
                    </button>
                  ) : (() => {
                    const borrowRecord = borrowRecords.find(record => record.book_id === book.id);
                    if (borrowRecord) {
                      if (borrowRecord.status === 'borrowing') {
                        return (
                          <button 
                            className="btn-primary"
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedBookId(book.id);
                              setSelectedBorrowRecord(borrowRecord);
                              setSelectedCopyId(
                                borrowRecord.copy_id ||
                                copies.get(book.id)?.find(copy => copy.status === 'available')?.id ||
                                null
                              );
                              setShowConfirmModal(true);
                            }}
                          >
                            Confirm
                          </button>
                        );
                      } else {
                        return (
                          <button 
                            className="btn-info"
                            onClick={(e) => { e.stopPropagation(); handleReturnBook(book.id); }}
                          >
                            Return
                          </button>
                        );
                      }
                    } else {
                      const userReservation = reservationRecords.find(record => record.book_id === book.id);
                      return userReservation ? (
                        <button 
                          className="btn-danger"
                          onClick={(e) => { e.stopPropagation(); handleCancelReservation(userReservation.id); }}
                        >
                          Cancel Reservation
                        </button>
                      ) : book.available_copies <= 0 ? (
                        <button 
                          className="btn-secondary"
                          onClick={(e) => { e.stopPropagation(); handleReserveBook(book.id); }}
                        >
                          Reserve
                        </button>
                      ) : null;
                    }
                  })()
                ) : (
                  <>
                    {showEditButton && (
                      <button 
                        className="btn-info"
                        onClick={(e) => { e.stopPropagation(); onEditBook && onEditBook(book); }}
                      >
                        Edit Info
                      </button>
                    )}
                    {showEditButton && (
                      <button
                        className="btn-secondary"
                        onClick={(e) => { e.stopPropagation(); onManageCopies && onManageCopies(book); }}
                      >
                        Manage Copies
                      </button>
                    )}
                    <button 
                      className="btn-danger"
                      onClick={(e) => { e.stopPropagation(); handleDeleteBook(book.id); }}
                    >
                      Delete
                    </button>
                  </>
                )}
              </div>
            </Motion.div>
          );
        })}
      </Motion.div>
      
      {/* 确认借阅模态框 */}
      {showConfirmModal && selectedBorrowRecord && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h3>Confirm Borrowing</h3>
            <div className="modal-body">
              <p><strong>User:</strong> {user?.name}</p>
              <p><strong>Book:</strong> {books.find(b => b.id === selectedBookId)?.title}</p>
              <div className="copy-selection">
                <label>Select Copy:</label>
                <select
                  value={selectedCopyId || ''}
                  onChange={(e) => setSelectedCopyId(parseInt(e.target.value))}
                >
                  {copies.get(selectedBookId)?.filter(
                    c => c.status === 'available' || c.id === selectedBorrowRecord?.copy_id
                  ).map(copy => (
                    <option key={copy.id} value={copy.id}>
                      {copy.copy_code || `Copy #${copy.id}`} ({copy.status === 'available' ? 'Available' : 'Previously selected'})
                    </option>
                  ))}
                </select>
              </div>
              {/* 显示选中副本的条形码 */}
              {selectedCopyId && copies.get(selectedBookId)?.find(c => c.id === selectedCopyId)?.copy_code && (
                <div className="selected-copy-barcode">
                  <Barcode
                    code={copies.get(selectedBookId).find(c => c.id === selectedCopyId).copy_code}
                    width={2}
                    height={50}
                  />
                </div>
              )}
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
                disabled={!selectedCopyId}
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

export default BookList;
