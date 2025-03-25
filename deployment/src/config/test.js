module.exports = {
    mongodb: {
        url: 'mongodb://localhost:27017/tourism-test-db',
        options: {
            useNewUrlParser: true,
            useUnifiedTopology: true
        }
    },
    // Add other test-specific configurations here
    jwt: {
        secret: 'test-secret-key',
        expiresIn: '1d'
    }
}; 