// Get booking ID from URL parameters
const urlParams = new URLSearchParams(window.location.search);
const bookingId = urlParams.get('id');

// DOM Elements
const loadingState = document.getElementById('loadingState');
const errorState = document.getElementById('errorState');
const confirmationContent = document.getElementById('confirmationContent');
const bookingReference = document.getElementById('bookingReference');
const hotelName = document.getElementById('hotelName');
const hotelAddress = document.getElementById('hotelAddress');
const roomType = document.getElementById('roomType');
const guestCount = document.getElementById('guestCount');
const checkInDate = document.getElementById('checkInDate');
const checkOutDate = document.getElementById('checkOutDate');
const paymentDetails = document.getElementById('paymentDetails');
const parkingInfo = document.getElementById('parkingInfo');
const internetInfo = document.getElementById('internetInfo');
const diningInfo = document.getElementById('diningInfo');

// Initialize page
document.addEventListener('DOMContentLoaded', () => {
    if (!bookingId) {
        showError('Booking ID is missing');
        return;
    }
    loadBookingDetails();
});

// Load Booking Details
async function loadBookingDetails() {
    try {
        const response = await fetch(`/api/v1/booking/reservations/${bookingId}`);
        const data = await response.json();

        if (data.success) {
            displayBookingDetails(data.data);
            showContent();
        } else {
            showError('Failed to load booking details');
        }
    } catch (error) {
        console.error('Error loading booking details:', error);
        showError('An error occurred while loading booking details');
    }
}

// Display Booking Details
function displayBookingDetails(booking) {
    // Update page title
    document.title = `Booking Confirmation: ${booking.reference} - Tourism Explorer`;
    
    // Display booking reference
    bookingReference.textContent = booking.reference;
    
    // Display hotel information
    hotelName.textContent = booking.hotel.name;
    hotelAddress.textContent = booking.hotel.address;
    
    // Display room information
    roomType.textContent = booking.room.name;
    guestCount.textContent = `${booking.guests} Guest${booking.guests > 1 ? 's' : ''}`;
    
    // Display dates
    const checkIn = new Date(booking.checkIn);
    const checkOut = new Date(booking.checkOut);
    checkInDate.textContent = formatDate(checkIn);
    checkOutDate.textContent = formatDate(checkOut);
    
    // Display payment details
    displayPaymentDetails(booking);
    
    // Display amenity information
    displayAmenityInformation(booking.hotel.amenities);
}

// Display Payment Details
function displayPaymentDetails(booking) {
    const nights = calculateNights(new Date(booking.checkIn), new Date(booking.checkOut));
    const roomTotal = booking.room.price * nights;
    const tax = roomTotal * 0.1; // Assuming 10% tax
    const total = roomTotal + tax;

    paymentDetails.innerHTML = `
        <tr>
            <td>Room Rate (${nights} night${nights > 1 ? 's' : ''})</td>
            <td class="text-end">$${booking.room.price} × ${nights}</td>
            <td class="text-end">$${roomTotal.toFixed(2)}</td>
        </tr>
        <tr>
            <td>Taxes and Fees</td>
            <td class="text-end">10%</td>
            <td class="text-end">$${tax.toFixed(2)}</td>
        </tr>
        <tr class="fw-bold">
            <td>Total</td>
            <td></td>
            <td class="text-end">$${total.toFixed(2)}</td>
        </tr>
        <tr class="text-success">
            <td>Paid in Full</td>
            <td></td>
            <td class="text-end"><i class="fas fa-check-circle"></i></td>
        </tr>
    `;
}

// Display Amenity Information
function displayAmenityInformation(amenities) {
    // Update parking information
    parkingInfo.textContent = amenities.parking
        ? `${amenities.parking.type} parking available (${amenities.parking.cost})`
        : 'Parking information not available';

    // Update internet information
    internetInfo.textContent = amenities.internet
        ? `${amenities.internet.type} WiFi available (${amenities.internet.cost})`
        : 'Internet information not available';

    // Update dining information
    diningInfo.textContent = amenities.dining
        ? `${amenities.dining.restaurants} restaurant${amenities.dining.restaurants > 1 ? 's' : ''} on-site. ${amenities.dining.breakfast ? 'Breakfast included.' : ''}`
        : 'Dining information not available';
}

// Copy Booking Reference
function copyBookingReference() {
    const reference = bookingReference.textContent;
    navigator.clipboard.writeText(reference)
        .then(() => {
            alert('Booking reference copied to clipboard!');
        })
        .catch(err => {
            console.error('Failed to copy booking reference:', err);
            alert('Failed to copy booking reference. Please try selecting and copying manually.');
        });
}

// Download Confirmation
function downloadConfirmation() {
    // Implementation depends on your PDF generation solution
    alert('Download functionality will be implemented soon.');
}

// Helper Functions
function formatDate(date) {
    return date.toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });
}

function calculateNights(checkIn, checkOut) {
    const diffTime = Math.abs(checkOut - checkIn);
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
}

// UI State Management
function showLoading() {
    loadingState.classList.remove('d-none');
    errorState.classList.add('d-none');
    confirmationContent.classList.add('d-none');
}

function showError(message) {
    loadingState.classList.add('d-none');
    errorState.classList.remove('d-none');
    confirmationContent.classList.add('d-none');
    errorState.textContent = message;
}

function showContent() {
    loadingState.classList.add('d-none');
    errorState.classList.add('d-none');
    confirmationContent.classList.remove('d-none');
} 