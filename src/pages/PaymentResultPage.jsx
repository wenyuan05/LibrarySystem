import React, { useCallback, useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { paymentAPI } from '../utils/api';
import './PaymentResultPage.css';

const isTerminalStatus = (status) => ['paid', 'expired', 'failed'].includes(status);

const PaymentResultPage = () => {
  const [searchParams] = useSearchParams();
  const outTradeNoParam = searchParams.get('out_trade_no') || '';
  const outTradeNo = outTradeNoParam || '-';
  const fallbackAmount = Number(searchParams.get('amount') || 0);
  const [payment, setPayment] = useState(null);
  const [loading, setLoading] = useState(Boolean(searchParams.get('out_trade_no')));
  const [error, setError] = useState('');
  const [refreshing, setRefreshing] = useState(false);

  const loadPayment = useCallback(async ({ showLoading = true } = {}) => {
    if (!outTradeNoParam) {
      setLoading(false);
      return;
    }

    try {
      if (showLoading) setLoading(true);
      const data = await paymentAPI.getPaymentByOutTradeNo(outTradeNoParam);
      setPayment(data);
      setError('');
    } catch (err) {
      setError(err.message || 'Failed to load payment status');
    } finally {
      if (showLoading) setLoading(false);
    }
  }, [outTradeNoParam]);

  useEffect(() => {
    if (!outTradeNoParam || isTerminalStatus(payment?.status)) {
      if (!outTradeNoParam) setLoading(false);
      return undefined;
    }

    let cancelled = false;
    const pollPayment = async ({ showLoading = false } = {}) => {
      if (!outTradeNoParam) {
        if (!cancelled) setLoading(false);
        return;
      }

      try {
        if (showLoading && !cancelled) setLoading(true);
        const data = await paymentAPI.getPaymentByOutTradeNo(outTradeNoParam);
        if (!cancelled) {
          setPayment(data);
          setError('');
        }
      } catch (err) {
        if (!cancelled) {
          setError(err.message || 'Failed to load payment status');
        }
      } finally {
        if (showLoading && !cancelled) setLoading(false);
      }
    };

    pollPayment({ showLoading: true });
    const timer = setInterval(() => pollPayment(), 2500);

    return () => {
      cancelled = true;
      clearInterval(timer);
    };
  }, [outTradeNoParam, payment?.status]);

  const handleRefresh = async () => {
    try {
      setRefreshing(true);
      await loadPayment({ showLoading: false });
    } finally {
      setRefreshing(false);
    }
  };

  const amount = Number(payment?.amount ?? fallbackAmount);
  const status = payment?.status || (loading ? 'loading' : 'pending');

  return (
    <div className="payment-result-page card fade-in">
      <h1>Alipay Payment Link</h1>
      {error && <p className="payment-result-error">{error}</p>}
      <div className="payment-result-summary">
        <div>
          <span>Order</span>
          <strong>{outTradeNo}</strong>
        </div>
        <div>
          <span>Amount</span>
          <strong>¥{amount.toFixed(2)}</strong>
        </div>
        <div>
          <span>Status</span>
          <strong className={`payment-result-status status-${status}`}>{status}</strong>
        </div>
      </div>
      <p>
        This is the local Alipay sandbox simulation page. The status is loaded from the
        backend payment order whenever an order number is present.
      </p>
      <div className="payment-result-actions">
        <button type="button" className="btn-secondary" onClick={handleRefresh} disabled={refreshing || loading}>
          {refreshing ? 'Refreshing...' : 'Refresh Status'}
        </button>
        <Link className="btn-primary payment-result-action" to="/fines">
          Back to Fine Records
        </Link>
      </div>
    </div>
  );
};

export default PaymentResultPage;
