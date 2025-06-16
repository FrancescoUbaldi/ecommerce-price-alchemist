
import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

const HideLovableBadge = () => {
  const location = useLocation();

  useEffect(() => {
    // Check if we're on a client view route
    const isClientView = location.pathname.startsWith('/view/');
    
    if (isClientView) {
      // Add CSS to hide the Lovable badge
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
    } else {
      // Remove the style if we're not on client view
      const existingStyle = document.getElementById('hide-lovable-badge');
      if (existingStyle) {
        existingStyle.remove();
      }
    }

    // Cleanup function
    return () => {
      const existingStyle = document.getElementById('hide-lovable-badge');
      if (existingStyle) {
        existingStyle.remove();
      }
    };
  }, [location.pathname]);

  return null;
};

export default HideLovableBadge;
