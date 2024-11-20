interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

const Input = ({ label, error, className, ...props }: InputProps) => {
  return (
    <div className="w-full">
      {label && (
        <label className="block text-sm font-medium text-purple-200 mb-1">
          {label}
        </label>
      )}
      <input
        className="w-full px-4 py-2 bg-purple-900/50 border border-purple-700 rounded-lg 
                 text-white placeholder-purple-400 focus:outline-none focus:border-purple-500
                 transition-colors duration-200"
        {...props}
      />
      {error && (
        <p className="mt-1 text-sm text-red-400">{error}</p>
      )}
    </div>
  );
};

export default Input;