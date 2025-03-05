// DOM Elements
const loginForm = document.getElementById('loginForm');
const emailInput = document.getElementById('email');
const passwordInput = document.getElementById('password');
const togglePasswordBtn = document.getElementById('togglePassword');
const rememberMeCheckbox = document.getElementById('rememberMe');
const googleLoginBtn = document.getElementById('googleLogin');
const facebookLoginBtn = document.getElementById('facebookLogin');
const footerNewsletterForm = document.getElementById('footerNewsletterForm');

// Initialize page
document.addEventListener('DOMContentLoaded', () => {
    initializeEventListeners();
    checkRememberedUser();
});

// Initialize Event Listeners
function initializeEventListeners() {
    loginForm.addEventListener('submit', handleLogin);
    togglePasswordBtn.addEventListener('click', togglePasswordVisibility);
    googleLoginBtn.addEventListener('click', handleGoogleLogin);
    facebookLoginBtn.addEventListener('click', handleFacebookLogin);
    footerNewsletterForm.addEventListener('submit', handleNewsletterSubscription);
}

// Handle Login Form Submission
async function handleLogin(e) {
    e.preventDefault();
    
    // Validate form
    if (!validateForm()) {
        return;
    }

    const submitButton = loginForm.querySelector('button[type="submit"]');
    const formData = {
        email: emailInput.value,
        password: passwordInput.value,
        rememberMe: rememberMeCheckbox.checked
    };

    try {
        submitButton.disabled = true;
        submitButton.innerHTML = '<span class="spinner-border spinner-border-sm"></span> Signing in...';

        const response = await fetch('/api/v1/auth/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(formData)
        });

        const data = await response.json();

        if (response.ok) {
            // Store auth token
            localStorage.setItem('authToken', data.token);
            
            // Store user data if remember me is checked
            if (rememberMeCheckbox.checked) {
                localStorage.setItem('userEmail', emailInput.value);
            } else {
                localStorage.removeItem('userEmail');
            }

            // Redirect to dashboard or previous page
            const redirectUrl = new URLSearchParams(window.location.search).get('redirect') || 'dashboard.html';
            window.location.href = redirectUrl;
        } else {
            throw new Error(data.message || 'Invalid email or password');
        }
    } catch (error) {
        showAlert(error.message, 'danger');
    } finally {
        submitButton.disabled = false;
        submitButton.innerHTML = '<i class="fas fa-sign-in-alt me-2"></i>Sign In';
    }
}

// Handle Google Login
async function handleGoogleLogin() {
    try {
        // Initialize Google Sign-In
        const auth2 = await gapi.auth2.getAuthInstance();
        
        // Sign in with Google
        const googleUser = await auth2.signIn();
        const idToken = googleUser.getAuthResponse().id_token;

        // Send token to backend
        const response = await fetch('/api/v1/auth/google', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ idToken })
        });

        const data = await response.json();

        if (response.ok) {
            localStorage.setItem('authToken', data.token);
            window.location.href = 'dashboard.html';
        } else {
            throw new Error(data.message || 'Failed to login with Google');
        }
    } catch (error) {
        showAlert(error.message, 'danger');
    }
}

// Handle Facebook Login
async function handleFacebookLogin() {
    try {
        // Initialize Facebook SDK
        FB.init({
            appId: 'YOUR_FACEBOOK_APP_ID',
            cookie: true,
            xfbml: true,
            version: 'v12.0'
        });

        // Login with Facebook
        const response = await new Promise((resolve, reject) => {
            FB.login(response => {
                if (response.authResponse) {
                    resolve(response.authResponse);
                } else {
                    reject(new Error('Facebook login cancelled'));
                }
            }, { scope: 'email,public_profile' });
        });

        // Send token to backend
        const data = await fetch('/api/v1/auth/facebook', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ accessToken: response.accessToken })
        }).then(res => res.json());

        if (data.token) {
            localStorage.setItem('authToken', data.token);
            window.location.href = 'dashboard.html';
        } else {
            throw new Error(data.message || 'Failed to login with Facebook');
        }
    } catch (error) {
        showAlert(error.message, 'danger');
    }
}

// Handle Newsletter Subscription
async function handleNewsletterSubscription(e) {
    e.preventDefault();
    
    const emailInput = e.target.querySelector('input[type="email"]');
    const submitButton = e.target.querySelector('button[type="submit"]');
    
    if (!emailInput.value) {
        showAlert('Please enter your email address.', 'danger');
        return;
    }

    try {
        submitButton.disabled = true;
        submitButton.innerHTML = '<span class="spinner-border spinner-border-sm"></span> Subscribing...';

        const response = await fetch('/api/v1/booking/newsletter/subscribe', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                email: emailInput.value
            })
        });

        const data = await response.json();

        if (response.ok) {
            showAlert('Thank you for subscribing to our newsletter!', 'success');
            emailInput.value = '';
        } else {
            throw new Error(data.message || 'Failed to subscribe. Please try again.');
        }
    } catch (error) {
        showAlert(error.message, 'danger');
    } finally {
        submitButton.disabled = false;
        submitButton.innerHTML = 'Subscribe';
    }
}

// Form Validation
function validateForm() {
    let isValid = true;

    // Email validation
    if (!emailInput.value) {
        showFieldError(emailInput, 'Email is required');
        isValid = false;
    } else if (!isValidEmail(emailInput.value)) {
        showFieldError(emailInput, 'Please enter a valid email address');
        isValid = false;
    } else {
        clearFieldError(emailInput);
    }

    // Password validation
    if (!passwordInput.value) {
        showFieldError(passwordInput, 'Password is required');
        isValid = false;
    } else if (passwordInput.value.length < 6) {
        showFieldError(passwordInput, 'Password must be at least 6 characters');
        isValid = false;
    } else {
        clearFieldError(passwordInput);
    }

    return isValid;
}

// Helper Functions
function togglePasswordVisibility() {
    const type = passwordInput.getAttribute('type') === 'password' ? 'text' : 'password';
    passwordInput.setAttribute('type', type);
    togglePasswordBtn.querySelector('i').classList.toggle('fa-eye');
    togglePasswordBtn.querySelector('i').classList.toggle('fa-eye-slash');
}

function checkRememberedUser() {
    const rememberedEmail = localStorage.getItem('userEmail');
    if (rememberedEmail) {
        emailInput.value = rememberedEmail;
        rememberMeCheckbox.checked = true;
    }
}

function isValidEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function showFieldError(input, message) {
    const formGroup = input.closest('.mb-3');
    const errorDiv = formGroup.querySelector('.invalid-feedback') || 
                    createErrorElement(formGroup);
    errorDiv.textContent = message;
    input.classList.add('is-invalid');
}

function clearFieldError(input) {
    input.classList.remove('is-invalid');
}

function createErrorElement(formGroup) {
    const errorDiv = document.createElement('div');
    errorDiv.className = 'invalid-feedback';
    formGroup.appendChild(errorDiv);
    return errorDiv;
}

function showAlert(message, type) {
    const alert = document.createElement('div');
    alert.className = `alert alert-${type} alert-dismissible fade show position-fixed top-0 start-50 translate-middle-x mt-3`;
    alert.style.zIndex = '1050';
    alert.innerHTML = `
        ${message}
        <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
    `;

    document.body.appendChild(alert);

    setTimeout(() => {
        const bsAlert = new bootstrap.Alert(alert);
        bsAlert.close();
    }, 5000);
} 