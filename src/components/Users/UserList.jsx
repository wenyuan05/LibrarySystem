import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { usersAPI } from '../../utils/api';
import './Users.css';

const UserList = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { user } = useAuth();

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
      <h3>Users</h3>
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
          {users.map(userItem => (
            <tr key={userItem.id} className="fade-in">
              <td>{userItem.id}</td>
              <td>{userItem.username}</td>
              <td>{userItem.role}</td>
              <td>{userItem.name}</td>
              <td>{userItem.email}</td>
              <td>
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