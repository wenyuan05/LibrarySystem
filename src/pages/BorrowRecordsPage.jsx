import React from 'react';
import BorrowRecords from '../components/Borrow/BorrowRecords';

const BorrowRecordsPage = () => {
  return (
    <div className="borrow-section card fade-in">
      <h2>My Borrow Records</h2>
      <BorrowRecords />
    </div>
  );
};

export default BorrowRecordsPage;