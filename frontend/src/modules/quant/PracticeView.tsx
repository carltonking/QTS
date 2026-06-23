import { useMemo, useRef, useState } from "react";
import { Badge } from "../../shared/components/Badge";
import { Button } from "../../shared/components/Button";
import { Card } from "../../shared/components/Card";
import { useLocalStorage } from "../../shared/hooks/useLocalStorage";
import { useSyncToBackend } from "../../shared/hooks/useSyncToBackend";
import { STORAGE_KEYS } from "../../shared/constants";
import {
  getDefaultUserState,
  selectNextQuestion,
  updateRating,
} from "./AdaptiveEngine";
import { renderLatex } from "./latex";
import { QUESTIONS } from "./questions";
import "./quant.css";
import type { AttemptResult, Question, UserState } from "./types";

export function PracticeView() {
  const attemptedIds = useRef(new Set<string>());
  const [userState, setUserState] = useLocalStorage<UserState>(
    STORAGE_KEYS.QUANT_USER,
    getDefaultUserState(),
  );
  const { syncQuantRating } = useSyncToBackend();
  const [question, setQuestion] = useState<Question>(() =>
    selectNextQuestion(QUESTIONS, getDefaultUserState(), attemptedIds.current),
  );
  const [showHint, setShowHint] = useState(false);
  const [answer, setAnswer] = useState("");
  const [result, setResult] = useState<AttemptResult | null>(null);
  const [ratingChange, setRatingChange] = useState("");

  const bodyHtml = useMemo(() => renderLatex(question.body), [question.body]);
  const hintHtml = useMemo(() => renderLatex(question.hint), [question.hint]);
  const solutionHtml = useMemo(
    () => renderLatex(question.solution),
    [question.solution],
  );
  const bookmarked = userState.bookmarks.includes(question.id);

  const toggleBookmark = () => {
    const nextBookmarks = bookmarked
      ? userState.bookmarks.filter((bookmarkId) => bookmarkId !== question.id)
      : [...userState.bookmarks, question.id];

    setUserState({
      ...userState,
      bookmarks: nextBookmarks,
    });
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

    attemptedIds.current.add(question.id);
    setUserState(withHistory);
    setResult(mark);
    setRatingChange(
      `${question.category}: ${before} → ${withHistory.ratings[question.category]}`,
    );
    syncQuantRating(question.category, withHistory.ratings[question.category]);
  };

  const handleNext = () => {
    const nextQuestion = selectNextQuestion(
      QUESTIONS,
      userState,
      attemptedIds.current,
    );
    setQuestion(nextQuestion);
    setShowHint(false);
    setAnswer("");
    setResult(null);
    setRatingChange("");
  };

  return (
    <div className="quant-module">
      <Card className="quant-card">
        <div className="quant-grid">
          <div className="quant-nav-row">
            <div className="quant-badge-row">
              <Badge label={question.category} />
              <Badge label={question.difficulty} />
              <Badge label={`streak ${userState.streak}`} />
            </div>
            <Button variant="ghost" onClick={toggleBookmark}>
              {bookmarked ? "✦ BOOKMARKED" : "★ BOOKMARK"}
            </Button>
          </div>

          <h1 className="quant-title" style={{ fontSize: "1.5rem" }}>
            {question.title}
          </h1>

          <div
            className="quant-body"
            dangerouslySetInnerHTML={{ __html: bodyHtml }}
          />

          <div className="quant-toggle-block">
            <Button
              variant="ghost"
              onClick={() => setShowHint((value) => !value)}
            >
              {showHint ? "Hide Hint" : "Show Hint"}
            </Button>
            {showHint ? (
              <div
                className="quant-body"
                dangerouslySetInnerHTML={{ __html: hintHtml }}
              />
            ) : null}
          </div>

          <label className="quant-field">
            Your Approach
            <textarea
              className="quant-textarea"
              value={answer}
              onChange={(event) => setAnswer(event.target.value)}
              placeholder="TYPE YOUR REASONING HERE"
            />
          </label>

          <div className="quant-actions">
            <Button onClick={() => markQuestion("CORRECT")}>Correct</Button>
            <Button onClick={() => markQuestion("PARTIAL")}>Partial</Button>
            <Button onClick={() => markQuestion("INCORRECT")}>Incorrect</Button>
          </div>

          {result ? (
            <>
              <div className="quant-rating-change">{ratingChange}</div>
              <div
                className="quant-body"
                dangerouslySetInnerHTML={{ __html: solutionHtml }}
              />
              <Button onClick={handleNext}>Next Question</Button>
            </>
          ) : null}
        </div>
      </Card>
    </div>
  );
}
