import React, { useState, useEffect, useCallback } from 'react';
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/useAuth';
import { useToast } from '../context/ToastContext';
import { booksAPI, borrowAPI } from '../utils/api';
import { DEFAULT_HISTORY_PAGE_SIZE, paginateRecords, sortHistoryRecords } from '../utils/historyList';
import { scrollToListTop } from '../utils/scrollToListTop';
import './ReservationsPage.css';

const reservationMatchesFilters = (reservation, filters) => {
  const keyword = filters.keyword.trim().toLowerCase();
  const matchesKeyword = !keyword || [
    reservation.id,
    reservation.title,
    reservation.author,
    reservation.status
  ].some(value => String(value || '').toLowerCase().includes(keyword));
  const matchesStatus = !filters.status || reservation.status === filters.status;
  const recordDate = reservation.reserve_date || reservation.reservation_date || '';
  const matchesStart = !filters.date_from || recordDate >= filters.date_from;
  const matchesEnd = !filters.date_to || recordDate <= filters.date_to;

  return matchesKeyword && matchesStatus && matchesStart && matchesEnd;
};

const ReservationsPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialFilters = {
    keyword: searchParams.get('keyword') || '',
    status: searchParams.get('status') || '',
    date_from: searchParams.get('date_from') || '',
    date_to: searchParams.get('date_to') || ''
  };
  const [reservations, setReservations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sortOrder, setSortOrder] = useState(searchParams.get('sort') || 'desc');
  const [page, setPage] = useState(Math.max(1, Number(searchParams.get('page')) || 1));
  const [filters, setFilters] = useState(initialFilters);
  const [appliedFilters, setAppliedFilters] = useState(filters);
  const { user } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();
  const location = useLocation();

  const fetchReservations = useCallback(async () => {
    if (!user?.id) return;
    try {
      setLoading(true);
      const data = await borrowAPI.getReservations(user.id);
      setReservations(data);
    } catch (err) {
      showToast('Failed to load reservations', 'error');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [showToast, user?.id]);

  // 加载预约记录
  useEffect(() => {
    fetchReservations();
  }, [fetchReservations]);

  useEffect(() => {
    const nextParams = new URLSearchParams();

    if (page > 1) nextParams.set('page', String(page));
    if (sortOrder !== 'desc') nextParams.set('sort', sortOrder);
    if (appliedFilters.keyword) nextParams.set('keyword', appliedFilters.keyword);
    if (appliedFilters.status) nextParams.set('status', appliedFilters.status);
    if (appliedFilters.date_from) nextParams.set('date_from', appliedFilters.date_from);
    if (appliedFilters.date_to) nextParams.set('date_to', appliedFilters.date_to);

    setSearchParams(nextParams, { replace: true });
  }, [appliedFilters, page, setSearchParams, sortOrder]);

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
      showToast(err.message, 'error');
      console.error(err);
    }
  };

  const handleOpenBookDetail = async (reservation) => {
    try {
      if (!reservation.book_id) {
        throw new Error('Book ID not found in reservation');
      }

      await booksAPI.getById(reservation.book_id);
      const fromParams = new URLSearchParams();
      if (page > 1) fromParams.set('page', String(page));
      if (sortOrder !== 'desc') fromParams.set('sort', sortOrder);
      if (appliedFilters.keyword) fromParams.set('keyword', appliedFilters.keyword);
      if (appliedFilters.status) fromParams.set('status', appliedFilters.status);
      if (appliedFilters.date_from) fromParams.set('date_from', appliedFilters.date_from);
      if (appliedFilters.date_to) fromParams.set('date_to', appliedFilters.date_to);
      const from = `${location.pathname}${fromParams.toString() ? `?${fromParams.toString()}` : ''}`;
      navigate(`/books/${reservation.book_id}?returnTo=${encodeURIComponent(from)}`, {
        state: { from }
      });
    } catch (err) {
      showToast(err.message || 'Book not found or has been removed', 'error');
      console.error(err);
    }
  };

  const handleFilterChange = (event) => {
    const { name, value } = event.target;
    setFilters(prev => ({ ...prev, [name]: value }));
  };

  const handleFilterSubmit = (event) => {
    event.preventDefault();
    if (filters.date_from && filters.date_to && filters.date_from > filters.date_to) {
      showToast('Reservation start date cannot be after end date', 'error');
      return;
    }
    setPage(1);
    setAppliedFilters(filters);
  };

  const handleFilterReset = () => {
    const emptyFilters = { keyword: '', status: '', date_from: '', date_to: '' };
    setFilters(emptyFilters);
    setAppliedFilters(emptyFilters);
    setPage(1);
  };

  const handlePageChange = (nextPage) => {
    setPage(nextPage);
    scrollToListTop('#reservations-list-top');
  };

  if (loading) {
    return <div className="loading">Loading reservations...</div>;
  }

  const filteredReservations = reservations.filter(reservation => reservationMatchesFilters(reservation, appliedFilters));
  const sortedReservations = sortHistoryRecords(filteredReservations, ['reserve_date', 'reservation_date'], sortOrder);
  const {
    pageItems: visibleReservations,
    totalPages,
    safePage: currentPage
  } = paginateRecords(sortedReservations, page, DEFAULT_HISTORY_PAGE_SIZE);

  return (
    <div className="reservations-page card fade-in">
      <h2>My Reservations</h2>

      {reservations.length === 0 ? (
        <div className="empty-state">
          <p>No reservations found.</p>
        </div>
      ) : (
        <>
          <div className="history-toolbar">
            <span>{filteredReservations.length} of {reservations.length} records</span>
            <button
              type="button"
              className="btn-secondary history-sort-button"
              onClick={() => {
                setSortOrder(sortOrder === 'desc' ? 'asc' : 'desc');
                setPage(1);
              }}
            >
              {sortOrder === 'desc' ? 'Ascending' : 'Descending'}
            </button>
          </div>
          <form className="reservation-filters" onSubmit={handleFilterSubmit}>
            <label>
              Keyword
              <input
                type="search"
                name="keyword"
                value={filters.keyword}
                onChange={handleFilterChange}
                placeholder="Title, author, status"
              />
            </label>
            <label>
              Status
              <select name="status" value={filters.status} onChange={handleFilterChange}>
                <option value="">All statuses</option>
                <option value="active">Active</option>
                <option value="pending">Pending</option>
                <option value="cancelled">Cancelled</option>
                <option value="canceled">Canceled</option>
                <option value="fulfilled">Fulfilled</option>
              </select>
            </label>
            <label>
              Reserve From
              <input type="date" name="date_from" value={filters.date_from} onChange={handleFilterChange} />
            </label>
            <label>
              Reserve To
              <input type="date" name="date_to" value={filters.date_to} onChange={handleFilterChange} />
            </label>
            <button type="submit" className="btn-secondary">Filter</button>
            <button type="button" className="btn-secondary" onClick={handleFilterReset}>Reset</button>
          </form>
          {filteredReservations.length === 0 ? (
            <div className="empty-state">
              <p>No reservations match the current filters.</p>
            </div>
          ) : (
          <>
          <div id="reservations-list-top" />
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
              {visibleReservations.map(reservation => (
                <tr
                  key={reservation.id}
                  className="fade-in reservation-record-row"
                  role="button"
                  tabIndex={0}
                  onClick={() => handleOpenBookDetail(reservation)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      handleOpenBookDetail(reservation);
                    }
                  }}
                >
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
                        onClick={(e) => {
                          e.stopPropagation();
                          handleCancelReservation(reservation);
                        }}
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
          </>
          )}
          {filteredReservations.length > DEFAULT_HISTORY_PAGE_SIZE && (
            <div className="history-pagination">
              <button
                type="button"
                onClick={() => handlePageChange(Math.max(1, currentPage - 1))}
                disabled={currentPage === 1}
              >
                Previous
              </button>
              <span>Page {currentPage} of {totalPages}</span>
              <button
                type="button"
                onClick={() => handlePageChange(Math.min(totalPages, currentPage + 1))}
                disabled={currentPage === totalPages}
              >
                Next
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default ReservationsPage;
