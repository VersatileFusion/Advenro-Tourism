document.addEventListener('DOMContentLoaded', () => {
    const destinationInput = document.getElementById('destination');
    const startDateInput = document.getElementById('startDate');
    const durationSelect = document.getElementById('duration');
    const guestsInput = document.getElementById('guests');
    const priceRangeSelect = document.getElementById('priceRange');
    const searchButton = document.getElementById('searchTours');
    const tourResults = document.getElementById('tourResults');
    const loadingSpinner = document.getElementById('loadingSpinner');
    const destinationSuggestions = document.getElementById('destinationSuggestions');

    // Set minimum date for start date input
    const today = new Date().toISOString().split('T')[0];
    startDateInput.min = today;

    // Handle guest count buttons
    document.querySelectorAll('.guest-btn').forEach(button => {
        button.addEventListener('click', () => {
            const action = button.dataset.action;
            const currentValue = parseInt(guestsInput.value);
            
            if (action === 'increase' && currentValue < 10) {
                guestsInput.value = currentValue + 1;
            } else if (action === 'decrease' && currentValue > 1) {
                guestsInput.value = currentValue - 1;
            }
        });
    });

    // Destination search debounce
    let searchTimeout;
    const searchDestinations = async (query) => {
        if (query.length < 2) {
            destinationSuggestions.style.display = 'none';
            return;
        }

        try {
            const response = await fetch(`/api/destinations/search?q=${encodeURIComponent(query)}`);
            const destinations = await response.json();
            
            destinationSuggestions.innerHTML = destinations.map(dest => `
                <div class="destination-suggestion-item" data-id="${dest.id}">
                    ${dest.name}, ${dest.country}
                </div>
            `).join('');

            destinationSuggestions.style.display = destinations.length ? 'block' : 'none';
        } catch (error) {
            console.error('Error searching destinations:', error);
            destinationSuggestions.style.display = 'none';
        }
    };

    // Event listener for destination search
    destinationInput.addEventListener('input', (e) => {
        clearTimeout(searchTimeout);
        searchTimeout = setTimeout(() => searchDestinations(e.target.value), 300);
    });

    // Handle destination selection
    destinationSuggestions.addEventListener('click', (e) => {
        if (e.target.classList.contains('destination-suggestion-item')) {
            destinationInput.value = e.target.textContent.trim();
            destinationSuggestions.style.display = 'none';
        }
    });

    // Get selected filters
    const getSelectedFilters = () => {
        const tourTypes = Array.from(document.querySelectorAll('input[type="checkbox"][value^="guided"], input[type="checkbox"][value^="self-guided"], input[type="checkbox"][value^="private"], input[type="checkbox"][value^="group"]'))
            .filter(cb => cb.checked)
            .map(cb => cb.value);

        const activities = Array.from(document.querySelectorAll('input[type="checkbox"][value^="hiking"], input[type="checkbox"][value^="cultural"], input[type="checkbox"][value^="adventure"], input[type="checkbox"][value^="relaxation"]'))
            .filter(cb => cb.checked)
            .map(cb => cb.value);

        return {
            tourTypes,
            activities
        };
    };

    // Handle tour search
    searchButton.addEventListener('click', async () => {
        const searchParams = {
            destination: destinationInput.value,
            startDate: startDateInput.value,
            duration: durationSelect.value,
            guests: parseInt(guestsInput.value),
            priceRange: priceRangeSelect.value,
            ...getSelectedFilters()
        };

        if (!searchParams.destination || !searchParams.startDate) {
            alert('Please fill in all required fields');
            return;
        }

        loadingSpinner.style.display = 'flex';
        tourResults.innerHTML = '';

        try {
            const response = await fetch('/api/tours/search', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(searchParams)
            });

            const tours = await response.json();

            if (tours.length === 0) {
                tourResults.innerHTML = '<p>No tours found for your search criteria.</p>';
            } else {
                tourResults.innerHTML = tours.map(tour => `
                    <div class="tour-card">
                        <img src="${tour.image}" alt="${tour.name}" class="tour-image">
                        <div class="tour-content">
                            <h3 class="tour-title">${tour.name}</h3>
                            <div class="tour-details">
                                <span>${tour.duration} days</span>
                                <span>${tour.maxGroupSize} max group size</span>
                                <span>${tour.difficulty}</span>
                            </div>
                            <p class="tour-description">${tour.description}</p>
                            <div class="tour-features">
                                ${tour.features.map(feature => `
                                    <span class="feature-tag">${feature}</span>
                                `).join('')}
                            </div>
                            <div class="tour-price">
                                From $${tour.price}
                            </div>
                            <button class="book-button" data-tour-id="${tour.id}">
                                Book Now
                            </button>
                        </div>
                    </div>
                `).join('');

                // Add event listeners to book buttons
                document.querySelectorAll('.book-button').forEach(button => {
                    button.addEventListener('click', () => {
                        const tourId = button.dataset.tourId;
                        window.location.href = `/tours/${tourId}/book`;
                    });
                });
            }
        } catch (error) {
            console.error('Error searching tours:', error);
            tourResults.innerHTML = '<p>An error occurred while searching for tours. Please try again.</p>';
        } finally {
            loadingSpinner.style.display = 'none';
        }
    });

    // Close suggestions when clicking outside
    document.addEventListener('click', (e) => {
        if (!destinationInput.contains(e.target) && !destinationSuggestions.contains(e.target)) {
            destinationSuggestions.style.display = 'none';
        }
    });
}); 