import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import API from '../api';

function GroupList() {
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(true);


  useEffect(() => {
    async function fetchGroups() {
      try {
        // Fetch current user
        const userRes = await API.get('profile/');
        const currentUserId = userRes.data.id;
  
        // Fetch all groups
        const groupsRes = await API.get('groups/');
        // Filter to only groups created by the current user
        const myGroups = groupsRes.data.filter(group => group.created_by === currentUserId);
  
        setGroups(myGroups);
      } catch (err) {
        // handle error
      }
      setLoading(false);
    }
    fetchGroups();
  }, []);

  const handleDeleteGroup = async (groupId) => {
    if (window.confirm("Are you sure you want to delete this group? This action cannot be undone.")) {
      try {
        await API.delete(`/groups/${groupId}/`);
        setGroups(groups.filter(g => g.id !== groupId));
      } catch (err) {
        alert("Failed to delete group.");
      }
    }
  };

  if (loading) return <div>Loading...</div>;

  return (
    <div className="container-fluid">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2>Your Groups</h2>
        <Link to="/groups/create" className="btn" style={{ background: '#198754', color: '#fff' }}>
          <i className="fas fa-plus me-2"></i>Create New Group
        </Link>
      </div>

      <div className="row">
        {groups.length > 0 ? (
          groups.map(group => (
            <div className="col-md-4 mb-4" key={group.id}>
              <div className="card h-100">
                <div className="card-body">
                  <h5 className="card-title">{group.name}</h5>
                  <p className="card-text text-muted">
                    {group.description && group.description.split(' ').length > 20
                      ? group.description.split(' ').slice(0, 20).join(' ') + '...'
                      : group.description}
                  </p>
                  <p className="card-text">
                    <small className="text-muted">
                      <i className="fas fa-users me-1"></i>
                      {(group.members?.length || 0) + (group.external_members?.length || 0)} members
                    </small>
                  </p>
                  <div className="mt-3">
                    <Link to={`/groups/${group.id}`} className="btn btn-outline-primary me-2">
                      View Details
                    </Link>
                    <Link to={`/groups/${group.id}/expenses/create`} className="btn btn-outline-success">
                      Add Expense
                    </Link>
                    {group.is_admin && (
                      <button
                        className="btn btn-danger ms-2"
                        onClick={() => handleDeleteGroup(group.id)}
                      >
                        <i className="fas fa-trash me-2"></i>Delete Group
                      </button>
                    )}
                  </div>
                </div>
                <div className="card-footer text-muted">
                  Created {new Date(group.created_at).toLocaleDateString(undefined, { month: 'short', day: '2-digit', year: 'numeric' })}
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="col-12">
            <div className="alert alert-info" role="alert">
              <i className="fas fa-info-circle me-2"></i>
              You haven't joined any groups yet. Create a new group to get started!
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default GroupList;