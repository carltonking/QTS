import { Router } from "express";
import { prisma } from "../lib/prisma";

const router = Router();

router.get("/chess", async (_req, res) => {
  const entries = await prisma.chessRating.findMany({
    orderBy: { rating: "desc" },
    take: 50,
    include: { user: { select: { username: true, avatarUrl: true } } },
  });

  res.json({
    entries: entries.map((e) => ({
      username: e.user.username,
      avatarUrl: e.user.avatarUrl,
      rating: e.rating,
      puzzlesSolved: e.puzzlesSolved,
    })),
  });
});

router.get("/math", async (_req, res) => {
  const entries = await prisma.mathSession.groupBy({
    by: ["userId"],
    _sum: { correct: true, total: true, score: true },
    _count: { id: true },
    orderBy: { _sum: { score: "desc" } },
    take: 50,
  });

  const userIds = entries.map((e) => e.userId);
  const users = await prisma.user.findMany({
    where: { id: { in: userIds } },
    select: { id: true, username: true, avatarUrl: true },
  });
  const userMap = new Map(users.map((u) => [u.id, u]));

  res.json({
    entries: entries.map((e) => ({
      username: userMap.get(e.userId)?.username || "unknown",
      avatarUrl: userMap.get(e.userId)?.avatarUrl || null,
      score: e._sum.score || 0,
      correct: e._sum.correct || 0,
      total: e._sum.total || 0,
      sessions: e._count.id,
    })),
  });
});

router.get("/poker", async (_req, res) => {
  const entries = await prisma.pokerProgress.findMany({
    orderBy: [{ correctAttempts: "desc" }, { totalAttempts: "asc" }],
    take: 50,
    include: { user: { select: { username: true, avatarUrl: true } } },
  });

  res.json({
    entries: entries.map((e) => ({
      username: e.user.username,
      avatarUrl: e.user.avatarUrl,
      rank: e.rank,
      accuracy:
        e.totalAttempts > 0
          ? Math.round((e.correctAttempts / e.totalAttempts) * 100)
          : 0,
      bestStreak: e.bestStreak,
    })),
  });
});

router.get("/quant", async (_req, res) => {
  const entries = await prisma.quantRating.findMany({
    orderBy: { rating: "desc" },
    take: 50,
    include: { user: { select: { username: true, avatarUrl: true } } },
  });

  const grouped = new Map<
    string,
    {
      username: string;
      avatarUrl: string | null;
      totalRating: number;
      categories: number;
    }
  >();
  for (const e of entries) {
    const key = e.userId;
    const existing = grouped.get(key);
    if (existing) {
      existing.totalRating += e.rating;
      existing.categories += 1;
    } else {
      grouped.set(key, {
        username: e.user.username,
        avatarUrl: e.user.avatarUrl,
        totalRating: e.rating,
        categories: 1,
      });
    }
  }

  res.json({
    entries: Array.from(grouped.values())
      .map((e) => ({
        ...e,
        avgRating: Math.round(e.totalRating / e.categories),
      }))
      .sort((a, b) => b.avgRating - a.avgRating)
      .slice(0, 50),
  });
});

export default router;
