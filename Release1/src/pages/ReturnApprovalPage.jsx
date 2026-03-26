import React, { useState, useEffect } from 'react';
import { useToast } from '../context/ToastContext';
import { borrowAPI } from '../utils/api';

const ReturnApprovalPage = () => {
  const [returningRecords, setReturningRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { showToast } = useToast();

  // Load returning requests to be approved
  const fetchReturningRecords = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await borrowAPI.getReturningList();
      setReturningRecords(data);
    } catch (err) {
      setError('Failed to load returning records');
      showToast(err.message, 'error');
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

  if (loading) {
    return <div className="loading">Loading returning records...</div>;
  }

  if (error) {
    return (
      <div className="error-message">
        {error}
        <button onClick={fetchReturningRecords} className="btn-primary">Retry</button>
      </div>
    );
  }

  return (
    <div className="return-approval-section card fade-in">
      <h2>Return Approval</h2>
      
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