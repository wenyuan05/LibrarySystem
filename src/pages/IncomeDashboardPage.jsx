import React, { useEffect, useState } from 'react';
import { paymentAPI } from '../utils/api';
import { useToast } from '../context/ToastContext';
import './IncomeDashboardPage.css';

const formatMoney = (value) => `¥${(Number(value) || 0).toFixed(2)}`;

const IncomeDashboardPage = () => {
  const { showToast } = useToast();
  const [summary, setSummary] = useState(null);
  const [payments, setPayments] = useState([]);
  const [status, setStatus] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [expiringId, setExpiringId] = useState(null);

  const loadDashboard = async (selectedStatus = status) => {
    try {
      setIsLoading(true);
      const [summaryData, paymentRows] = await Promise.all([
        paymentAPI.getIncomeSummary(),
        paymentAPI.listPayments({
          status: selectedStatus,
          provider: 'alipay',
          payment_type: 'fine'
        })
      ]);
      setSummary(summaryData);
      setPayments(paymentRows);
    } catch (err) {
      showToast(err.message || 'Failed to load income dashboard', 'error');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadDashboard(status);
  }, [status]);

  const handleExpire = async (paymentId) => {
    try {
      setExpiringId(paymentId);
      await paymentAPI.expirePayment(paymentId);
      showToast('Payment expired successfully', 'success');
      await loadDashboard(status);
    } catch (err) {
      showToast(err.message || 'Failed to expire payment', 'error');
      console.error(err);
    } finally {
      setExpiringId(null);
    }
  };

  return (
    <div className="income-dashboard-page">
      <div className="income-dashboard-header">
        <h1>Income Dashboard</h1>
        <button type="button" className="btn-secondary" onClick={() => loadDashboard(status)} disabled={isLoading}>
          Refresh
        </button>
      </div>

      <div className="income-summary-grid">
        <section className="income-card">
          <span>Total Income</span>
          <strong>{formatMoney(summary?.total_income)}</strong>
        </section>
        <section className="income-card">
          <span>Today</span>
          <strong>{formatMoney(summary?.today_income)}</strong>
        </section>
        <section className="income-card">
          <span>This Month</span>
          <strong>{formatMoney(summary?.month_income)}</strong>
        </section>
        <section className="income-card">
          <span>Orders</span>
          <strong>{summary?.paid_count || 0} paid · {summary?.pending_count || 0} pending</strong>
        </section>
      </div>

      <section className="payment-orders-section">
        <div className="payment-orders-header">
          <h2>Alipay Fine Payments</h2>
          <select value={status} onChange={(event) => setStatus(event.target.value)} disabled={isLoading}>
            <option value="">All statuses</option>
            <option value="pending">Pending</option>
            <option value="paid">Paid</option>
            <option value="expired">Expired</option>
            <option value="failed">Failed</option>
          </select>
        </div>

        {isLoading ? (
          <div className="income-loading">Loading payments...</div>
        ) : payments.length === 0 ? (
          <div className="income-empty">No payment orders found.</div>
        ) : (
          <div className="payment-orders-table-wrap">
            <table className="payment-orders-table">
              <thead>
                <tr>
                  <th>Order</th>
                  <th>User</th>
                  <th>Amount</th>
                  <th>Status</th>
                  <th>Created</th>
                  <th>Paid At</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {payments.map(payment => (
                  <tr key={payment.id}>
                    <td className="order-cell">{payment.out_trade_no}</td>
                    <td>{payment.name || payment.username || `User #${payment.user_id}`}</td>
                    <td>{formatMoney(payment.amount)}</td>
                    <td>
                      <span className={`income-status status-${payment.status}`}>{payment.status}</span>
                    </td>
                    <td>{payment.created_at || '-'}</td>
                    <td>{payment.paid_at || '-'}</td>
                    <td>
                      {payment.status === 'pending' ? (
                        <button
                          type="button"
                          className="btn-secondary expire-payment-button"
                          onClick={() => handleExpire(payment.id)}
                          disabled={expiringId === payment.id}
                        >
                          {expiringId === payment.id ? 'Expiring...' : 'Expire'}
                        </button>
                      ) : (
                        <span className="income-muted">-</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
};

export default IncomeDashboardPage;
