import type { Request, Response, NextFunction } from "express";
import { prisma } from "../lib/prisma";

export async function adminMiddleware(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  if (!req.user?.id) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  const user = await prisma.user.findUnique({
    where: { id: req.user.id },
    select: { role: true },
  });
  if (!user || user.role !== "ADMIN") {
    res.status(403).json({ error: "Forbidden" });
    return;
  }

  next();
}
