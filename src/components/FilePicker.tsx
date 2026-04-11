import { useRef, forwardRef, useImperativeHandle } from 'react';

export interface FilePickerProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type'> {
  buttonText: string;
  buttonClassName?: string;
  className?: string;
}

const FilePicker = forwardRef<HTMLInputElement, FilePickerProps>(
  ({ buttonText, buttonClassName, className, ...inputProps }, ref) => {
    const inputRef = useRef<HTMLInputElement>(null);

    useImperativeHandle(ref, () => inputRef.current as HTMLInputElement);

    const handleButtonClick = () => {
      inputRef.current?.click();
    };

    return (
      <div className={className}>
        <input
          ref={inputRef}
          type="file"
          {...inputProps}
          style={{ display: 'none' }}
        />
        <button
          type="button"
          onClick={handleButtonClick}
          className={buttonClassName}
        >
          {buttonText}
        </button>
      </div>
    );
  }
);

FilePicker.displayName = 'FilePicker';

export default FilePicker;
