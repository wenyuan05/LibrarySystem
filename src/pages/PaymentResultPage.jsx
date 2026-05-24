import React, { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { paymentAPI } from '../utils/api';
import './PaymentResultPage.css';

const PaymentResultPage = () => {
  const [searchParams] = useSearchParams();
  const outTradeNo = searchParams.get('out_trade_no') || '-';
  const fallbackAmount = Number(searchParams.get('amount') || 0);
  const [payment, setPayment] = useState(null);
  const [loading, setLoading] = useState(Boolean(searchParams.get('out_trade_no')));
  const [error, setError] = useState('');

  useEffect(() => {
    let isMounted = true;
    const loadPayment = async () => {
      if (!searchParams.get('out_trade_no')) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const data = await paymentAPI.getPaymentByOutTradeNo(searchParams.get('out_trade_no'));
        if (isMounted) {
          setPayment(data);
          setError('');
        }
      } catch (err) {
        if (isMounted) {
          setError(err.message || 'Failed to load payment status');
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    loadPayment();

    return () => {
      isMounted = false;
    };
  }, [searchParams]);

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
      <Link className="btn-primary payment-result-action" to="/fines">
        Back to Fine Records
      </Link>
    </div>
  );
};

export default PaymentResultPage;
