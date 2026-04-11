import { Upload } from 'lucide-react';

interface UploadButtonProps {
  label: string;
  onClick: () => void;
  className?: string;
}

export function UploadButton({ label, onClick, className }: UploadButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={className ?? 'flex w-full items-center justify-center gap-2 rounded-lg border-2 border-dashed border-[var(--border)] py-3 text-sm font-medium text-[var(--primary)] hover:bg-[var(--primarySubtle)]'}
    >
      <Upload className="h-4 w-4" />
      {label}
    </button>
  );
}
