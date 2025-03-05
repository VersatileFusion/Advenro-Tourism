// DOM Elements
const registerForm = document.getElementById('registerForm');
const firstNameInput = document.getElementById('firstName');
const lastNameInput = document.getElementById('lastName');
const emailInput = document.getElementById('email');
const passwordInput = document.getElementById('password');
const confirmPasswordInput = document.getElementById('confirmPassword');
const togglePasswordBtn = document.getElementById('togglePassword');
const toggleConfirmPasswordBtn = document.getElementById('toggleConfirmPassword');
const termsCheckbox = document.getElementById('terms');
const newsletterCheckbox = document.getElementById('newsletter');
const googleSignupBtn = document.getElementById('googleSignup');
const facebookSignupBtn = document.getElementById('facebookSignup');
const footerNewsletterForm = document.getElementById('footerNewsletterForm');

// Initialize page
document.addEventListener('DOMContentLoaded', () => {
    initializeEventListeners();
});

// Initialize Event Listeners
function initializeEventListeners() {
    registerForm.addEventListener('submit', handleRegistration);
    togglePasswordBtn.addEventListener('click', () => togglePasswordVisibility(passwordInput, togglePasswordBtn));
    toggleConfirmPasswordBtn.addEventListener('click', () => togglePasswordVisibility(confirmPasswordInput, toggleConfirmPasswordBtn));
    googleSignupBtn.addEventListener('click', handleGoogleSignup);
    facebookSignupBtn.addEventListener('click', handleFacebookSignup);
    footerNewsletterForm.addEventListener('submit', handleNewsletterSubscription);
}

// Handle Registration Form Submission
async function handleRegistration(e) {
    e.preventDefault();
    
    // Validate form
    if (!validateForm()) {
        return;
    }

    const submitButton = registerForm.querySelector('button[type="submit"]');
    const formData = {
        firstName: firstNameInput.value,
        lastName: lastNameInput.value,
        email: emailInput.value,
        password: passwordInput.value,
        subscribeNewsletter: newsletterCheckbox.checked
    };

    try {
        submitButton.disabled = true;
        submitButton.innerHTML = '<span class="spinner-border spinner-border-sm"></span> Creating Account...';

        const response = await fetch('/api/v1/auth/register', {
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
            
            // Show success message and redirect
            showAlert('Account created successfully! Redirecting to dashboard...', 'success');
            setTimeout(() => {
                window.location.href = 'dashboard.html';
            }, 2000);
        } else {
            throw new Error(data.message || 'Failed to create account. Please try again.');
        }
    } catch (error) {
        showAlert(error.message, 'danger');
    } finally {
        submitButton.disabled = false;
        submitButton.innerHTML = '<i class="fas fa-user-plus me-2"></i>Create Account';
    }
}

// Handle Google Signup
async function handleGoogleSignup() {
    try {
        // Initialize Google Sign-In
        const auth2 = await gapi.auth2.getAuthInstance();
        
        // Sign in with Google
        const googleUser = await auth2.signIn();
        const idToken = googleUser.getAuthResponse().id_token;

        // Send token to backend
        const response = await fetch('/api/v1/auth/google/register', {
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
            throw new Error(data.message || 'Failed to sign up with Google');
        }
    } catch (error) {
        showAlert(error.message, 'danger');
    }
}

// Handle Facebook Signup
async function handleFacebookSignup() {
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
                    reject(new Error('Facebook signup cancelled'));
                }
            }, { scope: 'email,public_profile' });
        });

        // Send token to backend
        const data = await fetch('/api/v1/auth/facebook/register', {
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
            throw new Error(data.message || 'Failed to sign up with Facebook');
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

    // First Name validation
    if (!firstNameInput.value) {
        showFieldError(firstNameInput, 'First name is required');
        isValid = false;
    } else {
        clearFieldError(firstNameInput);
    }

    // Last Name validation
    if (!lastNameInput.value) {
        showFieldError(lastNameInput, 'Last name is required');
        isValid = false;
    } else {
        clearFieldError(lastNameInput);
    }

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

    // Confirm Password validation
    if (!confirmPasswordInput.value) {
        showFieldError(confirmPasswordInput, 'Please confirm your password');
        isValid = false;
    } else if (confirmPasswordInput.value !== passwordInput.value) {
        showFieldError(confirmPasswordInput, 'Passwords do not match');
        isValid = false;
    } else {
        clearFieldError(confirmPasswordInput);
    }

    // Terms validation
    if (!termsCheckbox.checked) {
        showFieldError(termsCheckbox, 'You must agree to the Terms & Conditions');
        isValid = false;
    } else {
        clearFieldError(termsCheckbox);
    }

    return isValid;
}

// Helper Functions
function togglePasswordVisibility(input, button) {
    const type = input.getAttribute('type') === 'password' ? 'text' : 'password';
    input.setAttribute('type', type);
    button.querySelector('i').classList.toggle('fa-eye');
    button.querySelector('i').classList.toggle('fa-eye-slash');
}

function isValidEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function showFieldError(input, message) {
    const formGroup = input.closest('.mb-3') || input.closest('.col-12');
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