import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import io, { Socket } from 'socket.io-client';
import { toast } from 'sonner';
import { useAuth } from './AuthContext';

interface SocketContextType {
  socket: Socket | null;
  isConnected: boolean;
  sendMessage: (event: string, data: any) => void;
  notifications: Notification[];
  clearNotifications: () => void;
}

interface Notification {
  id: string;
  type: string;
  title: string;
  message: string;
  timestamp: string;
  urgent?: boolean;
  data?: any;
}

const SocketContext = createContext<SocketContextType | undefined>(undefined);

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:3001';

export function SocketProvider({ children }: { children: ReactNode }) {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const { user, token } = useAuth();

  // Initialize socket connection when user is authenticated
  useEffect(() => {
    if (user && token) {
      console.log('🔗 Initializing socket connection...');
      
      const newSocket = io(SOCKET_URL, {
        auth: {
          token: token
        },
        transports: ['websocket'],
        upgrade: true,
        timeout: 10000,
      });

      // Connection event handlers
      newSocket.on('connect', () => {
        console.log('✅ Socket connected:', newSocket.id);
        setIsConnected(true);
        toast.success('Connected to real-time notifications');
      });

      newSocket.on('disconnect', (reason) => {
        console.log('❌ Socket disconnected:', reason);
        setIsConnected(false);
        if (reason === 'io server disconnect') {
          // Reconnect if server disconnected the client
          newSocket.connect();
        }
      });

      newSocket.on('connect_error', (error) => {
        console.error('Socket connection error:', error);
        setIsConnected(false);
        toast.error('Connection failed', {
          description: 'Unable to connect to real-time notifications'
        });
      });

      // Recovery-specific event handlers
      setupRecoveryEventHandlers(newSocket);

      setSocket(newSocket);

      // Cleanup on unmount or user change
      return () => {
        console.log('🔌 Disconnecting socket...');
        newSocket.disconnect();
        setSocket(null);
        setIsConnected(false);
      };
    }
  }, [user, token]);

  const setupRecoveryEventHandlers = (socket: Socket) => {
    // App monitoring events (for Masters)
    socket.on('app_alert', (data) => {
      const notification: Notification = {
        id: Date.now().toString(),
        type: 'app_alert',
        title: `App Installed: ${data.app_name}`,
        message: `${data.client_name} has installed ${data.app_name}`,
        timestamp: data.timestamp,
        urgent: true,
        data
      };

      setNotifications(prev => [notification, ...prev]);
      
      toast.error(`🚨 ${notification.title}`, {
        description: notification.message,
        action: {
          label: 'Review',
          onClick: () => {
            // Navigate to approval screen
            window.location.href = '/master#approvals';
          }
        },
        duration: 10000
      });
    });

    socket.on('usage_request', (data) => {
      const notification: Notification = {
        id: data.request_id,
        type: 'usage_request',
        title: `App Access Request: ${data.app_name}`,
        message: `${data.client_name} wants to use ${data.app_name}`,
        timestamp: data.timestamp,
        urgent: true,
        data
      };

      setNotifications(prev => [notification, ...prev]);
      
      toast.warning(`📱 ${notification.title}`, {
        description: notification.message,
        action: {
          label: 'Approve/Deny',
          onClick: () => {
            window.location.href = `/master#request-${data.request_id}`;
          }
        },
        duration: 15000
      });
    });

    // Crisis events (for Masters)
    socket.on('crisis_alert', (data) => {
      const notification: Notification = {
        id: Date.now().toString(),
        type: 'crisis_alert',
        title: `🆘 CRISIS ALERT: ${data.client_name}`,
        message: data.reason || 'Crisis mode activated - immediate support needed',
        timestamp: data.timestamp,
        urgent: true,
        data
      };

      setNotifications(prev => [notification, ...prev]);
      
      toast.error(`🆘 CRISIS: ${data.client_name}`, {
        description: 'Crisis mode activated - please contact immediately',
        action: {
          label: 'Call Now',
          onClick: () => {
            // Trigger emergency contact flow
            window.location.href = '/master#crisis';
          }
        },
        duration: 0, // Don't auto-dismiss crisis alerts
      });

      // Also show browser notification if permission granted
      if (Notification.permission === 'granted') {
        new Notification(`🆘 CRISIS: ${data.client_name}`, {
          body: 'Crisis mode activated - immediate support needed',
          icon: '/icon-192x192.png',
          requireInteraction: true
        });
      }
    });

    // Client status updates (for Masters)
    socket.on('client_status', (data) => {
      if (data.type === 'client_online') {
        toast.success(`${data.client_name} is online`);
      } else if (data.type === 'client_offline') {
        toast.info(`${data.client_name} went offline`);
      }
    });

    // Request decisions (for Clients)
    socket.on('request_decision', (data) => {
      const notification: Notification = {
        id: data.request_id,
        type: 'request_decision',
        title: `Request ${data.approved ? 'Approved' : 'Denied'}: ${data.app_name}`,
        message: data.master_response || (data.approved ? 'You may now use this app' : 'Access denied by your support person'),
        timestamp: data.timestamp,
        data
      };

      setNotifications(prev => [notification, ...prev]);

      if (data.approved) {
        toast.success(`✅ ${notification.title}`, {
          description: data.duration_minutes 
            ? `Access granted for ${data.duration_minutes} minutes`
            : 'Access granted',
          action: data.duration_minutes ? {
            label: 'Open App',
            onClick: () => {
              // Trigger app opening if possible
            }
          } : undefined
        });
      } else {
        toast.error(`❌ ${notification.title}`, {
          description: notification.message
        });
      }
    });

    // Crisis mode activation confirmation (for Clients)
    socket.on('crisis_mode_activated', (data) => {
      toast.success('🆘 Crisis Mode Activated', {
        description: 'All app restrictions temporarily lifted. Crisis resources are available.',
        action: {
          label: 'Crisis Resources',
          onClick: () => {
            window.location.href = '/crisis';
          }
        },
        duration: 10000
      });
    });

    socket.on('crisis_mode_expired', (data) => {
      toast.info('Crisis Mode Expired', {
        description: 'App monitoring has been restored. Stay strong!'
      });
    });

    // Access expiration (for Clients)
    socket.on('access_expired', (data) => {
      toast.warning(`Access Expired: ${data.app_name}`, {
        description: `Your ${data.duration_minutes}-minute access has ended`
      });
    });

    // General notifications
    socket.on('notification', (data) => {
      const notification: Notification = {
        id: data.id || Date.now().toString(),
        type: data.type,
        title: data.title,
        message: data.message,
        timestamp: data.timestamp || new Date().toISOString(),
        urgent: data.urgent,
        data: data.data
      };

      setNotifications(prev => [notification, ...prev]);
      
      toast.info(notification.title, {
        description: notification.message
      });
    });

    // Error handling
    socket.on('error', (error) => {
      console.error('Socket error:', error);
      toast.error('Connection Error', {
        description: error.message || 'An error occurred'
      });
    });

    console.log('✅ Recovery event handlers setup complete');
  };

  const sendMessage = (event: string, data: any) => {
    if (socket && isConnected) {
      socket.emit(event, data);
    } else {
      toast.error('Not connected', {
        description: 'Unable to send message - connection lost'
      });
    }
  };

  const clearNotifications = () => {
    setNotifications([]);
  };

  // Request notification permission on mount
  useEffect(() => {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission().then(permission => {
        if (permission === 'granted') {
          console.log('✅ Notification permission granted');
        }
      });
    }
  }, []);

  const value = {
    socket,
    isConnected,
    sendMessage,
    notifications,
    clearNotifications,
  };

  return (
    <SocketContext.Provider value={value}>
      {children}
    </SocketContext.Provider>
  );
}

export function useSocket() {
  const context = useContext(SocketContext);
  if (context === undefined) {
    throw new Error('useSocket must be used within a SocketProvider');
  }
  return context;
}

// Custom hooks for specific socket events
export function useAppMonitoring() {
  const { socket, sendMessage } = useSocket();

  const reportAppInstalled = (appData: { app_name: string; package_name: string; category?: string; risk_level?: string }) => {
    sendMessage('app_installed', appData);
  };

  const reportAppUsageAttempt = (appData: { app_id: string; app_name: string; package_name: string }) => {
    sendMessage('app_usage_attempt', appData);
  };

  return {
    reportAppInstalled,
    reportAppUsageAttempt,
  };
}

export function useMasterControls() {
  const { socket, sendMessage } = useSocket();

  const approveRequest = (requestId: string, approved: boolean, responseMessage?: string, durationMinutes?: number) => {
    sendMessage('approve_request', {
      request_id: requestId,
      approved,
      response_message: responseMessage,
      duration_minutes: durationMinutes
    });
  };

  return {
    approveRequest,
  };
}

export function useCrisisMode() {
  const { socket, sendMessage } = useSocket();

  const activateCrisisMode = (reason?: string) => {
    sendMessage('activate_crisis_mode', { reason });
  };

  return {
    activateCrisisMode,
  };
}

export default SocketContext;