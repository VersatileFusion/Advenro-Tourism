const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const dotenv = require('dotenv');
const path = require('path');

// Load env vars
dotenv.config({ path: path.join(__dirname, '../config/config.env') });

// Import User model
const { User } = require('../models');

const createAdminUser = async () => {
    try {
        // Connect to MongoDB
        await mongoose.connect(process.env.MONGODB_URI, {
            useNewUrlParser: true,
            useUnifiedTopology: true
        });

        console.log('🔌 Connected to MongoDB...');

        // Check if admin already exists
        const adminExists = await User.findOne({ email: 'admin@tourism.com' });
        
        if (adminExists) {
            console.log('👤 Admin user already exists');
            process.exit(0);
        }

        // Create admin user
        const adminUser = await User.create({
            name: 'Admin User',
            email: 'admin@tourism.com',
            password: 'admin123456',
            role: 'admin'
        });

        console.log('✅ Admin user created successfully:', {
            name: adminUser.name,
            email: adminUser.email,
            role: adminUser.role
        });

        process.exit(0);
    } catch (error) {
        console.error('❌ Error:', error);
        process.exit(1);
    }
};

createAdminUser(); 