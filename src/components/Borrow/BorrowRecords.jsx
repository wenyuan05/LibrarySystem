import React, { useState, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../../context/useAuth';
import { useToast } from '../../context/ToastContext';
import { usersAPI, borrowAPI, booksAPI, systemAPI } from '../../utils/api';
import { DEFAULT_HISTORY_PAGE_SIZE, paginateRecords, sortBorrowRecords, sortFineRecords } from '../../utils/historyList';
import { scrollToListTop } from '../../utils/scrollToListTop';
import Barcode from '../Barcode';
import './Borrow.css';

const getFineAmount = (fine) => Number(fine) || 0;
const getCountdownSeconds = (deadline) => {
  if (!deadline) return 0;
  const diffInSeconds = Math.floor((new Date(deadline) - new Date()) / 1000);
  return Math.max(0, diffInSeconds);
};

const formatCountdown = (secondsLeft) => {
  const minutes = Math.floor(secondsLeft / 60);
  const seconds = secondsLeft % 60;
  return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
};

const isActualPayableFine = (fine) => (
  fine.fine_status === 'unpaid' && ['returning', 'returned'].includes(fine.status)
);
const isEstimatedFine = (fine, fineFeatureEnabled = true) => (
  fineFeatureEnabled && fine.fine_status === 'unpaid' && !['returning', 'returned'].includes(fine.status)
);
const shouldShowRecordFine = (record, fineFeatureEnabled = true) => (
  getFineAmount(record.fine) > 0 && (fineFeatureEnabled || ['returning', 'returned'].includes(record.status))
);
const recordMatchesFilters = (record, filters) => {
  const keyword = filters.keyword.trim().toLowerCase();
  const matchesKeyword = !keyword || [
    record.id,
    record.title,
    record.author,
    record.copy_code,
    record.status
  ].some(value => String(value || '').toLowerCase().includes(keyword));
  const matchesStatus = !filters.status || record.status === filters.status;
  const recordDate = record.borrow_date || '';
  const matchesStart = !filters.date_from || recordDate >= filters.date_from;
  const matchesEnd = !filters.date_to || recordDate <= filters.date_to;

  return matchesKeyword && matchesStatus && matchesStart && matchesEnd;
};

const BorrowRecords = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialRecordFilters = {
    keyword: searchParams.get('keyword') || '',
    status: searchParams.get('status') || '',
    date_from: searchParams.get('date_from') || '',
    date_to: searchParams.get('date_to') || ''
  };
  const [records, setRecords] = useState([]);
  const [overdueCount, setOverdueCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [showFineModal, setShowFineModal] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [confirmRecord, setConfirmRecord] = useState(null);
  const [confirmCopies, setConfirmCopies] = useState([]);
  const [selectedCopyId, setSelectedCopyId] = useState('');
  const [confirmCountdown, setConfirmCountdown] = useState(0);
  const [fines, setFines] = useState([]);
  const [totalFine, setTotalFine] = useState(0);
  const [fineFeatureEnabled, setFineFeatureEnabled] = useState(true);
  const [recordSortOrder, setRecordSortOrder] = useState(searchParams.get('sort') || 'desc');
  const [recordPage, setRecordPage] = useState(Math.max(1, Number(searchParams.get('page')) || 1));
  const [recordFilters, setRecordFilters] = useState(initialRecordFilters);
  const [appliedRecordFilters, setAppliedRecordFilters] = useState(recordFilters);
  const [fineSortOrder, setFineSortOrder] = useState('desc');
  const [finePage, setFinePage] = useState(1);
  const { user } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();
  const location = useLocation();

  const fetchBorrowRecords = useCallback(async () => {
    if (!user?.id) return;
    try {
      setLoading(true);
      const data = await usersAPI.getBorrowRecords(user.id);
      setRecords(data.records);
      setOverdueCount(data.overdue_count || 0);
      
      // 如果有逾期记录，计算预估罚款并显示提醒
      if (data.overdue_count > 0) {
        const overdueFines = fineFeatureEnabled
          ? data.records
            .filter(r => r.status === 'overdue' && r.fine > 0)
            .reduce((sum, r) => sum + r.fine, 0)
          : 0;
        const overdueLabel = data.overdue_count === 1 ? 'book' : 'books';
        const returnTarget = data.overdue_count === 1 ? 'it' : 'them';
        const msg = overdueFines > 0
          ? `You have ${data.overdue_count} overdue ${overdueLabel}. Estimated fine: ¥${overdueFines.toFixed(2)}. Please return ${returnTarget} as soon as possible.`
          : `You have ${data.overdue_count} overdue ${overdueLabel}. Please return ${returnTarget} as soon as possible.`;
        showToast(msg, 'warning');
      }
    } catch (err) {
      showToast('Failed to load borrow records', 'error');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [fineFeatureEnabled, showToast, user?.id]);

  // 加载借阅记录
  useEffect(() => {
    fetchBorrowRecords();
  }, [fetchBorrowRecords]);

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
    const nextParams = new URLSearchParams();

    if (recordPage > 1) nextParams.set('page', String(recordPage));
    if (recordSortOrder !== 'desc') nextParams.set('sort', recordSortOrder);
    if (appliedRecordFilters.keyword) nextParams.set('keyword', appliedRecordFilters.keyword);
    if (appliedRecordFilters.status) nextParams.set('status', appliedRecordFilters.status);
    if (appliedRecordFilters.date_from) nextParams.set('date_from', appliedRecordFilters.date_from);
    if (appliedRecordFilters.date_to) nextParams.set('date_to', appliedRecordFilters.date_to);

    setSearchParams(nextParams, { replace: true });
  }, [appliedRecordFilters, recordPage, recordSortOrder, setSearchParams]);

  useEffect(() => {
    if (!confirmRecord?.confirm_deadline) {
      setConfirmCountdown(0);
      return undefined;
    }

    const updateCountdown = () => {
      setConfirmCountdown(getCountdownSeconds(confirmRecord.confirm_deadline));
    };

    updateCountdown();
    const timer = setInterval(updateCountdown, 1000);

    return () => clearInterval(timer);
  }, [confirmRecord?.confirm_deadline]);

  // 处理归还书籍
  const handleReturnBook = async (record) => {
    try {
      if (!record.book_id) {
        throw new Error('Book ID not found in record');
      }
      
      const result = await borrowAPI.return(user.id, record.book_id);
      
      // 更新借阅记录
      setRecords(records.map(r => 
        r.id === record.id ? { ...r, return_date: new Date().toISOString().split('T')[0], status: 'returning' } : r
      ));
      
      showToast(result.message, 'success');
    } catch (err) {
      showToast(err.message, 'error');
      console.error(err);
    }
  };

  // 处理续借书籍
  const handleRenewBook = async (record) => {
    try {
      if (!record.book_id) {
        throw new Error('Book ID not found in record');
      }
      
      const result = await borrowAPI.renew(user.id, record.book_id);
      
      // 更新借阅记录
      setRecords(records.map(r => 
        r.id === record.id ? { ...r, due_date: result.new_due_date, renew_count: result.renew_count } : r
      ));
      
      showToast(result.message, 'success');
    } catch (err) {
      showToast(err.message, 'error');
      console.error(err);
    }
  };

  // 打开确认借阅弹窗
  const openConfirmModal = async (record) => {
    try {
      const copies = await booksAPI.getCopies(record.book_id);
      const availableCopies = copies.filter(
        copy => copy.status === 'available' || copy.id === record.copy_id
      );
      setConfirmRecord(record);
      setConfirmCopies(availableCopies);
      setSelectedCopyId(availableCopies[0]?.id || '');
      setShowConfirmModal(true);
    } catch (err) {
      showToast('Failed to load book copies', 'error');
      console.error(err);
    }
  };

  const closeConfirmModal = () => {
    setShowConfirmModal(false);
  };

  const resetConfirmModal = () => {
    setShowConfirmModal(false);
    setConfirmRecord(null);
    setConfirmCopies([]);
    setSelectedCopyId('');
    setConfirmCountdown(0);
  };

  // 处理确认借阅
  const handleConfirmBorrow = async () => {
    try {
      if (!confirmRecord?.id || !selectedCopyId) {
        throw new Error('Please select a copy before confirming');
      }
      
      const result = await borrowAPI.confirmBorrow(confirmRecord.id, Number(selectedCopyId));
      
      // 更新借阅记录
      setRecords(records.map(r => 
        r.id === confirmRecord.id ? { ...r, status: 'borrowed' } : r
      ));
      
      resetConfirmModal();
      fetchBorrowRecords();
      showToast(result.message, 'success');
    } catch (err) {
      showToast(err.message, 'error');
      console.error(err);
    }
  };

  const handleCancelBorrowLock = async () => {
    try {
      if (!confirmRecord?.id) {
        throw new Error('No borrow record found');
      }

      const result = await borrowAPI.cancelBorrowLock(confirmRecord.id);
      setRecords(prevRecords => prevRecords.map(r =>
        r.id === confirmRecord.id ? { ...r, status: 'timeout' } : r
      ));
      resetConfirmModal();
      fetchBorrowRecords();
      showToast(result.message, 'success');
    } catch (err) {
      showToast(err.message, 'error');
      console.error(err);
    }
  };

  // 获取用户罚款记录
  const handleGetFines = async () => {
    try {
      const data = await borrowAPI.getUserFines(user.id);
      const fineRecords = Array.isArray(data) ? data : [];
      setFines(fineRecords);
      setFinePage(1);
      setTotalFine(
        fineRecords
          .filter(isActualPayableFine)
          .reduce((sum, fine) => sum + (Number(fine.fine) || 0), 0)
      );
      setShowFineModal(true);
    } catch (err) {
      showToast('Failed to load fines', 'error');
      console.error(err);
    }
  };

  // 跳转到支付宝模拟支付页面
  const handleGoToFinePayment = () => {
    setShowFineModal(false);
    navigate(`/fines/${user.id}`);
  };

  const handleRecordFilterChange = (event) => {
    const { name, value } = event.target;
    setRecordFilters(prev => ({ ...prev, [name]: value }));
  };

  const handleRecordFilterSubmit = (event) => {
    event.preventDefault();
    if (recordFilters.date_from && recordFilters.date_to && recordFilters.date_from > recordFilters.date_to) {
      showToast('Borrow start date cannot be after end date', 'error');
      return;
    }
    setRecordPage(1);
    setAppliedRecordFilters(recordFilters);
  };

  const handleRecordFilterReset = () => {
    const emptyFilters = { keyword: '', status: '', date_from: '', date_to: '' };
    setRecordFilters(emptyFilters);
    setAppliedRecordFilters(emptyFilters);
    setRecordPage(1);
  };

  const handleOpenBookDetail = async (record) => {
    try {
      if (!record.book_id) {
        throw new Error('Book ID not found in record');
      }

      await booksAPI.getById(record.book_id);
      const fromParams = new URLSearchParams();
      if (recordPage > 1) fromParams.set('page', String(recordPage));
      if (recordSortOrder !== 'desc') fromParams.set('sort', recordSortOrder);
      if (appliedRecordFilters.keyword) fromParams.set('keyword', appliedRecordFilters.keyword);
      if (appliedRecordFilters.status) fromParams.set('status', appliedRecordFilters.status);
      if (appliedRecordFilters.date_from) fromParams.set('date_from', appliedRecordFilters.date_from);
      if (appliedRecordFilters.date_to) fromParams.set('date_to', appliedRecordFilters.date_to);
      const from = `${location.pathname}${fromParams.toString() ? `?${fromParams.toString()}` : ''}`;
      navigate(`/books/${record.book_id}?returnTo=${encodeURIComponent(from)}`, {
        state: { from }
      });
    } catch (err) {
      showToast(err.message || 'Book not found or has been removed', 'error');
      console.error(err);
    }
  };

  const handleRecordPageChange = (nextPage) => {
    setRecordPage(nextPage);
    scrollToListTop('#borrow-records-list-top');
  };

  const handleFinePageChange = (nextPage) => {
    setFinePage(nextPage);
    scrollToListTop('#borrow-fines-list-top');
  };

  if (loading) {
    return <div className="loading">Loading borrow records...</div>;
  }

  const filteredRecords = records.filter(record => recordMatchesFilters(record, appliedRecordFilters));
  const sortedRecords = sortBorrowRecords(filteredRecords, recordSortOrder);
  const {
    pageItems: visibleRecords,
    totalPages: recordTotalPages,
    safePage: currentRecordPage
  } = paginateRecords(sortedRecords, recordPage, DEFAULT_HISTORY_PAGE_SIZE);
  const sortedFines = sortFineRecords(fines, fineSortOrder);
  const estimatedFine = fines
    .filter(fine => isEstimatedFine(fine, fineFeatureEnabled))
    .reduce((sum, fine) => sum + (Number(fine.fine) || 0), 0);
  const {
    pageItems: visibleFines,
    totalPages: fineTotalPages,
    safePage: currentFinePage
  } = paginateRecords(sortedFines, finePage, DEFAULT_HISTORY_PAGE_SIZE);

  return (
    <div className="borrow-records">
      <div className="borrow-records-header">
        <h3>My Borrow Records</h3>
        <div className="borrow-records-header-actions">
          <div className={`fine-feature-status ${fineFeatureEnabled ? 'enabled' : 'disabled'}`}>
            <span className="fine-feature-dot" />
            <span>{fineFeatureEnabled ? 'Fines On' : 'Fines Off'}</span>
          </div>
          {overdueCount > 0 && (
            <div className="overdue-count">
              <span className="overdue-badge">{overdueCount}</span>
              <span className="overdue-text">Overdue Books</span>
            </div>
          )}
          {user.role === 'user' && (
            <button
              className="btn-warning view-fines-button"
              onClick={handleGetFines}
            >
              View Fines
            </button>
          )}
        </div>
      </div>
      {records.length === 0 ? (
        <div className="empty-state">
          <p>No borrow records found.</p>
        </div>
      ) : (
        <>
          <div className="history-toolbar">
            <span>{filteredRecords.length} of {records.length} records</span>
            <button
              type="button"
              className="btn-secondary history-sort-button"
              onClick={() => {
                setRecordSortOrder(recordSortOrder === 'desc' ? 'asc' : 'desc');
                setRecordPage(1);
              }}
            >
              {recordSortOrder === 'desc' ? 'Ascending' : 'Descending'}
            </button>
          </div>
          <form className="history-filters" onSubmit={handleRecordFilterSubmit}>
            <label>
              Keyword
              <input
                type="search"
                name="keyword"
                value={recordFilters.keyword}
                onChange={handleRecordFilterChange}
                placeholder="Title, barcode, status"
              />
            </label>
            <label>
              Status
              <select name="status" value={recordFilters.status} onChange={handleRecordFilterChange}>
                <option value="">All statuses</option>
                <option value="borrowing">Borrowing</option>
                <option value="borrowed">Borrowed</option>
                <option value="overdue">Overdue</option>
                <option value="returning">Returning</option>
                <option value="returned">Returned</option>
                <option value="timeout">Timeout</option>
              </select>
            </label>
            <label>
              Borrow From
              <input type="date" name="date_from" value={recordFilters.date_from} onChange={handleRecordFilterChange} />
            </label>
            <label>
              Borrow To
              <input type="date" name="date_to" value={recordFilters.date_to} onChange={handleRecordFilterChange} />
            </label>
            <button type="submit" className="btn-secondary">Filter</button>
            <button type="button" className="btn-secondary" onClick={handleRecordFilterReset}>Reset</button>
          </form>
          {filteredRecords.length === 0 ? (
            <div className="empty-state">
              <p>No borrow records match the current filters.</p>
            </div>
          ) : (
          <>
          <div id="borrow-records-list-top" />
          <div className="borrow-records-table-wrap">
            <table className="borrow-records-table">
            <colgroup>
              <col className="col-id" />
              <col className="col-title" />
              <col className="col-barcode" />
              <col className="col-date" />
              <col className="col-date" />
              <col className="col-date" />
              <col className="col-status" />
              <col className="col-fine" />
              <col className="col-action" />
            </colgroup>
            <thead>
              <tr>
                <th>ID</th>
                <th>Title</th>
                <th>Barcode</th>
                <th>Borrow Date</th>
                <th>Due Date</th>
                <th>Return Date</th>
                <th>Status</th>
                <th>Fine</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {visibleRecords.map(record => (
                <tr
                  key={record.id}
                  className="fade-in borrow-record-clickable"
                  role="button"
                  tabIndex={0}
                  onClick={() => handleOpenBookDetail(record)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      handleOpenBookDetail(record);
                    }
                  }}
                >
                  <td>{record.id}</td>
                  <td className="title-cell">{record.title}</td>
                  <td className="barcode-cell">
                    {record.status !== 'borrowing' && record.copy_code && (
                      <Barcode code={record.copy_code} width={1.5} height={36} />
                    )}
                  </td>
                  <td className="date-cell">{record.borrow_date}</td>
                  <td className="date-cell">{record.due_date}</td>
                  <td className="date-cell">{record.return_date || 'Not returned'}</td>
                  <td>
                    <span className={
                      `borrow-status-badge ${
                        record.status === 'returned' ? 'status-returned' :
                        record.status === 'returning' ? 'status-returning' :
                        record.status === 'borrowing' ? 'status-borrowing' :
                        record.status === 'overdue' ? 'status-overdue' : 'status-borrowed'
                      }`
                    }>
                      {record.status === 'returned' ? 'Returned' :
                       record.status === 'returning' ? 'Returning' :
                       record.status === 'borrowing' ? 'Borrowing' :
                       record.status === 'overdue' ? 'Overdue' : 'Borrowed'}
                    </span>
                  </td>
                  <td className={shouldShowRecordFine(record, fineFeatureEnabled) ? 'borrow-fine-amount' : 'borrow-fine-empty'}>
                    {shouldShowRecordFine(record, fineFeatureEnabled) ? `¥${getFineAmount(record.fine).toFixed(2)}` : '-'}
                  </td>
                  <td className="borrow-action-cell">
                    {(record.status === 'borrowed' || record.status === 'overdue') && (
                      <div className="action-buttons">
                        <button
                          className="btn-info"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleReturnBook(record);
                          }}
                        >
                          Return
                        </button>
                        {record.status === 'borrowed' && (
                          <button
                            className="btn-secondary"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleRenewBook(record);
                            }}
                          >
                            Renew
                          </button>
                        )}
                      </div>
                    )}
                    {record.status === 'borrowing' && (
                      <div className="action-buttons">
                        <button
                          className="btn-info"
                          onClick={(e) => {
                            e.stopPropagation();
                            openConfirmModal(record);
                          }}
                        >
                          Confirm
                        </button>
                      </div>
                    )}
                    {record.status === 'returning' && (
                      <span className="status-pending">Pending approval</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
            </table>
          </div>
          </>
          )}
          {filteredRecords.length > DEFAULT_HISTORY_PAGE_SIZE && (
            <div className="history-pagination">
              <button
                type="button"
                onClick={() => handleRecordPageChange(Math.max(1, currentRecordPage - 1))}
                disabled={currentRecordPage === 1}
              >
                Previous
              </button>
              <span>Page {currentRecordPage} of {recordTotalPages}</span>
              <button
                type="button"
                onClick={() => handleRecordPageChange(Math.min(recordTotalPages, currentRecordPage + 1))}
                disabled={currentRecordPage === recordTotalPages}
              >
                Next
              </button>
            </div>
          )}
        </>
      )}

      {/* 确认借阅弹窗 */}
      {showConfirmModal && confirmRecord && createPortal((
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h3>Confirm Borrowing</h3>
              <button
                className="modal-close"
                onClick={closeConfirmModal}
                aria-label="Close confirm modal"
              >
                <img src="/打叉.svg" alt="" />
              </button>
            </div>
            <div className="modal-body">
              <p><strong>User:</strong> {user?.name}</p>
              <p><strong>Book:</strong> {confirmRecord.title}</p>
              <div className="confirm-countdown">
                <span>Time left to confirm:</span>
                <strong>{formatCountdown(confirmCountdown)}</strong>
              </div>
              <div className="copy-selection">
                <label>Select Copy:</label>
                <select
                  value={selectedCopyId}
                  onChange={(e) => setSelectedCopyId(e.target.value)}
                >
                  {confirmCopies.map(copy => (
                    <option key={copy.id} value={copy.id}>
                      {copy.copy_code || `Copy #${copy.id}`} ({copy.status === 'available' ? 'Available' : 'Previously selected'})
                    </option>
                  ))}
                </select>
              </div>
              {selectedCopyId && confirmCopies.find(copy => copy.id === Number(selectedCopyId))?.copy_code && (
                <div className="selected-copy-barcode">
                  <Barcode
                    code={confirmCopies.find(copy => copy.id === Number(selectedCopyId)).copy_code}
                    width={2}
                    height={50}
                  />
                </div>
              )}
              {confirmCopies.length === 0 && (
                <p>No available copies found.</p>
              )}
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
                disabled={!selectedCopyId}
              >
                Confirm
              </button>
            </div>
          </div>
        </div>
      ), document.body)}

      {/* 罚款信息弹窗 */}
      {showFineModal && createPortal((
        <div className="modal-overlay">
          <div className="modal-content fine-modal-content">
            <div className="modal-header">
              <h3>My Fines</h3>
              <button 
                className="modal-close"
                onClick={() => setShowFineModal(false)}
              >
                ×
              </button>
            </div>
            <div className="modal-body">
              {fines.length === 0 ? (
                <p>No fines found.</p>
              ) : (
                <div>
                  <div className="history-toolbar">
                    <span>{fines.length} records</span>
                    <button
                      type="button"
                      className="btn-secondary history-sort-button"
                      onClick={() => {
                        setFineSortOrder(fineSortOrder === 'desc' ? 'asc' : 'desc');
                        setFinePage(1);
                      }}
                    >
                      {fineSortOrder === 'desc' ? 'Ascending' : 'Descending'}
                    </button>
                  </div>
                  <div className="fines-table-wrap">
                    <div id="borrow-fines-list-top" />
                    <table className="fines-table">
                      <colgroup>
                        <col className="fine-col-id" />
                        <col className="fine-col-title" />
                        <col className="fine-col-days" />
                        <col className="fine-col-amount" />
                        <col className="fine-col-status" />
                      </colgroup>
                      <thead>
                        <tr>
                          <th>Record ID</th>
                          <th>Book Title</th>
                          <th>Overdue Days</th>
                          <th>Fine Amount</th>
                          <th>Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {visibleFines.map(fine => {
                          const dueDate = new Date(fine.due_date);
                          const returnDate = fine.return_date ? new Date(fine.return_date) : new Date();
                          const isEstimated = isEstimatedFine(fine, fineFeatureEnabled);
                          const overdueDays = Math.max(
                            0,
                            Math.ceil((returnDate - dueDate) / (1000 * 60 * 60 * 24))
                          );

                          return (
                          <tr key={fine.id}>
                            <td>{fine.id}</td>
                            <td className="fine-title-cell">{fine.title}</td>
                            <td>{overdueDays}</td>
                            <td className="fine-amount-cell">
                              {isEstimated ? 'Estimated ' : ''}¥{(Number(fine.fine) || 0).toFixed(2)}
                            </td>
                            <td className={isEstimated ? 'status-estimated' : fine.fine_status === 'paid' ? 'status-paid' : 'status-unpaid'}>
                              {isEstimated ? 'Estimated' : fine.fine_status === 'paid' ? 'Paid' : 'Unpaid'}
                            </td>
                          </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                  <div className="total-fine">
                    <strong>Payable Fine: ¥{totalFine.toFixed(2)}</strong>
                    {fineFeatureEnabled && <span>Estimated Fine: ¥{estimatedFine.toFixed(2)}</span>}
                  </div>
                  {fines.length > DEFAULT_HISTORY_PAGE_SIZE && (
                    <div className="history-pagination">
                      <button
                        type="button"
                        onClick={() => handleFinePageChange(Math.max(1, currentFinePage - 1))}
                        disabled={currentFinePage === 1}
                      >
                        Previous
                      </button>
                      <span>Page {currentFinePage} of {fineTotalPages}</span>
                      <button
                        type="button"
                        onClick={() => handleFinePageChange(Math.min(fineTotalPages, currentFinePage + 1))}
                        disabled={currentFinePage === fineTotalPages}
                      >
                        Next
                      </button>
                    </div>
                  )}
                  {totalFine > 0 && (
                    <button 
                      className="btn-danger"
                      onClick={handleGoToFinePayment}
                    >
                      Pay with Alipay
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      ), document.body)}
    </div>
  );
};

export default BorrowRecords;
