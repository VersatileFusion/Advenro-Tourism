document.addEventListener('DOMContentLoaded', () => {
    // Initialize Stripe
    const stripe = Stripe(STRIPE_PUBLIC_KEY); // Replace STRIPE_PUBLIC_KEY with your actual key or fetch it from the server
    const elements = stripe.elements();
    
    // Get booking ID from URL
    const urlParams = new URLSearchParams(window.location.search);
    const bookingId = urlParams.get('bookingId');
    
    // Elements
    const paymentForm = document.getElementById('payment-form');
    const paymentError = document.getElementById('payment-error');
    const paymentSuccess = document.getElementById('payment-success');
    const loadingSpinner = document.getElementById('payment-loading');
    const bookingSummary = document.getElementById('booking-summary');
    
    // State
    let booking = null;
    let clientSecret = null;
    
    // Initialize
    loadBookingDetails();
    
    // Create card element
    const cardElement = elements.create('card', {
        style: {
            base: {
                fontSize: '16px',
                color: '#424770',
                '::placeholder': {
                    color: '#aab7c4',
                },
            },
            invalid: {
                color: '#9e2146',
            },
        }
    });
    
    // Mount card element
    cardElement.mount('#card-element');
    
    // Load booking details
    async function loadBookingDetails() {
        try {
            showLoading(true);
            
            if (!bookingId) {
                showError('Booking ID is missing');
                return;
            }
            
            const response = await fetch(`/api/bookings/${bookingId}`);
            
            if (!response.ok) {
                throw new Error('Failed to fetch booking details');
            }
            
            booking = await response.json();
            
            // Display booking details
            renderBookingSummary();
            
            // Create payment intent
            await createPaymentIntent();
            
            showLoading(false);
        } catch (error) {
            console.error('Error loading booking:', error);
            showError(error.message);
            showLoading(false);
        }
    }
    
    // Create payment intent
    async function createPaymentIntent() {
        try {
            const response = await fetch('/api/payments/create-payment-intent', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                },
                body: JSON.stringify({ bookingId })
            });
            
            if (!response.ok) {
                throw new Error('Failed to create payment intent');
            }
            
            const data = await response.json();
            clientSecret = data.clientSecret;
        } catch (error) {
            console.error('Error creating payment intent:', error);
            showError(error.message);
        }
    }
    
    // Handle form submission
    if (paymentForm) {
        paymentForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            if (!stripe || !elements || !clientSecret) {
                showError('Payment system is not ready. Please try again.');
                return;
            }
            
            showLoading(true);
            hideError();
            
            try {
                const result = await stripe.confirmCardPayment(clientSecret, {
                    payment_method: {
                        card: cardElement,
                        billing_details: {
                            // You can collect billing details if needed
                            // name: document.getElementById('name').value,
                        }
                    }
                });
                
                if (result.error) {
                    throw new Error(result.error.message);
                }
                
                if (result.paymentIntent.status === 'succeeded') {
                    // Payment succeeded
                    showPaymentSuccess();
                    
                    // Update booking status
                    await updateBookingStatus(result.paymentIntent.id);
                    
                    // Redirect after a delay
                    setTimeout(() => {
                        window.location.href = `/booking-confirmation.html?id=${bookingId}&payment=${result.paymentIntent.id}`;
                    }, 2000);
                }
            } catch (error) {
                console.error('Payment error:', error);
                showError(error.message);
                showLoading(false);
            }
        });
    }
    
    // Update booking status after successful payment
    async function updateBookingStatus(paymentId) {
        try {
            const response = await fetch(`/api/bookings/${bookingId}/payment`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                },
                body: JSON.stringify({ 
                    status: 'confirmed',
                    paymentId 
                })
            });
            
            if (!response.ok) {
                console.error('Failed to update booking status');
            }
        } catch (error) {
            console.error('Error updating booking status:', error);
        }
    }
    
    // Helper functions
    function renderBookingSummary() {
        if (!bookingSummary || !booking) return;
        
        bookingSummary.innerHTML = `
            <h2 class="text-xl font-semibold mb-4">Booking Summary</h2>
            <div class="space-y-2">
                ${booking.hotelId ? `
                    <div class="flex justify-between">
                        <span>Hotel:</span>
                        <span>${booking.hotelId.name}</span>
                    </div>
                ` : ''}
                <div class="flex justify-between">
                    <span>Check-in:</span>
                    <span>${new Date(booking.checkIn).toLocaleDateString()}</span>
                </div>
                <div class="flex justify-between">
                    <span>Check-out:</span>
                    <span>${new Date(booking.checkOut).toLocaleDateString()}</span>
                </div>
                <div class="flex justify-between">
                    <span>Guests:</span>
                    <span>${booking.guests}</span>
                </div>
                <div class="flex justify-between font-semibold text-lg border-t pt-2 mt-2">
                    <span>Total:</span>
                    <span>$${booking.totalPrice.toFixed(2)}</span>
                </div>
            </div>
        `;
    }
    
    function showError(message) {
        if (paymentError) {
            paymentError.textContent = message;
            paymentError.style.display = 'block';
        }
    }
    
    function hideError() {
        if (paymentError) {
            paymentError.textContent = '';
            paymentError.style.display = 'none';
        }
    }
    
    function showLoading(isLoading) {
        if (loadingSpinner) {
            loadingSpinner.style.display = isLoading ? 'flex' : 'none';
        }
        
        if (paymentForm) {
            const submitButton = paymentForm.querySelector('button[type="submit"]');
            if (submitButton) {
                submitButton.disabled = isLoading;
                submitButton.textContent = isLoading ? 'Processing...' : `Pay $${booking?.totalPrice.toFixed(2) || '0.00'}`;
            }
        }
    }
    
    function showPaymentSuccess() {
        if (paymentSuccess) {
            paymentSuccess.style.display = 'block';
        }
        
        if (paymentForm) {
            paymentForm.style.display = 'none';
        }
    }
}); 