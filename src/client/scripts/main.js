// DOM Elements
const loadingState = document.getElementById('loadingState');
const errorState = document.getElementById('errorState');
const mainContent = document.getElementById('mainContent');
const featuredDestinations = document.getElementById('featuredDestinations');
const specialOffers = document.getElementById('specialOffers');
const mainSearchForm = document.getElementById('mainSearchForm');
const destinationInput = document.getElementById('destinationInput');
const checkInDate = document.getElementById('checkInDate');
const checkOutDate = document.getElementById('checkOutDate');
const newsletterForm = document.getElementById('newsletterForm');

// Initialize page
document.addEventListener('DOMContentLoaded', () => {
    initializeDateInputs();
    loadFeaturedDestinations();
    loadSpecialOffers();
    initializeEventListeners();
});

// Initialize Event Listeners
function initializeEventListeners() {
    mainSearchForm.addEventListener('submit', handleSearch);
    newsletterForm.addEventListener('submit', handleNewsletterSubscription);
    checkInDate.addEventListener('change', updateCheckOutMinDate);
}

// Initialize Date Inputs
function initializeDateInputs() {
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    // Format dates for input
    const todayStr = formatDate(today);
    const tomorrowStr = formatDate(tomorrow);
    
    // Set min dates
    checkInDate.min = todayStr;
    checkOutDate.min = tomorrowStr;
    
    // Set default values if not already set
    if (!checkInDate.value) checkInDate.value = todayStr;
    if (!checkOutDate.value) checkOutDate.value = tomorrowStr;
}

// Update Check-out Min Date
function updateCheckOutMinDate() {
    const selectedCheckIn = new Date(checkInDate.value);
    const nextDay = new Date(selectedCheckIn);
    nextDay.setDate(nextDay.getDate() + 1);
    
    checkOutDate.min = formatDate(nextDay);
    
    // If check-out date is before new min date, update it
    if (new Date(checkOutDate.value) <= selectedCheckIn) {
        checkOutDate.value = formatDate(nextDay);
    }
}

// Format Date for Input
function formatDate(date) {
    return date.toISOString().split('T')[0];
}

// Load Featured Destinations
async function loadFeaturedDestinations() {
    try {
        const response = await fetch('/api/v1/booking/destinations/featured');
        const data = await response.json();

        if (data.success) {
            displayFeaturedDestinations(data.data);
        } else {
            throw new Error(data.message || 'Failed to load featured destinations');
        }
    } catch (error) {
        console.error('Error loading featured destinations:', error);
        featuredDestinations.innerHTML = `
            <div class="col-12">
                <div class="alert alert-danger" role="alert">
                    Failed to load featured destinations. Please try again later.
                </div>
            </div>
        `;
    }
}

// Display Featured Destinations
function displayFeaturedDestinations(destinations) {
    featuredDestinations.innerHTML = destinations.map(destination => `
        <div class="col-md-4">
            <div class="card h-100 destination-card">
                <img src="${destination.image_url}" 
                     class="card-img-top" 
                     alt="${destination.name}"
                     style="height: 200px; object-fit: cover;">
                <div class="card-body">
                    <h5 class="card-title">${destination.name}</h5>
                    <p class="card-text text-muted">${destination.description}</p>
                    <div class="d-flex justify-content-between align-items-center">
                        <span class="text-primary">
                            <i class="fas fa-hotel"></i> ${destination.hotel_count} Hotels
                        </span>
                        <a href="hotels.html?destination=${encodeURIComponent(destination.name)}" 
                           class="btn btn-outline-primary">
                            Explore
                        </a>
                    </div>
                </div>
            </div>
        </div>
    `).join('');
}

// Load Special Offers
async function loadSpecialOffers() {
    try {
        const response = await fetch('/api/v1/booking/deals/featured');
        const data = await response.json();

        if (data.success) {
            displaySpecialOffers(data.data);
        } else {
            throw new Error(data.message || 'Failed to load special offers');
        }
    } catch (error) {
        console.error('Error loading special offers:', error);
        specialOffers.innerHTML = `
            <div class="col-12">
                <div class="alert alert-danger" role="alert">
                    Failed to load special offers. Please try again later.
                </div>
            </div>
        `;
    }
}

// Display Special Offers
function displaySpecialOffers(offers) {
    specialOffers.innerHTML = offers.map(offer => `
        <div class="col-md-6 col-lg-3">
            <div class="card h-100 offer-card">
                <div class="position-absolute top-0 end-0 p-2">
                    <span class="badge bg-danger">
                        Save ${offer.discount_percentage}%
                    </span>
                </div>
                <img src="${offer.image_url}" 
                     class="card-img-top" 
                     alt="${offer.hotel_name}"
                     style="height: 150px; object-fit: cover;">
                <div class="card-body">
                    <h5 class="card-title">${offer.hotel_name}</h5>
                    <p class="card-text text-muted mb-2">${offer.location}</p>
                    <div class="mb-2">
                        ${generateStarRating(offer.rating)}
                    </div>
                    <div class="d-flex justify-content-between align-items-center">
                        <div>
                            <small class="text-decoration-line-through text-muted">
                                $${offer.original_price}
                            </small>
                            <br>
                            <span class="text-primary fw-bold">
                                $${offer.discounted_price}
                            </span>
                        </div>
                        <a href="hotel-details.html?id=${offer.hotel_id}" 
                           class="btn btn-sm btn-primary">
                            View Deal
                        </a>
                    </div>
                </div>
            </div>
        </div>
    `).join('');
}

// Generate Star Rating
function generateStarRating(rating) {
    const fullStar = '<i class="fas fa-star text-warning"></i>';
    const halfStar = '<i class="fas fa-star-half-alt text-warning"></i>';
    const emptyStar = '<i class="far fa-star text-warning"></i>';
    
    let stars = '';
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 !== 0;
    
    // Add full stars
    for (let i = 0; i < fullStars; i++) {
        stars += fullStar;
    }
    
    // Add half star if needed
    if (hasHalfStar) {
        stars += halfStar;
    }
    
    // Add empty stars
    const emptyStars = 5 - Math.ceil(rating);
    for (let i = 0; i < emptyStars; i++) {
        stars += emptyStar;
    }
    
    return stars;
}

// Handle Search
function handleSearch(e) {
    e.preventDefault();
    const searchParams = new URLSearchParams({
        destination: destinationInput.value,
        checkIn: checkInDate.value,
        checkOut: checkOutDate.value
    });
    window.location.href = `hotels.html?${searchParams.toString()}`;
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

// Show Alert Message
function showAlert(message, type) {
    // Remove any existing alerts
    const existingAlert = document.querySelector('.alert');
    if (existingAlert) {
        existingAlert.remove();
    }

    // Create new alert
    const alert = document.createElement('div');
    alert.className = `alert alert-${type} alert-dismissible fade show`;
    alert.role = 'alert';
    alert.innerHTML = `
        ${message}
        <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
    `;

    // Insert alert before the form
    const targetForm = event.target.closest('form');
    targetForm.parentElement.insertBefore(alert, targetForm);

    // Auto-dismiss after 5 seconds
    setTimeout(() => {
        alert.remove();
    }, 5000);
}

// UI State Management
function showLoading() {
    loadingState.classList.remove('d-none');
    errorState.classList.add('d-none');
    mainContent.classList.add('d-none');
}

function showError(message) {
    loadingState.classList.add('d-none');
    errorState.classList.remove('d-none');
    mainContent.classList.add('d-none');
    errorState.textContent = message;
}

function showContent() {
    loadingState.classList.add('d-none');
    errorState.classList.add('d-none');
    mainContent.classList.remove('d-none');
} 