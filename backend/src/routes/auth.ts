import { Router } from 'express';
import bcrypt from 'bcrypt';
import { z } from 'zod';
import { prisma } from '../lib/prisma';
import { authMiddleware, signAuthToken } from '../middleware/auth';

const router = Router();

const authSchema = z.object({
  email: z.string().email(),
  username: z.string().min(3).max(24).regex(/^[a-zA-Z0-9_]+$/).optional(),
  password: z.string().min(8),
});

router.post('/register', async (request, response) => {
  const parsed = authSchema.safeParse(request.body);

  if (!parsed.success || !parsed.data.username) {
    response.status(400).json({ error: 'Invalid registration payload' });
    return;
  }

  const { email, username, password } = parsed.data;

  const existing = await prisma.user.findFirst({
    where: {
      OR: [{ email }, { username }],
    },
  });

  if (existing) {
    response.status(409).json({ error: 'User already exists' });
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

router.post('/login', async (request, response) => {
  const parsed = authSchema.omit({ username: true }).safeParse(request.body);

  if (!parsed.success) {
    response.status(400).json({ error: 'Invalid login payload' });
    return;
  }

  const { email, password } = parsed.data;

  const user = await prisma.user.findUnique({
    where: { email },
  });

  if (!user) {
    response.status(401).json({ error: 'Invalid credentials' });
    return;
  }

  const isValid = await bcrypt.compare(password, user.passwordHash);

  if (!isValid) {
    response.status(401).json({ error: 'Invalid credentials' });
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

router.get('/me', authMiddleware, async (request, response) => {
  const user = await prisma.user.findUnique({
    where: { id: request.user!.id },
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

export default router;
