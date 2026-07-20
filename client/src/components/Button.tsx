import type { ButtonHTMLAttributes } from 'react';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger';
  size?: 'sm' | 'md' | 'lg';
}

const styles: Record<string, React.CSSProperties> = {
  base: {
    borderRadius: 8,
    border: 'none',
    cursor: 'pointer',
    fontWeight: 600,
    fontFamily: 'inherit',
    transition: 'opacity 0.2s',
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  primary: { background: '#e94560', color: '#fff' },
  secondary: { background: '#0f3460', color: '#eee' },
  danger: { background: '#c0392b', color: '#fff' },
  sm: { padding: '6px 14px', fontSize: 13 },
  md: { padding: '10px 20px', fontSize: 15 },
  lg: { padding: '14px 28px', fontSize: 17 },
};

export function Button({ variant = 'primary', size = 'md', style, disabled, ...rest }: ButtonProps) {
  return (
    <button
      style={{ ...styles.base, ...styles[variant], ...styles[size], opacity: disabled ? 0.5 : 1, cursor: disabled ? 'not-allowed' : 'pointer', ...style }}
      disabled={disabled}
      {...rest}
    />
  );
}
