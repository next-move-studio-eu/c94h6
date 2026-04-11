import { useState, useRef, useEffect } from 'react';

interface SelectOption {
  value: string;
  label: string;
}

interface SelectProps {
  value: string;
  onChange: (value: string) => void;
  options: SelectOption[];
  className?: string;
  disabled?: boolean;
  variant?: 'default' | 'form' | 'editor';
}

export default function Select({
  value,
  onChange,
  options,
  className = '',
  disabled = false,
  variant = 'default',
}: SelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const selectRef = useRef<HTMLDivElement>(null);
  const selectedOption = options.find(opt => opt.value === value);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (selectRef.current && !selectRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setHighlightedIndex(-1);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  useEffect(() => {
    if (isOpen) {
      const currentIndex = options.findIndex(opt => opt.value === value);
      setHighlightedIndex(currentIndex >= 0 ? currentIndex : 0);
    }
  }, [isOpen, value, options]);

  const handleSelect = (optionValue: string) => {
    onChange(optionValue);
    setIsOpen(false);
    setHighlightedIndex(-1);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (disabled) return;

    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      if (isOpen && highlightedIndex >= 0) {
        handleSelect(options[highlightedIndex].value);
      } else {
        setIsOpen(true);
      }
    } else if (e.key === 'Escape') {
      setIsOpen(false);
      setHighlightedIndex(-1);
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (!isOpen) {
        setIsOpen(true);
      } else {
        setHighlightedIndex((prev) => (prev < options.length - 1 ? prev + 1 : prev));
      }
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (isOpen) {
        setHighlightedIndex((prev) => (prev > 0 ? prev - 1 : 0));
      }
    }
  };

  const isForm = variant === 'form';
  const isEditor = variant === 'editor';
  const triggerClasses = isForm
    ? 'px-3 py-3 rounded-xl border border-[var(--border)] text-[var(--text)] bg-[var(--bg)] text-base focus:outline-none focus:ring-2 focus:ring-[var(--primary)]'
    : isEditor
      ? 'px-3 py-2 rounded-lg border border-[var(--border)] text-[var(--text)] bg-[var(--surface)] focus:outline-none focus:ring-1 focus:ring-[var(--primary)] focus:border-[var(--primary)]'
      : 'px-3 py-2 rounded-md border border-[var(--border)] text-[var(--text)] bg-[var(--surface)]';
  const dropdownClasses = isForm ? 'rounded-xl' : isEditor ? 'rounded-lg' : 'rounded-md';
  const optionClasses = isForm ? 'px-3 py-2.5 text-base' : isEditor ? 'px-3 py-2 text-sm' : 'px-3 py-2';

  return (
    <div ref={selectRef} className={`relative min-w-0 ${className}`}>
      <button
        type="button"
        onClick={() => !disabled && setIsOpen(!isOpen)}
        onKeyDown={handleKeyDown}
        disabled={disabled}
        className={`w-full text-left flex items-center justify-between gap-2 transition-colors ${
          disabled ? 'opacity-50 cursor-not-allowed' : isForm ? '' : isEditor ? 'hover:bg-[var(--hoverBg)]' : 'hover:bg-[var(--hoverBg)]'
        } ${triggerClasses} ${isOpen ? (isForm ? 'border-[var(--primary)] ring-2 ring-[var(--primary)]' : isEditor ? 'border-[var(--primary)] ring-1 ring-[var(--primary)]' : 'border-[var(--primary)] ring-2 ring-[var(--primary)]') : ''}`}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
      >
        <span className="min-w-0 truncate">{selectedOption?.label || value}</span>
        <svg
          className={`w-4 h-4 shrink-0 transition-transform ${isOpen ? 'rotate-180' : ''}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {isOpen && (
        <div
          className={`absolute z-50 w-full mt-1 max-h-60 overflow-auto scrollbar-theme ${dropdownClasses} ${
            isForm ? 'border border-[var(--border)] bg-[var(--bg)]' : isEditor ? 'border border-[var(--border)] bg-[var(--surface)]' : 'border border-[var(--border)] bg-[var(--surface)]'
          }`}
          style={{ boxShadow: 'var(--shadowSm)' }}
          role="listbox"
        >
          {options.map((option, index) => (
            <button
              key={option.value}
              type="button"
              onClick={() => handleSelect(option.value)}
              onMouseEnter={() => setHighlightedIndex(index)}
              className={`w-full text-left text-[var(--text)] transition-colors ${optionClasses} ${
                option.value === value || index === highlightedIndex
                  ? 'bg-[var(--primary)] text-[var(--onPrimary)]'
                  : 'hover:bg-[var(--primary)] hover:text-[var(--onPrimary)]'
              }`}
              role="option"
              aria-selected={option.value === value}
            >
              {option.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
