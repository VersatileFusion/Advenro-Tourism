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

// State Management
let currentState = {
    reviewsPage: 1,
    selectedRoomType: null,
    bookingDates: {
        checkIn: null,
        checkOut: null
    }
};

// Initialize page
document.addEventListener('DOMContentLoaded', () => {
    if (!hotelId) {
        showError('Hotel ID is missing');
        return;
    }
    loadHotelDetails();
    initializeBookingForm();
});

// Load Hotel Details
async function loadHotelDetails() {
    try {
        const response = await fetch(`/api/v1/booking/hotels/${hotelId}`);
        const data = await response.json();

        if (data.success) {
            displayHotelDetails(data.data);
            loadRoomTypes();
            loadAmenities();
            loadReviews();
            loadSimilarHotels();
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
function displayHotelDetails(hotel) {
    // Update page title
    document.title = `${hotel.name} - Tourism Booking Platform`;
    
    // Update breadcrumb and header
    hotelName.textContent = hotel.name;
    hotelTitle.textContent = hotel.name;
    hotelLocation.innerHTML = `<i class="fas fa-map-marker-alt"></i> ${hotel.location}`;
    hotelPrice.textContent = `$${hotel.price}`;
    hotelDescription.textContent = hotel.description;
    
    // Display star rating
    hotelStars.innerHTML = getStarRating(hotel.rating);
    
    // Display photo gallery
    displayGallery(hotel.photos);
    
    // Initialize map
    initializeMap(hotel.coordinates);
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
        const response = await fetch(`/api/v1/booking/hotels/${hotelId}/reviews?page=${currentState.reviewsPage}`);
        const data = await response.json();

        if (data.success) {
            displayReviews(data.data);
            updateReviewsStats(data.stats);
            updateReviewsPagination(data.pagination);
        }
    } catch (error) {
        console.error('Error loading reviews:', error);
    }
}

// Display Reviews
function displayReviews(reviews) {
    reviewsList.innerHTML = reviews.map(review => `
        <div class="card mb-3">
            <div class="card-body">
                <div class="d-flex justify-content-between mb-2">
                    <div>
                        <h6 class="mb-0">${review.guest_name}</h6>
                        <small class="text-muted">Stayed in ${review.stay_date}</small>
                    </div>
                    <div class="text-warning">
                        ${getStarRating(review.rating)}
                    </div>
                </div>
                <p class="card-text">${review.comment}</p>
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
        const response = await fetch(`/api/v1/booking/hotels/${hotelId}/similar`);
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

function initializeMap(coordinates) {
    // Implementation depends on the map service you're using (Google Maps, Leaflet, etc.)
    console.log('Map initialization with coordinates:', coordinates);
}

// UI State Management
function showLoading() {
    loadingState.classList.remove('d-none');
    errorState.classList.add('d-none');
    hotelContent.classList.add('d-none');
}

function showError(message) {
    loadingState.classList.add('d-none');
    errorState.classList.remove('d-none');
    hotelContent.classList.add('d-none');
    errorState.textContent = message;
}

function showContent() {
    loadingState.classList.add('d-none');
    errorState.classList.add('d-none');
    hotelContent.classList.remove('d-none');
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
    currentState.reviewsPage = page;
    loadReviews();
    reviewsList.scrollIntoView({ behavior: 'smooth' });
} 