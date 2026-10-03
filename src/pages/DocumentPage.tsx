import React, { useEffect, useMemo } from 'react';
import { useParams, useLocation } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Printer, Download } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { saveBlobWithResolver } from '../utils/savePathResolver';
import documentRegistry from '../md/documentRegistry.json';
import './DocumentPage.css';
import i18n from '../i18n';
import { normalizeLanguage } from '../utils/language';

import asIsCs from '../md/as-is.cs.md?raw';
import asIsEn from '../md/as-is.en.md?raw';
import creditsCs from '../md/credits.cs.md?raw';
import creditsEn from '../md/credits.en.md?raw';
import formatDocCs from '../md/our-format-cs.md?raw';
import formatDocEn from '../md/our-format-en.md?raw';
import whyCs from '../md/why.cs.md?raw';
import whyEn from '../md/why.en.md?raw';
import capabilitiesCs from '../md/capabilities.cs.md?raw';
import capabilitiesEn from '../md/capabilities.en.md?raw';
import gdprCs from '../md/gdpr.cs.md?raw';
import gdprEn from '../md/gdpr.en.md?raw';

interface DocumentEntry {
  id: string;
  lang: string;
  filename: string;
}

const registry = documentRegistry as DocumentEntry[];

const documentContent: Record<string, string> = {
  'as-is.cs.md': asIsCs,
  'as-is.en.md': asIsEn,
  'credits.cs.md': creditsCs,
  'credits.en.md': creditsEn,
  'our-format-cs.md': formatDocCs,
  'our-format-en.md': formatDocEn,
  'why.cs.md': whyCs,
  'why.en.md': whyEn,
  'capabilities.cs.md': capabilitiesCs,
  'capabilities.en.md': capabilitiesEn,
  'gdpr.cs.md': gdprCs,
  'gdpr.en.md': gdprEn,
};

async function downloadMarkdown(filename: string, raw: string) {
  const blob = new Blob([raw], { type: 'text/markdown;charset=utf-8' });
  await saveBlobWithResolver('document', filename, blob, [
    { name: 'Markdown', extensions: ['md'] },
  ]);
}

function extractText(children: React.ReactNode): string {
  if (typeof children === 'string') return children;
  if (Array.isArray(children)) return children.map(extractText).join('');
  if (React.isValidElement(children)) {
    return extractText((children.props as { children?: React.ReactNode }).children);
  }
  return '';
}

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^\w\u00C0-\u024F-]/g, '')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

function getMarkdownComponents() {
  return {
    h1: ({ children, ...props }: React.HTMLAttributes<HTMLHeadingElement>) => (
      <h1
        id={slugify(extractText(children))}
        className="document-heading text-2xl md:text-3xl font-bold mb-6 mt-10 relative text-editor-primary"
        {...props}
      >
        <span className="relative z-10">{children}</span>
        <div className="absolute bottom-0 left-0 h-1 w-[60px] rounded-full translate-y-2 bg-editor-primary" />
      </h1>
    ),
    h2: ({ children, ...props }: React.HTMLAttributes<HTMLHeadingElement>) => (
      <h2
        id={slugify(extractText(children))}
        className="document-heading text-xl md:text-2xl font-bold mb-4 mt-8 text-editor-primary"
        {...props}
      >
        {children}
      </h2>
    ),
    h3: ({ children, ...props }: React.HTMLAttributes<HTMLHeadingElement>) => (
      <h3
        id={slugify(extractText(children))}
        className="document-heading text-lg md:text-xl font-bold mb-3 mt-6 text-editor-primary"
        {...props}
      >
        {children}
      </h3>
    ),
    h4: ({ children, ...props }: React.HTMLAttributes<HTMLHeadingElement>) => (
      <h4 className="document-heading text-base font-bold mb-2 mt-4 text-editor-primary" {...props}>
        {children}
      </h4>
    ),
    p: ({ children, ...props }: React.HTMLAttributes<HTMLParagraphElement>) => (
      <p className="mb-5 leading-relaxed text-base text-editor-text" {...props}>
        {children}
      </p>
    ),
    ul: ({ children, ...props }: React.HTMLAttributes<HTMLUListElement>) => (
      <ul className="list-none mb-6 space-y-3 text-editor-text" {...props}>
        {children}
      </ul>
    ),
    ol: ({ children, ...props }: React.HTMLAttributes<HTMLOListElement>) => (
      <ol className="list-decimal list-outside mb-6 space-y-3 ml-8 text-editor-text" style={{ counterReset: 'list-counter' }} {...props}>
        {children}
      </ol>
    ),
    li: ({ children, ...props }: React.HTMLAttributes<HTMLLIElement>) => (
      <li className="relative pl-6 text-editor-text" {...props}>
        <div className="absolute left-0 top-2.5 w-2 h-2 rounded-full bg-editor-primary" aria-hidden />
        <span className="relative z-10">{children}</span>
      </li>
    ),
    strong: ({ children, ...props }: React.HTMLAttributes<HTMLElement>) => (
      <strong className="font-bold text-editor-text" {...props}>
        {children}
      </strong>
    ),
    em: ({ children, ...props }: React.HTMLAttributes<HTMLElement>) => (
      <em className="italic text-editor-text" {...props}>
        {children}
      </em>
    ),
    a: ({ children, href, ...props }: React.AnchorHTMLAttributes<HTMLAnchorElement>) => (
      <a className="inline-block font-semibold transition-all duration-300 hover:underline hover:underline-offset-2 hover:decoration-2 text-editor-primary no-underline" href={href} {...props}>
        {children}
      </a>
    ),
    blockquote: ({ children, ...props }: React.HTMLAttributes<HTMLQuoteElement>) => (
      <blockquote
        className="relative pl-6 pr-4 py-4 my-6 rounded-xl italic bg-primary-container text-on-primary-container"
        {...props}
      >
        <div className="absolute top-2 left-2 text-4xl opacity-20">"</div>
        <div className="relative z-10">{children}</div>
      </blockquote>
    ),
    code: ({ node, className, children, ...props }: React.HTMLAttributes<HTMLElement> & { node?: unknown; inline?: boolean }) => {
      const match = /language-(\w+)/.exec(className || '');
      const isBlock = !!match;
      if (isBlock) {
        return (
          <code className={className} {...props}>
            {children}
          </code>
        );
      }
      return (
        <code
          className="px-2 py-1 rounded text-sm font-mono font-semibold text-primary bg-surface-container-highest"
          {...props}
        >
          {children}
        </code>
      );
    },
    pre: ({ children, ...props }: React.HTMLAttributes<HTMLPreElement>) => {
      const child = React.Children.toArray(children)[0];
      const codeProps = child && typeof child === 'object' && child !== null && 'props' in child ? (child as React.ReactElement).props : {};
      const codeClassName = typeof codeProps?.className === 'string' ? codeProps.className : '';
      const langMatch = /language-(\w+)/.exec(codeClassName || '');
      const language = langMatch ? langMatch[1] : '';
      return (
        <div className="group relative my-6">
          <div className="relative rounded-xl overflow-hidden surface-container">
            {language && (
              <div className="px-4 py-2 text-xs font-semibold uppercase tracking-wider text-on-primary bg-primary">
                {language}
              </div>
            )}
            <pre className="m-0 p-4 overflow-x-auto text-sm leading-6 font-mono text-editor-text" {...props}>
              {children}
            </pre>
          </div>
        </div>
      );
    },
    table: ({ children, ...props }: React.HTMLAttributes<HTMLTableElement>) => (
      <div className="overflow-x-auto my-8 rounded-xl surface-container-high">
        <table className="min-w-full border-collapse" {...props}>
          {children}
        </table>
      </div>
    ),
    thead: ({ children, ...props }: React.HTMLAttributes<HTMLTableSectionElement>) => (
      <thead className="bg-surface-container-highest" {...props}>
        {children}
      </thead>
    ),
    tbody: ({ children, ...props }: React.HTMLAttributes<HTMLTableSectionElement>) => (
      <tbody className="text-editor-text" {...props}>
        {children}
      </tbody>
    ),
    tr: ({ children, ...props }: React.HTMLAttributes<HTMLTableRowElement>) => (
      <tr className="even:bg-surface-container-highest" {...props}>
        {children}
      </tr>
    ),
    th: ({ children, ...props }: React.HTMLAttributes<HTMLTableCellElement>) => (
      <th className="px-6 py-4 text-left font-bold text-sm uppercase tracking-wider text-on-surface" {...props}>
        {children}
      </th>
    ),
    td: ({ children, ...props }: React.HTMLAttributes<HTMLTableCellElement>) => (
      <td className="px-6 py-4 text-on-surface" {...props}>
        {children}
      </td>
    ),
  };
}

export default function DocumentPage() {
  const { docId } = useParams<{ docId: string }>();
  const location = useLocation();
  const { t } = useTranslation('documentPage');
  const contentLang = normalizeLanguage(i18n.resolvedLanguage);
  const mdComponents = useMemo(() => getMarkdownComponents(), []);

  const entry = useMemo(
    () => registry.find((e) => e.id === docId && e.lang === contentLang) ?? registry.find((e) => e.id === docId && e.lang === 'en'),
    [docId, contentLang]
  );

  const raw = entry ? documentContent[entry.filename] : undefined;

  useEffect(() => {
    document.body.classList.add('on-document-page');
    return () => document.body.classList.remove('on-document-page');
  }, []);

  useEffect(() => {
    if (location.hash || !raw) return;
    window.scrollTo(0, 0);
  }, [docId, contentLang, location.hash, raw]);

  useEffect(() => {
    const hash = location.hash.slice(1);
    if (!hash || !raw) return;
    const scrollToHash = () => {
      const el = document.getElementById(hash);
      if (el) el.scrollIntoView({ behavior: 'instant', block: 'start' });
    };
    const id = requestAnimationFrame(() => {
      requestAnimationFrame(scrollToHash);
    });
    return () => cancelAnimationFrame(id);
  }, [location.hash, raw]);

  if (!docId || !entry) {
    return (
      <div className="document-page min-h-screen surface">
        <div className="container mx-auto px-4 py-12 md:py-20">
          <div className="max-w-4xl mx-auto rounded-xl p-8 md:p-12 surface-container">
            <p className="text-on-surface-variant">{t('editor.document.notFound')}</p>
          </div>
        </div>
      </div>
    );
  }

  if (!raw) {
    return (
      <div className="document-page min-h-screen surface">
        <div className="container mx-auto px-4 py-12 md:py-20">
          <div className="max-w-4xl mx-auto rounded-xl p-8 md:p-12 surface-container">
            <p className="text-on-surface-variant">{t('editor.document.contentNotFound', { filename: entry.filename })}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="document-page min-h-screen surface">
      <div className="container mx-auto px-4 py-12 md:py-20">
        <div className="max-w-4xl mx-auto">
          <div className="no-print flex items-center justify-end gap-3 mb-6">
            <button
              type="button"
              onClick={() => downloadMarkdown(entry.filename, raw)}
              className="btn-tonal"
            >
              <Download className="h-4 w-4" />
              {t('editor.document.downloadMd')}
            </button>
            <button
              type="button"
              onClick={() => window.print()}
              className="btn-filled"
            >
              <Printer className="h-4 w-4" />
              {t('editor.document.printToPdf')}
            </button>
          </div>
          <article className="document-print rounded-xl p-8 md:p-12 surface-container">
            <div className="relative z-10">
              <div className="document-body prose prose-lg max-w-none">
                <ReactMarkdown remarkPlugins={[remarkGfm]} components={mdComponents}>
                  {raw}
                </ReactMarkdown>
              </div>
            </div>
            <div className="document-page-footer print-only" aria-hidden="true" />
          </article>
        </div>
      </div>
    </div>
  );
}
