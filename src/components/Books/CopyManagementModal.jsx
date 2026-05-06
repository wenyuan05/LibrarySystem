import React, { useCallback, useEffect, useState } from 'react';
import { useToast } from '../../context/ToastContext';
import { booksAPI } from '../../utils/api';
import Barcode from '../Barcode';
import './Books.css';

const DEFAULT_COPY_LOCATION = 'Main Shelf';

const CopyManagementModal = ({ book, onClose, onBookUpdated }) => {
  const [copies, setCopies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isAdding, setIsAdding] = useState(false);
  const [defaultLocation, setDefaultLocation] = useState(DEFAULT_COPY_LOCATION);
  const [bulkLocation, setBulkLocation] = useState('');
  const [savingCopyIds, setSavingCopyIds] = useState(new Set());
  const [isBulkSaving, setIsBulkSaving] = useState(false);
  const { showToast } = useToast();

  const loadCopies = useCallback(async () => {
    try {
      setLoading(true);
      const bookCopies = await booksAPI.getCopies(book?.id);
      setCopies(bookCopies);
    } catch (error) {
      console.error('Error loading copies:', error);
      showToast('Failed to load copies', 'error');
    } finally {
      setLoading(false);
    }
  }, [book?.id, showToast]);

  const refreshBook = async () => {
    if (!onBookUpdated) return;
    const updatedBook = await booksAPI.getById(book.id);
    onBookUpdated(updatedBook);
  };

  useEffect(() => {
    if (book?.id) {
      loadCopies();
    }
  }, [book, loadCopies]);

  const handleStatusChange = async (copyId, status) => {
    try {
      await booksAPI.updateCopyStatus(copyId, status);
      await loadCopies();
      await refreshBook();
      showToast('Copy status updated successfully', 'success');
    } catch (error) {
      console.error('Error updating copy status:', error);
      showToast('Failed to update copy status', 'error');
    }
  };

  const handleLocationDraftChange = (copyId, location) => {
    setCopies(prevCopies => prevCopies.map(copy =>
      copy.id === copyId ? { ...copy, location } : copy
    ));
  };

  const handleLocationSave = async (copyId, location) => {
    try {
      setSavingCopyIds(prev => new Set([...prev, copyId]));
      await booksAPI.updateCopyLocation(copyId, location);
      showToast('Copy location updated successfully', 'success');
    } catch (error) {
      console.error('Error updating copy location:', error);
      showToast('Failed to update copy location', 'error');
      loadCopies();
    } finally {
      setSavingCopyIds(prev => {
        const next = new Set(prev);
        next.delete(copyId);
        return next;
      });
    }
  };

  const handleBulkLocationSave = async () => {
    const location = bulkLocation.trim();
    if (!location) {
      showToast('Please enter a location to apply', 'error');
      return;
    }

    try {
      setIsBulkSaving(true);
      await Promise.all(copies.map(copy => booksAPI.updateCopyLocation(copy.id, location)));
      setCopies(prevCopies => prevCopies.map(copy => ({ ...copy, location })));
      showToast('Locations updated successfully', 'success');
    } catch (error) {
      console.error('Error updating locations:', error);
      showToast('Failed to update locations', 'error');
      loadCopies();
    } finally {
      setIsBulkSaving(false);
    }
  };

  const handleAddCopy = async () => {
    try {
      setIsAdding(true);
      await booksAPI.addCopy(book.id, defaultLocation);
      await loadCopies();
      await refreshBook();
      showToast('Copy added successfully', 'success');
    } catch (error) {
      console.error('Error adding copy:', error);
      showToast('Failed to add copy', 'error');
    } finally {
      setIsAdding(false);
    }
  };

  if (!book) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal-content copy-management-modal"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="copy-management-title"
      >
        <div className="modal-header">
          <h3 id="copy-management-title">Manage Copies</h3>
          <button className="modal-close" onClick={onClose} aria-label="Close modal">×</button>
        </div>

        <div className="copy-management-summary">
          <div>
            <strong>{book.title}</strong>
            <span>by {book.author}</span>
          </div>
          <div className="copy-counts">
            <span>Total: {copies.length}</span>
            <span>Available: {copies.filter(copy => copy.status === 'available').length}</span>
          </div>
        </div>

        <div className="copy-add-bar">
          <label htmlFor="default-copy-location">Default Location</label>
          <input
            id="default-copy-location"
            type="text"
            value={defaultLocation}
            onChange={(e) => setDefaultLocation(e.target.value)}
            placeholder={DEFAULT_COPY_LOCATION}
          />
          <button
            type="button"
            className="btn-primary"
            onClick={handleAddCopy}
            disabled={isAdding}
          >
            {isAdding ? 'Adding...' : 'Add Copy'}
          </button>
        </div>

        <div className="copy-bulk-bar">
          <label htmlFor="bulk-copy-location">Bulk Location</label>
          <input
            id="bulk-copy-location"
            type="text"
            value={bulkLocation}
            onChange={(e) => setBulkLocation(e.target.value)}
            placeholder="Apply one location to all copies"
          />
          <button
            type="button"
            className="btn-secondary"
            onClick={handleBulkLocationSave}
            disabled={isBulkSaving || copies.length === 0}
          >
            {isBulkSaving ? 'Applying...' : 'Apply to All'}
          </button>
        </div>

        {loading ? (
          <p>Loading copies...</p>
        ) : copies.length === 0 ? (
          <div className="empty-state">
            <p>No copies available.</p>
          </div>
        ) : (
          <div className="copy-management-table-wrap">
            <table className="copy-management-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Barcode</th>
                  <th>Status</th>
                  <th>Location</th>
                </tr>
              </thead>
              <tbody>
                {copies.map(copy => (
                  <tr key={copy.id}>
                    <td>
                      <div className="copy-id-stack">
                        <strong>#{copy.id}</strong>
                        <span>{copy.copy_code || `Copy #${copy.id}`}</span>
                      </div>
                    </td>
                    <td className="barcode-cell">
                      {copy.copy_code && (
                        <Barcode code={copy.copy_code} width={1.1} height={32} />
                      )}
                    </td>
                    <td>
                      <select
                        value={copy.status}
                        onChange={(e) => handleStatusChange(copy.id, e.target.value)}
                      >
                        <option value="available">Available</option>
                        <option value="unavailable">Unavailable</option>
                        <option value="borrowing">Borrowing</option>
                        <option value="borrowed">Borrowed</option>
                        <option value="reserved">Reserved</option>
                      </select>
                    </td>
                    <td>
                      <div className="copy-location-editor">
                        <input
                          type="text"
                          value={copy.location || ''}
                          onChange={(e) => handleLocationDraftChange(copy.id, e.target.value)}
                          placeholder={DEFAULT_COPY_LOCATION}
                        />
                        <button
                          type="button"
                          className="btn-primary"
                          onClick={() => handleLocationSave(copy.id, copy.location || '')}
                          disabled={savingCopyIds.has(copy.id)}
                        >
                          {savingCopyIds.has(copy.id) ? 'Saving...' : 'Confirm'}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default CopyManagementModal;
