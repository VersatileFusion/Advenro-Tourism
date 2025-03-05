// Get hotel ID from URL parameters
const urlParams = new URLSearchParams(window.location.search);
const hotelId = urlParams.get('id');

// DOM Elements
const loadingState = document.getElementById('loadingState');
const errorState = document.getElementById('errorState');
const hotelContent = document.getElementById('hotelContent');
const hotelName = document.getElementById('hotelName');
const hotelTitle = document.getElementById('hotelTitle');
const hotelStars = document.getElementById('hotelStars');
const hotelLocation = document.getElementById('hotelLocation');
const hotelPrice = document.getElementById('hotelPrice');
const hotelDescription = document.getElementById('hotelDescription');
const galleryInner = document.getElementById('galleryInner');
const roomTypesList = document.getElementById('roomTypesList');
const amenitiesList = document.getElementById('amenitiesList');
const reviewsList = document.getElementById('reviewsList');
const reviewsPagination = document.getElementById('reviewsPagination');
const averageRating = document.getElementById('averageRating');
const reviewCount = document.getElementById('reviewCount');
const roomTypeSelect = document.getElementById('roomType');
const similarHotelsList = document.getElementById('similarHotelsList');
const bookingForm = document.getElementById('bookingForm');
const checkInDate = document.getElementById('checkInDate');
const checkOutDate = document.getElementById('checkOutDate');
const roomType = document.getElementById('roomType');
const guestsCount = document.getElementById('guestsCount');
const roomRate = document.getElementById('roomRate');
const taxesAndFees = document.getElementById('taxesAndFees');
const totalPrice = document.getElementById('totalPrice');
const reviewForm = document.getElementById('reviewForm');
const ratingInput = document.getElementById('ratingInput');
const newsletterForm = document.getElementById('newsletterForm');

// State Management
let currentState = {
    reviewsPage: 1,
    selectedRoomType: null,
    bookingDates: {
        checkIn: null,
        checkOut: null
    }
};
let hotelData = null;
let map = null;
let marker = null;
let currentReviewPage = 1;
let totalReviewPages = 1;
let swiper = null;
let isFavorite = false;

// Initialize page
document.addEventListener('DOMContentLoaded', () => {
    if (!hotelId) {
        showError('Hotel ID is missing');
        return;
    }
    initializeDateInputs();
    initializeEventListeners();
    loadHotelDetails();
});

// Initialize Date Inputs
function initializeDateInputs() {
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    const todayStr = formatDate(today);
    const tomorrowStr = formatDate(tomorrow);
    
    checkInDate.min = todayStr;
    checkOutDate.min = tomorrowStr;
    
    if (!checkInDate.value) checkInDate.value = todayStr;
    if (!checkOutDate.value) checkOutDate.value = tomorrowStr;

    checkInDate.addEventListener('change', updateCheckOutMinDate);
}

// Initialize Event Listeners
function initializeEventListeners() {
    bookingForm.addEventListener('submit', handleBooking);
    reviewForm.addEventListener('submit', handleReviewSubmission);
    roomType.addEventListener('change', updatePriceCalculation);
    guestsCount.addEventListener('change', updatePriceCalculation);
    checkInDate.addEventListener('change', updatePriceCalculation);
    checkOutDate.addEventListener('change', updatePriceCalculation);
    newsletterForm.addEventListener('submit', handleNewsletterSubscription);

    // Rating input event listeners
    document.querySelectorAll('.rating-input i').forEach(star => {
        star.addEventListener('mouseover', handleStarHover);
        star.addEventListener('mouseout', handleStarHoverOut);
        star.addEventListener('click', handleStarClick);
    });
}

// Format Date
function formatDate(date) {
    return date.toISOString().split('T')[0];
}

// Update Check-out Min Date
function updateCheckOutMinDate() {
    const selectedCheckIn = new Date(checkInDate.value);
    const nextDay = new Date(selectedCheckIn);
    nextDay.setDate(nextDay.getDate() + 1);
    
    checkOutDate.min = formatDate(nextDay);
    
    if (new Date(checkOutDate.value) <= selectedCheckIn) {
        checkOutDate.value = formatDate(nextDay);
    }

    updatePriceCalculation();
}

// Load Hotel Details
async function loadHotelDetails() {
    try {
        const response = await fetch(`/api/v1/booking/hotels/${hotelId}`);
        const data = await response.json();

        if (data.success) {
            hotelData = data.data;
            displayHotelDetails();
            loadRoomTypes();
            loadAmenities();
            loadReviews();
            loadSimilarHotels();
            checkFavoriteStatus();
            showContent();
        } else {
            showError('Failed to load hotel details');
        }
    } catch (error) {
        console.error('Error loading hotel details:', error);
        showError('An error occurred while loading hotel details');
    }
}

// Display Hotel Details
function displayHotelDetails() {
    // Update page title
    document.title = `${hotelData.name} - Tourism Booking Platform`;
    
    // Update breadcrumb and header
    hotelName.textContent = hotelData.name;
    hotelTitle.textContent = hotelData.name;
    hotelLocation.innerHTML = `<i class="fas fa-map-marker-alt"></i> ${hotelData.location}`;
    hotelPrice.textContent = `$${hotelData.price}`;
    hotelDescription.textContent = hotelData.description;
    
    // Display star rating
    hotelStars.innerHTML = getStarRating(hotelData.rating);
    
    // Display photo gallery
    displayGallery(hotelData.photos);
    
    // Initialize map
    initializeMap();
}

// Load Room Types
async function loadRoomTypes() {
    try {
        const response = await fetch(`/api/v1/booking/hotels/${hotelId}/room-types`);
        const data = await response.json();

        if (data.success) {
            displayRoomTypes(data.data);
        }
    } catch (error) {
        console.error('Error loading room types:', error);
    }
}

// Display Room Types
function displayRoomTypes(roomTypes) {
    roomTypesList.innerHTML = roomTypes.map(room => `
        <div class="col-md-6">
            <div class="card h-100">
                <img src="${room.photo_url || 'images/placeholder.jpg'}" 
                     class="card-img-top" 
                     alt="${room.name}"
                     onerror="this.src='images/placeholder.jpg'">
                <div class="card-body">
                    <h5 class="card-title">${room.name}</h5>
                    <p class="card-text">${room.description}</p>
                    <ul class="list-unstyled">
                        <li><i class="fas fa-user"></i> Max Guests: ${room.max_guests}</li>
                        <li><i class="fas fa-bed"></i> Bed Type: ${room.bed_type}</li>
                        <li><i class="fas fa-ruler-combined"></i> Room Size: ${room.size} m²</li>
                    </ul>
                    <div class="d-flex justify-content-between align-items-center">
                        <span class="h5 mb-0">$${room.price}/night</span>
                        <button class="btn btn-outline-primary" onclick="selectRoomType('${room.id}')">
                            Select
                        </button>
                    </div>
                </div>
            </div>
        </div>
    `).join('');

    // Update room type select in booking form
    roomTypeSelect.innerHTML = roomTypes.map(room => `
        <option value="${room.id}">${room.name} - $${room.price}/night</option>
    `).join('');
}

// Load Amenities
async function loadAmenities() {
    try {
        const response = await fetch(`/api/v1/booking/hotels/${hotelId}/amenities`);
        const data = await response.json();

        if (data.success) {
            displayAmenities(data.data);
        }
    } catch (error) {
        console.error('Error loading amenities:', error);
    }
}

// Display Amenities
function displayAmenities(amenities) {
    const amenityIcons = {
        wifi: 'fa-wifi',
        pool: 'fa-swimming-pool',
        parking: 'fa-parking',
        restaurant: 'fa-utensils',
        gym: 'fa-dumbbell',
        spa: 'fa-spa',
        ac: 'fa-snowflake',
        bar: 'fa-glass-martini-alt',
        laundry: 'fa-tshirt',
        pets: 'fa-paw'
    };

    amenitiesList.innerHTML = amenities.map(amenity => `
        <div class="col-md-3 col-6">
            <div class="d-flex align-items-center">
                <i class="fas ${amenityIcons[amenity.icon] || 'fa-check'} fa-fw me-2"></i>
                <span>${amenity.name}</span>
            </div>
        </div>
    `).join('');
}

// Load Reviews
async function loadReviews() {
    try {
        const response = await fetch(`/api/v1/booking/hotels/${hotelData.id}/reviews?page=${currentReviewPage}`);
        const data = await response.json();

        if (data.success) {
            displayReviews(data.reviews, currentReviewPage === 1);
            updateReviewsStats(data.stats);
            updateReviewsPagination(data.pagination);
            totalReviewPages = data.totalPages;
        } else {
            throw new Error(data.message || 'Failed to load reviews');
        }
    } catch (error) {
        console.error('Error loading reviews:', error);
    }
}

// Display Reviews
function displayReviews(reviews, isFirstPage) {
    reviewsList.innerHTML = reviews.map(review => `
        <div class="card mb-3">
            <div class="card-body">
                <div class="d-flex justify-content-between mb-2">
                    <div>
                        <h6 class="card-title mb-1">${review.title}</h6>
                        <div class="text-warning mb-1">
                            ${getStarRating(review.rating)}
                        </div>
                    </div>
                    <small class="text-muted">
                        ${formatDate(new Date(review.date))}
                    </small>
                </div>
                <p class="card-text">${review.comment}</p>
                <div class="d-flex justify-content-between align-items-center">
                    <small class="text-muted">
                        By ${review.guest_name}
                    </small>
                    <div>
                        <button class="btn btn-sm btn-outline-primary me-2" 
                                onclick="handleReviewHelpful('${review.id}')">
                            <i class="fas fa-thumbs-up"></i> Helpful (${review.helpful_count})
                        </button>
                    </div>
                </div>
            </div>
        </div>
    `).join('');
}

// Update Reviews Stats
function updateReviewsStats(stats) {
    averageRating.textContent = stats.average_rating.toFixed(1);
    reviewCount.textContent = stats.total_reviews;
}

// Load Similar Hotels
async function loadSimilarHotels() {
    try {
        const response = await fetch(`/api/v1/booking/hotels/${hotelData.id}/similar`);
        const data = await response.json();

        if (data.success) {
            displaySimilarHotels(data.data);
        }
    } catch (error) {
        console.error('Error loading similar hotels:', error);
    }
}

// Display Similar Hotels
function displaySimilarHotels(hotels) {
    similarHotelsList.innerHTML = hotels.map(hotel => `
        <div class="card mb-3">
            <div class="row g-0">
                <div class="col-4">
                    <img src="${hotel.photo_url || 'images/placeholder.jpg'}" 
                         class="img-fluid rounded-start" 
                         alt="${hotel.name}"
                         onerror="this.src='images/placeholder.jpg'">
                </div>
                <div class="col-8">
                    <div class="card-body">
                        <h6 class="card-title mb-1">${hotel.name}</h6>
                        <div class="small text-warning mb-1">
                            ${getStarRating(hotel.rating)}
                        </div>
                        <p class="card-text small">
                            <i class="fas fa-map-marker-alt"></i> ${hotel.location}
                        </p>
                        <a href="hotel-details.html?id=${hotel.id}" class="stretched-link"></a>
                    </div>
                </div>
            </div>
        </div>
    `).join('');
}

// Initialize Booking Form
function initializeBookingForm() {
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    // Set min dates for check-in and check-out
    document.getElementById('checkIn').min = today.toISOString().split('T')[0];
    document.getElementById('checkOut').min = tomorrow.toISOString().split('T')[0];

    // Add event listeners
    document.getElementById('checkIn').addEventListener('change', updateCheckOutMin);
    bookingForm.addEventListener('submit', handleBooking);
}

// Update check-out minimum date based on check-in
function updateCheckOutMin(e) {
    const checkIn = new Date(e.target.value);
    const nextDay = new Date(checkIn);
    nextDay.setDate(nextDay.getDate() + 1);
    
    const checkOutInput = document.getElementById('checkOut');
    checkOutInput.min = nextDay.toISOString().split('T')[0];
    
    if (checkOutInput.value && new Date(checkOutInput.value) <= checkIn) {
        checkOutInput.value = nextDay.toISOString().split('T')[0];
    }
}

// Handle Booking Submission
async function handleBooking(e) {
    e.preventDefault();
    
    const formData = {
        hotelId,
        roomType: document.getElementById('roomType').value,
        checkIn: document.getElementById('checkIn').value,
        checkOut: document.getElementById('checkOut').value,
        guests: document.getElementById('guestCount').value
    };

    try {
        const response = await fetch('/api/v1/booking/reserve', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(formData)
        });

        const data = await response.json();

        if (data.success) {
            window.location.href = `booking-confirmation.html?id=${data.bookingId}`;
        } else {
            alert(data.message || 'Failed to make reservation');
        }
    } catch (error) {
        console.error('Error making reservation:', error);
        alert('An error occurred while making the reservation');
    }
}

// Helper Functions
function getStarRating(rating) {
    const stars = [];
    for (let i = 0; i < 5; i++) {
        if (i < Math.floor(rating)) {
            stars.push('<i class="fas fa-star"></i>');
        } else if (i === Math.floor(rating) && rating % 1 !== 0) {
            stars.push('<i class="fas fa-star-half-alt"></i>');
        } else {
            stars.push('<i class="far fa-star"></i>');
        }
    }
    return stars.join('');
}

function displayGallery(photos) {
    galleryInner.innerHTML = photos.map((photo, index) => `
        <div class="carousel-item ${index === 0 ? 'active' : ''}">
            <img src="${photo.url}" class="d-block w-100" alt="${photo.caption || 'Hotel photo'}">
            ${photo.caption ? `
                <div class="carousel-caption d-none d-md-block">
                    <p>${photo.caption}</p>
                </div>
            ` : ''}
        </div>
    `).join('');
}

function initializeMap() {
    if (!map) {
        map = L.map(mapContainer).setView([
            hotelData.latitude,
            hotelData.longitude
        ], 15);

        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '© OpenStreetMap contributors'
        }).addTo(map);
    }

    if (marker) {
        marker.remove();
    }

    marker = L.marker([hotelData.latitude, hotelData.longitude])
        .addTo(map)
        .bindPopup(`
            <strong>${hotelData.name}</strong><br>
            ${hotelData.location}
        `);

    // Display location details
    locationDetails.innerHTML = `
        <div class="mt-3">
            <h6 class="mb-2">Nearby Attractions:</h6>
            <ul class="list-unstyled">
                ${hotelData.nearby_attractions.map(attraction => `
                    <li class="mb-2">
                        <i class="fas fa-map-marker-alt text-primary me-2"></i>
                        ${attraction.name} (${attraction.distance} away)
                    </li>
                `).join('')}
            </ul>
        </div>
    `;
}

// Update Price Calculation
function updatePriceCalculation() {
    const selectedRoom = roomType.options[roomType.selectedIndex];
    if (!selectedRoom.value) {
        resetPriceDisplay();
        return;
    }

    const pricePerNight = parseFloat(selectedRoom.dataset.price);
    const checkIn = new Date(checkInDate.value);
    const checkOut = new Date(checkOutDate.value);
    const nights = Math.ceil((checkOut - checkIn) / (1000 * 60 * 60 * 24));

    if (isNaN(nights) || nights < 1) {
        resetPriceDisplay();
        return;
    }

    const roomTotal = pricePerNight * nights;
    const taxRate = 0.12; // 12% tax
    const taxAmount = roomTotal * taxRate;
    const total = roomTotal + taxAmount;

    roomRate.textContent = `$${roomTotal.toFixed(2)}`;
    taxesAndFees.textContent = `$${taxAmount.toFixed(2)}`;
    totalPrice.textContent = `$${total.toFixed(2)}`;
}

// Reset Price Display
function resetPriceDisplay() {
    roomRate.textContent = '$0';
    taxesAndFees.textContent = '$0';
    totalPrice.textContent = '$0';
}

// Select Room
function selectRoom(roomId) {
    roomType.value = roomId;
    updatePriceCalculation();
    roomType.scrollIntoView({ behavior: 'smooth' });
}

// Check Favorite Status
async function checkFavoriteStatus() {
    try {
        const response = await fetch(`/api/v1/booking/favorites/check/${hotelData.id}`);
        const data = await response.json();

        if (data.success) {
            isFavorite = data.is_favorite;
            updateFavoriteButton();
        }
    } catch (error) {
        console.error('Error checking favorite status:', error);
    }
}

// Toggle Favorite
async function toggleFavorite() {
    try {
        const response = await fetch(`/api/v1/booking/favorites/${hotelData.id}`, {
            method: isFavorite ? 'DELETE' : 'POST'
        });

        const data = await response.json();

        if (data.success) {
            isFavorite = !isFavorite;
            updateFavoriteButton();
            showAlert(
                isFavorite ? 'Added to favorites!' : 'Removed from favorites',
                'success'
            );
        } else {
            throw new Error(data.message || 'Failed to update favorite status');
        }
    } catch (error) {
        showAlert(error.message, 'danger');
    }
}

// Update Favorite Button
function updateFavoriteButton() {
    const icon = favoriteButton.querySelector('i');
    icon.className = isFavorite ? 'fas fa-heart' : 'far fa-heart';
}

// Handle Review Helpful
async function handleReviewHelpful(reviewId) {
    try {
        const response = await fetch(`/api/v1/booking/reviews/${reviewId}/helpful`, {
            method: 'POST'
        });
        const data = await response.json();

        if (data.success) {
            // Refresh reviews to show updated helpful count
            currentReviewPage = 1;
            loadReviews();
        } else {
            throw new Error(data.message || 'Failed to mark review as helpful');
        }
    } catch (error) {
        showAlert(error.message, 'danger');
    }
}

// Handle Review Submission
async function handleReviewSubmission(e) {
    e.preventDefault();

    const reviewData = {
        hotel_id: hotelData.id,
        rating: parseInt(ratingInput.value),
        title: document.getElementById('reviewTitle').value,
        comment: document.getElementById('reviewText').value
    };

    try {
        const response = await fetch('/api/v1/booking/reviews/submit', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(reviewData)
        });

        const data = await response.json();

        if (data.success) {
            // Close modal and refresh reviews
            bootstrap.Modal.getInstance(document.getElementById('reviewModal')).hide();
            currentReviewPage = 1;
            loadReviews();
            showAlert('Thank you for your review!', 'success');
        } else {
            throw new Error(data.message || 'Failed to submit review');
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

// Show Alert Message
function showAlert(message, type) {
    const existingAlert = document.querySelector('.alert:not(#errorState)');
    if (existingAlert) {
        existingAlert.remove();
    }

    const alert = document.createElement('div');
    alert.className = `alert alert-${type} alert-dismissible fade show position-fixed top-0 start-50 translate-middle-x mt-3`;
    alert.style.zIndex = '1050';
    alert.role = 'alert';
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

// Show Error
function showError(message) {
    loadingState.classList.add('d-none');
    errorState.classList.remove('d-none');
    errorState.textContent = message;
}

// Update Reviews Pagination
function updateReviewsPagination(paginationData) {
    if (!paginationData) return;

    const { currentPage, totalPages } = paginationData;
    const pages = [];

    // Previous button
    pages.push(`
        <li class="page-item ${currentPage === 1 ? 'disabled' : ''}">
            <a class="page-link" href="#" onclick="changePage(${currentPage - 1})">Previous</a>
        </li>
    `);

    // Page numbers
    for (let i = 1; i <= totalPages; i++) {
        if (i === 1 || i === totalPages || (i >= currentPage - 2 && i <= currentPage + 2)) {
            pages.push(`
                <li class="page-item ${i === currentPage ? 'active' : ''}">
                    <a class="page-link" href="#" onclick="changePage(${i})">${i}</a>
                </li>
            `);
        } else if (i === currentPage - 3 || i === currentPage + 3) {
            pages.push('<li class="page-item disabled"><span class="page-link">...</span></li>');
        }
    }

    // Next button
    pages.push(`
        <li class="page-item ${currentPage === totalPages ? 'disabled' : ''}">
            <a class="page-link" href="#" onclick="changePage(${currentPage + 1})">Next</a>
        </li>
    `);

    reviewsPagination.innerHTML = pages.join('');
}

// Change Reviews Page
function changePage(page) {
    currentReviewPage = page;
    loadReviews();
    reviewsList.scrollIntoView({ behavior: 'smooth' });
}

// Rating Input Handlers
function handleStarHover(e) {
    const rating = parseInt(e.target.dataset.rating);
    updateStarDisplay(rating, 'hover');
}

function handleStarHoverOut() {
    const currentRating = parseInt(ratingInput.value) || 0;
    updateStarDisplay(currentRating, 'selected');
}

function handleStarClick(e) {
    const rating = parseInt(e.target.dataset.rating);
    ratingInput.value = rating;
    updateStarDisplay(rating, 'selected');
}

function updateStarDisplay(rating, state) {
    document.querySelectorAll('.rating-input i').forEach((star, index) => {
        if (index < rating) {
            star.className = 'fas fa-star text-warning';
        } else {
            star.className = state === 'hover' ? 'far fa-star text-warning' : 'far fa-star';
        }
    });
} 