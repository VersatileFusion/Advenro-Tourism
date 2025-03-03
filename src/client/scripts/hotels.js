// State Management
let currentState = {
    view: 'grid',
    page: 1,
    sort: 'recommended',
    filters: {
        priceRange: { min: null, max: null },
        stars: [],
        amenities: []
    }
};

// DOM Elements
const hotelsList = document.getElementById('hotelsList');
const filterForm = document.getElementById('filterForm');
const sortOption = document.getElementById('sortOption');
const pagination = document.getElementById('pagination');

// Event Listeners
document.addEventListener('DOMContentLoaded', () => {
    loadHotels();
    initializeFilters();
});

filterForm.addEventListener('submit', (e) => {
    e.preventDefault();
    updateFilters();
    loadHotels();
});

sortOption.addEventListener('change', () => {
    currentState.sort = sortOption.value;
    loadHotels();
});

// Load Hotels
async function loadHotels() {
    showLoading();
    try {
        const queryParams = buildQueryParams();
        const response = await fetch(`/api/v1/booking/hotels/search?${queryParams}`);
        const data = await response.json();

        if (data.success) {
            displayHotels(data.data);
            updatePagination(data.pagination);
        } else {
            showError('Failed to load hotels');
        }
    } catch (error) {
        console.error('Error loading hotels:', error);
        showError('An error occurred while loading hotels');
    }
}

// Build Query Parameters
function buildQueryParams() {
    const params = new URLSearchParams();
    
    // Add pagination
    params.append('page', currentState.page);
    
    // Add sorting
    params.append('sort', currentState.sort);
    
    // Add price range
    if (currentState.filters.priceRange.min) {
        params.append('minPrice', currentState.filters.priceRange.min);
    }
    if (currentState.filters.priceRange.max) {
        params.append('maxPrice', currentState.filters.priceRange.max);
    }
    
    // Add star rating
    if (currentState.filters.stars.length > 0) {
        params.append('stars', currentState.filters.stars.join(','));
    }
    
    // Add amenities
    if (currentState.filters.amenities.length > 0) {
        params.append('amenities', currentState.filters.amenities.join(','));
    }
    
    return params.toString();
}

// Display Hotels
function displayHotels(hotels) {
    if (!hotels || hotels.length === 0) {
        hotelsList.innerHTML = `
            <div class="col-12">
                <div class="alert alert-info">
                    No hotels found matching your criteria.
                </div>
            </div>
        `;
        return;
    }

    const viewTemplate = currentState.view === 'grid' ? getGridTemplate : getListTemplate;
    hotelsList.innerHTML = hotels.map(hotel => viewTemplate(hotel)).join('');
}

// Grid View Template
function getGridTemplate(hotel) {
    return `
        <div class="col-md-6 col-lg-4 animate-fade-in">
            <div class="card hotel-card h-100">
                <img src="${hotel.photo_url || 'images/placeholder.jpg'}" 
                     class="card-img-top" 
                     alt="${hotel.name}"
                     onerror="this.src='images/placeholder.jpg'">
                <div class="card-body">
                    <h5 class="card-title">${hotel.name}</h5>
                    <div class="mb-2">
                        ${getStarRating(hotel.rating)}
                    </div>
                    <p class="card-text">
                        <i class="fas fa-map-marker-alt text-primary"></i> ${hotel.location}
                    </p>
                    <div class="amenities mb-3">
                        ${getAmenityIcons(hotel.amenities)}
                    </div>
                    <div class="d-flex justify-content-between align-items-center">
                        <div class="price">
                            <small>From</small>
                            <br>
                            <strong>$${hotel.price}</strong> / night
                        </div>
                        <button class="btn btn-primary" onclick="viewHotelDetails('${hotel.id}')">
                            View Details
                        </button>
                    </div>
                </div>
            </div>
        </div>
    `;
}

// List View Template
function getListTemplate(hotel) {
    return `
        <div class="col-12 animate-fade-in">
            <div class="card hotel-card-list">
                <div class="row g-0">
                    <div class="col-md-4">
                        <img src="${hotel.photo_url || 'images/placeholder.jpg'}" 
                             class="img-fluid h-100 w-100 object-fit-cover" 
                             alt="${hotel.name}"
                             onerror="this.src='images/placeholder.jpg'">
                    </div>
                    <div class="col-md-8">
                        <div class="card-body">
                            <div class="d-flex justify-content-between">
                                <h5 class="card-title">${hotel.name}</h5>
                                <div class="price text-end">
                                    <small>From</small>
                                    <br>
                                    <strong>$${hotel.price}</strong> / night
                                </div>
                            </div>
                            <div class="mb-2">
                                ${getStarRating(hotel.rating)}
                            </div>
                            <p class="card-text">
                                <i class="fas fa-map-marker-alt text-primary"></i> ${hotel.location}
                            </p>
                            <div class="amenities mb-3">
                                ${getAmenityIcons(hotel.amenities)}
                            </div>
                            <button class="btn btn-primary" onclick="viewHotelDetails('${hotel.id}')">
                                View Details
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `;
}

// Helper Functions
function getStarRating(rating) {
    const stars = [];
    for (let i = 0; i < 5; i++) {
        if (i < Math.floor(rating)) {
            stars.push('<i class="fas fa-star text-warning"></i>');
        } else if (i === Math.floor(rating) && rating % 1 !== 0) {
            stars.push('<i class="fas fa-star-half-alt text-warning"></i>');
        } else {
            stars.push('<i class="far fa-star text-warning"></i>');
        }
    }
    return stars.join('');
}

function getAmenityIcons(amenities) {
    const amenityIcons = {
        wifi: '<i class="fas fa-wifi" title="Free WiFi"></i>',
        pool: '<i class="fas fa-swimming-pool" title="Pool"></i>',
        parking: '<i class="fas fa-parking" title="Free Parking"></i>',
        restaurant: '<i class="fas fa-utensils" title="Restaurant"></i>',
        gym: '<i class="fas fa-dumbbell" title="Gym"></i>',
        spa: '<i class="fas fa-spa" title="Spa"></i>'
    };

    return amenities
        .map(amenity => amenityIcons[amenity] || '')
        .join(' ');
}

// Filter Management
function initializeFilters() {
    // Price Range
    const minPrice = document.getElementById('minPrice');
    const maxPrice = document.getElementById('maxPrice');
    
    minPrice.addEventListener('change', () => {
        if (minPrice.value && maxPrice.value && Number(minPrice.value) > Number(maxPrice.value)) {
            maxPrice.value = minPrice.value;
        }
    });
    
    maxPrice.addEventListener('change', () => {
        if (minPrice.value && maxPrice.value && Number(maxPrice.value) < Number(minPrice.value)) {
            minPrice.value = maxPrice.value;
        }
    });

    // Star Rating
    document.querySelectorAll('input[type="checkbox"]').forEach(checkbox => {
        checkbox.addEventListener('change', () => {
            updateFilters();
            loadHotels();
        });
    });
}

function updateFilters() {
    // Update price range
    currentState.filters.priceRange = {
        min: document.getElementById('minPrice').value || null,
        max: document.getElementById('maxPrice').value || null
    };

    // Update star rating
    currentState.filters.stars = Array.from(document.querySelectorAll('input[type="checkbox"][id^="star"]'))
        .filter(cb => cb.checked)
        .map(cb => cb.value);

    // Update amenities
    currentState.filters.amenities = Array.from(document.querySelectorAll('input[type="checkbox"]:not([id^="star"])'))
        .filter(cb => cb.checked)
        .map(cb => cb.value);
}

// View Toggle
function toggleView(view) {
    currentState.view = view;
    document.querySelectorAll('.view-options button').forEach(btn => {
        btn.classList.toggle('active', btn.onclick.toString().includes(view));
    });
    loadHotels();
}

// Pagination
function updatePagination(paginationData) {
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

    pagination.innerHTML = pages.join('');
}

function changePage(page) {
    currentState.page = page;
    loadHotels();
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

// UI Helper Functions
function showLoading() {
    hotelsList.innerHTML = `
        <div class="col-12 text-center py-5">
            <div class="spinner-border text-primary" role="status">
                <span class="visually-hidden">Loading...</span>
            </div>
        </div>
    `;
}

function showError(message) {
    hotelsList.innerHTML = `
        <div class="col-12">
            <div class="alert alert-danger">
                ${message}
            </div>
        </div>
    `;
}

// Hotel Details Navigation
function viewHotelDetails(hotelId) {
    window.location.href = `hotel-details.html?id=${hotelId}`;
} 