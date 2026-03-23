"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
const express_1 = require("express");
const zod_1 = require("zod");
const prisma_1 = require("../lib/prisma");
const auth_1 = require("../middleware/auth");
const judge0_1 = require("../services/judge0");
const router = (0, express_1.Router)();
const submissionSchema = zod_1.z.object({
    slug: zod_1.z.string().min(1),
    language: zod_1.z.string().min(1),
    code: zod_1.z.string().min(1),
});
router.post('/run', auth_1.authMiddleware, async (request, response) => {
    const parsed = submissionSchema.safeParse(request.body);
    if (!parsed.success) {
        response.status(400).json({ error: 'Invalid payload' });
        return;
    }
    const problem = await prisma_1.prisma.problem.findUnique({
        where: { slug: parsed.data.slug },
    });
    if (!problem) {
        response.status(404).json({ error: 'Problem not found' });
        return;
    }
    const visibleTestCases = problem.testCases.slice(0, 3);
    const result = await (0, judge0_1.runCode)(parsed.data.code, parsed.data.language, visibleTestCases);
    response.json(result);
});
router.post('/', auth_1.authMiddleware, async (request, response) => {
    const parsed = submissionSchema.safeParse(request.body);
    if (!parsed.success) {
        response.status(400).json({ error: 'Invalid payload' });
        return;
    }
    const problem = await prisma_1.prisma.problem.findUnique({
        where: { slug: parsed.data.slug },
    });
    if (!problem) {
        response.status(404).json({ error: 'Problem not found' });
        return;
    }
    const testCases = problem.testCases;
    const result = await (0, judge0_1.runCode)(parsed.data.code, parsed.data.language, testCases);
    const submission = await prisma_1.prisma.submission.create({
        data: {
            userId: request.user.id,
            problemId: problem.id,
            code: parsed.data.code,
            language: parsed.data.language,
            status: result.status,
            runtime: result.runtime,
            memory: result.memory,
            errorMessage: result.errorMessage,
        },
    });
    await prisma_1.prisma.userProgress.upsert({
        where: {
            userId_problemId: {
                userId: request.user.id,
                problemId: problem.id,
            },
        },
        create: {
            userId: request.user.id,
            problemId: problem.id,
            status: result.status === 'ACCEPTED' ? client_1.ProgressStatus.SOLVED : client_1.ProgressStatus.ATTEMPTED,
        },
        update: {
            status: result.status === 'ACCEPTED' ? client_1.ProgressStatus.SOLVED : client_1.ProgressStatus.ATTEMPTED,
        },
    });
    response.status(201).json({
        submissionId: submission.id,
        ...result,
    });
});
router.get('/:slug', auth_1.authMiddleware, async (request, response) => {
    const problem = await prisma_1.prisma.problem.findUnique({
        where: { slug: request.params.slug },
        select: { id: true },
    });
    if (!problem) {
        response.status(404).json({ error: 'Problem not found' });
        return;
    }
    const submissions = await prisma_1.prisma.submission.findMany({
        where: {
            userId: request.user.id,
            problemId: problem.id,
        },
        orderBy: { createdAt: 'desc' },
        select: {
            id: true,
            language: true,
            status: true,
            runtime: true,
            memory: true,
            errorMessage: true,
            createdAt: true,
        },
    });
    response.json({ submissions });
});
exports.default = router;
