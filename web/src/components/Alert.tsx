import { AlertCircle, CheckCircle2, Info } from 'lucide-react';

type Props = {
  tone?: 'error' | 'success' | 'info';
  children: React.ReactNode;
};

export function Alert({ tone = 'info', children }: Props) {
  const Icon = tone === 'error' ? AlertCircle : tone === 'success' ? CheckCircle2 : Info;
  return (
    <div className={`alert alert--${tone}`} role={tone === 'error' ? 'alert' : 'status'}>
      <Icon size={16} aria-hidden="true" />
      <div>{children}</div>
    </div>
  );
}
