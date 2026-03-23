"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const bcrypt_1 = __importDefault(require("bcrypt"));
const zod_1 = require("zod");
const prisma_1 = require("../lib/prisma");
const auth_1 = require("../middleware/auth");
const router = (0, express_1.Router)();
const authSchema = zod_1.z.object({
    email: zod_1.z.string().email(),
    username: zod_1.z.string().min(3).max(24).regex(/^[a-zA-Z0-9_]+$/).optional(),
    password: zod_1.z.string().min(8),
});
router.post('/register', async (request, response) => {
    const parsed = authSchema.safeParse(request.body);
    if (!parsed.success || !parsed.data.username) {
        response.status(400).json({ error: 'Invalid registration payload' });
        return;
    }
    const { email, username, password } = parsed.data;
    const existing = await prisma_1.prisma.user.findFirst({
        where: {
            OR: [{ email }, { username }],
        },
    });
    if (existing) {
        response.status(409).json({ error: 'User already exists' });
        return;
    }
    const passwordHash = await bcrypt_1.default.hash(password, 10);
    const user = await prisma_1.prisma.user.create({
        data: {
            email,
            username,
            passwordHash,
        },
    });
    const token = (0, auth_1.signAuthToken)({
        id: user.id,
        email: user.email,
        username: user.username,
    });
    response.status(201).json({
        token,
        user: {
            id: user.id,
            email: user.email,
            username: user.username,
        },
    });
});
router.post('/login', async (request, response) => {
    const parsed = authSchema.omit({ username: true }).safeParse(request.body);
    if (!parsed.success) {
        response.status(400).json({ error: 'Invalid login payload' });
        return;
    }
    const { email, password } = parsed.data;
    const user = await prisma_1.prisma.user.findUnique({
        where: { email },
    });
    if (!user) {
        response.status(401).json({ error: 'Invalid credentials' });
        return;
    }
    const isValid = await bcrypt_1.default.compare(password, user.passwordHash);
    if (!isValid) {
        response.status(401).json({ error: 'Invalid credentials' });
        return;
    }
    const token = (0, auth_1.signAuthToken)({
        id: user.id,
        email: user.email,
        username: user.username,
    });
    response.json({
        token,
        user: {
            id: user.id,
            email: user.email,
            username: user.username,
        },
    });
});
router.get('/me', auth_1.authMiddleware, async (request, response) => {
    const user = await prisma_1.prisma.user.findUnique({
        where: { id: request.user.id },
        select: {
            id: true,
            email: true,
            username: true,
            createdAt: true,
        },
    });
    if (!user) {
        response.status(404).json({ error: 'User not found' });
        return;
    }
    response.json({ user });
});
exports.default = router;
