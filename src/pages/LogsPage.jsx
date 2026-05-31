import React, { useState, useEffect, useCallback } from 'react';
import { logAPI } from '../utils/api';
import { useToast } from '../context/ToastContext';
import './LogsPage.css';

const LogsPage = () => {
  const { showToast } = useToast();
  const [logs, setLogs] = useState([]);
  const [total, setTotal] = useState(0);
  const [limit, setLimit] = useState(50);
  const [offset, setOffset] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isClearing, setIsClearing] = useState(false);
  const [expandedMessages, setExpandedMessages] = useState(new Set());
  const [showClearModal, setShowClearModal] = useState(false);
  const [selectedDays, setSelectedDays] = useState(7);
  const [sortOrder, setSortOrder] = useState('desc');

  // Fetch system logs
  const fetchLogs = useCallback(async () => {
    try {
      setIsLoading(true);
      const params = {
        limit,
        offset,
        order: sortOrder
      };
      const data = await logAPI.getLogs(params);
      setLogs(data.logs);
      setTotal(data.total);
    } catch (error) {
      showToast('Failed to fetch system logs', 'error');
      console.error('Error fetching logs:', error);
    } finally {
      setIsLoading(false);
    }
  }, [limit, offset, showToast, sortOrder]);

  // Toggle message expansion
  const toggleMessageExpansion = (logId) => {
    const newExpandedMessages = new Set(expandedMessages);
    if (newExpandedMessages.has(logId)) {
      newExpandedMessages.delete(logId);
    } else {
      newExpandedMessages.add(logId);
    }
    setExpandedMessages(newExpandedMessages);
  };

  // Open clear logs modal
  const openClearModal = () => {
    setShowClearModal(true);
  };

  // Close clear logs modal
  const closeClearModal = () => {
    setShowClearModal(false);
  };

  // Select preset days
  const selectPresetDays = (days) => {
    setSelectedDays(days);
  };

  // Clear system logs
  const handleClearLogs = async () => {
    try {
      setIsClearing(true);
      await logAPI.clearLogs(selectedDays);
      showToast('System logs cleared successfully', 'success');
      fetchLogs();
      closeClearModal();
    } catch (error) {
      showToast('Failed to clear system logs', 'error');
      console.error('Error clearing logs:', error);
    } finally {
      setIsClearing(false);
    }
  };

  // Handle pagination
  const handlePageChange = (newOffset) => {
    setOffset(newOffset);
  };

  // Go to first page
  const goToFirstPage = () => {
    setOffset(0);
  };

  // Go to last page
  const goToLastPage = () => {
    const lastPageOffset = Math.floor((total - 1) / limit) * limit;
    setOffset(lastPageOffset);
  };

  // Fetch logs when pagination changes
  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  if (isLoading) {
    return <div className="loading">Loading...</div>;
  }

  return (
    <div className="logs-page">
      <h2>System Logs</h2>

      {/* Filters and actions */}
      <div className="logs-header">
        <div className="filters">
          <div className="filter-group">
            <label htmlFor="limit">Items per page:</label>
            <select 
              id="limit" 
              value={limit} 
              onChange={(e) => setLimit(parseInt(e.target.value))}
            >
              <option value="25">25</option>
              <option value="50">50</option>
              <option value="100">100</option>
            </select>
          </div>
          <button
            type="button"
            className="btn-secondary history-sort-button"
            onClick={() => {
              setSortOrder(sortOrder === 'desc' ? 'asc' : 'desc');
              setOffset(0);
            }}
          >
            {sortOrder === 'desc' ? 'Ascending' : 'Descending'}
          </button>
        </div>
        <button 
          className="btn-danger" 
          onClick={openClearModal}
          disabled={isClearing}
        >
          {isClearing ? 'Clearing...' : 'Clear Logs'}
        </button>
      </div>

      {/* Logs list */}
      <div className="logs-list">
        {logs.length === 0 ? (
          <p>No logs found</p>
        ) : (
          <table className="logs-table">
            <thead>
              <tr>
                <th>Time</th>
                <th>Action</th>
                <th>Description</th>
                <th>User</th>
              </tr>
            </thead>
            <tbody>
              {logs.map((log) => (
                <tr key={log.id}>
                  <td>{new Date(log.created_at).toLocaleString()}</td>
                  <td>
                    <span className="log-level info">
                      {log.action}
                    </span>
                  </td>
                  <td>
                    <div 
                      className={`log-message ${expandedMessages.has(log.id) ? 'expanded' : ''}`}
                      onClick={() => toggleMessageExpansion(log.id)}
                    >
                      {log.description || 'No description'}
                    </div>
                  </td>
                  <td>
                    <span className="log-module">
                      {log.user_id || 'System'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Pagination */}
      {total > limit && (
        <div className="pagination">
          <button 
            onClick={goToFirstPage}
            disabled={offset === 0}
            title="First page"
          >
            ⏮️
          </button>
          <button 
            onClick={() => handlePageChange(Math.max(0, offset - limit))}
            disabled={offset === 0}
            title="Previous page"
          >
            ⏪
          </button>
          <span>
            Page {Math.floor(offset / limit) + 1} of {Math.ceil(total / limit)}
          </span>
          <button 
            onClick={() => handlePageChange(offset + limit)}
            disabled={offset + limit >= total}
            title="Next page"
          >
            ⏩
          </button>
          <button 
            onClick={goToLastPage}
            disabled={offset + limit >= total}
            title="Last page"
          >
            ⏭️
          </button>
        </div>
      )}

      {/* Clear logs modal */}
      {showClearModal && (
        <div className="modal-overlay">
          <div className="modal">
            <h3>Clear System Logs</h3>
            <p>Please select how many days of logs to keep:</p>
            <div className="preset-options">
              <div 
                className={`preset-option ${selectedDays === 0 ? 'selected' : ''}`}
                onClick={() => selectPresetDays(0)}
              >
                <h4>Clear All</h4>
                <p>Delete all logs</p>
              </div>
              <div 
                className={`preset-option ${selectedDays === 7 ? 'selected' : ''}`}
                onClick={() => selectPresetDays(7)}
              >
                <h4>Keep 7 Days</h4>
                <p>Delete logs older than 7 days</p>
              </div>
              <div 
                className={`preset-option ${selectedDays === 30 ? 'selected' : ''}`}
                onClick={() => selectPresetDays(30)}
              >
                <h4>Keep 30 Days</h4>
                <p>Delete logs older than 30 days</p>
              </div>
              <div 
                className={`preset-option ${selectedDays === 90 ? 'selected' : ''}`}
                onClick={() => selectPresetDays(90)}
              >
                <h4>Keep 90 Days</h4>
                <p>Delete logs older than 90 days</p>
              </div>
            </div>
            <div className="modal-buttons">
              <button 
                className="modal-btn cancel"
                onClick={closeClearModal}
                disabled={isClearing}
              >
                Cancel
              </button>
              <button 
                className="modal-btn confirm"
                onClick={handleClearLogs}
                disabled={isClearing}
              >
                {isClearing ? 'Clearing...' : 'Confirm Clear'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default LogsPage;
