document.addEventListener('DOMContentLoaded', () => {
    const fromInput = document.getElementById('from');
    const toInput = document.getElementById('to');
    const departureInput = document.getElementById('departure');
    const returnInput = document.getElementById('return');
    const passengersSelect = document.getElementById('passengers');
    const searchButton = document.getElementById('searchFlights');
    const flightResults = document.getElementById('flightResults');
    const loadingSpinner = document.getElementById('loadingSpinner');
    const fromSuggestions = document.getElementById('fromSuggestions');
    const toSuggestions = document.getElementById('toSuggestions');

    // Set minimum date for departure and return inputs
    const today = new Date().toISOString().split('T')[0];
    departureInput.min = today;
    returnInput.min = today;

    // Airport search debounce
    let searchTimeout;
    const searchAirports = async (query, suggestionsElement) => {
        if (query.length < 2) {
            suggestionsElement.style.display = 'none';
            return;
        }

        try {
            const response = await fetch(`/api/airports/search?q=${encodeURIComponent(query)}`);
            const airports = await response.json();
            
            suggestionsElement.innerHTML = airports.map(airport => `
                <div class="airport-suggestion-item" data-code="${airport.code}">
                    ${airport.name} (${airport.code})
                </div>
            `).join('');

            suggestionsElement.style.display = airports.length ? 'block' : 'none';
        } catch (error) {
            console.error('Error searching airports:', error);
            suggestionsElement.style.display = 'none';
        }
    };

    // Event listeners for airport search
    fromInput.addEventListener('input', (e) => {
        clearTimeout(searchTimeout);
        searchTimeout = setTimeout(() => searchAirports(e.target.value, fromSuggestions), 300);
    });

    toInput.addEventListener('input', (e) => {
        clearTimeout(searchTimeout);
        searchTimeout = setTimeout(() => searchAirports(e.target.value, toSuggestions), 300);
    });

    // Handle airport selection
    fromSuggestions.addEventListener('click', (e) => {
        if (e.target.classList.contains('airport-suggestion-item')) {
            fromInput.value = e.target.textContent.trim();
            fromSuggestions.style.display = 'none';
        }
    });

    toSuggestions.addEventListener('click', (e) => {
        if (e.target.classList.contains('airport-suggestion-item')) {
            toInput.value = e.target.textContent.trim();
            toSuggestions.style.display = 'none';
        }
    });

    // Handle flight search
    searchButton.addEventListener('click', async () => {
        const searchParams = {
            from: fromInput.value.split('(')[1]?.replace(')', ''),
            to: toInput.value.split('(')[1]?.replace(')', ''),
            departure: departureInput.value,
            return: returnInput.value,
            passengers: passengersSelect.value
        };

        if (!searchParams.from || !searchParams.to || !searchParams.departure) {
            alert('Please fill in all required fields');
            return;
        }

        loadingSpinner.style.display = 'flex';
        flightResults.innerHTML = '';

        try {
            const response = await fetch('/api/flights/search', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(searchParams)
            });

            const flights = await response.json();

            if (flights.length === 0) {
                flightResults.innerHTML = '<p>No flights found for your search criteria.</p>';
            } else {
                flightResults.innerHTML = flights.map(flight => `
                    <div class="flight-card">
                        <img src="${flight.airlineLogo}" alt="${flight.airline}" class="airline-logo">
                        <div class="flight-details">
                            <h3>${flight.airline}</h3>
                            <p>${flight.departureTime} - ${flight.arrivalTime}</p>
                            <p>${flight.duration}</p>
                            <p>${flight.stops} stops</p>
                        </div>
                        <div class="flight-price">
                            $${flight.price}
                        </div>
                    </div>
                `).join('');
            }
        } catch (error) {
            console.error('Error searching flights:', error);
            flightResults.innerHTML = '<p>An error occurred while searching for flights. Please try again.</p>';
        } finally {
            loadingSpinner.style.display = 'none';
        }
    });

    // Close suggestions when clicking outside
    document.addEventListener('click', (e) => {
        if (!fromInput.contains(e.target) && !fromSuggestions.contains(e.target)) {
            fromSuggestions.style.display = 'none';
        }
        if (!toInput.contains(e.target) && !toSuggestions.contains(e.target)) {
            toSuggestions.style.display = 'none';
        }
    });
}); 