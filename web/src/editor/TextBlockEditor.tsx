import { EditorContent, useEditor, useEditorState } from '@tiptap/react';
import type { Editor } from '@tiptap/react';
import type { RichNode } from '../lib/types.ts';
import { RICH_TEXT_EXTENSIONS, isSafeHref } from './tiptap.ts';

interface Props {
  doc: RichNode;
  onChange: (doc: RichNode) => void;
  label: string;
}

/** Bloc texte : TipTap + barre d'outils (gras, italique, souligné, barré, surligné, lien, titres, listes, citation). */
export function TextBlockEditor({ doc, onChange, label }: Props) {
  const editor = useEditor({
    extensions: RICH_TEXT_EXTENSIONS,
    content: doc,
    onUpdate: ({ editor: e }) => onChange(e.getJSON() as RichNode),
    editorProps: { attributes: { class: 'rich-text rich-text--editing', 'aria-label': label, 'aria-multiline': 'true' } },
  });

  return (
    <div className="text-block">
      {editor && <Toolbar editor={editor} />}
      <EditorContent editor={editor} />
    </div>
  );
}

function Toolbar({ editor }: { editor: Editor }) {
  // La barre ne se re-rend que quand l'état des boutons change (API TipTap v3).
  const s = useEditorState({
    editor,
    selector: ({ editor: e }) => ({
      bold: e.isActive('bold'),
      italic: e.isActive('italic'),
      underline: e.isActive('underline'),
      strike: e.isActive('strike'),
      highlight: e.isActive('highlight'),
      link: e.isActive('link'),
      h2: e.isActive('heading', { level: 2 }),
      h3: e.isActive('heading', { level: 3 }),
      bullet: e.isActive('bulletList'),
      ordered: e.isActive('orderedList'),
      quote: e.isActive('blockquote'),
    }),
  });

  const chain = () => editor.chain().focus();

  function toggleLink() {
    if (s.link) {
      chain().extendMarkRange('link').unsetLink().run();
      return;
    }
    if (editor.state.selection.empty) {
      window.alert("Sélectionnez d'abord le texte à transformer en lien.");
      return;
    }
    const href = window.prompt('Adresse du lien (https://… ou mailto:…)', 'https://');
    if (!href) return;
    if (!isSafeHref(href)) {
      window.alert('Seuls les liens https://, http:// et mailto: sont acceptés.');
      return;
    }
    chain().extendMarkRange('link').setLink({ href: href.trim() }).run();
  }

  const buttons: { label: string; title: string; active: boolean; run: () => void; className?: string }[] = [
    { label: 'G', title: 'Gras (Ctrl+B)', active: s.bold, run: () => chain().toggleBold().run(), className: 'tb--bold' },
    { label: 'I', title: 'Italique (Ctrl+I)', active: s.italic, run: () => chain().toggleItalic().run(), className: 'tb--italic' },
    { label: 'S', title: 'Souligné (Ctrl+U)', active: s.underline, run: () => chain().toggleUnderline().run(), className: 'tb--underline' },
    { label: 'B', title: 'Barré', active: s.strike, run: () => chain().toggleStrike().run(), className: 'tb--strike' },
    { label: 'Surligner', title: 'Surligner', active: s.highlight, run: () => chain().toggleHighlight().run(), className: 'tb--highlight' },
    { label: s.link ? 'Retirer le lien' : 'Lien', title: 'Lien', active: s.link, run: toggleLink },
    { label: 'T1', title: 'Intertitre', active: s.h2, run: () => chain().toggleHeading({ level: 2 }).run() },
    { label: 'T2', title: 'Sous-titre', active: s.h3, run: () => chain().toggleHeading({ level: 3 }).run() },
    { label: '• Liste', title: 'Liste à puces', active: s.bullet, run: () => chain().toggleBulletList().run() },
    { label: '1. Liste', title: 'Liste numérotée', active: s.ordered, run: () => chain().toggleOrderedList().run() },
    { label: '« »', title: 'Citation', active: s.quote, run: () => chain().toggleBlockquote().run() },
    { label: 'Effacer', title: 'Retirer la mise en forme', active: false, run: () => chain().unsetAllMarks().clearNodes().run() },
  ];

  return (
    <div className="toolbar98" role="toolbar" aria-label="Mise en forme du texte">
      {buttons.map((b) => (
        <button
          key={b.title}
          type="button"
          className={['toolbar98__btn', b.className].filter(Boolean).join(' ')}
          aria-pressed={b.active}
          title={b.title}
          // Garder la sélection dans l'éditeur au clic
          onMouseDown={(e) => e.preventDefault()}
          onClick={b.run}
        >
          {b.label}
        </button>
      ))}
    </div>
  );
}
