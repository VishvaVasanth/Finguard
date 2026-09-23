import React from 'react';

interface BrandSignatureProps {
  size?: 'sm' | 'md' | 'lg' | 'hero' | 'bg';
  className?: string;
}

export const BrandSignature: React.FC<BrandSignatureProps> = ({ size = 'md', className = '' }) => {
  if (size === 'sm') {
    return (
      <div id="brand-signature-sm" className={`relative flex items-center h-7 w-12 ${className}`}>
        <div className="absolute left-0 w-5 h-5 rounded-full bg-[#9A9CEA] opacity-80 mix-blend-multiply" />
        <div className="absolute left-2 w-5 h-5 rounded-full bg-[#A2B9EE] opacity-80 mix-blend-multiply" />
        <div className="absolute left-4 w-5 h-5 rounded-full bg-[#A2DCEE] opacity-80 mix-blend-multiply" />
        <div className="absolute left-6 w-5 h-5 rounded-full bg-[#ADEEE2] opacity-80 mix-blend-multiply" />
      </div>
    );
  }

  if (size === 'md') {
    return (
      <div id="brand-signature-md" className={`relative flex items-center h-10 w-20 ${className}`}>
        <div className="absolute left-0 w-8 h-8 rounded-full bg-[#9A9CEA] opacity-80 mix-blend-multiply" />
        <div className="absolute left-3 w-8 h-8 rounded-full bg-[#A2B9EE] opacity-80 mix-blend-multiply" />
        <div className="absolute left-6 w-8 h-8 rounded-full bg-[#A2DCEE] opacity-80 mix-blend-multiply" />
        <div className="absolute left-9 w-8 h-8 rounded-full bg-[#ADEEE2] opacity-80 mix-blend-multiply" />
      </div>
    );
  }

  if (size === 'lg') {
    return (
      <div id="brand-signature-lg" className={`relative flex items-center h-16 w-32 ${className}`}>
        <div className="absolute left-0 w-12 h-12 rounded-full bg-[#9A9CEA] opacity-75 mix-blend-multiply transition-transform hover:scale-105" />
        <div className="absolute left-5 w-12 h-12 rounded-full bg-[#A2B9EE] opacity-75 mix-blend-multiply transition-transform hover:scale-105" />
        <div className="absolute left-10 w-12 h-12 rounded-full bg-[#A2DCEE] opacity-75 mix-blend-multiply transition-transform hover:scale-105" />
        <div className="absolute left-15 w-12 h-12 rounded-full bg-[#ADEEE2] opacity-75 mix-blend-multiply transition-transform hover:scale-105" />
      </div>
    );
  }

  if (size === 'hero') {
    return (
      <div id="brand-signature-hero" className={`relative flex items-center justify-center h-32 w-64 ${className}`}>
        <div className="absolute -left-2 w-24 h-24 rounded-full bg-[#9A9CEA] opacity-70 blur-[1px] mix-blend-multiply" />
        <div className="absolute left-10 w-24 h-24 rounded-full bg-[#A2B9EE] opacity-70 blur-[1px] mix-blend-multiply" />
        <div className="absolute left-22 w-24 h-24 rounded-full bg-[#A2DCEE] opacity-70 blur-[1px] mix-blend-multiply" />
        <div className="absolute left-34 w-24 h-24 rounded-full bg-[#ADEEE2] opacity-70 blur-[1px] mix-blend-multiply" />
      </div>
    );
  }

  // Soft atmospheric background
  return (
    <div
      id="brand-signature-bg"
      className={`pointer-events-none absolute overflow-hidden w-full h-full inset-0 -z-10 ${className}`}
    >
      <div className="absolute -top-24 -left-24 w-96 h-96 rounded-full bg-[#9A9CEA]/15 blur-3xl" />
      <div className="absolute top-10 left-36 w-80 h-80 rounded-full bg-[#A2B9EE]/15 blur-3xl" />
      <div className="absolute top-32 left-80 w-72 h-72 rounded-full bg-[#A2DCEE]/15 blur-3xl" />
      <div className="absolute -top-10 left-[30rem] w-80 h-80 rounded-full bg-[#ADEEE2]/15 blur-3xl" />
      <div className="absolute -bottom-32 right-10 w-96 h-96 rounded-full bg-[#A2DCEE]/10 blur-3xl" />
    </div>
  );
};
