document.addEventListener('DOMContentLoaded', () => {
    // Elements
    const reviewsList = document.querySelector('.reviews-list');
    const reviewForm = document.getElementById('review-form');
    const reviewFormContainer = document.querySelector('.review-form-container');
    const ratingInput = document.getElementById('rating');
    const ratingStars = document.querySelectorAll('.rating-input i');
    const photoUpload = document.getElementById('review-photos');
    const photoPreview = document.querySelector('.photo-preview');
    const sortSelect = document.getElementById('sort-reviews');
    const filterSelect = document.getElementById('filter-reviews');
    const prevPageBtn = document.querySelector('.prev-page');
    const nextPageBtn = document.querySelector('.next-page');
    const pageInfo = document.querySelector('.page-info');

    // State
    let currentPage = 1;
    let totalPages = 1;
    let reviews = [];
    let selectedPhotos = [];

    // Initialize
    loadReviews();
    setupEventListeners();

    // Event Listeners
    function setupEventListeners() {
        // Rating stars
        ratingStars.forEach(star => {
            star.addEventListener('mouseover', () => {
                const rating = parseInt(star.dataset.rating);
                updateRatingStars(rating);
            });

            star.addEventListener('click', () => {
                const rating = parseInt(star.dataset.rating);
                ratingInput.value = rating;
                updateRatingStars(rating);
            });
        });

        // Photo upload
        photoUpload.addEventListener('change', handlePhotoUpload);

        // Form submission
        reviewForm.addEventListener('submit', handleReviewSubmit);

        // Sort and filter
        sortSelect.addEventListener('change', () => {
            currentPage = 1;
            loadReviews();
        });

        filterSelect.addEventListener('change', () => {
            currentPage = 1;
            loadReviews();
        });

        // Pagination
        prevPageBtn.addEventListener('click', () => {
            if (currentPage > 1) {
                currentPage--;
                loadReviews();
            }
        });

        nextPageBtn.addEventListener('click', () => {
            if (currentPage < totalPages) {
                currentPage++;
                loadReviews();
            }
        });
    }

    // API Calls
    async function loadReviews() {
        try {
            const sort = sortSelect.value;
            const filter = filterSelect.value;
            const response = await fetch(`/api/reviews?page=${currentPage}&sort=${sort}&filter=${filter}`);
            const data = await response.json();

            if (data.status === 'success') {
                reviews = data.data.reviews;
                totalPages = Math.ceil(data.data.total / 10); // Assuming 10 reviews per page
                updateReviewsList();
                updatePagination();
                updateRatingStats(data.data.stats);
            }
        } catch (error) {
            console.error('Error loading reviews:', error);
            showError('Failed to load reviews. Please try again later.');
        }
    }

    async function submitReview(formData) {
        try {
            const response = await fetch('/api/reviews', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                },
                body: formData
            });

            const data = await response.json();

            if (data.status === 'success') {
                showSuccess('Review submitted successfully!');
                reviewForm.reset();
                selectedPhotos = [];
                updatePhotoPreview();
                reviewFormContainer.style.display = 'none';
                loadReviews();
            } else {
                showError(data.message || 'Failed to submit review. Please try again.');
            }
        } catch (error) {
            console.error('Error submitting review:', error);
            showError('Failed to submit review. Please try again later.');
        }
    }

    async function likeReview(reviewId) {
        try {
            const response = await fetch(`/api/reviews/${reviewId}/like`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                }
            });

            const data = await response.json();

            if (data.status === 'success') {
                loadReviews();
            }
        } catch (error) {
            console.error('Error liking review:', error);
            showError('Failed to like review. Please try again later.');
        }
    }

    async function markHelpful(reviewId) {
        try {
            const response = await fetch(`/api/reviews/${reviewId}/helpful`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                }
            });

            const data = await response.json();

            if (data.status === 'success') {
                loadReviews();
            }
        } catch (error) {
            console.error('Error marking review as helpful:', error);
            showError('Failed to mark review as helpful. Please try again later.');
        }
    }

    // UI Updates
    function updateReviewsList() {
        reviewsList.innerHTML = reviews.map(review => `
            <div class="review-item">
                <div class="review-header">
                    <div class="reviewer-info">
                        <img src="${review.user.avatar || '/images/default-avatar.png'}" alt="${review.user.name}" class="reviewer-avatar">
                        <div>
                            <div class="reviewer-name">${review.user.name}</div>
                            <div class="review-date">${formatDate(review.createdAt)}</div>
                        </div>
                    </div>
                    <div class="review-rating">
                        ${generateStars(review.rating)}
                    </div>
                </div>
                <div class="review-content">${review.review}</div>
                ${review.photos.length > 0 ? `
                    <div class="review-photos">
                        ${review.photos.map(photo => `
                            <img src="${photo}" alt="Review photo" class="review-photo" onclick="openPhotoModal('${photo}')">
                        `).join('')}
                    </div>
                ` : ''}
                <div class="review-actions">
                    <div class="review-action" onclick="likeReview('${review._id}')">
                        <i class="fas fa-heart ${review.likes.includes(getCurrentUserId()) ? 'active' : ''}"></i>
                        <span>${review.likes.length}</span>
                    </div>
                    <div class="review-action" onclick="markHelpful('${review._id}')">
                        <i class="fas fa-thumbs-up"></i>
                        <span>${review.helpful}</span>
                    </div>
                </div>
            </div>
        `).join('');
    }

    function updateRatingStats(stats) {
        document.querySelector('.average-rating').textContent = stats.average.toFixed(1);
        document.querySelector('.total-reviews').textContent = `${stats.total} reviews`;

        // Update rating bars
        stats.ratings.forEach((count, index) => {
            const percentage = stats.total > 0 ? (count / stats.total) * 100 : 0;
            const bar = document.querySelector(`.rating-bar:nth-child(${5 - index}) .fill`);
            const countElement = document.querySelector(`.rating-bar:nth-child(${5 - index}) .count`);
            bar.style.width = `${percentage}%`;
            countElement.textContent = count;
        });
    }

    function updatePagination() {
        prevPageBtn.disabled = currentPage === 1;
        nextPageBtn.disabled = currentPage === totalPages;
        pageInfo.textContent = `Page ${currentPage} of ${totalPages}`;
    }

    function updateRatingStars(rating) {
        ratingStars.forEach(star => {
            const starRating = parseInt(star.dataset.rating);
            star.classList.toggle('active', starRating <= rating);
        });
    }

    function handlePhotoUpload(event) {
        const files = event.target.files;
        selectedPhotos = Array.from(files);
        updatePhotoPreview();
    }

    function updatePhotoPreview() {
        photoPreview.innerHTML = selectedPhotos.map((file, index) => `
            <div class="photo-preview-item">
                <img src="${URL.createObjectURL(file)}" alt="Preview ${index + 1}">
                <div class="remove-photo" onclick="removePhoto(${index})">
                    <i class="fas fa-times"></i>
                </div>
            </div>
        `).join('');
    }

    function removePhoto(index) {
        selectedPhotos.splice(index, 1);
        updatePhotoPreview();
    }

    async function handleReviewSubmit(event) {
        event.preventDefault();

        if (!ratingInput.value) {
            showError('Please select a rating');
            return;
        }

        const formData = new FormData();
        formData.append('rating', ratingInput.value);
        formData.append('review', document.getElementById('review-text').value);
        selectedPhotos.forEach(photo => {
            formData.append('photos', photo);
        });

        await submitReview(formData);
    }

    // Utility Functions
    function formatDate(dateString) {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    }

    function generateStars(rating) {
        return Array(5).fill('').map((_, index) => `
            <i class="fas fa-star ${index < rating ? 'active' : ''}"></i>
        `).join('');
    }

    function getCurrentUserId() {
        // Implement based on your authentication system
        return localStorage.getItem('userId');
    }

    function showError(message) {
        // Implement your error notification system
        alert(message);
    }

    function showSuccess(message) {
        // Implement your success notification system
        alert(message);
    }

    // Photo Modal
    window.openPhotoModal = function(photoUrl) {
        const modal = document.createElement('div');
        modal.className = 'photo-modal';
        modal.innerHTML = `
            <div class="modal-content">
                <img src="${photoUrl}" alt="Review photo">
                <button class="close-modal">&times;</button>
            </div>
        `;

        document.body.appendChild(modal);

        modal.querySelector('.close-modal').addEventListener('click', () => {
            modal.remove();
        });

        modal.addEventListener('click', (event) => {
            if (event.target === modal) {
                modal.remove();
            }
        });
    };
}); 