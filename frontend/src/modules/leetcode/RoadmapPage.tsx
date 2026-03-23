import { useEffect, useState } from 'react';
import { Card } from '../../shared/components/Card';
import { fetchRoadmap, type RoadmapResponse } from './api';
import { RoadmapCard } from './components/RoadmapCard';
import './leetcode.css';

export function RoadmapPage() {
  const [roadmap, setRoadmap] = useState<RoadmapResponse['roadmap']>({});
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchRoadmap()
      .then((data) => setRoadmap(data.roadmap))
      .catch((err: unknown) =>
        setError(err instanceof Error ? err.message : 'Failed to load roadmap'),
      );
  }, []);

  return (
    <div className="lc-page">
      <Card className="lc-card">
        <div className="lc-heading">NEETCODE 150</div>
        <div className="lc-subheading">STRUCTURED PATH TO MASTERING CODING INTERVIEWS</div>
        {error ? <div className="lc-error-box">{error}</div> : null}
        <div className="lc-roadmap-grid">
          {Object.entries(roadmap).map(([title, problems]) => (
            <RoadmapCard key={title} title={title} problems={problems} />
          ))}
        </div>
      </Card>
    </div>
  );
}
