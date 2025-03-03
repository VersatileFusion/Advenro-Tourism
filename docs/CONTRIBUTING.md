# Contributing to Tourism Booking API

We love your input! We want to make contributing to Tourism Booking API as easy and transparent as possible, whether it's:

- Reporting a bug
- Discussing the current state of the code
- Submitting a fix
- Proposing new features
- Becoming a maintainer

## Development Process

We use GitHub to host code, to track issues and feature requests, as well as accept pull requests.

1. Fork the repo and create your branch from `main`.
2. If you've added code that should be tested, add tests.
3. If you've changed APIs, update the documentation.
4. Ensure the test suite passes.
5. Make sure your code lints.
6. Issue that pull request!

## Code Style Guidelines

### JavaScript

- Use ES6+ features
- Use async/await for asynchronous operations
- Follow the [Airbnb JavaScript Style Guide](https://github.com/airbnb/javascript)
- Use meaningful variable and function names
- Add comments for complex logic

Example:
\`\`\`javascript
// Good
const getUserProfile = async (userId) => {
    try {
        const user = await User.findById(userId);
        if (!user) {
            throw new ErrorResponse('User not found', 404);
        }
        return user;
    } catch (error) {
        throw new ErrorResponse('Error fetching user profile', 500);
    }
};

// Bad
const getUser = async (id) => {
    const u = await User.findById(id);
    return u;
};
\`\`\`

### API Design

- Use RESTful conventions
- Version your APIs
- Use proper HTTP methods and status codes
- Implement proper error handling
- Document all endpoints with Swagger

Example:
\`\`\`javascript
/**
 * @swagger
 * /api/v1/users/{id}:
 *   get:
 *     summary: Get user by ID
 *     description: Retrieve user information by their ID
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Success
 *       404:
 *         description: User not found
 */
\`\`\`

## Testing

### Writing Tests

- Write tests for all new features
- Use descriptive test names
- Follow the AAA pattern (Arrange, Act, Assert)
- Test both success and error cases

Example:
\`\`\`javascript
describe('User Profile', () => {
    describe('GET /api/v1/users/me', () => {
        it('should return user profile when authenticated', async () => {
            // Arrange
            const user = await User.create({
                name: 'Test User',
                email: 'test@example.com'
            });
            const token = user.getSignedJwtToken();

            // Act
            const res = await request(app)
                .get('/api/v1/users/me')
                .set('Authorization', \`Bearer \${token}\`);

            // Assert
            expect(res.status).toBe(200);
            expect(res.body.data.email).toBe('test@example.com');
        });
    });
});
\`\`\`

## Documentation

### Code Documentation

- Use JSDoc for function documentation
- Document complex algorithms
- Include usage examples
- Keep documentation up to date

Example:
\`\`\`javascript
/**
 * Calculate average rating for an item
 * @param {string} itemType - Type of item (hotel, flight, tour)
 * @param {string} itemId - MongoDB ID of the item
 * @returns {Promise<number>} Average rating
 * @throws {Error} If item type is invalid
 */
async function calculateAverageRating(itemType, itemId) {
    // Implementation
}
\`\`\`

### API Documentation

- Use Swagger for API documentation
- Include request/response examples
- Document all parameters
- Specify authentication requirements

## Pull Request Process

1. Update the README.md with details of changes if needed
2. Update the package.json version if needed
3. Add tests for new features
4. Update documentation
5. The PR will be merged once you have the sign-off of two other developers

## Issue Reporting

### Bug Reports

When filing an issue, make sure to answer these questions:

1. What version of Node.js are you using?
2. What operating system are you using?
3. What did you do?
4. What did you expect to see?
5. What did you see instead?

### Feature Requests

Provide the following information:

1. Detailed description of the feature
2. Why this feature would be useful
3. Possible implementation details
4. Example use cases

## Community

- Be welcoming to newcomers
- Be respectful of differing viewpoints
- Accept constructive criticism
- Focus on what is best for the community
- Show empathy towards other community members

## License

By contributing, you agree that your contributions will be licensed under its ISC License. 