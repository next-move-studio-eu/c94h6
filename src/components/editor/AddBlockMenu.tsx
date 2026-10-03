import {
  useEffect,
  useId,
  useLayoutEffect,
  useRef,
  useState,
  type CSSProperties,
  type KeyboardEvent as ReactKeyboardEvent,
  type MouseEvent as ReactMouseEvent,
} from 'react';
import { createPortal } from 'react-dom';
import { useTranslation } from 'react-i18next';
import {
  BarChart2,
  ChevronDown,
  FlaskConical,
  Image as ImageIcon,
  ListChecks,
  Mic,
  Music,
  PieChart,
  Presentation,
  Puzzle,
  Sigma,
  SquarePlay,
  Swords,
  Video as VideoIcon,
  Workflow,
  type LucideIcon,
} from 'lucide-react';
import type { BlockType } from '../../types/articleEditor';
import type { MarkdownInsertPlan } from '../../utils/markdownInsert';

export type AddableBlockType = Exclude<BlockType, 'unknown'>;

interface BlockMenuEntry {
  type: AddableBlockType;
  labelKey: string;
  Icon: LucideIcon;
}

const BLOCK_MENU: BlockMenuEntry[] = [
  { type: 'photo', labelKey: 'articlesPage.blockImage', Icon: ImageIcon },
  { type: 'slideshow', labelKey: 'articlesPage.blockSlideshow', Icon: Presentation },
  { type: 'articleVideo', labelKey: 'articleEditor.blockArticleVideo', Icon: VideoIcon },
  { type: 'articleAudio', labelKey: 'articleEditor.blockArticleAudio', Icon: Music },
  { type: 'quiz', labelKey: 'articlesPage.blockQuiz', Icon: Puzzle },
  { type: 'chessDiagram', labelKey: 'articlesPage.blockChessDiagram', Icon: Swords },
  { type: 'playEngine', labelKey: 'articlesPage.blockPlayEngine', Icon: Swords },
  { type: 'video', labelKey: 'articlesPage.blockVideo', Icon: SquarePlay },
  { type: 'accordion', labelKey: 'articlesPage.blockAccordion', Icon: ListChecks },
  { type: 'tts', labelKey: 'articleEditor.blockTts', Icon: Mic },
  { type: 'katex', labelKey: 'articleEditor.blockKatex', Icon: Sigma },
  { type: 'dot', labelKey: 'articlesPage.blockDot', Icon: Workflow },
  { type: 'pie', labelKey: 'articlesPage.blockPie', Icon: PieChart },
  { type: 'bar', labelKey: 'articlesPage.blockBar', Icon: BarChart2 },
  { type: 'smiles', labelKey: 'articleEditor.blockSmiles', Icon: FlaskConical },
];

function insertLabel(plan: MarkdownInsertPlan, t: (key: string) => string): string {
  switch (plan.action) {
    case 'before':
      return t('articlesPage.insertAbove');
    case 'after':
      return t('articlesPage.insertBelow');
    case 'between':
      return t('articlesPage.insertHere');
    default:
      return t('articlesPage.insert');
  }
}

function placeMenu(anchor: HTMLElement): CSSProperties {
  const rect = anchor.getBoundingClientRect();
  const margin = 8;
  const gap = 4;
  const width = Math.min(420, Math.max(280, rect.width));
  let left = rect.left;
  if (left + width > window.innerWidth - margin) {
    left = Math.max(margin, window.innerWidth - margin - width);
  }
  const spaceBelow = window.innerHeight - rect.bottom - gap - margin;
  const spaceAbove = rect.top - gap - margin;
  const openUp = spaceBelow < 220 && spaceAbove > spaceBelow;
  const maxHeight = Math.max(160, Math.min(360, openUp ? spaceAbove : spaceBelow));
  return {
    position: 'fixed',
    left,
    width,
    maxHeight,
    zIndex: 60,
    boxShadow: 'var(--shadowSm)',
    ...(openUp
      ? { bottom: window.innerHeight - rect.top + gap }
      : { top: rect.bottom + gap }),
  };
}

interface SplitMenuButtonProps {
  variant: 'filled' | 'tonal';
  label: string;
  menuEntries: BlockMenuEntry[];
  /** When true, one button opens the menu. When false, the leading segment runs onLeadingClick. */
  leadingOpensMenu: boolean;
  onLeadingClick?: () => void;
  onSelect: (type: AddableBlockType) => void;
  disabled?: boolean;
  title?: string;
  /** Keep the textarea caret: cancel mousedown focus, snapshot before the menu takes focus. */
  preserveCaret?: boolean;
  onFreeze?: () => void;
  onOpenChange?: (open: boolean) => void;
}

function SplitMenuButton({
  variant,
  label,
  menuEntries,
  leadingOpensMenu,
  onLeadingClick,
  onSelect,
  disabled = false,
  title,
  preserveCaret = false,
  onFreeze,
  onOpenChange,
}: SplitMenuButtonProps) {
  const { t } = useTranslation(['articlesPage', 'articleEditor']);
  const reactId = useId();
  const menuId = `${reactId}-menu`;
  const anchorRef = useRef<HTMLDivElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const returnFocusRef = useRef<HTMLElement | null>(null);
  const itemRefs = useRef<Array<HTMLButtonElement | null>>([]);
  const onOpenChangeRef = useRef(onOpenChange);
  onOpenChangeRef.current = onOpenChange;
  const [open, setOpen] = useState(false);
  const [highlighted, setHighlighted] = useState(0);
  const [menuStyle, setMenuStyle] = useState<CSSProperties | null>(null);
  const buttonClass = variant === 'filled' ? 'btn-filled' : 'btn-tonal';

  const closeMenu = () => {
    setOpen(false);
    onOpenChangeRef.current?.(false);
  };

  const openMenu = (returnTo: HTMLElement) => {
    onFreeze?.();
    returnFocusRef.current = returnTo;
    setHighlighted(0);
    setOpen(true);
  };

  const choose = (type: AddableBlockType) => {
    onSelect(type);
    closeMenu();
  };

  const moveHighlight = (next: number) => {
    const clamped = Math.max(0, Math.min(menuEntries.length - 1, next));
    setHighlighted(clamped);
    itemRefs.current[clamped]?.focus({ preventScroll: true });
  };

  useLayoutEffect(() => {
    if (!open) return;
    const anchor = anchorRef.current;
    if (!anchor) return;
    const update = () => setMenuStyle(placeMenu(anchor));
    update();
    itemRefs.current[0]?.focus({ preventScroll: true });
    window.addEventListener('resize', update);
    window.addEventListener('scroll', update, true);
    return () => {
      window.removeEventListener('resize', update);
      window.removeEventListener('scroll', update, true);
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const item = itemRefs.current[highlighted];
    const menu = menuRef.current;
    if (!item || !menu) return;
    const itemRect = item.getBoundingClientRect();
    const menuRect = menu.getBoundingClientRect();
    if (itemRect.bottom > menuRect.bottom) {
      menu.scrollTop += itemRect.bottom - menuRect.bottom;
    } else if (itemRect.top < menuRect.top) {
      menu.scrollTop -= menuRect.top - itemRect.top;
    }
  }, [open, highlighted]);

  useEffect(() => {
    if (!open) return;
    const onPointerDown = (event: MouseEvent) => {
      const target = event.target as Node;
      if (anchorRef.current?.contains(target)) return;
      if (menuRef.current?.contains(target)) return;
      setOpen(false);
      onOpenChangeRef.current?.(false);
    };
    document.addEventListener('mousedown', onPointerDown);
    return () => document.removeEventListener('mousedown', onPointerDown);
  }, [open]);

  const onTriggerClick = (event: ReactMouseEvent<HTMLButtonElement>) => {
    if (disabled) return;
    if (open) {
      closeMenu();
      return;
    }
    openMenu(event.currentTarget);
  };

  const onTriggerKeyDown = (event: ReactKeyboardEvent<HTMLButtonElement>) => {
    if (disabled) return;
    if (event.key === 'ArrowDown') {
      event.preventDefault();
      if (!open) {
        openMenu(event.currentTarget);
        return;
      }
      moveHighlight(highlighted + 1);
    } else if (event.key === 'ArrowUp') {
      event.preventDefault();
      if (!open) {
        openMenu(event.currentTarget);
        return;
      }
      moveHighlight(highlighted - 1);
    } else if (event.key === 'Escape' && open) {
      event.preventDefault();
      closeMenu();
    }
  };

  const onMenuKeyDown = (event: ReactKeyboardEvent<HTMLDivElement>) => {
    if (event.key === 'ArrowDown') {
      event.preventDefault();
      moveHighlight(highlighted + 1);
    } else if (event.key === 'ArrowUp') {
      event.preventDefault();
      moveHighlight(highlighted - 1);
    } else if (event.key === 'Home') {
      event.preventDefault();
      moveHighlight(0);
    } else if (event.key === 'End') {
      event.preventDefault();
      moveHighlight(menuEntries.length - 1);
    } else if (event.key === 'Escape') {
      event.preventDefault();
      closeMenu();
      returnFocusRef.current?.focus();
    } else if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      const entry = menuEntries[highlighted];
      if (entry) choose(entry.type);
    } else if (event.key === 'Tab') {
      closeMenu();
    }
  };

  const preventFocusLoss = (event: ReactMouseEvent<HTMLSpanElement>) => {
    if (!preserveCaret || disabled) return;
    event.preventDefault();
  };

  const menu = open
    ? createPortal(
        <div
          ref={menuRef}
          id={menuId}
          role="menu"
          aria-label={leadingOpensMenu ? label : t('articlesPage.ariaMoreBlockTypes')}
          tabIndex={-1}
          onKeyDown={onMenuKeyDown}
          className="surface-container-high scrollbar-theme overflow-y-auto rounded-lg py-1"
          style={{
            position: 'fixed',
            ...(menuStyle ?? { top: 0, left: 0 }),
            visibility: menuStyle ? 'visible' : 'hidden',
          }}
        >
          {menuEntries.map((entry, index) => {
            const Icon = entry.Icon;
            return (
              <button
                key={entry.type}
                ref={(node) => {
                  itemRefs.current[index] = node;
                }}
                id={`${reactId}-${entry.type}`}
                type="button"
                role="menuitem"
                tabIndex={-1}
                onMouseEnter={() => {
                  setHighlighted(index);
                  itemRefs.current[index]?.focus({ preventScroll: true });
                }}
                onClick={() => choose(entry.type)}
                className={`focus-ring flex w-full items-center gap-3 px-3 py-2 text-left text-sm focus-visible:outline-offset-[-2px] ${
                  index === highlighted ? 'bg-surface-container-highest' : 'hover:bg-surface-container-highest'
                }`}
              >
                <Icon className="h-5 w-5 shrink-0 text-on-surface-variant" aria-hidden />
                <span className="min-w-0 font-medium">{t(entry.labelKey)}</span>
              </button>
            );
          })}
        </div>,
        document.body,
      )
    : null;

  const menuButton = (
    <button
      type="button"
      className={`${buttonClass} whitespace-nowrap`}
      disabled={disabled}
      title={disabled ? title : undefined}
      aria-haspopup="menu"
      aria-expanded={open}
      aria-controls={open ? menuId : undefined}
      aria-activedescendant={open ? `${reactId}-${menuEntries[highlighted]?.type ?? ''}` : undefined}
      onClick={onTriggerClick}
      onKeyDown={onTriggerKeyDown}
    >
      {label}
      <ChevronDown className="h-5 w-5" aria-hidden />
    </button>
  );

  return (
    <span title={title} className="inline-flex" onMouseDown={preventFocusLoss}>
      {leadingOpensMenu ? (
        <div ref={anchorRef}>{menuButton}</div>
      ) : (
        <div ref={anchorRef} className="split-button">
          <button
            type="button"
            className={`${buttonClass} split-button-leading whitespace-nowrap`}
            disabled={disabled}
            title={disabled ? title : undefined}
            onClick={onLeadingClick}
          >
            {label}
          </button>
          <button
            type="button"
            className={`${buttonClass} split-button-trailing`}
            disabled={disabled}
            title={disabled ? title : undefined}
            aria-label={t('articlesPage.ariaMoreBlockTypes')}
            aria-haspopup="menu"
            aria-expanded={open}
            aria-controls={open ? menuId : undefined}
            aria-activedescendant={open ? `${reactId}-${menuEntries[highlighted]?.type ?? ''}` : undefined}
            onClick={onTriggerClick}
            onKeyDown={onTriggerKeyDown}
          >
            <ChevronDown className="h-5 w-5" aria-hidden />
          </button>
        </div>
      )}
      {menu}
    </span>
  );
}

export function AppendBlockSplitButton({ onAppend }: { onAppend: (type: AddableBlockType) => void }) {
  const { t } = useTranslation(['articlesPage', 'articleEditor']);
  return (
    <SplitMenuButton
      variant="filled"
      label={t('articleEditor.blockMarkdown')}
      menuEntries={BLOCK_MENU}
      leadingOpensMenu={false}
      onLeadingClick={() => onAppend('markdown')}
      onSelect={onAppend}
    />
  );
}

export function MarkdownCaretInsertButton({
  plan,
  onInsert,
  onFreeze,
  onOpenChange,
}: {
  plan: MarkdownInsertPlan;
  onInsert: (type: AddableBlockType) => void;
  onFreeze: () => void;
  onOpenChange: (open: boolean) => void;
}) {
  const { t } = useTranslation(['articlesPage', 'articleEditor']);
  const disabled = plan.action === 'disabled';
  const title = disabled
    ? t(plan.reason === 'empty' ? 'articlesPage.insertDisabledEmpty' : 'articlesPage.insertDisabledCaret')
    : undefined;
  return (
    <SplitMenuButton
      variant="tonal"
      label={insertLabel(plan, t)}
      menuEntries={BLOCK_MENU}
      leadingOpensMenu
      onSelect={onInsert}
      disabled={disabled}
      title={title}
      preserveCaret
      onFreeze={onFreeze}
      onOpenChange={onOpenChange}
    />
  );
}
