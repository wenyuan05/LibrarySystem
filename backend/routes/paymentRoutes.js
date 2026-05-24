const express = require('express');
const router = express.Router();
const paymentController = require('../controllers/paymentController');
const { authenticateToken, requireRole } = require('../middleware/auth');

router.get('/alipay/status', authenticateToken, requireRole(['admin', 'librarian']), paymentController.getAlipayStatus);
router.get('/', authenticateToken, paymentController.listPayments);
router.post('/fines/alipay', authenticateToken, paymentController.createFineAlipayPayment);
router.post('/alipay/simulate-notify/:out_trade_no', authenticateToken, paymentController.simulateAlipayNotify);
router.post('/alipay/notify', paymentController.alipayNotify);
router.get('/income/summary', authenticateToken, requireRole(['admin', 'librarian']), paymentController.getIncomeSummary);
router.get('/trade/:out_trade_no', authenticateToken, paymentController.getPaymentByOutTradeNo);
router.post('/:id/expire', authenticateToken, paymentController.expirePayment);
router.get('/:id', authenticateToken, paymentController.getPayment);

module.exports = router;
