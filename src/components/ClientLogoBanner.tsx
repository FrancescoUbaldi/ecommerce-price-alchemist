
import React from 'react';
import { getTranslation } from '@/utils/translations';

interface ClientLogoBannerProps {
  clientName: string;
  setClientName: (name: string) => void;
  language: string;
}

const ClientLogoBanner = ({ clientName, setClientName, language }: ClientLogoBannerProps) => {
  const logos = [
    { name: 'Crocs', src: '/lovable-uploads/db0d3e46-ec4e-478f-a2c5-9e5e901a4923.png' },
    { name: 'TwoJeys', src: '/lovable-uploads/9ca16c93-745b-4afa-9d56-4052c553146b.png' },
    { name: 'TikTok Shop', src: '/lovable-uploads/f8677881-0a68-4626-8bb3-2bb4d1e1225b.png' },
    { name: 'Adidas', src: '/lovable-uploads/9e9df6e9-2533-4743-af16-08d0defda5d1.png' },
    { name: 'Misako', src: '/lovable-uploads/0338a94c-7460-4d78-b850-60731564de9c.png' },
    { name: 'Hoff', src: '/lovable-uploads/6a6c3035-edb9-40db-8cf5-2f1c0dbb40f2.png' },
    { name: 'Boggi Milano', src: '/lovable-uploads/eb68f2d7-2571-4dfd-bb9c-349a32ded363.png' },
    { name: 'The Bradery', src: '/lovable-uploads/48c7de9e-dfb5-4e77-a89a-783466d45ab6.png' },
    { name: 'Alpinestars', src: '/lovable-uploads/ad7ea1cb-9ae1-47f4-971c-1c26b5046773.png' },
    { name: 'PDPAOLA', src: '/lovable-uploads/0027420a-ff0f-437d-85f8-78fe7ad74d57.png' },
    { name: 'Ellesse', src: '/lovable-uploads/b9db9871-3680-4fe7-b140-c2df65585375.png' },
    { name: 'ISDIN', src: '/lovable-uploads/d0121c92-148c-4e39-9320-316cb1f6bcb2.png' }
  ];

  // Duplicate logos for seamless infinite scroll
  const duplicatedLogos = [...logos, ...logos, ...logos];

  const getHeading = () => {
    switch (language) {
      case 'es':
        return 'Ya han confiado en nosotros:';
      case 'en':
        return 'Trusted by:';
      case 'fr':
        return 'Ils nous ont déjà choisi:';
      default: // 'it'
        return 'Ci hanno già scelto:';
    }
  };

  return (
    <div className="w-full overflow-hidden bg-white py-8 mt-6">
      <div className="text-center mb-4 mt-6">
        <h3 className="text-lg font-medium text-gray-700">
          {getHeading()}
        </h3>
      </div>
      
      <div className="relative">
        <div className="flex animate-scroll-infinite-fast">
          {duplicatedLogos.map((logo, index) => (
            <div
              key={`${logo.name}-${index}`}
              className="flex-shrink-0 mx-8 transition-all duration-300 hover:scale-105"
              style={{ marginLeft: '32px', marginRight: '32px' }}
            >
              <img
                src={logo.src}
                alt={logo.name}
                className="max-h-32 w-auto filter grayscale hover:filter-none transition-all duration-300"
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ClientLogoBanner;
