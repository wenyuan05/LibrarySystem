import React, { useState, useEffect } from 'react';
import { useToast } from '../context/ToastContext';
import { borrowAPI } from '../utils/api';
import './ReturnApprovalPage.css';

const ReturnApprovalPage = () => {
  const [returningRecords, setReturningRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [approving, setApproving] = useState(false);
  const [selectedDate, setSelectedDate] = useState('');
  const { showToast } = useToast();

  // Load returning requests to be approved
  const fetchReturningRecords = async () => {
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
  };

  // Load data on component mount
  useEffect(() => {
    fetchReturningRecords();
  }, []);

  // Handle return approval
  const handleApproveReturn = async (record) => {
    try {
      await borrowAPI.approveReturn(record.id);
      
      // Update records list, remove approved record
      setReturningRecords(returningRecords.filter(r => r.id !== record.id));
      
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

  if (loading) {
    return <div className="loading">Loading returning records...</div>;
  }

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
      
      {returningRecords.length === 0 ? (
        <div className="empty-state">
          <p>No returning requests to approve.</p>
        </div>
      ) : (
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
            {returningRecords.map(record => (
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
      )}
    </div>
  );
};

export default ReturnApprovalPage;