class UserReviews {
  constructor() {
    this.reviews = [];
    this.loading = true;
    this.error = '';
    this.init();
  }

  async init() {
    await this.fetchReviews();
    this.setupEventListeners();
  }

  async fetchReviews() {
    try {
      const response = await fetch('/api/users/reviews', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      if (!response.ok) throw new Error('Failed to fetch reviews');
      
      this.reviews = await response.json();
      this.loading = false;
      this.render();
    } catch (err) {
      this.error = 'Failed to fetch reviews. Please try again later.';
      this.loading = false;
      this.render();
    }
  }

  async handleDeleteReview(reviewId) {
    try {
      const response = await fetch(`/api/reviews/${reviewId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (!response.ok) throw new Error('Failed to delete review');
      
      await this.fetchReviews();
    } catch (err) {
      this.error = 'Failed to delete review. Please try again.';
      this.render();
    }
  }

  setupEventListeners() {
    document.addEventListener('click', (e) => {
      if (e.target.matches('.delete-review-btn') || e.target.closest('.delete-review-btn')) {
        const reviewId = e.target.closest('.delete-review-btn').dataset.id;
        this.handleDeleteReview(reviewId);
      }

      if (e.target.matches('.edit-review-btn') || e.target.closest('.edit-review-btn')) {
        const reviewId = e.target.closest('.edit-review-btn').dataset.id;
        window.location.href = `/edit-review.html?id=${reviewId}`;
      }
    });
  }

  formatDate(dateString) {
    const options = { year: 'numeric', month: 'long', day: 'numeric' };
    return new Date(dateString).toLocaleDateString(undefined, options);
  }

  generateStars(rating) {
    let stars = '';
    for (let i = 1; i <= 5; i++) {
      stars += `<i class="fas fa-star ${i <= rating ? 'text-yellow-400' : 'text-gray-300'}"></i>`;
    }
    return stars;
  }

  render() {
    const container = document.getElementById('reviews-container');
    if (!container) return;

    if (this.loading) {
      container.innerHTML = '<div class="text-center py-8">Loading...</div>';
      return;
    }

    if (this.error) {
      container.innerHTML = `<div class="text-red-600 text-center py-8">${this.error}</div>`;
      return;
    }

    container.innerHTML = `
      <div class="container mx-auto px-4 py-8">
        <div class="max-w-4xl mx-auto">
          <div class="flex justify-between items-center mb-6">
            <h1 class="text-2xl font-bold">My Reviews</h1>
            <a href="/write-review.html" class="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700">
              Write a Review
            </a>
          </div>

          ${this.reviews.length === 0 
            ? '<div class="text-center py-8 text-gray-500">You have not written any reviews yet.</div>'
            : this.reviews.map(review => `
              <div class="bg-white rounded-lg shadow-lg p-6 mb-4">
                <div class="flex justify-between items-start">
                  <div>
                    <div class="flex items-center mb-2">
                      ${this.generateStars(review.rating)}
                      <span class="ml-2 text-gray-600">${review.rating}/5</span>
                    </div>
                    <h2 class="text-xl font-semibold mb-2">
                      ${review.itemType === 'hotel' ? review.hotelId?.name : 
                        review.itemType === 'tour' ? review.tourId?.name : 
                        review.itemType === 'restaurant' ? review.restaurantId?.name : 'Unknown'}
                    </h2>
                    <p class="text-gray-800 mb-3">${review.review}</p>
                    ${review.photos && review.photos.length > 0 ? `
                      <div class="flex space-x-2 mb-3">
                        ${review.photos.map(photo => `
                          <img src="${photo}" alt="Review photo" class="w-20 h-20 object-cover rounded">
                        `).join('')}
                      </div>
                    ` : ''}
                    <p class="text-sm text-gray-500">
                      ${this.formatDate(review.createdAt)}
                    </p>
                  </div>
                  <div class="flex space-x-2">
                    <button data-id="${review._id}" class="edit-review-btn text-indigo-600 hover:text-indigo-800">
                      <i class="fas fa-edit"></i> Edit
                    </button>
                    <button data-id="${review._id}" class="delete-review-btn text-red-600 hover:text-red-800">
                      <i class="fas fa-trash"></i> Delete
                    </button>
                  </div>
                </div>
              </div>
            `).join('')}
        </div>
      </div>
    `;
  }
}

// Initialize the component
const userReviews = new UserReviews(); 