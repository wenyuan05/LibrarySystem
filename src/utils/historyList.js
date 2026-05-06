export const DEFAULT_HISTORY_PAGE_SIZE = 10;

export const getHistoryTimestamp = (item, fields) => {
  for (const field of fields) {
    if (item?.[field]) {
      const timestamp = new Date(item[field]).getTime();
      if (!Number.isNaN(timestamp)) {
        return timestamp;
      }
    }
  }
  return 0;
};

export const sortHistoryRecords = (records, fields, order = 'desc') => {
  const direction = order === 'asc' ? 1 : -1;
  return [...records].sort((a, b) => {
    const timeDiff = getHistoryTimestamp(a, fields) - getHistoryTimestamp(b, fields);
    if (timeDiff !== 0) {
      return timeDiff * direction;
    }
    return ((a.id || 0) - (b.id || 0)) * direction;
  });
};

export const sortBorrowRecords = (records, order = 'desc') => {
  const statusPriority = {
    borrowing: 0,
    overdue: 1,
    borrowed: 1,
    returning: 2,
    returned: 3
  };
  const direction = order === 'asc' ? 1 : -1;

  return [...records].sort((a, b) => {
    const priorityDiff = (statusPriority[a.status] ?? 4) - (statusPriority[b.status] ?? 4);
    if (priorityDiff !== 0) {
      return priorityDiff;
    }
    return ((a.id || 0) - (b.id || 0)) * direction;
  });
};

export const sortFineRecords = (records, order = 'desc') => {
  const direction = order === 'asc' ? 1 : -1;

  return [...records].sort((a, b) => {
    const statusDiff = (a.fine_status === 'unpaid' ? 0 : 1) - (b.fine_status === 'unpaid' ? 0 : 1);
    if (statusDiff !== 0) {
      return statusDiff;
    }
    return ((a.id || 0) - (b.id || 0)) * direction;
  });
};

export const paginateRecords = (records, page, pageSize = DEFAULT_HISTORY_PAGE_SIZE) => {
  const totalPages = Math.max(1, Math.ceil(records.length / pageSize));
  const safePage = Math.min(Math.max(page, 1), totalPages);
  const start = (safePage - 1) * pageSize;
  return {
    pageItems: records.slice(start, start + pageSize),
    totalPages,
    safePage
  };
};
