import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { useNavigate } from 'react-router-dom';
import { usersAPI } from '../../utils/api';
import AddUserForm from './AddUserForm';
import EditUserForm from './EditUserForm';
import './Users.css';

const UserList = () => {
  const [users, setUsers] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const { user } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();

  const getRoleLabel = (role) => {
    if (!role) return '';
    if (role === 'user') return 'Reader';
    return role.charAt(0).toUpperCase() + role.slice(1);
  };

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
      const data = await usersAPI.getAll();
      setUsers(data);
    } catch (err) {
      showToast('Failed to load users', 'error');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // 处理用户删除
  const handleDeleteUser = async (id) => {
    if (id === user.id) {
      showToast('You cannot delete your own account', 'error');
      return;
    }

    if (window.confirm('Are you sure you want to delete this user?')) {
      try {
        await usersAPI.delete(id);
        setUsers(users.filter(userItem => userItem.id !== id));
        showToast('User deleted successfully', 'success');
      } catch (err) {
        showToast('Failed to delete user', 'error');
        console.error(err);
      }
    }
  };

  // 处理用户添加
  const handleUserAdded = (newUser) => {
    setUsers(prevUsers => [...prevUsers, newUser]);
  };

  // 处理开始编辑用户
  const handleEditUser = (userItem) => {
    setEditingUser(userItem);
  };

  // 处理用户更新完成
  const handleUserUpdated = (updatedUser) => {
    setUsers(prevUsers => 
      prevUsers.map(userItem => 
        userItem.id === updatedUser.id ? updatedUser : userItem
      )
    );
    setEditingUser(null);
  };

  // 处理取消编辑
  const handleCancelEdit = () => {
    setEditingUser(null);
  };

  // 处理拉黑用户
  const handleBlockUser = async (id) => {
    if (window.confirm('Are you sure you want to block this user?')) {
      try {
        await usersAPI.block(id);
        setUsers(users.map(userItem => 
          userItem.id === id ? { ...userItem, status: 'blocked' } : userItem
        ));
        showToast('User blocked successfully', 'success');
      } catch (err) {
        showToast('Failed to block user', 'error');
        console.error(err);
      }
    }
  };

  // 处理解除拉黑用户
  const handleUnblockUser = async (id) => {
    if (window.confirm('Are you sure you want to unblock this user?')) {
      try {
        await usersAPI.unblock(id);
        setUsers(users.map(userItem => 
          userItem.id === id ? { ...userItem, status: 'active' } : userItem
        ));
        showToast('User unblocked successfully', 'success');
      } catch (err) {
        showToast('Failed to unblock user', 'error');
        console.error(err);
      }
    }
  };

  // 处理搜索输入变化
  const handleSearchChange = (e) => {
    const term = e.target.value;
    setSearchTerm(term);
  };

  // 处理搜索按钮点击
  const handleSearchClick = () => {
    if (searchTerm.trim() === '') {
      setFilteredUsers(users);
    } else {
      const filtered = users.filter(userItem => 
        (userItem.username || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (userItem.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (userItem.email || '').toLowerCase().includes(searchTerm.toLowerCase())
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

  return (
    <div className="user-list">
      {/* 操作栏 */}
      <div className="action-bar">
        {user.role === 'admin' && (
          <button 
            className="btn-primary"
            onClick={() => setShowAddForm(!showAddForm)}
          >
            {showAddForm ? 'Cancel' : 'Add User'}
          </button>
        )}
        <div className="user-management-search-bar">
          <div className="search-input-container">
            <input
              type="text"
              placeholder="Search users by username, name, or email..."
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
      
      {/* 添加用户表单 */}
      {showAddForm && (
        <AddUserForm 
          onUserAdded={(newUser) => {
            handleUserAdded(newUser);
            setShowAddForm(false);
          }}
        />
      )}

      {/* 编辑用户表单 */}
      {editingUser && (
        <EditUserForm 
          user={editingUser}
          onUserUpdated={handleUserUpdated}
          onCancel={handleCancelEdit}
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
            <th>Status</th>
            <th>Action</th>
          </tr>
        </thead>
        <tbody>
          {filteredUsers.map(userItem => (
            <tr key={userItem.id} className="fade-in">
              <td>{userItem.id}</td>
              <td>{userItem.username}</td>
              <td>{getRoleLabel(userItem.role)}</td>
              <td>{userItem.name}</td>
              <td>{userItem.email}</td>
              <td>
                <span className={`status-badge status-${userItem.status || 'active'}`}>
                  {userItem.status || 'active'}
                </span>
              </td>
              <td>
                <button 
                  className="btn-info"
                  onClick={() => handleViewBorrowRecords(userItem.id)}
                >
                  Borrow Records
                </button>
                {user.role === 'admin' && (
                  <button 
                    className="btn-primary"
                    onClick={() => handleEditUser(userItem)}
                  >
                    Edit
                  </button>
                )}
                {(user.role === 'admin' || user.role === 'librarian') && userItem.role === 'user' && (
                  userItem.status !== 'blocked' ? (
                    <button 
                      className="btn-warning"
                      onClick={() => handleBlockUser(userItem.id)}
                    >
                      Block
                    </button>
                  ) : (
                    <button 
                      className="btn-success"
                      onClick={() => handleUnblockUser(userItem.id)}
                    >
                      Unblock
                    </button>
                  )
                )}
                {user.role === 'admin' && (
                  <button 
                    className="btn-danger"
                    onClick={() => handleDeleteUser(userItem.id)}
                    disabled={userItem.id === user.id}
                  >
                    Delete
                  </button>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default UserList;
