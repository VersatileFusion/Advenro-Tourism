const WebSocket = require('ws');
const jwt = require('jsonwebtoken');
const { promisify } = require('util');

class WebSocketService {
    constructor(server) {
        this.wss = new WebSocket.Server({ server });
        this.clients = new Map(); // userId -> WebSocket
        this.setupWebSocket();
    }

    setupWebSocket() {
        this.wss.on('connection', async (ws, req) => {
            try {
                // Extract token from query string
                const token = new URL(req.url, 'ws://localhost').searchParams.get('token');
                if (!token) {
                    ws.close(4001, 'Authentication required');
                    return;
                }

                // Verify token
                const decoded = await promisify(jwt.verify)(
                    token,
                    process.env.JWT_SECRET
                );

                const userId = decoded.id;
                this.clients.set(userId, ws);

                // Set up heartbeat
                ws.isAlive = true;
                ws.on('pong', () => { ws.isAlive = true; });

                // Handle incoming messages
                ws.on('message', async (data) => {
                    try {
                        const message = JSON.parse(data);
                        await this.handleMessage(userId, message);
                    } catch (error) {
                        console.error('WebSocket message handling error:', error);
                        this.sendToClient(userId, {
                            type: 'error',
                            message: 'Invalid message format'
                        });
                    }
                });

                // Handle client disconnect
                ws.on('close', () => {
                    this.clients.delete(userId);
                });

                // Send welcome message
                this.sendToClient(userId, {
                    type: 'connection',
                    message: 'Connected to WebSocket server'
                });

            } catch (error) {
                console.error('WebSocket connection error:', error);
                ws.close(4002, 'Authentication failed');
            }
        });

        // Set up heartbeat interval
        this.heartbeat = setInterval(() => {
            this.wss.clients.forEach((ws) => {
                if (ws.isAlive === false) {
                    return ws.terminate();
                }
                ws.isAlive = false;
                ws.ping();
            });
        }, 30000);
    }

    async handleMessage(userId, message) {
        switch (message.type) {
            case 'subscribe':
                await this.handleSubscribe(userId, message);
                break;
            case 'unsubscribe':
                await this.handleUnsubscribe(userId, message);
                break;
            default:
                this.sendToClient(userId, {
                    type: 'error',
                    message: 'Unknown message type'
                });
        }
    }

    async handleSubscribe(userId, message) {
        // Handle subscription logic
        this.sendToClient(userId, {
            type: 'subscribed',
            channel: message.channel
        });
    }

    async handleUnsubscribe(userId, message) {
        // Handle unsubscription logic
        this.sendToClient(userId, {
            type: 'unsubscribed',
            channel: message.channel
        });
    }

    sendToClient(userId, data) {
        const client = this.clients.get(userId);
        if (client && client.readyState === WebSocket.OPEN) {
            client.send(JSON.stringify(data));
        }
    }

    broadcastToAll(data, excludeUserId = null) {
        this.clients.forEach((client, userId) => {
            if (userId !== excludeUserId && client.readyState === WebSocket.OPEN) {
                client.send(JSON.stringify(data));
            }
        });
    }

    sendToUsers(userIds, data) {
        userIds.forEach(userId => {
            this.sendToClient(userId, data);
        });
    }

    notifyBookingUpdate(userId, booking) {
        this.sendToClient(userId, {
            type: 'booking_update',
            data: booking
        });
    }

    notifyPaymentStatus(userId, payment) {
        this.sendToClient(userId, {
            type: 'payment_status',
            data: payment
        });
    }

    notifyTourUpdate(tourId, update) {
        // Broadcast tour updates to all connected clients
        this.broadcastToAll({
            type: 'tour_update',
            tourId,
            data: update
        });
    }

    cleanup() {
        clearInterval(this.heartbeat);
        this.wss.close();
    }
}

module.exports = WebSocketService; 