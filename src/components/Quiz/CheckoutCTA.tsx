import { ReactNode } from 'react';
import { CHECKOUT_URL } from '@/config/checkout';

interface CheckoutCTAProps {
  className?: string;
  children: ReactNode;
}

/**
 * Componente do botão de ação final (CTA) na tela de resultado do Quiz.
 */
export function CheckoutCTA({
  className,
  children,
}: CheckoutCTAProps) {
  return (
    <a href={CHECKOUT_URL} className={className}>
      {children}
    </a>
  );
}

