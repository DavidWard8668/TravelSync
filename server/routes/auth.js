import express from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';
import db from '../database/init.js';
import { sendEmail } from '../utils/email.js';

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || 'second-chance-recovery-secret-key';
const SALT_ROUNDS = 12;

/**
 * Register new user (Master or Client)
 */
router.post('/register', async (req, res) => {
  try {
    const { email, password, name, role, phone, invitationCode } = req.body;

    // Validation
    if (!email || !password || !name || !role) {
      return res.status(400).json({ 
        error: 'Email, password, name, and role are required' 
      });
    }

    if (!['master', 'client'].includes(role)) {
      return res.status(400).json({ 
        error: 'Role must be either master or client' 
      });
    }

    if (password.length < 8) {
      return res.status(400).json({ 
        error: 'Password must be at least 8 characters long' 
      });
    }

    // Check if user already exists
    const existingUser = db.prepare('SELECT id FROM users WHERE email = ?').get(email.toLowerCase());
    if (existingUser) {
      return res.status(409).json({ 
        error: 'User with this email already exists' 
      });
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);
    const userId = uuidv4();

    // Create user
    const insertUser = db.prepare(`
      INSERT INTO users (id, email, password_hash, role, name, phone, created_at, last_active)
      VALUES (?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))
    `);
    
    insertUser.run(userId, email.toLowerCase(), passwordHash, role, name, phone || null);

    // If client is registering with invitation code, create relationship
    if (role === 'client' && invitationCode) {
      const relationship = db.prepare(`
        SELECT * FROM relationships 
        WHERE invitation_code = ? AND status = 'pending' 
        AND invitation_expires_at > datetime('now')
      `).get(invitationCode);

      if (relationship) {
        // Update relationship with client ID and activate
        db.prepare(`
          UPDATE relationships 
          SET client_id = ?, status = 'active', approved_at = datetime('now')
          WHERE id = ?
        `).run(userId, relationship.id);

        // Create welcome notification for master
        const notificationId = uuidv4();
        db.prepare(`
          INSERT INTO notifications (id, user_id, type, title, message, data)
          VALUES (?, ?, ?, ?, ?, ?)
        `).run(
          notificationId, 
          relationship.master_id, 
          'relationship',
          'Client Connected!',
          `${name} has joined as your recovery client and activated monitoring.`,
          JSON.stringify({ client_id: userId, client_name: name })
        );
      }
    }

    // Generate JWT token
    const token = jwt.sign(
      { 
        userId, 
        email: email.toLowerCase(), 
        role, 
        name 
      }, 
      JWT_SECRET, 
      { expiresIn: '7d' }
    );

    // Get user data for response (without password)
    const user = db.prepare(`
      SELECT id, email, role, name, phone, created_at, last_active 
      FROM users WHERE id = ?
    `).get(userId);

    console.log(`✅ New ${role} registered: ${name} (${email})`);

    res.status(201).json({
      message: 'User registered successfully',
      user,
      token,
      expiresIn: '7d'
    });

  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ 
      error: 'Registration failed. Please try again.' 
    });
  }
});

/**
 * Login user
 */
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validation
    if (!email || !password) {
      return res.status(400).json({ 
        error: 'Email and password are required' 
      });
    }

    // Find user
    const user = db.prepare(`
      SELECT id, email, password_hash, role, name, phone, created_at, is_active 
      FROM users WHERE email = ?
    `).get(email.toLowerCase());

    if (!user) {
      return res.status(401).json({ 
        error: 'Invalid email or password' 
      });
    }

    if (!user.is_active) {
      return res.status(401).json({ 
        error: 'Account is deactivated. Please contact support.' 
      });
    }

    // Verify password
    const passwordValid = await bcrypt.compare(password, user.password_hash);
    if (!passwordValid) {
      return res.status(401).json({ 
        error: 'Invalid email or password' 
      });
    }

    // Update last active
    db.prepare('UPDATE users SET last_active = datetime(\'now\') WHERE id = ?').run(user.id);

    // Generate JWT token
    const token = jwt.sign(
      { 
        userId: user.id, 
        email: user.email, 
        role: user.role, 
        name: user.name 
      }, 
      JWT_SECRET, 
      { expiresIn: '7d' }
    );

    // Remove password hash from response
    const { password_hash, ...safeUser } = user;

    console.log(`✅ User logged in: ${user.name} (${user.email}) - ${user.role}`);

    res.json({
      message: 'Login successful',
      user: safeUser,
      token,
      expiresIn: '7d'
    });

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ 
      error: 'Login failed. Please try again.' 
    });
  }
});

/**
 * Create invitation code for Master to invite Client
 */
router.post('/create-invitation', async (req, res) => {
  try {
    const { masterId, clientEmail, clientName, message } = req.body;

    // Validation
    if (!masterId) {
      return res.status(400).json({ 
        error: 'Master ID is required' 
      });
    }

    // Verify master user exists
    const master = db.prepare('SELECT * FROM users WHERE id = ? AND role = ?').get(masterId, 'master');
    if (!master) {
      return res.status(404).json({ 
        error: 'Master user not found' 
      });
    }

    // Generate invitation code and expiry
    const invitationCode = uuidv4().substring(0, 8).toUpperCase();
    const relationshipId = uuidv4();
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7); // Expires in 7 days

    // Create pending relationship
    db.prepare(`
      INSERT INTO relationships (id, master_id, invitation_code, invitation_expires_at, status, created_at)
      VALUES (?, ?, ?, ?, 'pending', datetime('now'))
    `).run(relationshipId, masterId, invitationCode, expiresAt.toISOString());

    // Send invitation email if email provided
    if (clientEmail) {
      try {
        await sendInvitationEmail(clientEmail, clientName, master.name, invitationCode, message);
      } catch (emailError) {
        console.error('Failed to send invitation email:', emailError);
        // Continue anyway - user can still share code manually
      }
    }

    console.log(`✅ Invitation created by ${master.name}: ${invitationCode}`);

    res.status(201).json({
      message: 'Invitation created successfully',
      invitationCode,
      expiresAt: expiresAt.toISOString(),
      relationshipId
    });

  } catch (error) {
    console.error('Create invitation error:', error);
    res.status(500).json({ 
      error: 'Failed to create invitation' 
    });
  }
});

/**
 * Verify invitation code
 */
router.post('/verify-invitation', async (req, res) => {
  try {
    const { invitationCode } = req.body;

    if (!invitationCode) {
      return res.status(400).json({ 
        error: 'Invitation code is required' 
      });
    }

    // Find valid invitation
    const invitation = db.prepare(`
      SELECT r.*, u.name as master_name, u.email as master_email 
      FROM relationships r
      JOIN users u ON r.master_id = u.id
      WHERE r.invitation_code = ? 
      AND r.status = 'pending' 
      AND r.invitation_expires_at > datetime('now')
    `).get(invitationCode.toUpperCase());

    if (!invitation) {
      return res.status(404).json({ 
        error: 'Invalid or expired invitation code' 
      });
    }

    res.json({
      message: 'Valid invitation found',
      master: {
        name: invitation.master_name,
        email: invitation.master_email
      },
      expiresAt: invitation.invitation_expires_at
    });

  } catch (error) {
    console.error('Verify invitation error:', error);
    res.status(500).json({ 
      error: 'Failed to verify invitation' 
    });
  }
});

/**
 * Refresh JWT token
 */
router.post('/refresh', async (req, res) => {
  try {
    const { token } = req.body;

    if (!token) {
      return res.status(400).json({ 
        error: 'Token is required' 
      });
    }

    // Verify existing token
    const decoded = jwt.verify(token, JWT_SECRET);
    
    // Get updated user data
    const user = db.prepare(`
      SELECT id, email, role, name, phone, is_active 
      FROM users WHERE id = ?
    `).get(decoded.userId);

    if (!user || !user.is_active) {
      return res.status(401).json({ 
        error: 'User not found or inactive' 
      });
    }

    // Generate new token
    const newToken = jwt.sign(
      { 
        userId: user.id, 
        email: user.email, 
        role: user.role, 
        name: user.name 
      }, 
      JWT_SECRET, 
      { expiresIn: '7d' }
    );

    res.json({
      message: 'Token refreshed successfully',
      token: newToken,
      expiresIn: '7d',
      user
    });

  } catch (error) {
    console.error('Token refresh error:', error);
    res.status(401).json({ 
      error: 'Invalid token' 
    });
  }
});

/**
 * Password reset request
 */
router.post('/forgot-password', async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ 
        error: 'Email is required' 
      });
    }

    const user = db.prepare('SELECT * FROM users WHERE email = ?').get(email.toLowerCase());
    
    // Always respond with success to prevent email enumeration
    res.json({
      message: 'If an account with that email exists, a password reset link has been sent.'
    });

    // Only actually send email if user exists
    if (user) {
      try {
        const resetToken = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: '1h' });
        await sendPasswordResetEmail(user.email, user.name, resetToken);
        console.log(`✅ Password reset email sent to ${user.email}`);
      } catch (emailError) {
        console.error('Failed to send password reset email:', emailError);
      }
    }

  } catch (error) {
    console.error('Forgot password error:', error);
    res.status(500).json({ 
      error: 'Failed to process password reset request' 
    });
  }
});

/**
 * Password reset
 */
router.post('/reset-password', async (req, res) => {
  try {
    const { token, newPassword } = req.body;

    if (!token || !newPassword) {
      return res.status(400).json({ 
        error: 'Token and new password are required' 
      });
    }

    if (newPassword.length < 8) {
      return res.status(400).json({ 
        error: 'Password must be at least 8 characters long' 
      });
    }

    // Verify reset token
    const decoded = jwt.verify(token, JWT_SECRET);
    
    // Hash new password
    const passwordHash = await bcrypt.hash(newPassword, SALT_ROUNDS);
    
    // Update password
    const result = db.prepare(`
      UPDATE users SET password_hash = ?, last_active = datetime('now')
      WHERE id = ?
    `).run(passwordHash, decoded.userId);

    if (result.changes === 0) {
      return res.status(404).json({ 
        error: 'User not found' 
      });
    }

    console.log(`✅ Password reset successful for user ${decoded.userId}`);

    res.json({
      message: 'Password reset successful'
    });

  } catch (error) {
    if (error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError') {
      return res.status(401).json({ 
        error: 'Invalid or expired reset token' 
      });
    }

    console.error('Reset password error:', error);
    res.status(500).json({ 
      error: 'Failed to reset password' 
    });
  }
});

/**
 * Send invitation email
 */
async function sendInvitationEmail(clientEmail, clientName, masterName, invitationCode, message) {
  const subject = `${masterName} has invited you to Second Chance Recovery Support`;
  
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <div style="background: #2c3e50; padding: 20px; text-align: center;">
        <h1 style="color: white; margin: 0;">Second Chance Recovery</h1>
        <p style="color: #bdc3c7; margin: 5px 0 0 0;">Supporting your recovery journey</p>
      </div>
      
      <div style="padding: 30px; background: #f8f9fa;">
        <h2 style="color: #2c3e50;">You're Invited to Connect!</h2>
        
        <p>Hi${clientName ? ` ${clientName}` : ''},</p>
        
        <p><strong>${masterName}</strong> has invited you to connect on Second Chance Recovery as their recovery support client.</p>
        
        ${message ? `<div style="background: #e8f4fd; padding: 15px; border-radius: 8px; margin: 20px 0;"><p style="margin: 0; font-style: italic;">"${message}"</p></div>` : ''}
        
        <div style="background: white; padding: 20px; border-radius: 8px; text-align: center; margin: 25px 0;">
          <h3 style="color: #2c3e50; margin-top: 0;">Your Invitation Code</h3>
          <div style="background: #3498db; color: white; padding: 15px; font-size: 24px; font-weight: bold; border-radius: 6px; letter-spacing: 2px;">
            ${invitationCode}
          </div>
          <p style="color: #7f8c8d; margin-bottom: 0;">Enter this code when registering</p>
        </div>
        
        <div style="text-align: center; margin: 30px 0;">
          <a href="${process.env.CLIENT_URL || 'http://localhost:3000'}/register?code=${invitationCode}" 
             style="background: #27ae60; color: white; padding: 15px 30px; text-decoration: none; border-radius: 6px; font-weight: bold;">
            Get Started →
          </a>
        </div>
        
        <div style="background: #fff3cd; padding: 15px; border-radius: 8px; margin: 25px 0;">
          <h4 style="color: #856404; margin-top: 0;">🆘 Crisis Support Always Available</h4>
          <ul style="color: #856404; margin-bottom: 0;">
            <li><strong>Samaritans:</strong> 116 123 (free, 24/7)</li>
            <li><strong>Crisis Text Line:</strong> Text SHOUT to 85258</li>
            <li><strong>NHS Mental Health:</strong> Call 111, press 2</li>
          </ul>
        </div>
        
        <p style="color: #7f8c8d; font-size: 14px;">
          Second Chance Recovery helps you stay accountable in your recovery journey with support from someone you trust.
          This invitation expires in 7 days.
        </p>
      </div>
    </div>
  `;

  await sendEmail(clientEmail, subject, html);
}

/**
 * Send password reset email
 */
async function sendPasswordResetEmail(email, name, resetToken) {
  const subject = 'Reset Your Second Chance Recovery Password';
  const resetUrl = `${process.env.CLIENT_URL || 'http://localhost:3000'}/reset-password?token=${resetToken}`;
  
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <div style="background: #2c3e50; padding: 20px; text-align: center;">
        <h1 style="color: white; margin: 0;">Second Chance Recovery</h1>
      </div>
      
      <div style="padding: 30px; background: #f8f9fa;">
        <h2 style="color: #2c3e50;">Password Reset Request</h2>
        
        <p>Hi ${name},</p>
        
        <p>You requested a password reset for your Second Chance Recovery account. Click the button below to reset your password:</p>
        
        <div style="text-align: center; margin: 30px 0;">
          <a href="${resetUrl}" 
             style="background: #3498db; color: white; padding: 15px 30px; text-decoration: none; border-radius: 6px; font-weight: bold;">
            Reset Password
          </a>
        </div>
        
        <p style="color: #7f8c8d; font-size: 14px;">
          This link will expire in 1 hour. If you didn't request this reset, you can safely ignore this email.
        </p>
        
        <div style="background: #fff3cd; padding: 15px; border-radius: 8px; margin: 25px 0;">
          <h4 style="color: #856404; margin-top: 0;">🆘 Crisis Support Always Available</h4>
          <p style="color: #856404; margin-bottom: 0;">
            <strong>Samaritans:</strong> 116 123 • <strong>Crisis Text:</strong> SHOUT to 85258 • <strong>NHS:</strong> 111 press 2
          </p>
        </div>
      </div>
    </div>
  `;

  await sendEmail(email, subject, html);
}

export default router;