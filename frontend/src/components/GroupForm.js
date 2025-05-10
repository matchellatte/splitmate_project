import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import API from '../api';

function GroupForm({ isEdit = false }) {
  const { groupId } = useParams();
  const navigate = useNavigate();

  const [form, setForm] = useState({
    name: '',
    description: '',
    external_members: [{ username: '', email: '' }],
  });
  const [loading, setLoading] = useState(isEdit);
  const [error, setError] = useState('');
  const [userId, setUserId] = useState(null);

  // Fetch group data if editing
  useEffect(() => {
    if (isEdit && groupId) {
      API.get(`groups/${groupId}/`)
        .then(res => {
          setForm({
            name: res.data.name,
            description: res.data.description,
            external_members: res.data.external_members.length
              ? res.data.external_members.map(m => ({ username: m.username, email: m.email }))
              : [{ username: '', email: '' }],
          });
          setLoading(false);
        })
        .catch(() => setLoading(false));
    }
  }, [isEdit, groupId]);

  // Fetch user profile to get user ID
  useEffect(() => {
    API.get('profile/')
      .then(res => setUserId(res.data.id))
      .catch(() => setUserId(null));
  }, []);

  // Handle input changes
  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
  };

  // Handle external member changes
  const handleMemberChange = (idx, field, value) => {
    setForm(prev => {
      const members = [...prev.external_members];
      members[idx][field] = value;
      return { ...prev, external_members: members };
    });
  };

  // Add another external member row
  const addMemberField = () => {
    setForm(prev => ({
      ...prev,
      external_members: [...prev.external_members, { username: '', email: '' }],
    }));
  };

  // Remove an external member row
  const removeMemberField = (idx) => {
    setForm(prev => ({
      ...prev,
      external_members: prev.external_members.filter((_, i) => i !== idx),
    }));
  };

  // Handle form submit
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!userId) {
      setError('User not loaded. Please try again.');
      return;
    }
    // Filter out empty member rows
    const members = form.external_members.filter(
      m => m.username.trim() && m.email.trim()
    );
    const payload = {
      name: form.name,
      description: form.description,
      external_members: members,
      created_by: userId,
    };

    console.log('Submitting group payload:', payload);

    try {
      if (isEdit && groupId) {
        await API.put(`groups/${groupId}/`, payload);
      } else {
        await API.post('groups/', payload);
      }
      navigate('/groups');
    } catch (err) {
      setError(
        err.response?.data?.detail ||
        JSON.stringify(err.response?.data) ||
        'Failed to save group. Please check your input.'
      );
    }
  };

  if (loading) return <div>Loading...</div>;

  return (
    <div className="container-fluid">
      <div className="row justify-content-center">
        <div className="col-md-8">
          <div className="card mt-5">
            <div className="card-header">
              <h5 className="mb-0">{isEdit ? 'Edit Group' : 'Create Group'}</h5>
            </div>
            <div className="card-body">
              <form onSubmit={handleSubmit}>
                <div className="mb-3">
                  <label htmlFor="name" className="form-label">Group Name</label>
                  <input
                    type="text"
                    className="form-control"
                    id="name"
                    name="name"
                    value={form.name}
                    onChange={handleChange}
                    required
                  />
                </div>
                <div className="mb-3">
                  <label htmlFor="description" className="form-label">Description</label>
                  <textarea
                    className="form-control"
                    id="description"
                    name="description"
                    rows="3"
                    value={form.description}
                    onChange={handleChange}
                  />
                </div>
                <hr />
                <h6>Members (External)</h6>
                <div id="members-list">
                  {form.external_members.map((member, idx) => (
                    <div className="row mb-2" key={idx}>
                      <div className="col">
                        <input
                          type="text"
                          className="form-control"
                          placeholder="Member Username"
                          value={member.username}
                          onChange={e => handleMemberChange(idx, 'username', e.target.value)}
                        />
                      </div>
                      <div className="col">
                        <input
                          type="email"
                          className="form-control"
                          placeholder="Member Email"
                          value={member.email}
                          onChange={e => handleMemberChange(idx, 'email', e.target.value)}
                        />
                      </div>
                      <div className="col-auto">
                        {form.external_members.length > 1 && (
                          <button
                            type="button"
                            className="btn btn-danger"
                            onClick={() => removeMemberField(idx)}
                          >
                            &times;
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
                <button
                  type="button"
                  onClick={addMemberField}
                  className="btn btn-secondary btn-sm mb-3"
                >
                  Add Another Member
                </button>
                {error && <div className="alert alert-danger">{error}</div>}
                <div className="d-grid">
                  <button type="submit" className="btn" style={{ background: '#198754', color: '#fff' }}>
                    {isEdit ? 'Update' : 'Create'} Group
                  </button>
                </div>
              </form>
              <Link to="/groups" className="btn btn-link mt-3">Cancel</Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default GroupForm;