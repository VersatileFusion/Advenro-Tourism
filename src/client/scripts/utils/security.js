// Security Utilities

// CSRF Token Management
let csrfToken = null;

export const initializeCsrf = async () => {
    try {
        const response = await fetch('/api/security/csrf-token', {
            credentials: 'include' // Important for session cookie handling
        });
        if (!response.ok) throw new Error('Failed to get CSRF token');
        const data = await response.json();
        csrfToken = data.token;
        return csrfToken;
    } catch (error) {
        console.error('CSRF initialization failed:', error);
        throw error;
    }
};

export const getCsrfToken = () => csrfToken;

// Secure Fetch Wrapper with CSRF Protection
export const secureFetch = async (url, options = {}) => {
    if (!csrfToken) {
        await initializeCsrf();
    }

    const defaultHeaders = {
        'X-CSRF-Token': csrfToken,
        'Content-Type': 'application/json'
    };

    const secureOptions = {
        ...options,
        credentials: 'include',
        headers: {
            ...defaultHeaders,
            ...options.headers
        }
    };

    const response = await fetch(url, secureOptions);

    // Handle 403 (Forbidden) - might indicate CSRF token expiration
    if (response.status === 403) {
        await initializeCsrf(); // Refresh CSRF token
        secureOptions.headers['X-CSRF-Token'] = csrfToken;
        return fetch(url, secureOptions);
    }

    return response;
};

// Input Sanitization
export const sanitizeInput = (input) => {
    if (typeof input !== 'string') return input;
    
    return input
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#x27;')
        .replace(/\//g, '&#x2F;');
};

// Form Data Sanitization
export const sanitizeFormData = (formData) => {
    const sanitizedData = {};
    for (const [key, value] of formData.entries()) {
        sanitizedData[key] = sanitizeInput(value);
    }
    return sanitizedData;
};

// Session Management
export const SessionManager = {
    // Check session status
    checkSession: async () => {
        try {
            const response = await secureFetch('/api/auth/session');
            return response.ok;
        } catch (error) {
            return false;
        }
    },

    // Get session info
    getSessionInfo: async () => {
        try {
            const response = await secureFetch('/api/auth/session');
            if (!response.ok) throw new Error('Session invalid');
            return response.json();
        } catch (error) {
            throw new Error('Failed to get session info');
        }
    },

    // Refresh session
    refreshSession: async () => {
        try {
            const response = await secureFetch('/api/auth/refresh', {
                method: 'POST'
            });
            return response.ok;
        } catch (error) {
            return false;
        }
    },

    // Handle session timeout
    startSessionTimer: (timeoutMinutes = 30) => {
        let warningShown = false;
        const warningThreshold = 5 * 60 * 1000; // 5 minutes before expiry

        const checkTime = async () => {
            try {
                const sessionInfo = await SessionManager.getSessionInfo();
                const expiresAt = new Date(sessionInfo.expiresAt).getTime();
                const now = Date.now();
                const timeLeft = expiresAt - now;

                if (timeLeft <= 0) {
                    // Session expired
                    window.location.href = '/signin.html?session=expired';
                } else if (timeLeft <= warningThreshold && !warningShown) {
                    // Show warning 5 minutes before expiry
                    warningShown = true;
                    showSessionWarning(Math.floor(timeLeft / 60000));
                }
            } catch (error) {
                console.error('Session check failed:', error);
            }
        };

        // Check every minute
        setInterval(checkTime, 60000);
        checkTime(); // Initial check
    }
};

// Session Warning UI
const showSessionWarning = (minutesLeft) => {
    const warningDiv = document.createElement('div');
    warningDiv.className = 'session-warning';
    warningDiv.innerHTML = `
        <div class="session-warning-content">
            <i class="fas fa-clock"></i>
            <span>Your session will expire in ${minutesLeft} minutes</span>
            <div class="session-warning-actions">
                <button class="btn-primary" onclick="extendSession()">Extend Session</button>
                <button class="btn-secondary" onclick="logout()">Logout</button>
            </div>
        </div>
    `;

    document.body.appendChild(warningDiv);
};

// Global handlers for session management
window.extendSession = async () => {
    try {
        const success = await SessionManager.refreshSession();
        if (success) {
            const warningElement = document.querySelector('.session-warning');
            if (warningElement) {
                warningElement.remove();
            }
        } else {
            window.location.href = '/signin.html?session=expired';
        }
    } catch (error) {
        console.error('Failed to extend session:', error);
    }
};

window.logout = () => {
    window.location.href = '/logout';
}; 