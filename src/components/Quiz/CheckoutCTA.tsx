import { ReactNode } from 'react';
import { getFinalCheckoutUrl } from '@/config/checkout';
import { trackCtaClicked } from '@/lib/events';

interface CheckoutCTAProps {
  email: string;
  dominantProfile: string;
  dominantCode: string;
  isDebugMode: boolean;
  className?: string;
  children: ReactNode;
}

/**
 * Every checkout link on the site should render through this component, not a raw <a>. It
 * guarantees two things every checkout CTA needs: the href already carries the current UTM/click
 * params (no onClick redirect logic), and the click is a real, unintercepted native <a> navigation
 * — deliberately NOT calling preventDefault — so that if a click-based third-party pixel is ever
 * added, it can detect the outbound checkout link itself without this component needing changes.
 * See CLAUDE.md "Tracking".
 */
export function CheckoutCTA({
  email,
  dominantProfile,
  dominantCode,
  isDebugMode,
  className,
  children,
}: CheckoutCTAProps) {
  const handleClick = () => {
    trackCtaClicked({ email, dominantProfile, dominantCode, isDebugMode });
  };

  return (
    <a href={getFinalCheckoutUrl()} onClick={handleClick} className={className}>
      {children}
    </a>
  );
}
