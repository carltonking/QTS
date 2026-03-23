"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_1 = require("../middleware/auth");
const prisma_1 = require("../lib/prisma");
const router = (0, express_1.Router)();
router.get('/', async (request, response) => {
    const page = Math.max(1, Number(request.query.page ?? 1));
    const limit = Math.min(100, Math.max(1, Number(request.query.limit ?? 50)));
    const difficulty = typeof request.query.difficulty === 'string' &&
        ['EASY', 'MEDIUM', 'HARD'].includes(request.query.difficulty)
        ? request.query.difficulty
        : undefined;
    const tag = typeof request.query.tag === 'string' ? request.query.tag : undefined;
    const search = typeof request.query.search === 'string' ? request.query.search.trim() : undefined;
    const user = (0, auth_1.extractUserFromAuthHeader)(request);
    const where = {
        ...(difficulty ? { difficulty } : {}),
        ...(tag ? { tags: { has: tag } } : {}),
        ...(search
            ? {
                OR: [
                    { title: { contains: search, mode: 'insensitive' } },
                    { slug: { contains: search, mode: 'insensitive' } },
                ],
            }
            : {}),
    };
    const [total, problems] = await Promise.all([
        prisma_1.prisma.problem.count({ where }),
        prisma_1.prisma.problem.findMany({
            where,
            orderBy: [{ neetcodeCategory: 'asc' }, { neetcodeOrder: 'asc' }, { id: 'asc' }],
            skip: (page - 1) * limit,
            take: limit,
            select: {
                id: true,
                slug: true,
                title: true,
                difficulty: true,
                tags: true,
                acceptanceRate: true,
                neetcodeCategory: true,
            },
        }),
    ]);
    let progressByProblemId = new Map();
    if (user) {
        const progress = await prisma_1.prisma.userProgress.findMany({
            where: {
                userId: user.id,
                problemId: { in: problems.map((problem) => problem.id) },
            },
        });
        progressByProblemId = new Map(progress.map((entry) => [entry.problemId, entry.status]));
    }
    response.json({
        problems: problems.map((problem) => ({
            ...problem,
            status: progressByProblemId.get(problem.id),
        })),
        total,
        page,
        pages: Math.ceil(total / limit),
    });
});
router.get('/neetcode/roadmap', async (request, response) => {
    const user = (0, auth_1.extractUserFromAuthHeader)(request);
    const problems = await prisma_1.prisma.problem.findMany({
        orderBy: [{ neetcodeCategory: 'asc' }, { neetcodeOrder: 'asc' }, { id: 'asc' }],
        select: {
            id: true,
            slug: true,
            title: true,
            difficulty: true,
            tags: true,
            acceptanceRate: true,
            neetcodeCategory: true,
            neetcodeOrder: true,
        },
    });
    let progressByProblemId = new Map();
    if (user) {
        const progress = await prisma_1.prisma.userProgress.findMany({
            where: { userId: user.id },
        });
        progressByProblemId = new Map(progress.map((entry) => [entry.problemId, entry.status]));
    }
    const grouped = problems.reduce((accumulator, problem) => {
        const category = problem.neetcodeCategory ?? 'Uncategorized';
        if (!accumulator[category]) {
            accumulator[category] = [];
        }
        accumulator[category].push({
            ...problem,
            status: progressByProblemId.get(problem.id),
        });
        return accumulator;
    }, {});
    response.json({ roadmap: grouped });
});
router.get('/:slug', async (request, response) => {
    const user = (0, auth_1.extractUserFromAuthHeader)(request);
    const problem = await prisma_1.prisma.problem.findUnique({
        where: { slug: request.params.slug },
        select: {
            id: true,
            slug: true,
            title: true,
            difficulty: true,
            description: true,
            examples: true,
            constraints: true,
            tags: true,
            starterCode: true,
            solutionCode: true,
            acceptanceRate: true,
            neetcodeCategory: true,
            neetcodeOrder: true,
        },
    });
    if (!problem) {
        response.status(404).json({ error: 'Problem not found' });
        return;
    }
    const progress = user &&
        (await prisma_1.prisma.userProgress.findUnique({
            where: {
                userId_problemId: {
                    userId: user.id,
                    problemId: problem.id,
                },
            },
        }));
    response.json({
        ...problem,
        status: progress?.status,
    });
});
exports.default = router;
