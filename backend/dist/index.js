"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const auth_1 = __importDefault(require("./routes/auth"));
const problems_1 = __importDefault(require("./routes/problems"));
const submissions_1 = __importDefault(require("./routes/submissions"));
const app = (0, express_1.default)();
const port = Number(process.env.PORT ?? 3001);
app.use(express_1.default.json({ limit: '2mb' }));
app.get('/health', (_request, response) => {
    response.json({ status: 'ok', service: 'qts-backend' });
});
app.use('/api/auth', auth_1.default);
app.use('/api/problems', problems_1.default);
app.use('/api/submissions', submissions_1.default);
app.use((error, _request, response, _next) => {
    const message = error instanceof Error ? error.message : 'Unknown server error';
    response.status(500).json({ error: message });
});
app.listen(port, () => {
    console.log(`QTS backend listening on port ${port}`);
});
