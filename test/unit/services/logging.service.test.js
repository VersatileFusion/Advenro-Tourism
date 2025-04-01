const { expect } = require('chai');
const sinon = require('sinon');
const proxyquire = require('proxyquire');
const winston = require('winston');

describe('Logging Service Tests', () => {
  let loggingService;
  let mockLogger;

  beforeEach(() => {
    mockLogger = {
      info: sinon.stub(),
      error: sinon.stub(),
      warn: sinon.stub(),
      debug: sinon.stub(),
      log: sinon.stub()
    };

    // Proxyquire the logging service with mocks
    loggingService = proxyquire('../../../src/services/logging.service', {
      'winston': {
        createLogger: sinon.stub().returns(mockLogger)
      }
    });
  });

  afterEach(() => {
    sinon.restore();
  });

  describe('info', () => {
    it('should log info messages', () => {
      const message = 'Test info message';
      const meta = { userId: '123' };

      loggingService.info(message, meta);

      expect(mockLogger.info.calledWith(message, meta)).to.be.true;
    });

    it('should handle info logging without metadata', () => {
      const message = 'Test info message';

      loggingService.info(message);

      expect(mockLogger.info.calledWith(message)).to.be.true;
    });
  });

  describe('error', () => {
    it('should log error messages', () => {
      const message = 'Test error message';
      const error = new Error('Test error');
      const meta = { userId: '123' };

      loggingService.error(message, error, meta);

      expect(mockLogger.error.calledWith(message, {
        error: error.message,
        stack: error.stack,
        ...meta
      })).to.be.true;
    });

    it('should handle error logging without metadata', () => {
      const message = 'Test error message';
      const error = new Error('Test error');

      loggingService.error(message, error);

      expect(mockLogger.error.calledWith(message, {
        error: error.message,
        stack: error.stack
      })).to.be.true;
    });

    it('should handle error logging with string error', () => {
      const message = 'Test error message';
      const error = 'Test error string';
      const meta = { userId: '123' };

      loggingService.error(message, error, meta);

      expect(mockLogger.error.calledWith(message, {
        error: error,
        ...meta
      })).to.be.true;
    });
  });

  describe('warn', () => {
    it('should log warning messages', () => {
      const message = 'Test warning message';
      const meta = { userId: '123' };

      loggingService.warn(message, meta);

      expect(mockLogger.warn.calledWith(message, meta)).to.be.true;
    });

    it('should handle warning logging without metadata', () => {
      const message = 'Test warning message';

      loggingService.warn(message);

      expect(mockLogger.warn.calledWith(message)).to.be.true;
    });
  });

  describe('debug', () => {
    it('should log debug messages', () => {
      const message = 'Test debug message';
      const meta = { userId: '123' };

      loggingService.debug(message, meta);

      expect(mockLogger.debug.calledWith(message, meta)).to.be.true;
    });

    it('should handle debug logging without metadata', () => {
      const message = 'Test debug message';

      loggingService.debug(message);

      expect(mockLogger.debug.calledWith(message)).to.be.true;
    });
  });

  describe('log', () => {
    it('should log messages with custom level', () => {
      const level = 'custom';
      const message = 'Test custom message';
      const meta = { userId: '123' };

      loggingService.log(level, message, meta);

      expect(mockLogger.log.calledWith(level, message, meta)).to.be.true;
    });

    it('should handle custom logging without metadata', () => {
      const level = 'custom';
      const message = 'Test custom message';

      loggingService.log(level, message);

      expect(mockLogger.log.calledWith(level, message)).to.be.true;
    });
  });

  describe('request logging', () => {
    it('should log HTTP request details', () => {
      const req = {
        method: 'GET',
        url: '/api/test',
        ip: '127.0.0.1',
        headers: {
          'user-agent': 'test-agent'
        }
      };

      const res = {
        statusCode: 200
      };

      loggingService.logRequest(req, res);

      expect(mockLogger.info.called).to.be.true;
      const logCall = mockLogger.info.firstCall.args[0];
      expect(logCall).to.include('GET /api/test');
      expect(logCall).to.include('127.0.0.1');
      expect(logCall).to.include('200');
    });

    it('should handle request logging errors', () => {
      const req = {
        method: 'GET',
        url: '/api/test'
      };

      const res = {
        statusCode: 500
      };

      loggingService.logRequest(req, res);

      expect(mockLogger.error.called).to.be.true;
      const logCall = mockLogger.error.firstCall.args[0];
      expect(logCall).to.include('GET /api/test');
      expect(logCall).to.include('500');
    });
  });

  describe('performance logging', () => {
    it('should log performance metrics', () => {
      const metrics = {
        operation: 'test-operation',
        duration: 100,
        memory: 1024
      };

      loggingService.logPerformance(metrics);

      expect(mockLogger.info.called).to.be.true;
      const logCall = mockLogger.info.firstCall.args[0];
      expect(logCall).to.include('test-operation');
      expect(logCall).to.include('100ms');
      expect(logCall).to.include('1024MB');
    });

    it('should handle performance logging with custom threshold', () => {
      const metrics = {
        operation: 'test-operation',
        duration: 1000,
        memory: 2048
      };

      loggingService.logPerformance(metrics, 500);

      expect(mockLogger.warn.called).to.be.true;
      const logCall = mockLogger.warn.firstCall.args[0];
      expect(logCall).to.include('test-operation');
      expect(logCall).to.include('1000ms');
      expect(logCall).to.include('2048MB');
    });
  });
}); 