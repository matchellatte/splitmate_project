import React, { useEffect, useState, useRef } from 'react';
import API from '../api';

function Profile() {
  const [profile, setProfile] = useState({
    username: '',
    email: '',
    date_joined: '',
    profile_picture: null,
    profile_picture_url: '',
  });
  const [stats, setStats] = useState({
    groupCount: 0,
    expensesPaid: 0,
    totalPaid: 0,
  });
  const [preview, setPreview] = useState('');
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');
  const fileInputRef = useRef();

  useEffect(() => {
    async function fetchProfile() {
      try {
        // Fetch user profile
        const res = await API.get('profile/');
        setProfile({
          username: res.data.username,
          email: res.data.email || '',
          date_joined: res.data.date_joined,
          profile_picture: null,
          profile_picture_url: res.data.profile_picture,
        });
        setPreview(res.data.profile_picture);

        // Fetch stats
        setStats({
          groupCount: res.data.user_groups ? res.data.user_groups.length : 0,
          expensesPaid: res.data.expenses_paid || res.data.expenses_paid_count || 0,
          totalPaid: res.data.total_paid || 0,
        });
      } catch (err) {
        setError('Failed to load profile.');
      }
    }
    fetchProfile();
  }, []);

  // Handle file input change and preview
  const handleFileChange = (e) => {
    const file = e.target.files[0];
    setProfile(prev => ({ ...prev, profile_picture: file }));
    if (file) {
      const reader = new FileReader();
      reader.onload = (ev) => setPreview(ev.target.result);
      reader.readAsDataURL(file);
    }
  };

  // Handle form field changes
  const handleChange = (e) => {
    const { name, value } = e.target;
    setProfile(prev => ({ ...prev, [name]: value }));
  };

  // Handle form submit
  const handleSubmit = async (e) => {
    e.preventDefault();
    setSuccess('');
    setError('');
    const formData = new FormData();
    // Only allow updating profile picture for now
    if (profile.profile_picture) {
      formData.append('profile_picture', profile.profile_picture);
    }
    try {
      await API.put('profile/', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setSuccess('Profile updated successfully!');
    } catch (err) {
      setError('Failed to update profile.');
    }
  };

  return (
    <div className="container-fluid">
      <div className="row justify-content-center">
        <div className="col-md-8">
          <div className="card shadow-sm mb-4">
            <div className="card-header bg-white border-bottom-0">
              <h5 className="mb-0">Your Profile</h5>
            </div>
            <div className="card-body">
              <form onSubmit={handleSubmit} encType="multipart/form-data">
                <div className="row mb-4">
                  <div className="col-md-4 text-center">
                    {preview ? (
                      <img
                        src={preview}
                        alt="Profile"
                        className="rounded-circle img-thumbnail shadow"
                        style={{ width: 150, height: 150, objectFit: 'cover' }}
                      />
                    ) : (
                      <div
                        className="rounded-circle bg-secondary d-flex align-items-center justify-content-center shadow"
                        style={{ width: 150, height: 150, margin: '0 auto' }}
                      >
                        <i className="fas fa-user fa-4x text-white"></i>
                      </div>
                    )}
                    <div className="mt-3">
                      <label htmlFor="profile_picture" className="btn btn-outline-primary btn-sm">
                        <i className="fas fa-camera me-2"></i>Change Photo
                      </label>
                      <input
                        type="file"
                        id="profile_picture"
                        name="profile_picture"
                        className="d-none"
                        accept="image/*"
                        ref={fileInputRef}
                        onChange={handleFileChange}
                      />
                    </div>
                  </div>
                  <div className="col-md-8">
                    <div className="mb-3">
                      <label className="form-label">Username</label>
                      <input
                        type="text"
                        className="form-control"
                        value={profile.username}
                        readOnly
                      />
                    </div>
                    <div className="mb-3">
                      <label className="form-label">Email</label>
                      <input
                        type="email"
                        className="form-control"
                        value={profile.email}
                        readOnly
                      />
                    </div>
                    <div className="mb-3">
                      <label className="form-label">Member Since</label>
                      <input
                        type="text"
                        className="form-control"
                        value={profile.date_joined ? new Date(profile.date_joined).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' }) : ''}
                        readOnly
                      />
                    </div>
                  </div>
                </div>
                <div className="d-grid gap-2">
                  <button type="submit" className="btn fw-semibold" style={{ background: '#198754', color: '#fff' }}>
                    <i className="fas fa-save me-2"></i>Save Changes
                  </button>
                </div>
                {success && <div className="alert alert-success mt-3">{success}</div>}
                {error && <div className="alert alert-danger mt-3">{error}</div>}
              </form>
            </div>
          </div>
          {/* Statistics Card */}
          <div className="card shadow-sm mt-4">
            <div className="card-header bg-white border-bottom-0">
              <h5 className="mb-0">Your Statistics</h5>
            </div>
            <div className="card-body">
              <div className="row text-center">
                <div className="col-md-4 mb-3 mb-md-0">
                  <div className="p-3 rounded bg-light shadow-sm h-100">
                    <i className="fas fa-users fa-2x mb-2 text-success"></i>
                    <h4 className="mb-0">{stats.groupCount}</h4>
                    <div className="text-muted">Groups</div>
                  </div>
                </div>
                <div className="col-md-4 mb-3 mb-md-0">
                  <div className="p-3 rounded bg-light shadow-sm h-100">
                    <i className="fas fa-receipt fa-2x mb-2 text-success"></i>
                    <h4 className="mb-0">{stats.expensesPaid}</h4>
                    <div className="text-muted">Expenses Paid</div>
                  </div>
                </div>
                <div className="col-md-4">
                  <div className="p-3 rounded bg-light shadow-sm h-100">
                    <i className="fas fa-wallet fa-2x mb-2 text-success"></i>
                    <h4 className="mb-0">₱{Number(stats.totalPaid).toFixed(2)}</h4>
                    <div className="text-muted">Total Amount Paid</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Profile;