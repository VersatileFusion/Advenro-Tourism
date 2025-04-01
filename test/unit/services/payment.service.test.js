const { expect } = require('chai');
const sinon = require('sinon');
const proxyquire = require('proxyquire');
const stripe = require('stripe');

describe('Payment Service Tests', () => {
  let paymentService;
  let stripeStub;

  beforeEach(() => {
    // Create stubs for stripe
    stripeStub = {
      paymentIntents: {
        create: sinon.stub(),
        retrieve: sinon.stub(),
        update: sinon.stub(),
        cancel: sinon.stub()
      },
      refunds: {
        create: sinon.stub()
      }
    };

    // Proxyquire the payment service with stubs
    paymentService = proxyquire('../../../src/services/payment.service', {
      'stripe': () => stripeStub
    });
  });

  afterEach(() => {
    sinon.restore();
  });

  describe('createPaymentIntent', () => {
    it('should create a payment intent successfully', async () => {
      const mockPaymentIntent = {
        id: 'pi_123',
        amount: 1000,
        currency: 'usd',
        status: 'requires_payment_method'
      };

      stripeStub.paymentIntents.create.resolves(mockPaymentIntent);

      const result = await paymentService.createPaymentIntent({
        amount: 1000,
        currency: 'usd'
      });

      expect(result).to.deep.equal(mockPaymentIntent);
      expect(stripeStub.paymentIntents.create.calledOnce).to.be.true;
    });

    it('should handle payment intent creation errors', async () => {
      const error = new Error('Payment failed');
      stripeStub.paymentIntents.create.rejects(error);

      try {
        await paymentService.createPaymentIntent({
          amount: 1000,
          currency: 'usd'
        });
        expect.fail('Should have thrown an error');
      } catch (err) {
        expect(err).to.equal(error);
      }
    });
  });

  describe('retrievePaymentIntent', () => {
    it('should retrieve a payment intent successfully', async () => {
      const mockPaymentIntent = {
        id: 'pi_123',
        amount: 1000,
        status: 'succeeded'
      };

      stripeStub.paymentIntents.retrieve.resolves(mockPaymentIntent);

      const result = await paymentService.retrievePaymentIntent('pi_123');

      expect(result).to.deep.equal(mockPaymentIntent);
      expect(stripeStub.paymentIntents.retrieve.calledOnce).to.be.true;
    });

    it('should handle payment intent retrieval errors', async () => {
      const error = new Error('Payment intent not found');
      stripeStub.paymentIntents.retrieve.rejects(error);

      try {
        await paymentService.retrievePaymentIntent('pi_123');
        expect.fail('Should have thrown an error');
      } catch (err) {
        expect(err).to.equal(error);
      }
    });
  });

  describe('processRefund', () => {
    it('should process a refund successfully', async () => {
      const mockRefund = {
        id: 're_123',
        amount: 1000,
        status: 'succeeded'
      };

      stripeStub.refunds.create.resolves(mockRefund);

      const result = await paymentService.processRefund({
        payment_intent: 'pi_123',
        amount: 1000
      });

      expect(result).to.deep.equal(mockRefund);
      expect(stripeStub.refunds.create.calledOnce).to.be.true;
    });

    it('should handle refund processing errors', async () => {
      const error = new Error('Refund failed');
      stripeStub.refunds.create.rejects(error);

      try {
        await paymentService.processRefund({
          payment_intent: 'pi_123',
          amount: 1000
        });
        expect.fail('Should have thrown an error');
      } catch (err) {
        expect(err).to.equal(error);
      }
    });
  });
}); 