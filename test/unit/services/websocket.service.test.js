const { expect } = require('chai');
const sinon = require('sinon');
const proxyquire = require('proxyquire');
const WebSocket = require('ws');

describe('WebSocket Service Tests', () => {
  let websocketService;
  let mockWebSocket;
  let mockServer;

  beforeEach(() => {
    mockWebSocket = {
      on: sinon.stub(),
      send: sinon.stub(),
      ping: sinon.stub(),
      terminate: sinon.stub()
    };

    mockServer = {
      on: sinon.stub(),
      emit: sinon.stub(),
      clients: new Set()
    };

    // Proxyquire the websocket service with mocks
    websocketService = proxyquire('../../../src/services/websocket.service', {
      'ws': {
        Server: sinon.stub().returns(mockServer)
      }
    });
  });

  afterEach(() => {
    sinon.restore();
  });

  describe('initialize', () => {
    it('should initialize WebSocket server', () => {
      const port = 8080;
      websocketService.initialize(port);

      expect(mockServer.on.calledWith('connection')).to.be.true;
      expect(mockServer.on.calledWith('error')).to.be.true;
    });

    it('should handle server initialization errors', () => {
      const error = new Error('Server initialization failed');
      mockServer.on.withArgs('error').callsFake((event, callback) => {
        callback(error);
      });

      try {
        websocketService.initialize(8080);
        expect.fail('Should have thrown an error');
      } catch (err) {
        expect(err).to.equal(error);
      }
    });
  });

  describe('handleConnection', () => {
    it('should handle new client connection', () => {
      const client = { ...mockWebSocket };
      mockServer.clients.add(client);

      websocketService.handleConnection(client);

      expect(client.on.calledWith('message')).to.be.true;
      expect(client.on.calledWith('close')).to.be.true;
      expect(client.on.calledWith('error')).to.be.true;
      expect(client.on.calledWith('ping')).to.be.true;
    });

    it('should handle client disconnection', () => {
      const client = { ...mockWebSocket };
      mockServer.clients.add(client);

      websocketService.handleConnection(client);
      client.on.withArgs('close').callsFake((event, callback) => {
        callback();
      });

      expect(mockServer.clients.has(client)).to.be.false;
    });

    it('should handle client errors', () => {
      const client = { ...mockWebSocket };
      const error = new Error('Client error');
      mockServer.clients.add(client);

      websocketService.handleConnection(client);
      client.on.withArgs('error').callsFake((event, callback) => {
        callback(error);
      });

      expect(client.terminate.calledOnce).to.be.true;
      expect(mockServer.clients.has(client)).to.be.false;
    });
  });

  describe('broadcast', () => {
    it('should broadcast message to all connected clients', () => {
      const client1 = { ...mockWebSocket };
      const client2 = { ...mockWebSocket };
      mockServer.clients.add(client1);
      mockServer.clients.add(client2);

      const message = { type: 'notification', data: 'Test message' };
      websocketService.broadcast(message);

      expect(client1.send.calledWith(JSON.stringify(message))).to.be.true;
      expect(client2.send.calledWith(JSON.stringify(message))).to.be.true;
    });

    it('should handle client send errors', () => {
      const client = { ...mockWebSocket };
      const error = new Error('Send failed');
      client.send.throws(error);
      mockServer.clients.add(client);

      const message = { type: 'notification', data: 'Test message' };
      websocketService.broadcast(message);

      expect(client.terminate.calledOnce).to.be.true;
      expect(mockServer.clients.has(client)).to.be.false;
    });
  });

  describe('sendToClient', () => {
    it('should send message to specific client', () => {
      const client = { ...mockWebSocket };
      const message = { type: 'notification', data: 'Test message' };

      websocketService.sendToClient(client, message);

      expect(client.send.calledWith(JSON.stringify(message))).to.be.true;
    });

    it('should handle send errors', () => {
      const client = { ...mockWebSocket };
      const error = new Error('Send failed');
      client.send.throws(error);

      const message = { type: 'notification', data: 'Test message' };
      websocketService.sendToClient(client, message);

      expect(client.terminate.calledOnce).to.be.true;
    });
  });

  describe('handleMessage', () => {
    it('should handle incoming messages', () => {
      const client = { ...mockWebSocket };
      const message = {
        type: 'chat',
        data: 'Hello, World!'
      };

      websocketService.handleMessage(client, JSON.stringify(message));

      expect(mockServer.emit.calledWith('message', {
        client,
        message
      })).to.be.true;
    });

    it('should handle invalid JSON messages', () => {
      const client = { ...mockWebSocket };
      const invalidMessage = 'Invalid JSON';

      websocketService.handleMessage(client, invalidMessage);

      expect(client.send.calledWith(JSON.stringify({
        type: 'error',
        data: 'Invalid message format'
      }))).to.be.true;
    });

    it('should handle message processing errors', () => {
      const client = { ...mockWebSocket };
      const message = {
        type: 'chat',
        data: 'Hello, World!'
      };

      mockServer.emit.throws(new Error('Processing failed'));

      websocketService.handleMessage(client, JSON.stringify(message));

      expect(client.send.calledWith(JSON.stringify({
        type: 'error',
        data: 'Failed to process message'
      }))).to.be.true;
    });
  });
}); 