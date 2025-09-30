import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Login from './pages/Login';
import Register from './pages/Register';
import CustomerDashboard from './pages/CustomerDashboard';
import Shop from './pages/Shop';
import ManagerDashboard from './pages/ManagerDashboard';
import './App.css';

function App() {
  return (
    <Router>
      <div className="App">
        <Routes>
          <Route path="/" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/dashboard" element={<CustomerDashboard />} />
          <Route path="/shop" element={<Shop />} />
          <Route path="/manager-dashboard" element={<ManagerDashboard />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;