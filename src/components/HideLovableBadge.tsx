
import { useEffect } from 'react';

const HideLovableBadge = () => {
  useEffect(() => {
    // Add CSS to hide the Lovable badge on all routes
    const style = document.createElement('style');
    style.id = 'hide-lovable-badge';
    style.textContent = `
      [data-lovable-badge],
      .lovable-badge,
      iframe[src*="lovable"],
      div[class*="lovable"],
      a[href*="lovable.dev"] {
        display: none !important;
        visibility: hidden !important;
        opacity: 0 !important;
        pointer-events: none !important;
      }
    `;
    document.head.appendChild(style);

    // Cleanup function
    return () => {
      const existingStyle = document.getElementById('hide-lovable-badge');
      if (existingStyle) {
        existingStyle.remove();
      }
    };
  }, []);

  return null;
};

export default HideLovableBadge;
