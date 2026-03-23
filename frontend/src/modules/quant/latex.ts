import katex from 'katex';

function escapeHtml(text: string) {
  return text
    .split('&')
    .join('&amp;')
    .split('<')
    .join('&lt;')
    .split('>')
    .join('&gt;')
    .split('"')
    .join('&quot;')
    .split("'")
    .join('&#39;');
}

export function renderLatex(text: string): string {
  const normalizeLatex = (input: string) =>
    input
      .split('\\matrix')
      .join('\\pmatrix')
      .split('\\begin{matrix}')
      .join('\\begin{pmatrix}')
      .split('\\end{matrix}')
      .join('\\end{pmatrix}');

  const parts: string[] = [];
  const pattern = /\$\$([\s\S]+?)\$\$|\$([^$]+?)\$/g;
  let lastIndex = 0;
  let match = pattern.exec(text);

  while (match) {
    const [full, displayExpr, inlineExpr] = match;
    const index = match.index;

    if (index > lastIndex) {
      parts.push(escapeHtml(text.slice(lastIndex, index)).split('\n').join('<br />'));
    }

    if (displayExpr) {
      parts.push(
        `<div style="overflow-x:auto; text-align:center;">${katex.renderToString(
          normalizeLatex(displayExpr),
          {
            displayMode: true,
            throwOnError: false,
            strict: false,
          },
        )}</div>`,
      );
    } else {
      parts.push(
        katex.renderToString(normalizeLatex(inlineExpr ?? ''), {
          displayMode: false,
          throwOnError: false,
          strict: false,
        }),
      );
    }

    lastIndex = index + full.length;
    match = pattern.exec(text);
  }

  if (lastIndex < text.length) {
    parts.push(escapeHtml(text.slice(lastIndex)).split('\n').join('<br />'));
  }

  return parts.join('');
}
