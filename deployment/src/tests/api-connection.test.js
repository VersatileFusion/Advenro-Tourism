const request = require('supertest');
const { expect, setupTestDB, teardownTestDB, app } = require('./test-helper');
const nock = require('nock');

describe('Booking.com API Connection Test', () => {
    before(async function() {
        this.timeout(30000);
        await setupTestDB();
    });

    after(async function() {
        this.timeout(30000);
        await teardownTestDB();
        nock.cleanAll();
    });

    beforeEach(() => {
        // Reset all nock interceptors
        nock.cleanAll();
    });

    it('should successfully connect to Booking.com API and search hotels', async function() {
        this.timeout(30000);
        console.log('🔄 Testing Booking.com API connection...');
        
        const searchParams = {
            checkIn: '2024-05-01',
            checkOut: '2024-05-05',
            destId: 'London',
            adults: '2',
            rooms: '1'
        };

        // Mock the Booking.com API response
        nock('https://booking-com.p.rapidapi.com')
            .get('/v1/hotels/search')
            .query(true)
            .reply(200, {
                success: true,
                result: [
                    { id: 1, name: 'Test Hotel 1' },
                    { id: 2, name: 'Test Hotel 2' }
                ]
            });

        console.log('📤 Sending API request with parameters:', searchParams);
        const response = await request(app)
            .get('/api/v1/booking/hotels/search')
            .query(searchParams);

        expect(response.status).to.equal(200);
        expect(response.body).to.have.property('success', true);
        expect(response.body).to.have.property('data');
        expect(response.body.data).to.be.an('array');
        expect(response.body.data).to.have.lengthOf(2);

        console.log('✅ API Connection Test Successful!');
        console.log(`📊 Found ${response.body.data.length} hotels`);
    });

    it('should handle API errors gracefully', async () => {
        console.log('🔄 Testing API error handling...');
        console.log('📤 Sending API request with invalid parameters: { checkIn: \'invalid-date\', checkOut: \'2024-05-05\', destId: \'London\' }');
        
        try {
            const response = await request(app)
                .get('/api/v1/booking/hotels/search')
                .query({
                    checkIn: 'invalid-date',
                    checkOut: '2024-05-05',
                    destId: 'London'
                });
            
            expect(response.status).to.equal(400);
            expect(response.body.success).to.equal(false);
            expect(response.body.error).to.be.a('string');
            expect(response.body.error).to.include('Invalid date format');
        } catch (error) {
            console.error('Error during API error handling test:', error.message);
            throw error;
        }
    });
}); 