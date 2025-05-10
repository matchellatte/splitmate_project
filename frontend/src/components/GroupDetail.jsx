import React, { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import API from '../api';

function GroupDetail() {
  const { groupId } = useParams();
  const navigate = useNavigate();
  const [group, setGroup] = useState(null);
  const [expenses, setExpenses] = useState([]);
  const [memberBalances, setMemberBalances] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sendingReminder, setSendingReminder] = useState(false);

  // For modals
  const [showRemindModal, setShowRemindModal] = useState(false);
  const [remindMember, setRemindMember] = useState(null);
  const [remindMessage, setRemindMessage] = useState('');
  const [remindPreview, setRemindPreview] = useState('');
  const [showOwedModal, setShowOwedModal] = useState(false);
  const [modalOwedMember, setModalOwedMember] = useState(null);
  const [showSettleModal, setShowSettleModal] = useState(false);
  const [settleMember, setSettleMember] = useState(null);
  const [settleAmount, setSettleAmount] = useState('');
  const [settleError, setSettleError] = useState('');


  const openOwedModal = (member) => {
    setModalOwedMember(member);
    setShowOwedModal(true);
  };

  const openSettleModal = (member) => {
    setSettleMember({
      ...member,
      type: member.type
    });
    setSettleAmount('');
    setSettleError('');
    setShowSettleModal(true);
  };

  useEffect(() => {
    async function fetchData() {
      try {
        // Fetch group details
        const groupRes = await API.get(`groups/${groupId}/`);
        // Ensure arrays are always defined
        setGroup({
          ...groupRes.data,
          members: groupRes.data.members || [],
          external_members: groupRes.data.external_members || [],
          expenses: groupRes.data.expenses || [],
        });

        // Fetch member balances (custom endpoint or calculate)
        const balancesRes = await API.get(`groups/${groupId}/balances/`);
        setMemberBalances(balancesRes.data);

        // Fetch user profile
        const userRes = await API.get('/profile/');
        

      } catch (err) {
        // Handle error, e.g., redirect to login or show a message
      }
      setLoading(false);
    }
    fetchData();
  }, [groupId]);

  // Handle reminder modal
  const openRemindModal = (member) => {
    setRemindMember(member);
    setRemindMessage('');
    setRemindPreview(getEmailPreview(member, '', group));
    setShowRemindModal(true);
  };

  const handleRemindMessageChange = (e) => {
    const msg = e.target.value;
    setRemindMessage(msg);
    setRemindPreview(getEmailPreview(remindMember, msg, group));
  };

  const getEmailPreview = (member, msg, group) => {
    let base = `Hi ${member.name}, this is a reminder from SplitMate to settle your balances in the group '${group?.name}'.\n\n`;
    if (msg.trim() !== '') {
      base += `Message from you: ${msg}\n\n`;
    }
    if (member.owed_expenses && member.owed_expenses.length > 0) {
      base += 'Outstanding Balances:\n';
      member.owed_expenses.forEach(exp => {
        const due = exp.due_date ? ` (Due: ${new Date(exp.due_date).toLocaleDateString()})` : '';
        base += `- ₱${parseFloat(exp.amount).toFixed(2)} for ${exp.description}${due}\n`;
      });
      const total = member.owed_expenses.reduce((sum, exp) => sum + parseFloat(exp.amount), 0);
      base += `\nTotal: ₱${total.toFixed(2)}\n\n`;
    }
    base += 'Please log in or contact the group admin for details.';
    return base;
  };

  const sendReminder = async () => {
    setSendingReminder(true); // <-- start loader
    try {
      await API.post(
        `groups/${groupId}/remind/${remindMember.type}/${remindMember.id}/`,
        {
          message: remindMessage,
          owed_expenses: remindMember.owed_expenses, // <-- send this!
        }
      );
      setShowRemindModal(false);
    } finally {
      setSendingReminder(false); // <-- stop loader
    }
  };

  const handleDelete = async (expenseId) => {
    if (window.confirm("Are you sure you want to delete this expense?")) {
      try {
        await API.delete(`/expenses/${expenseId}/`);
        setExpenses(expenses.filter(e => e.id !== expenseId));
      } catch (err) {
        alert("Failed to delete expense.");
      }
    }
  };

  if (loading || !group) return <div>Loading...</div>;

  return (
    <div className="container-fluid">
      {/* Group Header */}
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h2>{group.name}</h2>
          <p className="text-muted">{group.description}</p>
        </div>
        <div>
          <Link to={`/groups/${groupId}/expenses/create`} className="btn btn-success me-2">
            <i className="fas fa-plus me-2"></i>Add Expense
          </Link>
          <Link to={`/groups/${groupId}/edit`} className="btn btn-warning me-2">
            <i className="fas fa-edit me-2"></i>Edit Group
          </Link>
          <button
            className="btn btn-danger"
            onClick={async () => {
              if (window.confirm('Are you sure you want to delete this group? This action cannot be undone.')) {
                try {
                  await API.delete(`/groups/${groupId}/`);
                  navigate('/groups');
                } catch (err) {
                  alert('Failed to delete group.');
                }
              }
            }}
          >
            <i className="fas fa-trash me-2"></i>Delete Group
          </button>
        </div>
      </div>

      <div className="row">
        {/* Members Section */}
        <div className="col-md-4 mb-4">
          <div className="card">
            <div className="card-header">
              <h5 className="mb-0">Members</h5>
            </div>
            <div className="card-body p-0">
              {(group.members.length > 0 || group.external_members.length > 0) ? (
                <table className="table mb-0">
                  <tbody>
                    {group.members.map(member => (
                      <tr key={`user_${member.id}`}>
                        <td>
                          {member.username}
                          {member.is_admin && <span className="badge bg-success ms-2">Admin</span>}
                        </td>
                        <td>
                          {member.email && <span className="text-muted">({member.email})</span>}
                        </td>
                        <td>
                          <span className="badge bg-secondary">Registered</span>
                        </td>
                      </tr>
                    ))}
                    {group.external_members.map(ext => (
                      <tr key={`ext_${ext.id}`}>
                        <td>{ext.username}</td>
                        <td className="text-muted">({ext.email})</td>
                        <td>
                          <span className="badge bg-secondary">External</span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <div className="p-3 text-muted">No members yet.</div>
              )}
            </div>
          </div>
        </div>

        {/* Expenses Section */}
        <div className="col-md-8 mb-4">
          <div className="card">
            <div className="card-header">
              <h5 className="mb-0">Expenses</h5>
            </div>
            <div className="card-body">
              {group.expenses.length > 0 ? (
                <div className="list-group">
                  {group.expenses.map(expense => {
                    // Get payer name
                    let payer = '';
                    if (expense.paid_by_user) {
                      payer = group.members.find(m => m.id === expense.paid_by_user)?.username || 'Registered Member';
                    } else if (expense.paid_by_external) {
                      payer = group.external_members.find(e => e.id === expense.paid_by_external)?.username || 'External Member';
                    }

                    // Get split between names
                    const splitUsernames = [
                      ...(expense.split_with_users || []).map(uid =>
                        group.members.find(m => m.id === (typeof uid === 'number' ? uid : parseInt(uid)))?.username
                      ),
                      ...(expense.split_with_external || []).map(eid =>
                        group.external_members.find(e => e.id === (typeof eid === 'number' ? eid : parseInt(eid)))?.username
                      ),
                    ].filter(Boolean);

                    return (
                      <div className="list-group-item" key={expense.id}>
                        <div className="d-flex w-100 justify-content-between">
                          <div>
                            <h6 className="mb-1">{expense.description}</h6>
                            <small className="text-muted">
                              {payer ? `Paid by: ${payer}` : 'Not Yet Paid'}
                            </small>
                            {/* Split between */}
                            <div className="text-muted small">
                              Split between: {splitUsernames.join(', ')}
                            </div>
                          </div>
                          <div className="text-end">
                            <Link
                              to={`/groups/${groupId}/expenses/${expense.id}/edit`}
                              className="btn btn-sm btn-link text-warning"
                              title="Edit"
                            >
                              <i className="fas fa-edit"></i>
                            </Link>
                            <button
                              className="btn btn-sm btn-link text-danger"
                              title="Delete"
                              onClick={() => handleDelete(expense.id)}
                              style={{ verticalAlign: 'middle' }}
                            >
                              <i className="fas fa-trash"></i>
                            </button>
                            <h6 className="mb-1">₱{parseFloat(expense.amount).toFixed(2)}</h6>
                            <small className="text-muted">{new Date(expense.date).toLocaleDateString()}</small>
                          </div>
                        </div>
                        <div className="mt-2">
                          {expense.due_date && (
                            <span className="badge bg-warning text-dark ms-2">
                              Due: {new Date(expense.due_date).toLocaleDateString()}
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="p-3 text-muted">No expenses recorded yet.</div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Balances Section */}
      <div className="row">
        <div className="col-12">
          <h5>Current Balances</h5>
          <div className="row">
            {memberBalances.map(member => (
              <div className="col-md-4 mb-3" key={member.id}>
                <div className="card mb-3">
                  <div className="card-header d-flex justify-content-between align-items-center">
                    <span>
                      <strong>{member.name}</strong>
                      {member.email && <> ({member.email})</>}
                    </span>
                    <button
                      type="button"
                      className="btn btn-sm btn-light"
                      title="Remind"
                      onClick={() => openRemindModal(member)}
                    >
                      <i className="fas fa-bell"></i>
                    </button>
                  </div>
                  <div className="card-body d-flex flex-column" style={{ minHeight: 150 }}>
                    <span>
                      Owes{' '}
                      <span className={member.total_owed > 0 ? 'text-success' : member.total_owed < 0 ? 'text-danger' : ''}>
                        ₱{parseFloat(member.total_owed).toFixed(2)}
                      </span>
                    </span>
                    {member.settled > 0 && (
                      <div className="text-danger small mb-1">
                        - ₱{parseFloat(member.settled).toFixed(2)} (Settled)
                      </div>
                    )}
                    {/* Owed expenses breakdown */}
                    {member.owed_expenses.slice(0, 2).map((exp, idx) => (
                      <div className="text-secondary small" key={idx}>
                        + ₱{parseFloat(exp.amount).toFixed(2)} ({exp.description})
                      </div>
                    ))}
                    {member.owed_expenses.length > 2 && (
                      <button
                        className="btn btn-link btn-sm p-0 ms-1"
                        style={{ verticalAlign: 'baseline' }}
                        onClick={() => openOwedModal(member)}
                      >
                        See more
                      </button>
                    )}
                    <button className="btn btn-success btn-sm mt-2"
                            onClick={() => openSettleModal(member)}>
                      Settle
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
        {/*Owe Modal */}
        {showOwedModal && modalOwedMember && (
        <div className="modal show d-block" tabIndex="-1" role="dialog">
          <div className="modal-dialog">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">
                  Owed Expenses for {modalOwedMember.name}
                </h5>
                <button
                  type="button"
                  className="btn-close"
                  onClick={() => setShowOwedModal(false)}
                ></button>
              </div>
              <div className="modal-body">
                {modalOwedMember.owed_expenses.length === 0 ? (
                  <div className="text-muted">No owed expenses.</div>
                ) : (
                  <ul className="list-group">
                    {modalOwedMember.owed_expenses.map((exp, idx) => (
                      <li className="list-group-item d-flex justify-content-between align-items-center" key={idx}>
                        <span>{exp.description}</span>
                        <span>₱{parseFloat(exp.amount).toFixed(2)}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setShowOwedModal(false)}
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Reminder Modal */}
      {showRemindModal && remindMember && (
        <>
          {/* Modal Overlay */}
          <div
            style={{
              position: 'fixed',
              top: 0, left: 0, right: 0, bottom: 0,
              background: 'rgba(0,0,0,0.2)',
              zIndex: 1040
            }}
          />
          <div className="modal show d-block" tabIndex="-1" role="dialog" style={{ zIndex: 1050 }}>
            <div className="modal-dialog">
              <div className="modal-content">
                <div className="modal-header">
                  <h5 className="modal-title">Send Reminder to {remindMember.name}</h5>
                  <button type="button" className="btn-close" onClick={() => setShowRemindModal(false)}></button>
                </div>
                <div className="modal-body">
                  <textarea
                    className="form-control"
                    rows={3}
                    placeholder="Optional message..."
                    value={remindMessage}
                    onChange={handleRemindMessageChange}
                  />
                  <div className="mt-3">
                    <label className="form-label"><strong>Outstanding Balances:</strong></label>
                    {remindMember.owed_expenses && remindMember.owed_expenses.length > 0 ? (
                      <ul className="list-group mb-2">
                        {remindMember.owed_expenses.map((exp, idx) => (
                          <li className="list-group-item py-1 px-2" key={idx}>
                            <span>{exp.description}</span>
                            <span className="float-end">₱{parseFloat(exp.amount).toFixed(2)}</span>
                          </li>
                        ))}
                        <li className="list-group-item py-1 px-2 fw-bold">
                          Total
                          <span className="float-end">
                            ₱{remindMember.owed_expenses.reduce((sum, exp) => sum + parseFloat(exp.amount), 0).toFixed(2)}
                          </span>
                        </li>
                      </ul>
                    ) : (
                      <div className="text-muted">No outstanding balances.</div>
                    )}
                  </div>
                  <div className="mt-3">
                    <label className="form-label"><strong>Email Preview:</strong></label>
                    <div className="border rounded p-2 bg-light" style={{ whiteSpace: 'pre-line' }}>
                      {remindPreview}
                    </div>
                  </div>
                </div>
                <div className="modal-footer">
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={() => setShowRemindModal(false)}
                    disabled={sendingReminder}
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    className="btn btn-success"
                    onClick={sendReminder}
                    disabled={sendingReminder}
                  >
                    {sendingReminder ? (
                      <>
                        <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                        Sending...
                      </>
                    ) : (
                      "Send"
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Add Settle Modal */}
      {showSettleModal && settleMember && (
      <>
      {/* Modal Overlay */}
      <div
        style={{
          position: 'fixed',
          top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0,0,0,0.2)',
          zIndex: 1040
        }}
      />
      <div className="modal show d-block" tabIndex="-1" role="dialog">
        <div className="modal-dialog">
          <div className="modal-content">
            <div className="modal-header">
              <h5 className="modal-title">
                Settle Balance for {settleMember.name}
              </h5>
              <button
                type="button"
                className="btn-close"
                onClick={() => setShowSettleModal(false)}
              ></button>
            </div>
            <div className="modal-body">
              <div className="mb-3">
                <label className="form-label">Amount Settled (₱)</label>
                <input
                  type="number"
                  className="form-control"
                  min="1"
                  max={settleMember.total_owed}
                  value={settleAmount}
                  onChange={e => setSettleAmount(e.target.value)}
                  placeholder="Enter amount"
                />
                {settleError && (
                  <div className="text-danger mt-2">{settleError}</div>
                )}
              </div>
            </div>
            <div className="modal-footer">
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => setShowSettleModal(false)}
              >
                Cancel
              </button>
              <button
                type="button"
                className="btn btn-success"
                onClick={async () => {
                  // Validation
                  const amount = parseFloat(settleAmount);
                  if (isNaN(amount) || amount <= 0) {
                    setSettleError('Please enter a valid amount.');
                    return;
                  }
                  if (amount > settleMember.total_owed) {
                    setSettleError('Amount exceeds total owed.');
                    return;
                  }
                  // Call your API to record the settlement
                  try {
                    await API.post(
                      `/groups/${groupId}/settle/${settleMember.type}/${settleMember.id}/`,
                      { amount: amount }
                    );
                    setShowSettleModal(false);
                    // Optionally, refetch balances
                    const balancesRes = await API.get(`groups/${groupId}/balances/`);
                    setMemberBalances(balancesRes.data);
                  } catch (err) {
                    setSettleError('Failed to settle. Please try again.');
                  }
                }}
              >
                Settle
              </button>
            </div>
          </div>
        </div>
      </div>
      </>
    )}
    </div>
  );
}

export default GroupDetail;