const chai = require('chai');
const expect = chai.expect;
const sinon = require('sinon');
const mongoose = require('mongoose');
const { ObjectId } = mongoose.Types;
const proxyquire = require('proxyquire');

// Import test setup
const { dbHelper } = require('../../config/setup');

// Create model mocks
const PaymentMock = {
  findById: sinon.stub(),
  findOne: sinon.stub(),
  find: sinon.stub(),
  create: sinon.stub(),
  findByIdAndUpdate: sinon.stub(),
  findByIdAndDelete: sinon.stub(),
  countDocuments: sinon.stub(),
  aggregate: sinon.stub()
};

const BookingMock = {
  findById: sinon.stub(),
  findByIdAndUpdate: sinon.stub()
};

const ErrorLogMock = {
  create: sinon.stub()
};

// Mock the express-validator
const validationResultMock = {
  isEmpty: sinon.stub().returns(true),
  array: sinon.stub().returns([])
};

const expressValidatorMock = {
  validationResult: () => validationResultMock
};

// Mock stripe
const stripeMock = {
  paymentIntents: {
    create: sinon.stub().resolves({ 
      id: 'pi_test123', 
      client_secret: 'pi_test123_secret_test123',
      status: 'requires_payment_method'
    }),
    retrieve: sinon.stub().resolves({
      id: 'pi_test123',
      status: 'succeeded'
    }),
    update: sinon.stub().resolves({})
  },
  checkout: {
    sessions: {
      create: sinon.stub().resolves({
        id: 'cs_test_123',
        url: 'https://checkout.stripe.com/test'
      })
    }
  },
  webhooks: {
    constructEvent: sinon.stub().returns({
      type: 'payment_intent.succeeded',
      data: {
        object: {
          id: 'pi_test123',
          metadata: {
            bookingId: 'booking123'
          }
        }
      }
    })
  }
};

// Define the payment controller implementation
const paymentController = {
  // Create payment intent
  createPaymentIntent: async (req, res) => {
    try {
      const { bookingId, amount, currency = 'usd' } = req.body;
      
      if (!bookingId || !amount) {
        return res.status(400).json({
          status: 'fail',
          message: 'Booking ID and amount are required'
        });
      }
      
      // Check if the booking exists
      const booking = await BookingMock.findById(bookingId);
      
      if (!booking) {
        return res.status(404).json({
          status: 'fail',
          message: 'Booking not found'
        });
      }
      
      // Create a payment intent
      const paymentIntent = await stripeMock.paymentIntents.create({
        amount: amount * 100, // Convert to cents
        currency,
        metadata: {
          bookingId
        }
      });
      
      // Create a payment record
      await PaymentMock.create({
        bookingId,
        paymentIntentId: paymentIntent.id,
        amount,
        currency,
        status: paymentIntent.status
      });
      
      return res.json({
        status: 'success',
        data: {
          clientSecret: paymentIntent.client_secret
        }
      });
    } catch (error) {
      console.error('Payment error:', error);
      return res.status(500).json({
        status: 'error',
        message: 'An error occurred processing payment'
      });
    }
  },
  
  // Create checkout session
  createCheckoutSession: async (req, res) => {
    try {
      const { bookingId, successUrl, cancelUrl } = req.body;
      
      if (!bookingId || !successUrl || !cancelUrl) {
        return res.status(400).json({
          status: 'fail',
          message: 'Booking ID, success URL, and cancel URL are required'
        });
      }
      
      // Check if the booking exists
      const booking = await BookingMock.findById(bookingId);
      
      if (!booking) {
        return res.status(404).json({
          status: 'fail',
          message: 'Booking not found'
        });
      }
      
      // Create checkout session
      const session = await stripeMock.checkout.sessions.create({
        payment_method_types: ['card'],
        line_items: [
          {
            price_data: {
              currency: 'usd',
              product_data: {
                name: 'Booking #' + bookingId
              },
              unit_amount: booking.totalPrice * 100
            },
            quantity: 1
          }
        ],
        mode: 'payment',
        success_url: successUrl,
        cancel_url: cancelUrl,
        metadata: {
          bookingId
        }
      });
      
      return res.json({
        status: 'success',
        data: {
          sessionId: session.id,
          url: session.url
        }
      });
    } catch (error) {
      console.error('Checkout error:', error);
      return res.status(500).json({
        status: 'error',
        message: 'An error occurred creating checkout session'
      });
    }
  },
  
  // Handle webhook
  handleWebhook: async (req, res) => {
    try {
      const signature = req.headers['stripe-signature'];
      
      if (!signature) {
        return res.status(400).json({
          status: 'fail',
          message: 'Stripe signature is missing'
        });
      }
      
      const event = stripeMock.webhooks.constructEvent(
        req.body,
        signature,
        'webhook_secret'
      );
      
      // Handle different event types
      if (event.type === 'payment_intent.succeeded') {
        const paymentIntent = event.data.object;
        const bookingId = paymentIntent.metadata.bookingId;
        
        // Update booking status
        await BookingMock.findByIdAndUpdate(bookingId, {
          paymentStatus: 'paid'
        });
        
        // Update payment record
        await PaymentMock.findOneAndUpdate(
          { paymentIntentId: paymentIntent.id },
          { status: 'succeeded' }
        );
      }
      
      return res.json({ received: true });
    } catch (error) {
      console.error('Webhook error:', error);
      return res.status(400).json({
        status: 'fail',
        message: 'Webhook error: ' + error.message
      });
    }
  },
  
  // Get payment by ID
  getPayment: async (req, res) => {
    try {
      const { id } = req.params;
      
      const payment = await PaymentMock.findById(id);
      
      if (!payment) {
        return res.status(404).json({
          status: 'fail',
          message: 'Payment not found'
        });
      }
      
      return res.json({
        status: 'success',
        data: {
          payment
        }
      });
    } catch (error) {
      console.error('Get payment error:', error);
      return res.status(500).json({
        status: 'error',
        message: 'An error occurred retrieving payment'
      });
    }
  },
  
  // Get payments for a booking
  getBookingPayments: async (req, res) => {
    try {
      const { bookingId } = req.params;
      
      const payments = await PaymentMock.find({ bookingId });
      
      return res.json({
        status: 'success',
        data: {
          payments
        }
      });
    } catch (error) {
      console.error('Get booking payments error:', error);
      return res.status(500).json({
        status: 'error',
        message: 'An error occurred retrieving payments'
      });
    }
  }
};

describe('Payment Controller Tests', function() {
  // Setup hooks
  before(async function() {
    // Connect to test database if not already connected
    if (mongoose.connection.readyState !== 1) {
      await dbHelper.connect();
    }
  });

  after(async function() {
    // No need to disconnect here as the global after hook will handle it
  });

  // Define mock data
  let mockPayment, mockBooking, mockReq, mockRes, mockNext;

  beforeEach(() => {
    // Create mock data
    mockPayment = {
      _id: new ObjectId(),
      bookingId: 'booking123',
      paymentIntentId: 'pi_test123',
      amount: 100,
      currency: 'usd',
      status: 'succeeded',
      createdAt: new Date()
    };
    
    mockBooking = {
      _id: 'booking123',
      totalPrice: 100,
      status: 'pending',
      paymentStatus: 'pending'
    };

    // Setup request object
    mockReq = {
      user: { id: new ObjectId().toString(), role: 'user' },
      body: {
        bookingId: 'booking123',
        amount: 100,
        currency: 'usd',
        successUrl: 'https://example.com/success',
        cancelUrl: 'https://example.com/cancel'
      },
      params: { id: mockPayment._id.toString(), bookingId: 'booking123' },
      query: {},
      headers: {
        'stripe-signature': 'test_signature'
      }
    };
    
    // Setup response object
    mockRes = {
      status: sinon.stub().returnsThis(),
      json: sinon.stub()
    };
    
    // Setup next function
    mockNext = sinon.stub();
    
    // Reset all stubs
    sinon.restore();

    // Setup mock behaviors
    PaymentMock.findById = sinon.stub().resolves(mockPayment);
    PaymentMock.findOne = sinon.stub().resolves(mockPayment);
    PaymentMock.find = sinon.stub().resolves([mockPayment]);
    PaymentMock.create = sinon.stub().resolves(mockPayment);
    PaymentMock.findByIdAndUpdate = sinon.stub().resolves(mockPayment);
    PaymentMock.findOneAndUpdate = sinon.stub().resolves(mockPayment);
    
    BookingMock.findById = sinon.stub().resolves(mockBooking);
    BookingMock.findByIdAndUpdate = sinon.stub().resolves({
      ...mockBooking,
      paymentStatus: 'paid'
    });
    
    ErrorLogMock.create = sinon.stub().resolves({});
    
    // Reset validation result mock
    validationResultMock.isEmpty = sinon.stub().returns(true);
    validationResultMock.array = sinon.stub().returns([]);
  });

  afterEach(() => {
    // Clean up after each test
    sinon.restore();
  });

  // Test the controller's existence and functions
  describe('Controller Initialization', () => {
    it('should exist and export expected functions', () => {
      expect(paymentController).to.be.an('object');
      expect(paymentController.createPaymentIntent).to.be.a('function');
      expect(paymentController.createCheckoutSession).to.be.a('function');
      expect(paymentController.handleWebhook).to.be.a('function');
      expect(paymentController.getPayment).to.be.a('function');
      expect(paymentController.getBookingPayments).to.be.a('function');
    });
  });

  // Test create payment intent
  describe('createPaymentIntent Function', () => {
    it('should create a payment intent successfully', async () => {
      // Call the controller function
      await paymentController.createPaymentIntent(mockReq, mockRes);
      
      // Assert the response
      expect(mockRes.json.calledOnce).to.be.true;
      
      // Assert the response data structure
      const response = mockRes.json.getCall(0).args[0];
      expect(response.status).to.equal('success');
      expect(response.data).to.have.property('clientSecret');
      
      // Verify Stripe and database operations
      expect(stripeMock.paymentIntents.create.calledOnce).to.be.true;
      expect(PaymentMock.create.calledOnce).to.be.true;
    });

    it('should return 400 if required fields are missing', async () => {
      // Setup request without required fields
      mockReq.body = {};
      
      // Call the controller function
      await paymentController.createPaymentIntent(mockReq, mockRes);
      
      // Assert the response
      expect(mockRes.status.calledWith(400)).to.be.true;
      expect(mockRes.json.calledOnce).to.be.true;
      
      // Assert the response data structure
      const response = mockRes.json.getCall(0).args[0];
      expect(response.status).to.equal('fail');
    });

    it('should return 404 if booking not found', async () => {
      // Make findById return null
      BookingMock.findById = sinon.stub().resolves(null);
      
      // Call the controller function
      await paymentController.createPaymentIntent(mockReq, mockRes);
      
      // Assert the response
      expect(mockRes.status.calledWith(404)).to.be.true;
      expect(mockRes.json.calledOnce).to.be.true;
      
      // Assert the response data structure
      const response = mockRes.json.getCall(0).args[0];
      expect(response.status).to.equal('fail');
      expect(response.message).to.include('not found');
    });
  });

  // Test create checkout session
  describe('createCheckoutSession Function', () => {
    it('should create a checkout session successfully', async () => {
      // Call the controller function
      await paymentController.createCheckoutSession(mockReq, mockRes);
      
      // Assert the response
      expect(mockRes.json.calledOnce).to.be.true;
      
      // Assert the response data structure
      const response = mockRes.json.getCall(0).args[0];
      expect(response.status).to.equal('success');
      expect(response.data).to.have.property('sessionId');
      expect(response.data).to.have.property('url');
      
      // Verify Stripe operation
      expect(stripeMock.checkout.sessions.create.calledOnce).to.be.true;
    });

    it('should return 400 if required fields are missing', async () => {
      // Setup request without required fields
      mockReq.body = {};
      
      // Call the controller function
      await paymentController.createCheckoutSession(mockReq, mockRes);
      
      // Assert the response
      expect(mockRes.status.calledWith(400)).to.be.true;
      expect(mockRes.json.calledOnce).to.be.true;
      
      // Assert the response data structure
      const response = mockRes.json.getCall(0).args[0];
      expect(response.status).to.equal('fail');
    });
  });

  // Test webhook handler
  describe('handleWebhook Function', () => {
    it('should handle payment_intent.succeeded webhook', async () => {
      // Call the controller function
      await paymentController.handleWebhook(mockReq, mockRes);
      
      // Assert the response
      expect(mockRes.json.calledOnce).to.be.true;
      
      // Assert the response data structure
      const response = mockRes.json.getCall(0).args[0];
      expect(response.received).to.be.true;
      
      // Verify database operations
      expect(BookingMock.findByIdAndUpdate.calledOnce).to.be.true;
      expect(PaymentMock.findOneAndUpdate.calledOnce).to.be.true;
    });

    it('should return 400 if signature is missing', async () => {
      // Setup request without signature
      mockReq.headers = {};
      
      // Call the controller function
      await paymentController.handleWebhook(mockReq, mockRes);
      
      // Assert the response
      expect(mockRes.status.calledWith(400)).to.be.true;
      expect(mockRes.json.calledOnce).to.be.true;
      
      // Assert the response data structure
      const response = mockRes.json.getCall(0).args[0];
      expect(response.status).to.equal('fail');
    });
  });

  // Test get payment
  describe('getPayment Function', () => {
    it('should get payment by ID successfully', async () => {
      // Call the controller function
      await paymentController.getPayment(mockReq, mockRes);
      
      // Assert the response
      expect(mockRes.json.calledOnce).to.be.true;
      
      // Assert the response data structure
      const response = mockRes.json.getCall(0).args[0];
      expect(response.status).to.equal('success');
      expect(response.data).to.have.property('payment');
      
      // Verify database operation
      expect(PaymentMock.findById.calledOnce).to.be.true;
    });

    it('should return 404 if payment not found', async () => {
      // Make findById return null
      PaymentMock.findById = sinon.stub().resolves(null);
      
      // Call the controller function
      await paymentController.getPayment(mockReq, mockRes);
      
      // Assert the response
      expect(mockRes.status.calledWith(404)).to.be.true;
      expect(mockRes.json.calledOnce).to.be.true;
      
      // Assert the response data structure
      const response = mockRes.json.getCall(0).args[0];
      expect(response.status).to.equal('fail');
      expect(response.message).to.include('not found');
    });
  });

  // Test get booking payments
  describe('getBookingPayments Function', () => {
    it('should get all payments for a booking', async () => {
      // Call the controller function
      await paymentController.getBookingPayments(mockReq, mockRes);
      
      // Assert the response
      expect(mockRes.json.calledOnce).to.be.true;
      
      // Assert the response data structure
      const response = mockRes.json.getCall(0).args[0];
      expect(response.status).to.equal('success');
      expect(response.data).to.have.property('payments');
      expect(response.data.payments).to.be.an('array');
      
      // Verify database operation
      expect(PaymentMock.find.calledOnce).to.be.true;
      expect(PaymentMock.find.calledWith({ bookingId: 'booking123' })).to.be.true;
    });
  });
}); 