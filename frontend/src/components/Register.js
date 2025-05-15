import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import API from '../api';

function Register() {
  const [username, setUsername] = useState('');
  const [password1, setPassword1] = useState('');
  const [password2, setPassword2] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [email, setEmail] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    if (password1 !== password2) {
      setError('Passwords do not match');
      return;
    }
    try {
      await API.post('register/', {
        username,
        email,
        password: password1,
      });
      setSuccess('Registration successful! You can now log in.');
      setTimeout(() => navigate('/login'), 1500);
    } catch (err) {
      setError(
        err.response?.data?.detail ||
        err.response?.data?.username?.[0] ||
        err.response?.data?.password?.[0] ||
        'Registration failed'
      );
    }
  };

  return (
    <div className="container d-flex align-items-center justify-content-center min-vh-100">
      <div className="card p-4" style={{ borderRadius: '1rem', maxWidth: 400, width: '100%', background: '#fff' }}>
        <div className="text-center mb-4">
          
          <div className="fw-bold" style={{ color: '#198754', fontSize: '2rem', letterSpacing: '-1px' }}>Create Account</div>
          <div className="text-muted mb-3">Sign up to SplitMate and start tracking group expenses</div>
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
            />
          </div>
          <div className="mb-3">
            <label htmlFor="id_email" className="form-label">Email</label>
            <input
              type="email"
              id="id_email"
              className="form-control bg-white"
              placeholder="Enter your email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
            />
          </div>
          <div className="mb-3">
            <label htmlFor="id_password1" className="form-label">Password</label>
            <input
              type="password"
              id="id_password1"
              className="form-control bg-white"
              placeholder="Enter your password"
              value={password1}
              onChange={e => setPassword1(e.target.value)}
              required
            />
          </div>
          <div className="mb-3">
            <label htmlFor="id_password2" className="form-label">Password confirmation</label>
            <input
              type="password"
              id="id_password2"
              className="form-control bg-white"
              placeholder="Confirm your password"
              value={password2}
              onChange={e => setPassword2(e.target.value)}
              required
            />
          </div>
          {error && <div className="alert alert-danger py-1">{error}</div>}
          {success && <div className="alert alert-success py-1">{success}</div>}
          <button
            type="submit"
            className="btn w-100 fw-semibold"
            style={{ borderRadius: '0.75rem', background: '#198754', color: '#fff' }}
          >
            Register
          </button>
        </form>
        <div className="text-center mt-3">
          <span>Already have an account?</span>
          <Link to="/login" className="fw-semibold" style={{ color: '#198754' }}>Login</Link>
        </div>
      </div>
    </div>
  );
}

export default Register;