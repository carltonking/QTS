import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Panel, PanelGroup, PanelResizeHandle } from 'react-resizable-panels';
import { Card } from '../../shared/components/Card';
import { fetchProblem, type ProblemDetail } from './api';
import { CodeEditor } from './components/CodeEditor';
import { ProblemDescription } from './components/ProblemDescription';
import { TestResultPanel } from './components/TestResultPanel';
import { useAuth } from './hooks/useAuth';
import { useSubmission } from './hooks/useSubmission';
import './leetcode.css';

export function ProblemPage() {
  const { slug = '' } = useParams();
  const auth = useAuth();
  const submission = useSubmission(slug);
  const [problem, setProblem] = useState<ProblemDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'DESCRIPTION' | 'SUBMISSIONS'>('DESCRIPTION');

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);

    fetchProblem(slug)
      .then((data) => {
        if (!cancelled) {
          setProblem(data);
        }
      })
      .catch((err: unknown) => {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Failed to load problem');
        }
      })
      .finally(() => {
        if (!cancelled) {
          setLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [slug]);

  useEffect(() => {
    if (auth.isAuthenticated) {
      submission.loadHistory().catch(() => undefined);
    }
  }, [auth.isAuthenticated, submission.loadHistory]);

  if (loading) {
    return <div className="lc-page"><Card className="lc-card">LOADING...</Card></div>;
  }

  if (!problem || error) {
    return <div className="lc-page"><Card className="lc-card"><div className="lc-error-box">{error ?? 'Problem not found'}</div></Card></div>;
  }

  return (
    <div className="lc-workspace">
      <PanelGroup direction="horizontal">
        <Panel defaultSize={42} minSize={28}>
          <Card className="lc-workspace-panel lc-workspace-left">
            <ProblemDescription
              problem={problem}
              submissions={submission.history}
              showSubmissions={auth.isAuthenticated}
              activeTab={activeTab}
              setActiveTab={setActiveTab}
            />
          </Card>
        </Panel>
        <PanelResizeHandle className="lc-resize-handle" />
        <Panel defaultSize={58} minSize={32}>
          <PanelGroup direction="vertical">
            <Panel defaultSize={68} minSize={40}>
              <Card className="lc-workspace-panel lc-editor-panel">
                <CodeEditor
                  slug={problem.slug}
                  starterCode={problem.starterCode}
                  onRun={(language, code) => submission.run(language, code).catch(() => undefined)}
                  onSubmit={(language, code) =>
                    submission.submit(language, code).then(() => submission.loadHistory()).catch(() => undefined)
                  }
                />
              </Card>
            </Panel>
            <PanelResizeHandle className="lc-resize-handle" />
            <Panel defaultSize={32} minSize={18} collapsible>
              <Card className="lc-workspace-panel lc-results-panel">
                <TestResultPanel result={submission.result} loading={submission.loading} />
              </Card>
            </Panel>
          </PanelGroup>
        </Panel>
      </PanelGroup>
    </div>
  );
}
