export default function Button(
  props: React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: 'primary' | 'outline' }
) {
  const { className = '', variant = 'primary', ...rest } = props;
  const base = 'inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none h-9 px-4';
  const variants = {
    primary: 'bg-brand-600 text-white hover:bg-brand-700 focus-visible:ring-brand-600',
    outline: 'border border-slate-300 hover:bg-slate-50',
  };
  return (
    <button className={`${base} ${variants[variant]} ${className}`} {...rest} />
  );
}

