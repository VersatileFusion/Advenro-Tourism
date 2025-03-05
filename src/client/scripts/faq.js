document.addEventListener('DOMContentLoaded', function() {
    // DOM Elements
    const newsletterForm = document.getElementById('newsletterForm');
    const faqTabs = document.getElementById('faq-tabs');
    const searchInput = document.getElementById('faqSearch');

    // Handle newsletter subscription
    newsletterForm.addEventListener('submit', async function(e) {
        e.preventDefault();
        
        const emailInput = this.querySelector('input[type="email"]');
        const submitButton = this.querySelector('button[type="submit"]');
        
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
    });

    // Helper function to show alerts
    function showAlert(message, type) {
        // Remove any existing alerts
        const existingAlert = document.querySelector('.alert');
        if (existingAlert) {
            existingAlert.remove();
        }

        // Create new alert
        const alert = document.createElement('div');
        alert.className = `alert alert-${type} alert-dismissible fade show`;
        alert.role = 'alert';
        alert.innerHTML = `
            ${message}
            <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
        `;

        // Insert alert before the newsletter form
        newsletterForm.parentNode.insertBefore(alert, newsletterForm);

        // Auto-dismiss after 5 seconds
        setTimeout(() => {
            const bsAlert = new bootstrap.Alert(alert);
            bsAlert.close();
        }, 5000);
    }

    // Track active tab in URL hash
    function updateUrlHash(hash) {
        if (history.pushState) {
            history.pushState(null, null, hash);
        } else {
            location.hash = hash;
        }
    }

    // Handle tab changes
    faqTabs.addEventListener('shown.bs.tab', function(e) {
        const targetId = e.target.getAttribute('href');
        updateUrlHash(targetId);
    });

    // Load tab from URL hash on page load
    if (location.hash) {
        const tab = faqTabs.querySelector(`a[href="${location.hash}"]`);
        if (tab) {
            const bsTab = new bootstrap.Tab(tab);
            bsTab.show();
        }
    }

    // Handle accordion state persistence
    const accordions = document.querySelectorAll('.accordion');
    accordions.forEach(accordion => {
        const accordionId = accordion.id;
        const storageKey = `faq_${accordionId}_open`;
        
        // Restore accordion state
        const openItems = JSON.parse(localStorage.getItem(storageKey) || '[]');
        openItems.forEach(itemId => {
            const item = document.getElementById(itemId);
            if (item) {
                item.classList.add('show');
                const button = item.previousElementSibling.querySelector('button');
                if (button) {
                    button.classList.remove('collapsed');
                }
            }
        });

        // Save accordion state on change
        accordion.addEventListener('shown.bs.collapse', function(e) {
            const currentOpen = JSON.parse(localStorage.getItem(storageKey) || '[]');
            if (!currentOpen.includes(e.target.id)) {
                currentOpen.push(e.target.id);
                localStorage.setItem(storageKey, JSON.stringify(currentOpen));
            }
        });

        accordion.addEventListener('hidden.bs.collapse', function(e) {
            const currentOpen = JSON.parse(localStorage.getItem(storageKey) || '[]');
            const index = currentOpen.indexOf(e.target.id);
            if (index > -1) {
                currentOpen.splice(index, 1);
                localStorage.setItem(storageKey, JSON.stringify(currentOpen));
            }
        });
    });

    // Handle smooth scrolling for anchor links
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function(e) {
            const targetId = this.getAttribute('href');
            if (targetId === '#') return;

            const targetElement = document.querySelector(targetId);
            if (targetElement) {
                e.preventDefault();
                targetElement.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
            }
        });
    });

    // Add copy functionality for support contact information
    document.querySelectorAll('.copy-contact').forEach(button => {
        button.addEventListener('click', function() {
            const textToCopy = this.getAttribute('data-copy');
            navigator.clipboard.writeText(textToCopy).then(() => {
                const originalText = this.innerHTML;
                this.innerHTML = 'Copied!';
                setTimeout(() => {
                    this.innerHTML = originalText;
                }, 2000);
            });
        });
    });
}); 