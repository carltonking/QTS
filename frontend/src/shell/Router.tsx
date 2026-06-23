import { lazy, Suspense } from "react";
import { Link, Route, Routes } from "react-router-dom";
import { Layout } from "./Layout";
import { Badge } from "../shared/components/Badge";
import { Button } from "../shared/components/Button";
import { Card } from "../shared/components/Card";
import { ErrorBoundary } from "../shared/components/ErrorBoundary";
import { useAuthContext } from "../shared/contexts/AuthContext";

const ChessModule = lazy(() => import("../modules/chess/ChessModule"));
const MathModule = lazy(() => import("../modules/math/MathModule"));
const PokerModule = lazy(() => import("../modules/poker/PokerModule"));
const QuantModule = lazy(() => import("../modules/quant/QuantModule"));
const PracticeView = lazy(() =>
  import("../modules/quant/PracticeView").then((m) => ({
    default: m.PracticeView,
  })),
);
const QuestionListView = lazy(() =>
  import("../modules/quant/QuestionListView").then((m) => ({
    default: m.QuestionListView,
  })),
);
const QuestionDetailView = lazy(() =>
  import("../modules/quant/QuestionDetailView").then((m) => ({
    default: m.QuestionDetailView,
  })),
);
const BookmarksView = lazy(() =>
  import("../modules/quant/BookmarksView").then((m) => ({
    default: m.BookmarksView,
  })),
);
const OptionsModule = lazy(() => import("../modules/options/OptionsModule"));
const BacktestModule = lazy(() => import("../modules/backtest/BacktestModule"));
const MarketMakingModule = lazy(
  () => import("../modules/marketmaking/MarketMakingModule"),
);
const CurriculumModule = lazy(
  () => import("../modules/curriculum/CurriculumModule"),
);
const LeetcodeModule = lazy(() => import("../modules/leetcode/LeetcodeModule"));
const ProblemPage = lazy(() =>
  import("../modules/leetcode/ProblemPage").then((m) => ({
    default: m.ProblemPage,
  })),
);
const RoadmapPage = lazy(() =>
  import("../modules/leetcode/RoadmapPage").then((m) => ({
    default: m.RoadmapPage,
  })),
);
const LoginPage = lazy(() =>
  import("../modules/leetcode/LoginPage").then((m) => ({
    default: m.LoginPage,
  })),
);
const RegisterPage = lazy(() =>
  import("../modules/leetcode/RegisterPage").then((m) => ({
    default: m.RegisterPage,
  })),
);
const ForgotPasswordPage = lazy(() =>
  import("../modules/leetcode/ForgotPasswordPage").then((m) => ({
    default: m.ForgotPasswordPage,
  })),
);
const ResetPasswordPage = lazy(() =>
  import("../modules/leetcode/ResetPasswordPage").then((m) => ({
    default: m.ResetPasswordPage,
  })),
);
const OAuthCallback = lazy(() =>
  import("../modules/leetcode/OAuthCallback").then((m) => ({
    default: m.OAuthCallback,
  })),
);
const LeaderboardPage = lazy(() =>
  import("../modules/leaderboard/LeaderboardPage").then((m) => ({
    default: m.LeaderboardPage,
  })),
);
const AdminDashboard = lazy(() =>
  import("../modules/admin/AdminDashboard").then((m) => ({
    default: m.AdminDashboard,
  })),
);

function Dashboard() {
  const modules = [
    { name: "CHESS", path: "/chess", desc: "Lichess puzzles + Stockfish AI" },
    { name: "POKER", path: "/poker", desc: "Hand ranking, odds, simulator" },
    { name: "MATH", path: "/math", desc: "Timed arithmetic drills" },
    { name: "QUANT", path: "/quant", desc: "Quant interview prep" },
    { name: "OPTIONS", path: "/options", desc: "Black-Scholes pricing lab" },
    { name: "BACKTEST", path: "/backtest", desc: "MA-crossover backtest lab" },
    { name: "MARKET", path: "/market-making", desc: "Market-making simulator" },
    { name: "LEARN", path: "/learn", desc: "3-year quant study roadmap" },
    { name: "CODE", path: "/code", desc: "LeetCode-style problems" },
    { name: "RANK", path: "/leaderboard", desc: "Global leaderboards" },
  ];

  return (
    <div style={{ display: "grid", gap: "1.5rem" }}>
      <Card>
        <div style={{ display: "grid", gap: "0.9rem" }}>
          <Badge label="dashboard" />
          <h1 style={{ fontSize: "1.75rem", fontWeight: 600 }}>
            Quantitative Training Suite
          </h1>
          <p>
            Multi-module training platform for chess, poker, math, quant, and
            coding.
          </p>
        </div>
      </Card>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
          gap: "1rem",
        }}
      >
        {modules.map((module) => (
          <Card key={module.path} style={{ display: "grid", gap: "0.75rem" }}>
            <Badge label={module.name} />
            <p style={{ fontSize: "0.82rem", opacity: 0.7 }}>{module.desc}</p>
            <Link to={module.path}>
              <Button>Open</Button>
            </Link>
          </Card>
        ))}
      </div>
    </div>
  );
}

const SUSPENSE_FALLBACK = (
  <div
    style={{
      minHeight: "calc(100vh - 8rem)",
      display: "grid",
      placeItems: "center",
    }}
  >
    <div style={{ fontSize: "0.82rem", letterSpacing: "0.08em" }}>
      LOADING...
    </div>
  </div>
);

export function AppRouter() {
  const { isAdmin } = useAuthContext();

  return (
    <ErrorBoundary>
      <Layout>
        <Suspense fallback={SUSPENSE_FALLBACK}>
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/chess" element={<ChessModule />} />
            <Route path="/poker" element={<PokerModule />} />
            <Route path="/math" element={<MathModule />} />
            <Route path="/quant" element={<QuantModule />} />
            <Route path="/quant/practice" element={<PracticeView />} />
            <Route path="/quant/questions" element={<QuestionListView />} />
            <Route
              path="/quant/questions/:id"
              element={<QuestionDetailView />}
            />
            <Route path="/quant/bookmarks" element={<BookmarksView />} />
            <Route path="/options" element={<OptionsModule />} />
            <Route path="/backtest" element={<BacktestModule />} />
            <Route path="/market-making" element={<MarketMakingModule />} />
            <Route path="/learn" element={<CurriculumModule />} />
            <Route path="/code" element={<LeetcodeModule />} />
            <Route path="/code/roadmap" element={<RoadmapPage />} />
            <Route path="/code/:slug" element={<ProblemPage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route path="/forgot-password" element={<ForgotPasswordPage />} />
            <Route path="/reset-password" element={<ResetPasswordPage />} />
            <Route path="/oauth-callback" element={<OAuthCallback />} />
            <Route path="/leaderboard" element={<LeaderboardPage />} />
            {isAdmin && <Route path="/admin" element={<AdminDashboard />} />}
          </Routes>
        </Suspense>
      </Layout>
    </ErrorBoundary>
  );
}
