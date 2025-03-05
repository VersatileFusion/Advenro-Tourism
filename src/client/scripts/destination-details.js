// Get destination ID from URL parameters
const urlParams = new URLSearchParams(window.location.search);
const destinationId = urlParams.get('id');

// DOM Elements
const loadingState = document.getElementById('loadingState');
const errorState = document.getElementById('errorState');
const destinationContent = document.getElementById('destinationContent');
const continentBreadcrumb = document.getElementById('continentBreadcrumb');
const destinationBreadcrumb = document.getElementById('destinationBreadcrumb');
const destinationName = document.getElementById('destinationName');
const destinationLocation = document.getElementById('destinationLocation');
const travelStyle = document.getElementById('travelStyle');
const bestSeason = document.getElementById('bestSeason');
const budgetCategory = document.getElementById('budgetCategory');
const destinationDescription = document.getElementById('destinationDescription');
const photoGallery = document.getElementById('photoGallery');
const attractionsList = document.getElementById('attractionsList');
const activitiesList = document.getElementById('activitiesList');
const travelTipsAccordion = document.getElementById('travelTipsAccordion');
const weatherInfo = document.getElementById('weatherInfo');
const monthlyWeather = document.getElementById('monthlyWeather');
const seasonalInfo = document.getElementById('seasonalInfo');
const transportationInfo = document.getElementById('transportationInfo');
const hotelsList = document.getElementById('hotelsList');
const relatedDestinations = document.getElementById('relatedDestinations');
const reviewsList = document.getElementById('reviewsList');
const loadMoreReviews = document.getElementById('loadMoreReviews');
const shareButton = document.getElementById('shareButton');
const favoriteButton = document.getElementById('favoriteButton');
const reviewForm = document.getElementById('reviewForm');
const ratingInput = document.getElementById('ratingInput');
const newsletterForm = document.getElementById('newsletterForm');

// State Management
let destinationData = null;
let map = null;
let marker = null;
let swiper = null;
let currentReviewPage = 1;
let totalReviewPages = 1;
let isFavorite = false;

// Initialize page
document.addEventListener('DOMContentLoaded', () => {
    if (!destinationId) {
        showError('Destination ID is missing');
        return;
    }
    initializeEventListeners();
    loadDestinationDetails();
});

// Initialize Event Listeners
function initializeEventListeners() {
    shareButton.addEventListener('click', () => {
        const shareModal = new bootstrap.Modal(document.getElementById('shareModal'));
        shareModal.show();
    });
    favoriteButton.addEventListener('click', toggleFavorite);
    reviewForm.addEventListener('submit', handleReviewSubmission);
    loadMoreReviews.addEventListener('click', () => {
        currentReviewPage++;
        loadReviews();
    });
    newsletterForm.addEventListener('submit', handleNewsletterSubscription);

    // Rating input event listeners
    document.querySelectorAll('.rating-input i').forEach(star => {
        star.addEventListener('mouseover', handleStarHover);
        star.addEventListener('mouseout', handleStarHoverOut);
        star.addEventListener('click', handleStarClick);
    });
}

// Load Destination Details
async function loadDestinationDetails() {
    try {
        showLoading();
        
        const response = await fetch(`/api/v1/booking/destinations/${destinationId}`);
        const data = await response.json();

        if (data.success) {
            destinationData = data.destination;
            displayDestinationDetails();
            initializePhotoGallery();
            initializeMap();
            loadAttractions();
            loadActivities();
            loadTravelTips();
            loadWeatherInfo();
            loadTransportationInfo();
            loadHotels();
            loadRelatedDestinations();
            loadReviews();
            checkFavoriteStatus();
            showContent();
        } else {
            throw new Error(data.message || 'Failed to load destination details');
        }
    } catch (error) {
        showError(error.message);
    }
}

// Display Destination Details
function displayDestinationDetails() {
    document.title = `${destinationData.name} - Tourism Explorer`;
    
    continentBreadcrumb.textContent = destinationData.continent;
    destinationBreadcrumb.textContent = destinationData.name;
    destinationName.textContent = destinationData.name;
    destinationLocation.textContent = `${destinationData.city}, ${destinationData.country}`;
    travelStyle.textContent = destinationData.travel_style;
    bestSeason.textContent = destinationData.best_season;
    budgetCategory.textContent = destinationData.budget_category;
    destinationDescription.textContent = destinationData.description;
}

// Initialize Photo Gallery
function initializePhotoGallery() {
    photoGallery.innerHTML = destinationData.photos.map(photo => `
        <div class="swiper-slide">
            <img src="${photo.url}" 
                 alt="${photo.caption || destinationData.name}"
                 class="img-fluid w-100"
                 style="height: 500px; object-fit: cover;">
            ${photo.caption ? `
                <div class="swiper-caption">
                    <p class="mb-0">${photo.caption}</p>
                </div>
            ` : ''}
        </div>
    `).join('');

    swiper = new Swiper('.swiper', {
        loop: true,
        pagination: {
            el: '.swiper-pagination',
            clickable: true
        },
        navigation: {
            nextEl: '.swiper-button-next',
            prevEl: '.swiper-button-prev'
        }
    });
}

// Initialize Map
function initializeMap() {
    map = L.map('mapContainer').setView([
        destinationData.latitude,
        destinationData.longitude
    ], 13);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors'
    }).addTo(map);

    marker = L.marker([destinationData.latitude, destinationData.longitude])
        .addTo(map)
        .bindPopup(`<strong>${destinationData.name}</strong>`);
}

// Load Attractions
async function loadAttractions() {
    try {
        const response = await fetch(`/api/v1/booking/destinations/${destinationId}/attractions`);
        const data = await response.json();

        if (data.success) {
            displayAttractions(data.attractions);
        }
    } catch (error) {
        console.error('Error loading attractions:', error);
    }
}

// Display Attractions
function displayAttractions(attractions) {
    attractionsList.innerHTML = attractions.map(attraction => `
        <div class="col-md-6">
            <div class="card h-100">
                <img src="${attraction.image_url}" 
                     class="card-img-top" 
                     alt="${attraction.name}"
                     style="height: 200px; object-fit: cover;">
                <div class="card-body">
                    <h5 class="card-title">${attraction.name}</h5>
                    <p class="card-text">${attraction.description}</p>
                    <div class="d-flex justify-content-between align-items-center">
                        <span class="text-muted">
                            <i class="fas fa-clock"></i> ${attraction.duration}
                        </span>
                        <a href="#" class="btn btn-outline-primary btn-sm">
                            Learn More
                        </a>
                    </div>
                </div>
            </div>
        </div>
    `).join('');
}

// Load Activities
async function loadActivities() {
    try {
        const response = await fetch(`/api/v1/booking/destinations/${destinationId}/activities`);
        const data = await response.json();

        if (data.success) {
            displayActivities(data.activities);
        }
    } catch (error) {
        console.error('Error loading activities:', error);
    }
}

// Display Activities
function displayActivities(activities) {
    activitiesList.innerHTML = activities.map(activity => `
        <div class="col-md-6 col-lg-4">
            <div class="card h-100">
                <div class="card-body">
                    <div class="d-flex align-items-center mb-3">
                        <i class="fas ${activity.icon} fa-2x text-primary me-3"></i>
                        <h5 class="card-title mb-0">${activity.name}</h5>
                    </div>
                    <p class="card-text">${activity.description}</p>
                    <div class="mt-3">
                        <span class="badge bg-primary me-2">${activity.category}</span>
                        <span class="badge bg-secondary">${activity.difficulty}</span>
                    </div>
                </div>
            </div>
        </div>
    `).join('');
}

// Load Travel Tips
async function loadTravelTips() {
    try {
        const response = await fetch(`/api/v1/booking/destinations/${destinationId}/travel-tips`);
        const data = await response.json();

        if (data.success) {
            displayTravelTips(data.tips);
        }
    } catch (error) {
        console.error('Error loading travel tips:', error);
    }
}

// Display Travel Tips
function displayTravelTips(tips) {
    travelTipsAccordion.innerHTML = tips.map((tip, index) => `
        <div class="accordion-item">
            <h2 class="accordion-header">
                <button class="accordion-button ${index === 0 ? '' : 'collapsed'}" 
                        type="button" 
                        data-bs-toggle="collapse" 
                        data-bs-target="#tip${index}">
                    ${tip.title}
                </button>
            </h2>
            <div id="tip${index}" 
                 class="accordion-collapse collapse ${index === 0 ? 'show' : ''}"
                 data-bs-parent="#travelTipsAccordion">
                <div class="accordion-body">
                    ${tip.content}
                </div>
            </div>
        </div>
    `).join('');
}

// Load Weather Information
async function loadWeatherInfo() {
    try {
        const response = await fetch(`/api/v1/booking/destinations/${destinationId}/weather`);
        const data = await response.json();

        if (data.success) {
            displayWeatherInfo(data.weather);
            displayMonthlyWeather(data.monthly);
            displaySeasonalInfo(data.seasonal);
        }
    } catch (error) {
        console.error('Error loading weather information:', error);
    }
}

// Display Weather Information
function displayWeatherInfo(weather) {
    weatherInfo.innerHTML = `
        <div class="current-weather">
            <div class="d-flex align-items-center">
                <i class="fas ${getWeatherIcon(weather.condition)} fa-3x text-primary me-3"></i>
                <div>
                    <h6 class="mb-1">Current Weather</h6>
                    <p class="mb-0">${weather.temperature}°C, ${weather.condition}</p>
                </div>
            </div>
        </div>
    `;
}

// Display Monthly Weather
function displayMonthlyWeather(monthlyData) {
    monthlyWeather.innerHTML = `
        <h6 class="mb-3">Monthly Average Temperature</h6>
        <div class="row row-cols-3 g-2">
            ${monthlyData.map(month => `
                <div class="col">
                    <div class="p-2 border rounded text-center">
                        <small class="d-block">${month.name}</small>
                        <span class="text-primary">${month.temp}°C</span>
                    </div>
                </div>
            `).join('')}
        </div>
    `;
}

// Display Seasonal Information
function displaySeasonalInfo(seasonal) {
    seasonalInfo.innerHTML = `
        <div class="mb-3">
            <h6 class="mb-2">Peak Season</h6>
            <p class="mb-0">${seasonal.peak_season}</p>
        </div>
        <div class="mb-3">
            <h6 class="mb-2">Shoulder Season</h6>
            <p class="mb-0">${seasonal.shoulder_season}</p>
        </div>
        <div>
            <h6 class="mb-2">Low Season</h6>
            <p class="mb-0">${seasonal.low_season}</p>
        </div>
    `;
}

// Load Transportation Information
async function loadTransportationInfo() {
    try {
        const response = await fetch(`/api/v1/booking/destinations/${destinationId}/transportation`);
        const data = await response.json();

        if (data.success) {
            displayTransportationInfo(data.transportation);
        }
    } catch (error) {
        console.error('Error loading transportation information:', error);
    }
}

// Display Transportation Information
function displayTransportationInfo(transportation) {
    transportationInfo.innerHTML = `
        <div class="mb-3">
            <h6 class="mb-2">Getting There</h6>
            <p class="mb-0">${transportation.getting_there}</p>
        </div>
        <div class="mb-3">
            <h6 class="mb-2">Local Transportation</h6>
            <p class="mb-0">${transportation.local_transport}</p>
        </div>
        ${transportation.tips ? `
            <div>
                <h6 class="mb-2">Transportation Tips</h6>
                <p class="mb-0">${transportation.tips}</p>
            </div>
        ` : ''}
    `;
}

// Load Hotels
async function loadHotels() {
    try {
        const response = await fetch(`/api/v1/booking/destinations/${destinationId}/hotels?limit=3`);
        const data = await response.json();

        if (data.success) {
            displayHotels(data.hotels);
        }
    } catch (error) {
        console.error('Error loading hotels:', error);
    }
}

// Display Hotels
function displayHotels(hotels) {
    hotelsList.innerHTML = hotels.map(hotel => `
        <div class="card mb-2">
            <div class="row g-0">
                <div class="col-4">
                    <img src="${hotel.photo_url}" 
                         class="img-fluid rounded-start" 
                         alt="${hotel.name}"
                         style="height: 100%; object-fit: cover;">
                </div>
                <div class="col-8">
                    <div class="card-body py-2">
                        <h6 class="card-title mb-1">${hotel.name}</h6>
                        <div class="text-warning mb-1">
                            ${getStarRating(hotel.rating)}
                        </div>
                        <p class="card-text small mb-0">From $${hotel.price}/night</p>
                    </div>
                </div>
            </div>
        </div>
    `).join('');
}

// Load Related Destinations
async function loadRelatedDestinations() {
    try {
        const response = await fetch(`/api/v1/booking/destinations/${destinationId}/related`);
        const data = await response.json();

        if (data.success) {
            displayRelatedDestinations(data.destinations);
        }
    } catch (error) {
        console.error('Error loading related destinations:', error);
    }
}

// Display Related Destinations
function displayRelatedDestinations(destinations) {
    relatedDestinations.innerHTML = destinations.map(destination => `
        <div class="card mb-2">
            <div class="row g-0">
                <div class="col-4">
                    <img src="${destination.image_url}" 
                         class="img-fluid rounded-start" 
                         alt="${destination.name}"
                         style="height: 100%; object-fit: cover;">
                </div>
                <div class="col-8">
                    <div class="card-body py-2">
                        <h6 class="card-title mb-1">${destination.name}</h6>
                        <p class="card-text small mb-1">
                            <i class="fas fa-map-marker-alt"></i> ${destination.country}
                        </p>
                        <a href="destination-details.html?id=${destination.id}" 
                           class="stretched-link"></a>
                    </div>
                </div>
            </div>
        </div>
    `).join('');
}

// Load Reviews
async function loadReviews() {
    try {
        const response = await fetch(
            `/api/v1/booking/destinations/${destinationId}/reviews?page=${currentReviewPage}`
        );
        const data = await response.json();

        if (data.success) {
            displayReviews(data.reviews, currentReviewPage === 1);
            updateLoadMoreButton(data.currentPage, data.totalPages);
            totalReviewPages = data.totalPages;
        }
    } catch (error) {
        console.error('Error loading reviews:', error);
    }
}

// Display Reviews
function displayReviews(reviews, isFirstPage) {
    const reviewsHTML = reviews.map(review => `
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
                        By ${review.user_name}
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

    if (isFirstPage) {
        reviewsList.innerHTML = reviewsHTML;
    } else {
        reviewsList.insertAdjacentHTML('beforeend', reviewsHTML);
    }
}

// Handle Review Helpful
async function handleReviewHelpful(reviewId) {
    try {
        const response = await fetch(`/api/v1/booking/reviews/${reviewId}/helpful`, {
            method: 'POST'
        });
        const data = await response.json();

        if (data.success) {
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
        destination_id: destinationId,
        rating: parseInt(ratingInput.value),
        title: document.getElementById('reviewTitle').value,
        comment: document.getElementById('reviewText').value,
        visit_date: document.getElementById('visitDate').value
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

// Check Favorite Status
async function checkFavoriteStatus() {
    try {
        const response = await fetch(`/api/v1/booking/favorites/check/${destinationId}`);
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
        const response = await fetch(`/api/v1/booking/favorites/${destinationId}`, {
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

// Social Sharing Functions
function shareOnFacebook() {
    const url = encodeURIComponent(window.location.href);
    const title = encodeURIComponent(`Check out ${destinationData.name} on Tourism Explorer!`);
    window.open(`https://www.facebook.com/sharer/sharer.php?u=${url}&quote=${title}`, '_blank');
}

function shareOnTwitter() {
    const url = encodeURIComponent(window.location.href);
    const text = encodeURIComponent(`Discover ${destinationData.name} - ${destinationData.description.substring(0, 100)}... via @TourismExplorer`);
    window.open(`https://twitter.com/intent/tweet?url=${url}&text=${text}`, '_blank');
}

function shareOnWhatsApp() {
    const url = encodeURIComponent(window.location.href);
    const text = encodeURIComponent(`Check out ${destinationData.name} on Tourism Explorer: ${url}`);
    window.open(`https://wa.me/?text=${text}`, '_blank');
}

function copyLink() {
    navigator.clipboard.writeText(window.location.href)
        .then(() => {
            showAlert('Link copied to clipboard!', 'success');
        })
        .catch(() => {
            showAlert('Failed to copy link. Please try again.', 'danger');
        });
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

// Helper Functions
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

function getWeatherIcon(condition) {
    const icons = {
        'clear': 'fa-sun',
        'partly cloudy': 'fa-cloud-sun',
        'cloudy': 'fa-cloud',
        'rain': 'fa-cloud-rain',
        'snow': 'fa-snowflake',
        'storm': 'fa-bolt',
        'fog': 'fa-smog'
    };
    return icons[condition.toLowerCase()] || 'fa-sun';
}

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

function formatDate(date) {
    return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });
}

function updateLoadMoreButton(currentPage, totalPages) {
    if (currentPage < totalPages) {
        loadMoreReviews.classList.remove('d-none');
    } else {
        loadMoreReviews.classList.add('d-none');
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