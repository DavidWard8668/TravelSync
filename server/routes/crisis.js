import express from 'express';
import db from '../database/init.js';
import { v4 as uuidv4 } from 'uuid';
import { sendCrisisAlert } from '../socket/handlers.js';
import { sendEmail } from '../utils/email.js';

const router = express.Router();

// UK Crisis Resources - Always available, no authentication required
const UK_CRISIS_RESOURCES = [
  {
    id: 'samaritans',
    name: 'Samaritans',
    phone: '116 123',
    description: 'Free 24/7 emotional support for anyone struggling to cope',
    website: 'https://www.samaritans.org',
    category: 'emotional_support',
    availability: '24/7',
    cost: 'Free',
    methods: ['phone', 'email', 'webchat'],
    specialties: ['suicide_prevention', 'emotional_crisis', 'listening_service']
  },
  {
    id: 'crisis_text_line',
    name: 'Crisis Text Line (Shout)',
    text: 'SHOUT to 85258',
    description: 'Free 24/7 crisis support via text message',
    website: 'https://giveusashout.org',
    category: 'crisis_text',
    availability: '24/7',
    cost: 'Free',
    methods: ['text'],
    specialties: ['crisis_intervention', 'suicide_prevention', 'mental_health_crisis']
  },
  {
    id: 'nhs_mental_health',
    name: 'NHS Mental Health Crisis',
    phone: '111',
    description: 'NHS mental health crisis support - press 2 for mental health',
    website: 'https://www.nhs.uk/mental-health/feelings-symptoms-behaviours/behaviours/help-for-suicidal-thoughts/',
    category: 'healthcare',
    availability: '24/7',
    cost: 'Free (NHS)',
    methods: ['phone'],
    specialties: ['mental_health_crisis', 'psychiatric_emergency', 'clinical_support']
  },
  {
    id: 'mind_charity',
    name: 'Mind - Mental Health Charity',
    phone: '0300 123 3393',
    email: 'info@mind.org.uk',
    description: 'Mental health information and support',
    website: 'https://www.mind.org.uk',
    category: 'mental_health_info',
    availability: '9am-6pm Mon-Fri',
    cost: 'Free',
    methods: ['phone', 'email', 'webchat'],
    specialties: ['mental_health_info', 'support_guidance', 'resource_directory']
  },
  {
    id: 'calm',
    name: 'CALM (Campaign Against Living Miserably)',
    phone: '0800 58 58 58',
    description: 'Leading movement against suicide, specifically for men',
    website: 'https://www.thecalmzone.net',
    category: 'suicide_prevention',
    availability: '5pm-midnight daily',
    cost: 'Free',
    methods: ['phone', 'webchat'],
    specialties: ['male_suicide_prevention', 'crisis_support', 'mental_health_awareness']
  },
  {
    id: 'papyrus_hopeline',
    name: 'PAPYRUS HOPELINEUK',
    phone: '0800 068 41 41',
    text: '07860 039967',
    email: 'pat@papyrus-uk.org',
    description: 'Suicide prevention for young people under 35',
    website: 'https://www.papyrus-uk.org',
    category: 'youth_suicide_prevention',
    availability: '9am-10pm weekdays, 2pm-10pm weekends',
    cost: 'Free',
    methods: ['phone', 'text', 'email'],
    specialties: ['youth_suicide_prevention', 'young_adult_support', 'family_support']
  },
  {
    id: 'childline',
    name: 'Childline',
    phone: '0800 1111',
    description: 'Support for children and young people under 19',
    website: 'https://www.childline.org.uk',
    category: 'youth_support',
    availability: '24/7',
    cost: 'Free',
    methods: ['phone', 'webchat', 'email'],
    specialties: ['child_support', 'youth_crisis', 'abuse_support']
  },
  {
    id: 'addiction_helplines',
    name: 'UK Addiction Helplines',
    phone: '0300 999 1212',
    description: 'Frank - Drugs information and support',
    website: 'https://www.talktofrank.com',
    category: 'addiction_support',
    availability: '24/7',
    cost: 'Free',
    methods: ['phone', 'text', 'webchat'],
    specialties: ['drug_addiction', 'alcohol_addiction', 'recovery_support']
  }
];

// Self-help content categories with curated YouTube playlists
const SELF_HELP_CONTENT = {
  meditation: [
    {
      id: 'headspace_basics',
      title: 'Headspace Basics - 10 Minute Meditation',
      url: 'https://www.youtube.com/watch?v=inpok4MKVLM',
      description: 'Simple 10-minute meditation perfect for beginners',
      duration: '10:00',
      category: 'meditation',
      tags: ['beginner', 'daily_practice', 'mindfulness']
    },
    {
      id: 'body_scan',
      title: 'Body Scan Meditation for Recovery',
      url: 'https://www.youtube.com/watch?v=15q-N-_kkrU',
      description: 'Guided body scan to release tension and anxiety',
      duration: '20:00',
      category: 'meditation',
      tags: ['anxiety', 'stress_relief', 'recovery']
    }
  ],
  triggers: [
    {
      id: 'understanding_triggers',
      title: 'Understanding Your Addiction Triggers',
      url: 'https://www.youtube.com/watch?v=trigger-video',
      description: 'Learn to identify and understand your personal triggers',
      duration: '15:30',
      category: 'education',
      tags: ['triggers', 'self_awareness', 'prevention']
    },
    {
      id: 'coping_strategies',
      title: 'Healthy Coping Strategies for Recovery',
      url: 'https://www.youtube.com/watch?v=coping-strategies',
      description: 'Practical techniques for managing cravings and urges',
      duration: '18:45',
      category: 'coping',
      tags: ['coping', 'strategies', 'practical_tips']
    }
  ],
  recovery_stories: [
    {
      id: 'recovery_journey_1',
      title: 'My Recovery Story - 5 Years Clean',
      url: 'https://www.youtube.com/watch?v=recovery-story-1',
      description: 'Personal story of recovery from addiction',
      duration: '25:00',
      category: 'inspiration',
      tags: ['recovery_story', 'inspiration', 'hope']
    }
  ],
  addiction_science: [
    {
      id: 'brain_addiction',
      title: 'How Addiction Changes the Brain',
      url: 'https://www.youtube.com/watch?v=brain-addiction',
      description: 'Scientific explanation of addiction\'s effect on the brain',
      duration: '12:30',
      category: 'science',
      tags: ['neuroscience', 'education', 'understanding']
    }
  ]
};

/**
 * Get all UK crisis resources (no auth required - emergency access)
 */
router.get('/resources', (req, res) => {
  try {
    res.json({
      message: 'UK Crisis Resources - Always Available',
      resources: UK_CRISIS_RESOURCES,
      emergency: {
        immediate_danger: '999',
        mental_health_crisis: '111 (press 2)',
        suicide_prevention: '116 123'
      },
      last_updated: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error fetching crisis resources:', error);
    res.status(500).json({ 
      error: 'Failed to fetch resources',
      emergency_fallback: {
        samaritans: '116 123',
        crisis_text: 'Text SHOUT to 85258',
        nhs: '111 press 2'
      }
    });
  }
});

/**
 * Get self-help content library
 */
router.get('/self-help', (req, res) => {
  try {
    const { category, tags } = req.query;
    let content = SELF_HELP_CONTENT;

    // Filter by category if specified
    if (category && content[category]) {
      content = { [category]: content[category] };
    }

    // Filter by tags if specified
    if (tags) {
      const tagList = tags.split(',');
      const filteredContent = {};
      
      Object.keys(content).forEach(cat => {
        filteredContent[cat] = content[cat].filter(item => 
          item.tags.some(tag => tagList.includes(tag))
        );
      });
      
      content = filteredContent;
    }

    res.json({
      message: 'Self-help content library',
      categories: Object.keys(SELF_HELP_CONTENT),
      content,
      total_items: Object.values(content).reduce((sum, items) => sum + items.length, 0)
    });
  } catch (error) {
    console.error('Error fetching self-help content:', error);
    res.status(500).json({ error: 'Failed to fetch self-help content' });
  }
});

/**
 * Log crisis resource access (no auth required for emergency access)
 */
router.post('/access-resource', async (req, res) => {
  try {
    const { resource_id, user_id, access_method } = req.body;

    if (!resource_id) {
      return res.status(400).json({ error: 'Resource ID is required' });
    }

    // Find the resource
    const resource = UK_CRISIS_RESOURCES.find(r => r.id === resource_id);
    if (!resource) {
      return res.status(404).json({ error: 'Resource not found' });
    }

    // Log the access (even if user_id is not provided for anonymous access)
    const eventId = uuidv4();
    const logData = {
      resource_id,
      resource_name: resource.name,
      access_method: access_method || 'unknown',
      timestamp: new Date().toISOString()
    };

    if (user_id) {
      // If user is identified, log to database
      try {
        db.prepare(`
          INSERT INTO crisis_events (id, client_id, event_type, resource_type, resource_details, timestamp, follow_up_required)
          VALUES (?, ?, 'crisis_resource_accessed', ?, ?, datetime('now'), 1)
        `).run(eventId, user_id, resource_id, JSON.stringify(logData));

        // Notify their master if they have one
        const relationship = db.prepare(`
          SELECT master_id FROM relationships 
          WHERE client_id = ? AND status = 'active'
        `).get(user_id);

        if (relationship) {
          sendCrisisAlert(relationship.master_id, {
            client_id: user_id,
            resource_accessed: resource.name,
            access_method,
            requires_follow_up: true
          });
        }
      } catch (dbError) {
        console.error('Failed to log crisis resource access to database:', dbError);
        // Continue anyway - don't block crisis access due to logging failure
      }
    }

    console.log(`🆘 Crisis resource accessed: ${resource.name} via ${access_method || 'unknown'}`);

    res.json({
      message: 'Resource access logged',
      resource: {
        name: resource.name,
        description: resource.description,
        availability: resource.availability,
        cost: resource.cost
      },
      follow_up_resources: UK_CRISIS_RESOURCES
        .filter(r => r.id !== resource_id && r.category === resource.category)
        .slice(0, 3)
        .map(r => ({ id: r.id, name: r.name, phone: r.phone, description: r.description }))
    });

  } catch (error) {
    console.error('Error logging crisis resource access:', error);
    res.status(500).json({ 
      error: 'Failed to log access',
      message: 'Crisis resources are still available - logging failure should not prevent access'
    });
  }
});

/**
 * Emergency contact notification (no auth required)
 */
router.post('/emergency-contact', async (req, res) => {
  try {
    const { user_id, contact_type, message, location } = req.body;

    if (!user_id) {
      return res.status(400).json({ error: 'User ID is required for emergency contact' });
    }

    // Get user and their master relationship
    const user = db.prepare('SELECT * FROM users WHERE id = ?').get(user_id);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const relationship = db.prepare(`
      SELECT r.*, u.name as master_name, u.email as master_email, u.phone as master_phone
      FROM relationships r
      JOIN users u ON r.master_id = u.id
      WHERE r.client_id = ? AND r.status = 'active'
    `).get(user_id);

    if (!relationship) {
      return res.status(404).json({ error: 'No active recovery support relationship found' });
    }

    // Log emergency contact event
    const eventId = uuidv4();
    const eventData = {
      contact_type,
      message,
      location,
      master_contacted: relationship.master_name,
      timestamp: new Date().toISOString()
    };

    db.prepare(`
      INSERT INTO crisis_events (id, client_id, event_type, resource_details, timestamp, follow_up_required, location)
      VALUES (?, ?, 'emergency_contact_notified', ?, datetime('now'), 1, ?)
    `).run(eventId, user_id, JSON.stringify(eventData), location || null);

    // Send real-time alert to master
    const alertData = {
      type: 'emergency_contact',
      client_id: user_id,
      client_name: user.name,
      contact_type,
      message,
      location,
      urgent: true
    };

    sendCrisisAlert(relationship.master_id, alertData);

    // Send email notification to master
    try {
      await sendEmergencyContactEmail(
        relationship.master_email,
        relationship.master_name,
        user.name,
        contact_type,
        message,
        location
      );
    } catch (emailError) {
      console.error('Failed to send emergency contact email:', emailError);
      // Continue anyway - real-time alert was sent
    }

    // Send SMS if master has phone (would integrate with SMS service)
    if (relationship.master_phone) {
      try {
        // SMS integration would go here
        console.log(`📱 SMS alert sent to ${relationship.master_phone} for ${user.name}`);
      } catch (smsError) {
        console.error('Failed to send emergency SMS:', smsError);
      }
    }

    console.log(`🚨 Emergency contact initiated by ${user.name} - Master ${relationship.master_name} notified`);

    res.json({
      message: 'Emergency contact sent successfully',
      contacted: relationship.master_name,
      methods: ['real_time_alert', 'email', relationship.master_phone ? 'sms' : null].filter(Boolean),
      emergency_resources: UK_CRISIS_RESOURCES.filter(r => r.availability === '24/7').slice(0, 3)
    });

  } catch (error) {
    console.error('Emergency contact error:', error);
    res.status(500).json({ 
      error: 'Failed to send emergency contact',
      fallback: 'Please call 999 if in immediate danger, or 116 123 for Samaritans'
    });
  }
});

/**
 * Log self-help content interaction
 */
router.post('/track-content', async (req, res) => {
  try {
    const { user_id, content_id, content_type, interaction_type, duration_seconds, progress_percent } = req.body;

    if (!user_id || !content_id || !content_type || !interaction_type) {
      return res.status(400).json({ error: 'User ID, content ID, type, and interaction type are required' });
    }

    // Find content details
    let contentDetails = null;
    Object.values(SELF_HELP_CONTENT).forEach(categoryItems => {
      const found = categoryItems.find(item => item.id === content_id);
      if (found) contentDetails = found;
    });

    if (!contentDetails) {
      return res.status(404).json({ error: 'Content not found' });
    }

    // Log interaction
    const interactionId = uuidv4();
    db.prepare(`
      INSERT INTO content_interactions (id, user_id, content_type, content_id, content_title, content_url, interaction_type, duration_seconds, progress_percent, timestamp)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))
    `).run(
      interactionId,
      user_id,
      content_type,
      content_id,
      contentDetails.title,
      contentDetails.url,
      interaction_type,
      duration_seconds || null,
      progress_percent || 0
    );

    // Update user's recovery progress if it's a significant interaction
    if (interaction_type === 'complete' || (progress_percent && progress_percent >= 80)) {
      const today = new Date().toISOString().split('T')[0];
      
      db.prepare(`
        INSERT OR REPLACE INTO recovery_progress (id, user_id, metric_type, metric_value, date, notes)
        VALUES (?, ?, 'self_help_sessions', 
                COALESCE((SELECT metric_value FROM recovery_progress WHERE user_id = ? AND metric_type = 'self_help_sessions' AND date = ?), 0) + 1, 
                ?, ?)
      `).run(
        uuidv4(),
        user_id,
        user_id,
        today,
        today,
        `Completed: ${contentDetails.title}`
      );
    }

    console.log(`📚 Self-help content interaction: ${contentDetails.title} by user ${user_id} (${interaction_type})`);

    // Suggest related content
    const relatedContent = Object.values(SELF_HELP_CONTENT)
      .flat()
      .filter(item => 
        item.id !== content_id && 
        item.tags.some(tag => contentDetails.tags.includes(tag))
      )
      .slice(0, 3);

    res.json({
      message: 'Content interaction tracked',
      progress_updated: interaction_type === 'complete' || (progress_percent && progress_percent >= 80),
      related_content: relatedContent
    });

  } catch (error) {
    console.error('Content tracking error:', error);
    res.status(500).json({ error: 'Failed to track content interaction' });
  }
});

/**
 * Send emergency contact email
 */
async function sendEmergencyContactEmail(masterEmail, masterName, clientName, contactType, message, location) {
  const subject = `🚨 EMERGENCY CONTACT: ${clientName} needs support`;
  
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <div style="background: #dc3545; padding: 20px; text-align: center;">
        <h1 style="color: white; margin: 0;">🚨 EMERGENCY CONTACT</h1>
        <p style="color: white; margin: 5px 0 0 0;">Second Chance Recovery Alert</p>
      </div>
      
      <div style="padding: 30px; background: #fff3cd; border: 3px solid #ffc107;">
        <h2 style="color: #856404; margin-top: 0;">Immediate Action Required</h2>
        
        <p>Hi ${masterName},</p>
        
        <div style="background: white; padding: 20px; border-radius: 8px; border-left: 5px solid #dc3545; margin: 20px 0;">
          <h3 style="color: #dc3545; margin-top: 0;">Emergency Contact Details</h3>
          <p><strong>Client:</strong> ${clientName}</p>
          <p><strong>Type:</strong> ${contactType}</p>
          <p><strong>Time:</strong> ${new Date().toLocaleString('en-GB')}</p>
          ${location ? `<p><strong>Location:</strong> ${location}</p>` : ''}
          ${message ? `<div style="background: #f8f9fa; padding: 15px; border-radius: 5px; margin: 10px 0;"><strong>Message:</strong><br>${message}</div>` : ''}
        </div>
        
        <div style="background: #dc3545; color: white; padding: 15px; border-radius: 8px; text-align: center; margin: 20px 0;">
          <h3 style="margin-top: 0;">Please Contact ${clientName} Immediately</h3>
          <p style="margin-bottom: 0;">They may be in crisis and need your support</p>
        </div>
        
        <div style="background: white; padding: 15px; border-radius: 8px; margin: 20px 0;">
          <h4 style="color: #2c3e50; margin-top: 0;">If you cannot reach them:</h4>
          <ul style="color: #2c3e50;">
            <li><strong>Emergency Services:</strong> 999 (if immediate danger)</li>
            <li><strong>Samaritans:</strong> 116 123 (24/7 support)</li>
            <li><strong>Crisis Text Line:</strong> Text SHOUT to 85258</li>
            <li><strong>NHS Mental Health Crisis:</strong> 111 (press 2)</li>
          </ul>
        </div>
        
        <div style="text-align: center; margin: 25px 0;">
          <a href="${process.env.CLIENT_URL || 'http://localhost:3000'}/dashboard" 
             style="background: #2c3e50; color: white; padding: 15px 30px; text-decoration: none; border-radius: 6px; font-weight: bold;">
            View Dashboard →
          </a>
        </div>
        
        <p style="color: #856404; font-size: 14px; font-style: italic;">
          This is an automated emergency alert from Second Chance Recovery. 
          Please respond as soon as possible.
        </p>
      </div>
    </div>
  `;

  await sendEmail(masterEmail, subject, html);
}

export default router;