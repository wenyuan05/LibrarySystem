const ACTIVE_BORROW_STATUSES = ['borrowing', 'borrowed', 'overdue', 'returning'];
const ACTIVE_RESERVATION_STATUSES = ['active', 'pending'];
const OCCUPIED_COPY_STATUSES = ['borrowing', 'borrowed', 'reserved'];

const placeholders = (values) => values.map(() => '?').join(', ');

module.exports = {
  ACTIVE_BORROW_STATUSES,
  ACTIVE_RESERVATION_STATUSES,
  OCCUPIED_COPY_STATUSES,
  placeholders
};
