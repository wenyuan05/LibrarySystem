import React, { useState, useEffect } from 'react';
import { useToast } from '../context/ToastContext';
import BookList from '../components/Books/BookList';
import AddBookForm from '../components/Books/AddBookForm';
import EditBookForm from '../components/Books/EditBookForm';
import { booksAPI } from '../utils/api';

const BookManagementPage = () => {
  const [books, setBooks] = useState([]);
  const [filteredBooks, setFilteredBooks] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [booksLoading, setBooksLoading] = useState(true);
  const [editingBook, setEditingBook] = useState(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const { showToast } = useToast();

  // Load books data
  const fetchBooks = async () => {
    try {
      setBooksLoading(true);
      const data = await booksAPI.getAll();
      setBooks(data);
    } catch (err) {
      console.error('Failed to load books:', err);
      const errorMessage = 'Failed to load books. Please try again.';
      showToast(errorMessage, 'error');
    } finally {
      setBooksLoading(false);
    }
  };

  // Handle book addition
  const handleBookAdded = (newBook) => {
    setBooks(prevBooks => [...prevBooks, newBook]);
  };

  // Handle book update
  const handleBookUpdated = (updatedBook) => {
    setBooks(prevBooks => prevBooks.map(book => 
      book.id === updatedBook.id ? updatedBook : book
    ));
  };

  // Handle book deletion
  const handleBookDeleted = (bookId) => {
    setBooks(prevBooks => prevBooks.filter(book => book.id !== bookId));
  };

  // Load books on component mount
  useEffect(() => {
    fetchBooks();
  }, []);

  // Handle book edit
  const handleBookEdit = (updatedBook) => {
    setBooks(prevBooks => prevBooks.map(book => 
      book.id === updatedBook.id ? updatedBook : book
    ));
  };

  // Handle search input change
  const handleSearchChange = (e) => {
    const term = e.target.value;
    setSearchTerm(term);
  };

  // Handle search button click
  const handleSearchClick = () => {
    if (searchTerm.trim() === '') {
      setFilteredBooks(books);
    } else {
      const filtered = books.filter(book => 
        book.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        book.author.toLowerCase().includes(searchTerm.toLowerCase()) ||
        book.isbn.includes(searchTerm)
      );
      setFilteredBooks(filtered);
    }
  };

  // Update filtered books when books list changes
  useEffect(() => {
    setFilteredBooks(books);
  }, [books]);



  return (
    <div className="book-management-section card fade-in">
      <h2>Book Management</h2>
      
      {/* Action Bar */}
      <div className="action-bar">
        <div className="action-buttons">
          <button 
            className="btn-primary"
            onClick={() => setShowAddForm(!showAddForm)}
          >
            {showAddForm ? 'Cancel' : 'Add New Book'}
          </button>
          {/* 暂时隐藏导出按钮，待权限问题解决后再恢复 */}
          {/* <button 
            className="btn-secondary"
            onClick={async () => {
              try {
                // 使用booksAPI.export()方法来调用导出接口
                const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001/api';
                const token = localStorage.getItem('user') ? JSON.parse(localStorage.getItem('user')).token : '';
                
                const response = await fetch(`${API_BASE_URL}/books/export`, {
                  method: 'GET',
                  headers: {
                    'Authorization': `Bearer ${token}`,
                    'Accept': 'text/csv'
                  }
                });
                
                if (!response.ok) {
                  const errorData = await response.json().catch(() => ({}));
                  throw new Error(errorData.error || `Request failed with status ${response.status}`);
                }
                
                const blob = await response.blob();
                const url = window.URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.style.display = 'none';
                a.href = url;
                a.download = `books_${new Date().toISOString().split('T')[0]}.csv`;
                document.body.appendChild(a);
                a.click();
                window.URL.revokeObjectURL(url);
              } catch (error) {
                console.error('Export failed:', error);
                showToast('Export failed. Please try again.', 'error');
              }
            }}
          >
            Export Books
          </button> */}
        </div>
        <div className="search-bar">
          <div className="search-input-container">
            <input
              type="text"
              placeholder="Search books by title, author, or ISBN..."
              value={searchTerm}
              onChange={handleSearchChange}
              className="search-input"
            />
          </div>
          <button className="search-button" onClick={handleSearchClick}>
            <img src="/放大镜.svg" alt="Search" />
          </button>
        </div>
      </div>
      
      {/* Add Book Form */}
      {showAddForm && (
        <AddBookForm 
          onBookAdded={(newBook) => {
            handleBookAdded(newBook);
            setShowAddForm(false);
          }}
        />
      )}
      
      {/* Edit Book Form */}
      {editingBook && (
        <EditBookForm 
          book={editingBook}
          onEditComplete={(updatedBook) => {
            handleBookEdit(updatedBook);
            setEditingBook(null);
          }}
          onCancel={() => setEditingBook(null)}
        />
      )}

      {/* Book List (with edit functionality) */}
      <BookList 
        books={filteredBooks}
        loading={booksLoading}
        onBookUpdated={handleBookUpdated}
        onBookDeleted={handleBookDeleted}
        showEditButton={true}
        onEditBook={setEditingBook}
      />
    </div>
  );
};

export default BookManagementPage;