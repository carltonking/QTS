import { Link, Route, Routes } from 'react-router-dom';
import { Layout } from './Layout';
import { Badge } from '../shared/components/Badge';
import { Button } from '../shared/components/Button';
import { Card } from '../shared/components/Card';
import { Input } from '../shared/components/Input';
import { LineChart } from '../shared/components/LineChart';
import { ProgressBar } from '../shared/components/ProgressBar';
import ChessModule from '../modules/chess/ChessModule';
import MathModule from '../modules/math/MathModule';
import PokerModule from '../modules/poker/PokerModule';
import QuantModule from '../modules/quant/QuantModule';
import { PracticeView } from '../modules/quant/PracticeView';
import { QuestionListView } from '../modules/quant/QuestionListView';
import { QuestionDetailView } from '../modules/quant/QuestionDetailView';
import { BookmarksView } from '../modules/quant/BookmarksView';
import LeetcodeModule from '../modules/leetcode/LeetcodeModule';
import { ProblemPage } from '../modules/leetcode/ProblemPage';
import { RoadmapPage } from '../modules/leetcode/RoadmapPage';
import { LoginPage } from '../modules/leetcode/LoginPage';
import { RegisterPage } from '../modules/leetcode/RegisterPage';

function ModulePlaceholder({ label }: { label: string }) {
  return (
    <div
      style={{
        minHeight: 'calc(100vh - 8rem)',
        display: 'grid',
        placeItems: 'center',
        textAlign: 'center',
      }}
    >
      <div style={{ fontSize: '1.15rem', letterSpacing: '0.08em' }}>[ {label} ] — Coming Soon</div>
    </div>
  );
}

function Dashboard() {
  const modules = [
    { name: 'CHESS', path: '/chess' },
    { name: 'POKER', path: '/poker' },
    { name: 'MATH', path: '/math' },
    { name: 'QUANT', path: '/quant' },
    { name: 'CODE', path: '/code' },
  ];

  return (
    <div style={{ display: 'grid', gap: '1.5rem' }}>
      <Card>
        <div style={{ display: 'grid', gap: '0.9rem' }}>
          <Badge label="dashboard" />
          <h1 style={{ fontSize: '1.75rem', fontWeight: 600 }}>QTS — Select a module</h1>
          <p>
            Phase 1 establishes the shared shell, typography, routing, and UI system for the
            Quantitative Training Suite.
          </p>
        </div>
      </Card>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: '1rem',
        }}
      >
        {modules.map((module) => (
          <Card key={module.path} style={{ display: 'grid', gap: '1rem' }}>
            <Badge label={module.name} />
            <p>Module shell ready for future phases.</p>
            <Link to={module.path}>
              <Button>Open</Button>
            </Link>
          </Card>
        ))}
      </div>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
          gap: '1rem',
        }}
      >
        <Card style={{ display: 'grid', gap: '1rem' }}>
          <Badge label="input" size="sm" />
          <Input placeholder="USERNAME" aria-label="Username" />
          <ProgressBar value={35} label="Phase 1 Progress" />
        </Card>
        <Card style={{ display: 'grid', gap: '1rem' }}>
          <Badge label="chart" size="sm" />
          <LineChart
            data={[
              { x: 'W1', y: 12 },
              { x: 'W2', y: 18 },
              { x: 'W3', y: 26 },
              { x: 'W4', y: 34 },
            ]}
            xLabel="Sprint"
            yLabel="Tasks"
          />
        </Card>
      </div>
    </div>
  );
}

export function AppRouter() {
  return (
    <Layout>
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/chess" element={<ChessModule />} />
        <Route path="/poker" element={<PokerModule />} />
        <Route path="/math" element={<MathModule />} />
        <Route path="/quant" element={<QuantModule />} />
        <Route path="/quant/practice" element={<PracticeView />} />
        <Route path="/quant/questions" element={<QuestionListView />} />
        <Route path="/quant/questions/:id" element={<QuestionDetailView />} />
        <Route path="/quant/bookmarks" element={<BookmarksView />} />
        <Route path="/code" element={<LeetcodeModule />} />
        <Route path="/code/roadmap" element={<RoadmapPage />} />
        <Route path="/code/:slug" element={<ProblemPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
      </Routes>
    </Layout>
  );
}
