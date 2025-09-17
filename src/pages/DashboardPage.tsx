import React from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Navigate } from 'react-router-dom';
import MasterDashboard from './MasterDashboard';
import ClientDashboard from './ClientDashboard';

const DashboardPage: React.FC = () => {
  const { user, isAuthenticated } = useAuth();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (user?.role === 'master') {
    return <MasterDashboard />;
  } else {
    return <ClientDashboard />;
  }
};

export default DashboardPage;