class AdminDashboard {
  constructor() {
    this.stats = {
      totalUsers: 0,
      totalBookings: 0,
      totalRevenue: 0,
      recentBookings: [],
      recentUsers: []
    };
    this.loading = true;
    this.error = '';
    this.init();
  }

  async init() {
    await this.fetchDashboardData();
    this.setupEventListeners();
  }

  async fetchDashboardData() {
    try {
      const response = await fetch('/api/admin/dashboard', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      if (!response.ok) throw new Error('Failed to fetch dashboard data');
      
      this.stats = await response.json();
      this.loading = false;
      this.render();
    } catch (err) {
      this.error = 'Failed to fetch dashboard data. Please try again later.';
      this.loading = false;
      this.render();
    }
  }

  setupEventListeners() {
    // Add any event listeners for dashboard interactions
  }

  formatCurrency(amount) {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  }

  formatDate(date) {
    return new Date(date).toLocaleDateString();
  }

  render() {
    const container = document.getElementById('admin-dashboard');
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
        <h1 class="text-2xl font-bold mb-6">Admin Dashboard</h1>

        <div class="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div class="bg-white rounded-lg shadow-lg p-6">
            <h2 class="text-lg font-semibold text-gray-600 mb-2">Total Users</h2>
            <p class="text-3xl font-bold text-indigo-600">${this.stats.totalUsers}</p>
          </div>
          <div class="bg-white rounded-lg shadow-lg p-6">
            <h2 class="text-lg font-semibold text-gray-600 mb-2">Total Bookings</h2>
            <p class="text-3xl font-bold text-indigo-600">${this.stats.totalBookings}</p>
          </div>
          <div class="bg-white rounded-lg shadow-lg p-6">
            <h2 class="text-lg font-semibold text-gray-600 mb-2">Total Revenue</h2>
            <p class="text-3xl font-bold text-indigo-600">${this.formatCurrency(this.stats.totalRevenue)}</p>
          </div>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div class="bg-white rounded-lg shadow-lg p-6">
            <h2 class="text-xl font-semibold mb-4">Recent Bookings</h2>
            <div class="space-y-4">
              ${this.stats.recentBookings.map(booking => `
                <div class="border-b pb-4">
                  <div class="flex justify-between items-start">
                    <div>
                      <p class="font-semibold">${booking.serviceName}</p>
                      <p class="text-sm text-gray-600">${booking.userName}</p>
                      <p class="text-sm text-gray-500">${this.formatDate(booking.date)}</p>
                    </div>
                    <span class="px-3 py-1 rounded-full text-sm ${
                      booking.status === 'confirmed'
                        ? 'bg-green-100 text-green-800'
                        : booking.status === 'cancelled'
                        ? 'bg-red-100 text-red-800'
                        : 'bg-yellow-100 text-yellow-800'
                    }">
                      ${booking.status.charAt(0).toUpperCase() + booking.status.slice(1)}
                    </span>
                  </div>
                  <p class="text-sm text-gray-600 mt-2">${this.formatCurrency(booking.amount)}</p>
                </div>
              `).join('')}
            </div>
          </div>

          <div class="bg-white rounded-lg shadow-lg p-6">
            <h2 class="text-xl font-semibold mb-4">Recent Users</h2>
            <div class="space-y-4">
              ${this.stats.recentUsers.map(user => `
                <div class="border-b pb-4">
                  <div class="flex justify-between items-start">
                    <div>
                      <p class="font-semibold">${user.name}</p>
                      <p class="text-sm text-gray-600">${user.email}</p>
                      <p class="text-sm text-gray-500">Joined ${this.formatDate(user.createdAt)}</p>
                    </div>
                    <span class="px-3 py-1 rounded-full text-sm ${
                      user.role === 'admin'
                        ? 'bg-purple-100 text-purple-800'
                        : 'bg-blue-100 text-blue-800'
                    }">
                      ${user.role.charAt(0).toUpperCase() + user.role.slice(1)}
                    </span>
                  </div>
                </div>
              `).join('')}
            </div>
          </div>
        </div>
      </div>
    `;
  }
}

// Initialize the component
const adminDashboard = new AdminDashboard(); 