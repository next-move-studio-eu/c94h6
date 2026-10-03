/**
 * Renders article body from JSON content payload ({ content: ContentItem[] }).
 * Markdown via react-markdown + remark-gfm; other types via article-blocks components.
 * Unknown type → one-line message in preview/detail.
 */
import React, { useMemo } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { oneLight } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { useTheme } from '../contexts/ThemeContext';
import { ThemeProvider } from '../contexts/ThemeContext';
import { useTranslation } from 'react-i18next';
import type { ContentItem, ArticleContent } from '../types/articleContent';
import type {
  MarkdownItem,
  AccordionItem,
  ChessDiagramItem,
  PhotoArticleItem,
  ChessVideoItem,
  ArticleVideoItem,
  SlideshowItem,
  ArticleAudioItem,
  SmilesItem,
  PlayEngineItem,
  DotItem,
  PieItem,
  BarItem,
  KaTeXItem,
  TtsContentItem,
  QuizItem,
} from '../types/articleContent';
import katex from 'katex';
import 'katex/dist/katex.min.css';
import Accordion from './article-blocks/Accordion';
import ChessDiagram from './article-blocks/ChessDiagram';
import PhotoArticle from './article-blocks/PhotoArticle';
import ChessVideo from './article-blocks/ChessVideo';
import Video from './article-blocks/Video';
import ArticleAudio from './article-blocks/ArticleAudio';
import ArticleSmiles from './article-blocks/ArticleSmiles';
import Slideshow from './article-blocks/Slideshow';
import PlayAgainstEngine from './article-blocks/PlayAgainstEngine';
import DotDiagram from './article-blocks/DotDiagram';
import PieDiagram from './article-blocks/PieDiagram';
import BarDiagram from './article-blocks/BarDiagram';
import TtsVocabulary from './article-blocks/TtsVocabulary';
import Quiz, {
  RadioOption,
  CheckOption,
  SortOption,
  FixedCaption,
  MatchOption,
} from './article-blocks/Quiz';
import type { ArticleSection } from '../types/articleEditor';

export type RenderVariant = 'preview' | 'detail';

const cv = (token: string) => `var(--${token})`;

interface ArticleContentRendererProps {
  content: ArticleContent;
  section: ArticleSection;
  variant: RenderVariant;
  /** Optional: wrap each block (e.g. article prose container). */
  className?: string;
}

export default function ArticleContentRenderer({
  content,
  section: _section,
  variant,
  className,
}: ArticleContentRendererProps) {
  const { mode } = useTheme();
  const { t } = useTranslation('articleBlocks');

  const markdownComponents = useMemo(() => {
    const isDetail = variant === 'detail';

    return {
      h1: ({ children, ...props }: React.HTMLAttributes<HTMLHeadingElement>) =>
        isDetail ? (
          <h1
            className="text-2xl md:text-3xl font-bold mb-6 mt-10 relative"
            style={{ color: cv('primary') }}
            {...props}
          >
            <span className="relative z-10">{children}</span>
            <div
              className="absolute bottom-0 left-0 h-1 w-[60px] rounded-full translate-y-2"
              style={{ backgroundColor: cv('primary') }}
            />
          </h1>
        ) : (
          <h1 className={`mt-0 mb-4 text-xl font-bold text-[var(--primary)]`} {...props}>{children}</h1>
        ),
      h2: ({ children, ...props }: React.HTMLAttributes<HTMLHeadingElement>) =>
        isDetail ? (
          <h2
            className="text-xl md:text-2xl font-bold mb-4 mt-8"
            style={{ color: cv('primary') }}
            {...props}
          >
            {children}
          </h2>
        ) : (
          <h2 className={`mt-6 mb-3 text-lg font-bold text-[var(--primary)]`} {...props}>{children}</h2>
        ),
      h3: ({ children, ...props }: React.HTMLAttributes<HTMLHeadingElement>) =>
        isDetail ? (
          <h3
            className="text-lg md:text-xl font-bold mb-3 mt-6"
            style={{ color: cv('primary') }}
            {...props}
          >
            {children}
          </h3>
        ) : (
          <h3 className={`mt-4 mb-2 text-base font-bold text-[var(--primary)]`} {...props}>{children}</h3>
        ),
      h4: ({ children, ...props }: React.HTMLAttributes<HTMLHeadingElement>) => (
        <h4 className={isDetail ? 'text-base font-bold mb-2 mt-4' : 'text-sm font-bold'} style={isDetail ? { color: cv('text') } : undefined} {...props}>
          {children}
        </h4>
      ),
      p: ({ children, ...props }: React.HTMLAttributes<HTMLParagraphElement>) =>
        isDetail ? (
          <p className="mb-5 leading-relaxed text-lg" style={{ color: cv('text') }} {...props}>{children}</p>
        ) : (
          <p className={`my-3 text-[var(--text)]`} {...props}>{children}</p>
        ),
      ul: ({ children, ...props }: React.HTMLAttributes<HTMLUListElement>) => (
        <ul
          className={isDetail ? 'list-disc list-outside mb-6 space-y-2 ml-6' : 'list-disc pl-6'}
          style={isDetail ? { color: cv('text') } : undefined}
          {...props}
        >
          {children}
        </ul>
      ),
      ol: ({ children, ...props }: React.HTMLAttributes<HTMLOListElement>) => (
        <ol
          className={isDetail ? 'list-decimal list-outside mb-6 space-y-2 ml-8' : 'list-decimal pl-6'}
          style={isDetail ? { color: cv('text') } : undefined}
          {...props}
        >
          {children}
        </ol>
      ),
      li: ({ children, ...props }: React.HTMLAttributes<HTMLLIElement>) => (
        <li className={isDetail ? 'leading-relaxed' : ''} style={isDetail ? { color: cv('text') } : undefined} {...props}>
          {children}
        </li>
      ),
      strong: ({ children, ...props }: React.HTMLAttributes<HTMLElement>) => (
        <strong style={isDetail ? { color: cv('text') } : undefined} {...props}>{children}</strong>
      ),
      em: ({ children, ...props }: React.HTMLAttributes<HTMLElement>) => (
        <em style={isDetail ? { color: cv('text') } : undefined} {...props}>{children}</em>
      ),
      a: ({ children, href, ...props }: React.AnchorHTMLAttributes<HTMLAnchorElement>) =>
        isDetail ? (
          <a
            className="font-semibold underline underline-offset-2 transition-colors duration-200"
            style={{
              color: cv('primary'),
              textDecorationColor: cv('primaryBorder'),
            }}
            href={href}
            {...props}
          >
            {children}
          </a>
        ) : (
          <a href={href} className={`text-[var(--primary)] underline`} {...props}>{children}</a>
        ),
      blockquote: ({ children, ...props }: React.HTMLAttributes<HTMLQuoteElement>) =>
        isDetail ? (
          <blockquote
            className="my-6 rounded-xl px-5 py-3 italic"
            style={{
              backgroundColor: 'var(--md-sys-color-primary-container)',
              color: 'var(--md-sys-color-on-primary-container)',
            }}
            {...props}
          >
            {children}
          </blockquote>
        ) : (
          <blockquote
            className="my-4 rounded-xl px-4 py-3 italic"
            style={{
              backgroundColor: 'var(--md-sys-color-primary-container)',
              color: 'var(--md-sys-color-on-primary-container)',
            }}
            {...props}
          >
            {children}
          </blockquote>
        ),
      code: ({ node, className: codeClassName, children, ...props }: any) => {
        const match = /language-(\w+)/.exec(codeClassName || '');
        const language = match ? match[1] : 'text';
        const isFencedBlock = match != null || String(children).includes('\n');

        if (isFencedBlock) {
          const codeText = String(children).replace(/\n$/, '');
          const label = language === 'text' ? t('code') : language;

          if (language === 'smiles') {
            return (
              <div className="my-6 overflow-hidden rounded-xl surface-container-high">
                <div className="surface-container-highest px-4 py-2 text-xs font-semibold uppercase tracking-wider text-[var(--md-sys-color-on-surface-variant)]">
                  <span>{label}</span>
                </div>
                <pre
                  className="m-0 min-w-min overflow-x-auto whitespace-pre-wrap p-6 font-mono text-[0.9rem] leading-relaxed"
                  style={{ color: cv('text'), background: 'transparent' }}
                >
                  {codeText}
                </pre>
              </div>
            );
          }

          return (
            <div className="my-6 overflow-hidden rounded-xl surface-container-high">
              <div className="surface-container-highest px-4 py-2 text-xs font-semibold uppercase tracking-wider text-[var(--md-sys-color-on-surface-variant)]">
                <span>{label}</span>
              </div>
              <SyntaxHighlighter
                language={language}
                style={mode === 'dark' ? vscDarkPlus : oneLight}
                customStyle={{
                  margin: 0,
                  padding: '1.5rem',
                  fontSize: '0.9rem',
                  lineHeight: '1.6',
                  background: 'var(--md-sys-color-surface-container)',
                  minWidth: 'min-content',
                }}
                {...props}
              >
                {codeText}
              </SyntaxHighlighter>
            </div>
          );
        }
        return (
          <code
            className={`rounded bg-[var(--md-sys-color-primary-container)] px-1.5 py-0.5 font-mono text-sm text-[var(--md-sys-color-on-primary-container)] ${codeClassName || ''}`}
            {...props}
          >
            {children}
          </code>
        );
      },
      pre: ({ children }: any) => <>{children}</>,
      table: ({ children, ...props }: any) => (
        <div className="my-8 max-w-full min-w-0 overflow-hidden rounded-xl surface-container-low">
          <div className="overflow-x-auto">
            <table
              className={`min-w-full border-collapse ${props.className || ''}`}
              {...props}
            >
              {children}
            </table>
          </div>
        </div>
      ),
      thead: ({ children, ...props }: any) => (
        <thead className="surface-container-highest" {...props}>
          {children}
        </thead>
      ),
      tbody: ({ children, ...props }: any) => (
        <tbody className="text-[var(--md-sys-color-on-surface)] [&>tr:nth-child(even)]:bg-[var(--md-sys-color-surface-container)]" {...props}>
          {children}
        </tbody>
      ),
      tr: ({ children, ...props }: any) => (
        <tr {...props}>
          {children}
        </tr>
      ),
      th: ({ children, ...props }: any) => (
        <th
          className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-[var(--md-sys-color-on-surface)]"
          {...props}
        >
          {children}
        </th>
      ),
      td: ({ children, ...props }: any) => (
        <td
          className="px-6 py-4 text-[var(--md-sys-color-on-surface)]"
          {...props}
        >
          {children}
        </td>
      ),
    };
  }, [variant, mode, t]);

  const renderItem = (item: ContentItem, index: number): React.ReactNode => {
    switch (item.type) {
      case 'markdown': {
        const md = item as MarkdownItem;
        if (!md.content?.trim()) return null;
        return (
          <ReactMarkdown key={index} remarkPlugins={[remarkGfm]} components={markdownComponents}>
            {md.content}
          </ReactMarkdown>
        );
      }
      case 'accordion': {
        const a = item as AccordionItem;
        return (
          <Accordion
            key={index}
            title={a.title}
            type={a.accordionType}
            body={a.body}
          />
        );
      }
      case 'chess-diagram': {
        const c = item as ChessDiagramItem;
        return (
          <div key={index} className="my-6 flex justify-center">
            <ThemeProvider mode={mode}>
              <ChessDiagram
                fen={c.fen}
                highlights={c.highlights}
                lookingOnWhite={c.lookingOnWhite}
                bestMove={c.bestMove}
                text={c.text}
              />
            </ThemeProvider>
          </div>
        );
      }
      case 'photo-article': {
        const p = item as PhotoArticleItem;
        return (
          <PhotoArticle
            key={index}
            id={String(p.imageId)}
            caption={p.caption}
            variant={variant}
          />
        );
      }
      case 'chess-video': {
        const v = item as ChessVideoItem;
        return (
          <ChessVideo
            key={index}
            videoIdentifier={String(v.videoNumber)}
            title={v.title}
          />
        );
      }
      case 'video': {
        const av = item as ArticleVideoItem;
        return (
          <Video
            key={index}
            id={av.videoId}
            title={av.title}
          />
        );
      }
      case 'article-audio': {
        const aa = item as ArticleAudioItem;
        return (
          <ArticleAudio
            key={index}
            id={aa.audioId}
            title={aa.title}
          />
        );
      }
      case 'smiles': {
        const sm = item as SmilesItem;
        return (
          <ArticleSmiles
            key={index}
            smiles={sm.smiles}
            title={sm.title}
          />
        );
      }
      case 'slideshow': {
        const s = item as SlideshowItem;
        return (
          <Slideshow
            key={index}
            slideshowIdentifier={String(s.slideshowNumber)}
            title={s.title}
          />
        );
      }
      case 'play-engine': {
        const pe = item as PlayEngineItem;
        return (
          <PlayAgainstEngine
            key={index}
            fen={pe.fen}
            playWithWhite={pe.playWithWhite}
            variant={variant}
          />
        );
      }
      case 'dot': {
        const d = item as DotItem;
        return (
          <div key={index} className="my-6 flex justify-center overflow-hidden">
            <DotDiagram content={d.content} showPostprocessInfo={variant === 'preview'} />
          </div>
        );
      }
      case 'pie': {
        const p = item as PieItem;
        return (
          <div key={index} className="my-6 flex justify-center">
            <PieDiagram name={p.name} data={p.data} showPostprocessInfo={variant === 'preview'} />
          </div>
        );
      }
      case 'bar': {
        const b = item as BarItem;
        return (
          <div key={index} className="my-6 flex justify-center">
            <BarDiagram name={b.name} xAxis={b.xAxis} series={b.series} showPostprocessInfo={variant === 'preview'} />
          </div>
        );
      }
      case 'katex': {
        const k = item as KaTeXItem;
        if (!k.content?.trim()) return null;
        let html: string;
        try {
          html = katex.renderToString(k.content.trim(), { displayMode: true, throwOnError: false });
        } catch {
          html = `<span class="text-[var(--textSecondary)]">${t('articleEditor.blockKatex')}: ${t('articleEditor.invalidLatex')}</span>`;
        }
        return (
          <div key={index} className="my-6 flex justify-center overflow-x-auto">
            <div dangerouslySetInnerHTML={{ __html: html }} />
          </div>
        );
      }
      case 'tts': {
        const tts = item as TtsContentItem;
        if (!tts.items?.length) return null;
        return (
          <TtsVocabulary
            key={index}
            items={tts.items}
            justRead={tts.justRead}
          />
        );
      }
      case 'quiz': {
        const q = item as QuizItem;
        const children: React.ReactNode[] = [];
        if (q.quizType === 'radio' && q.options?.length) {
          q.options.forEach((opt, i) => {
            children.push(
              <RadioOption
                key={i}
                text={opt.text}
                isCorrect={opt.isCorrect}
                isCorrectEncrypted={opt.isCorrectEncrypted}
              />
            );
          });
        } else if (q.quizType === 'checkbox' && q.options?.length) {
          q.options.forEach((opt, i) => {
            children.push(
              <CheckOption
                key={i}
                text={opt.text}
                isCorrect={opt.isCorrect}
                isCorrectEncrypted={opt.isCorrectEncrypted}
              />
            );
          });
        } else if (q.quizType === 'sort' && q.sortOptions?.length) {
          q.sortOptions.forEach((opt, i) => {
            children.push(
              <SortOption
                key={i}
                caption={opt.caption}
                order={opt.order}
                orderEncrypted={opt.orderEncrypted}
              />
            );
          });
        } else if (q.quizType === 'match' && q.fixedCaptions?.length && q.matchOptions?.length) {
          q.fixedCaptions.forEach((opt, i) => {
            children.push(<FixedCaption key={`f-${i}`} caption={opt.caption} order={opt.order} />);
          });
          q.matchOptions.forEach((opt, i) => {
            children.push(
              <MatchOption
                key={`m-${i}`}
                caption={opt.caption}
                order={opt.order}
                orderEncrypted={opt.orderEncrypted}
              />
            );
          });
        }
        return (
          <Quiz
            key={index}
            question={q.question}
            quizId={q.quizId ?? null}
          >
            {children}
          </Quiz>
        );
      }
      default: {
        const unknown = item as { type: string; [key: string]: unknown };
        const typeValue = typeof unknown.type === 'string' ? unknown.type : '?';
        const prettyJson = JSON.stringify(unknown, null, 2);
        return (
          <details
            key={index}
            className="overflow-hidden rounded-xl surface-container-high"
          >
            <summary className="focus-ring cursor-pointer list-none p-3 text-sm text-[var(--md-sys-color-on-surface-variant)] [&::-webkit-details-marker]:hidden [&::marker]:hidden">
              <span className="select-none">
                {t('articleEditor.blockUnknown')}: {typeValue}
              </span>
              <span className="ml-1 inline-block text-[var(--md-sys-color-outline)]" aria-hidden>▾</span>
            </summary>
            <pre className="surface-container m-0 overflow-x-auto whitespace-pre-wrap p-3 font-mono text-xs">
              {prettyJson}
            </pre>
          </details>
        );
      }
    }
  };

  const items = content?.content;
  if (!items?.length) {
    return null;
  }

  const wrapperClass =
    variant === 'detail'
      ? 'prose prose-lg max-w-none'
      : 'prose max-w-none min-w-0 overflow-x-hidden text-[var(--text)] [&>*+*]:mt-4';

  return (
    <div className={className ?? wrapperClass}>
      {items.map((item, index) => renderItem(item, index))}
    </div>
  );
}
