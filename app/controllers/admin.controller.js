/**
 * Admin Controller
 * Handles all admin-related API endpoints
 */

// Mock data - in a real app, this would come from a database
const mockUsers = [
  {
    id: 1,
    name: 'John Doe',
    email: 'john.doe@example.com',
    role: 'user',
    status: 'active',
    createdAt: '2023-01-15T10:30:00.000Z',
    lastLogin: '2023-05-10T15:45:00.000Z'
  },
  {
    id: 2,
    name: 'Sarah Smith',
    email: 'sarah.smith@example.com',
    role: 'user',
    status: 'active',
    createdAt: '2023-02-20T09:15:00.000Z',
    lastLogin: '2023-05-09T11:20:00.000Z'
  },
  {
    id: 3,
    name: 'Michael Johnson',
    email: 'michael.johnson@example.com',
    role: 'admin',
    status: 'active',
    createdAt: '2022-11-05T14:20:00.000Z',
    lastLogin: '2023-05-10T08:30:00.000Z'
  }
];

const mockBookings = [
  {
    id: 'BK-2023-001',
    type: 'hotel',
    itemName: 'Grand Hotel Paris',
    userId: 1,
    userName: 'John Doe',
    userEmail: 'john.doe@example.com',
    date: '2023-06-15',
    endDate: '2023-06-18',
    amount: 450.00,
    status: 'confirmed',
    createdAt: '2023-05-02T10:30:00.000Z'
  },
  {
    id: 'BK-2023-002',
    type: 'tour',
    itemName: 'Tokyo Food Tour',
    userId: 2,
    userName: 'Sarah Smith',
    userEmail: 'sarah.smith@example.com',
    date: '2023-07-10',
    endDate: '2023-07-10',
    amount: 85.00,
    status: 'confirmed',
    createdAt: '2023-05-05T14:15:00.000Z'
  }
];

const mockActivities = [
  {
    id: 1,
    type: 'booking',
    message: '<strong>John Doe</strong> booked Grand Hotel Paris for 3 nights',
    userId: 1,
    timestamp: new Date(Date.now() - 1000 * 60 * 5).toISOString() // 5 minutes ago
  },
  {
    id: 2,
    type: 'review',
    message: '<strong>Sarah Smith</strong> left a 5-star review for Tokyo Food Tour',
    userId: 2,
    timestamp: new Date(Date.now() - 1000 * 60 * 15).toISOString() // 15 minutes ago
  }
];

/**
 * Verify if the user is an admin
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @returns {boolean} - True if admin, false otherwise
 */
const verifyAdmin = (req, res) => {
  // In a real app, this would check the JWT token and verify admin role
  // For now, we'll assume the user is an admin if they have a token in the header
  const authHeader = req.headers['authorization'];
  
  if (!authHeader) {
    res.status(401).json({ error: 'Authentication required' });
    return false;
  }
  
  // Check if it starts with "Bearer "
  if (!authHeader.startsWith('Bearer ')) {
    res.status(401).json({ error: 'Invalid authentication format' });
    return false;
  }
  
  // In a real app, the token would be validated here
  // For now, we'll just assume it's valid
  return true;
};

/**
 * Get dashboard statistics
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const getDashboardStats = (req, res) => {
  if (!verifyAdmin(req, res)) return;
  
  const period = req.query.period || 'week';
  
  // Generate some random changes based on the period
  const getRandomChange = () => {
    return Math.floor(Math.random() * 30) * (Math.random() > 0.5 ? 1 : -1);
  };
  
  // In a real app, these stats would be calculated from database data
  const stats = {
    stats: {
      users: {
        value: 2547,
        change: getRandomChange()
      },
      bookings: {
        value: 1842,
        change: getRandomChange()
      },
      revenue: {
        value: 156840,
        change: getRandomChange()
      },
      reviews: {
        value: 942,
        change: getRandomChange()
      }
    },
    revenueData: {
      labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
      values: [
        Math.floor(Math.random() * 40000) + 20000,
        Math.floor(Math.random() * 40000) + 20000,
        Math.floor(Math.random() * 40000) + 20000,
        Math.floor(Math.random() * 40000) + 20000,
        Math.floor(Math.random() * 40000) + 20000,
        Math.floor(Math.random() * 40000) + 20000,
        Math.floor(Math.random() * 40000) + 20000,
        Math.floor(Math.random() * 40000) + 20000,
        Math.floor(Math.random() * 40000) + 20000,
        Math.floor(Math.random() * 40000) + 20000,
        Math.floor(Math.random() * 40000) + 20000,
        Math.floor(Math.random() * 40000) + 20000
      ]
    },
    bookingsByType: {
      labels: ['Hotels', 'Flights', 'Tours', 'Restaurants'],
      values: [
        Math.floor(Math.random() * 1000) + 500,
        Math.floor(Math.random() * 1000) + 500,
        Math.floor(Math.random() * 1000) + 300,
        Math.floor(Math.random() * 500) + 100
      ]
    }
  };
  
  res.json(stats);
};

/**
 * Get recent activity
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const getRecentActivity = (req, res) => {
  if (!verifyAdmin(req, res)) return;
  
  const limit = parseInt(req.query.limit) || 10;
  
  // In a real app, this would be fetched from a database with proper pagination
  const activities = mockActivities.slice(0, limit);
  
  res.json(activities);
};

/**
 * Get listings statistics
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const getListingsStats = (req, res) => {
  if (!verifyAdmin(req, res)) return;
  
  // In a real app, these stats would be calculated from database data
  const stats = {
    activeListings: 845,
    pendingListings: 126,
    inactiveListings: 58,
    featuredListings: 64
  };
  
  res.json(stats);
};

/**
 * Get support tickets statistics
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const getSupportTicketsStats = (req, res) => {
  if (!verifyAdmin(req, res)) return;
  
  // In a real app, these stats would be calculated from database data
  const stats = {
    openTickets: 24,
    inProgressTickets: 18,
    closedTickets: 152
  };
  
  res.json(stats);
};

/**
 * Get users with pagination
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const getUsers = (req, res) => {
  if (!verifyAdmin(req, res)) return;
  
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const search = req.query.search || '';
  
  // Filter by search term if provided
  let filteredUsers = mockUsers;
  if (search) {
    const searchLower = search.toLowerCase();
    filteredUsers = mockUsers.filter(user => 
      user.name.toLowerCase().includes(searchLower) || 
      user.email.toLowerCase().includes(searchLower)
    );
  }
  
  // Paginate results
  const totalItems = filteredUsers.length;
  const totalPages = Math.ceil(totalItems / limit);
  const startIndex = (page - 1) * limit;
  const endIndex = startIndex + limit;
  const paginatedUsers = filteredUsers.slice(startIndex, endIndex);
  
  res.json({
    users: paginatedUsers,
    pagination: {
      page,
      limit,
      totalItems,
      totalPages
    }
  });
};

/**
 * Get user by ID
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const getUserById = (req, res) => {
  if (!verifyAdmin(req, res)) return;
  
  const userId = parseInt(req.params.id);
  
  const user = mockUsers.find(user => user.id === userId);
  
  if (!user) {
    return res.status(404).json({ error: 'User not found' });
  }
  
  res.json(user);
};

/**
 * Update user
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const updateUser = (req, res) => {
  if (!verifyAdmin(req, res)) return;
  
  const userId = parseInt(req.params.id);
  const userData = req.body;
  
  const userIndex = mockUsers.findIndex(user => user.id === userId);
  
  if (userIndex === -1) {
    return res.status(404).json({ error: 'User not found' });
  }
  
  // Update only allowed fields
  const allowedFields = ['name', 'email', 'role', 'status'];
  const updatedUser = { ...mockUsers[userIndex] };
  
  allowedFields.forEach(field => {
    if (userData[field] !== undefined) {
      updatedUser[field] = userData[field];
    }
  });
  
  mockUsers[userIndex] = updatedUser;
  
  res.json(updatedUser);
};

/**
 * Get bookings with pagination
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const getBookings = (req, res) => {
  if (!verifyAdmin(req, res)) return;
  
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const search = req.query.search || '';
  const status = req.query.status || '';
  
  // Filter by status if provided
  let filteredBookings = mockBookings;
  if (status) {
    filteredBookings = mockBookings.filter(booking => booking.status === status);
  }
  
  // Filter by search term if provided
  if (search) {
    const searchLower = search.toLowerCase();
    filteredBookings = filteredBookings.filter(booking => 
      booking.id.toLowerCase().includes(searchLower) || 
      booking.itemName.toLowerCase().includes(searchLower) ||
      booking.userName.toLowerCase().includes(searchLower) ||
      booking.userEmail.toLowerCase().includes(searchLower)
    );
  }
  
  // Paginate results
  const totalItems = filteredBookings.length;
  const totalPages = Math.ceil(totalItems / limit);
  const startIndex = (page - 1) * limit;
  const endIndex = startIndex + limit;
  const paginatedBookings = filteredBookings.slice(startIndex, endIndex);
  
  res.json({
    bookings: paginatedBookings,
    pagination: {
      page,
      limit,
      totalItems,
      totalPages
    }
  });
};

/**
 * Get booking by ID
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const getBookingById = (req, res) => {
  if (!verifyAdmin(req, res)) return;
  
  const bookingId = req.params.id;
  
  const booking = mockBookings.find(booking => booking.id === bookingId);
  
  if (!booking) {
    return res.status(404).json({ error: 'Booking not found' });
  }
  
  res.json(booking);
};

/**
 * Update booking status
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const updateBookingStatus = (req, res) => {
  if (!verifyAdmin(req, res)) return;
  
  const bookingId = req.params.id;
  const { status } = req.body;
  
  const bookingIndex = mockBookings.findIndex(booking => booking.id === bookingId);
  
  if (bookingIndex === -1) {
    return res.status(404).json({ error: 'Booking not found' });
  }
  
  // Validate status
  const validStatuses = ['pending', 'confirmed', 'cancelled', 'completed'];
  if (!validStatuses.includes(status)) {
    return res.status(400).json({ error: 'Invalid status' });
  }
  
  // Update booking status
  mockBookings[bookingIndex].status = status;
  
  res.json(mockBookings[bookingIndex]);
};

/**
 * Get system settings
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const getSystemSettings = (req, res) => {
  if (!verifyAdmin(req, res)) return;
  
  // In a real app, these settings would be fetched from a database
  const settings = {
    siteTitle: 'Advenro Travel',
    siteDescription: 'Book your next adventure with Advenro Travel',
    contactEmail: 'support@advenro.com',
    contactPhone: '+1 (555) 123-4567',
    socialLinks: {
      facebook: 'https://facebook.com/advenro',
      twitter: 'https://twitter.com/advenro',
      instagram: 'https://instagram.com/advenro'
    },
    features: {
      enableReviews: true,
      enableBookings: true,
      enableNotifications: true,
      enableUserRegistration: true
    },
    appearance: {
      primaryColor: '#1e2a78',
      secondaryColor: '#40baf8',
      logoUrl: '/images/logo.png',
      faviconUrl: '/images/favicon.ico'
    }
  };
  
  res.json(settings);
};

/**
 * Update system settings
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const updateSystemSettings = (req, res) => {
  if (!verifyAdmin(req, res)) return;
  
  const newSettings = req.body;
  
  // In a real app, these settings would be validated and saved to a database
  // For now, we'll just echo back the settings
  res.json(newSettings);
};

module.exports = {
  getDashboardStats,
  getRecentActivity,
  getListingsStats,
  getSupportTicketsStats,
  getUsers,
  getUserById,
  updateUser,
  getBookings,
  getBookingById,
  updateBookingStatus,
  getSystemSettings,
  updateSystemSettings
}; 