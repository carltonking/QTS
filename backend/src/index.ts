import cors from 'cors';
import express from 'express';
import authRoutes from './routes/auth';
import problemRoutes from './routes/problems';
import submissionRoutes from './routes/submissions';

const app = express();
const port = Number(process.env.PORT ?? 3001);

app.use(
  cors({
    origin: 'http://localhost:5173',
    credentials: true,
  }),
);
app.use(express.json({ limit: '2mb' }));

app.get('/health', (_request, response) => {
  response.json({ status: 'ok', service: 'qts-backend' });
});

app.use('/api/auth', authRoutes);
app.use('/api/problems', problemRoutes);
app.use('/api/submissions', submissionRoutes);

app.use((error: unknown, _request: express.Request, response: express.Response, _next: express.NextFunction) => {
  const message = error instanceof Error ? error.message : 'Unknown server error';
  response.status(500).json({ error: message });
});

app.listen(port, () => {
  console.log(`QTS backend listening on port ${port}`);
});
