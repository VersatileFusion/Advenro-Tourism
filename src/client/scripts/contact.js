// DOM Elements
const contactForm = document.getElementById('contactForm');
const officeLocations = document.getElementById('officeLocations');
const map = document.getElementById('map');
const footerNewsletterForm = document.getElementById('footerNewsletterForm');

// Office Locations Data
const offices = [
    {
        name: 'New York Office',
        address: '123 Travel Street, Suite 100',
        city: 'New York',
        state: 'NY',
        country: 'United States',
        phone: '+1 (234) 567-890',
        email: 'ny@tourismexplorer.com',
        coordinates: [40.7128, -74.0060]
    },
    {
        name: 'London Office',
        address: '456 Tourism Lane',
        city: 'London',
        state: '',
        country: 'United Kingdom',
        phone: '+44 20 7123 4567',
        email: 'london@tourismexplorer.com',
        coordinates: [51.5074, -0.1278]
    },
    {
        name: 'Singapore Office',
        address: '789 Travel Avenue',
        city: 'Singapore',
        state: '',
        country: 'Singapore',
        phone: '+65 6789 0123',
        email: 'singapore@tourismexplorer.com',
        coordinates: [1.3521, 103.8198]
    }
];

// Initialize page
document.addEventListener('DOMContentLoaded', () => {
    initializeMap();
    displayOfficeLocations();
    initializeEventListeners();
});

// Initialize Event Listeners
function initializeEventListeners() {
    contactForm.addEventListener('submit', handleContactForm);
    footerNewsletterForm.addEventListener('submit', handleNewsletterSubscription);
}

// Initialize Map
function initializeMap() {
    const mapInstance = L.map('map').setView([20, 0], 2);
    
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors'
    }).addTo(mapInstance);

    // Add markers for each office
    offices.forEach(office => {
        const marker = L.marker(office.coordinates)
            .bindPopup(`
                <strong>${office.name}</strong><br>
                ${office.address}<br>
                ${office.city}${office.state ? `, ${office.state}` : ''}, ${office.country}<br>
                <a href="tel:${office.phone}">${office.phone}</a><br>
                <a href="mailto:${office.email}">${office.email}</a>
            `)
            .addTo(mapInstance);
    });

    // Fit bounds to show all markers
    const bounds = L.latLngBounds(offices.map(office => office.coordinates));
    mapInstance.fitBounds(bounds);
}

// Display Office Locations
function displayOfficeLocations() {
    officeLocations.innerHTML = offices.map(office => `
        <div class="mb-4">
            <h5 class="h6 mb-2">${office.name}</h5>
            <p class="mb-1">
                <i class="fas fa-map-marker-alt text-primary me-2"></i>
                ${office.address}<br>
                ${office.city}${office.state ? `, ${office.state}` : ''}, ${office.country}
            </p>
            <p class="mb-1">
                <i class="fas fa-phone text-primary me-2"></i>
                <a href="tel:${office.phone}" class="text-decoration-none">${office.phone}</a>
            </p>
            <p class="mb-0">
                <i class="fas fa-envelope text-primary me-2"></i>
                <a href="mailto:${office.email}" class="text-decoration-none">${office.email}</a>
            </p>
        </div>
    `).join('');
}

// Handle Contact Form Submission
async function handleContactForm(e) {
    e.preventDefault();
    
    const submitButton = contactForm.querySelector('button[type="submit"]');
    const formData = {
        firstName: document.getElementById('firstName').value,
        lastName: document.getElementById('lastName').value,
        email: document.getElementById('email').value,
        phone: document.getElementById('phone').value,
        subject: document.getElementById('subject').value,
        message: document.getElementById('message').value,
        subscribeNewsletter: document.getElementById('newsletter').checked
    };

    try {
        submitButton.disabled = true;
        submitButton.innerHTML = '<span class="spinner-border spinner-border-sm"></span> Sending...';

        const response = await fetch('/api/v1/booking/contact', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(formData)
        });

        const data = await response.json();

        if (response.ok) {
            showAlert('Thank you for your message! We will get back to you soon.', 'success');
            contactForm.reset();
        } else {
            throw new Error(data.message || 'Failed to send message. Please try again.');
        }
    } catch (error) {
        showAlert(error.message, 'danger');
    } finally {
        submitButton.disabled = false;
        submitButton.innerHTML = '<i class="fas fa-paper-plane me-2"></i>Send Message';
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

// Helper Functions
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