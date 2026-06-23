import { Router } from "express";
import { z } from "zod";
import { prisma } from "../lib/prisma";
import { authMiddleware } from "../middleware/auth";

const router = Router();

const sessionSchema = z.object({
  operation: z.string(),
  correct: z.number(),
  total: z.number(),
  duration: z.number(),
  score: z.number(),
});

router.post("/sessions", authMiddleware, async (req, res) => {
  const parsed = sessionSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid payload" });
    return;
  }

  const session = await prisma.mathSession.create({
    data: { userId: req.user!.id, ...parsed.data },
  });

  res.status(201).json({ session });
});

router.get("/sessions", authMiddleware, async (req, res) => {
  const sessions = await prisma.mathSession.findMany({
    where: { userId: req.user!.id },
    orderBy: { createdAt: "desc" },
    take: 50,
  });

  res.json({ sessions });
});

export default router;
