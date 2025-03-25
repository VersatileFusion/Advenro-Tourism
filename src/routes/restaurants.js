const express = require('express');
const router = express.Router();
const restaurantController = require('../controllers/restaurantController');
const authController = require('../controllers/authController');
const { check } = require('express-validator');
const multer = require('multer');

// Setup multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    let uploadPath = 'public/uploads/restaurants';
    
    if (file.fieldname === 'menuItemImage') {
      uploadPath = 'public/uploads/restaurants/menu';
    }
    
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const fileExtension = file.originalname.split('.').pop();
    cb(null, `${file.fieldname}-${uniqueSuffix}.${fileExtension}`);
  }
});

const fileFilter = (req, file, cb) => {
  if (file.mimetype.startsWith('image/')) {
    cb(null, true);
  } else {
    cb(new Error('Not an image! Please upload only images.'), false);
  }
};

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter
});

// Validation middleware
const validateRestaurant = [
  check('name').not().isEmpty().withMessage('Restaurant name is required'),
  check('description').not().isEmpty().withMessage('Restaurant description is required'),
  check('cuisineType').not().isEmpty().withMessage('Cuisine type is required')
];

const validateMenuItem = [
  check('name').not().isEmpty().withMessage('Menu item name is required'),
  check('price').isNumeric().withMessage('Price must be a number'),
  check('category').isIn(['appetizer', 'main', 'dessert', 'drink', 'soup', 'salad', 'sides'])
    .withMessage('Invalid category')
];

// Public routes
// Get all restaurants with filtering
router.get('/', restaurantController.getAllRestaurants);

// Get a single restaurant
router.get('/:id', restaurantController.getRestaurant);

// Get restaurants by cuisine type
router.get('/cuisine/:cuisine', restaurantController.getRestaurantsByCuisine);

// Get menu for a restaurant
router.get('/:id/menu', restaurantController.getRestaurantMenu);

// Protected routes (require authentication)
router.use(authController.protect);

// Admin only routes
router.use(authController.restrictTo('admin'));

// Create a restaurant
router.post(
  '/',
  upload.fields([
    { name: 'coverImage', maxCount: 1 },
    { name: 'images', maxCount: 10 }
  ]),
  validateRestaurant,
  restaurantController.createRestaurant
);

// Update a restaurant
router.patch(
  '/:id',
  upload.fields([
    { name: 'coverImage', maxCount: 1 },
    { name: 'images', maxCount: 10 }
  ]),
  validateRestaurant,
  restaurantController.updateRestaurant
);

// Delete a restaurant
router.delete('/:id', restaurantController.deleteRestaurant);

// Menu item routes
// Add a menu item
router.post(
  '/:id/menu',
  upload.single('menuItemImage'),
  validateMenuItem,
  restaurantController.addMenuItem
);

// Update a menu item
router.patch(
  '/:id/menu/:menuItemId',
  upload.single('menuItemImage'),
  validateMenuItem,
  restaurantController.updateMenuItem
);

// Remove a menu item
router.delete('/:id/menu/:menuItemId', restaurantController.removeMenuItem);

module.exports = router; 