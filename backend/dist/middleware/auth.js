"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.signAuthToken = signAuthToken;
exports.extractUserFromAuthHeader = extractUserFromAuthHeader;
exports.authMiddleware = authMiddleware;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
function getJwtSecret() {
    return process.env.JWT_SECRET || 'your-secret-key-here';
}
function signAuthToken(payload) {
    return jsonwebtoken_1.default.sign(payload, getJwtSecret(), { expiresIn: '7d' });
}
function extractUserFromAuthHeader(request) {
    const authorization = request.header('Authorization');
    if (!authorization?.startsWith('Bearer ')) {
        return null;
    }
    const token = authorization.slice('Bearer '.length).trim();
    if (!token) {
        return null;
    }
    try {
        return jsonwebtoken_1.default.verify(token, getJwtSecret());
    }
    catch {
        return null;
    }
}
function authMiddleware(request, response, next) {
    const user = extractUserFromAuthHeader(request);
    if (!user) {
        response.status(401).json({ error: 'Unauthorized' });
        return;
    }
    request.user = {
        id: user.id,
        email: user.email,
        username: user.username,
    };
    next();
}
