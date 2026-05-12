import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { borrowAPI } from '../utils/api';
import { DEFAULT_HISTORY_PAGE_SIZE, paginateRecords, sortFineRecords } from '../utils/historyList';
import './FineDetailsPage.css';

const FineDetailsPage = () => {
  const { user_id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { showToast } = useToast();
  const [fines, setFines] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isPaying, setIsPaying] = useState(false);
  const [totalFine, setTotalFine] = useState(0);
  const [sortOrder, setSortOrder] = useState('desc');
  const [page, setPage] = useState(1);

  // 加载用户的罚款记录
  useEffect(() => {
    const fetchFines = async () => {
      try {
        setLoading(true);
        const data = await borrowAPI.getUserFines(user_id || user.id);
        setFines(data);
        setPage(1);
        // 计算未支付罚款金额
        const total = data
          .filter(fine => fine.fine_status === 'unpaid')
          .reduce((sum, fine) => sum + fine.fine, 0);
        setTotalFine(total);
      } catch (err) {
        showToast('Failed to load fine records', 'error');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    if (user_id || user) {
      fetchFines();
    }
  }, [user_id, user, showToast]);

  // 处理支付罚款
  const handlePayFine = async () => {
    try {
      if (isPaying) {
        return; // 防止重复点击
      }
      setIsPaying(true);
      const result = await borrowAPI.payFine(user_id || user.id);
      showToast(`Fines paid successfully: ¥${result.amount}`, 'success');
      // 重新加载罚款记录
      const data = await borrowAPI.getUserFines(user_id || user.id);
      setFines(data);
      setPage(1);
      const total = data
        .filter(fine => fine.fine_status === 'unpaid')
        .reduce((sum, fine) => sum + fine.fine, 0);
      setTotalFine(total);
    } catch (err) {
      showToast(err.message, 'error');
      console.error(err);
    } finally {
      setIsPaying(false);
    }
  };

  // 处理返回
  const handleBack = () => {
    navigate('/profile');
  };

  if (loading) {
    return <div className="loading">Loading fine records...</div>;
  }

  const sortedFines = sortFineRecords(fines, sortOrder);
  const {
    pageItems: visibleFines,
    totalPages,
    safePage: currentPage
  } = paginateRecords(sortedFines, page, DEFAULT_HISTORY_PAGE_SIZE);

  return (
    <div className="fine-details-page card fade-in">
      <button className="back-button" onClick={handleBack}>
        ← Back
      </button>
      
      <h1>Fine Records</h1>
      
      <div className="fine-summary">
        <h2>Unpaid Fine: ¥{totalFine.toFixed(2)}</h2>
        {totalFine > 0 && (
          <button 
            className="btn-primary pay-button"
            onClick={handlePayFine}
            disabled={isPaying}
          >
            {isPaying ? 'Processing...' : 'Pay All Fines'}
          </button>
        )}
      </div>
      
      <div className="fine-list">
        {fines.length > 0 ? (
          <>
            <div className="history-toolbar">
              <span>{fines.length} records</span>
              <button
                type="button"
                className="btn-secondary history-sort-button"
                onClick={() => {
                  setSortOrder(sortOrder === 'desc' ? 'asc' : 'desc');
                  setPage(1);
                }}
              >
                {sortOrder === 'desc' ? 'Oldest First' : 'Newest First'}
              </button>
            </div>
            {visibleFines.map(fine => (
              <div key={fine.id} className="fine-item">
                <div className="fine-book-info">
                  <h3>{fine.title}</h3>
                  <p>by {fine.author}</p>
                </div>
                <div className="fine-details">
                  <div className="fine-meta">
                    <span className="meta-label">Borrow Date:</span>
                    <span className="meta-value">{fine.borrow_date}</span>
                  </div>
                  <div className="fine-meta">
                    <span className="meta-label">Due Date:</span>
                    <span className="meta-value">{fine.due_date}</span>
                  </div>
                  <div className="fine-meta">
                    <span className="meta-label">Return Date:</span>
                    <span className="meta-value">{fine.return_date}</span>
                  </div>
                  <div className="fine-amount">
                    <span className="amount-label">Fine:</span>
                    <span className="amount-value">¥{fine.fine.toFixed(2)}</span>
                  </div>
                  <div className="fine-status">
                    <span className={`status-badge ${fine.fine_status === 'paid' ? 'status-paid' : 'status-unpaid'}`}>
                      {fine.fine_status === 'paid' ? 'Paid' : 'Unpaid'}
                    </span>
                  </div>
                </div>
              </div>
            ))}
            {fines.length > DEFAULT_HISTORY_PAGE_SIZE && (
              <div className="history-pagination">
                <button
                  type="button"
                  onClick={() => setPage(Math.max(1, currentPage - 1))}
                  disabled={currentPage === 1}
                >
                  Previous
                </button>
                <span>Page {currentPage} of {totalPages}</span>
                <button
                  type="button"
                  onClick={() => setPage(Math.min(totalPages, currentPage + 1))}
                  disabled={currentPage === totalPages}
                >
                  Next
                </button>
              </div>
            )}
          </>
        ) : (
          <div className="no-fines">
            <p>No fine records found.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default FineDetailsPage;
