// DOM Elements
const userName = document.getElementById('userName');
const userEmail = document.getElementById('userEmail');
const changeAvatarBtn = document.getElementById('changeAvatarBtn');
const logoutBtn = document.getElementById('logoutBtn');
const profileForm = document.getElementById('profileForm');
const settingsForm = document.getElementById('settingsForm');
const deleteAccountBtn = document.getElementById('deleteAccountBtn');
const footerNewsletterForm = document.getElementById('footerNewsletterForm');

// State Management
let currentUser = null;
let bookingsPage = 1;
let favoritesPage = 1;
let reviewsPage = 1;

// Initialize page
document.addEventListener('DOMContentLoaded', () => {
    checkAuth();
    initializeEventListeners();
    loadUserProfile();
    loadInitialData();
});

// Check Authentication
function checkAuth() {
    const token = localStorage.getItem('authToken');
    if (!token) {
        window.location.href = 'login.html';
    }
}

// Initialize Event Listeners
function initializeEventListeners() {
    profileForm.addEventListener('submit', handleProfileUpdate);
    settingsForm.addEventListener('submit', handleSettingsUpdate);
    deleteAccountBtn.addEventListener('click', handleAccountDeletion);
    changeAvatarBtn.addEventListener('click', handleAvatarChange);
    logoutBtn.addEventListener('click', handleLogout);
    footerNewsletterForm.addEventListener('submit', handleNewsletterSubscription);

    // Tab change event
    document.querySelectorAll('[data-bs-toggle="list"]').forEach(tab => {
        tab.addEventListener('shown.bs.tab', (e) => {
            const target = e.target.getAttribute('href').substring(1);
            loadTabContent(target);
        });
    });

    // Load more buttons
    document.getElementById('loadMoreBookings').addEventListener('click', () => loadMoreBookings());
    document.getElementById('loadMoreFavorites').addEventListener('click', () => loadMoreFavorites());
    document.getElementById('loadMoreReviews').addEventListener('click', () => loadMoreReviews());
}

// Load Initial Data
async function loadInitialData() {
    await Promise.all([
        loadBookings(),
        loadFavorites(),
        loadReviews()
    ]);
}

// Load User Profile
async function loadUserProfile() {
    try {
        const response = await fetch('/api/v1/user/profile', {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('authToken')}`
            }
        });

        if (response.ok) {
            currentUser = await response.json();
            updateProfileUI(currentUser);
        } else {
            throw new Error('Failed to load profile');
        }
    } catch (error) {
        showAlert(error.message, 'danger');
    }
}

// Update Profile UI
function updateProfileUI(user) {
    userName.textContent = `${user.firstName} ${user.lastName}`;
    userEmail.textContent = user.email;
    
    // Update form fields
    document.getElementById('firstName').value = user.firstName;
    document.getElementById('lastName').value = user.lastName;
    document.getElementById('email').value = user.email;
    document.getElementById('phone').value = user.phone || '';
    document.getElementById('address').value = user.address || '';
    
    // Update notification preferences
    document.getElementById('emailNotifications').checked = user.preferences?.emailNotifications || false;
    document.getElementById('smsNotifications').checked = user.preferences?.smsNotifications || false;
    document.getElementById('marketingEmails').checked = user.preferences?.marketingEmails || false;
}

// Load Tab Content
async function loadTabContent(tab) {
    switch (tab) {
        case 'bookings':
            await loadBookings();
            break;
        case 'favorites':
            await loadFavorites();
            break;
        case 'reviews':
            await loadReviews();
            break;
    }
}

// Load Bookings
async function loadBookings() {
    try {
        const response = await fetch(`/api/v1/user/bookings?page=${bookingsPage}`, {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('authToken')}`
            }
        });

        if (response.ok) {
            const data = await response.json();
            displayBookings(data.bookings);
            updateLoadMoreButton('loadMoreBookings', data.hasMore);
        } else {
            throw new Error('Failed to load bookings');
        }
    } catch (error) {
        showAlert(error.message, 'danger');
    }
}

// Display Bookings
function displayBookings(bookings) {
    const bookingsList = document.getElementById('bookingsList');
    
    bookings.forEach(booking => {
        const bookingCard = createBookingCard(booking);
        bookingsList.appendChild(bookingCard);
    });
}

// Create Booking Card
function createBookingCard(booking) {
    const card = document.createElement('div');
    card.className = 'col-md-6 col-lg-4';
    card.innerHTML = `
        <div class="card h-100">
            <img src="${booking.hotel.images[0]}" class="card-img-top" alt="${booking.hotel.name}">
            <div class="card-body">
                <h6 class="card-title">${booking.hotel.name}</h6>
                <p class="card-text">
                    <small class="text-muted">
                        <i class="fas fa-calendar-alt me-1"></i>
                        ${new Date(booking.checkIn).toLocaleDateString()} - ${new Date(booking.checkOut).toLocaleDateString()}
                    </small>
                </p>
                <p class="card-text">
                    <small class="text-muted">
                        <i class="fas fa-users me-1"></i>
                        ${booking.guests} guests
                    </small>
                </p>
                <div class="d-flex justify-content-between align-items-center">
                    <span class="badge bg-${getStatusColor(booking.status)}">${booking.status}</span>
                    <a href="booking-details.html?id=${booking.id}" class="btn btn-sm btn-outline-primary">
                        View Details
                    </a>
                </div>
            </div>
        </div>
    `;
    return card;
}

// Load Favorites
async function loadFavorites() {
    try {
        const response = await fetch(`/api/v1/user/favorites?page=${favoritesPage}`, {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('authToken')}`
            }
        });

        if (response.ok) {
            const data = await response.json();
            displayFavorites(data.favorites);
            updateLoadMoreButton('loadMoreFavorites', data.hasMore);
        } else {
            throw new Error('Failed to load favorites');
        }
    } catch (error) {
        showAlert(error.message, 'danger');
    }
}

// Display Favorites
function displayFavorites(favorites) {
    const favoritesList = document.getElementById('favoritesList');
    
    favorites.forEach(favorite => {
        const favoriteCard = createFavoriteCard(favorite);
        favoritesList.appendChild(favoriteCard);
    });
}

// Create Favorite Card
function createFavoriteCard(favorite) {
    const card = document.createElement('div');
    card.className = 'col-md-6 col-lg-4';
    card.innerHTML = `
        <div class="card h-100">
            <img src="${favorite.image}" class="card-img-top" alt="${favorite.name}">
            <div class="card-body">
                <h6 class="card-title">${favorite.name}</h6>
                <p class="card-text">
                    <small class="text-muted">
                        <i class="fas fa-map-marker-alt me-1"></i>
                        ${favorite.location}
                    </small>
                </p>
                <div class="d-flex justify-content-between align-items-center">
                    <button class="btn btn-sm btn-outline-danger remove-favorite" data-id="${favorite.id}">
                        <i class="fas fa-heart-broken"></i>
                    </button>
                    <a href="${favorite.type === 'hotel' ? 'hotel-details.html' : 'destination-details.html'}?id=${favorite.id}" 
                       class="btn btn-sm btn-outline-primary">
                        View Details
                    </a>
                </div>
            </div>
        </div>
    `;
    return card;
}

// Load Reviews
async function loadReviews() {
    try {
        const response = await fetch(`/api/v1/user/reviews?page=${reviewsPage}`, {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('authToken')}`
            }
        });

        if (response.ok) {
            const data = await response.json();
            displayReviews(data.reviews);
            updateLoadMoreButton('loadMoreReviews', data.hasMore);
        } else {
            throw new Error('Failed to load reviews');
        }
    } catch (error) {
        showAlert(error.message, 'danger');
    }
}

// Display Reviews
function displayReviews(reviews) {
    const reviewsList = document.getElementById('reviewsList');
    
    reviews.forEach(review => {
        const reviewCard = createReviewCard(review);
        reviewsList.appendChild(reviewCard);
    });
}

// Create Review Card
function createReviewCard(review) {
    const card = document.createElement('div');
    card.className = 'col-md-6';
    card.innerHTML = `
        <div class="card h-100">
            <div class="card-body">
                <div class="d-flex justify-content-between align-items-start">
                    <div>
                        <h6 class="card-title">${review.itemName}</h6>
                        <div class="mb-2">
                            ${createStarRating(review.rating)}
                        </div>
                        <p class="card-text">${review.comment}</p>
                        <small class="text-muted">
                            <i class="fas fa-calendar-alt me-1"></i>
                            ${new Date(review.date).toLocaleDateString()}
                        </small>
                    </div>
                    <div class="dropdown">
                        <button class="btn btn-link text-muted" type="button" data-bs-toggle="dropdown">
                            <i class="fas fa-ellipsis-v"></i>
                        </button>
                        <ul class="dropdown-menu">
                            <li>
                                <button class="dropdown-item edit-review" data-id="${review.id}">
                                    <i class="fas fa-edit me-2"></i>Edit
                                </button>
                            </li>
                            <li>
                                <button class="dropdown-item text-danger delete-review" data-id="${review.id}">
                                    <i class="fas fa-trash-alt me-2"></i>Delete
                                </button>
                            </li>
                        </ul>
                    </div>
                </div>
            </div>
        </div>
    `;
    return card;
}

// Handle Profile Update
async function handleProfileUpdate(e) {
    e.preventDefault();
    
    const formData = {
        firstName: document.getElementById('firstName').value,
        lastName: document.getElementById('lastName').value,
        email: document.getElementById('email').value,
        phone: document.getElementById('phone').value,
        address: document.getElementById('address').value
    };

    try {
        const response = await fetch('/api/v1/user/profile', {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('authToken')}`
            },
            body: JSON.stringify(formData)
        });

        if (response.ok) {
            showAlert('Profile updated successfully!', 'success');
            loadUserProfile();
        } else {
            throw new Error('Failed to update profile');
        }
    } catch (error) {
        showAlert(error.message, 'danger');
    }
}

// Handle Settings Update
async function handleSettingsUpdate(e) {
    e.preventDefault();
    
    const newPassword = document.getElementById('newPassword').value;
    const confirmNewPassword = document.getElementById('confirmNewPassword').value;

    if (newPassword && newPassword !== confirmNewPassword) {
        showAlert('New passwords do not match', 'danger');
        return;
    }

    const formData = {
        currentPassword: document.getElementById('currentPassword').value,
        newPassword: newPassword,
        preferences: {
            emailNotifications: document.getElementById('emailNotifications').checked,
            smsNotifications: document.getElementById('smsNotifications').checked,
            marketingEmails: document.getElementById('marketingEmails').checked
        }
    };

    try {
        const response = await fetch('/api/v1/user/settings', {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('authToken')}`
            },
            body: JSON.stringify(formData)
        });

        if (response.ok) {
            showAlert('Settings updated successfully!', 'success');
            document.getElementById('currentPassword').value = '';
            document.getElementById('newPassword').value = '';
            document.getElementById('confirmNewPassword').value = '';
        } else {
            throw new Error('Failed to update settings');
        }
    } catch (error) {
        showAlert(error.message, 'danger');
    }
}

// Handle Account Deletion
async function handleAccountDeletion() {
    if (!confirm('Are you sure you want to delete your account? This action cannot be undone.')) {
        return;
    }

    try {
        const response = await fetch('/api/v1/user/account', {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('authToken')}`
            }
        });

        if (response.ok) {
            localStorage.removeItem('authToken');
            window.location.href = 'login.html';
        } else {
            throw new Error('Failed to delete account');
        }
    } catch (error) {
        showAlert(error.message, 'danger');
    }
}

// Handle Avatar Change
function handleAvatarChange() {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    
    input.onchange = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const formData = new FormData();
        formData.append('avatar', file);

        try {
            const response = await fetch('/api/v1/user/avatar', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('authToken')}`
                },
                body: formData
            });

            if (response.ok) {
                const data = await response.json();
                document.querySelector('.rounded-circle').src = data.avatarUrl;
                showAlert('Avatar updated successfully!', 'success');
            } else {
                throw new Error('Failed to update avatar');
            }
        } catch (error) {
            showAlert(error.message, 'danger');
        }
    };

    input.click();
}

// Handle Logout
function handleLogout() {
    localStorage.removeItem('authToken');
    window.location.href = 'login.html';
}

// Helper Functions
function getStatusColor(status) {
    const colors = {
        'confirmed': 'success',
        'pending': 'warning',
        'cancelled': 'danger',
        'completed': 'info'
    };
    return colors[status.toLowerCase()] || 'secondary';
}

function createStarRating(rating) {
    return Array(5).fill('').map((_, index) => `
        <i class="fas fa-star ${index < rating ? 'text-warning' : 'text-muted'}"></i>
    `).join('');
}

function updateLoadMoreButton(buttonId, hasMore) {
    const button = document.getElementById(buttonId);
    button.style.display = hasMore ? 'inline-block' : 'none';
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