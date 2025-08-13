
import React, { useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'sonner';

// Components
import { ThemeProvider } from './components/theme-provider';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { SocketProvider } from './contexts/SocketContext';

// Pages
import LandingPage from './pages/LandingPage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import DashboardPage from './pages/DashboardPage';
import MasterDashboard from './pages/MasterDashboard';
import ClientDashboard from './pages/ClientDashboard';
import CrisisPage from './pages/CrisisPage';
import SelfHelpPage from './pages/SelfHelpPage';
import ProfilePage from './pages/ProfilePage';
import SettingsPage from './pages/SettingsPage';
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";

// Create QueryClient
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 2,
      staleTime: 5 * 60 * 1000, // 5 minutes
      refetchOnWindowFocus: false,
    },
  },
});

/**
 * Main App Component
 */
function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider defaultTheme="light" storageKey="second-chance-theme">
        <Router>
          <AuthProvider>
            <SocketProvider>
              <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
                <AppRoutes />
                <Toaster 
                  position="top-right"
                  richColors
                  closeButton
                  duration={4000}
                />
              </div>
            </SocketProvider>
          </AuthProvider>
        </Router>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

/**
 * App Routes with Authentication Protection
 */
function AppRoutes() {
  return (
    <Routes>
      {/* Current working route */}
      <Route path="/" element={<Index />} />
      
      {/* New Second Chance routes (will be implemented) */}
      <Route path="/landing" element={<LandingPage />} />
      <Route path="/crisis" element={<CrisisPage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route path="/self-help" element={<SelfHelpPage />} />
      <Route path="/dashboard" element={<DashboardPage />} />
      <Route path="/master" element={<MasterDashboard />} />
      <Route path="/client" element={<ClientDashboard />} />
      <Route path="/profile" element={<ProfilePage />} />
      <Route path="/settings" element={<SettingsPage />} />
      
      {/* 404 Route */}
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}

/**
 * Loading Screen Component
 */
function LoadingScreen() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-blue-50">
      <div className="text-center space-y-4">
        {/* Loading spinner */}
        <div className="relative">
          <div className="w-16 h-16 border-4 border-blue-200 rounded-full animate-spin border-t-blue-600"></div>
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-6 h-6 bg-blue-600 rounded-full animate-pulse"></div>
          </div>
        </div>
        
        {/* Loading text */}
        <div className="space-y-2">
          <h2 className="text-xl font-semibold text-slate-700">Second Chance</h2>
          <p className="text-sm text-slate-500">Loading your recovery support...</p>
        </div>
        
        {/* Crisis support always visible */}
        <div className="mt-8 p-4 bg-yellow-50 border border-yellow-200 rounded-lg max-w-sm">
          <h3 className="text-sm font-medium text-yellow-800 mb-2">🆘 Crisis Support</h3>
          <div className="text-xs text-yellow-700 space-y-1">
            <div>Samaritans: <strong>116 123</strong> (24/7)</div>
            <div>Crisis Text: <strong>SHOUT to 85258</strong></div>
            <div>NHS Mental Health: <strong>111 press 2</strong></div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;
