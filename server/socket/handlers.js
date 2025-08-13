import jwt from 'jsonwebtoken';
import db from '../database/init.js';
import { v4 as uuidv4 } from 'uuid';

const JWT_SECRET = process.env.JWT_SECRET || 'second-chance-recovery-secret-key';

// Store active connections
const activeConnections = new Map(); // userId -> socket
const masterClientConnections = new Map(); // masterId -> Set of clientIds

/**
 * Setup all Socket.IO event handlers
 */
export function setupSocketHandlers(io) {
  // Authentication middleware for socket connections
  io.use((socket, next) => {
    try {
      const token = socket.handshake.auth.token;
      if (!token) {
        return next(new Error('Authentication token required'));
      }

      const decoded = jwt.verify(token, JWT_SECRET);
      socket.userId = decoded.userId;
      socket.userRole = decoded.role;
      socket.userName = decoded.name;
      
      console.log(`🔗 Socket authenticated: ${decoded.name} (${decoded.role})`);
      next();
    } catch (error) {
      console.error('Socket authentication failed:', error);
      next(new Error('Invalid authentication token'));
    }
  });

  io.on('connection', (socket) => {
    console.log(`✅ User connected: ${socket.userName} (${socket.userRole}) - Socket ID: ${socket.id}`);
    
    // Store active connection
    activeConnections.set(socket.userId, socket);
    
    // Update user's last active time
    try {
      db.prepare('UPDATE users SET last_active = datetime(\'now\') WHERE id = ?').run(socket.userId);
    } catch (error) {
      console.error('Failed to update last active:', error);
    }

    // Join user to their personal room
    socket.join(`user:${socket.userId}`);

    // If this is a master, join them to master room and get their clients
    if (socket.userRole === 'master') {
      socket.join('masters');
      
      try {
        const relationships = db.prepare(`
          SELECT client_id, u.name as client_name, u.email as client_email
          FROM relationships r
          JOIN users u ON r.client_id = u.id
          WHERE r.master_id = ? AND r.status = 'active'
        `).all(socket.userId);

        if (relationships.length > 0) {
          const clientIds = relationships.map(r => r.client_id);
          masterClientConnections.set(socket.userId, new Set(clientIds));
          
          // Join master to each client's room for notifications
          relationships.forEach(rel => {
            socket.join(`client:${rel.client_id}`);
          });
        }
      } catch (error) {
        console.error('Failed to setup master connections:', error);
      }
    }

    // If this is a client, join them to client room and notify their master
    if (socket.userRole === 'client') {
      socket.join('clients');
      socket.join(`client:${socket.userId}`);
      
      try {
        const relationship = db.prepare(`
          SELECT master_id, u.name as master_name
          FROM relationships r
          JOIN users u ON r.master_id = u.id
          WHERE r.client_id = ? AND r.status = 'active'
        `).get(socket.userId);

        if (relationship) {
          // Notify master that client is online
          socket.to(`user:${relationship.master_id}`).emit('client_status', {
            type: 'client_online',
            client_id: socket.userId,
            client_name: socket.userName,
            timestamp: new Date().toISOString()
          });
        }
      } catch (error) {
        console.error('Failed to setup client connection:', error);
      }
    }

    // Handle app installation event
    socket.on('app_installed', async (data) => {
      try {
        const { app_name, package_name, category, risk_level } = data;
        
        if (socket.userRole !== 'client') {
          socket.emit('error', { message: 'Only clients can report app installations' });
          return;
        }

        // Log app installation event
        const eventId = uuidv4();
        const appId = uuidv4();

        // Check if app is already being monitored
        const existingApp = db.prepare(`
          SELECT id FROM monitored_apps 
          WHERE client_id = ? AND package_name = ?
        `).get(socket.userId, package_name);

        if (!existingApp) {
          // Add app to monitored apps (blocked by default)
          db.prepare(`
            INSERT INTO monitored_apps (id, client_id, app_name, package_name, category, risk_level, is_blocked, added_at)
            VALUES (?, ?, ?, ?, ?, ?, 1, datetime('now'))
          `).run(appId, socket.userId, app_name, package_name, category || 'Other', risk_level || 'medium');
        }

        // Log installation event
        db.prepare(`
          INSERT INTO app_events (id, client_id, app_id, event_type, timestamp, details)
          VALUES (?, ?, ?, 'install', datetime('now'), ?)
        `).run(eventId, socket.userId, existingApp?.id || appId, JSON.stringify({ 
          app_name, 
          package_name, 
          category,
          risk_level,
          installation_source: 'automatic_detection'
        }));

        // Notify master
        const relationship = db.prepare(`
          SELECT master_id FROM relationships 
          WHERE client_id = ? AND status = 'active'
        `).get(socket.userId);

        if (relationship) {
          const notification = {
            type: 'app_installed',
            client_id: socket.userId,
            client_name: socket.userName,
            app_name,
            package_name,
            risk_level: risk_level || 'medium',
            timestamp: new Date().toISOString()
          };

          // Real-time notification to master
          io.to(`user:${relationship.master_id}`).emit('app_alert', notification);

          // Store persistent notification
          const notificationId = uuidv4();
          db.prepare(`
            INSERT INTO notifications (id, user_id, type, title, message, data, is_urgent)
            VALUES (?, ?, 'app_request', ?, ?, ?, 1)
          `).run(
            notificationId,
            relationship.master_id,
            `App Installed: ${app_name}`,
            `${socket.userName} has installed ${app_name}. This app is currently blocked and awaits your approval.`,
            JSON.stringify(notification)
          );

          console.log(`📱 App installation detected: ${app_name} by ${socket.userName}`);
        }

        socket.emit('app_install_logged', { success: true, app_id: existingApp?.id || appId });

      } catch (error) {
        console.error('App installation handling error:', error);
        socket.emit('error', { message: 'Failed to process app installation' });
      }
    });

    // Handle app usage attempt
    socket.on('app_usage_attempt', async (data) => {
      try {
        const { app_id, app_name, package_name } = data;
        
        if (socket.userRole !== 'client') {
          socket.emit('error', { message: 'Only clients can report app usage attempts' });
          return;
        }

        // Get app blocking status
        const app = db.prepare(`
          SELECT * FROM monitored_apps 
          WHERE id = ? AND client_id = ?
        `).get(app_id, socket.userId);

        if (!app) {
          socket.emit('app_usage_response', { 
            allowed: true, 
            reason: 'App not monitored' 
          });
          return;
        }

        // Log usage attempt
        const eventId = uuidv4();
        db.prepare(`
          INSERT INTO app_events (id, client_id, app_id, event_type, timestamp, details)
          VALUES (?, ?, ?, ?, datetime('now'), ?)
        `).run(
          eventId, 
          socket.userId, 
          app_id, 
          app.is_blocked ? 'block_attempt' : 'usage',
          JSON.stringify({ app_name, package_name, blocked: app.is_blocked })
        );

        if (app.is_blocked) {
          // Create approval request
          const requestId = uuidv4();
          const expiresAt = new Date();
          expiresAt.setHours(expiresAt.getHours() + 24);

          db.prepare(`
            INSERT INTO approval_requests (id, client_id, master_id, app_id, request_type, status, reason, expires_at)
            VALUES (?, ?, (SELECT master_id FROM relationships WHERE client_id = ? AND status = 'active'), ?, 'usage', 'pending', ?, ?)
          `).run(
            requestId,
            socket.userId,
            socket.userId,
            app_id,
            `${socket.userName} is requesting access to ${app_name}`,
            expiresAt.toISOString()
          );

          // Get master for notification
          const relationship = db.prepare(`
            SELECT master_id FROM relationships 
            WHERE client_id = ? AND status = 'active'
          `).get(socket.userId);

          if (relationship) {
            const notification = {
              type: 'usage_request',
              request_id: requestId,
              client_id: socket.userId,
              client_name: socket.userName,
              app_name,
              app_id,
              timestamp: new Date().toISOString(),
              expires_at: expiresAt.toISOString()
            };

            // Real-time notification to master
            io.to(`user:${relationship.master_id}`).emit('usage_request', notification);

            // Store persistent notification
            const notificationId = uuidv4();
            db.prepare(`
              INSERT INTO notifications (id, user_id, type, title, message, data, is_urgent)
              VALUES (?, ?, 'app_request', ?, ?, ?, 1)
            `).run(
              notificationId,
              relationship.master_id,
              `App Access Request: ${app_name}`,
              `${socket.userName} is requesting permission to use ${app_name}`,
              JSON.stringify(notification)
            );

            console.log(`🚫 App usage blocked: ${app_name} by ${socket.userName}`);
          }

          socket.emit('app_usage_response', { 
            allowed: false, 
            reason: 'App is blocked - approval request sent to your recovery support person',
            request_id: requestId
          });

        } else {
          console.log(`✅ App usage allowed: ${app_name} by ${socket.userName}`);
          
          socket.emit('app_usage_response', { 
            allowed: true, 
            reason: 'App is approved for use' 
          });
        }

      } catch (error) {
        console.error('App usage attempt handling error:', error);
        socket.emit('error', { message: 'Failed to process app usage attempt' });
      }
    });

    // Handle master approval/denial
    socket.on('approve_request', async (data) => {
      try {
        const { request_id, approved, response_message, duration_minutes } = data;
        
        if (socket.userRole !== 'master') {
          socket.emit('error', { message: 'Only masters can approve/deny requests' });
          return;
        }

        // Get request details
        const request = db.prepare(`
          SELECT ar.*, ma.app_name, u.name as client_name
          FROM approval_requests ar
          JOIN monitored_apps ma ON ar.app_id = ma.id
          JOIN users u ON ar.client_id = u.id
          WHERE ar.id = ? AND ar.master_id = ?
        `).get(request_id, socket.userId);

        if (!request) {
          socket.emit('error', { message: 'Request not found' });
          return;
        }

        if (request.status !== 'pending') {
          socket.emit('error', { message: 'Request already processed' });
          return;
        }

        const status = approved ? 'approved' : 'denied';
        const respondedAt = new Date().toISOString();

        // Update request
        db.prepare(`
          UPDATE approval_requests 
          SET status = ?, master_response = ?, responded_at = ?, duration_minutes = ?
          WHERE id = ?
        `).run(status, response_message || null, respondedAt, duration_minutes || null, request_id);

        // If approved, temporarily unblock the app
        if (approved) {
          if (duration_minutes && duration_minutes > 0) {
            // Temporary access - set up auto-reblock
            db.prepare(`
              UPDATE monitored_apps 
              SET is_blocked = 0, last_updated = datetime('now')
              WHERE id = ?
            `).run(request.app_id);

            // Schedule re-blocking (in a real app, you'd use a job queue)
            setTimeout(() => {
              try {
                db.prepare(`
                  UPDATE monitored_apps 
                  SET is_blocked = 1, last_updated = datetime('now')
                  WHERE id = ?
                `).run(request.app_id);

                // Notify client that access has expired
                io.to(`user:${request.client_id}`).emit('access_expired', {
                  app_name: request.app_name,
                  duration_minutes
                });

                console.log(`⏰ Temporary access expired: ${request.app_name} for ${request.client_name}`);
              } catch (error) {
                console.error('Failed to re-block app:', error);
              }
            }, duration_minutes * 60 * 1000);
          }
        }

        // Notify client of decision
        const notification = {
          type: 'request_decision',
          request_id,
          approved,
          app_name: request.app_name,
          master_response: response_message,
          duration_minutes,
          timestamp: respondedAt
        };

        io.to(`user:${request.client_id}`).emit('request_decision', notification);

        // Store notification for client
        const notificationId = uuidv4();
        db.prepare(`
          INSERT INTO notifications (id, user_id, type, title, message, data)
          VALUES (?, ?, 'system', ?, ?, ?)
        `).run(
          notificationId,
          request.client_id,
          `Request ${approved ? 'Approved' : 'Denied'}: ${request.app_name}`,
          approved 
            ? `Your access to ${request.app_name} has been approved${duration_minutes ? ` for ${duration_minutes} minutes` : ''}` 
            : `Your request to use ${request.app_name} has been denied`,
          JSON.stringify(notification)
        );

        console.log(`${approved ? '✅' : '❌'} Request ${status}: ${request.app_name} for ${request.client_name}`);
        
        socket.emit('request_processed', { success: true, request_id, status });

      } catch (error) {
        console.error('Request approval handling error:', error);
        socket.emit('error', { message: 'Failed to process request approval' });
      }
    });

    // Handle crisis mode activation
    socket.on('activate_crisis_mode', async (data) => {
      try {
        const { reason } = data;
        
        if (socket.userRole !== 'client') {
          socket.emit('error', { message: 'Only clients can activate crisis mode' });
          return;
        }

        // Temporarily unblock all apps for this client
        db.prepare(`
          UPDATE monitored_apps 
          SET is_blocked = 0, last_updated = datetime('now')
          WHERE client_id = ?
        `).run(socket.userId);

        // Log crisis event
        const eventId = uuidv4();
        db.prepare(`
          INSERT INTO crisis_events (id, client_id, event_type, resource_details, timestamp, follow_up_required)
          VALUES (?, ?, 'crisis_mode_activated', ?, datetime('now'), 1)
        `).run(eventId, socket.userId, JSON.stringify({ reason, activated_by: 'client' }));

        // Notify master immediately
        const relationship = db.prepare(`
          SELECT master_id FROM relationships 
          WHERE client_id = ? AND status = 'active'
        `).get(socket.userId);

        if (relationship) {
          const crisisNotification = {
            type: 'crisis_alert',
            client_id: socket.userId,
            client_name: socket.userName,
            reason,
            timestamp: new Date().toISOString(),
            urgent: true
          };

          // Real-time crisis alert to master
          io.to(`user:${relationship.master_id}`).emit('crisis_alert', crisisNotification);

          // Store urgent notification
          const notificationId = uuidv4();
          db.prepare(`
            INSERT INTO notifications (id, user_id, type, title, message, data, is_urgent)
            VALUES (?, ?, 'crisis_alert', ?, ?, ?, 1)
          `).run(
            notificationId,
            relationship.master_id,
            `🆘 CRISIS MODE ACTIVATED: ${socket.userName}`,
            `${socket.userName} has activated crisis mode. All app restrictions have been temporarily lifted. Please reach out immediately to provide support.`,
            JSON.stringify(crisisNotification)
          );

          console.log(`🆘 CRISIS MODE ACTIVATED by ${socket.userName}: ${reason || 'No reason provided'}`);
        }

        socket.emit('crisis_mode_activated', { 
          success: true, 
          message: 'All app restrictions temporarily lifted. Crisis resources are available.',
          timestamp: new Date().toISOString()
        });

        // Auto-reactivate blocking after 2 hours (crisis mode timeout)
        setTimeout(() => {
          try {
            db.prepare(`
              UPDATE monitored_apps 
              SET is_blocked = 1, last_updated = datetime('now')
              WHERE client_id = ?
            `).run(socket.userId);

            io.to(`user:${socket.userId}`).emit('crisis_mode_expired', {
              message: 'Crisis mode has expired. App monitoring has been restored.'
            });

            console.log(`⏰ Crisis mode expired for ${socket.userName}`);
          } catch (error) {
            console.error('Failed to restore blocking after crisis mode:', error);
          }
        }, 2 * 60 * 60 * 1000); // 2 hours

      } catch (error) {
        console.error('Crisis mode activation error:', error);
        socket.emit('error', { message: 'Failed to activate crisis mode' });
      }
    });

    // Handle typing indicators for chat
    socket.on('typing', (data) => {
      const { target_user_id } = data;
      if (target_user_id) {
        socket.to(`user:${target_user_id}`).emit('user_typing', {
          user_id: socket.userId,
          user_name: socket.userName
        });
      }
    });

    socket.on('stop_typing', (data) => {
      const { target_user_id } = data;
      if (target_user_id) {
        socket.to(`user:${target_user_id}`).emit('user_stop_typing', {
          user_id: socket.userId
        });
      }
    });

    // Handle disconnect
    socket.on('disconnect', (reason) => {
      console.log(`❌ User disconnected: ${socket.userName} (${socket.userRole}) - Reason: ${reason}`);
      
      // Remove from active connections
      activeConnections.delete(socket.userId);
      
      // Clean up master-client connections
      if (socket.userRole === 'master') {
        masterClientConnections.delete(socket.userId);
      }
      
      // If client disconnected, notify their master
      if (socket.userRole === 'client') {
        try {
          const relationship = db.prepare(`
            SELECT master_id FROM relationships 
            WHERE client_id = ? AND status = 'active'
          `).get(socket.userId);

          if (relationship) {
            socket.to(`user:${relationship.master_id}`).emit('client_status', {
              type: 'client_offline',
              client_id: socket.userId,
              client_name: socket.userName,
              timestamp: new Date().toISOString()
            });
          }
        } catch (error) {
          console.error('Failed to notify master of client disconnect:', error);
        }
      }
    });
  });

  // Periodic cleanup and health checks
  setInterval(() => {
    try {
      console.log(`📊 Active connections: ${activeConnections.size}`);
      
      // Cleanup expired approval requests
      const expiredRequests = db.prepare(`
        UPDATE approval_requests 
        SET status = 'expired' 
        WHERE status = 'pending' AND expires_at < datetime('now')
      `).run();

      if (expiredRequests.changes > 0) {
        console.log(`⏰ Expired ${expiredRequests.changes} pending approval requests`);
      }

    } catch (error) {
      console.error('Periodic cleanup error:', error);
    }
  }, 5 * 60 * 1000); // Every 5 minutes

  console.log('✅ Socket.IO handlers initialized');
  return io;
}

/**
 * Send notification to specific user if they're online
 */
export function sendNotificationToUser(userId, notification) {
  const socket = activeConnections.get(userId);
  if (socket) {
    socket.emit('notification', notification);
    return true;
  }
  return false;
}

/**
 * Send crisis alert to master
 */
export function sendCrisisAlert(masterId, clientData) {
  const socket = activeConnections.get(masterId);
  if (socket) {
    socket.emit('crisis_alert', {
      type: 'crisis_alert',
      ...clientData,
      timestamp: new Date().toISOString(),
      urgent: true
    });
    return true;
  }
  return false;
}