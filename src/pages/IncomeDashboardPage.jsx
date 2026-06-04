import React, { useEffect, useState, useCallback } from 'react';
import { paymentAPI } from '../utils/api';
import { useToast } from '../context/ToastContext';
import './IncomeDashboardPage.css';

const formatMoney = (value) => `¥${(Number(value) || 0).toFixed(2)}`;
const IncomeLineChart = ({ data = [] }) => {
  const width = 720;
  const height = 240;
  const padding = { top: 24, right: 28, bottom: 42, left: 62 };
  const chartWidth = width - padding.left - padding.right;
  const chartHeight = height - padding.top - padding.bottom;
  const maxIncome = Math.max(1, ...data.map(item => Number(item.income) || 0));
  const points = data.map((item, index) => {
    const x = padding.left + (data.length <= 1 ? 0 : (index / (data.length - 1)) * chartWidth);
    const y = padding.top + chartHeight - ((Number(item.income) || 0) / maxIncome) * chartHeight;
    return { ...item, x, y };
  });
  const linePath = points.map((point, index) => `${index === 0 ? 'M' : 'L'} ${point.x} ${point.y}`).join(' ');

  return (
    <div className="income-chart-wrap">
      <svg className="income-line-chart" viewBox={`0 0 ${width} ${height}`} role="img" aria-label="Income trend chart">
        <line x1={padding.left} y1={padding.top} x2={padding.left} y2={padding.top + chartHeight} className="chart-axis" />
        <line x1={padding.left} y1={padding.top + chartHeight} x2={padding.left + chartWidth} y2={padding.top + chartHeight} className="chart-axis" />
        {[0, 0.5, 1].map(ratio => {
          const y = padding.top + chartHeight - ratio * chartHeight;
          return (
            <g key={ratio}>
              <line x1={padding.left} y1={y} x2={padding.left + chartWidth} y2={y} className="chart-grid-line" />
              <text x={padding.left - 10} y={y + 4} textAnchor="end" className="chart-value-label">
                {formatMoney(maxIncome * ratio)}
              </text>
            </g>
          );
        })}
        {linePath && <path d={linePath} className="chart-line" />}
        {points.map((point, index) => (
          <g key={point.key || point.label}>
            <circle cx={point.x} cy={point.y} r="4" className="chart-point" />
            {(index % 2 === 0 || index === points.length - 1) && (
              <text x={point.x} y={padding.top + chartHeight + 22} textAnchor="middle" className="chart-month-label">
                {point.label}
              </text>
            )}
            <title>{`${point.label}: ${formatMoney(point.income)} (${point.paid_count || 0} paid)`}</title>
          </g>
        ))}
      </svg>
    </div>
  );
};

const IncomeDashboardPage = () => {
  const { showToast } = useToast();
  const [summary, setSummary] = useState(null);
  const [analytics, setAnalytics] = useState(null);
  const [payments, setPayments] = useState([]);
  const [status, setStatus] = useState('');
  const [rangeFilters, setRangeFilters] = useState({ start_date: '', end_date: '' });
  const [appliedRange, setAppliedRange] = useState(rangeFilters);
  const [isLoading, setIsLoading] = useState(true);
  const [expiringId, setExpiringId] = useState(null);

  const loadDashboard = useCallback(async (selectedStatus = status, selectedRange = appliedRange) => {
    try {
      setIsLoading(true);
      const [summaryData, analyticsData, paymentRows] = await Promise.all([
        paymentAPI.getIncomeSummary(),
        paymentAPI.getIncomeAnalytics(selectedRange),
        paymentAPI.listPayments({
          status: selectedStatus,
          provider: 'alipay',
          payment_type: 'fine'
        })
      ]);
      setSummary(summaryData);
      setAnalytics(analyticsData);
      setPayments(paymentRows);
    } catch (err) {
      showToast(err.message || 'Failed to load income dashboard', 'error');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  }, [appliedRange, showToast, status]);

  useEffect(() => {
    loadDashboard(status);
  }, [loadDashboard, status]);

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

  const handleRangeChange = (event) => {
    const { name, value } = event.target;
    setRangeFilters(prev => ({ ...prev, [name]: value }));
  };

  const handleRangeSubmit = async (event) => {
    event.preventDefault();
    if (rangeFilters.start_date && rangeFilters.end_date && rangeFilters.start_date > rangeFilters.end_date) {
      showToast('Start date cannot be after end date', 'error');
      return;
    }
    if (rangeFilters.start_date === appliedRange.start_date && rangeFilters.end_date === appliedRange.end_date) {
      await loadDashboard(status, rangeFilters);
      return;
    }

    setAppliedRange(rangeFilters);
  };

  const handleResetRange = () => {
    const defaultRange = { start_date: '', end_date: '' };
    setRangeFilters(defaultRange);
    if (appliedRange.start_date || appliedRange.end_date) {
      setAppliedRange(defaultRange);
    }
  };

  const trend = analytics?.trend;
  const rangeLabel = trend?.granularity === 'day'
    ? 'Daily income in selected range'
    : trend?.granularity === 'week'
      ? 'Weekly income in selected range'
      : appliedRange.start_date || appliedRange.end_date
        ? 'Monthly income in selected range'
        : 'Monthly income for the past year';

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

      <section className="income-analytics-section">
        <div className="income-analytics-header">
          <div>
            <h2>Income Trend</h2>
            <p>{rangeLabel}</p>
          </div>
          <form className="income-range-form" onSubmit={handleRangeSubmit}>
            <label>
              Start
              <input type="date" name="start_date" value={rangeFilters.start_date} onChange={handleRangeChange} disabled={isLoading} />
            </label>
            <label>
              End
              <input type="date" name="end_date" value={rangeFilters.end_date} onChange={handleRangeChange} disabled={isLoading} />
            </label>
            <button type="submit" className="btn-secondary" disabled={isLoading}>
              Query Income
            </button>
            <button type="button" className="btn-secondary" onClick={handleResetRange} disabled={isLoading}>
              Past Year
            </button>
          </form>
        </div>

        <IncomeLineChart data={trend?.buckets || []} />

        <div className="income-range-result">
          <span>
            {analytics?.range?.start_date || '-'} to {analytics?.range?.end_date || '-'}
          </span>
          <strong>{formatMoney(analytics?.range?.total_income)}</strong>
          <em>{analytics?.range?.paid_count || 0} paid order(s)</em>
        </div>
      </section>

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
