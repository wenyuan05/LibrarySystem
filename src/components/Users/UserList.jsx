import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { usersAPI } from '../../utils/api';
import AddUserForm from './AddUserForm';
import './Users.css';

const UserList = () => {
  const [users, setUsers] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const { user } = useAuth();
  const navigate = useNavigate();

  // 处理查看用户借阅记录
  const handleViewBorrowRecords = (userId) => {
    navigate(`/user-borrow-records/${userId}`);
  };

  // 加载用户数据
  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await usersAPI.getAll();
      setUsers(data);
    } catch (err) {
      setError('Failed to load users');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // 处理用户删除
  const handleDeleteUser = async (id) => {
    if (id === user.id) {
      alert('You cannot delete your own account');
      return;
    }

    if (window.confirm('Are you sure you want to delete this user?')) {
      try {
        await usersAPI.delete(id);
        setUsers(users.filter(userItem => userItem.id !== id));
      } catch (err) {
        setError('Failed to delete user');
        console.error(err);
      }
    }
  };

  // 处理用户添加
  const handleUserAdded = (newUser) => {
    setUsers(prevUsers => [...prevUsers, newUser]);
  };

  // 处理搜索
  const handleSearch = (e) => {
    const term = e.target.value;
    setSearchTerm(term);
    if (term.trim() === '') {
      setFilteredUsers(users);
    } else {
      const filtered = users.filter(userItem => 
        (userItem.username || '').toLowerCase().includes(term.toLowerCase()) ||
        (userItem.name || '').toLowerCase().includes(term.toLowerCase()) ||
        (userItem.email || '').toLowerCase().includes(term.toLowerCase())
      );
      setFilteredUsers(filtered);
    }
  };

  // 当用户列表变化时，更新过滤后的用户
  useEffect(() => {
    setFilteredUsers(users);
  }, [users]);

  if (loading) {
    return <div className="loading">Loading users...</div>;
  }

  if (error) {
    return (
      <div className="error-message">
        {error}
        <button onClick={fetchUsers} className="btn-primary">Retry</button>
      </div>
    );
  }

  return (
    <div className="user-list">
      {/* 操作栏 */}
      <div className="action-bar">
        <button 
          className="btn-primary"
          onClick={() => setShowAddForm(!showAddForm)}
        >
          {showAddForm ? 'Cancel' : 'Add User'}
        </button>
        <div className="search-bar">
          <input
            type="text"
            placeholder="Search users by username, name, or email..."
            value={searchTerm}
            onChange={handleSearch}
            className="search-input"
          />
        </div>
      </div>
      
      {/* 添加用户表单 */}
      {showAddForm && (
        <AddUserForm 
          onUserAdded={(newUser) => {
            handleUserAdded(newUser);
            setShowAddForm(false);
          }}
        />
      )}
      
      <table>
        <thead>
          <tr>
            <th>ID</th>
            <th>Username</th>
            <th>Role</th>
            <th>Name</th>
            <th>Email</th>
            <th>Action</th>
          </tr>
        </thead>
        <tbody>
          {filteredUsers.map(userItem => (
            <tr key={userItem.id} className="fade-in">
              <td>{userItem.id}</td>
              <td>{userItem.username}</td>
              <td>{userItem.role}</td>
              <td>{userItem.name}</td>
              <td>{userItem.email}</td>
              <td>
                <button 
                  className="btn-info"
                  onClick={() => handleViewBorrowRecords(userItem.id)}
                >
                  Borrow Records
                </button>
                <button 
                  className="btn-danger"
                  onClick={() => handleDeleteUser(userItem.id)}
                  disabled={userItem.id === user.id}
                >
                  Delete
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default UserList;