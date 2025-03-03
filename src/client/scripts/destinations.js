// DOM Elements
const loadingState = document.getElementById('loadingState');
const errorState = document.getElementById('errorState');
const destinationContent = document.getElementById('destinationContent');
const popularDestinations = document.getElementById('popularDestinations');
const regionsList = document.getElementById('regionsList');
const travelGuides = document.getElementById('travelGuides');
const sustainabilityInitiatives = document.getElementById('sustainabilityInitiatives');
const pagination = document.getElementById('pagination');
const searchForm = document.getElementById('destinationSearchForm');
const searchInput = document.getElementById('searchInput');
const newsletterForm = document.getElementById('newsletterForm');

// State Management
let currentState = {
    page: 1,
    search: '',
    selectedRegion: null
};

// Initialize page
document.addEventListener('DOMContentLoaded', () => {
    loadDestinations();
    loadRegions();
    loadTravelGuides();
    loadSustainabilityInitiatives();
    initializeEventListeners();
});

// Initialize Event Listeners
function initializeEventListeners() {
    searchForm.addEventListener('submit', handleSearch);
    newsletterForm.addEventListener('submit', handleNewsletterSubscription);
}

// Load Destinations
async function loadDestinations() {
    showLoading();
    try {
        const queryParams = new URLSearchParams({
            page: currentState.page,
            search: currentState.search,
            region: currentState.selectedRegion || ''
        });

        const response = await fetch(`/api/v1/booking/destinations?${queryParams}`);
        const data = await response.json();

        if (data.success) {
            displayDestinations(data.data);
            updatePagination(data.pagination);
            showContent();
        } else {
            showError('Failed to load destinations');
        }
    } catch (error) {
        console.error('Error loading destinations:', error);
        showError('An error occurred while loading destinations');
    }
}

// Display Destinations
function displayDestinations(destinations) {
    popularDestinations.innerHTML = destinations.map(destination => `
        <div class="col-md-4 col-lg-3">
            <div class="card destination-card h-100">
                <img src="${destination.photo_url || 'images/placeholder.jpg'}" 
                     class="card-img-top" 
                     alt="${destination.name}"
                     onerror="this.src='images/placeholder.jpg'">
                <div class="card-body">
                    <h5 class="card-title">${destination.name}</h5>
                    <p class="card-text text-muted">
                        <i class="fas fa-map-marker-alt"></i> ${destination.country}
                    </p>
                    <p class="card-text">${destination.description}</p>
                </div>
                <div class="card-footer bg-white border-0">
                    <div class="d-flex justify-content-between align-items-center">
                        <span class="text-primary">
                            <i class="fas fa-hotel"></i> ${destination.hotels_count} Hotels
                        </span>
                        <a href="hotels.html?destination=${destination.id}" class="btn btn-outline-primary">
                            Explore
                        </a>
                    </div>
                </div>
            </div>
        </div>
    `).join('');
}

// Load Regions
async function loadRegions() {
    try {
        const response = await fetch('/api/v1/booking/regions');
        const data = await response.json();

        if (data.success) {
            displayRegions(data.data);
        }
    } catch (error) {
        console.error('Error loading regions:', error);
    }
}

// Display Regions
function displayRegions(regions) {
    regionsList.innerHTML = regions.map(region => `
        <div class="col-md-4 col-lg-3">
            <div class="card region-card h-100" onclick="selectRegion('${region.id}')">
                <img src="${region.photo_url || 'images/placeholder.jpg'}" 
                     class="card-img-top" 
                     alt="${region.name}"
                     onerror="this.src='images/placeholder.jpg'">
                <div class="card-body">
                    <h5 class="card-title">${region.name}</h5>
                    <p class="card-text">
                        <i class="fas fa-map-marked-alt"></i> ${region.destinations_count} Destinations
                    </p>
                </div>
            </div>
        </div>
    `).join('');
}

// Load Travel Guides
async function loadTravelGuides() {
    try {
        const response = await fetch('/api/v1/booking/travel-guides');
        const data = await response.json();

        if (data.success) {
            displayTravelGuides(data.data);
        }
    } catch (error) {
        console.error('Error loading travel guides:', error);
    }
}

// Display Travel Guides
function displayTravelGuides(guides) {
    travelGuides.innerHTML = guides.map(guide => `
        <div class="col-md-6 col-lg-4">
            <div class="card guide-card h-100">
                <img src="${guide.photo_url || 'images/placeholder.jpg'}" 
                     class="card-img-top" 
                     alt="${guide.title}"
                     onerror="this.src='images/placeholder.jpg'">
                <div class="card-body">
                    <h5 class="card-title">${guide.title}</h5>
                    <p class="card-text">${guide.description}</p>
                    <div class="d-flex justify-content-between align-items-center">
                        <small class="text-muted">
                            <i class="fas fa-clock"></i> ${guide.reading_time} min read
                        </small>
                        <a href="#" class="btn btn-link">Read More</a>
                    </div>
                </div>
            </div>
        </div>
    `).join('');
}

// Load Sustainability Initiatives
async function loadSustainabilityInitiatives() {
    try {
        const response = await fetch('/api/v1/booking/sustainability');
        const data = await response.json();

        if (data.success) {
            displaySustainabilityInitiatives(data.data);
        }
    } catch (error) {
        console.error('Error loading sustainability initiatives:', error);
    }
}

// Display Sustainability Initiatives
function displaySustainabilityInitiatives(initiatives) {
    sustainabilityInitiatives.innerHTML = initiatives.map(initiative => `
        <div class="col-md-6">
            <div class="card sustainability-card h-100">
                <div class="card-body">
                    <div class="d-flex align-items-center mb-3">
                        <i class="fas ${initiative.icon} fa-2x text-primary me-3"></i>
                        <h5 class="card-title mb-0">${initiative.title}</h5>
                    </div>
                    <p class="card-text">${initiative.description}</p>
                    <ul class="list-unstyled">
                        ${initiative.highlights.map(highlight => `
                            <li class="mb-2">
                                <i class="fas fa-check text-success me-2"></i>
                                ${highlight}
                            </li>
                        `).join('')}
                    </ul>
                </div>
            </div>
        </div>
    `).join('');
}

// Handle Search
function handleSearch(e) {
    e.preventDefault();
    currentState.search = searchInput.value;
    currentState.page = 1;
    loadDestinations();
}

// Select Region
function selectRegion(regionId) {
    currentState.selectedRegion = regionId;
    currentState.page = 1;
    loadDestinations();
}

// Handle Newsletter Subscription
async function handleNewsletterSubscription(e) {
    e.preventDefault();
    const email = e.target.querySelector('input[type="email"]').value;

    try {
        const response = await fetch('/api/v1/booking/newsletter/subscribe', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ email })
        });

        const data = await response.json();

        if (data.success) {
            alert('Thank you for subscribing to our newsletter!');
            e.target.reset();
        } else {
            alert(data.message || 'Failed to subscribe to newsletter');
        }
    } catch (error) {
        console.error('Error subscribing to newsletter:', error);
        alert('An error occurred while subscribing to the newsletter');
    }
}

// Update Pagination
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

// Change Page
function changePage(page) {
    currentState.page = page;
    loadDestinations();
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

// UI State Management
function showLoading() {
    loadingState.classList.remove('d-none');
    errorState.classList.add('d-none');
    destinationContent.classList.add('d-none');
}

function showError(message) {
    loadingState.classList.add('d-none');
    errorState.classList.remove('d-none');
    destinationContent.classList.add('d-none');
    errorState.textContent = message;
}

function showContent() {
    loadingState.classList.add('d-none');
    errorState.classList.add('d-none');
    destinationContent.classList.remove('d-none');
} 