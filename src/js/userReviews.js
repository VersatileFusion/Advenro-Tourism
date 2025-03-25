class UserReviews {
  constructor() {
    this.reviews = [];
    this.loading = true;
    this.error = '';
    this.filter = 'all';
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
    const filterButtons = document.querySelectorAll('.filter-button');
    filterButtons.forEach(button => {
      button.addEventListener('click', () => {
        this.filter = button.dataset.filter;
        this.render();
      });
    });
  }

  getFilteredReviews() {
    if (this.filter === 'all') return this.reviews;
    return this.reviews.filter(review => review.serviceType === this.filter);
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

    const filteredReviews = this.getFilteredReviews();
    
    container.innerHTML = `
      <div class="container mx-auto px-4 py-8">
        <div class="max-w-4xl mx-auto">
          <h1 class="text-2xl font-bold mb-6">My Reviews</h1>

          <div class="mb-6">
            <div class="flex space-x-4">
              <button class="filter-button px-4 py-2 rounded-md ${this.filter === 'all' ? 'bg-indigo-600 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}" data-filter="all">
                All Reviews
              </button>
              <button class="filter-button px-4 py-2 rounded-md ${this.filter === 'hotels' ? 'bg-indigo-600 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}" data-filter="hotels">
                Hotels
              </button>
              <button class="filter-button px-4 py-2 rounded-md ${this.filter === 'restaurants' ? 'bg-indigo-600 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}" data-filter="restaurants">
                Restaurants
              </button>
              <button class="filter-button px-4 py-2 rounded-md ${this.filter === 'localServices' ? 'bg-indigo-600 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}" data-filter="localServices">
                Local Services
              </button>
            </div>
          </div>

          ${filteredReviews.length === 0 
            ? '<div class="text-center py-8 text-gray-500">No reviews found for this filter.</div>'
            : filteredReviews.map(review => `
              <div class="bg-white rounded-lg shadow-lg p-6 mb-4">
                <div class="flex justify-between items-start">
                  <div>
                    <h2 class="text-xl font-semibold mb-2">${review.serviceName}</h2>
                    <div class="flex items-center mb-2">
                      ${[...Array(5)].map((_, index) => `
                        <svg class="w-5 h-5 ${index < review.rating ? 'text-yellow-400' : 'text-gray-300'}" fill="currentColor" viewBox="0 0 20 20">
                          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.363 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.363-1.118l-2.8-2.034c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                        </svg>
                      `).join('')}
                    </div>
                    <p class="text-gray-600 mb-2">${review.comment}</p>
                    <p class="text-sm text-gray-500">
                      Posted on ${new Date(review.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                  <button onclick="userReviews.handleDeleteReview('${review._id}')" class="text-red-600 hover:text-red-800">
                    <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
              </div>
            `).join('')}
        </div>
      </div>
    `;

    this.setupEventListeners();
  }
}

// Initialize the component
const userReviews = new UserReviews(); 