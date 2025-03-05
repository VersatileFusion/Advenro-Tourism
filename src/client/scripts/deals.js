// DOM Elements
const loadingState = document.getElementById('loadingState');
const errorState = document.getElementById('errorState');
const dealsContent = document.getElementById('dealsContent');
const searchForm = document.getElementById('dealsSearchForm');
const searchInput = document.getElementById('searchInput');
const filterForm = document.getElementById('filterForm');
const dealTypeFilter = document.getElementById('dealTypeFilter');
const destinationFilter = document.getElementById('destinationFilter');
const discountFilter = document.getElementById('discountFilter');
const sortFilter = document.getElementById('sortFilter');
const featuredDeals = document.getElementById('featuredDeals');
const dealsGrid = document.getElementById('dealsGrid');
const loadMoreBtn = document.getElementById('loadMoreBtn');
const viewToggleButtons = document.querySelectorAll('[data-view]');
const newsletterForm = document.getElementById('newsletterForm');
const footerNewsletterForm = document.getElementById('footerNewsletterForm');

// State Management
let currentState = {
    page: 1,
    totalPages: 1,
    view: 'grid',
    filters: {
        search: '',
        type: '',
        destination: '',
        discount: '',
        sort: 'newest'
    }
};

// Initialize page
document.addEventListener('DOMContentLoaded', () => {
    initializeEventListeners();
    loadDestinations();
    loadDeals();
});

// Initialize Event Listeners
function initializeEventListeners() {
    searchForm.addEventListener('submit', handleSearch);
    filterForm.addEventListener('change', handleFilterChange);
    loadMoreBtn.addEventListener('click', handleLoadMore);
    viewToggleButtons.forEach(button => {
        button.addEventListener('click', () => handleViewToggle(button.dataset.view));
    });
    newsletterForm.addEventListener('submit', handleNewsletterSubscription);
    footerNewsletterForm.addEventListener('submit', handleNewsletterSubscription);
}

// Load Destinations
async function loadDestinations() {
    try {
        const response = await fetch('/api/v1/booking/destinations');
        const data = await response.json();

        if (data.success) {
            populateDestinationFilter(data.destinations);
        }
    } catch (error) {
        console.error('Error loading destinations:', error);
    }
}

// Populate Destination Filter
function populateDestinationFilter(destinations) {
    const options = destinations.map(destination => `
        <option value="${destination.id}">${destination.name}, ${destination.country}</option>
    `).join('');

    destinationFilter.innerHTML = `
        <option value="">All Destinations</option>
        ${options}
    `;
}

// Load Deals
async function loadDeals() {
    try {
        showLoading();
        
        const queryParams = new URLSearchParams({
            page: currentState.page,
            search: currentState.filters.search,
            type: currentState.filters.type,
            destination: currentState.filters.destination,
            discount: currentState.filters.discount,
            sort: currentState.filters.sort
        });

        const response = await fetch(`/api/v1/booking/deals?${queryParams}`);
        const data = await response.json();

        if (data.success) {
            if (currentState.page === 1) {
                displayFeaturedDeals(data.featured);
                clearDeals();
            }
            
            displayDeals(data.deals);
            updateLoadMoreButton(data.currentPage, data.totalPages);
            currentState.totalPages = data.totalPages;
            showContent();
        } else {
            throw new Error(data.message || 'Failed to load deals');
        }
    } catch (error) {
        showError(error.message);
    }
}

// Display Featured Deals
function displayFeaturedDeals(deals) {
    featuredDeals.innerHTML = deals.map(deal => `
        <div class="col-md-6 col-lg-4">
            <div class="card h-100">
                <div class="position-relative">
                    <img src="${deal.image_url}" 
                         class="card-img-top" 
                         alt="${deal.title}"
                         style="height: 200px; object-fit: cover;">
                    <div class="position-absolute top-0 end-0 m-2">
                        <span class="badge bg-danger">${deal.discount}% OFF</span>
                    </div>
                </div>
                <div class="card-body">
                    <h5 class="card-title">${deal.title}</h5>
                    <p class="card-text text-muted mb-2">
                        <i class="fas fa-map-marker-alt"></i> ${deal.destination}
                    </p>
                    <p class="card-text">${deal.description}</p>
                    <div class="d-flex justify-content-between align-items-center">
                        <div>
                            <span class="text-decoration-line-through text-muted">
                                $${deal.original_price}
                            </span>
                            <span class="ms-2 text-primary fw-bold">
                                $${deal.discounted_price}
                            </span>
                        </div>
                        <a href="${deal.link}" class="btn btn-primary">
                            View Deal
                        </a>
                    </div>
                    <div class="mt-2">
                        <small class="text-muted">
                            <i class="fas fa-clock"></i> Ends ${formatDate(new Date(deal.end_date))}
                        </small>
                    </div>
                </div>
            </div>
        </div>
    `).join('');
}

// Display Deals
function displayDeals(deals) {
    const template = currentState.view === 'grid' ? getGridTemplate : getListTemplate;
    
    const dealsHTML = deals.map(template).join('');
    
    if (currentState.page === 1) {
        dealsGrid.innerHTML = dealsHTML;
    } else {
        dealsGrid.insertAdjacentHTML('beforeend', dealsHTML);
    }
}

// Grid Template
function getGridTemplate(deal) {
    return `
        <div class="col-md-6 col-lg-4">
            <div class="card h-100">
                <div class="position-relative">
                    <img src="${deal.image_url}" 
                         class="card-img-top" 
                         alt="${deal.title}"
                         style="height: 200px; object-fit: cover;">
                    <div class="position-absolute top-0 end-0 m-2">
                        <span class="badge bg-danger">${deal.discount}% OFF</span>
                    </div>
                </div>
                <div class="card-body">
                    <h5 class="card-title">${deal.title}</h5>
                    <p class="card-text text-muted mb-2">
                        <i class="fas fa-map-marker-alt"></i> ${deal.destination}
                    </p>
                    <p class="card-text">${deal.description}</p>
                    <div class="d-flex justify-content-between align-items-center">
                        <div>
                            <span class="text-decoration-line-through text-muted">
                                $${deal.original_price}
                            </span>
                            <span class="ms-2 text-primary fw-bold">
                                $${deal.discounted_price}
                            </span>
                        </div>
                        <a href="${deal.link}" class="btn btn-outline-primary">
                            View Deal
                        </a>
                    </div>
                    <div class="mt-2">
                        <small class="text-muted">
                            <i class="fas fa-clock"></i> Ends ${formatDate(new Date(deal.end_date))}
                        </small>
                    </div>
                </div>
            </div>
        </div>
    `;
}

// List Template
function getListTemplate(deal) {
    return `
        <div class="col-12">
            <div class="card">
                <div class="row g-0">
                    <div class="col-md-4">
                        <div class="position-relative h-100">
                            <img src="${deal.image_url}" 
                                 class="img-fluid rounded-start" 
                                 alt="${deal.title}"
                                 style="height: 100%; object-fit: cover;">
                            <div class="position-absolute top-0 end-0 m-2">
                                <span class="badge bg-danger">${deal.discount}% OFF</span>
                            </div>
                        </div>
                    </div>
                    <div class="col-md-8">
                        <div class="card-body">
                            <h5 class="card-title">${deal.title}</h5>
                            <p class="card-text text-muted mb-2">
                                <i class="fas fa-map-marker-alt"></i> ${deal.destination}
                            </p>
                            <p class="card-text">${deal.description}</p>
                            <div class="d-flex justify-content-between align-items-center">
                                <div>
                                    <span class="text-decoration-line-through text-muted">
                                        $${deal.original_price}
                                    </span>
                                    <span class="ms-2 text-primary fw-bold">
                                        $${deal.discounted_price}
                                    </span>
                                </div>
                                <a href="${deal.link}" class="btn btn-outline-primary">
                                    View Deal
                                </a>
                            </div>
                            <div class="mt-2">
                                <small class="text-muted">
                                    <i class="fas fa-clock"></i> Ends ${formatDate(new Date(deal.end_date))}
                                </small>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `;
}

// Handle Search
function handleSearch(e) {
    e.preventDefault();
    currentState.filters.search = searchInput.value;
    currentState.page = 1;
    loadDeals();
}

// Handle Filter Change
function handleFilterChange() {
    currentState.filters.type = dealTypeFilter.value;
    currentState.filters.destination = destinationFilter.value;
    currentState.filters.discount = discountFilter.value;
    currentState.filters.sort = sortFilter.value;
    currentState.page = 1;
    loadDeals();
}

// Handle View Toggle
function handleViewToggle(view) {
    currentState.view = view;
    
    // Update active button state
    viewToggleButtons.forEach(button => {
        button.classList.toggle('active', button.dataset.view === view);
    });

    // Reload deals with new view
    loadDeals();
}

// Handle Load More
function handleLoadMore() {
    currentState.page++;
    loadDeals();
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
    dealsContent.classList.add('d-none');
}

function showError(message) {
    loadingState.classList.add('d-none');
    errorState.classList.remove('d-none');
    dealsContent.classList.add('d-none');
    errorState.textContent = message;
}

function showContent() {
    loadingState.classList.add('d-none');
    errorState.classList.add('d-none');
    dealsContent.classList.remove('d-none');
}

function clearDeals() {
    dealsGrid.innerHTML = '';
}

function updateLoadMoreButton(currentPage, totalPages) {
    if (currentPage < totalPages) {
        loadMoreBtn.classList.remove('d-none');
    } else {
        loadMoreBtn.classList.add('d-none');
    }
}

function formatDate(date) {
    return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });
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