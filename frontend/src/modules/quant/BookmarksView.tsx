import { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "../../shared/components/Button";
import { Card } from "../../shared/components/Card";
import { useLocalStorage } from "../../shared/hooks/useLocalStorage";
import { STORAGE_KEYS } from "../../shared/constants";
import { getDefaultUserState } from "./AdaptiveEngine";
import { QUESTIONS } from "./questions";
import "./quant.css";
import type { AttemptResult, UserState } from "./types";

function latestStatuses(history: UserState["history"]) {
  const latest = new Map<string, AttemptResult>();
  history.forEach((entry) => latest.set(entry.questionId, entry.result));
  return latest;
}

export function BookmarksView() {
  const navigate = useNavigate();
  const [userState] = useLocalStorage<UserState>(
    STORAGE_KEYS.QUANT_USER,
    getDefaultUserState(),
  );
  const statusMap = latestStatuses(userState.history);

  const bookmarkedQuestions = useMemo(
    () =>
      QUESTIONS.filter((question) => userState.bookmarks.includes(question.id)),
    [userState.bookmarks],
  );

  return (
    <div className="quant-module">
      <Card className="quant-card">
        <div className="quant-grid">
          <div className="quant-nav-row">
            <div className="quant-title" style={{ fontSize: "1.4rem" }}>
              Bookmarks
            </div>
            <Button variant="ghost" onClick={() => navigate("/quant")}>
              Back
            </Button>
          </div>

          {bookmarkedQuestions.length === 0 ? (
            <div className="quant-empty">No bookmarked questions yet</div>
          ) : (
            <div className="quant-history-wrap">
              <table className="quant-table">
                <thead>
                  <tr>
                    <th>Title</th>
                    <th>Category</th>
                    <th>Difficulty</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {bookmarkedQuestions.map((question) => (
                    <tr
                      key={question.id}
                      className="quant-click-row"
                      onClick={() =>
                        navigate(`/quant/questions/${question.id}`)
                      }
                    >
                      <td>{question.title}</td>
                      <td>{question.category}</td>
                      <td>{question.difficulty}</td>
                      <td>{statusMap.get(question.id) ?? ""}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </Card>
    </div>
  );
}
