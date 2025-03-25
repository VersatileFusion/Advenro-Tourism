const mongoose = require('mongoose');

const connectDB = async () => {
    try {
        // In test environment, the connection is handled by mongodb-memory-server in setup.js
        if (process.env.NODE_ENV === 'test') {
            return;
        }

        const conn = await mongoose.connect(process.env.MONGODB_URI, {
            useNewUrlParser: true,
            useUnifiedTopology: true
        });

        console.log(`MongoDB Connected: ${conn.connection.host}`);
    } catch (error) {
        console.error(`Error: ${error.message}`);
        process.exit(1);
    }
};

module.exports = connectDB; 