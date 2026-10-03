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
  const triggerClasses = isForm ? 'text-base' : 'text-sm';
  const dropdownClasses = isForm ? 'rounded-xl' : 'rounded-lg';
  const optionClasses = isForm ? 'px-3 py-2.5 text-base' : isEditor ? 'px-3 py-2 text-sm' : 'px-3 py-2';

  return (
    <div ref={selectRef} className={`relative min-w-0 ${className}`}>
      <button
        type="button"
        onClick={() => !disabled && setIsOpen(!isOpen)}
        onKeyDown={handleKeyDown}
        disabled={disabled}
        className={`field-filled focus-ring w-full text-left flex items-center justify-between gap-2 ${triggerClasses}`}
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
          className={`absolute z-50 w-full mt-1 max-h-60 overflow-auto scrollbar-theme surface-container-high ${dropdownClasses}`}
          style={{ boxShadow: 'var(--shadowSm)' }}
          role="listbox"
        >
          {options.map((option, index) => (
            <button
              key={option.value}
              type="button"
              onClick={() => handleSelect(option.value)}
              onMouseEnter={() => setHighlightedIndex(index)}
              className={`w-full text-left transition-colors focus-ring ${optionClasses} ${
                option.value === value
                  ? 'bg-secondary-container text-on-secondary-container'
                  : index === highlightedIndex
                    ? 'bg-surface-container-highest'
                    : 'hover:bg-surface-container-highest'
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
