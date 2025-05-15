import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import API from '../api';

function Login({ setToken }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await API.post('token/', { username, password });
      const token = res.data.access;
      setToken(token);
      localStorage.setItem('token', token);
      setError('');
      navigate('/dashboard');
    } catch (err) {
      setError('Invalid username or password');
    }
  };

  return (
    <div className="container d-flex align-items-center justify-content-center min-vh-100">
      <div className="card p-4" style={{ borderRadius: '1rem', maxWidth: 400, width: '100%', background: '#fff' }}>
        <div className="text-center mb-4">
          
          <div className="fw-bold" style={{ color: '#198754', fontSize: '2rem', letterSpacing: '-1px' }}>Welcome</div>
          <div className="text-muted mb-3">Log in to SplitMate to manage your group expenses</div>
        </div>
        <form onSubmit={handleSubmit} autoComplete="off">
          <div className="mb-3">
            <label htmlFor="id_username" className="form-label">Username</label>
            <input
              type="text"
              id="id_username"
              className="form-control bg-white"
              placeholder="Enter your username"
              value={username}
              onChange={e => setUsername(e.target.value)}
              required
              autoFocus
            />
          </div>
          <div className="mb-3">
            <label htmlFor="id_password" className="form-label">Password</label>
            <input
              type="password"
              id="id_password"
              className="form-control bg-white"
              placeholder="Enter your password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
            />
          </div>
          {error && <div className="alert alert-danger py-1">{error}</div>}
          <button
            type="submit"
            className="btn w-100 fw-semibold"
            style={{ borderRadius: '0.75rem', background: '#198754', color: '#fff' }}
          >
            Login
          </button>
        </form>
        <div className="text-center mt-3">
          <span>Don't have an account?</span>
          <Link to="/register" className="fw-semibold" style={{ color: '#198754' }}> Register</Link>
        </div>
      </div>
    </div>
  );
}

export default Login;