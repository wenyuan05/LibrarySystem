import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { borrowAPI } from '../utils/api';
import './ReservationsPage.css';

const ReservationsPage = () => {
  const [reservations, setReservations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { user } = useAuth();
  const { showToast } = useToast();

  // 加载预约记录
  useEffect(() => {
    fetchReservations();
  }, []);

  const fetchReservations = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await borrowAPI.getReservations(user.id);
      setReservations(data);
    } catch (err) {
      setError('Failed to load reservations');
      showToast('Failed to load reservations', 'error');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // 处理取消预约
  const handleCancelReservation = async (reservation) => {
    try {
      if (!reservation.id) {
        throw new Error('Reservation ID not found');
      }
      
      const result = await borrowAPI.cancelReservation(reservation.id);
      
      // 更新预约记录
      setReservations(reservations.map(r => 
        r.id === reservation.id ? { ...r, status: 'cancelled' } : r
      ));
      
      showToast(result.message, 'success');
    } catch (err) {
      setError('Failed to cancel reservation');
      showToast(err.message, 'error');
      console.error(err);
    }
  };

  if (loading) {
    return <div className="loading">Loading reservations...</div>;
  }

  if (error) {
    return (
      <div className="error-message">
        {error}
        <button onClick={fetchReservations} className="btn-primary">Retry</button>
      </div>
    );
  }

  return (
    <div className="reservations-page card fade-in">
      <h2>My Reservations</h2>
      
      {reservations.length === 0 ? (
        <div className="empty-state">
          <p>No reservations found.</p>
        </div>
      ) : (
        <table>
          <thead>
            <tr>
              <th>ID</th>
              <th>Title</th>
              <th>Author</th>
              <th>Reserve Date</th>
              <th>Status</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {reservations.map(reservation => (
              <tr key={reservation.id} className="fade-in">
                <td>{reservation.id}</td>
                <td>{reservation.title}</td>
                <td>{reservation.author}</td>
                <td>{reservation.reserve_date}</td>
                <td className={reservation.status === 'active' ? 'status-active' : 'status-inactive'}>
                  {reservation.status === 'active' ? 'Active' : reservation.status}
                </td>
                <td>
                  {reservation.status === 'active' && (
                    <button 
                      className="btn-danger"
                      onClick={() => handleCancelReservation(reservation)}
                    >
                      Cancel
                    </button>
                  )}
                  {reservation.status !== 'active' && (
                    <span className="status-inactive">{reservation.status}</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
};

export default ReservationsPage;