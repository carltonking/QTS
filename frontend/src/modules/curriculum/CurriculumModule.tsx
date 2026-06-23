import { useMemo, useState } from "react";
import { Badge } from "../../shared/components/Badge";
import { Card } from "../../shared/components/Card";
import { ProgressBar } from "../../shared/components/ProgressBar";
import { useLocalStorage } from "../../shared/hooks/useLocalStorage";
import { STORAGE_KEYS } from "../../shared/constants";
import { PHASES, STAGES, WEEK_ONE_ACTIONS, type Phase } from "./roadmapData";
import "./curriculum.css";

const TOTAL_CHECKPOINTS = PHASES.reduce(
  (sum, p) => sum + p.checkpoints.length,
  0,
);

function phaseProgress(phase: Phase, done: Set<string>) {
  const completed = phase.checkpoints.filter((c) => done.has(c.id)).length;
  return Math.round((completed / phase.checkpoints.length) * 100);
}

export default function CurriculumModule() {
  const [doneList, setDoneList] = useLocalStorage<string[]>(
    STORAGE_KEYS.CURRICULUM_PROGRESS,
    [],
  );
  const [openPhase, setOpenPhase] = useState<string | null>(PHASES[0].id);
  const done = useMemo(() => new Set(doneList), [doneList]);

  const overall = Math.round((done.size / TOTAL_CHECKPOINTS) * 100);

  const toggle = (id: string) => {
    setDoneList((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    );
  };

  return (
    <div className="cur-module">
      <Card className="cur-card">
        <div className="cur-grid">
          <div className="cur-badge-row">
            <Badge label="curriculum" />
            <Badge label="3-year roadmap" />
          </div>
          <h1 className="cur-title">Quant Trader Self-Study Path</h1>
          <p className="cur-subtle">
            A gate-driven, 36-month curriculum from Calculus I + near-zero
            programming to a hireable junior quant. You do not advance on a date
            — you advance when you can do every checkpoint unaided, from a blank
            file. Check each gate as you pass it cold.
          </p>
          <div className="cur-overall">
            <ProgressBar value={overall} label="Overall gate progress" />
            <span className="cur-overall-count">
              {done.size} / {TOTAL_CHECKPOINTS} gates passed
            </span>
          </div>
        </div>
      </Card>

      {/* PHASES */}
      {PHASES.map((phase) => {
        const isOpen = openPhase === phase.id;
        const prog = phaseProgress(phase, done);
        return (
          <Card key={phase.id} className="cur-card">
            <button
              type="button"
              className="cur-phase-head"
              onClick={() => setOpenPhase(isOpen ? null : phase.id)}
              aria-expanded={isOpen}
            >
              <div className="cur-phase-head-main">
                <span className="cur-phase-months">{phase.months}</span>
                <span className="cur-phase-title">{phase.title}</span>
              </div>
              <div className="cur-phase-head-meta">
                <span className="cur-phase-prog">{prog}%</span>
                <span className="cur-chevron">{isOpen ? "−" : "+"}</span>
              </div>
            </button>

            {isOpen && (
              <div className="cur-phase-body">
                <p className="cur-focus">{phase.focus}</p>
                <div className="cur-split">{phase.split}</div>

                <div className="cur-block-label">Deliverables</div>
                <ul className="cur-list">
                  {phase.deliverables.map((d, i) => (
                    <li key={i}>{d}</li>
                  ))}
                </ul>

                <div className="cur-block-label">Flagship project</div>
                <p className="cur-flagship">{phase.flagship}</p>

                <div className="cur-block-label">
                  🚪 Checkpoint gates — tick when you can do it cold
                </div>
                <div className="cur-gates">
                  {phase.checkpoints.map((c) => {
                    const checked = done.has(c.id);
                    return (
                      <label
                        key={c.id}
                        className={`cur-gate${checked ? " cur-gate-done" : ""}`}
                      >
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={() => toggle(c.id)}
                        />
                        <span className="cur-gate-box">
                          {checked ? "✓" : ""}
                        </span>
                        <span className="cur-gate-text">{c.text}</span>
                      </label>
                    );
                  })}
                </div>
              </div>
            )}
          </Card>
        );
      })}

      {/* COURSE STAGES */}
      <Card className="cur-card">
        <div className="cur-grid">
          <h2 className="cur-section-title">
            Online course spine (free-first)
          </h2>
          <p className="cur-subtle">
            Each stage leads with the single best free resource (the spine),
            then low-cost alternatives. The entire roadmap is completable for
            $0.
          </p>
          {STAGES.map((stage) => (
            <div key={stage.id} className="cur-stage">
              <div className="cur-stage-title">{stage.title}</div>
              <div className="cur-stage-blurb">{stage.blurb}</div>
              <table className="cur-course-table">
                <tbody>
                  {stage.courses.map((course, i) => (
                    <tr key={i} className={course.spine ? "cur-spine" : ""}>
                      <td>
                        {course.spine ? "★ " : ""}
                        {course.name}
                      </td>
                      <td className="cur-platform">{course.platform}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <div className="cur-milestone">Milestone: {stage.milestone}</div>
            </div>
          ))}
        </div>
      </Card>

      {/* WEEK ONE */}
      <Card className="cur-card">
        <div className="cur-grid">
          <h2 className="cur-section-title">
            Start this week — 5 concrete actions
          </h2>
          <ol className="cur-week-list">
            {WEEK_ONE_ACTIONS.map((a, i) => (
              <li key={i}>{a}</li>
            ))}
          </ol>
        </div>
      </Card>
    </div>
  );
}
