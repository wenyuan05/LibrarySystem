import React, { useEffect, useState, useCallback, useRef } from 'react';
import { paymentAPI } from '../utils/api';
import { useToast } from '../context/ToastContext';
import { scrollToListTop } from '../utils/scrollToListTop';
import './IncomeDashboardPage.css';

const formatMoney = (value) => `¥${(Number(value) || 0).toFixed(2)}`;
const PAYMENT_PAGE_SIZE = 10;

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
  const [paymentFilters, setPaymentFilters] = useState({ keyword: '', date_from: '', date_to: '' });
  const [appliedPaymentFilters, setAppliedPaymentFilters] = useState(paymentFilters);
  const [paymentPage, setPaymentPage] = useState(1);
  const [paymentsPagination, setPaymentsPagination] = useState({
    page: 1,
    page_size: PAYMENT_PAGE_SIZE,
    total: 0,
    total_pages: 1
  });
  const [rangeFilters, setRangeFilters] = useState({ start_date: '', end_date: '' });
  const [appliedRange, setAppliedRange] = useState(rangeFilters);
  const [isLoading, setIsLoading] = useState(true);
  const [expiringId, setExpiringId] = useState(null);
  const shouldScrollPaymentsRef = useRef(false);

  const loadDashboard = useCallback(async (
    selectedStatus = status,
    selectedRange = appliedRange,
    selectedPaymentFilters = appliedPaymentFilters,
    selectedPage = paymentPage
  ) => {
    try {
      setIsLoading(true);
      const [summaryData, analyticsData, paymentData] = await Promise.all([
        paymentAPI.getIncomeSummary(),
        paymentAPI.getIncomeAnalytics(selectedRange),
        paymentAPI.listPayments({
          status: selectedStatus,
          provider: 'alipay',
          payment_type: 'fine',
          keyword: selectedPaymentFilters.keyword,
          date_from: selectedPaymentFilters.date_from,
          date_to: selectedPaymentFilters.date_to,
          page: selectedPage,
          page_size: PAYMENT_PAGE_SIZE
        })
      ]);
      setSummary(summaryData);
      setAnalytics(analyticsData);
      setPayments(Array.isArray(paymentData) ? paymentData : paymentData.items || []);
      setPaymentsPagination(Array.isArray(paymentData) ? {
        page: 1,
        page_size: PAYMENT_PAGE_SIZE,
        total: paymentData.length,
        total_pages: 1
      } : paymentData.pagination || {
        page: selectedPage,
        page_size: PAYMENT_PAGE_SIZE,
        total: 0,
        total_pages: 1
      });
      if (shouldScrollPaymentsRef.current) {
        window.requestAnimationFrame(() => {
          window.requestAnimationFrame(() => {
            scrollToListTop('#payment-orders-list-top');
            shouldScrollPaymentsRef.current = false;
          });
        });
      }
    } catch (err) {
      showToast(err.message || 'Failed to load income dashboard', 'error');
      console.error(err);
      shouldScrollPaymentsRef.current = false;
    } finally {
      setIsLoading(false);
    }
  }, [appliedPaymentFilters, appliedRange, paymentPage, showToast, status]);

  useEffect(() => {
    loadDashboard(status, appliedRange, appliedPaymentFilters, paymentPage);
  }, [appliedPaymentFilters, appliedRange, loadDashboard, paymentPage, status]);

  const handleExpire = async (paymentId) => {
    try {
      setExpiringId(paymentId);
      await paymentAPI.expirePayment(paymentId);
      showToast('Payment expired successfully', 'success');
      await loadDashboard(status, appliedRange, appliedPaymentFilters, paymentPage);
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

  const handlePaymentFilterChange = (event) => {
    const { name, value } = event.target;
    setPaymentFilters(prev => ({ ...prev, [name]: value }));
  };

  const handlePaymentFilterSubmit = (event) => {
    event.preventDefault();
    if (paymentFilters.date_from && paymentFilters.date_to && paymentFilters.date_from > paymentFilters.date_to) {
      showToast('Payment start date cannot be after end date', 'error');
      return;
    }

    setPaymentPage(1);
    setAppliedPaymentFilters(paymentFilters);
  };

  const handlePaymentFilterReset = () => {
    const emptyFilters = { keyword: '', date_from: '', date_to: '' };
    setStatus('');
    setPaymentFilters(emptyFilters);
    setAppliedPaymentFilters(emptyFilters);
    setPaymentPage(1);
  };

  const handleStatusChange = (event) => {
    setStatus(event.target.value);
    setPaymentPage(1);
  };

  const handlePaymentPageChange = (nextPage) => {
    shouldScrollPaymentsRef.current = true;
    setPaymentPage(nextPage);
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
        <div id="payment-orders-list-top" />
        <div className="payment-orders-header">
          <h2>Alipay Fine Payments</h2>
        </div>

        <form className="payment-orders-filters" onSubmit={handlePaymentFilterSubmit}>
          <label>
            Keyword
            <input
              type="search"
              name="keyword"
              value={paymentFilters.keyword}
              onChange={handlePaymentFilterChange}
              placeholder="Order, user, status"
              disabled={isLoading}
            />
          </label>
          <label>
            Start
            <input type="date" name="date_from" value={paymentFilters.date_from} onChange={handlePaymentFilterChange} disabled={isLoading} />
          </label>
          <label>
            End
            <input type="date" name="date_to" value={paymentFilters.date_to} onChange={handlePaymentFilterChange} disabled={isLoading} />
          </label>
          <label>
            Status
            <select value={status} onChange={handleStatusChange} disabled={isLoading}>
              <option value="">All statuses</option>
              <option value="pending">Pending</option>
              <option value="paid">Paid</option>
              <option value="expired">Expired</option>
              <option value="failed">Failed</option>
            </select>
          </label>
          <button type="submit" className="btn-secondary" disabled={isLoading}>
            Filter
          </button>
          <button type="button" className="btn-secondary" onClick={handlePaymentFilterReset} disabled={isLoading}>
            Reset
          </button>
        </form>

        {isLoading ? (
          <div className="income-loading">Loading payments...</div>
        ) : payments.length === 0 ? (
          <div className="income-empty">No payment orders found.</div>
        ) : (
          <>
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
          </>
        )}

        <div className="payment-pagination">
          <span>
            Page {paymentsPagination.page} of {paymentsPagination.total_pages} · {paymentsPagination.total} record(s)
          </span>
          <div className="payment-pagination-actions">
            <button
              type="button"
              className="btn-secondary"
              onClick={() => handlePaymentPageChange(Math.max(1, paymentsPagination.page - 1))}
              disabled={isLoading || paymentsPagination.page <= 1}
            >
              Previous
            </button>
            <button
              type="button"
              className="btn-secondary"
              onClick={() => handlePaymentPageChange(Math.min(paymentsPagination.total_pages, paymentsPagination.page + 1))}
              disabled={isLoading || paymentsPagination.page >= paymentsPagination.total_pages}
            >
              Next
            </button>
          </div>
        </div>
      </section>
    </div>
  );
};

export default IncomeDashboardPage;
