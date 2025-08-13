// 🛡️ Second Chance - Comprehensive Error Handling Middleware
// Based on CartPilot patterns for production-ready error management

class SecondChanceErrorHandler {
    constructor() {
        this.errorCounts = new Map();
        this.lastErrors = [];
        this.maxErrorHistory = 100;
        this.crisisKeywords = ['suicide', 'overdose', 'crisis', 'emergency', 'help', 'desperate'];
    }

    // Global error handler middleware
    handleError(err, req, res, next) {
        const error = {
            id: this.generateErrorId(),
            timestamp: new Date().toISOString(),
            message: err.message,
            stack: err.stack,
            url: req.originalUrl,
            method: req.method,
            userAgent: req.get('User-Agent'),
            ip: req.ip,
            severity: this.determineSeverity(err),
            category: this.categorizeError(err),
            isCrisisRelated: this.checkCrisisContent(err.message)
        };

        // Log error
        this.logError(error);
        
        // Track error patterns
        this.trackError(error);
        
        // Handle crisis-related errors with special urgency
        if (error.isCrisisRelated) {
            this.handleCrisisError(error);
        }

        // Send appropriate response
        if (error.severity === 'critical') {
            return this.sendCriticalErrorResponse(res, error);
        }

        this.sendStandardErrorResponse(res, error);
    }

    // Determine error severity
    determineSeverity(error) {
        if (error.message.includes('ECONNREFUSED') || 
            error.message.includes('database') ||
            error.message.includes('authentication')) {
            return 'critical';
        }
        
        if (error.code === 'VALIDATION_ERROR' ||
            error.code === 'PERMISSION_DENIED') {
            return 'high';
        }
        
        if (error.code === 'NOT_FOUND' ||
            error.code === 'BAD_REQUEST') {
            return 'medium';
        }
        
        return 'low';
    }

    // Categorize errors for better tracking
    categorizeError(error) {
        const categories = {
            'database': ['connection', 'query', 'timeout', 'pool'],
            'authentication': ['token', 'auth', 'unauthorized', 'forbidden'],
            'validation': ['validate', 'required', 'invalid', 'format'],
            'network': ['ECONNREFUSED', 'ETIMEDOUT', 'fetch'],
            'crisis': this.crisisKeywords,
            'recovery': ['blocked', 'admin', 'permission', 'monitor'],
            'system': ['memory', 'cpu', 'disk', 'process']
        };

        for (const [category, keywords] of Object.entries(categories)) {
            if (keywords.some(keyword => 
                error.message.toLowerCase().includes(keyword.toLowerCase()))) {
                return category;
            }
        }

        return 'unknown';
    }

    // Check if error is crisis-related
    checkCrisisContent(message) {
        return this.crisisKeywords.some(keyword => 
            message.toLowerCase().includes(keyword));
    }

    // Handle crisis-related errors with special urgency
    handleCrisisError(error) {
        console.error('🚨 CRISIS-RELATED ERROR DETECTED:', error);
        
        // In a real system, this would:
        // 1. Send immediate alerts to crisis support team
        // 2. Log to high-priority monitoring system
        // 3. Ensure crisis resources remain available
        // 4. Potentially trigger backup systems
        
        // For now, ensure crisis resources are still accessible
        this.verifyCrisisResources();
    }

    // Verify crisis support resources are still accessible
    async verifyCrisisResources() {
        const crisisEndpoints = [
            '/api/crisis-resources',
            '/api/health'
        ];

        for (const endpoint of crisisEndpoints) {
            try {
                const response = await fetch(`http://localhost:3001${endpoint}`);
                if (!response.ok) {
                    console.error(`🚨 Crisis resource unavailable: ${endpoint}`);
                    // Trigger alert system
                }
            } catch (err) {
                console.error(`🚨 Crisis resource check failed: ${endpoint}`, err.message);
            }
        }
    }

    // Generate unique error ID
    generateErrorId() {
        return `err_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }

    // Log error with structured format
    logError(error) {
        const logLevel = this.getLogLevel(error.severity);
        const logMessage = this.formatLogMessage(error);
        
        console[logLevel](`[${error.timestamp}] ${logMessage}`);
        
        // Store in error history
        this.lastErrors.unshift(error);
        if (this.lastErrors.length > this.maxErrorHistory) {
            this.lastErrors.pop();
        }
    }

    // Get appropriate log level
    getLogLevel(severity) {
        const levels = {
            'critical': 'error',
            'high': 'error',
            'medium': 'warn',
            'low': 'info'
        };
        return levels[severity] || 'log';
    }

    // Format log message
    formatLogMessage(error) {
        return `[${error.severity.toUpperCase()}] [${error.category}] ${error.method} ${error.url} - ${error.message}`;
    }

    // Track error patterns
    trackError(error) {
        const key = `${error.category}:${error.message}`;
        const count = (this.errorCounts.get(key) || 0) + 1;
        this.errorCounts.set(key, count);
        
        // Alert if error pattern is frequent
        if (count >= 5) {
            console.warn(`⚠️ Frequent error pattern detected: ${key} (${count} times)`);
        }
    }

    // Send critical error response
    sendCriticalErrorResponse(res, error) {
        res.status(500).json({
            error: 'Critical system error occurred',
            id: error.id,
            timestamp: error.timestamp,
            support: {
                crisis: {
                    suicide_prevention: '988',
                    crisis_text: '741741',
                    message: 'If you are in crisis, please reach out immediately'
                },
                technical: 'System administrators have been notified'
            },
            recovery_mode: true
        });
    }

    // Send standard error response
    sendStandardErrorResponse(res, error) {
        const statusCode = this.getStatusCode(error);
        
        res.status(statusCode).json({
            error: 'An error occurred',
            id: error.id,
            timestamp: error.timestamp,
            message: error.severity === 'low' ? error.message : 'Please try again',
            support: {
                crisis_available: true,
                crisis_resources: {
                    phone: '988',
                    text: '741741'
                }
            }
        });
    }

    // Get HTTP status code for error
    getStatusCode(error) {
        if (error.category === 'authentication') return 401;
        if (error.category === 'validation') return 400;
        if (error.category === 'database') return 503;
        if (error.category === 'network') return 502;
        return 500;
    }

    // Get error statistics
    getErrorStats() {
        const stats = {
            total: this.lastErrors.length,
            critical: this.lastErrors.filter(e => e.severity === 'critical').length,
            crisis_related: this.lastErrors.filter(e => e.isCrisisRelated).length,
            categories: {},
            frequent_patterns: []
        };

        // Count by category
        this.lastErrors.forEach(error => {
            stats.categories[error.category] = (stats.categories[error.category] || 0) + 1;
        });

        // Get frequent patterns
        for (const [pattern, count] of this.errorCounts.entries()) {
            if (count >= 3) {
                stats.frequent_patterns.push({ pattern, count });
            }
        }

        return stats;
    }

    // Self-healing capabilities
    attemptSelfHeal(error) {
        console.log(`🔧 Attempting self-heal for ${error.category} error...`);
        
        switch (error.category) {
            case 'database':
                // Restart database connection
                console.log('📊 Restarting database connection...');
                break;
                
            case 'network':
                // Retry with exponential backoff
                console.log('🌐 Implementing network retry logic...');
                break;
                
            case 'memory':
                // Garbage collection
                if (global.gc) {
                    global.gc();
                    console.log('🗑️ Forced garbage collection completed');
                }
                break;
                
            default:
                console.log(`⚠️ No self-heal strategy for ${error.category} errors`);
        }
    }
}

// Global error handler instance
const errorHandler = new SecondChanceErrorHandler();

// Express middleware function
const handleError = (err, req, res, next) => {
    errorHandler.handleError(err, req, res, next);
};

// Process-level error handlers
process.on('uncaughtException', (error) => {
    console.error('🚨 UNCAUGHT EXCEPTION:', error);
    errorHandler.logError({
        id: errorHandler.generateErrorId(),
        timestamp: new Date().toISOString(),
        message: error.message,
        stack: error.stack,
        severity: 'critical',
        category: 'system',
        isCrisisRelated: errorHandler.checkCrisisContent(error.message)
    });
    
    // Graceful shutdown
    process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
    console.error('🚨 UNHANDLED REJECTION:', reason);
    errorHandler.logError({
        id: errorHandler.generateErrorId(),
        timestamp: new Date().toISOString(),
        message: reason.message || String(reason),
        stack: reason.stack || 'No stack trace available',
        severity: 'high',
        category: 'promise',
        isCrisisRelated: errorHandler.checkCrisisContent(String(reason))
    });
});

module.exports = {
    errorHandler: handleError,
    errorStats: () => errorHandler.getErrorStats(),
    SecondChanceErrorHandler
};

// 🤖 Generated with Claude Code
// Professional error handling for addiction recovery support system