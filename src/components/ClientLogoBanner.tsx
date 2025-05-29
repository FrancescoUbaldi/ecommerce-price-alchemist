
import React from 'react';

interface ClientLogoBannerProps {
  language: string;
}

const ClientLogoBanner = ({ language }: ClientLogoBannerProps) => {
  const logos = [
    { name: 'Crocs', src: '/lovable-uploads/9ad908f1-cb78-48b2-b139-c37e34f01040.png' },
    { name: 'TwoJeys', src: '/lovable-uploads/4e2f16e8-e582-4a9a-a3d8-958c904d5378.png' },
    { name: 'TikTok Shop', src: '/lovable-uploads/9ebdfd85-87b7-4f47-876c-d0033705258c.png' },
    { name: 'Misako', src: '/lovable-uploads/c234bbc1-5753-47bc-8213-6663a4cb2513.png' },
    { name: 'Alpinestars', src: '/lovable-uploads/d639e116-13ef-481a-8ff2-ba7c5523e03d.png' },
    { name: 'The Bradery', src: '/lovable-uploads/23e0894c-8970-4952-b58e-ede7d795aba9.png' },
    { name: 'Boggi Milano', src: '/lovable-uploads/5da947a1-12d9-412c-8940-af9724be7901.png' },
    { name: 'Hoff', src: '/lovable-uploads/74e599df-3cc0-4b46-a23f-6a0b37e6297b.png' }
  ];

  // Duplicate logos for seamless infinite scroll
  const duplicatedLogos = [...logos, ...logos, ...logos];

  return (
    <div className="w-full overflow-hidden bg-gray-50 py-8 mt-8">
      <div className="text-center mb-6">
        <h3 className="text-xl font-medium text-gray-700">
          🔗 Ci hanno già scelto (e stanno ottenendo risultati):
        </h3>
      </div>
      
      <div className="relative">
        <div className="flex animate-scroll-infinite">
          {duplicatedLogos.map((logo, index) => (
            <div
              key={`${logo.name}-${index}`}
              className="flex-shrink-0 mx-8 transition-all duration-300 hover:scale-105"
            >
              <img
                src={logo.src}
                alt={logo.name}
                className="max-h-16 w-auto filter grayscale hover:filter-none transition-all duration-300"
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ClientLogoBanner;
