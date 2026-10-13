import React from 'react';

interface ButtonGroupProps {
  onCancel: () => void;
  onConfirm?: () => void;
  cancelText?: string;
  confirmText?: string;
  cancelButtonClassName?: string;
  confirmButtonClassName?: string;
  cancelDisabled?: boolean;
  confirmDisabled?: boolean;
  isLoading?: boolean;
  confirmButtonType?: 'button' | 'submit';
}

const ButtonGroup: React.FC<ButtonGroupProps> = ({
  onCancel,
  onConfirm,
  cancelText = 'Cancel',
  confirmText = 'Confirm',
  cancelButtonClassName = '',
  confirmButtonClassName = '',
  cancelDisabled = false,
  confirmDisabled = false,
  isLoading = false,
  confirmButtonType = 'button',
}) => {
  const baseButtonClasses: string =
    'font-medium px-3.5 py-1.5 rounded-sm min-w-20 text-sm disabled:opacity-50 disabled:cursor-not-allowed';

  const cancelClasses: string = `${baseButtonClasses} bg-[#fafafa] text-[#1e293b] border-1 border-[#e5e5e5] hover:bg-[#f0f0f0] ${cancelButtonClassName}`;

  const confirmClasses: string = `${baseButtonClasses} bg-[#00636D] text-white border-1 border-[#02808D] hover:bg-[#02808D] ${confirmButtonClassName}`;

  const LoadingSpinner: React.FC = () => (
    <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
      <circle
        className="opacity-25"
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="4"
        fill="none"
      />
      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
      />
    </svg>
  );

  return (
    <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
      <button onClick={onCancel} disabled={cancelDisabled} className={cancelClasses} type="button">
        {cancelText}
      </button>

      <button
        onClick={confirmButtonType === 'button' ? onConfirm : undefined}
        disabled={confirmDisabled || isLoading}
        className={confirmClasses}
        type={confirmButtonType}
      >
        {isLoading ? (
          <span className="flex items-center gap-2">
            <LoadingSpinner />
            Loading...
          </span>
        ) : (
          confirmText
        )}
      </button>
    </div>
  );
};

export default ButtonGroup;
