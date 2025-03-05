document.addEventListener('DOMContentLoaded', function() {
    // DOM Elements
    const newsletterForm = document.getElementById('newsletterForm');
    const tableOfContents = document.querySelectorAll('.nav-link[href^="#"]');

    // Initialize smooth scrolling for table of contents
    tableOfContents.forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            const targetId = this.getAttribute('href');
            const targetSection = document.querySelector(targetId);
            
            if (targetSection) {
                const offsetTop = targetSection.offsetTop - 80; // Adjust for fixed header
                window.scrollTo({
                    top: offsetTop,
                    behavior: 'smooth'
                });
            }
        });
    });

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

    // Track scroll position for table of contents highlighting
    window.addEventListener('scroll', function() {
        const sections = document.querySelectorAll('section[id]');
        let currentSection = '';

        sections.forEach(section => {
            const sectionTop = section.offsetTop - 100;
            const sectionHeight = section.clientHeight;
            if (pageYOffset >= sectionTop && pageYOffset < sectionTop + sectionHeight) {
                currentSection = section.getAttribute('id');
            }
        });

        // Update active state in table of contents
        tableOfContents.forEach(link => {
            link.classList.remove('active');
            if (link.getAttribute('href') === `#${currentSection}`) {
                link.classList.add('active');
            }
        });
    });
}); 