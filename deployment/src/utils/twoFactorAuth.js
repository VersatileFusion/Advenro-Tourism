const speakeasy = require('speakeasy');
const qrcode = require('qrcode');

// Generate secret for 2FA
exports.generateSecret = (email) => {
    const secret = speakeasy.generateSecret({
        name: `Tourism App (${email})`
    });
    return {
        ascii: secret.ascii,
        hex: secret.hex,
        base32: secret.base32,
        otpauth_url: secret.otpauth_url
    };
};

// Generate QR code for 2FA setup
exports.generateQRCode = async (otpauth_url) => {
    try {
        const qrCodeUrl = await qrcode.toDataURL(otpauth_url);
        return qrCodeUrl;
    } catch (error) {
        throw new Error('Error generating QR code');
    }
};

// Verify 2FA token
exports.verifyToken = (token, secret) => {
    return speakeasy.totp.verify({
        secret: secret,
        encoding: 'base32',
        token: token,
        window: 1 // Allow 30 seconds clock drift
    });
}; 