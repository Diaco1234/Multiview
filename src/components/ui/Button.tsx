import { motion } from 'framer-motion';
import { clsx } from 'clsx';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary';
  children: React.ReactNode;
}

const Button = ({ variant = 'primary', children, className, ...props }: ButtonProps) => {
  return (
    <motion.button
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      className={clsx(
        'px-6 py-3 rounded-lg font-semibold transition-colors duration-200 flex items-center gap-2',
        {
          'bg-gradient-to-r from-purple-600 to-purple-500 hover:from-purple-500 hover:to-purple-400 text-white shadow-lg': variant === 'primary',
          'bg-purple-900/50 border border-purple-700 hover:bg-purple-800/50 text-white': variant === 'secondary'
        },
        className
      )}
      {...props}
    >
      {children}
    </motion.button>
  );
};

export default Button;