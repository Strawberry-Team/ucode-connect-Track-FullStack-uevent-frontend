import React from 'react';
import { CreditCard, Lock } from 'lucide-react';

interface PayButtonProps {
  processing: boolean;
  disabled: boolean;
  children: React.ReactNode;
  onClick?: () => void;
  type?: 'button' | 'submit' | 'reset';
  variant?: 'default' | 'outline' | 'minimal';
  size?: 'sm' | 'md' | 'lg';
  icon?: 'card' | 'lock' | 'none';
}

const PayButton: React.FC<PayButtonProps> = ({
  processing = false,
  disabled = false,
  children,
  onClick,
  type = 'submit',
  variant = 'default',
  size = 'md',
  icon = 'card'
}) => {
  
  const sizeClasses = {
    sm: 'py-2 px-4 text-sm',
    md: 'py-3 px-5 text-base',
    lg: 'py-3 px-6 text-lg'
  };
  
  const variantClasses = {
    default: `
      bg-gradient-to-r from-emerald-600 to-green-600 
      hover:from-emerald-700 hover:to-green-700
      text-white shadow-md
    `,
    outline: `
      bg-transparent border border-emerald-500 
      text-emerald-600 dark:text-emerald-400
      hover:bg-emerald-50 dark:hover:bg-emerald-900/20
    `,
    minimal: `
      bg-gray-100 dark:bg-gray-800 
      text-gray-800 dark:text-gray-200
      hover:bg-gray-200 dark:hover:bg-gray-700
    `
  };
  
  const ProcessingIndicator = () => (
    <>
      <div className="mr-2">
        <div className="h-4 w-4 rounded-full border-2 border-transparent border-t-current animate-spin"></div>
      </div>
      <span>Processing...</span>
    </>
  );
  
  const ButtonIcon = () => {
    if (icon === 'none') return null;
    
    return (
      <div className="ml-2">
        {icon === 'card' && <CreditCard className="h-4 w-4" />}
        {icon === 'lock' && <Lock className="h-4 w-4" />}
      </div>
    );
  };

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={processing || disabled}
      className={`
        relative w-full ${sizeClasses[size]} 
        ${variantClasses[variant]}
        font-medium rounded-lg 
        transition-all duration-200
        disabled:opacity-70 disabled:cursor-not-allowed
        flex items-center justify-center
        focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2
      `}
    >
      {processing ? (
        <ProcessingIndicator />
      ) : (
        <>
          <span>{children}</span>
          <ButtonIcon />
        </>
      )}
    </button>
  );
};

export default PayButton;

