const env = process.env.NODE_ENV || 'development';

const config = {
    development: require('./development'),
    test: require('./test'),
    production: require('./production')
};

module.exports = config[env]; 