class UserManagement {
  constructor() {
    this.users = [];
    this.loading = true;
    this.error = null;
    this.currentPage = 1;
    this.totalPages = 1;
    this.searchQuery = '';
  }

  async init() {
    await this.fetchUsers();
    this.setupEventListeners();
  }

  async fetchUsers() {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/admin/users?page=${this.currentPage}&search=${this.searchQuery}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (!response.ok) throw new Error('Failed to fetch users');
      
      const data = await response.json();
      this.users = data.users;
      this.totalPages = data.totalPages;
      this.loading = false;
      this.render();
    } catch (error) {
      this.error = error.message;
      this.loading = false;
      this.render();
    }
  }

  async deleteUser(userId) {
    if (!confirm('Are you sure you want to delete this user?')) return;

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/admin/users/${userId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) throw new Error('Failed to delete user');
      
      await this.fetchUsers();
    } catch (error) {
      this.error = error.message;
      this.render();
    }
  }

  async updateUserRole(userId, newRole) {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/admin/users/${userId}/role`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ role: newRole })
      });

      if (!response.ok) throw new Error('Failed to update user role');
      
      await this.fetchUsers();
    } catch (error) {
      this.error = error.message;
      this.render();
    }
  }

  setupEventListeners() {
    const searchInput = document.getElementById('user-search');
    if (searchInput) {
      searchInput.addEventListener('input', (e) => {
        this.searchQuery = e.target.value;
        this.currentPage = 1;
        this.fetchUsers();
      });
    }

    document.addEventListener('click', (e) => {
      if (e.target.matches('.delete-user')) {
        const userId = e.target.dataset.userId;
        this.deleteUser(userId);
      }
    });

    document.addEventListener('change', (e) => {
      if (e.target.matches('.role-select')) {
        const userId = e.target.dataset.userId;
        const newRole = e.target.value;
        this.updateUserRole(userId, newRole);
      }
    });
  }

  render() {
    const container = document.getElementById('user-management');
    if (!container) return;

    if (this.loading) {
      container.innerHTML = '<div class="p-4">Loading users...</div>';
      return;
    }

    if (this.error) {
      container.innerHTML = `
        <div class="p-4 bg-red-100 text-red-700 rounded">
          Error: ${this.error}
        </div>
      `;
      return;
    }
    
    container.innerHTML = `
      <div class="p-4">
        <h2 class="text-2xl font-bold mb-4">User Management</h2>
        
        <div class="mb-4">
          <input type="text" 
                 id="user-search" 
                 placeholder="Search users..." 
                 class="w-full p-2 border rounded"
                 value="${this.searchQuery}">
        </div>

        <div class="bg-white rounded-lg shadow overflow-hidden">
          <table class="min-w-full divide-y divide-gray-200">
            <thead class="bg-gray-50">
              <tr>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Role</th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody class="bg-white divide-y divide-gray-200">
              ${this.users.map(user => `
                <tr>
                  <td class="px-6 py-4 whitespace-nowrap">
                    <div class="text-sm font-medium text-gray-900">${user.name}</div>
                  </td>
                  <td class="px-6 py-4 whitespace-nowrap">
                    <div class="text-sm text-gray-500">${user.email}</div>
                  </td>
                  <td class="px-6 py-4 whitespace-nowrap">
                    <select class="role-select text-sm border rounded p-1" data-user-id="${user._id}">
                      <option value="user" ${user.role === 'user' ? 'selected' : ''}>User</option>
                      <option value="admin" ${user.role === 'admin' ? 'selected' : ''}>Admin</option>
                    </select>
                  </td>
                  <td class="px-6 py-4 whitespace-nowrap text-sm">
                    <button class="delete-user text-red-600 hover:text-red-900" data-user-id="${user._id}">
                      Delete
                    </button>
                  </td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>

        ${this.totalPages > 1 ? `
          <div class="mt-4 flex justify-center">
            <div class="flex space-x-2">
              ${Array.from({ length: this.totalPages }, (_, i) => i + 1).map(page => `
                <button class="px-3 py-1 border rounded ${page === this.currentPage ? 'bg-blue-500 text-white' : 'hover:bg-gray-100'}"
                        onclick="userManagement.currentPage = ${page}; userManagement.fetchUsers();">
                  ${page}
                </button>
              `).join('')}
            </div>
          </div>
        ` : ''}
      </div>
    `;
  }
}

const userManagement = new UserManagement();
userManagement.init(); 