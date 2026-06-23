import { useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { Badge } from "../../shared/components/Badge";
import { Button } from "../../shared/components/Button";
import { Card } from "../../shared/components/Card";
import { useLocalStorage } from "../../shared/hooks/useLocalStorage";
import { useSyncToBackend } from "../../shared/hooks/useSyncToBackend";
import { STORAGE_KEYS } from "../../shared/constants";
import { getDefaultUserState, updateRating } from "./AdaptiveEngine";
import { renderLatex } from "./latex";
import { QUESTIONS } from "./questions";
import "./quant.css";
import type { AttemptResult, UserState } from "./types";

export function QuestionDetailView() {
  const { id } = useParams();
  const navigate = useNavigate();
  const index = QUESTIONS.findIndex((question) => question.id === id);
  const question = QUESTIONS[index] ?? QUESTIONS[0];
  const [userState, setUserState] = useLocalStorage<UserState>(
    STORAGE_KEYS.QUANT_USER,
    getDefaultUserState(),
  );
  const { syncQuantRating } = useSyncToBackend();
  const [showHint, setShowHint] = useState(false);
  const [result, setResult] = useState<AttemptResult | null>(null);
  const [ratingChange, setRatingChange] = useState("");

  const bodyHtml = useMemo(() => renderLatex(question.body), [question.body]);
  const hintHtml = useMemo(() => renderLatex(question.hint), [question.hint]);
  const solutionHtml = useMemo(
    () => renderLatex(question.solution),
    [question.solution],
  );
  const bookmarked = userState.bookmarks.includes(question.id);
  const previousQuestion = index > 0 ? QUESTIONS[index - 1] : null;
  const nextQuestion =
    index >= 0 && index < QUESTIONS.length - 1 ? QUESTIONS[index + 1] : null;

  const toggleBookmark = () => {
    const nextBookmarks = bookmarked
      ? userState.bookmarks.filter((bookmarkId) => bookmarkId !== question.id)
      : [...userState.bookmarks, question.id];
    setUserState({ ...userState, bookmarks: nextBookmarks });
  };

  const markQuestion = (mark: AttemptResult) => {
    if (result) {
      return;
    }

    const before = userState.ratings[question.category];
    const updated = updateRating(userState, question.category, mark);
    const withHistory: UserState = {
      ...updated,
      history: [
        ...updated.history,
        {
          questionId: question.id,
          result: mark,
          timestamp: Date.now(),
        },
      ],
    };

    setUserState(withHistory);
    setResult(mark);
    setRatingChange(
      `${question.category}: ${before} → ${withHistory.ratings[question.category]}`,
    );
    syncQuantRating(question.category, withHistory.ratings[question.category]);
  };

  return (
    <div className="quant-module">
      <Card className="quant-card">
        <div className="quant-grid">
          <div className="quant-nav-row">
            <Link to="/quant/questions">
              <Button variant="ghost">← Back</Button>
            </Link>
            <Button variant="ghost" onClick={toggleBookmark}>
              {bookmarked ? "✦ BOOKMARKED" : "★ BOOKMARK"}
            </Button>
          </div>

          <div className="quant-badge-row">
            <Badge label={question.category} />
            <Badge label={question.difficulty} />
          </div>

          <h1 className="quant-title" style={{ fontSize: "1.45rem" }}>
            {question.title}
          </h1>

          <div
            className="quant-body"
            dangerouslySetInnerHTML={{ __html: bodyHtml }}
          />

          <div className="quant-actions">
            <Button
              variant="ghost"
              onClick={() => setShowHint((value) => !value)}
            >
              {showHint ? "Hide Hint" : "Show Hint"}
            </Button>
            <Button
              onClick={() => markQuestion("CORRECT")}
              disabled={Boolean(result)}
            >
              Correct
            </Button>
            <Button
              onClick={() => markQuestion("PARTIAL")}
              disabled={Boolean(result)}
            >
              Partial
            </Button>
            <Button
              onClick={() => markQuestion("INCORRECT")}
              disabled={Boolean(result)}
            >
              Incorrect
            </Button>
          </div>

          {showHint ? (
            <div
              className="quant-body"
              dangerouslySetInnerHTML={{ __html: hintHtml }}
            />
          ) : null}

          {result ? (
            <>
              <div className="quant-rating-change">{ratingChange}</div>
              <div
                className="quant-body"
                dangerouslySetInnerHTML={{ __html: solutionHtml }}
              />
            </>
          ) : null}

          <div className="quant-nav-row">
            <Button
              variant="ghost"
              disabled={!previousQuestion}
              onClick={() =>
                previousQuestion &&
                navigate(`/quant/questions/${previousQuestion.id}`)
              }
            >
              ← Back
            </Button>
            <Button
              variant="ghost"
              disabled={!nextQuestion}
              onClick={() =>
                nextQuestion && navigate(`/quant/questions/${nextQuestion.id}`)
              }
            >
              → Next
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
}
