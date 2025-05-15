import React from 'react';
import { Link, Outlet, useLocation } from 'react-router-dom';

// You can import your logo image like this if it's in your public or src folder
// import logo from '../assets/splitmate_logo_horizontal.png';

function Layout({ hideSidebar = false, user, onLogout, messages = [] }) {
  const location = useLocation();

  // Helper to determine active nav link
  const isActive = (path) => location.pathname === path || (path === '/groups' && location.pathname.startsWith('/groups'));

  return (
    <div className="container-fluid">
      <div className="row">
        {!hideSidebar && user && user.is_authenticated ? (
          <>
            <div className="col-md-2 d-none d-md-flex flex-column align-items-stretch bg-white shadow-sm p-0" style={{ minHeight: '100vh', borderRadius: '1rem' }}>
              <div className="d-flex flex-column align-items-center py-4 border-bottom">
                <span style={{ fontWeight: 'bold', fontSize: '2rem', color: '#2d7a46', marginBottom: '1rem', letterSpacing: '2px' }}>
                  SplitMate
                </span>
              </div>
              <nav className="nav flex-column mt-3">
                <Link className={`nav-link d-flex align-items-center px-4 py-3${isActive('/dashboard') ? ' active fw-bold bg-splitmate-green text-white' : ' text-splitmate-green'}`} to="/dashboard">
                  <i className="fas fa-home me-2"></i> Dashboard
                </Link>
                <Link className={`nav-link d-flex align-items-center px-4 py-3${isActive('/groups') ? ' active fw-bold bg-splitmate-green text-white' : ' text-splitmate-green'}`} to="/groups">
                  <i className="fas fa-users me-2"></i> Groups
                </Link>
                <Link className={`nav-link d-flex align-items-center px-4 py-3${isActive('/profile') ? ' active fw-bold bg-splitmate-green text-white' : ' text-splitmate-green'}`} to="/profile">
                  <i className="fas fa-user me-2"></i> Profile
                </Link>
                <button
                  className="btn nav-link d-flex align-items-center px-4 py-3 text-splitmate-green"
                  style={{ background: 'none', border: 'none', textAlign: 'left' }}
                  onClick={onLogout}
                >
                  <i className="fas fa-sign-out-alt me-2"></i> Logout
                </button>
              </nav>
            </div>
            <div className="col-md-10 main-content" style={{ padding: 20 }}>
              {/* Messages */}
              {messages.length > 0 && (
                <div className="messages">
                  {messages.map((msg, idx) => (
                    <div key={idx} className={`alert alert-${msg.type} alert-dismissible fade show`} role="alert">
                      {msg.text}
                      <button type="button" className="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
                    </div>
                  ))}
                </div>
              )}
              <Outlet />
            </div>
          </>
        ) : (
          <div className="col-12 main-content" style={{ padding: 20 }}>
            {/* Messages */}
            {messages.length > 0 && (
              <div className="messages">
                {messages.map((msg, idx) => (
                  <div key={idx} className={`alert alert-${msg.type} alert-dismissible fade show`} role="alert">
                    {msg.text}
                    <button type="button" className="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
                  </div>
                ))}
              </div>
            )}
            <Outlet />
          </div>
        )}
      </div>
    </div>
  );
}

export default Layout;