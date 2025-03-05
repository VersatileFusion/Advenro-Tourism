// DOM Elements
const testimonialsList = document.getElementById('testimonials');
const partnersList = document.getElementById('partners');
const newsletterForm = document.getElementById('newsletterForm');

// Initialize page
document.addEventListener('DOMContentLoaded', () => {
    loadTestimonials();
    loadPartners();
    initializeEventListeners();
});

// Initialize Event Listeners
function initializeEventListeners() {
    newsletterForm.addEventListener('submit', handleNewsletterSubscription);
}

// Load Testimonials
async function loadTestimonials() {
    try {
        const response = await fetch('/api/v1/booking/testimonials');
        const data = await response.json();

        if (data.success) {
            displayTestimonials(data.data);
        }
    } catch (error) {
        console.error('Error loading testimonials:', error);
    }
}

// Display Testimonials
function displayTestimonials(testimonials) {
    testimonialsList.innerHTML = testimonials.map(testimonial => `
        <div class="col-md-4">
            <div class="card h-100 border-0 shadow-sm">
                <div class="card-body">
                    <div class="mb-3">
                        ${generateStars(testimonial.rating)}
                    </div>
                    <p class="card-text">${testimonial.comment}</p>
                    <div class="d-flex align-items-center mt-3">
                        <img src="${testimonial.photo_url || 'images/avatars/default.jpg'}" 
                             alt="${testimonial.name}"
                             class="rounded-circle me-3"
                             width="50"
                             height="50"
                             onerror="this.src='images/avatars/default.jpg'">
                        <div>
                            <h6 class="mb-0">${testimonial.name}</h6>
                            <small class="text-muted">${testimonial.location}</small>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `).join('');
}

// Generate Star Rating
function generateStars(rating) {
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

// Load Partners
async function loadPartners() {
    try {
        const response = await fetch('/api/v1/booking/partners');
        const data = await response.json();

        if (data.success) {
            displayPartners(data.data);
        }
    } catch (error) {
        console.error('Error loading partners:', error);
    }
}

// Display Partners
function displayPartners(partners) {
    partnersList.innerHTML = partners.map(partner => `
        <div class="col-6 col-md-3">
            <div class="card partner-card h-100 border-0">
                <div class="card-body text-center">
                    <img src="${partner.logo_url}" 
                         alt="${partner.name}"
                         class="img-fluid mb-3"
                         style="max-height: 80px;"
                         onerror="this.src='images/partners/default.png'">
                    <h6 class="card-title mb-2">${partner.name}</h6>
                    <p class="text-muted small mb-0">${partner.type}</p>
                </div>
            </div>
        </div>
    `).join('');
}

// Handle Newsletter Subscription
async function handleNewsletterSubscription(e) {
    e.preventDefault();
    const email = e.target.querySelector('input[type="email"]').value;

    // Disable submit button and show loading state
    const submitButton = e.target.querySelector('button[type="submit"]');
    const originalButtonText = submitButton.innerHTML;
    submitButton.disabled = true;
    submitButton.innerHTML = `
        <span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
    `;

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
            showAlert('success', 'Thank you for subscribing to our newsletter!');
            e.target.reset();
        } else {
            showAlert('danger', data.message || 'Failed to subscribe to newsletter');
        }
    } catch (error) {
        console.error('Error subscribing to newsletter:', error);
        showAlert('danger', 'An error occurred while subscribing to the newsletter');
    } finally {
        // Restore submit button state
        submitButton.disabled = false;
        submitButton.innerHTML = originalButtonText;
    }
}

// Show Alert Message
function showAlert(type, message) {
    // Remove any existing alerts
    const existingAlerts = document.querySelectorAll('.alert');
    existingAlerts.forEach(alert => alert.remove());

    // Create new alert
    const alertDiv = document.createElement('div');
    alertDiv.className = `alert alert-${type} alert-dismissible fade show`;
    alertDiv.role = 'alert';
    alertDiv.innerHTML = `
        ${message}
        <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
    `;

    // Insert alert before the form
    const targetForm = event.target.closest('form');
    targetForm.parentElement.insertBefore(alertDiv, targetForm);

    // Auto-dismiss after 5 seconds
    setTimeout(() => {
        alertDiv.remove();
    }, 5000);
} 