import React from 'react';
import UserList from '../components/Users/UserList';

const UserManagementPage = () => {
  return (
    <div className="users-section card fade-in">
      <h2>Reader Management</h2>
      
      {/* Reader List */}
      <UserList />
    </div>
  );
};

export default UserManagementPage;