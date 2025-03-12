// DOM Elements
const requestResetForm = document.getElementById('requestResetForm');
const resetPasswordForm = document.getElementById('resetPasswordForm');
const emailInput = document.getElementById('email');
const newPasswordInput = document.getElementById('newPassword');
const confirmNewPasswordInput = document.getElementById('confirmNewPassword');
const toggleNewPasswordBtn = document.getElementById('toggleNewPassword');
const toggleConfirmNewPasswordBtn = document.getElementById('toggleConfirmNewPassword');
const footerNewsletterForm = document.getElementById('footerNewsletterForm');

// Initialize page
document.addEventListener('DOMContentLoaded', () => {
    initializeEventListeners();
    checkResetToken();
});

// Initialize Event Listeners
function initializeEventListeners() {
    requestResetForm.addEventListener('submit', handleRequestReset);
    resetPasswordForm.addEventListener('submit', handleResetPassword);
    toggleNewPasswordBtn.addEventListener('click', () => togglePasswordVisibility(newPasswordInput, toggleNewPasswordBtn));
    toggleConfirmNewPasswordBtn.addEventListener('click', () => togglePasswordVisibility(confirmNewPasswordInput, toggleConfirmNewPasswordBtn));
    footerNewsletterForm.addEventListener('submit', handleNewsletterSubscription);
}

// Check for Reset Token
function checkResetToken() {
    const token = new URLSearchParams(window.location.search).get('token');
    if (token) {
        // Show reset password form and hide request form
        requestResetForm.classList.add('d-none');
        resetPasswordForm.classList.remove('d-none');
        
        // Update page title and description
        document.querySelector('.h4').textContent = 'Set New Password';
        document.querySelector('.text-muted').textContent = 'Please enter your new password below';
    }
}

// Handle Request Reset
async function handleRequestReset(e) {
    e.preventDefault();
    
    // Validate email
    if (!validateEmail()) {
        return;
    }

    const submitButton = requestResetForm.querySelector('button[type="submit"]');

    try {
        submitButton.disabled = true;
        submitButton.innerHTML = '<span class="spinner-border spinner-border-sm"></span> Sending...';

        const response = await fetch('/api/v1/auth/reset-password/request', {
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
            showAlert('Password reset instructions have been sent to your email.', 'success');
            emailInput.value = '';
        } else {
            throw new Error(data.message || 'Failed to send reset instructions. Please try again.');
        }
    } catch (error) {
        showAlert(error.message, 'danger');
    } finally {
        submitButton.disabled = false;
        submitButton.innerHTML = '<i class="fas fa-paper-plane me-2"></i>Send Reset Link';
    }
}

// Handle Reset Password
async function handleResetPassword(e) {
    e.preventDefault();
    
    // Validate form
    if (!validateResetForm()) {
        return;
    }

    const token = new URLSearchParams(window.location.search).get('token');
    const submitButton = resetPasswordForm.querySelector('button[type="submit"]');

    try {
        submitButton.disabled = true;
        submitButton.innerHTML = '<span class="spinner-border spinner-border-sm"></span> Resetting...';

        const response = await fetch('/api/v1/auth/reset-password', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                token,
                password: newPasswordInput.value
            })
        });

        const data = await response.json();

        if (response.ok) {
            showAlert('Password has been reset successfully! Redirecting to login...', 'success');
            setTimeout(() => {
                window.location.href = 'signin.html';
            }, 2000);
        } else {
            throw new Error(data.message || 'Failed to reset password. Please try again.');
        }
    } catch (error) {
        showAlert(error.message, 'danger');
    } finally {
        submitButton.disabled = false;
        submitButton.innerHTML = '<i class="fas fa-key me-2"></i>Reset Password';
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
function validateEmail() {
    if (!emailInput.value) {
        showFieldError(emailInput, 'Email is required');
        return false;
    } else if (!isValidEmail(emailInput.value)) {
        showFieldError(emailInput, 'Please enter a valid email address');
        return false;
    } else {
        clearFieldError(emailInput);
        return true;
    }
}

function validateResetForm() {
    let isValid = true;

    // New Password validation
    if (!newPasswordInput.value) {
        showFieldError(newPasswordInput, 'New password is required');
        isValid = false;
    } else if (newPasswordInput.value.length < 6) {
        showFieldError(newPasswordInput, 'Password must be at least 6 characters');
        isValid = false;
    } else {
        clearFieldError(newPasswordInput);
    }

    // Confirm Password validation
    if (!confirmNewPasswordInput.value) {
        showFieldError(confirmNewPasswordInput, 'Please confirm your new password');
        isValid = false;
    } else if (confirmNewPasswordInput.value !== newPasswordInput.value) {
        showFieldError(confirmNewPasswordInput, 'Passwords do not match');
        isValid = false;
    } else {
        clearFieldError(confirmNewPasswordInput);
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