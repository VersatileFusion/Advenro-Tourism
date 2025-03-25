class UserNotifications {
  constructor() {
    this.notifications = [];
    this.loading = true;
    this.error = '';
    this.unreadCount = 0;
    this.init();
  }

  async init() {
    await this.fetchNotifications();
    this.setupEventListeners();
    this.updateUnreadCount();
  }

  async fetchNotifications() {
    try {
      const response = await fetch('/api/users/notifications', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      if (!response.ok) throw new Error('Failed to fetch notifications');
      
      this.notifications = await response.json();
      this.loading = false;
      this.render();
    } catch (err) {
      this.error = 'Failed to fetch notifications. Please try again later.';
      this.loading = false;
      this.render();
    }
  }

  async handleMarkAsRead(notificationId) {
    try {
      const response = await fetch(`/api/users/notifications/${notificationId}/read`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (!response.ok) throw new Error('Failed to mark notification as read');
      
      await this.fetchNotifications();
      this.updateUnreadCount();
    } catch (err) {
      this.error = 'Failed to mark notification as read. Please try again.';
      this.render();
    }
  }

  async handleMarkAllAsRead() {
    try {
      const response = await fetch('/api/users/notifications/read-all', {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (!response.ok) throw new Error('Failed to mark all notifications as read');
      
      await this.fetchNotifications();
      this.updateUnreadCount();
    } catch (err) {
      this.error = 'Failed to mark all notifications as read. Please try again.';
      this.render();
    }
  }

  setupEventListeners() {
    const markAllReadButton = document.getElementById('mark-all-read');
    if (markAllReadButton) {
      markAllReadButton.addEventListener('click', () => this.handleMarkAllAsRead());
    }
  }

  updateUnreadCount() {
    this.unreadCount = this.notifications.filter(n => !n.read).length;
    const unreadBadge = document.getElementById('unread-count');
    if (unreadBadge) {
      unreadBadge.textContent = this.unreadCount;
      unreadBadge.style.display = this.unreadCount > 0 ? 'block' : 'none';
    }
  }

  render() {
    const container = document.getElementById('notifications-container');
    if (!container) return;

    if (this.loading) {
      container.innerHTML = '<div class="text-center py-8">Loading...</div>';
      return;
    }

    if (this.error) {
      container.innerHTML = `<div class="text-red-600 text-center py-8">${this.error}</div>`;
      return;
    }

    const unreadNotifications = this.notifications.filter(n => !n.read);
    
    container.innerHTML = `
      <div class="container mx-auto px-4 py-8">
        <div class="max-w-4xl mx-auto">
          <div class="flex justify-between items-center mb-6">
            <h1 class="text-2xl font-bold">Notifications</h1>
            ${unreadNotifications.length > 0 ? `
              <button id="mark-all-read" class="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700">
                Mark All as Read
              </button>
            ` : ''}
          </div>

          ${this.notifications.length === 0 
            ? '<div class="text-center py-8 text-gray-500">No notifications found.</div>'
            : this.notifications.map(notification => `
              <div class="bg-white rounded-lg shadow-lg p-6 mb-4 ${!notification.read ? 'border-l-4 border-indigo-600' : ''}">
                <div class="flex justify-between items-start">
                  <div>
                    <h2 class="text-xl font-semibold mb-2">${notification.title}</h2>
                    <p class="text-gray-600 mb-2">${notification.message}</p>
                    <p class="text-sm text-gray-500">
                      ${new Date(notification.createdAt).toLocaleString()}
                    </p>
                    ${notification.link ? `
                      <a href="${notification.link}" class="text-indigo-600 hover:text-indigo-800 mt-2 inline-block">
                        View Details
                      </a>
                    ` : ''}
                  </div>
                  ${!notification.read ? `
                    <button onclick="userNotifications.handleMarkAsRead('${notification._id}')" class="text-indigo-600 hover:text-indigo-800">
                      Mark as Read
                    </button>
                  ` : ''}
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
const userNotifications = new UserNotifications(); 