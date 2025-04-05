/**
 * Profile Controller
 * Handles user profile management functions
 */

// Mock data for development
const mockUsers = [
  {
    id: "user123",
    firstName: "John",
    lastName: "Doe",
    email: "john.doe@example.com",
    phone: "+1-555-123-4567",
    address: "123 Main Street",
    city: "New York",
    state: "NY",
    zipCode: "10001",
    country: "United States",
    avatar: "/images/avatars/user1.jpg",
    notificationPreferences: {
      emailNotifications: true,
      pushNotifications: true,
      smsNotifications: false,
      bookingUpdates: true,
      specialOffers: true,
      newsletter: false
    },
    createdAt: "2023-01-15T10:30:00.000Z",
    updatedAt: "2023-05-20T14:45:00.000Z"
  }
];

// Mock saved items for development
const mockSavedItems = {
  hotels: [
    {
      id: "hotel1",
      userId: "user123",
      itemId: "hotel101",
      name: "Luxury Palace Hotel",
      location: "New York, USA",
      image: "/images/hotels/luxury-palace.jpg",
      price: 250,
      rating: 4.8,
      savedAt: "2023-06-01T08:25:00.000Z"
    },
    {
      id: "hotel2",
      userId: "user123",
      itemId: "hotel102",
      name: "Seaside Resort & Spa",
      location: "Miami, USA",
      image: "/images/hotels/seaside-resort.jpg",
      price: 320,
      rating: 4.7,
      savedAt: "2023-05-15T14:10:00.000Z"
    }
  ],
  restaurants: [
    {
      id: "restaurant1",
      userId: "user123",
      itemId: "restaurant101",
      name: "Italian Delight",
      location: "Chicago, USA",
      image: "/images/restaurants/italian-delight.jpg",
      cuisine: "Italian",
      priceRange: "$$",
      rating: 4.5,
      savedAt: "2023-06-10T19:15:00.000Z"
    }
  ],
  tours: [
    {
      id: "tour1",
      userId: "user123",
      itemId: "tour101",
      name: "Historic City Walking Tour",
      location: "Rome, Italy",
      image: "/images/tours/rome-walking.jpg",
      price: 45,
      duration: "3 hours",
      rating: 4.9,
      savedAt: "2023-04-22T11:30:00.000Z"
    }
  ]
};

const ProfileController = {
  /**
   * Get user profile information
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  getProfile: (req, res) => {
    try {
      // In a real app, we would get the user ID from the authentication token
      const userId = req.user?.id || "user123"; // Default for mock data
      
      // Find user in database
      const user = mockUsers.find(user => user.id === userId);
      
      if (!user) {
        return res.status(404).json({
          success: false,
          message: "User not found"
        });
      }
      
      // Remove sensitive information
      const { password, ...userProfile } = user;
      
      return res.status(200).json({
        success: true,
        data: userProfile
      });
    } catch (error) {
      console.error("Error in getProfile:", error);
      return res.status(500).json({
        success: false,
        message: "Failed to retrieve profile information"
      });
    }
  },
  
  /**
   * Update user profile information
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  updateProfile: (req, res) => {
    try {
      // In a real app, we would get the user ID from the authentication token
      const userId = req.user?.id || "user123"; // Default for mock data
      
      // Find user in database
      const userIndex = mockUsers.findIndex(user => user.id === userId);
      
      if (userIndex === -1) {
        return res.status(404).json({
          success: false,
          message: "User not found"
        });
      }
      
      // Update user data
      const updatedUser = {
        ...mockUsers[userIndex],
        ...req.body,
        updatedAt: new Date().toISOString()
      };
      
      // In a real app, we would validate the input and save to the database
      mockUsers[userIndex] = updatedUser;
      
      // Remove sensitive information
      const { password, ...userProfile } = updatedUser;
      
      return res.status(200).json({
        success: true,
        message: "Profile updated successfully",
        data: userProfile
      });
    } catch (error) {
      console.error("Error in updateProfile:", error);
      return res.status(500).json({
        success: false,
        message: "Failed to update profile information"
      });
    }
  },
  
  /**
   * Upload a profile picture
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  uploadProfilePicture: (req, res) => {
    try {
      // In a real app, we would get the user ID from the authentication token
      const userId = req.user?.id || "user123"; // Default for mock data
      
      // Find user in database
      const userIndex = mockUsers.findIndex(user => user.id === userId);
      
      if (userIndex === -1) {
        return res.status(404).json({
          success: false,
          message: "User not found"
        });
      }
      
      // In a real app, we would handle file upload, store it, and update the user's avatar URL
      // For this mock, we'll just use a predefined URL
      const avatarUrl = `/images/avatars/user${Math.floor(Math.random() * 5) + 1}.jpg`;
      
      // Update user data
      mockUsers[userIndex] = {
        ...mockUsers[userIndex],
        avatar: avatarUrl,
        updatedAt: new Date().toISOString()
      };
      
      return res.status(200).json({
        success: true,
        message: "Profile picture uploaded successfully",
        data: {
          avatarUrl
        }
      });
    } catch (error) {
      console.error("Error in uploadProfilePicture:", error);
      return res.status(500).json({
        success: false,
        message: "Failed to upload profile picture"
      });
    }
  },
  
  /**
   * Change password
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  changePassword: (req, res) => {
    try {
      // In a real app, we would get the user ID from the authentication token
      const userId = req.user?.id || "user123"; // Default for mock data
      
      // Find user in database
      const userIndex = mockUsers.findIndex(user => user.id === userId);
      
      if (userIndex === -1) {
        return res.status(404).json({
          success: false,
          message: "User not found"
        });
      }
      
      // Validate old password and set new password
      const { currentPassword, newPassword } = req.body;
      
      if (!currentPassword || !newPassword) {
        return res.status(400).json({
          success: false,
          message: "Current password and new password are required"
        });
      }
      
      // In a real app, we would verify the current password and update with the hashed new password
      
      // Update user data
      mockUsers[userIndex] = {
        ...mockUsers[userIndex],
        updatedAt: new Date().toISOString()
      };
      
      return res.status(200).json({
        success: true,
        message: "Password changed successfully"
      });
    } catch (error) {
      console.error("Error in changePassword:", error);
      return res.status(500).json({
        success: false,
        message: "Failed to change password"
      });
    }
  },
  
  /**
   * Get saved items (favorites) for a user
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  getSavedItems: (req, res) => {
    try {
      // In a real app, we would get the user ID from the authentication token
      const userId = req.user?.id || "user123"; // Default for mock data
      
      // Get type from query or default to "all"
      const { type = "all" } = req.query;
      
      if (type !== "all" && !["hotel", "restaurant", "tour"].includes(type)) {
        return res.status(400).json({
          success: false,
          message: "Invalid item type"
        });
      }
      
      let savedItems;
      
      if (type === "all") {
        // Return all types of saved items
        savedItems = {
          hotels: mockSavedItems.hotels.filter(item => item.userId === userId),
          restaurants: mockSavedItems.restaurants.filter(item => item.userId === userId),
          tours: mockSavedItems.tours.filter(item => item.userId === userId)
        };
      } else {
        // Return only the specified type
        savedItems = mockSavedItems[`${type}s`].filter(item => item.userId === userId);
      }
      
      return res.status(200).json({
        success: true,
        data: savedItems
      });
    } catch (error) {
      console.error("Error in getSavedItems:", error);
      return res.status(500).json({
        success: false,
        message: "Failed to retrieve saved items"
      });
    }
  },
  
  /**
   * Save an item to favorites
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  saveItem: (req, res) => {
    try {
      // In a real app, we would get the user ID from the authentication token
      const userId = req.user?.id || "user123"; // Default for mock data
      
      const { itemId, itemType } = req.body;
      
      if (!itemId || !itemType) {
        return res.status(400).json({
          success: false,
          message: "Item ID and type are required"
        });
      }
      
      if (!["hotel", "restaurant", "tour"].includes(itemType)) {
        return res.status(400).json({
          success: false,
          message: "Invalid item type"
        });
      }
      
      // Check if item is already saved
      const alreadySaved = mockSavedItems[`${itemType}s`].some(
        item => item.userId === userId && item.itemId === itemId
      );
      
      if (alreadySaved) {
        return res.status(400).json({
          success: false,
          message: "Item is already saved"
        });
      }
      
      // In a real app, we would get item details from the respective service
      // For this mock, we'll create a dummy item
      const newSavedItem = {
        id: `${itemType}${Date.now()}`,
        userId,
        itemId,
        name: `Sample ${itemType.charAt(0).toUpperCase() + itemType.slice(1)}`,
        location: "Sample Location",
        image: `/images/${itemType}s/sample.jpg`,
        savedAt: new Date().toISOString()
      };
      
      // Add item to saved items
      mockSavedItems[`${itemType}s`].push(newSavedItem);
      
      return res.status(201).json({
        success: true,
        message: "Item saved successfully",
        data: newSavedItem
      });
    } catch (error) {
      console.error("Error in saveItem:", error);
      return res.status(500).json({
        success: false,
        message: "Failed to save item"
      });
    }
  },
  
  /**
   * Remove an item from favorites
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  removeItem: (req, res) => {
    try {
      // In a real app, we would get the user ID from the authentication token
      const userId = req.user?.id || "user123"; // Default for mock data
      
      const { itemId } = req.params;
      
      if (!itemId) {
        return res.status(400).json({
          success: false,
          message: "Item ID is required"
        });
      }
      
      // Find and remove item from appropriate category
      let itemRemoved = false;
      
      for (const category of Object.keys(mockSavedItems)) {
        const index = mockSavedItems[category].findIndex(
          item => item.id === itemId && item.userId === userId
        );
        
        if (index !== -1) {
          mockSavedItems[category].splice(index, 1);
          itemRemoved = true;
          break;
        }
      }
      
      if (!itemRemoved) {
        return res.status(404).json({
          success: false,
          message: "Saved item not found"
        });
      }
      
      return res.status(200).json({
        success: true,
        message: "Item removed successfully"
      });
    } catch (error) {
      console.error("Error in removeItem:", error);
      return res.status(500).json({
        success: false,
        message: "Failed to remove item"
      });
    }
  },
  
  /**
   * Delete user account
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  deleteAccount: (req, res) => {
    try {
      // In a real app, we would get the user ID from the authentication token
      const userId = req.user?.id || "user123"; // Default for mock data
      
      // Find user in database
      const userIndex = mockUsers.findIndex(user => user.id === userId);
      
      if (userIndex === -1) {
        return res.status(404).json({
          success: false,
          message: "User not found"
        });
      }
      
      // In a real app, we would verify the user's credentials before deletion
      
      // Remove user from database
      mockUsers.splice(userIndex, 1);
      
      // Remove all saved items for the user
      for (const category of Object.keys(mockSavedItems)) {
        mockSavedItems[category] = mockSavedItems[category].filter(
          item => item.userId !== userId
        );
      }
      
      return res.status(200).json({
        success: true,
        message: "Account deleted successfully"
      });
    } catch (error) {
      console.error("Error in deleteAccount:", error);
      return res.status(500).json({
        success: false,
        message: "Failed to delete account"
      });
    }
  }
};

module.exports = ProfileController; 