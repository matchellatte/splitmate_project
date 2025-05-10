import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import API from '../api';

function Dashboard() {
  const [groups, setGroups] = useState([]);
  const [recentExpenses, setRecentExpenses] = useState([]);
  const [balances, setBalances] = useState({});
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState(null);
  const [groupBalances, setGroupBalances] = useState({});

  // Fetch groups, expenses, and balances
  useEffect(() => {
    async function fetchData() {
      try {
        // Fetch current user
        const userRes = await API.get('profile/');
        const currentUserId = userRes.data.id;
  
        // Fetch all groups
        const groupsRes = await API.get('groups/');
        // Filter to only groups created by the current user
        const myGroups = groupsRes.data.filter(group => group.created_by === currentUserId);
  
        setGroups(myGroups);
  
        // Fetch expenses from user's own groups
        let allExpenses = [];
        for (const group of myGroups) {
          const groupDetailRes = await API.get(`groups/${group.id}/`);
          if (groupDetailRes.data.expenses) {
            allExpenses = allExpenses.concat(
              groupDetailRes.data.expenses.map(e => ({
                ...e,
                group_name: group.name
              }))
            );
          }
        }
        // Sort and take 5 most recent
        const sortedExpenses = allExpenses
          .sort((a, b) => new Date(b.date) - new Date(a.date))
          .slice(0, 5);
        setRecentExpenses(sortedExpenses);
  
        // Fetch balances for each group (only for the logged-in user)
        const balancesObj = {};
        for (const group of myGroups) {
          const balancesRes = await API.get(`groups/${group.id}/balances/`);
          const myBalance = balancesRes.data.find(b => b.id === currentUserId);
          if (myBalance) {
            balancesObj[group.id] = myBalance;
          }
        }
        setGroupBalances(balancesObj);
  
      } catch (err) {
        // handle error
      }
      setLoading(false);
    }
    fetchData();
  }, []);

  // Calculate total balance
  const totalBalance = Object.values(groupBalances).reduce(
    (sum, bal) => sum + (bal ? bal.total_owed : 0),
    0
  );

  if (loading) return <div>Loading...</div>;

  return (
    <div className="container-fluid">
      <h2 className="mb-4">Dashboard</h2>
      <div className="row">
        {/* Summary Cards */}
        <div className="col-md-4 mb-4">
          <div className="card h-100">
            <div className="card-body">
              <h5 className="card-title">Your Groups</h5>
              <h2 className="card-text">{groups.length}</h2>
              <Link to="/groups" className="btn w-100 fw-semibold" style={{ background: '#198754', color: '#fff', borderRadius: '0.5rem' }}>
                View All Groups
              </Link>
            </div>
          </div>
        </div>
        <div className="col-md-4 mb-4">
          <div className="card h-100">
            <div className="card-body">
              <h5 className="card-title">Total Balance</h5>
              <h2 className="card-text">₱{totalBalance.toFixed(2)}</h2>
            </div>
          </div>
        </div>
        <div className="col-md-4 mb-4">
          <div className="card h-100">
            <div className="card-body">
              <h5 className="card-title">Quick Actions</h5>
              <Link to="/groups/create" className="btn w-100 fw-semibold" style={{ background: '#198754', color: '#fff', borderRadius: '0.5rem' }}>
                Create New Group
              </Link>
            </div>
          </div>
        </div>
      </div>

      <div className="row">
        {/* Recent Expenses */}
        <div className="col-md-8 mb-4">
          <div className="card">
            <div className="card-header">
              <h5 className="mb-0">Recent Expenses</h5>
            </div>
            <div className="card-body">
              {recentExpenses.length > 0 ? (
                <div className="list-group">
                  {recentExpenses.map(expense => (
                    <div className="list-group-item" key={expense.id}>
                      <div className="d-flex w-100 justify-content-between">
                        <h6 className="mb-1">{expense.description}</h6>
                        <small className="text-muted">{new Date(expense.date).toLocaleDateString(undefined, { month: 'short', day: '2-digit', year: 'numeric' })}</small>
                      </div>
                      <p className="mb-1">₱{parseFloat(expense.amount).toFixed(2)}</p>
                      <small className="text-muted">
                        Paid by{' '}
                        {expense.paid_by_user_username || expense.paid_by_user || expense.paid_by_external_username || 'Not paid yet'}
                        {' '}in {expense.group_name || 'Group'}
                      </small>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-muted">No recent expenses</p>
              )}
            </div>
          </div>
        </div>

        {/* Balances */}
        <div className="col-md-4 mb-4">
          <div className="card">
            <div className="card-header">
              <h5 className="mb-0">Outstanding Balances</h5>
            </div>
            <div className="card-body">
              {groups.length === 0 ? (
                <p className="text-muted">No outstanding balances</p>
              ) : (
                <ul className="list-group">
                  {groups.map(group => {
                    const balance = groupBalances[group.id];
                    return (
                      <li className="list-group-item d-flex justify-content-between align-items-center" key={group.id}>
                        <div>
                          <strong>{group.name}:</strong>{" "}
                          {balance
                            ? balance.total_owed > 0
                              ? <span className="text-danger">You owe ₱{balance.total_owed.toFixed(2)}</span>
                              : balance.total_owed < 0
                              ? <span className="text-success">You are owed ₱{Math.abs(balance.total_owed).toFixed(2)}</span>
                              : <span>Settled</span>
                            : <span>No balance</span>
                          }
                        </div>
                        <Link to={`/groups/${group.id}`} className="btn btn-link btn-sm p-0 ms-2">
                          See details
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Dashboard;