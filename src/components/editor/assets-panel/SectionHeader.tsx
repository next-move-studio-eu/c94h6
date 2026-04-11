import type { LucideIcon } from 'lucide-react';

interface SectionHeaderProps {
  icon: LucideIcon;
  title: string;
  description?: string;
}

export function SectionHeader({ icon: Icon, title, description }: SectionHeaderProps) {
  return (
    <>
      <h3 className="mb-2 flex items-center gap-2 text-sm font-semibold text-[var(--text)]">
        <Icon className="h-4 w-4" />
        {title}
      </h3>
      {description && (
        <p className="mb-2 text-xs text-[var(--textSecondary)]">
          {description}
        </p>
      )}
    </>
  );
}
