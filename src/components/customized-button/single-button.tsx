import React from 'react';
import AddIcon from '@mui/icons-material/Add';

interface ButtonProps {
  onClick?: () => void;
  text: string;
  className?: string;
  disabled?: boolean;
  isLoading?: boolean;
  type?: 'button' | 'submit';
  variant?: 'primary' | 'secondary';
}

const SingleButton: React.FC<ButtonProps> = ({
  onClick,
  text,
  className = '',
  disabled = false,
  isLoading = false,
  type = 'button',
  variant = 'primary',
}) => {
  const baseButtonClasses: string =
    'px-2.5 py-2 rounded-sm min-w-20 hover:shadow-md text-sm disabled:opacity-50 disabled:cursor-not-allowed font-semibold tracking-wide';

  const variantClasses = {
    primary: 'bg-[#55979d] text-white border-1 border-[#55979d] hover:bg-[#55979d] uppercase',
    secondary: 'bg-[#00636D] text-white border-1 border-[#00636D] hover:bg-[#02808D]',
  };

  const buttonClasses = `${baseButtonClasses} ${variantClasses[variant]} ${className}`;

  return (
    <button
      onClick={type === 'button' ? onClick : undefined}
      disabled={disabled || isLoading}
      className={buttonClasses}
      type={type}
    >
      <span className="flex items-center justify-center gap-1">
        {variant === 'primary' && <AddIcon sx={{ fontSize: '1.2rem' }} />}
        {text}
      </span>
    </button>
  );
};

export default SingleButton;
