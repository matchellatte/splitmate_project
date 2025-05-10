import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import Login from './components/Login';
import Register from './components/Register';
import Dashboard from './components/Dashboard';
import GroupList from './components/GroupList';
import GroupDetail from './components/GroupDetail';
import ExpenseForm from './components/ExpenseForm';
import Settlement from './components/Settlement';
import Profile from './components/Profile';
import GroupForm from './components/GroupForm';

// import NotFound from './components/NotFound'; // Optional: 404 page

function App() {
  // Keep token in state and localStorage
  const [token, setToken] = useState(localStorage.getItem('token'));

  // Logout handler
  const handleLogout = () => {
    setToken(null);
    localStorage.removeItem('token');
    window.location.href = '/login';
  };

  // If not authenticated, only allow login/register
  return (
    <Router>
      <Routes>
        <Route path="/login" element={<Login setToken={setToken} />} />
        <Route path="/register" element={<Register />} />
        <Route
          path="/"
          element={
            token ? (
              <Layout onLogout={handleLogout} user={{ is_authenticated: !!token }} />
            ) : (
              <Navigate to="/login" />
            )
          }
        >
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="groups" element={<GroupList />} />
          <Route path="groups/:groupId" element={<GroupDetail />} />
          <Route path="groups/:groupId/expenses/create" element={<ExpenseForm />} />
          <Route path="/groups/:groupId/expenses/:expenseId/edit" element={<ExpenseForm isEdit={true} />} />
          <Route path="groups/:groupId/settlement" element={<Settlement />} />
          <Route path="profile" element={<Profile />} />
          <Route path="/groups/create" element={<GroupForm isEdit={false} />} />
          <Route path="/groups/:groupId/edit" element={<GroupForm isEdit={true} />} />
          {/* Add more nested routes here as needed */}
        </Route>
        {/* Optional: 404 Not Found route */}
        {/* <Route path="*" element={<NotFound />} /> */}
      </Routes>
    </Router>
  );
}

export default App;