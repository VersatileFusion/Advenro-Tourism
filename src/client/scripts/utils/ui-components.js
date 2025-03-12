// UI Components Utility File

// Loading State Component
const createLoadingSpinner = () => {
    const spinner = document.createElement('div');
    spinner.className = 'loading-spinner';
    spinner.innerHTML = `
        <div class="spinner-container">
            <div class="spinner"></div>
            <p class="loading-text">Loading...</p>
        </div>
    `;
    return spinner;
};

// Error Handling Component
const showError = (message, containerId, duration = 5000) => {
    const container = document.getElementById(containerId);
    const errorDiv = document.createElement('div');
    errorDiv.className = 'error-message';
    errorDiv.innerHTML = `
        <div class="error-content">
            <i class="fas fa-exclamation-circle"></i>
            <span>${message}</span>
            <button class="close-error"><i class="fas fa-times"></i></button>
        </div>
    `;

    container.appendChild(errorDiv);

    // Add click handler to close button
    errorDiv.querySelector('.close-error').addEventListener('click', () => {
        errorDiv.remove();
    });

    // Auto remove after duration
    if (duration) {
        setTimeout(() => {
            if (errorDiv.parentNode) {
                errorDiv.remove();
            }
        }, duration);
    }
};

// Form Validation
const validateForm = (formElement, rules) => {
    const errors = {};
    const formData = new FormData(formElement);

    for (const [field, rule] of Object.entries(rules)) {
        const value = formData.get(field);
        const fieldElement = formElement.querySelector(`[name="${field}"]`);
        const errorElement = document.createElement('div');
        errorElement.className = 'field-error';

        // Remove existing error messages
        const existingError = fieldElement.parentNode.querySelector('.field-error');
        if (existingError) {
            existingError.remove();
        }

        // Validate required fields
        if (rule.required && !value) {
            errors[field] = 'This field is required';
        }

        // Validate email format
        if (rule.email && value && !value.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) {
            errors[field] = 'Please enter a valid email address';
        }

        // Validate minimum length
        if (rule.minLength && value.length < rule.minLength) {
            errors[field] = `Must be at least ${rule.minLength} characters`;
        }

        // Validate maximum length
        if (rule.maxLength && value.length > rule.maxLength) {
            errors[field] = `Must be less than ${rule.maxLength} characters`;
        }

        // Display field errors
        if (errors[field]) {
            errorElement.textContent = errors[field];
            fieldElement.parentNode.appendChild(errorElement);
            fieldElement.classList.add('error');
        } else {
            fieldElement.classList.remove('error');
        }
    }

    return {
        isValid: Object.keys(errors).length === 0,
        errors
    };
};

// Search Component
const initializeSearch = (containerId, searchCallback) => {
    const container = document.getElementById(containerId);
    const searchComponent = document.createElement('div');
    searchComponent.className = 'search-component';
    searchComponent.innerHTML = `
        <div class="search-container">
            <input type="text" class="search-input" placeholder="Search...">
            <button class="search-button">
                <i class="fas fa-search"></i>
            </button>
        </div>
        <div class="search-results"></div>
    `;

    container.appendChild(searchComponent);

    const searchInput = searchComponent.querySelector('.search-input');
    const searchResults = searchComponent.querySelector('.search-results');
    let debounceTimer;

    searchInput.addEventListener('input', (e) => {
        clearTimeout(debounceTimer);
        debounceTimer = setTimeout(() => {
            const query = e.target.value;
            if (query.length >= 2) {
                const spinner = createLoadingSpinner();
                searchResults.innerHTML = '';
                searchResults.appendChild(spinner);
                
                searchCallback(query)
                    .then(results => {
                        searchResults.innerHTML = '';
                        if (results.length === 0) {
                            searchResults.innerHTML = '<div class="no-results">No results found</div>';
                            return;
                        }
                        displaySearchResults(results, searchResults);
                    })
                    .catch(error => {
                        showError('Search failed. Please try again.', containerId);
                    });
            } else {
                searchResults.innerHTML = '';
            }
        }, 300);
    });
};

// Payment Form Component
const initializePaymentForm = (containerId, onSubmit) => {
    const container = document.getElementById(containerId);
    const paymentForm = document.createElement('div');
    paymentForm.className = 'payment-form';
    paymentForm.innerHTML = `
        <form id="payment-form">
            <div class="form-group">
                <label for="card-holder">Card Holder Name</label>
                <input type="text" id="card-holder" name="cardHolder" required>
            </div>
            <div class="form-group">
                <label for="card-number">Card Number</label>
                <input type="text" id="card-number" name="cardNumber" required pattern="[0-9]{16}">
            </div>
            <div class="form-row">
                <div class="form-group">
                    <label for="expiry">Expiry Date</label>
                    <input type="text" id="expiry" name="expiry" placeholder="MM/YY" required pattern="[0-9]{2}/[0-9]{2}">
                </div>
                <div class="form-group">
                    <label for="cvv">CVV</label>
                    <input type="text" id="cvv" name="cvv" required pattern="[0-9]{3,4}">
                </div>
            </div>
            <button type="submit" class="payment-submit">Pay Now</button>
        </form>
    `;

    container.appendChild(paymentForm);

    // Add form validation
    const form = paymentForm.querySelector('#payment-form');
    form.addEventListener('submit', (e) => {
        e.preventDefault();
        const validationRules = {
            cardHolder: { required: true },
            cardNumber: { required: true, pattern: /^[0-9]{16}$/ },
            expiry: { required: true, pattern: /^(0[1-9]|1[0-2])\/([0-9]{2})$/ },
            cvv: { required: true, pattern: /^[0-9]{3,4}$/ }
        };

        const { isValid, errors } = validateForm(form, validationRules);
        if (isValid) {
            onSubmit(new FormData(form));
        }
    });
};

// Export all components
export {
    createLoadingSpinner,
    showError,
    validateForm,
    initializeSearch,
    initializePaymentForm
}; 