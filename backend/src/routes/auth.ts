/**
 * @openapi
 * components:
 *   schemas:
 *     User:
 *       type: object
 *       properties:
 *         id: { type: string }
 *         email: { type: string }
 *         username: { type: string }
 *         role: { type: string, enum: [USER, ADMIN] }
 *         createdAt: { type: string, format: date-time }
 *     AuthResponse:
 *       type: object
 *       properties:
 *         token: { type: string }
 *         user: { $ref: '#/components/schemas/User' }
 *   securitySchemes:
 *     bearerAuth:
 *       type: http
 *       scheme: bearer
 *       bearerFormat: JWT
 */

import crypto from "crypto";
import { Router } from "express";
import rateLimit from "express-rate-limit";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { z } from "zod";
import passport from "passport";
import { prisma } from "../lib/prisma";
import { authMiddleware, signAuthToken } from "../middleware/auth";
import { sendPasswordResetEmail } from "../services/email";

const router = Router();

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Too many requests. Try again later." },
});

router.use(authLimiter);

const authSchema = z.object({
  email: z.string().email(),
  username: z
    .string()
    .min(3)
    .max(24)
    .regex(/^[a-zA-Z0-9_]+$/)
    .optional(),
  password: z.string().min(8),
});

/**
 * @openapi
 * /api/auth/register:
 *   post:
 *     tags: [Auth]
 *     summary: Create a new account
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email, username, password]
 *             properties:
 *               email: { type: string, format: email }
 *               username: { type: string, minLength: 3 }
 *               password: { type: string, minLength: 8 }
 *     responses:
 *       201:
 *         description: Account created
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/AuthResponse' }
 *       400: { description: Invalid payload }
 *       409: { description: User already exists }
 */
router.post("/register", async (request, response) => {
  const parsed = authSchema.safeParse(request.body);

  if (!parsed.success || !parsed.data.username) {
    response.status(400).json({ error: "Invalid registration payload" });
    return;
  }

  const { email, username, password } = parsed.data;

  const existing = await prisma.user.findFirst({
    where: {
      OR: [{ email }, { username }],
    },
  });

  if (existing) {
    response.status(409).json({ error: "User already exists" });
    return;
  }

  const passwordHash = await bcrypt.hash(password, 10);

  const user = await prisma.user.create({
    data: {
      email,
      username,
      passwordHash,
    },
  });

  const token = signAuthToken({
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

/**
 * @openapi
 * /api/auth/login:
 *   post:
 *     tags: [Auth]
 *     summary: Sign in with email and password
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email, password]
 *             properties:
 *               email: { type: string, format: email }
 *               password: { type: string }
 *     responses:
 *       200:
 *         description: Login successful
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/AuthResponse' }
 *       400: { description: Invalid payload }
 *       401: { description: Invalid credentials }
 */
router.post("/login", async (request, response) => {
  const parsed = authSchema.omit({ username: true }).safeParse(request.body);

  if (!parsed.success) {
    response.status(400).json({ error: "Invalid login payload" });
    return;
  }

  const { email, password } = parsed.data;

  const user = await prisma.user.findUnique({
    where: { email },
  });

  if (!user) {
    response.status(401).json({ error: "Invalid credentials" });
    return;
  }

  const isValid = await bcrypt.compare(password, user.passwordHash);

  if (!isValid) {
    response.status(401).json({ error: "Invalid credentials" });
    return;
  }

  const token = signAuthToken({
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

/**
 * @openapi
 * /api/auth/me:
 *   get:
 *     tags: [Auth]
 *     summary: Get current user profile
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: User profile
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 user: { $ref: '#/components/schemas/User' }
 *       401: { description: Unauthorized }
 */
router.get("/me", authMiddleware, async (request, response) => {
  const user = await prisma.user.findUnique({
    where: { id: request.user!.id },
    select: {
      id: true,
      email: true,
      username: true,
      role: true,
      createdAt: true,
    },
  });

  if (!user) {
    response.status(404).json({ error: "User not found" });
    return;
  }

  response.json({ user });
});

/**
 * @openapi
 * /api/auth/refresh:
 *   post:
 *     tags: [Auth]
 *     summary: Refresh JWT token
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: New token issued
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 token: { type: string }
 *       401: { description: Unauthorized }
 */
router.post("/refresh", authMiddleware, async (request, response) => {
  const token = signAuthToken({
    id: request.user!.id,
    email: request.user!.email,
    username: request.user!.username,
  });

  response.json({ token });
});

function getJwtSecret(): string {
  const secret = process.env.JWT_SECRET;
  if (!secret) throw new Error("JWT_SECRET is not set");
  return secret;
}

function oauthRedirect(user: Express.User) {
  const token = jwt.sign(
    { id: user.id, email: user.email, username: user.username },
    getJwtSecret(),
    { expiresIn: "7d" },
  );
  return `${process.env.CORS_ORIGIN || "http://localhost:5173"}/oauth-callback?token=${token}`;
}

/**
 * @openapi
 * /api/auth/google:
 *   get:
 *     tags: [Auth]
 *     summary: Initiate Google OAuth login
 *     responses:
 *       302: { description: Redirect to Google }
 */
router.get(
  "/google",
  passport.authenticate("google", {
    scope: ["profile", "email"],
    session: false,
  }),
);
router.get(
  "/google/callback",
  passport.authenticate("google", {
    session: false,
    failureRedirect: "/login",
  }),
  (req, res) => {
    if (!req.user) {
      res.redirect("/login");
      return;
    }
    res.redirect(oauthRedirect(req.user));
  },
);

/**
 * @openapi
 * /api/auth/github:
 *   get:
 *     tags: [Auth]
 *     summary: Initiate GitHub OAuth login
 *     responses:
 *       302: { description: Redirect to GitHub }
 */
router.get(
  "/github",
  passport.authenticate("github", { scope: ["user:email"], session: false }),
);
router.get(
  "/github/callback",
  passport.authenticate("github", {
    session: false,
    failureRedirect: "/login",
  }),
  (req, res) => {
    if (!req.user) {
      res.redirect("/login");
      return;
    }
    res.redirect(oauthRedirect(req.user));
  },
);

/**
 * @openapi
 * /api/auth/forgot-password:
 *   post:
 *     tags: [Auth]
 *     summary: Request a password reset email
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email]
 *             properties:
 *               email: { type: string, format: email }
 *     responses:
 *       200: { description: Reset link sent (if email exists) }
 *       400: { description: Invalid email }
 */
const resetSchema = z.object({ email: z.string().email() });
router.post("/forgot-password", async (req, res) => {
  const parsed = resetSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid email" });
    return;
  }

  const user = await prisma.user.findUnique({
    where: { email: parsed.data.email },
  });
  if (!user) {
    res.json({ message: "If that email exists, a reset link has been sent." });
    return;
  }

  const token = crypto.randomBytes(32).toString("hex");
  await prisma.passwordResetToken.create({
    data: { userId: user.id, token, expiresAt: new Date(Date.now() + 3600000) },
  });

  await sendPasswordResetEmail(user.email, token);
  res.json({ message: "If that email exists, a reset link has been sent." });
});

/**
 * @openapi
 * /api/auth/reset-password:
 *   post:
 *     tags: [Auth]
 *     summary: Reset password with token
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [token, password]
 *             properties:
 *               token: { type: string }
 *               password: { type: string, minLength: 8 }
 *     responses:
 *       200: { description: Password updated }
 *       400: { description: Invalid or expired token }
 */
const resetPasswordSchema = z.object({
  token: z.string(),
  password: z.string().min(8),
});
router.post("/reset-password", async (req, res) => {
  const parsed = resetPasswordSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid payload" });
    return;
  }

  const record = await prisma.passwordResetToken.findUnique({
    where: { token: parsed.data.token },
  });
  if (!record || record.used || record.expiresAt < new Date()) {
    res.status(400).json({ error: "Invalid or expired token" });
    return;
  }

  const passwordHash = await bcrypt.hash(parsed.data.password, 10);
  await prisma.$transaction([
    prisma.user.update({
      where: { id: record.userId },
      data: { passwordHash },
    }),
    prisma.passwordResetToken.update({
      where: { id: record.id },
      data: { used: true },
    }),
  ]);

  res.json({ message: "Password updated successfully." });
});

export default router;
