import { useEffect, useMemo, useState } from 'react';
import Editor from '@monaco-editor/react';
import { Button } from '../../../shared/components/Button';

type CodeEditorProps = {
  slug: string;
  starterCode: Record<string, string>;
  onRun: (language: string, code: string) => void;
  onSubmit: (language: string, code: string) => void;
};

const languageMap: Array<{ label: string; value: string; monaco: string }> = [
  { label: 'Python', value: 'python', monaco: 'python' },
  { label: 'JavaScript', value: 'javascript', monaco: 'javascript' },
  { label: 'Java', value: 'java', monaco: 'java' },
  { label: 'C++', value: 'cpp', monaco: 'cpp' },
  { label: 'TypeScript', value: 'typescript', monaco: 'typescript' },
  { label: 'Go', value: 'go', monaco: 'go' },
];

function getStorageKey(slug: string, language: string) {
  return `qts_code_${slug}_${language}`;
}

export function CodeEditor({ slug, starterCode, onRun, onSubmit }: CodeEditorProps) {
  const [language, setLanguage] = useState('python');
  const [fontSize, setFontSize] = useState(14);
  const [code, setCode] = useState('');

  useEffect(() => {
    const draft = window.localStorage.getItem(getStorageKey(slug, language));
    setCode(draft ?? starterCode[language] ?? '');
  }, [language, slug, starterCode]);

  useEffect(() => {
    window.localStorage.setItem(getStorageKey(slug, language), code);
  }, [code, language, slug]);

  const monacoLanguage = useMemo(
    () => languageMap.find((item) => item.value === language)?.monaco ?? 'python',
    [language],
  );

  return (
    <div className="lc-editor-shell">
      <div className="lc-editor-toolbar">
        <select
          className="lc-select"
          value={language}
          onChange={(event) => setLanguage(event.target.value)}
        >
          {languageMap.map((item) => (
            <option key={item.value} value={item.value}>
              {item.label}
            </option>
          ))}
        </select>
        <div className="lc-editor-actions">
          <Button variant="ghost" onClick={() => onRun(language, code)}>
            Run
          </Button>
          <Button onClick={() => onSubmit(language, code)}>Submit</Button>
          <Button variant="ghost" onClick={() => setCode(starterCode[language] ?? '')}>
            ↺
          </Button>
          <Button variant="ghost" onClick={() => setFontSize((size) => Math.max(10, size - 1))}>
            A-
          </Button>
          <Button variant="ghost" onClick={() => setFontSize((size) => Math.min(24, size + 1))}>
            A+
          </Button>
        </div>
      </div>

      <Editor
        height="100%"
        theme="qts-black"
        language={monacoLanguage}
        value={code}
        onChange={(value) => setCode(value ?? '')}
        beforeMount={(monaco) => {
          monaco.editor.defineTheme('qts-black', {
            base: 'vs-dark',
            inherit: true,
            rules: [],
            colors: {
              'editor.background': '#000000',
              'editorLineNumber.foreground': '#888888',
              'editorLineNumber.activeForeground': '#ffffff',
            },
          });
        }}
        options={{
          fontFamily: 'IBM Plex Mono',
          fontSize,
          minimap: { enabled: false },
          lineNumbers: 'on',
          padding: { top: 16 },
          scrollBeyondLastLine: false,
        }}
      />
    </div>
  );
}
