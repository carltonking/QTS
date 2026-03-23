import { useState } from 'react';
import { Input } from '../../../shared/components/Input';
import type { Difficulty } from '../api';

type StatusFilter = 'ALL' | 'SOLVED' | 'ATTEMPTED' | 'TODO';

type FilterBarProps = {
  search: string;
  setSearch: (value: string) => void;
  difficulty: Difficulty | 'ALL';
  setDifficulty: (value: Difficulty | 'ALL') => void;
  status: StatusFilter;
  setStatus: (value: StatusFilter) => void;
  availableTags: string[];
  selectedTags: string[];
  setSelectedTags: (value: string[]) => void;
};

export function FilterBar(props: FilterBarProps) {
  const [showTags, setShowTags] = useState(false);

  return (
    <div className="lc-filter-bar">
      <Input
        value={props.search}
        onChange={(event) => props.setSearch(event.target.value)}
        placeholder="SEARCH PROBLEMS..."
      />
      <select
        className="lc-select"
        value={props.difficulty}
        onChange={(event) => props.setDifficulty(event.target.value as Difficulty | 'ALL')}
      >
        <option value="ALL">ALL</option>
        <option value="EASY">EASY</option>
        <option value="MEDIUM">MEDIUM</option>
        <option value="HARD">HARD</option>
      </select>
      <select
        className="lc-select"
        value={props.status}
        onChange={(event) => props.setStatus(event.target.value as StatusFilter)}
      >
        <option value="ALL">ALL</option>
        <option value="SOLVED">SOLVED</option>
        <option value="ATTEMPTED">ATTEMPTED</option>
        <option value="TODO">TODO</option>
      </select>
      <div className="lc-tag-filter">
        <button type="button" className="lc-select lc-tag-toggle" onClick={() => setShowTags((v) => !v)}>
          TAGS {props.selectedTags.length > 0 ? `(${props.selectedTags.length})` : ''}
        </button>
        {showTags ? (
          <div className="lc-tag-dropdown">
            {props.availableTags.map((tag) => (
              <label key={tag} className="lc-tag-option">
                <input
                  type="checkbox"
                  checked={props.selectedTags.includes(tag)}
                  onChange={() => {
                    props.setSelectedTags(
                      props.selectedTags.includes(tag)
                        ? props.selectedTags.filter((item) => item !== tag)
                        : [...props.selectedTags, tag],
                    );
                  }}
                />
                <span>{tag}</span>
              </label>
            ))}
          </div>
        ) : null}
      </div>
    </div>
  );
}
