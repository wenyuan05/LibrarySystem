import React, { useState, useEffect, useCallback } from 'react';
import { useToast } from '../context/ToastContext';
import { borrowAPI } from '../utils/api';
import { DEFAULT_HISTORY_PAGE_SIZE, paginateRecords, sortHistoryRecords } from '../utils/historyList';
import { scrollToListTop } from '../utils/scrollToListTop';
import './ReturnApprovalPage.css';

const initialFilters = {
  keyword: '',
  date_from: '',
  date_to: ''
};

const returningRecordMatchesFilters = (record, filters) => {
  const keyword = filters.keyword.trim().toLowerCase();
  if (keyword) {
    const searchable = [
      record.id,
      record.user_name,
      record.username,
      record.title,
      record.author
    ].map(value => String(value || '').toLowerCase());

    if (!searchable.some(value => value.includes(keyword))) {
      return false;
    }
  }

  const returnDate = record.return_date || '';
  if (filters.date_from && returnDate < filters.date_from) {
    return false;
  }
  if (filters.date_to && returnDate > filters.date_to) {
    return false;
  }

  return true;
};

const ReturnApprovalPage = () => {
  const [returningRecords, setReturningRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [approving, setApproving] = useState(false);
  const [selectedDate, setSelectedDate] = useState('');
  const [filters, setFilters] = useState(initialFilters);
  const [appliedFilters, setAppliedFilters] = useState(initialFilters);
  const [page, setPage] = useState(1);
  const { showToast } = useToast();

  // Load returning requests to be approved
  const fetchReturningRecords = useCallback(async () => {
    try {
      setLoading(true);
      const data = await borrowAPI.getReturningList();
      setReturningRecords(data);
    } catch (err) {
      showToast('Failed to load returning records', 'error');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  // Load data on component mount
  useEffect(() => {
    fetchReturningRecords();
  }, [fetchReturningRecords]);

  // Handle return approval
  const handleApproveReturn = async (record) => {
    try {
      await borrowAPI.approveReturn(record.id);
      
      // Update records list, remove approved record
      setReturningRecords(prevRecords => prevRecords.filter(r => r.id !== record.id));
      
      showToast('Return approved successfully', 'success');
    } catch (err) {
      showToast('Failed to approve return', 'error');
      console.error(err);
    }
  };

  // Handle approve all returns
  const handleApproveAll = async () => {
    if (returningRecords.length === 0) {
      showToast('No returning requests to approve', 'info');
      return;
    }

    if (!window.confirm('Are you sure you want to approve all returning requests?')) {
      return;
    }

    setApproving(true);
    let approvedCount = 0;
    let failedCount = 0;

    try {
      for (const record of returningRecords) {
        try {
          await borrowAPI.approveReturn(record.id);
          approvedCount++;
        } catch (err) {
          failedCount++;
          console.error(`Failed to approve return ${record.id}:`, err);
        }
      }

      // Refresh the records list
      await fetchReturningRecords();

      if (approvedCount > 0) {
        showToast(`Successfully approved ${approvedCount} return(s)`, 'success');
      }
      if (failedCount > 0) {
        showToast(`Failed to approve ${failedCount} return(s)`, 'error');
      }
    } catch (err) {
      showToast('Failed to process bulk approval', 'error');
      console.error(err);
    } finally {
      setApproving(false);
    }
  };

  // Handle approve by date
  const handleApproveByDate = async () => {
    if (!selectedDate) {
      showToast('Please select a date', 'error');
      return;
    }

    const recordsByDate = returningRecords.filter(record => record.return_date === selectedDate);
    if (recordsByDate.length === 0) {
      showToast(`No returning requests found for ${selectedDate}`, 'info');
      return;
    }

    if (!window.confirm(`Are you sure you want to approve all returning requests for ${selectedDate}?`)) {
      return;
    }

    setApproving(true);
    let approvedCount = 0;
    let failedCount = 0;

    try {
      for (const record of recordsByDate) {
        try {
          await borrowAPI.approveReturn(record.id);
          approvedCount++;
        } catch (err) {
          failedCount++;
          console.error(`Failed to approve return ${record.id}:`, err);
        }
      }

      // Refresh the records list
      await fetchReturningRecords();

      if (approvedCount > 0) {
        showToast(`Successfully approved ${approvedCount} return(s) for ${selectedDate}`, 'success');
      }
      if (failedCount > 0) {
        showToast(`Failed to approve ${failedCount} return(s) for ${selectedDate}`, 'error');
      }
    } catch (err) {
      showToast('Failed to process date-based approval', 'error');
      console.error(err);
    } finally {
      setApproving(false);
    }
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
      showToast('Start date cannot be later than end date', 'error');
      return;
    }
    setAppliedFilters(filters);
    setPage(1);
  };

  const handleFilterReset = () => {
    setFilters(initialFilters);
    setAppliedFilters(initialFilters);
    setPage(1);
  };

  const handlePageChange = (nextPage) => {
    setPage(nextPage);
    scrollToListTop('#return-approval-list-top');
  };

  if (loading) {
    return <div className="loading">Loading returning records...</div>;
  }

  const filteredReturningRecords = returningRecords.filter(record =>
    returningRecordMatchesFilters(record, appliedFilters)
  );
  const sortedReturningRecords = sortHistoryRecords(filteredReturningRecords, ['return_date', 'borrow_date'], 'desc');
  const {
    pageItems: visibleReturningRecords,
    totalPages,
    safePage
  } = paginateRecords(sortedReturningRecords, page, DEFAULT_HISTORY_PAGE_SIZE);

  return (
    <div className="return-approval-section card fade-in">
      <h2>Return Approval</h2>
      
      {/* Batch Approval Controls */}
      {returningRecords.length > 0 && (
        <div className="batch-approval-controls">
          <div className="date-filter">
            <label htmlFor="date-select">Approve by date:</label>
            <input
              type="date"
              id="date-select"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="form-input"
            />
            <button
              className="btn-primary"
              onClick={handleApproveByDate}
              disabled={approving}
            >
              {approving ? 'Processing...' : 'Approve by Date'}
            </button>
          </div>
          <button
            className="btn-success"
            onClick={handleApproveAll}
            disabled={approving}
          >
            {approving ? 'Processing...' : 'Approve All'}
          </button>
        </div>
      )}

      {returningRecords.length > 0 && (
        <form className="return-approval-filters" onSubmit={handleFilterSubmit}>
          <label>
            <span>Keyword</span>
            <input
              type="search"
              name="keyword"
              value={filters.keyword}
              onChange={handleFilterChange}
              placeholder="ID, user, title, author"
            />
          </label>
          <label>
            <span>Return from</span>
            <input
              type="date"
              name="date_from"
              value={filters.date_from}
              onChange={handleFilterChange}
            />
          </label>
          <label>
            <span>Return to</span>
            <input
              type="date"
              name="date_to"
              value={filters.date_to}
              onChange={handleFilterChange}
            />
          </label>
          <button type="submit" className="btn-primary">Filter</button>
          <button type="button" className="btn-secondary" onClick={handleFilterReset}>Reset</button>
        </form>
      )}
      
      {returningRecords.length === 0 ? (
        <div className="empty-state">
          <p>No returning requests to approve.</p>
        </div>
      ) : filteredReturningRecords.length === 0 ? (
        <div className="empty-state">
          <p>No returning requests match the current filters.</p>
        </div>
      ) : (
        <>
        <div id="return-approval-list-top" />
        <table>
          <thead>
            <tr>
              <th>ID</th>
              <th>User</th>
              <th>Title</th>
              <th>Author</th>
              <th>Borrow Date</th>
              <th>Due Date</th>
              <th>Return Date</th>
              <th>Fine</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {visibleReturningRecords.map(record => (
              <tr key={record.id} className="fade-in">
                <td>{record.id}</td>
                <td>{record.user_name} ({record.username})</td>
                <td>{record.title}</td>
                <td>{record.author}</td>
                <td>{record.borrow_date}</td>
                <td>{record.due_date}</td>
                <td>{record.return_date}</td>
                <td>{record.fine || 0}</td>
                <td>
                  <button 
                    className="btn-success"
                    onClick={() => handleApproveReturn(record)}
                    disabled={approving}
                  >
                    Approve
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {filteredReturningRecords.length > DEFAULT_HISTORY_PAGE_SIZE && (
          <div className="pagination-controls">
            <button
              type="button"
              className="btn-secondary"
              disabled={safePage <= 1}
              onClick={() => handlePageChange(safePage - 1)}
            >
              Previous
            </button>
            <span>Page {safePage} of {totalPages}</span>
            <button
              type="button"
              className="btn-secondary"
              disabled={safePage >= totalPages}
              onClick={() => handlePageChange(safePage + 1)}
            >
              Next
            </button>
          </div>
        )}
        </>
      )}
    </div>
  );
};

export default ReturnApprovalPage;
