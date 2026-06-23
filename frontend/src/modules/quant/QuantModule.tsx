import { Link } from "react-router-dom";
import { Badge } from "../../shared/components/Badge";
import { Button } from "../../shared/components/Button";
import { Card } from "../../shared/components/Card";
import { ProgressBar } from "../../shared/components/ProgressBar";
import { useLocalStorage } from "../../shared/hooks/useLocalStorage";
import { STORAGE_KEYS } from "../../shared/constants";
import { getDefaultUserState } from "./AdaptiveEngine";
import { QUESTIONS } from "./questions";
import "./quant.css";
import type { AttemptResult, UserState } from "./types";

function latestStatusMap(history: UserState["history"]) {
  const latest = new Map<string, AttemptResult>();
  history.forEach((entry) => latest.set(entry.questionId, entry.result));
  return latest;
}

export default function QuantModule() {
  const [userState] = useLocalStorage<UserState>(
    STORAGE_KEYS.QUANT_USER,
    getDefaultUserState(),
  );
  const questionById = new Map(
    QUESTIONS.map((question) => [question.id, question]),
  );
  const recentAttempts = [...userState.history].slice(-20).reverse();
  const latestStatuses = latestStatusMap(userState.history);

  return (
    <div className="quant-module">
      <Card className="quant-card">
        <div className="quant-grid">
          <div className="quant-badge-row">
            <Badge label="quant" />
            <Badge label="dashboard" />
          </div>
          <h1 className="quant-title">Quant Interview Trainer</h1>
          <p>
            Train across math, probability, and finance prompts with adaptive
            self-assessment and a persistent local study record.
          </p>
          <Link to="/quant/practice">
            <Button>Start Practicing</Button>
          </Link>
        </div>
      </Card>

      <Card className="quant-card">
        <div className="quant-grid">
          <div className="quant-metric-row">
            <span className="quant-metric-label">Math</span>
            <span className="quant-metric-value">
              [ MATH: {userState.ratings.MATH}/100 ]
            </span>
          </div>
          <ProgressBar value={userState.ratings.MATH} />
          <div className="quant-metric-row">
            <span className="quant-metric-label">Probability</span>
            <span className="quant-metric-value">
              [ PROBABILITY: {userState.ratings.PROBABILITY}/100 ]
            </span>
          </div>
          <ProgressBar value={userState.ratings.PROBABILITY} />
          <div className="quant-metric-row">
            <span className="quant-metric-label">Finance</span>
            <span className="quant-metric-value">
              [ FINANCE: {userState.ratings.FINANCE}/100 ]
            </span>
          </div>
          <ProgressBar value={userState.ratings.FINANCE} />
        </div>
      </Card>

      <Card className="quant-card">
        <div className="quant-grid-2">
          <div className="quant-metric-row">
            <span className="quant-metric-label">Solved</span>
            <span className="quant-metric-value">
              SOLVED: {userState.solved}
            </span>
          </div>
          <div className="quant-metric-row">
            <span className="quant-metric-label">Streak</span>
            <span className="quant-metric-value">
              STREAK: {userState.streak}
            </span>
          </div>
          <div className="quant-metric-row">
            <span className="quant-metric-label">Bookmarks</span>
            <span className="quant-metric-value">
              BOOKMARKS: {userState.bookmarks.length}
            </span>
          </div>
          <div className="quant-metric-row">
            <span className="quant-metric-label">Attempts</span>
            <span className="quant-metric-value">
              ATTEMPTS: {userState.history.length}
            </span>
          </div>
        </div>
      </Card>

      <Card className="quant-card">
        <div className="quant-grid">
          <div className="quant-nav-row">
            <div>
              <div className="quant-title" style={{ fontSize: "1.2rem" }}>
                Recent History
              </div>
              <div className="quant-subtle">Last 20 attempts</div>
            </div>
            <div className="quant-actions">
              <Link to="/quant/questions">
                <Button variant="ghost">Browse All</Button>
              </Link>
              <Link to="/quant/bookmarks">
                <Button variant="ghost">Bookmarks</Button>
              </Link>
            </div>
          </div>

          <div className="quant-history-wrap">
            <table className="quant-table">
              <thead>
                <tr>
                  <th>Title</th>
                  <th>Category</th>
                  <th>Result</th>
                  <th>Timestamp</th>
                </tr>
              </thead>
              <tbody>
                {recentAttempts.length === 0 ? (
                  <tr>
                    <td colSpan={4}>
                      <div className="quant-empty">No attempts yet</div>
                    </td>
                  </tr>
                ) : (
                  recentAttempts.map((attempt) => {
                    const question = questionById.get(attempt.questionId);
                    return (
                      <tr key={`${attempt.questionId}-${attempt.timestamp}`}>
                        <td>{question?.title ?? attempt.questionId}</td>
                        <td>{question?.category ?? "UNKNOWN"}</td>
                        <td>{attempt.result}</td>
                        <td>{new Date(attempt.timestamp).toLocaleString()}</td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          <div className="quant-badge-row">
            {QUESTIONS.slice(0, 6).map((question) => (
              <Badge
                key={question.id}
                size="sm"
                label={`${question.category} ${latestStatuses.get(question.id) ? "DONE" : "NEW"}`}
              />
            ))}
          </div>
        </div>
      </Card>
    </div>
  );
}
