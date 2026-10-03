import { useState, useId } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import {
  Bike,
  Mountain,
  Tent,
  MapPin,
  TrainFront,
  BusFront,
  Ship,
  Plane,
  Car,
  Code,
  ShieldCheck,
  Info,
  CircleAlert,
  Castle,
  EyeOff,
  Lightbulb,
  ChevronDown,
  type LucideIcon,
} from 'lucide-react';

const TYPE_TO_ICON: Record<string, LucideIcon> = {
  bike: Bike,
  cycling: Bike,
  mountain: Mountain,
  hiking: Mountain,
  tent: Tent,
  camping: Tent,
  mappin: MapPin,
  mapPin: MapPin,
  location: MapPin,
  trainfront: TrainFront,
  train: TrainFront,
  busfront: BusFront,
  bus: BusFront,
  ship: Ship,
  ferry: Ship,
  plane: Plane,
  flight: Plane,
  car: Car,
  driving: Car,
  code: Code,
  technical: Code,
  shieldcheck: ShieldCheck,
  security: ShieldCheck,
  info: Info,
  information: Info,
  circlealert: CircleAlert,
  warning: CircleAlert,
  castle: Castle,
  history: Castle,
  eyeoff: EyeOff,
  hidden: EyeOff,
  lightbulb: Lightbulb,
  tip: Lightbulb,
};

const DEFAULT_ICON = Info;

function getIconForType(type: string): LucideIcon {
  const key = (type || '').trim().toLowerCase().replace(/\s+/g, '');
  return TYPE_TO_ICON[key] ?? DEFAULT_ICON;
}

export interface AccordionProps {
  title: string;
  type?: string;
  /** Body as Markdown string only (no MDX/JSX). Rendered with react-markdown + remark-gfm. */
  body?: string;
  /** Legacy: when used from MDX, body content is passed as children. Ignored when `body` is set. */
  children?: React.ReactNode;
}

export default function Accordion({ title, type = 'Info', body, children }: AccordionProps) {
  const [isOpen, setIsOpen] = useState(false);
  const Icon = getIconForType(type);
  const id = useId();
  const contentId = `${id}-content`;

  return (
    <div className="my-6 overflow-hidden rounded-xl surface-container-high">
      <button
        type="button"
        onClick={() => setIsOpen((o) => !o)}
        className="focus-ring flex w-full items-center gap-3 px-5 py-4 text-left transition-colors duration-150 hover:bg-[color-mix(in_srgb,var(--md-sys-color-on-surface)_8%,transparent)]"
        aria-expanded={isOpen}
        aria-controls={contentId}
      >
        <span
          className="flex-shrink-0 w-9 h-9 rounded-md flex items-center justify-center"
          style={{
            color: `var(--primary)`,
          }}
          aria-hidden
        >
          <Icon className="w-5 h-5" strokeWidth={2} />
        </span>
        <span
          className="flex-1 font-medium text-[0.9375rem] leading-snug"
          style={{ color: `var(--text)` }}
        >
          {title}
        </span>
        <span
          className={`flex-shrink-0 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
          style={{ color: `var(--textSecondary)` }}
          aria-hidden
        >
          <ChevronDown className="w-5 h-5" strokeWidth={2} />
        </span>
      </button>

      <div
        id={contentId}
        role="region"
        className={`overflow-hidden transition-all duration-200 ease-out ${isOpen ? 'max-h-[2000px] opacity-100' : 'max-h-0 opacity-0'}`}
      >
        <div className="px-4 pb-4">
          <div
            className="surface-container-highest rounded-lg px-4 py-3 prose prose-sm max-w-none [&>ul]:my-3 [&>ol]:my-3 [&_ul]:list-disc [&_ul]:pl-6 [&_ol]:list-decimal [&_ol]:pl-6 [&>p]:my-3 [&>h2]:mt-4 [&>h2]:mb-2 [&>h3]:mt-3 [&>h3]:mb-2 [&>h4]:mt-2 [&>h4]:mb-1 [&_li]:leading-relaxed"
            style={{
              color: `var(--text)`,
              ['--tw-prose-links' as string]: `var(--primary)`,
            }}
          >
            {body != null && body !== '' ? (
              <ReactMarkdown remarkPlugins={[remarkGfm]}>{body}</ReactMarkdown>
            ) : (
              children
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
