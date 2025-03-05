// DOM Elements
const loadingState = document.getElementById('loadingState');
const errorState = document.getElementById('errorState');
const destinationsGrid = document.getElementById('destinationsGrid');
const destinationCount = document.getElementById('destinationCount');
const searchForm = document.getElementById('destinationSearchForm');
const searchInput = document.getElementById('searchInput');
const filterForm = document.getElementById('filterForm');
const continentFilters = document.getElementById('continentFilters');
const travelStyleFilters = document.getElementById('travelStyleFilters');
const seasonFilter = document.getElementById('seasonFilter');
const budgetFilter = document.getElementById('budgetFilter');
const loadMoreBtn = document.getElementById('loadMoreBtn');
const viewToggleButtons = document.querySelectorAll('[data-view]');
const newsletterForm = document.getElementById('newsletterForm');

// State Management
let currentState = {
    page: 1,
    totalPages: 1,
    view: 'grid',
    filters: {
        search: '',
        continents: [],
        travelStyles: [],
        season: '',
        budget: ''
    }
};

let map = null;
let markers = [];

// Initialize page
document.addEventListener('DOMContentLoaded', () => {
    initializeMap();
    initializeFilters();
    initializeEventListeners();
    loadDestinations();
});

// Initialize Map
function initializeMap() {
    map = L.map('mapContainer').setView([20, 0], 2);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors'
    }).addTo(map);
}

// Initialize Filters
function initializeFilters() {
    // Continent filters
    const continents = [
        { id: 'asia', name: 'Asia' },
        { id: 'europe', name: 'Europe' },
        { id: 'northAmerica', name: 'North America' },
        { id: 'southAmerica', name: 'South America' },
        { id: 'africa', name: 'Africa' },
        { id: 'oceania', name: 'Oceania' }
    ];

    continentFilters.innerHTML = continents.map(continent => `
        <div class="form-check">
            <input class="form-check-input" type="checkbox" 
                   id="continent_${continent.id}" 
                   value="${continent.id}">
            <label class="form-check-label" for="continent_${continent.id}">
                ${continent.name}
            </label>
        </div>
    `).join('');

    // Travel style filters
    const travelStyles = [
        { id: 'adventure', name: 'Adventure' },
        { id: 'cultural', name: 'Cultural' },
        { id: 'beach', name: 'Beach' },
        { id: 'urban', name: 'Urban' },
        { id: 'nature', name: 'Nature' },
        { id: 'luxury', name: 'Luxury' }
    ];

    travelStyleFilters.innerHTML = travelStyles.map(style => `
        <div class="form-check">
            <input class="form-check-input" type="checkbox" 
                   id="style_${style.id}" 
                   value="${style.id}">
            <label class="form-check-label" for="style_${style.id}">
                ${style.name}
            </label>
        </div>
    `).join('');
}

// Initialize Event Listeners
function initializeEventListeners() {
    searchForm.addEventListener('submit', handleSearch);
    filterForm.addEventListener('submit', handleFilterSubmit);
    loadMoreBtn.addEventListener('click', handleLoadMore);
    viewToggleButtons.forEach(button => {
        button.addEventListener('click', () => handleViewToggle(button.dataset.view));
    });
    newsletterForm.addEventListener('submit', handleNewsletterSubscription);
}

// Handle Search
function handleSearch(e) {
    e.preventDefault();
    currentState.filters.search = searchInput.value;
    currentState.page = 1;
    loadDestinations();
}

// Handle Filter Submit
function handleFilterSubmit(e) {
    e.preventDefault();
    
    // Get selected continents
    currentState.filters.continents = Array.from(
        document.querySelectorAll('#continentFilters input:checked')
    ).map(input => input.value);

    // Get selected travel styles
    currentState.filters.travelStyles = Array.from(
        document.querySelectorAll('#travelStyleFilters input:checked')
    ).map(input => input.value);

    // Get season and budget filters
    currentState.filters.season = seasonFilter.value;
    currentState.filters.budget = budgetFilter.value;

    currentState.page = 1;
    loadDestinations();
}

// Load Destinations
async function loadDestinations() {
    try {
        showLoading();
        
        const queryParams = new URLSearchParams({
            page: currentState.page,
            search: currentState.filters.search,
            continents: currentState.filters.continents.join(','),
            styles: currentState.filters.travelStyles.join(','),
            season: currentState.filters.season,
            budget: currentState.filters.budget
        });

        const response = await fetch(`/api/v1/booking/destinations?${queryParams}`);
        const data = await response.json();

        if (data.success) {
            if (currentState.page === 1) {
                clearDestinations();
            }
            
            displayDestinations(data.destinations);
            updateMap(data.destinations);
            updateDestinationCount(data.total);
            updateLoadMoreButton(data.currentPage, data.totalPages);
            currentState.totalPages = data.totalPages;
        } else {
            throw new Error(data.message || 'Failed to load destinations');
        }
    } catch (error) {
        showError(error.message);
    } finally {
        hideLoading();
    }
}

// Display Destinations
function displayDestinations(destinations) {
    const template = currentState.view === 'grid' ? getGridTemplate : getListTemplate;
    
    const destinationsHTML = destinations.map(template).join('');
    
    if (currentState.page === 1) {
        destinationsGrid.innerHTML = destinationsHTML;
    } else {
        destinationsGrid.insertAdjacentHTML('beforeend', destinationsHTML);
    }
}

// Grid Template
function getGridTemplate(destination) {
    return `
        <div class="col-md-6 col-lg-4">
            <div class="card h-100">
                <img src="${destination.image_url}" 
                     class="card-img-top" 
                     alt="${destination.name}"
                     style="height: 200px; object-fit: cover;">
                <div class="card-body">
                    <h5 class="card-title">${destination.name}</h5>
                    <p class="card-text text-muted mb-2">
                        <i class="fas fa-map-marker-alt"></i> ${destination.country}
                    </p>
                    <p class="card-text">${destination.description.substring(0, 100)}...</p>
                    <div class="d-flex justify-content-between align-items-center">
                        <div>
                            <span class="badge bg-primary me-1">${destination.travel_style}</span>
                            <span class="badge bg-secondary">${destination.best_season}</span>
                        </div>
                        <a href="destination-details.html?id=${destination.id}" 
                           class="btn btn-outline-primary">
                            Explore
                        </a>
                    </div>
                </div>
            </div>
        </div>
    `;
}

// List Template
function getListTemplate(destination) {
    return `
        <div class="col-12 mb-4">
            <div class="card">
                <div class="row g-0">
                    <div class="col-md-4">
                        <img src="${destination.image_url}" 
                             class="img-fluid rounded-start" 
                             alt="${destination.name}"
                             style="height: 100%; object-fit: cover;">
                    </div>
                    <div class="col-md-8">
                        <div class="card-body">
                            <h5 class="card-title">${destination.name}</h5>
                            <p class="card-text text-muted mb-2">
                                <i class="fas fa-map-marker-alt"></i> ${destination.country}
                            </p>
                            <p class="card-text">${destination.description}</p>
                            <div class="d-flex justify-content-between align-items-center">
                                <div>
                                    <span class="badge bg-primary me-1">${destination.travel_style}</span>
                                    <span class="badge bg-secondary">${destination.best_season}</span>
                                </div>
                                <a href="destination-details.html?id=${destination.id}" 
                                   class="btn btn-outline-primary">
                                    Explore
                                </a>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `;
}

// Update Map
function updateMap(destinations) {
    // Clear existing markers
    markers.forEach(marker => marker.remove());
    markers = [];

    // Add new markers
    destinations.forEach(destination => {
        const marker = L.marker([destination.latitude, destination.longitude])
            .addTo(map)
            .bindPopup(`
                <strong>${destination.name}</strong><br>
                ${destination.country}<br>
                <a href="destination-details.html?id=${destination.id}">View Details</a>
            `);
        markers.push(marker);
    });

    // Adjust map bounds if there are markers
    if (markers.length > 0) {
        const group = new L.featureGroup(markers);
        map.fitBounds(group.getBounds().pad(0.1));
    }
}

// Handle View Toggle
function handleViewToggle(view) {
    currentState.view = view;
    
    // Update active button state
    viewToggleButtons.forEach(button => {
        button.classList.toggle('active', button.dataset.view === view);
    });

    // Reload destinations with new view
    loadDestinations();
}

// Handle Load More
function handleLoadMore() {
    currentState.page++;
    loadDestinations();
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

// Helper Functions
function showLoading() {
    loadingState.classList.remove('d-none');
    errorState.classList.add('d-none');
}

function hideLoading() {
    loadingState.classList.add('d-none');
}

function showError(message) {
    errorState.textContent = message;
    errorState.classList.remove('d-none');
}

function clearDestinations() {
    destinationsGrid.innerHTML = '';
}

function updateDestinationCount(total) {
    destinationCount.textContent = total;
}

function updateLoadMoreButton(currentPage, totalPages) {
    if (currentPage < totalPages) {
        loadMoreBtn.classList.remove('d-none');
    } else {
        loadMoreBtn.classList.add('d-none');
    }
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