# 🛡️ Second Chance - Professional Recovery Support System

> **Enterprise-grade addiction recovery support application with admin oversight and 24/7 crisis resources**

[![PWA Ready](https://img.shields.io/badge/PWA-Ready-blue.svg)](https://web.dev/pwa-checklist/)
[![Crisis Support](https://img.shields.io/badge/Crisis%20Support-24%2F7-red.svg)](tel:988)
[![Offline First](https://img.shields.io/badge/Offline-First-green.svg)](#offline-capabilities)
[![Admin Oversight](https://img.shields.io/badge/Admin-Oversight-orange.svg)](#admin-oversight-system)
[![Professional Grade](https://img.shields.io/badge/Professional-Grade-purple.svg)](#enterprise-features)

## 🌟 **Developed Through Claude-to-Claude Collaboration**

Second Chance was built through an innovative overnight collaboration between **Second-Chance-Claude** and **Quick-Shop-Claude** (creator of the production-ready CartPilot application). This represents a breakthrough in AI-to-AI collaborative development, combining the proven patterns from CartPilot with specialized addiction recovery support features.

---

## 🎯 **Mission Statement**

Second Chance empowers individuals in addiction recovery by providing a professional support system with secondary admin oversight, ensuring accountability while maintaining dignity and providing immediate access to crisis resources.

## ✨ **Key Features**

### 🛡️ **Core Recovery Support**
- **Admin Oversight System**: Secondary user approval workflow for app access
- **Professional Recovery Dashboard**: Beautiful, sensitive interface designed for recovery
- **Real-time App Monitoring**: Snapchat, Telegram, Instagram, TikTok, and custom apps
- **Crisis Support Integration**: 24/7 access to 988, 741741, and SAMHSA resources
- **Recovery Progress Tracking**: Clean days, success rates, and milestone celebrations

### 🌐 **PWA Excellence (CartPilot-Inspired)**
- **Offline-First Architecture**: Crisis support works without internet
- **Service Worker Caching**: Intelligent caching with crisis resource priority
- **Background Sync**: Data synchronization when connection restored
- **Push Notifications**: Recovery support and crisis alerts
- **Install Prompts**: Native app-like installation experience

### 🏗️ **Enterprise Architecture**
- **Comprehensive Error Handling**: Crisis-aware error management with self-healing
- **TypeScript Ready**: Structured for type safety and maintainability
- **Automated Testing**: Unit, integration, E2E, performance, and security tests
- **Production Build Pipeline**: Clean builds with validation and reporting
- **Performance Optimization**: <3 second load times, optimized bundles

### 🚨 **Crisis Support Priority**
- **Always Available**: 988 Suicide Prevention, 741741 Crisis Text Line
- **Offline Resilience**: Crisis resources cached and accessible without internet
- **Priority Routing**: Crisis-related requests bypass normal error handling
- **Emergency Protocols**: Automated escalation for crisis-related errors

---

## 🚀 **Quick Start**

### **Prerequisites**
- Node.js 18+ 
- npm or yarn
- Modern web browser with PWA support

### **Installation**
```bash
# Clone the repository
git clone https://github.com/your-org/second-chance.git
cd second-chance

# Install dependencies
cd SecondChanceApp
npm install

# Start the development server
npm start
```

### **Access Points**
- **Recovery Dashboard**: http://localhost:3001/dashboard.html
- **API Health Check**: http://localhost:3001/api/health
- **Crisis Resources**: http://localhost:3001/api/crisis-resources

### **PWA Installation**
1. Open dashboard in Chrome/Edge
2. Look for "Install Second Chance" prompt
3. Click install for native app experience

---

## 🏛️ **System Architecture**

```
Second Chance Recovery Support System
├── 🌐 Web Dashboard (PWA)
│   ├── Professional recovery interface
│   ├── Real-time monitoring display
│   ├── Crisis support integration
│   └── Admin request management
├── 🔧 Express.js API Server
│   ├── REST API with full CRUD operations
│   ├── Crisis-aware error handling
│   ├── Admin oversight workflows
│   └── Recovery progress tracking
├── 📱 React Native Mobile App
│   ├── Cross-platform iOS/Android
│   ├── Device admin capabilities
│   ├── App monitoring services
│   └── Uninstall protection
├── 🧪 Comprehensive Testing Suite
│   ├── Unit tests (Jest)
│   ├── Integration tests (API endpoints)
│   ├── E2E tests (User workflows)
│   ├── Performance tests (<1s API responses)
│   └── Security tests (OWASP compliance)
└── 🤖 Autonomous Development Tools
    ├── Overnight automation scripts
    ├── Production build pipeline
    ├── Self-healing capabilities
    └── Comprehensive documentation
```

---

## 🔧 **API Documentation**

### **Core Endpoints**

#### Health Check
```http
GET /api/health
```

#### Crisis Resources
```http
GET /api/crisis-resources
```

#### Monitored Apps
```http
GET /api/monitored-apps
POST /api/monitored-apps
PUT /api/monitored-apps/:id
DELETE /api/monitored-apps/:id
```

#### Admin Requests
```http
GET /api/admin-requests
POST /api/admin-requests/:id/approved
POST /api/admin-requests/:id/denied
```

---

## 🧪 **Testing & Quality Assurance**

### **Comprehensive Test Suite**
```bash
# Run all tests
powershell -ExecutionPolicy Bypass -File "test-infrastructure/setup-tests.ps1"

# Run production build with tests
powershell -ExecutionPolicy Bypass -File "test-infrastructure/production-build.ps1"

# Run overnight automation
powershell -ExecutionPolicy Bypass -File "test-infrastructure/overnight-automation.ps1"
```

### **Test Coverage Goals**
- **Unit Tests**: >90% code coverage
- **Integration Tests**: All API endpoints
- **E2E Tests**: Critical user workflows
- **Performance Tests**: <1s API responses
- **Security Tests**: OWASP compliance

---

## 🆘 **Crisis Support Resources**

### **Immediate Help Available 24/7**
- **🇺🇸 Suicide Prevention**: **988**
- **📱 Crisis Text Line**: **741741** (Text "HOME")
- **🏥 SAMHSA Helpline**: **1-800-662-4357**

### **Emergency Protocols**
If you or someone you know is in immediate danger:
1. **Call 911** or go to nearest emergency room
2. **Stay with the person** if safe to do so
3. **Call crisis hotline** for professional guidance

---

## 💖 **Remember**

> **"Recovery is possible. You are not alone. Help is available 24/7."**

If you're struggling with addiction or having thoughts of self-harm:
- **🇺🇸 Call 988** - Suicide & Crisis Lifeline
- **📱 Text HOME to 741741** - Crisis Text Line  

**Every day sober is a victory. Every person in recovery matters. Every life has value.**

---

*🤖 Developed through Claude-to-Claude collaboration - Second-Chance-Claude & Quick-Shop-Claude*  
*🛡️ Professional addiction recovery support system with 24/7 crisis resources*  
*💪 Built with love, hope, and commitment to saving lives*

---

**© 2025 Second Chance Recovery Support System. Built to save lives and support recovery.**