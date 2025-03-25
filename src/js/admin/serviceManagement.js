class ServiceManagement {
  constructor(serviceType) {
    this.serviceType = serviceType;
    this.services = [];
    this.loading = true;
    this.error = '';
    this.currentPage = 1;
    this.totalPages = 1;
    this.searchQuery = '';
    this.init();
  }

  async init() {
    await this.fetchServices();
    this.setupEventListeners();
  }

  async fetchServices() {
    try {
      const response = await fetch(`/api/admin/${this.serviceType}?page=${this.currentPage}&search=${this.searchQuery}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      if (!response.ok) throw new Error(`Failed to fetch ${this.serviceType}`);
      
      const data = await response.json();
      this.services = data.services;
      this.totalPages = data.totalPages;
      this.loading = false;
      this.render();
    } catch (err) {
      this.error = `Failed to fetch ${this.serviceType}. Please try again later.`;
      this.loading = false;
      this.render();
    }
  }

  async handleDeleteService(serviceId) {
    if (!confirm('Are you sure you want to delete this service?')) return;

    try {
      const response = await fetch(`/api/admin/${this.serviceType}/${serviceId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (!response.ok) throw new Error(`Failed to delete ${this.serviceType}`);
      
      await this.fetchServices();
    } catch (err) {
      this.error = `Failed to delete ${this.serviceType}. Please try again.`;
      this.render();
    }
  }

  setupEventListeners() {
    const searchInput = document.getElementById('service-search');
    if (searchInput) {
      searchInput.addEventListener('input', (e) => {
        this.searchQuery = e.target.value;
        this.currentPage = 1;
        this.fetchServices();
      });
    }

    const addButton = document.getElementById('add-service');
    if (addButton) {
      addButton.addEventListener('click', () => {
        window.location.href = `/admin/${this.serviceType}/add`;
      });
    }
  }

  render() {
    const container = document.getElementById('service-management');
    if (!container) return;

    if (this.loading) {
      container.innerHTML = '<div class="text-center py-8">Loading...</div>';
      return;
    }

    if (this.error) {
      container.innerHTML = `<div class="text-red-600 text-center py-8">${this.error}</div>`;
      return;
    }

    const serviceTitle = this.serviceType.charAt(0).toUpperCase() + this.serviceType.slice(1);
    
    container.innerHTML = `
      <div class="container mx-auto px-4 py-8">
        <div class="flex justify-between items-center mb-6">
          <h1 class="text-2xl font-bold">${serviceTitle} Management</h1>
          <button id="add-service" class="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700">
            Add New ${serviceTitle}
          </button>
        </div>

        <div class="mb-6">
          <input
            type="text"
            id="service-search"
            placeholder="Search ${this.serviceType}..."
            class="w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
            value="${this.searchQuery}"
          >
        </div>

        <div class="bg-white rounded-lg shadow-lg overflow-hidden">
          <table class="min-w-full divide-y divide-gray-200">
            <thead class="bg-gray-50">
              <tr>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Location</th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Rating</th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody class="bg-white divide-y divide-gray-200">
              ${this.services.map(service => `
                <tr>
                  <td class="px-6 py-4 whitespace-nowrap">
                    <div class="flex items-center">
                      <div class="h-10 w-10 flex-shrink-0">
                        <img class="h-10 w-10 rounded-full" src="${service.image}" alt="${service.name}">
                      </div>
                      <div class="ml-4">
                        <div class="text-sm font-medium text-gray-900">${service.name}</div>
                        <div class="text-sm text-gray-500">${service.description}</div>
                      </div>
                    </div>
                  </td>
                  <td class="px-6 py-4 whitespace-nowrap">
                    <div class="text-sm text-gray-900">${service.location}</div>
                  </td>
                  <td class="px-6 py-4 whitespace-nowrap">
                    <div class="flex items-center">
                      ${[...Array(5)].map((_, index) => `
                        <svg class="w-5 h-5 ${index < service.rating ? 'text-yellow-400' : 'text-gray-300'}" fill="currentColor" viewBox="0 0 20 20">
                          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.363 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.363-1.118l-2.8-2.034c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                        </svg>
                      `).join('')}
                    </div>
                  </td>
                  <td class="px-6 py-4 whitespace-nowrap">
                    <span class="px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                      service.status === 'active'
                        ? 'bg-green-100 text-green-800'
                        : 'bg-red-100 text-red-800'
                    }">
                      ${service.status.charAt(0).toUpperCase() + service.status.slice(1)}
                    </span>
                  </td>
                  <td class="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <a href="/admin/${this.serviceType}/${service._id}/edit" class="text-indigo-600 hover:text-indigo-900 mr-4">Edit</a>
                    <button onclick="serviceManagement.handleDeleteService('${service._id}')" class="text-red-600 hover:text-red-900">Delete</button>
                  </td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>

        ${this.totalPages > 1 ? `
          <div class="mt-6 flex justify-center">
            <nav class="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
              ${[...Array(this.totalPages)].map((_, index) => `
                <button
                  onclick="serviceManagement.currentPage = ${index + 1}; serviceManagement.fetchServices();"
                  class="relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                    this.currentPage === index + 1
                      ? 'z-10 bg-indigo-50 border-indigo-500 text-indigo-600'
                      : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
                  }"
                >
                  ${index + 1}
                </button>
              `).join('')}
            </nav>
          </div>
        ` : ''}
      </div>
    `;

    this.setupEventListeners();
  }
}

// Initialize the component based on the current page
const serviceType = window.location.pathname.split('/')[2]; // Get service type from URL
const serviceManagement = new ServiceManagement(serviceType); 