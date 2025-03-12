import { validateForm, showError, createLoadingSpinner } from './utils/ui-components.js';
import { secureFetch, sanitizeFormData, SessionManager } from './utils/security.js';

// Initialize security features
document.addEventListener('DOMContentLoaded', async () => {
    try {
        // Start session management
        SessionManager.startSessionTimer();

        // Load page content
        const [headerResponse, footerResponse] = await Promise.all([
            secureFetch('/partials/header.html'),
            secureFetch('/partials/footer.html')
        ]);

        const [headerHtml, footerHtml] = await Promise.all([
            headerResponse.text(),
            footerResponse.text()
        ]);

        document.getElementById('header').innerHTML = headerHtml;
        document.getElementById('footer').innerHTML = footerHtml;

        // Load user data after header/footer
        await loadUserProfile();
        await loadUserBookings();
    } catch (error) {
        showError('Failed to load page content', 'main');
    }
});

// Load user profile data
async function loadUserProfile() {
    try {
        const spinner = createLoadingSpinner();
        document.querySelector('.profile-content').prepend(spinner);

        const response = await secureFetch('/api/user/profile');
        if (!response.ok) throw new Error('Failed to load profile');

        const userData = await response.json();
        populateProfileData(userData);
    } catch (error) {
        showError('Failed to load profile data', 'main');
    } finally {
        const spinner = document.querySelector('.loading-spinner');
        if (spinner) spinner.remove();
    }
}

// Populate profile form fields with sanitized data
function populateProfileData(userData) {
    // Personal Information
    document.getElementById('fullName').value = sanitizeInput(userData.fullName || '');
    document.getElementById('email').value = sanitizeInput(userData.email || '');
    document.getElementById('phone').value = sanitizeInput(userData.phone || '');
    document.getElementById('location').value = sanitizeInput(userData.location || '');

    // Profile Image
    if (userData.profileImage) {
        document.getElementById('profile-image').src = sanitizeInput(userData.profileImage);
    }

    // Travel Preferences
    if (userData.preferences) {
        // Set preferred destinations
        const destSelect = document.getElementById('preferredDestinations');
        userData.preferences.destinations?.forEach(dest => {
            const option = destSelect.querySelector(`option[value="${sanitizeInput(dest)}"]`);
            if (option) option.selected = true;
        });

        // Set travel style
        if (userData.preferences.travelStyle) {
            document.getElementById('travelStyle').value = sanitizeInput(userData.preferences.travelStyle);
        }

        // Set interests
        userData.preferences.interests?.forEach(interest => {
            const checkbox = document.querySelector(`input[name="interests"][value="${sanitizeInput(interest)}"]`);
            if (checkbox) checkbox.checked = true;
        });
    }
}

// Handle profile image upload
document.querySelector('.change-avatar-btn').addEventListener('click', () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.onchange = async (e) => {
        const file = e.target.files[0];
        if (file) {
            try {
                const formData = new FormData();
                formData.append('profileImage', file);

                const response = await secureFetch('/api/user/profile/image', {
                    method: 'POST',
                    body: formData,
                    headers: {} // Let the browser set the correct Content-Type for FormData
                });

                if (!response.ok) throw new Error('Failed to upload image');

                const { imageUrl } = await response.json();
                document.getElementById('profile-image').src = sanitizeInput(imageUrl);
            } catch (error) {
                showError('Failed to upload profile image', 'main');
            }
        }
    };
    input.click();
});

// Handle personal information form submission
document.getElementById('personal-info-form').addEventListener('submit', async (e) => {
    e.preventDefault();

    const validationRules = {
        fullName: { required: true, minLength: 2 },
        email: { required: true, email: true },
        phone: { pattern: /^\+?[\d\s-]{10,}$/ },
    };

    const { isValid, errors } = validateForm(e.target, validationRules);
    
    if (!isValid) {
        return;
    }

    try {
        const formData = new FormData(e.target);
        const sanitizedData = sanitizeFormData(formData);
        
        const response = await secureFetch('/api/user/profile', {
            method: 'PUT',
            body: JSON.stringify(sanitizedData)
        });

        if (!response.ok) throw new Error('Failed to update profile');

        showSuccess('Personal information updated successfully');
    } catch (error) {
        showError('Failed to update personal information', 'main');
    }
});

// Handle travel preferences form submission
document.getElementById('preferences-form').addEventListener('submit', async (e) => {
    e.preventDefault();

    try {
        const formData = new FormData(e.target);
        const preferences = {
            destinations: Array.from(formData.getAll('preferredDestinations')).map(sanitizeInput),
            travelStyle: sanitizeInput(formData.get('travelStyle')),
            interests: Array.from(formData.getAll('interests')).map(sanitizeInput)
        };

        const response = await secureFetch('/api/user/preferences', {
            method: 'PUT',
            body: JSON.stringify(preferences)
        });

        if (!response.ok) throw new Error('Failed to update preferences');

        showSuccess('Travel preferences updated successfully');
    } catch (error) {
        showError('Failed to update travel preferences', 'main');
    }
});

// Handle security form submission
document.getElementById('security-form').addEventListener('submit', async (e) => {
    e.preventDefault();

    const validationRules = {
        currentPassword: { required: true },
        newPassword: { required: true, minLength: 8 },
        confirmPassword: { required: true }
    };

    const { isValid, errors } = validateForm(e.target, validationRules);
    
    if (!isValid) {
        return;
    }

    const newPassword = e.target.newPassword.value;
    const confirmPassword = e.target.confirmPassword.value;

    if (newPassword !== confirmPassword) {
        showError('New passwords do not match', 'security-form');
        return;
    }

    try {
        const formData = new FormData(e.target);
        const response = await secureFetch('/api/user/password', {
            method: 'PUT',
            body: JSON.stringify({
                currentPassword: formData.get('currentPassword'),
                newPassword: formData.get('newPassword')
            })
        });

        if (!response.ok) throw new Error('Failed to update password');

        showSuccess('Password updated successfully');
        e.target.reset();
    } catch (error) {
        showError('Failed to update password', 'security-form');
    }
});

// Load user bookings
async function loadUserBookings() {
    try {
        const spinner = createLoadingSpinner();
        document.getElementById('bookings-list').appendChild(spinner);

        const response = await secureFetch('/api/user/bookings');
        if (!response.ok) throw new Error('Failed to load bookings');

        const bookings = await response.json();
        displayBookings(bookings);
    } catch (error) {
        showError('Failed to load bookings', 'bookings-list');
    } finally {
        const spinner = document.querySelector('#bookings-list .loading-spinner');
        if (spinner) spinner.remove();
    }
}

// Display bookings in the UI with sanitized data
function displayBookings(bookings) {
    const container = document.getElementById('bookings-list');
    
    if (!bookings.length) {
        container.innerHTML = '<p class="no-bookings">No bookings found</p>';
        return;
    }

    const bookingsHtml = bookings.map(booking => `
        <div class="booking-card">
            <div class="booking-header">
                <h3>${sanitizeInput(booking.title)}</h3>
                <span class="booking-status ${sanitizeInput(booking.status.toLowerCase())}">${sanitizeInput(booking.status)}</span>
            </div>
            <div class="booking-details">
                <p><i class="fas fa-calendar"></i> ${new Date(booking.date).toLocaleDateString()}</p>
                <p><i class="fas fa-map-marker-alt"></i> ${sanitizeInput(booking.location)}</p>
                <p><i class="fas fa-users"></i> ${sanitizeInput(String(booking.guests))} guests</p>
                <p><i class="fas fa-money-bill-wave"></i> ${sanitizeInput(booking.price)}</p>
            </div>
            <div class="booking-actions">
                <button class="btn-secondary" onclick="viewBookingDetails('${sanitizeInput(booking.id)}')">
                    View Details
                </button>
                ${booking.status === 'UPCOMING' ? `
                    <button class="btn-danger" onclick="cancelBooking('${sanitizeInput(booking.id)}')">
                        Cancel Booking
                    </button>
                ` : ''}
            </div>
        </div>
    `).join('');

    container.innerHTML = bookingsHtml;
}

// Show success message
function showSuccess(message) {
    const successDiv = document.createElement('div');
    successDiv.className = 'success-message';
    successDiv.innerHTML = `
        <div class="success-content">
            <i class="fas fa-check-circle"></i>
            <span>${sanitizeInput(message)}</span>
        </div>
    `;

    document.body.appendChild(successDiv);

    setTimeout(() => {
        successDiv.remove();
    }, 3000);
}

// View booking details
window.viewBookingDetails = async (bookingId) => {
    try {
        const response = await secureFetch(`/api/bookings/${encodeURIComponent(bookingId)}`);
        if (!response.ok) throw new Error('Failed to load booking details');

        const booking = await response.json();
        // Implement modal or redirect to booking details page
        window.location.href = `/booking-details.html?id=${encodeURIComponent(bookingId)}`;
    } catch (error) {
        showError('Failed to load booking details', 'main');
    }
};

// Cancel booking
window.cancelBooking = async (bookingId) => {
    if (!confirm('Are you sure you want to cancel this booking?')) {
        return;
    }

    try {
        const response = await secureFetch(`/api/bookings/${encodeURIComponent(bookingId)}/cancel`, {
            method: 'POST'
        });

        if (!response.ok) throw new Error('Failed to cancel booking');

        showSuccess('Booking cancelled successfully');
        await loadUserBookings(); // Reload bookings list
    } catch (error) {
        showError('Failed to cancel booking', 'main');
    }
}; 