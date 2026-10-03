import React from 'react';

interface AssetSlotListProps {
  ids: number[];
  inputPrefix: string;
  accept: string;
  getLabel: (id: number) => string;
  onReplace: (id: number) => (event: React.ChangeEvent<HTMLInputElement>) => void;
  onRemove: (id: number) => void;
  removeLabel: string;
}

export function AssetSlotList({
  ids,
  inputPrefix,
  accept,
  getLabel,
  onReplace,
  onRemove,
  removeLabel,
}: AssetSlotListProps) {
  if (ids.length === 0) {
    return null;
  }

  return (
    <ul className="space-y-2">
      {ids.map((id) => (
        <li key={id} className="flex items-center justify-between gap-2">
          <input
            type="file"
            accept={accept}
            onChange={onReplace(id)}
            className="hidden"
            id={`${inputPrefix}-${id}`}
          />
          <label
            htmlFor={`${inputPrefix}-${id}`}
            className="focus-ring min-w-0 flex-1 cursor-pointer rounded-lg bg-[var(--md-sys-color-secondary-container)] px-3 py-2 text-left text-sm text-[var(--md-sys-color-on-secondary-container)]"
          >
            <span className="block truncate">{getLabel(id)}</span>
          </label>
          <button
            type="button"
            onClick={() => onRemove(id)}
            className="btn-text min-h-8 shrink-0 px-3 py-1 text-xs text-[var(--md-sys-color-error)]"
          >
            {removeLabel}
          </button>
        </li>
      ))}
    </ul>
  );
}
