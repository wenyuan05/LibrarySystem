import React, { useCallback, useState, useEffect } from 'react';
import QRCode from 'qrcode';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/useAuth';
import { useToast } from '../context/ToastContext';
import { borrowAPI, paymentAPI, systemAPI } from '../utils/api';
import { DEFAULT_HISTORY_PAGE_SIZE, paginateRecords, sortFineRecords } from '../utils/historyList';
import { scrollToListTop } from '../utils/scrollToListTop';
import './FineDetailsPage.css';

const isActualPayableFine = (fine) => (
  fine.fine_status === 'unpaid' && ['returning', 'returned'].includes(fine.status)
);
const isEstimatedFine = (fine, fineFeatureEnabled = true) => (
  fineFeatureEnabled && fine.fine_status === 'unpaid' && !['returning', 'returned'].includes(fine.status)
);

const initialFineFilters = {
  keyword: '',
  status: '',
  date_from: '',
  date_to: ''
};

const getFineDisplayStatus = (fine, fineFeatureEnabled = true) => {
  if (isEstimatedFine(fine, fineFeatureEnabled)) return 'estimated';
  return fine.fine_status === 'paid' ? 'paid' : 'unpaid';
};

const fineMatchesFilters = (fine, filters, fineFeatureEnabled = true) => {
  const keyword = filters.keyword.trim().toLowerCase();
  if (keyword) {
    const searchable = [
      fine.id,
      fine.title,
      fine.author,
      fine.borrow_date,
      fine.due_date,
      fine.return_date
    ].map(value => String(value || '').toLowerCase());

    if (!searchable.some(value => value.includes(keyword))) {
      return false;
    }
  }

  if (filters.status && getFineDisplayStatus(fine, fineFeatureEnabled) !== filters.status) {
    return false;
  }

  const recordDate = fine.return_date || fine.due_date || fine.borrow_date || '';
  if (filters.date_from && recordDate < filters.date_from) {
    return false;
  }
  if (filters.date_to && recordDate > filters.date_to) {
    return false;
  }

  return true;
};

const FineDetailsPage = () => {
  const { user_id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { showToast } = useToast();
  const targetUserId = user_id || user?.id;
  const [fines, setFines] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isPaying, setIsPaying] = useState(false);
  const [totalFine, setTotalFine] = useState(0);
  const [sortOrder, setSortOrder] = useState('desc');
  const [page, setPage] = useState(1);
  const [filters, setFilters] = useState(initialFineFilters);
  const [appliedFilters, setAppliedFilters] = useState(initialFineFilters);
  const [paymentOrder, setPaymentOrder] = useState(null);
  const [isCompletingPayment, setIsCompletingPayment] = useState(false);
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState('');
  const [paymentConfig, setPaymentConfig] = useState(null);
  const [fineFeatureEnabled, setFineFeatureEnabled] = useState(true);

  const loadFines = useCallback(async () => {
    if (!targetUserId) return [];
    const data = await borrowAPI.getUserFines(targetUserId);
    setFines(data);
    setPage(1);
    const total = data
      .filter(isActualPayableFine)
      .reduce((sum, fine) => sum + (Number(fine.fine) || 0), 0);
    setTotalFine(total);
    return data;
  }, [targetUserId]);

  useEffect(() => {
    let isMounted = true;
    if (!paymentOrder?.qr_code) {
      setQrCodeDataUrl('');
      return undefined;
    }

    QRCode.toDataURL(paymentOrder.qr_code, {
      width: 280,
      margin: 2,
      errorCorrectionLevel: 'M',
      color: {
        dark: '#111827',
        light: '#FFFFFF'
      }
    })
      .then(url => {
        if (isMounted) setQrCodeDataUrl(url);
      })
      .catch(err => {
        console.error('Failed to generate payment QR code:', err);
        if (isMounted) setQrCodeDataUrl('');
      });

    return () => {
      isMounted = false;
    };
  }, [paymentOrder?.qr_code]);

  useEffect(() => {
    const fetchFeatureFlags = async () => {
      try {
        const flags = await systemAPI.getFeatureFlags();
        setFineFeatureEnabled(flags.fine_enabled !== false);
      } catch (err) {
        console.error('Failed to fetch fine feature flag:', err);
      }
    };

    fetchFeatureFlags();
  }, []);

  useEffect(() => {
    let isMounted = true;
    const loadPaymentConfig = async () => {
      try {
        const config = await paymentAPI.getAlipayStatus();
        if (isMounted) setPaymentConfig(config);
      } catch (err) {
        console.error('Failed to load payment configuration:', err);
      }
    };

    loadPaymentConfig();

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    if (!paymentOrder?.id || paymentOrder.status !== 'pending') {
      return undefined;
    }

    let isMounted = true;
    const pollPayment = async () => {
      try {
        const latest = await paymentAPI.getPayment(paymentOrder.id);
        if (!isMounted) return;

        if (latest.status !== paymentOrder.status) {
          setPaymentOrder(latest);
          if (latest.status === 'paid') {
            showToast('Payment completed. Fine records refreshed.', 'success');
            await loadFines();
          } else if (latest.status === 'expired') {
            showToast('Payment expired. Please create a new payment order.', 'warning');
          }
        }
      } catch (err) {
        console.error('Failed to poll payment status:', err);
      }
    };

    const timer = setInterval(pollPayment, 2500);
    return () => {
      isMounted = false;
      clearInterval(timer);
    };
  }, [paymentOrder?.id, paymentOrder?.status, showToast, loadFines]);

  // 加载用户的罚款记录
  useEffect(() => {
    const fetchFines = async () => {
      try {
        setLoading(true);
        await loadFines();
      } catch (err) {
        showToast('Failed to load fine records', 'error');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    if (targetUserId) {
      fetchFines();
    }
  }, [targetUserId, showToast, loadFines]);

  // 创建支付宝模拟支付单
  const handleCreatePayment = async () => {
    try {
      if (isPaying) {
        return; // 防止重复点击
      }
      setIsPaying(true);
      const result = await paymentAPI.createFineAlipayPayment(targetUserId);
      setPaymentOrder(result);
      showToast(`${result.reused ? 'Existing' : 'New'} Alipay payment ready: ¥${Number(result.amount).toFixed(2)}`, 'success');
    } catch (err) {
      showToast(err.message, 'error');
      console.error(err);
    } finally {
      setIsPaying(false);
    }
  };

  // 本地模拟支付宝回调成功
  const handleSimulatePaymentSuccess = async () => {
    if (!paymentOrder || isCompletingPayment) {
      return;
    }

    try {
      setIsCompletingPayment(true);
      const result = await paymentAPI.simulateAlipayNotify(paymentOrder.out_trade_no);
      setPaymentOrder(result.payment);
      showToast(`Payment completed: ¥${Number(result.payment.amount).toFixed(2)}`, 'success');
      await loadFines();
    } catch (err) {
      showToast(err.message, 'error');
      console.error(err);
    } finally {
      setIsCompletingPayment(false);
    }
  };

  // 处理返回
  const handleBack = () => {
    navigate('/profile');
  };

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters(prevFilters => ({
      ...prevFilters,
      [name]: value
    }));
  };

  const handleFilterSubmit = (e) => {
    e.preventDefault();
    if (filters.date_from && filters.date_to && filters.date_from > filters.date_to) {
      showToast('Fine start date cannot be after end date', 'error');
      return;
    }
    setAppliedFilters(filters);
    setPage(1);
  };

  const handleFilterReset = () => {
    setFilters(initialFineFilters);
    setAppliedFilters(initialFineFilters);
    setPage(1);
  };

  const handlePageChange = (nextPage) => {
    setPage(nextPage);
    scrollToListTop('#fine-records-list-top');
  };

  if (loading) {
    return <div className="loading">Loading fine records...</div>;
  }

  const filteredFines = fines.filter(fine => fineMatchesFilters(fine, appliedFilters, fineFeatureEnabled));
  const sortedFines = sortFineRecords(filteredFines, sortOrder);
  const actualUnpaidFine = fines
    .filter(isActualPayableFine)
    .reduce((sum, fine) => sum + (Number(fine.fine) || 0), 0);
  const estimatedFine = fines
    .filter(fine => isEstimatedFine(fine, fineFeatureEnabled))
    .reduce((sum, fine) => sum + (Number(fine.fine) || 0), 0);
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
        <div className="fine-summary-amounts">
          <h2>Payable Fine: ¥{totalFine.toFixed(2)}</h2>
          {fineFeatureEnabled && <span>Estimated Fine: ¥{estimatedFine.toFixed(2)}</span>}
        </div>
        {actualUnpaidFine > 0 && (
          <button 
            className="btn-primary pay-button"
            onClick={handleCreatePayment}
            disabled={isPaying}
          >
            {isPaying ? 'Creating...' : 'Pay with Alipay'}
          </button>
        )}
      </div>

      {paymentOrder && (
        <section className="alipay-panel">
          <div className="alipay-panel-header">
            <div>
              <h2>Alipay Payment</h2>
              <p>{paymentOrder.subject}</p>
            </div>
            <span className={`payment-status status-${paymentOrder.status}`}>
              {paymentOrder.status}
            </span>
          </div>
          <div className="alipay-payment-body">
            <div className={`alipay-qr-box ${paymentOrder.status === 'paid' ? 'is-paid' : ''}`} aria-label="Alipay QR code">
              {qrCodeDataUrl ? (
                <>
                  <img className="alipay-qr-image" src={qrCodeDataUrl} alt="Alipay payment QR code" />
                  {paymentOrder.status === 'paid' && (
                    <img className="alipay-paid-mark" src="/打勾.png" alt="Payment completed" />
                  )}
                </>
              ) : (
                <span>Generating QR...</span>
              )}
            </div>
            <div className="alipay-payment-info">
              <div className="fine-meta">
                <span className="meta-label">Order:</span>
                <span className="meta-value">{paymentOrder.out_trade_no}</span>
              </div>
              <div className="fine-meta">
                <span className="meta-label">Amount:</span>
                <span className="meta-value">¥{Number(paymentOrder.amount).toFixed(2)}</span>
              </div>
              <a className="payment-link" href={paymentOrder.payment_url} target="_blank" rel="noreferrer">
                Open Alipay payment link
              </a>
              {paymentOrder.status === 'pending' && paymentConfig?.simulationEnabled && (
                <button
                  type="button"
                  className="btn-primary simulate-pay-button"
                  onClick={handleSimulatePaymentSuccess}
                  disabled={isCompletingPayment}
                >
                  {isCompletingPayment ? 'Completing...' : 'Simulate Payment Success'}
                </button>
              )}
            </div>
          </div>
        </section>
      )}
      
      <div className="fine-list">
        {fines.length > 0 ? (
          <>
            <div className="history-toolbar">
              <span>{filteredFines.length} of {fines.length} records</span>
              <button
                type="button"
                className="btn-secondary history-sort-button"
                onClick={() => {
                  setSortOrder(sortOrder === 'desc' ? 'asc' : 'desc');
                  setPage(1);
                }}
              >
                {sortOrder === 'desc' ? 'Ascending' : 'Descending'}
              </button>
            </div>
            <form className="fine-filters" onSubmit={handleFilterSubmit}>
              <label>
                <span>Keyword</span>
                <input
                  type="search"
                  name="keyword"
                  value={filters.keyword}
                  onChange={handleFilterChange}
                  placeholder="ID, title, author, date"
                />
              </label>
              <label>
                <span>Status</span>
                <select name="status" value={filters.status} onChange={handleFilterChange}>
                  <option value="">All statuses</option>
                  <option value="unpaid">Unpaid</option>
                  <option value="paid">Paid</option>
                  <option value="estimated">Estimated</option>
                </select>
              </label>
              <label>
                <span>Date from</span>
                <input
                  type="date"
                  name="date_from"
                  value={filters.date_from}
                  onChange={handleFilterChange}
                />
              </label>
              <label>
                <span>Date to</span>
                <input
                  type="date"
                  name="date_to"
                  value={filters.date_to}
                  onChange={handleFilterChange}
                />
              </label>
              <button type="submit" className="btn-secondary">Filter</button>
              <button type="button" className="btn-secondary" onClick={handleFilterReset}>Reset</button>
            </form>
            {filteredFines.length === 0 ? (
              <div className="no-fines">
                <p>No fine records match the current filters.</p>
              </div>
            ) : (
              <>
              <div id="fine-records-list-top" />
              {visibleFines.map(fine => {
                const isEstimated = isEstimatedFine(fine, fineFeatureEnabled);

                return (
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
                    <span className="amount-label">{isEstimated ? 'Estimated Fine:' : 'Fine:'}</span>
                    <span className="amount-value">¥{(Number(fine.fine) || 0).toFixed(2)}</span>
                  </div>
                  <div className="fine-status">
                    <span className={`status-badge ${isEstimated ? 'status-estimated' : fine.fine_status === 'paid' ? 'status-paid' : 'status-unpaid'}`}>
                      {isEstimated ? 'Estimated' : fine.fine_status === 'paid' ? 'Paid' : 'Unpaid'}
                    </span>
                  </div>
                </div>
              </div>
                );
              })}
              </>
            )}
            {filteredFines.length > DEFAULT_HISTORY_PAGE_SIZE && (
              <div className="history-pagination">
                <button
                  type="button"
                  onClick={() => handlePageChange(Math.max(1, currentPage - 1))}
                  disabled={currentPage === 1}
                >
                  Previous
                </button>
                <span>Page {currentPage} of {totalPages}</span>
                <button
                  type="button"
                  onClick={() => handlePageChange(Math.min(totalPages, currentPage + 1))}
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
