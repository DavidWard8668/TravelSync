import React, { createContext, useContext, useState } from 'react';

interface BlacklistedApp {
  id: string;
  name: string;
  packageName: string;
  blocked: boolean;
}

interface PendingRequest {
  id: string;
  type: 'install' | 'launch';
  appName: string;
  timestamp: Date;
  status: 'pending' | 'approved' | 'denied';
}

interface AppContextType {
  sidebarOpen: boolean;
  toggleSidebar: () => void;
  blacklistedApps: BlacklistedApp[];
  pendingRequests: PendingRequest[];
  adminEmail: string;
  isSetup: boolean;
  addBlacklistedApp: (app: Omit<BlacklistedApp, 'id'>) => void;
  removeBlacklistedApp: (id: string) => void;
  toggleAppBlock: (id: string) => void;
  addPendingRequest: (request: Omit<PendingRequest, 'id'>) => void;
  updateRequestStatus: (id: string, status: 'approved' | 'denied') => void;
  setAdminEmail: (email: string) => void;
  completeSetup: () => void;
}

const defaultAppContext: AppContextType = {
  sidebarOpen: false,
  toggleSidebar: () => {},
  blacklistedApps: [],
  pendingRequests: [],
  adminEmail: '',
  isSetup: false,
  addBlacklistedApp: () => {},
  removeBlacklistedApp: () => {},
  toggleAppBlock: () => {},
  addPendingRequest: () => {},
  updateRequestStatus: () => {},
  setAdminEmail: () => {},
  completeSetup: () => {},
};

const AppContext = createContext<AppContextType>(defaultAppContext);

export const useAppContext = () => useContext(AppContext);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [blacklistedApps, setBlacklistedApps] = useState<BlacklistedApp[]>([
    { id: '1', name: 'Snapchat', packageName: 'com.snapchat.android', blocked: true },
    { id: '2', name: 'Telegram', packageName: 'org.telegram.messenger', blocked: true },
    { id: '3', name: 'Grindr', packageName: 'com.grindrapp.android', blocked: true },
  ]);
  const [pendingRequests, setPendingRequests] = useState<PendingRequest[]>([]);
  const [adminEmail, setAdminEmailState] = useState('');
  const [isSetup, setIsSetup] = useState(false);

  const toggleSidebar = () => setSidebarOpen(prev => !prev);

  const addBlacklistedApp = (app: Omit<BlacklistedApp, 'id'>) => {
    const newApp = { ...app, id: Date.now().toString() };
    setBlacklistedApps(prev => [...prev, newApp]);
  };

  const removeBlacklistedApp = (id: string) => {
    setBlacklistedApps(prev => prev.filter(app => app.id !== id));
  };

  const toggleAppBlock = (id: string) => {
    setBlacklistedApps(prev => prev.map(app => 
      app.id === id ? { ...app, blocked: !app.blocked } : app
    ));
  };

  const addPendingRequest = (request: Omit<PendingRequest, 'id'>) => {
    const newRequest = { ...request, id: Date.now().toString() };
    setPendingRequests(prev => [...prev, newRequest]);
  };

  const updateRequestStatus = (id: string, status: 'approved' | 'denied') => {
    setPendingRequests(prev => prev.map(req => 
      req.id === id ? { ...req, status } : req
    ));
  };

  const setAdminEmail = (email: string) => setAdminEmailState(email);
  const completeSetup = () => setIsSetup(true);

  return (
    <AppContext.Provider
      value={{
        sidebarOpen,
        toggleSidebar,
        blacklistedApps,
        pendingRequests,
        adminEmail,
        isSetup,
        addBlacklistedApp,
        removeBlacklistedApp,
        toggleAppBlock,
        addPendingRequest,
        updateRequestStatus,
        setAdminEmail,
        completeSetup,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};