import { cn } from '@/lib/utils';

type Props = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: 'primary' | 'lime' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
};

export function Button({
  className,
  variant = 'primary',
  size = 'md',
  ...props
}: Props) {
  return (
    <button
      className={cn(
        'pc-btn disabled:cursor-not-allowed disabled:opacity-50',
        variant === 'primary' && 'pc-btn-primary',
        variant === 'lime' && 'pc-btn-lime',
        variant === 'ghost' && 'pc-btn-ghost',
        variant === 'danger' && 'bg-pc-danger text-white',
        size === 'sm' && 'px-3 py-1.5 text-xs',
        size === 'md' && 'px-5 py-2.5 text-sm',
        size === 'lg' && 'px-7 py-3.5 text-base',
        className,
      )}
      {...props}
    />
  );
}
