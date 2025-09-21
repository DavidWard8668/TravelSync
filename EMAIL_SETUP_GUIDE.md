# Email Service Setup Guide

## Required Environment Variables

Add these to your `.env` file:

```env
# Gmail SMTP Settings (for sending emails)
EMAIL_USER=exiledev8668@gmail.com
EMAIL_APP_PASSWORD=xxxx-xxxx-xxxx-xxxx  # Generate from Google Account settings

# Gmail API Settings (for monitoring inbox)
GMAIL_CLIENT_ID=your-client-id.apps.googleusercontent.com
GMAIL_CLIENT_SECRET=your-client-secret
GMAIL_REDIRECT_URI=http://localhost:3000/auth/callback
GMAIL_REFRESH_TOKEN=your-refresh-token

# Optional
DASHBOARD_URL=http://localhost:3000/dashboard
NODE_ENV=production
```

## Setup Steps

### 1. Generate Gmail App Password (for sending emails)

1. Go to https://myaccount.google.com/security
2. Enable 2-factor authentication if not already enabled
3. Go to "2-Step Verification" → "App passwords"
4. Generate a new app password for "Mail"
5. Copy the 16-character password to `EMAIL_APP_PASSWORD`

### 2. Setup Gmail API (for reading emails)

1. Go to https://console.cloud.google.com/
2. Create a new project or select existing
3. Enable Gmail API
4. Create OAuth 2.0 credentials
5. Download credentials and extract CLIENT_ID and CLIENT_SECRET
6. Use OAuth playground to get REFRESH_TOKEN:
   - Visit https://developers.google.com/oauthplayground
   - Select Gmail API v1 scopes
   - Authorize and get refresh token

### 3. Install Dependencies

```bash
cd server
npm install nodemailer googleapis node-cron
```

### 4. Test Email Service

```bash
# Test sending
node -e "
import emailService from './services/emailService.js';
emailService.sendTestResults({
  total: 10,
  passed: 8,
  failed: 2,
  duration: 45,
  failedTests: [
    {name: 'Test 1', error: 'Expected true to be false'},
    {name: 'Test 2', error: 'Timeout'}
  ]
}).then(console.log).catch(console.error);
"

# Test monitoring (requires API setup)
node -e "
import emailMonitor from './services/emailMonitor.js';
emailMonitor.checkInbox().then(console.log).catch(console.error);
"
```

## What You Can Do Now Without Credentials

1. **Review the code** - All email templates and logic are ready
2. **Test in dry-run mode** - Set `NODE_ENV=test` to log emails instead of sending
3. **Prepare database** - Run the email-schema.sql to set up tables
4. **Configure cron jobs** - They'll run but skip email sending without credentials

## Troubleshooting

### "Invalid credentials" error
- Regenerate app password
- Ensure 2FA is enabled
- Check if "Less secure app access" needs to be enabled

### "Quota exceeded" error
- Gmail has sending limits (500 emails/day for regular accounts)
- Consider using SendGrid or AWS SES for production

### Emails not being received
- Check spam folder
- Verify SPF/DKIM records if using custom domain
- Test with different recipient addresses

## Production Recommendations

1. Use a dedicated email service (SendGrid, AWS SES, Mailgun)
2. Implement retry logic for failed sends
3. Add email queue for bulk sending
4. Monitor bounce rates
5. Implement unsubscribe links for compliance

---

The email service is fully implemented and ready to use once you add the credentials!