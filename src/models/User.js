const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');

/**
 * @swagger
 * components:
 *   schemas:
 *     User:
 *       type: object
 *       required:
 *         - name
 *         - email
 *         - password
 *       properties:
 *         name:
 *           type: string
 *           description: User's full name
 *         email:
 *           type: string
 *           description: User's email address
 *         password:
 *           type: string
 *           description: User's password
 *         role:
 *           type: string
 *           enum: [user, admin]
 *           description: User's role
 *         phone:
 *           type: string
 *           description: User's phone number
 *         address:
 *           type: object
 *           properties:
 *             street:
 *               type: string
 *             city:
 *               type: string
 *             state:
 *               type: string
 *             zipCode:
 *               type: string
 *             country:
 *               type: string
 *         preferences:
 *           type: object
 *           properties:
 *             currency:
 *               type: string
 *             language:
 *               type: string
 *             notifications:
 *               type: object
 *               properties:
 *                 email:
 *                   type: boolean
 *                 sms:
 *                   type: boolean
 *         avatar:
 *           type: string
 *           description: URL to user's profile picture
 */

const userSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Please add a name'],
        trim: true,
        maxlength: [50, 'Name cannot be more than 50 characters']
    },
    email: {
        type: String,
        required: [true, 'Please add an email'],
        unique: true,
        match: [
            /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/,
            'Please add a valid email'
        ]
    },
    password: {
        type: String,
        required: [true, 'Please add a password'],
        minlength: [6, 'Password must be at least 6 characters'],
        select: false
    },
    role: {
        type: String,
        enum: ['user', 'admin'],
        default: 'user'
    },
    phone: {
        type: String,
        match: [
            /^\+?[\d\s-]+$/,
            'Please add a valid phone number'
        ]
    },
    address: {
        street: String,
        city: String,
        state: String,
        zipCode: String,
        country: String
    },
    preferences: {
        currency: {
            type: String,
            enum: ['USD', 'EUR', 'GBP'],
            default: 'USD'
        },
        language: {
            type: String,
            enum: ['en', 'es', 'fr'],
            default: 'en'
        },
        notifications: {
            email: {
                type: Boolean,
                default: true
            },
            sms: {
                type: Boolean,
                default: false
            }
        }
    },
    avatar: {
        type: String,
        default: 'default-avatar.jpg'
    },
    emailVerified: {
        type: Boolean,
        default: false
    },
    emailVerificationToken: String,
    emailVerificationExpire: Date,
    resetPasswordToken: String,
    resetPasswordExpire: Date,
    lastLogin: Date,
    createdAt: {
        type: Date,
        default: Date.now
    },
    // Two-Factor Authentication
    twoFactorEnabled: {
        type: Boolean,
        default: false
    },
    twoFactorSecret: {
        type: String,
        select: false
    },
    
    // Social Media Profiles
    socialProfiles: {
        facebook: String,
        twitter: String,
        instagram: String,
        linkedin: String
    },
    
    // User Interests and Preferences
    interests: [{
        type: String,
        enum: ['beach', 'mountain', 'city', 'culture', 'food', 'adventure', 'relaxation', 'shopping']
    }],
    
    // Travel Stats
    travelStats: {
        totalTrips: {
            type: Number,
            default: 0
        },
        totalCountries: {
            type: Number,
            default: 0
        },
        totalCities: {
            type: Number,
            default: 0
        },
        totalSpent: {
            type: Number,
            default: 0
        }
    },
    
    // Account Status
    status: {
        type: String,
        enum: ['active', 'inactive', 'suspended', 'deleted'],
        default: 'active'
    },
    
    // Newsletter Subscription
    newsletter: {
        subscribed: {
            type: Boolean,
            default: false
        },
        topics: [{
            type: String,
            enum: ['deals', 'news', 'tips', 'destinations']
        }]
    },
    
    // Login History
    loginHistory: [{
        timestamp: {
            type: Date,
            default: Date.now
        },
        ip: String,
        device: String,
        location: String
    }],
    
    // Failed Login Attempts
    failedLoginAttempts: {
        type: Number,
        default: 0
    },
    accountLocked: {
        type: Boolean,
        default: false
    },
    lockUntil: Date,
    
    // Saved Items
    savedItems: {
        hotels: [{
            type: mongoose.Schema.ObjectId,
            ref: 'Hotel'
        }],
        flights: [{
            type: mongoose.Schema.ObjectId,
            ref: 'Flight'
        }],
        tours: [{
            type: mongoose.Schema.ObjectId,
            ref: 'Tour'
        }]
    }
}, {
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
});

// Encrypt password using bcrypt
userSchema.pre('save', async function(next) {
    if (!this.isModified('password')) {
        next();
    }
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
});

// Sign JWT and return
userSchema.methods.getSignedJwtToken = function() {
    return jwt.sign({ id: this._id }, process.env.JWT_SECRET, {
        expiresIn: process.env.JWT_EXPIRE
    });
};

// Match user entered password to hashed password in database
userSchema.methods.matchPassword = async function(enteredPassword) {
    return await bcrypt.compare(enteredPassword, this.password);
};

// Generate and hash email verification token
userSchema.methods.getEmailVerificationToken = function() {
    // Generate token
    const verificationToken = crypto.randomBytes(20).toString('hex');

    // Hash token and set to emailVerificationToken field
    this.emailVerificationToken = crypto
        .createHash('sha256')
        .update(verificationToken)
        .digest('hex');

    // Set expire
    this.emailVerificationExpire = Date.now() + 24 * 60 * 60 * 1000; // 24 hours

    return verificationToken;
};

// Generate and hash password reset token
userSchema.methods.getResetPasswordToken = function() {
    // Generate token
    const resetToken = crypto.randomBytes(20).toString('hex');

    // Hash token and set to resetPasswordToken field
    this.resetPasswordToken = crypto
        .createHash('sha256')
        .update(resetToken)
        .digest('hex');

    // Set expire
    this.resetPasswordExpire = Date.now() + 10 * 60 * 1000; // 10 minutes

    return resetToken;
};

// Virtual populate with bookings
userSchema.virtual('bookings', {
    ref: 'Booking',
    foreignField: 'user',
    localField: '_id'
});

// Method to check if account is locked
userSchema.methods.isAccountLocked = function() {
    return this.accountLocked && this.lockUntil > Date.now();
};

// Method to increment failed login attempts
userSchema.methods.incrementLoginAttempts = async function() {
    this.failedLoginAttempts += 1;
    
    // Lock account after 5 failed attempts
    if (this.failedLoginAttempts >= 5) {
        this.accountLocked = true;
        this.lockUntil = Date.now() + 30 * 60 * 1000; // Lock for 30 minutes
    }
    
    await this.save();
};

// Method to reset failed login attempts
userSchema.methods.resetLoginAttempts = async function() {
    this.failedLoginAttempts = 0;
    this.accountLocked = false;
    this.lockUntil = undefined;
    await this.save();
};

// Method to log login activity
userSchema.methods.logLoginActivity = async function(ip, device, location) {
    this.lastLogin = Date.now();
    this.loginHistory.push({ ip, device, location });
    
    // Keep only last 10 login records
    if (this.loginHistory.length > 10) {
        this.loginHistory = this.loginHistory.slice(-10);
    }
    
    await this.save();
};

// Method to update travel stats
userSchema.methods.updateTravelStats = async function(booking) {
    // Increment total trips
    this.travelStats.totalTrips += 1;
    
    // Update total spent
    this.travelStats.totalSpent += booking.totalPrice;
    
    // Update countries and cities based on booking type
    if (booking.bookingType === 'hotel') {
        const hotel = await this.model('Hotel').findById(booking.itemId);
        if (hotel) {
            // Add unique city and country
            const cities = new Set(this.travelStats.totalCities);
            cities.add(hotel.city);
            this.travelStats.totalCities = cities.size;
            
            const countries = new Set(this.travelStats.totalCountries);
            countries.add(hotel.country);
            this.travelStats.totalCountries = countries.size;
        }
    }
    
    await this.save();
};

module.exports = mongoose.model('User', userSchema); 