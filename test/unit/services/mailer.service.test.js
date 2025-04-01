const { expect } = require('chai');
const sinon = require('sinon');
const proxyquire = require('proxyquire');
const nodemailer = require('nodemailer');

describe('Mailer Service Tests', () => {
  let mailerService;
  let nodemailerStub;

  beforeEach(() => {
    // Create stubs for nodemailer
    nodemailerStub = {
      createTransport: sinon.stub().returns({
        sendMail: sinon.stub()
      })
    };

    // Proxyquire the mailer service with stubs
    mailerService = proxyquire('../../../src/services/mailer.service', {
      'nodemailer': nodemailerStub
    });
  });

  afterEach(() => {
    sinon.restore();
  });

  describe('sendEmail', () => {
    it('should send an email successfully', async () => {
      const mockEmailOptions = {
        to: 'test@example.com',
        subject: 'Test Email',
        text: 'This is a test email'
      };

      const mockResult = {
        messageId: '123',
        response: 'OK'
      };

      nodemailerStub.createTransport().sendMail.resolves(mockResult);

      const result = await mailerService.sendEmail(mockEmailOptions);

      expect(result).to.deep.equal(mockResult);
      expect(nodemailerStub.createTransport().sendMail.calledOnce).to.be.true;
    });

    it('should handle email sending errors', async () => {
      const error = new Error('Failed to send email');
      nodemailerStub.createTransport().sendMail.rejects(error);

      try {
        await mailerService.sendEmail({
          to: 'test@example.com',
          subject: 'Test Email',
          text: 'This is a test email'
        });
        expect.fail('Should have thrown an error');
      } catch (err) {
        expect(err).to.equal(error);
      }
    });
  });

  describe('sendTemplatedEmail', () => {
    it('should send a templated email successfully', async () => {
      const mockTemplateData = {
        name: 'John Doe',
        bookingId: '12345'
      };

      const mockResult = {
        messageId: '123',
        response: 'OK'
      };

      nodemailerStub.createTransport().sendMail.resolves(mockResult);

      const result = await mailerService.sendTemplatedEmail(
        'booking-confirmation',
        'test@example.com',
        mockTemplateData
      );

      expect(result).to.deep.equal(mockResult);
      expect(nodemailerStub.createTransport().sendMail.calledOnce).to.be.true;
    });

    it('should handle template rendering errors', async () => {
      const error = new Error('Template not found');
      nodemailerStub.createTransport().sendMail.rejects(error);

      try {
        await mailerService.sendTemplatedEmail(
          'non-existent-template',
          'test@example.com',
          {}
        );
        expect.fail('Should have thrown an error');
      } catch (err) {
        expect(err).to.equal(error);
      }
    });
  });

  describe('sendBulkEmails', () => {
    it('should send multiple emails successfully', async () => {
      const mockRecipients = [
        'test1@example.com',
        'test2@example.com'
      ];

      const mockResults = [
        { messageId: '123', response: 'OK' },
        { messageId: '124', response: 'OK' }
      ];

      nodemailerStub.createTransport().sendMail
        .resolves(mockResults[0])
        .resolves(mockResults[1]);

      const result = await mailerService.sendBulkEmails(
        mockRecipients,
        'Test Subject',
        'Test Content'
      );

      expect(result).to.deep.equal(mockResults);
      expect(nodemailerStub.createTransport().sendMail.callCount).to.equal(2);
    });

    it('should handle partial failures in bulk sending', async () => {
      const mockRecipients = [
        'test1@example.com',
        'test2@example.com',
        'test3@example.com'
      ];

      const mockResults = [
        { messageId: '123', response: 'OK' },
        new Error('Failed to send'),
        { messageId: '125', response: 'OK' }
      ];

      nodemailerStub.createTransport().sendMail
        .resolves(mockResults[0])
        .rejects(mockResults[1])
        .resolves(mockResults[2]);

      const result = await mailerService.sendBulkEmails(
        mockRecipients,
        'Test Subject',
        'Test Content'
      );

      expect(result).to.have.lengthOf(3);
      expect(result[0]).to.deep.equal(mockResults[0]);
      expect(result[1]).to.be.instanceOf(Error);
      expect(result[2]).to.deep.equal(mockResults[2]);
    });
  });
}); 