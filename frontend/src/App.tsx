import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import Navbar from './components/Navbar';
import Volunteers from './pages/Volunteers';
import Employees from './pages/Employees';
import Shifts from './pages/Shifts';
import Missions from './pages/Missions';
import Login from './pages/Login';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import { MonthProvider } from './contexts/MonthContext';
import Dashboard from './pages/Dashboard';
import Users from './pages/Users';

function App() {
  return (
<Router>
      <AuthProvider>
        <Routes>
          {/* Public routes */}
          <Route path="/login" element={<Login />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password" element={<ResetPassword />} />

          {/* Protected routes - MonthProvider inside ProtectedRoute */}
          <Route
            path="/*"
            element={
              <ProtectedRoute>
                <MonthProvider>
                  <div className="app">
                    <Navbar />
                    <div className="content">
                      <Routes>
                        <Route path="/dashboard" element={<Dashboard />} />
                        <Route path="/volunteers" element={<Volunteers />} />
                        <Route path="/employees" element={<Employees />} />
                        <Route path="/shifts" element={<Shifts />} />
                        <Route path="/missions" element={<Missions />} />
                        <Route path="/users" element={<Users />} />
                        <Route path="/" element={<Navigate to="/dashboard" />} />
                      </Routes>
                    </div>
                  </div>
                </MonthProvider>
              </ProtectedRoute>
            }
          />
        </Routes>
      </AuthProvider>
    </Router>
  );
}

export default App;