import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { usersAPI } from '../utils/api';
import EditUserForm from '../components/Users/EditUserForm';
import './ProfilePage.css';

const ProfilePage = () => {
  const { user } = useAuth();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => {
    if (user) {
      fetchProfile();
    }
  }, [user]);

  const fetchProfile = async () => {
    try {
      setLoading(true);
      setError(null);
      const userData = await usersAPI.getById(user.id);
      setProfile(userData);
    } catch (err) {
      setError('Failed to load profile');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleProfileUpdated = (updatedProfile) => {
    setProfile(updatedProfile);
    setIsEditing(false);
  };

  // Generate avatar text (first letter of username)
  const getAvatarText = () => {
    if (!profile?.name) return '?';
    return profile.name.charAt(0).toUpperCase();
  };

  // Get role corresponding style class
  const getRoleClass = () => {
    switch (profile?.role) {
      case 'admin':
        return 'role-admin';
      case 'librarian':
        return 'role-librarian';
      case 'user':
      default:
        return 'role-user';
    }
  };

  if (loading) {
    return <div className="loading">Loading profile...</div>;
  }

  if (error) {
    return (
      <div className="error-message">
        {error}
        <button onClick={fetchProfile} className="btn-primary">Retry</button>
      </div>
    );
  }

  if (!profile) {
    return <div className="error-message">Profile not found</div>;
  }

  return (
    <div className="profile-page card fade-in">
      {!isEditing ? (
        <>
          {/* Header Section */}
          <div className="profile-header">
            <div className="profile-avatar">
              {getAvatarText()}
            </div>
            <div className="profile-header-info">
              <h2 className="profile-name">{profile.name}</h2>
              <span className={`role-badge ${getRoleClass()}`}>
                {profile.role.charAt(0).toUpperCase() + profile.role.slice(1)}
              </span>
            </div>
          </div>

          {/* Two-column Layout */}
          <div className="profile-content">
            {/* Account Information */}
            <div className="profile-section">
              <h3 className="section-title">Account Information</h3>
              <div className="info-grid">
                <div className="info-item">
                  <span className="info-label">Username</span>
                  <span className="info-value">{profile.username}</span>
                </div>
                <div className="info-item">
                  <span className="info-label">Email</span>
                  <span className="info-value">{profile.email}</span>
                </div>
              </div>
            </div>

            {/* Personal Profile */}
            <div className="profile-section">
              <h3 className="section-title">Personal Profile</h3>
              <div className="info-grid">
                <div className="info-item">
                  <span className="info-label">Name</span>
                  <span className="info-value">{profile.name}</span>
                </div>
                <div className="info-item">
                  <span className="info-label">Phone</span>
                  <span className="info-value">{profile.phone || 'Not provided'}</span>
                </div>
                <div className="info-item full-width">
                  <span className="info-label">Address</span>
                  <span className="info-value">{profile.address || 'Not provided'}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Bottom Action Buttons */}
          <div className="profile-actions">
            <button 
              className="btn-primary profile-btn"
              onClick={() => setIsEditing(true)}
            >
              Edit Profile
            </button>
          </div>
        </>
      ) : (
        <EditUserForm 
          user={profile}
          onUserUpdated={handleProfileUpdated}
          onCancel={() => setIsEditing(false)}
        />
      )}
    </div>
  );
};

export default ProfilePage;