import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import API from '../api';

function Settlement() {
  const { groupId } = useParams();
  const [group, setGroup] = useState(null);
  const [settlements, setSettlements] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        // Fetch group details
        const groupRes = await API.get(`groups/${groupId}/`);
        setGroup(groupRes.data);

        // Fetch settlements for this group
        const settlementsRes = await API.get('settlements/', { params: { group: groupId } });
        setSettlements(settlementsRes.data);
      } catch (err) {
        // handle error
      }
      setLoading(false);
    }
    fetchData();
  }, [groupId]);

  // Mark as settled UI feedback
  const markAsSettled = (idx) => {
    setSettlements(prev =>
      prev.map((settlement, i) =>
        i === idx ? { ...settlement, settled: true } : settlement
      )
    );
  };

  if (loading || !group) return <div>Loading...</div>;

  return (
    <div className="container-fluid">
      <div className="row justify-content-center">
        <div className="col-md-8">
          <div className="card">
            <div className="card-header">
              <h5 className="mb-0">Settlement Plan for {group.name}</h5>
            </div>
            <div className="card-body">
              {settlements.length > 0 ? (
                <div className="list-group">
                  {settlements.map((settlement, idx) => (
                    <div className={`list-group-item${settlement.settled ? ' bg-light' : ''}`} key={settlement.id}>
                      <div className="d-flex align-items-center">
                        <div className="flex-grow-1">
                          <h6 className="mb-0">
                            {settlement.from_user.username} needs to pay {settlement.to_user.username}
                          </h6>
                          <p className="mb-0 text-success">₱{parseFloat(settlement.amount).toFixed(2)}</p>
                        </div>
                        <div>
                          <button
                            className={`btn btn-sm ${settlement.settled ? 'btn-success' : 'btn-outline-success'}`}
                            onClick={() => markAsSettled(idx)}
                            disabled={settlement.settled}
                          >
                            <i className="fas fa-check me-1"></i>
                            {settlement.settled ? 'Settled' : 'Mark as Settled'}
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="alert alert-success" role="alert">
                  <i className="fas fa-check-circle me-2"></i>
                  All balances are settled in this group!
                </div>
              )}
            </div>
            <div className="card-footer">
              <Link to={`/groups/${groupId}`} className="btn btn-primary">
                <i className="fas fa-arrow-left me-2"></i>Back to Group
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Settlement;