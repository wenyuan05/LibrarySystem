import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { useToast } from '../../context/ToastContext';
import { booksAPI, categoryAPI } from '../../utils/api';
import './Books.css';

const ISBN_PATTERN = /^\d{10}(?:\d{3})?$/;

const AddBookForm = ({ onBookAdded, onCancel }) => {
  const emptyBookForm = {
    title: '',
    author: '',
    isbn: '',
    publisher: '',
    publish_date: '',
    language: 'English',
    page_count: '',
    description: '',
    cover_image: ''
  };
  const [formData, setFormData] = useState(emptyBookForm);
  const [selectedCategories, setSelectedCategories] = useState([]);
  const [categories, setCategories] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [categoriesLoading, setCategoriesLoading] = useState(true);
  const [isSearchingISBN, setIsSearchingISBN] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [importProgress, setImportProgress] = useState({ current: 0, total: 0 });
  const [importResult, setImportResult] = useState(null);
  const [isbnList, setIsbnList] = useState('');
  const [existingBooks, setExistingBooks] = useState([]);
  const [metadataCache, setMetadataCache] = useState({});
  const [isbnProviders, setIsbnProviders] = useState([]);
  const [selectedProvider, setSelectedProvider] = useState('openlibrary');
  const [providerStatuses, setProviderStatuses] = useState({});
  const [testingProvider, setTestingProvider] = useState(null);
  const [isCategoryDropdownOpen, setIsCategoryDropdownOpen] = useState(false);
  const [categoryDropdownRect, setCategoryDropdownRect] = useState(null);
  const [batchSettings, setBatchSettings] = useState({
    defaultLocation: 'Main Shelf',
    copiesPerBook: 1,
    categoryId: ''
  });
  const [activeTab, setActiveTab] = useState('single'); // 'single' or 'batch'
  const { showToast } = useToast();
  const dropdownRef = useRef(null);
  const dropdownMenuRef = useRef(null);
  const csvInputRef = useRef(null);

  const updateCategoryDropdownPosition = useCallback(() => {
    if (!dropdownRef.current) return;

    const rect = dropdownRef.current.getBoundingClientRect();
    const preferredHeight = 240;
    const spaceBelow = window.innerHeight - rect.bottom - 12;
    const spaceAbove = rect.top - 12;
    const openUp = spaceBelow < 160 && spaceAbove > spaceBelow;
    const maxHeight = Math.max(120, Math.min(preferredHeight, openUp ? spaceAbove : spaceBelow));

    setCategoryDropdownRect({
      top: openUp ? rect.top - maxHeight - 2 : rect.bottom + 2,
      left: rect.left,
      width: rect.width,
      maxHeight
    });
  }, []);

  const getMetadataCacheKey = useCallback((isbn, provider = selectedProvider) => `${provider}:${isbn}`, [selectedProvider]);

  const handleChange = (e) => {
    const { name, value, type } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'number' ? parseInt(value, 10) || 0 : value
    }));
  };

  const handleBatchSettingChange = (e) => {
    const { name, value } = e.target;
    setBatchSettings(prev => ({
      ...prev,
      [name]: name === 'copiesPerBook'
        ? Math.max(1, Math.min(100, parseInt(value, 10) || 1))
        : value
    }));
  };

  // 获取分类列表
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        setCategoriesLoading(true);
        const [data, books] = await Promise.all([
          categoryAPI.getAll(),
          booksAPI.getAll()
        ]);
        setCategories(data);
        setExistingBooks(books);
      } catch (error) {
        console.error('Error fetching categories:', error);
      } finally {
        setCategoriesLoading(false);
      }
    };

    fetchCategories();
  }, []);

  useEffect(() => {
    const fetchIsbnProviders = async () => {
      try {
        const providers = await booksAPI.getIsbnProviders();
        setIsbnProviders(providers);
        setSelectedProvider(currentProvider => {
          if (providers.some(provider => provider.id === currentProvider)) {
            return currentProvider;
          }

          return providers[0]?.id || currentProvider;
        });
      } catch (error) {
        showToast('Failed to load ISBN lookup providers', 'error');
        console.error('Error fetching ISBN providers:', error);
      }
    };

    fetchIsbnProviders();
  }, [showToast]);

  // 关闭下拉菜单当点击外部
  useEffect(() => {
    const handleClickOutside = (event) => {
      const clickedToggle = dropdownRef.current?.contains(event.target);
      const clickedMenu = dropdownMenuRef.current?.contains(event.target);

      if (!clickedToggle && !clickedMenu) {
        setIsCategoryDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  useEffect(() => {
    if (!isCategoryDropdownOpen) return undefined;

    updateCategoryDropdownPosition();
    const handleViewportChange = () => updateCategoryDropdownPosition();

    window.addEventListener('resize', handleViewportChange);
    window.addEventListener('scroll', handleViewportChange, true);

    return () => {
      window.removeEventListener('resize', handleViewportChange);
      window.removeEventListener('scroll', handleViewportChange, true);
    };
  }, [isCategoryDropdownOpen, updateCategoryDropdownPosition]);

  // 处理分类选择
  const handleCategoryChange = (categoryId) => {
    setSelectedCategories(prev => {
      if (prev.includes(categoryId)) {
        return prev.filter(id => id !== categoryId);
      } else {
        return [...prev, categoryId];
      }
    });
  };

  const parsedIsbns = useMemo(() => {
    return isbnList
      .split(/\r?\n/)
      .map(value => value.trim().replace(/[-\s]/g, ''))
      .filter(Boolean);
  }, [isbnList]);

  const existingIsbnSet = useMemo(() => {
    return new Set(existingBooks.map(book => String(book.isbn || '').replace(/[-\s]/g, '')));
  }, [existingBooks]);

  const batchPreview = useMemo(() => {
    const seen = new Set();

    return parsedIsbns.map((isbn, index) => {
      const metadata = metadataCache[getMetadataCacheKey(isbn)];
      let status = 'success';

      if (!ISBN_PATTERN.test(isbn) || metadata?.status === 'invalid') {
        status = 'invalid';
      } else if (existingIsbnSet.has(isbn) || seen.has(isbn)) {
        status = 'duplicate';
      }

      seen.add(isbn);

      return {
        id: `${isbn}-${index}`,
        isbn,
        title: metadata?.data?.title || (status === 'success' ? 'Metadata ready to fetch' : 'Unavailable'),
        author: metadata?.data?.author || (status === 'success' ? `${isbnProviders.find(provider => provider.id === selectedProvider)?.name || 'Selected provider'} lookup` : '-'),
        cover: metadata?.data?.cover_image || '',
        status
      };
    });
  }, [existingIsbnSet, getMetadataCacheKey, metadataCache, parsedIsbns, selectedProvider, isbnProviders]);

  const importablePreview = useMemo(() => batchPreview.filter(item => item.status === 'success'), [batchPreview]);
  const blockedPreview = useMemo(() => batchPreview.filter(item => item.status !== 'success'), [batchPreview]);

  useEffect(() => {
    if (activeTab !== 'batch') return undefined;

    const candidates = importablePreview
      .map(item => item.isbn)
      .filter(isbn => !metadataCache[getMetadataCacheKey(isbn)])
      .slice(0, 8);

    if (candidates.length === 0) return undefined;

    const timer = setTimeout(() => {
      candidates.forEach(async (isbn) => {
        setMetadataCache(prev => ({
          ...prev,
          [getMetadataCacheKey(isbn)]: { status: 'loading' }
        }));

        try {
          const data = await booksAPI.searchByISBN(isbn, selectedProvider);
          setMetadataCache(prev => ({
            ...prev,
            [getMetadataCacheKey(isbn)]: { status: 'loaded', data }
          }));
        } catch (error) {
          console.error(`Failed to preview ISBN ${isbn}:`, error);
          setMetadataCache(prev => ({
            ...prev,
            [getMetadataCacheKey(isbn)]: { status: 'invalid' }
          }));
        }
      });
    }, 450);

    return () => clearTimeout(timer);
  }, [activeTab, getMetadataCacheKey, importablePreview, metadataCache, selectedProvider]);

  const handleProviderChange = (event) => {
    setSelectedProvider(event.target.value);
    setMetadataCache({});
    setImportResult(null);
  };

  const handleTestProvider = async () => {
    const providerToTest = selectedProvider;
    setTestingProvider(providerToTest);
    try {
      const result = await booksAPI.testIsbnProvider(providerToTest);
      setProviderStatuses(prev => ({ ...prev, [providerToTest]: result }));
      showToast(
        result.available ? `${result.provider_name} is available` : `${result.provider_name} is unavailable`,
        result.available ? 'success' : 'error'
      );
    } catch (error) {
      setProviderStatuses(prev => ({
        ...prev,
        [providerToTest]: {
          provider: providerToTest,
          available: false,
          error: error.message,
          last_tested_at: new Date().toISOString()
        }
      }));
      showToast(error.message || 'Failed to test ISBN provider', 'error');
    } finally {
      setTestingProvider(null);
    }
  };

  // 通过 ISBN 查询书籍信息
  const handleSearchISBN = async () => {
    if (!formData.isbn) {
      showToast('ISBN is required', 'error');
      return;
    }
    
    setIsSearchingISBN(true);
    
    try {
      const bookData = await booksAPI.searchByISBN(formData.isbn, selectedProvider);
      setFormData(prev => ({
        ...prev,
        title: bookData.title || '',
        author: bookData.author || '',
        publisher: bookData.publisher || '',
        publish_date: bookData.publish_date || '',
        language: bookData.language || 'English',
        page_count: bookData.page_count || '',
        description: bookData.description || '',
        cover_image: bookData.cover_image || ''
      }));
      showToast('Book information fetched successfully!', 'success');
    } catch (err) {
      showToast(err.message || 'Failed to fetch book information. Please try again.', 'error');
      console.error(err);
    } finally {
      setIsSearchingISBN(false);
    }
  };

  // 批量导入书籍
  const handleBatchImport = async () => {
    if (parsedIsbns.length === 0) {
      showToast('ISBN list is required', 'error');
      return;
    }

    if (importablePreview.length === 0) {
      showToast('No importable ISBNs found', 'error');
      return;
    }

    if (providerStatuses[selectedProvider] && !providerStatuses[selectedProvider].available) {
      showToast('Selected ISBN lookup node is unavailable. Please test or switch nodes.', 'error');
      return;
    }
    
    setIsImporting(true);
    setImportProgress({ current: 0, total: importablePreview.length });
    setImportResult(null);
    
    try {
      const books = [];
      const lookupErrors = blockedPreview.map(item => ({
        isbn: item.isbn,
        error: item.status === 'duplicate' ? 'Duplicate ISBN in database or import list' : 'ISBN must be 10 or 13 digits, or metadata was not found'
      }));

      for (const item of importablePreview) {
        try {
          const cachedData = metadataCache[getMetadataCacheKey(item.isbn)]?.data;
          const bookData = cachedData || await booksAPI.searchByISBN(item.isbn, selectedProvider);
          books.push({
            ...bookData,
            total_copies: batchSettings.copiesPerBook,
            location: batchSettings.defaultLocation,
            category_id: batchSettings.categoryId ? Number(batchSettings.categoryId) : null
          });
        } catch (err) {
          console.error(`Failed to fetch book for ISBN ${item.isbn}:`, err);
          lookupErrors.push({
            isbn: item.isbn,
            error: err.message || 'Failed to fetch metadata'
          });
        } finally {
          setImportProgress(prev => ({
            ...prev,
            current: Math.min(prev.current + 1, prev.total)
          }));
        }
      }

      if (books.length === 0) {
        setImportResult({
          success: 0,
          failed: lookupErrors.length,
          errors: lookupErrors
        });
        showToast('No valid books found', 'error');
        return;
      }

      // 批量导入书籍
      const result = await booksAPI.batchImport(books);
      const mergedResult = {
        ...result,
        failed: result.failed + lookupErrors.length,
        errors: [...lookupErrors, ...(result.errors || [])]
      };
      setImportResult(mergedResult);
      showToast(`Batch import completed: ${mergedResult.success} success, ${mergedResult.failed} failed`, mergedResult.success > 0 ? 'success' : 'error');

      if (mergedResult.success > 0) {
        setIsbnList('');
        setMetadataCache({});
      }
      
      // 通知父组件刷新书籍列表
      if (onBookAdded && result.success > 0) {
        onBookAdded();
      }
    } catch (err) {
      showToast(err.message || 'Failed to import books. Please try again.', 'error');
      console.error(err);
    } finally {
      setIsImporting(false);
      setImportProgress({ current: 0, total: 0 });
    }
  };

  const handleCsvUpload = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      const text = String(reader.result || '');
      const values = text
        .split(/[\r\n,]+/)
        .map(value => value.trim())
        .filter(Boolean);

      setIsbnList(values.join('\n'));
      setImportResult(null);
    };
    reader.readAsText(file);
    event.target.value = '';
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    // 前端验证
    if (!formData.title || typeof formData.title !== 'string' || !formData.title.trim()) {
      showToast('Title is required', 'error');
      setIsSubmitting(false);
      return;
    }
    if (formData.title.length > 100) {
      showToast('Title must be less than 100 characters', 'error');
      setIsSubmitting(false);
      return;
    }
    if (!formData.author || typeof formData.author !== 'string' || !formData.author.trim()) {
      showToast('Author is required', 'error');
      setIsSubmitting(false);
      return;
    }
    if (formData.author.length > 50) {
      showToast('Author must be less than 50 characters', 'error');
      setIsSubmitting(false);
      return;
    }
    if (!formData.isbn || typeof formData.isbn !== 'string' || !formData.isbn.trim()) {
      showToast('ISBN is required', 'error');
      setIsSubmitting(false);
      return;
    }
    // 严格的ISBN格式检查
    if (!ISBN_PATTERN.test(formData.isbn)) {
      showToast('ISBN must be 10 or 13 digits', 'error');
      setIsSubmitting(false);
      return;
    }
    if (formData.publisher && typeof formData.publisher !== 'string') {
      showToast('Publisher must be a string', 'error');
      setIsSubmitting(false);
      return;
    }
    if (formData.publisher && formData.publisher.length > 50) {
      showToast('Publisher must be less than 50 characters', 'error');
      setIsSubmitting(false);
      return;
    }
    if (formData.page_count && (typeof formData.page_count !== 'string' && typeof formData.page_count !== 'number')) {
      showToast('Page count must be a number', 'error');
      setIsSubmitting(false);
      return;
    }
    if (formData.page_count) {
      const pageCount = parseInt(formData.page_count);
      if (isNaN(pageCount) || pageCount < 1 || pageCount > 10000) {
        showToast('Page count must be between 1 and 10000', 'error');
        setIsSubmitting(false);
        return;
      }
    }

    try {
      const newBook = await booksAPI.add(formData);
      
      // 关联分类
      if (selectedCategories.length > 0) {
        for (const categoryId of selectedCategories) {
          await categoryAPI.addBookCategory(newBook.id, categoryId);
        }
      }
      
      showToast('Book added successfully!', 'success');
      // 重置表单
      setFormData(emptyBookForm);
      setSelectedCategories([]);
      // 通知父组件刷新书籍列表
      if (onBookAdded) {
        onBookAdded(newBook);
      }
    } catch (err) {
      showToast(err.message || 'Failed to add book. Please try again.', 'error');
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const selectedProviderInfo = isbnProviders.find(provider => provider.id === selectedProvider);
  const currentProviderStatus = providerStatuses[selectedProvider];
  const isSelectedProviderUnavailable = currentProviderStatus && !currentProviderStatus.available;

  return (
    <div className="add-book-form">
      <div className="add-book-modal-header">
        <div>
          <h3>Add New Book</h3>
          <p>Create book metadata or import ISBNs into inventory.</p>
        </div>
        {onCancel && (
          <button
            type="button"
            className="modal-close"
            onClick={onCancel}
            aria-label="Close add book dialog"
          >
            ×
          </button>
        )}
      </div>
      
      {/* 标签页切换 */}
      <div className="tab-container">
        <button
          type="button"
          className={`tab-button ${activeTab === 'single' ? 'active' : ''}`}
          onClick={() => setActiveTab('single')}
        >
          Single Book
        </button>
        <button
          type="button"
          className={`tab-button ${activeTab === 'batch' ? 'active' : ''}`}
          onClick={() => setActiveTab('batch')}
        >
          Batch Import
        </button>
      </div>

      <section className="isbn-provider-panel">
        <div className="isbn-provider-copy">
          <label htmlFor="isbn-provider">ISBN Lookup API</label>
          <p>Select and test the metadata source used by single and batch ISBN lookup.</p>
        </div>
        <div className="isbn-provider-controls">
          <select
            id="isbn-provider"
            value={selectedProvider}
            onChange={handleProviderChange}
            disabled={isSubmitting || isSearchingISBN || isImporting || isbnProviders.length === 0}
          >
            {isbnProviders.map(provider => (
              <option key={provider.id} value={provider.id}>
                {provider.name}{provider.requires_app_key && !provider.configured ? ' (key required)' : ''}
              </option>
            ))}
          </select>
          <button
            type="button"
            className="btn-secondary"
            onClick={handleTestProvider}
            disabled={testingProvider === selectedProvider || isbnProviders.length === 0}
          >
            {testingProvider === selectedProvider ? 'Testing...' : 'Test Node'}
          </button>
        </div>
        <div className={`isbn-provider-status ${currentProviderStatus ? (currentProviderStatus.available ? 'available' : 'unavailable') : 'unknown'}`}>
          <strong>{selectedProviderInfo?.name || 'No provider selected'}</strong>
          {currentProviderStatus ? (
            <span>
              {currentProviderStatus.available ? 'Available' : 'Unavailable'}
              {currentProviderStatus.latency_ms !== undefined ? ` · ${currentProviderStatus.latency_ms} ms` : ''}
              {currentProviderStatus.last_tested_at ? ` · ${new Date(currentProviderStatus.last_tested_at).toLocaleString()}` : ''}
              {!currentProviderStatus.available && currentProviderStatus.error ? ` · ${currentProviderStatus.error}` : ''}
            </span>
          ) : (
            <span>
              Not tested · {selectedProviderInfo?.endpoint || 'Provider endpoint unavailable'}
              {selectedProviderInfo?.requires_app_key && !selectedProviderInfo?.configured ? ' · App key not configured' : ''}
            </span>
          )}
        </div>
      </section>
      
      {/* 单本书籍添加 */}
      {activeTab === 'single' && (
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="title">Title:</label>
            <input
              type="text"
              id="title"
              name="title"
              value={formData.title}
              onChange={handleChange}
              required
              disabled={isSubmitting}
            />
          </div>
          <div className="form-group">
            <label htmlFor="author">Author:</label>
            <input
              type="text"
              id="author"
              name="author"
              value={formData.author}
              onChange={handleChange}
              required
              disabled={isSubmitting}
            />
          </div>
          <div className="form-group">
            <label htmlFor="isbn">ISBN:</label>
            <div className="isbn-input-group">
              <input
                type="text"
                id="isbn"
                name="isbn"
                value={formData.isbn}
                onChange={handleChange}
                required
                disabled={isSubmitting || isSearchingISBN || isSelectedProviderUnavailable}
              />
              <button
                type="button"
                className="btn-secondary"
                onClick={handleSearchISBN}
                disabled={isSubmitting || isSearchingISBN || !formData.isbn || isSelectedProviderUnavailable}
              >
                {isSearchingISBN ? 'Searching...' : 'Search ISBN'}
              </button>
            </div>
          </div>
        <div className="form-group">
          <label htmlFor="publisher">Publisher:</label>
          <input
            type="text"
            id="publisher"
            name="publisher"
            value={formData.publisher}
            onChange={handleChange}
            disabled={isSubmitting}
          />
        </div>
        <div className="form-group">
          <label htmlFor="publish_date">Publish Date:</label>
          <input
            type="text"
            id="publish_date"
            name="publish_date"
            value={formData.publish_date}
            onChange={handleChange}
            placeholder="YYYY-MM-DD, YYYY-MM, YYYY, or original value"
            disabled={isSubmitting}
          />
        </div>
        <div className="form-group">
          <label htmlFor="language">Language:</label>
          <select
            id="language"
            name="language"
            value={formData.language}
            onChange={handleChange}
            disabled={isSubmitting}
          >
            <option value="English">English</option>
            <option value="Chinese">Chinese</option>
            <option value="Japanese">Japanese</option>
            <option value="Korean">Korean</option>
            <option value="Other">Other</option>
          </select>
        </div>
        <div className="form-group">
          <label htmlFor="page_count">Page Count:</label>
          <input
            type="number"
            id="page_count"
            name="page_count"
            value={formData.page_count}
            onChange={handleChange}
            min="1"
            disabled={isSubmitting}
          />
        </div>
        <div className="form-group">
          <label>Categories:</label>
          {categoriesLoading ? (
            <p>Loading categories...</p>
          ) : categories.length === 0 ? (
            <p>No categories available</p>
          ) : (
            <div className="category-dropdown" ref={dropdownRef}>
              <button
                type="button"
                className="category-dropdown-toggle"
                onClick={(e) => {
                  e.stopPropagation();
                  updateCategoryDropdownPosition();
                  setIsCategoryDropdownOpen(prev => !prev);
                }}
                disabled={isSubmitting}
                aria-expanded={isCategoryDropdownOpen}
              >
                {selectedCategories.length > 0 ? 
                  `${selectedCategories.length} selected` : 
                  'Select categories'}
                <span className="dropdown-arrow">▼</span>
              </button>
              {isCategoryDropdownOpen && categoryDropdownRect && createPortal(
                <div
                  ref={dropdownMenuRef}
                  className="category-dropdown-menu category-dropdown-menu-portal show"
                  style={{
                    top: `${categoryDropdownRect.top}px`,
                    left: `${categoryDropdownRect.left}px`,
                    width: `${categoryDropdownRect.width}px`,
                    maxHeight: `${categoryDropdownRect.maxHeight}px`
                  }}
                  onClick={(e) => e.stopPropagation()}
                >
                  {categories.map(category => (
                    <button
                      type="button"
                      key={category.id}
                      className={`dropdown-item ${selectedCategories.includes(category.id) ? 'active' : ''}`}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleCategoryChange(category.id);
                      }}
                      disabled={isSubmitting}
                    >
                      {category.name}
                    </button>
                  ))}
                </div>,
                document.body
              )}
            </div>
          )}
        </div>
        <button 
          type="submit" 
          className="btn-primary" 
          disabled={isSubmitting}
        >
          {isSubmitting ? 'Adding...' : 'Add Book'}
        </button>
        </form>
      )}
      
      {/* 批量导入书籍 */}
      {activeTab === 'batch' && (
        <div className="batch-import-form batch-import-dashboard">
          <div className="batch-panels">
            <section className="batch-panel isbn-panel">
              <div className="batch-panel-header">
                <div>
                  <h4>ISBN Intake</h4>
                  <p>Paste or upload identifiers for metadata lookup.</p>
                </div>
                <span>{parsedIsbns.length} ISBNs</span>
              </div>
              <div className="form-group">
                <label htmlFor="batch-isbn-list">ISBN List (one per line)</label>
                <textarea
                  id="batch-isbn-list"
                  value={isbnList}
                  onChange={(e) => {
                    setIsbnList(e.target.value);
                    setImportResult(null);
                  }}
                  rows="13"
                  placeholder={'9780743273565\n9780451524935\n9780061120084'}
                  disabled={isImporting}
                />
                <p className="batch-helper-text">Paste one ISBN per line</p>
              </div>
              <input
                ref={csvInputRef}
                type="file"
                accept=".csv,.txt"
                onChange={handleCsvUpload}
                hidden
              />
              <button
                type="button"
                className="btn-secondary upload-csv-button"
                onClick={() => csvInputRef.current?.click()}
                disabled={isImporting}
              >
                Upload CSV
              </button>
            </section>

            <section className="batch-panel preview-panel">
              <div className="batch-panel-header">
                <div>
                  <h4>Live Import Preview</h4>
                  <p>Validate inventory before generating copies.</p>
                </div>
                <span>{importablePreview.length} ready</span>
              </div>

              {batchPreview.length === 0 ? (
                <div className="batch-empty-state">
                  <div className="empty-illustration">
                    <span></span>
                    <span></span>
                    <span></span>
                  </div>
                  <h5>No ISBNs detected</h5>
                  <p>Paste a list to preview metadata, duplicates, and invalid records.</p>
                </div>
              ) : (
                <div className="preview-list">
                  {batchPreview.map(item => (
                    <div className="preview-book-row" key={item.id}>
                      <div className="preview-cover">
                        {item.cover ? (
                          <img src={item.cover} alt={`${item.title} cover`} />
                        ) : (
                          <span>{item.title.charAt(0)}</span>
                        )}
                      </div>
                      <div className="preview-book-meta">
                        <strong>{item.title}</strong>
                        <span>{item.author}</span>
                        <small>ISBN {item.isbn}</small>
                      </div>
                      <span className={`import-status status-${item.status}`}>
                        {item.status === 'success' ? 'success' : item.status === 'duplicate' ? 'duplicate' : 'invalid ISBN'}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </section>
          </div>

          <section className="copy-settings-card">
            <div className="copy-settings-heading">
              <div>
                <h4>Copy Settings</h4>
                <p>Separate metadata import from physical copy generation.</p>
              </div>
              <span>Auto-generate copy IDs enabled</span>
            </div>
            <div className="copy-settings-grid">
              <div className="form-group">
                <label htmlFor="batch-default-location">Default Location</label>
                <input
                  id="batch-default-location"
                  type="text"
                  name="defaultLocation"
                  value={batchSettings.defaultLocation}
                  onChange={handleBatchSettingChange}
                  disabled={isImporting}
                />
              </div>
              <div className="form-group">
                <label htmlFor="batch-copies-per-book">Copies Per Book</label>
                <input
                  id="batch-copies-per-book"
                  type="number"
                  name="copiesPerBook"
                  min="1"
                  max="100"
                  value={batchSettings.copiesPerBook}
                  onChange={handleBatchSettingChange}
                  disabled={isImporting}
                />
              </div>
              <div className="form-group">
                <label htmlFor="batch-category">Category</label>
                <select
                  id="batch-category"
                  name="categoryId"
                  value={batchSettings.categoryId}
                  onChange={handleBatchSettingChange}
                  disabled={isImporting || categoriesLoading}
                >
                  <option value="">No category</option>
                  {categories.map(category => (
                    <option key={category.id} value={category.id}>{category.name}</option>
                  ))}
                </select>
              </div>
            </div>
          </section>

          {isImporting && importProgress.total > 0 && (
            <div className="import-progress">
              <div>
                <span>Importing books</span>
                <strong>{importProgress.current}/{importProgress.total}</strong>
              </div>
              <progress value={importProgress.current} max={importProgress.total}></progress>
            </div>
          )}

          <button
            type="button"
            className="btn-primary batch-import-primary"
            onClick={handleBatchImport}
            disabled={isImporting || importablePreview.length === 0 || isSelectedProviderUnavailable}
          >
            {isImporting ? 'Importing...' : 'Import Books'}
          </button>
          
          {/* 导入结果 */}
          {importResult && (
            <div className="import-result">
              <h4>Import Result</h4>
              <p>Success: {importResult.success}</p>
              <p>Failed: {importResult.failed}</p>
              {importResult.errors.length > 0 && (
                <div className="import-errors">
                  <h5>Errors:</h5>
                  <ul>
                    {importResult.errors.map((error, index) => (
                      <li key={index}>{error.isbn}: {error.error}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default AddBookForm;
