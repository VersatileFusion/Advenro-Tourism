// DOM Elements
const hotelSearchForm = document.getElementById('hotelSearchForm');
const destinationInput = document.getElementById('destinationInput');
const checkInDate = document.getElementById('checkInDate');
const checkOutDate = document.getElementById('checkOutDate');
const guestsSelect = document.getElementById('guestsSelect');
const priceRangeElement = document.getElementById('priceRange');
const priceMin = document.getElementById('priceMin');
const priceMax = document.getElementById('priceMax');
const sortSelect = document.getElementById('sortSelect');
const listViewBtn = document.getElementById('listView');
const mapViewBtn = document.getElementById('mapView');
const hotelResults = document.getElementById('hotelResults');
const mapContainer = document.getElementById('mapContainer');
const loadMoreBtn = document.getElementById('loadMore');
const totalResults = document.getElementById('totalResults');
const newsletterForm = document.getElementById('newsletterForm');

// State Management
let currentPage = 1;
let totalPages = 1;
let currentView = 'list';
let map = null;
let markers = [];
let currentFilters = {
    priceRange: [0, 1000],
    starRating: [],
    amenities: [],
    propertyType: []
};

// Initialize page
document.addEventListener('DOMContentLoaded', () => {
    initializeDateInputs();
    initializePriceRange();
    initializeEventListeners();
    initializeFromURL();
    loadHotels();
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

// Initialize Price Range Slider
function initializePriceRange() {
    noUiSlider.create(priceRangeElement, {
        start: [0, 1000],
        connect: true,
        range: {
            'min': 0,
            'max': 1000
        },
        format: {
            to: value => Math.round(value),
            from: value => Math.round(value)
        }
    });

    priceRangeElement.noUiSlider.on('update', (values) => {
        priceMin.textContent = `$${values[0]}`;
        priceMax.textContent = `$${values[1]}`;
        currentFilters.priceRange = values;
    });
}

// Initialize Event Listeners
function initializeEventListeners() {
    hotelSearchForm.addEventListener('submit', handleSearch);
    sortSelect.addEventListener('change', handleSort);
    listViewBtn.addEventListener('click', () => switchView('list'));
    mapViewBtn.addEventListener('click', () => switchView('map'));
    loadMoreBtn.addEventListener('click', loadMoreHotels);
    newsletterForm.addEventListener('submit', handleNewsletterSubscription);
    
    // Filter event listeners
    document.querySelectorAll('input[type="checkbox"]').forEach(checkbox => {
        checkbox.addEventListener('change', handleFilterChange);
    });

    document.getElementById('applyFilters').addEventListener('click', applyFilters);
}

// Initialize from URL Parameters
function initializeFromURL() {
    const params = new URLSearchParams(window.location.search);
    
    if (params.has('destination')) {
        destinationInput.value = params.get('destination');
    }
    if (params.has('checkIn')) {
        checkInDate.value = params.get('checkIn');
    }
    if (params.has('checkOut')) {
        checkOutDate.value = params.get('checkOut');
    }
    if (params.has('guests')) {
        guestsSelect.value = params.get('guests');
    }
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
}

// Handle Search
async function handleSearch(e) {
    e.preventDefault();
    currentPage = 1;
    await loadHotels();
    
    // Update URL with search parameters
    const searchParams = new URLSearchParams({
        destination: destinationInput.value,
        checkIn: checkInDate.value,
        checkOut: checkOutDate.value,
        guests: guestsSelect.value
    });
    window.history.pushState({}, '', `?${searchParams.toString()}`);
}

// Handle Sort
async function handleSort() {
    currentPage = 1;
    await loadHotels();
}

// Handle Filter Change
function handleFilterChange(e) {
    const { id, checked, value } = e.target;
    
    if (id.startsWith('star')) {
        if (checked) {
            currentFilters.starRating.push(parseInt(value));
        } else {
            currentFilters.starRating = currentFilters.starRating.filter(rating => rating !== parseInt(value));
        }
    } else if (['wifi', 'pool', 'parking', 'restaurant', 'gym'].includes(id)) {
        if (checked) {
            currentFilters.amenities.push(value);
        } else {
            currentFilters.amenities = currentFilters.amenities.filter(amenity => amenity !== value);
        }
    } else if (['hotel', 'resort', 'apartment', 'villa'].includes(id)) {
        if (checked) {
            currentFilters.propertyType.push(value);
        } else {
            currentFilters.propertyType = currentFilters.propertyType.filter(type => type !== value);
        }
    }
}

// Apply Filters
async function applyFilters() {
    currentPage = 1;
    await loadHotels();
}

// Switch View (List/Map)
function switchView(view) {
    currentView = view;
    
    if (view === 'list') {
        listViewBtn.classList.add('active');
        mapViewBtn.classList.remove('active');
        hotelResults.classList.remove('d-none');
        mapContainer.classList.add('d-none');
    } else {
        mapViewBtn.classList.add('active');
        listViewBtn.classList.remove('active');
        hotelResults.classList.add('d-none');
        mapContainer.classList.remove('d-none');
        initializeMap();
    }
}

// Initialize Map
function initializeMap() {
    if (!map) {
        map = L.map(mapContainer).setView([0, 0], 2);
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '© OpenStreetMap contributors'
        }).addTo(map);
    }
    updateMapMarkers();
}

// Update Map Markers
function updateMapMarkers() {
    // Clear existing markers
    markers.forEach(marker => marker.remove());
    markers = [];

    // Add markers for each hotel
    const hotels = Array.from(hotelResults.children);
    hotels.forEach(hotel => {
        if (hotel.dataset.lat && hotel.dataset.lng) {
            const marker = L.marker([
                parseFloat(hotel.dataset.lat),
                parseFloat(hotel.dataset.lng)
            ]).addTo(map);
            
            marker.bindPopup(createMarkerPopup(hotel));
            markers.push(marker);
        }
    });

    // Fit bounds if there are markers
    if (markers.length > 0) {
        const group = L.featureGroup(markers);
        map.fitBounds(group.getBounds());
    }
}

// Create Marker Popup
function createMarkerPopup(hotel) {
    return `
        <div class="map-popup">
            <img src="${hotel.dataset.image}" alt="${hotel.dataset.name}" class="img-fluid mb-2">
            <h6>${hotel.dataset.name}</h6>
            <p class="mb-1">${hotel.dataset.location}</p>
            <p class="mb-1">From $${hotel.dataset.price}</p>
            <a href="hotel-details.html?id=${hotel.dataset.id}" class="btn btn-sm btn-primary">
                View Details
            </a>
        </div>
    `;
}

// Load Hotels
async function loadHotels() {
    showLoading();
    
    try {
        const response = await fetch('/api/v1/booking/hotels/search', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                destination: destinationInput.value,
                checkIn: checkInDate.value,
                checkOut: checkOutDate.value,
                guests: parseInt(guestsSelect.value),
                page: currentPage,
                sort: sortSelect.value,
                filters: currentFilters
            })
        });

        const data = await response.json();

        if (data.success) {
            if (currentPage === 1) {
                hotelResults.innerHTML = '';
            }
            
            displayHotels(data.hotels);
            updateTotalResults(data.total);
            updateLoadMoreButton(data.currentPage, data.totalPages);
            
            if (currentView === 'map') {
                updateMapMarkers();
            }
        } else {
            throw new Error(data.message || 'Failed to load hotels');
        }
    } catch (error) {
        showError(error.message);
    }
}

// Load More Hotels
async function loadMoreHotels() {
    currentPage++;
    await loadHotels();
}

// Display Hotels
function displayHotels(hotels) {
    const hotelCards = hotels.map(hotel => `
        <div class="col-md-6 col-lg-4 mb-4" 
             data-id="${hotel.id}"
             data-lat="${hotel.latitude}"
             data-lng="${hotel.longitude}"
             data-name="${hotel.name}"
             data-location="${hotel.location}"
             data-price="${hotel.price}"
             data-image="${hotel.image_url}">
            <div class="card h-100 hotel-card">
                <img src="${hotel.image_url}" 
                     class="card-img-top" 
                     alt="${hotel.name}"
                     style="height: 200px; object-fit: cover;">
                <div class="card-body">
                    <h5 class="card-title">${hotel.name}</h5>
                    <p class="card-text text-muted mb-2">
                        <i class="fas fa-map-marker-alt"></i> ${hotel.location}
                    </p>
                    <div class="mb-2">
                        ${generateStarRating(hotel.rating)}
                        <small class="text-muted">(${hotel.reviews_count} reviews)</small>
                    </div>
                    <div class="amenities mb-3">
                        ${generateAmenitiesIcons(hotel.amenities)}
                    </div>
                    <div class="d-flex justify-content-between align-items-center">
                        <div>
                            <small class="text-muted">From</small>
                            <br>
                            <span class="text-primary fw-bold">$${hotel.price}</span>
                            <small class="text-muted">per night</small>
                        </div>
                        <a href="hotel-details.html?id=${hotel.id}" class="btn btn-primary">
                            View Details
                        </a>
                    </div>
                </div>
            </div>
        </div>
    `).join('');

    if (currentPage === 1) {
        hotelResults.innerHTML = hotelCards;
    } else {
        hotelResults.insertAdjacentHTML('beforeend', hotelCards);
    }
}

// Generate Star Rating
function generateStarRating(rating) {
    const fullStar = '<i class="fas fa-star text-warning"></i>';
    const halfStar = '<i class="fas fa-star-half-alt text-warning"></i>';
    const emptyStar = '<i class="far fa-star text-warning"></i>';
    
    let stars = '';
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 !== 0;
    
    for (let i = 0; i < fullStars; i++) {
        stars += fullStar;
    }
    
    if (hasHalfStar) {
        stars += halfStar;
    }
    
    const emptyStars = 5 - Math.ceil(rating);
    for (let i = 0; i < emptyStars; i++) {
        stars += emptyStar;
    }
    
    return stars;
}

// Generate Amenities Icons
function generateAmenitiesIcons(amenities) {
    const amenityIcons = {
        wifi: '<i class="fas fa-wifi" title="Free WiFi"></i>',
        pool: '<i class="fas fa-swimming-pool" title="Swimming Pool"></i>',
        parking: '<i class="fas fa-parking" title="Free Parking"></i>',
        restaurant: '<i class="fas fa-utensils" title="Restaurant"></i>',
        gym: '<i class="fas fa-dumbbell" title="Fitness Center"></i>'
    };

    return amenities
        .map(amenity => amenityIcons[amenity] || '')
        .join(' ');
}

// Update Total Results
function updateTotalResults(total) {
    totalResults.textContent = total;
}

// Update Load More Button
function updateLoadMoreButton(currentPage, totalPages) {
    if (currentPage < totalPages) {
        loadMoreBtn.classList.remove('d-none');
    } else {
        loadMoreBtn.classList.add('d-none');
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
    const existingAlert = document.querySelector('.alert');
    if (existingAlert) {
        existingAlert.remove();
    }

    const alert = document.createElement('div');
    alert.className = `alert alert-${type} alert-dismissible fade show`;
    alert.role = 'alert';
    alert.innerHTML = `
        ${message}
        <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
    `;

    const targetForm = event.target.closest('form');
    targetForm.parentElement.insertBefore(alert, targetForm);

    setTimeout(() => {
        alert.remove();
    }, 5000);
}

// UI State Management
function showLoading() {
    hotelResults.innerHTML = `
        <div class="col-12 text-center py-5">
            <div class="spinner-border text-primary" role="status">
                <span class="visually-hidden">Loading...</span>
            </div>
        </div>
    `;
}

function showError(message) {
    hotelResults.innerHTML = `
        <div class="col-12">
            <div class="alert alert-danger" role="alert">
                ${message}
            </div>
        </div>
    `;
} 