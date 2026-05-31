import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/useAuth';
import { useToast } from '../context/ToastContext';
import { Link } from 'react-router-dom';
import { usersAPI, borrowAPI } from '../utils/api';
import EditUserForm from '../components/Users/EditUserForm';
import './ProfilePage.css';

const ProfilePage = () => {
  const { user } = useAuth();
  const { showToast } = useToast();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [totalFine, setTotalFine] = useState(0);

  const fetchProfile = useCallback(async () => {
    if (!user?.id) return;
    try {
      setLoading(true);
      const userData = await usersAPI.getById(user.id);
      setProfile(userData);
      
      // 只有用户角色才获取罚款信息
      if (userData.role === 'user') {
        const fines = await borrowAPI.getUserFines(user.id);
        const total = fines
          .filter(fine => fine.fine_status === 'unpaid')
          .reduce((sum, fine) => sum + fine.fine, 0);
        setTotalFine(total);
      }
    } catch (err) {
      showToast('Failed to load profile', 'error');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [showToast, user?.id]);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

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

  const getRoleLabel = (role) => {
    if (!role) return '';
    if (role === 'user') return 'Reader';
    return role.charAt(0).toUpperCase() + role.slice(1);
  };

  if (loading) {
    return <div className="loading">Loading profile...</div>;
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
                {getRoleLabel(profile.role)}
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

            {/* Fine Information - Only for user role */}
            {profile.role === 'user' && (
              <div className="profile-section">
                <h3 className="section-title">Fine Information</h3>
                <div className="info-grid">
                  <div className="info-item full-width">
                    <span className="info-label">Total Fine</span>
                    <span className="info-value fine-amount">¥{totalFine.toFixed(2)}</span>
                  </div>
                  <div className="info-item full-width">
                    <Link to={`/fines/${user.id}`} className="btn-secondary fine-button">
                      View Fine Details
                    </Link>
                  </div>
                </div>
              </div>
            )}
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
