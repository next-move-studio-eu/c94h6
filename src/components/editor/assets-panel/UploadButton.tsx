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
      className={['btn-tonal w-full rounded-xl', className].filter(Boolean).join(' ')}
    >
      <Upload className="h-4 w-4" />
      {label}
    </button>
  );
}
