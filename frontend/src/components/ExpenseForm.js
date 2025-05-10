import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import API from '../api';

function ExpenseForm({ isEdit = false }) {
  const { groupId, expenseId } = useParams();
  const navigate = useNavigate();

  const [group, setGroup] = useState(null);
  const [form, setForm] = useState({
    description: '',
    amount: '',
    due_date: '',
    split_type: 'EQUAL',
    paid_by: 'none',
    split_with_users: [],
    split_with_external: [],
  });
  const [loading, setLoading] = useState(true);

  // Fetch group and (if editing) expense
  useEffect(() => {
    async function fetchData() {
      try {
        const groupRes = await API.get(`groups/${groupId}/`);
        setGroup(groupRes.data);

        if (isEdit && expenseId) {
          const expenseRes = await API.get(`expenses/${expenseId}/`);
          setExpense(expenseRes.data);

          // Set form values from expense
          setForm({
            description: expenseRes.data.description,
            amount: expenseRes.data.amount,
            due_date: expenseRes.data.due_date || '',
            split_type: expenseRes.data.split_type || 'EQUAL',
            paid_by: expenseRes.data.paid_by_user
              ? `user_${expenseRes.data.paid_by_user}`
              : expenseRes.data.paid_by_external
              ? `ext_${expenseRes.data.paid_by_external}`
              : 'none',
            split_with_users: expenseRes.data.split_with_users || [],
            split_with_external: expenseRes.data.split_with_external || [],
          });
        }
      } catch (err) {
        // handle error
      }
      setLoading(false);
    }
    fetchData();
  }, [groupId, isEdit, expenseId]);

  // Handle form field changes
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    if (name === 'split_with_users' || name === 'split_with_external') {
      setForm((prev) => {
        const arr = new Set(prev[name]);
        if (checked) arr.add(value);
        else arr.delete(value);
        return { ...prev, [name]: Array.from(arr) };
      });
    } else {
      setForm((prev) => ({ ...prev, [name]: value }));
    }
  };

  // Handle form submit
  const handleSubmit = async (e) => {
    e.preventDefault();
    const payload = {
      description: form.description,
      amount: form.amount,
      due_date: form.due_date || null,
      split_type: form.split_type,
      paid_by_user: form.paid_by.startsWith('user_') ? form.paid_by.split('_')[1] : null,
      paid_by_external: form.paid_by.startsWith('ext_') ? form.paid_by.split('_')[1] : null,
      split_with_users: form.split_with_users,
      split_with_external: form.split_with_external,
      group: groupId,
    };
    try {
      if (isEdit && expenseId) {
        await API.put(`expenses/${expenseId}/`, payload);
      } else {
        await API.post('expenses/', payload);
      }
      navigate(`/groups/${groupId}`);
    } catch (err) {
      // handle error
    }
  };

  if (loading || !group) return <div>Loading...</div>;

  return (
    <div className="container mt-4">
      <div className="row justify-content-center">
        <div className="col-md-8">
          <div className="card">
            <div className="card-header">
              <h5 className="mb-0">
                {isEdit ? 'Edit Expense' : `Add New Expense to ${group.name}`}
              </h5>
            </div>
            <div className="card-body">
              <form onSubmit={handleSubmit}>
                <div className="mb-3">
                  <label htmlFor="description" className="form-label">Description</label>
                  <input
                    type="text"
                    name="description"
                    id="description"
                    className="form-control"
                    required
                    value={form.description}
                    onChange={handleChange}
                  />
                </div>
                <div className="mb-3">
                  <label htmlFor="amount" className="form-label">Amount</label>
                  <input
                    type="number"
                    name="amount"
                    id="amount"
                    className="form-control"
                    required
                    step="0.01"
                    value={form.amount}
                    onChange={handleChange}
                  />
                </div>
                <div className="mb-3">
                  <label htmlFor="due_date" className="form-label">Due Date</label>
                  <input
                    type="date"
                    name="due_date"
                    id="due_date"
                    className="form-control"
                    value={form.due_date}
                    onChange={handleChange}
                  />
                </div>
                <div className="mb-3">
                  <label htmlFor="split_type" className="form-label">Split Type</label>
                  <select
                    name="split_type"
                    id="split_type"
                    className="form-control"
                    value={form.split_type}
                    onChange={handleChange}
                  >
                    <option value="EQUAL">Split Equally</option>
                    <option value="CUSTOM">Custom Split</option>
                  </select>
                </div>
                <div className="mb-3">
                  <label htmlFor="paid_by" className="form-label">Paid By</label>
                  <select
                    name="paid_by"
                    id="paid_by"
                    className="form-control"
                    value={form.paid_by}
                    onChange={handleChange}
                  >
                    {group.members.map(user => (
                      <option key={user.id} value={`user_${user.id}`}>{user.username}</option>
                    ))}
                    {group.external_members.map(ext => (
                      <option key={ext.id} value={`ext_${ext.id}`}>{ext.username} ({ext.email})</option>
                    ))}
                    <option value="none">Not yet paid</option>
                  </select>
                </div>
                <div className="mb-3">
                  <label className="form-label">Split With</label><br />
                  {group.members.map(user => (
                    <div className="form-check form-check-inline" key={`user_${user.id}`}>
                      <input
                        className="form-check-input"
                        type="checkbox"
                        name="split_with_users"
                        value={user.id}
                        id={`split_with_user_${user.id}`}
                        checked={form.split_with_users.includes(String(user.id))}
                        onChange={handleChange}
                      />
                      <label className="form-check-label" htmlFor={`split_with_user_${user.id}`}>{user.username}</label>
                    </div>
                  ))}
                  {group.external_members.map(ext => (
                    <div className="form-check form-check-inline" key={`ext_${ext.id}`}>
                      <input
                        className="form-check-input"
                        type="checkbox"
                        name="split_with_external"
                        value={ext.id}
                        id={`split_with_external_${ext.id}`}
                        checked={form.split_with_external.includes(String(ext.id))}
                        onChange={handleChange}
                      />
                      <label className="form-check-label" htmlFor={`split_with_external_${ext.id}`}>{ext.username} ({ext.email})</label>
                    </div>
                  ))}
                </div>
                <button type="submit" className="btn btn-primary w-100">
                  {isEdit ? 'Update Expense' : 'Add Expense'}
                </button>
              </form>
              <Link to={`/groups/${groupId}`} className="btn btn-secondary w-100 mt-2">Cancel</Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ExpenseForm;