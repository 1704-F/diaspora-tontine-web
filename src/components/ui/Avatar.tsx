// src/components/ui/Avatar.tsx
import React from 'react';

interface AvatarProps {
  firstName?: string;
  lastName?: string;
  imageUrl?: string | null;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

const sizeClasses = {
  sm: 'h-8 w-8 text-xs',
  md: 'h-10 w-10 text-sm',
  lg: 'h-12 w-12 text-base',
  xl: 'h-16 w-16 text-lg',
};

// Couleurs pour les avatars
const colors = [
  'bg-blue-500',
  'bg-green-500',
  'bg-purple-500',
  'bg-pink-500',
  'bg-yellow-500',
  'bg-indigo-500',
  'bg-red-500',
  'bg-orange-500',
  'bg-teal-500',
  'bg-cyan-500',
];

export function Avatar({ 
  firstName = '', 
  lastName = '', 
  imageUrl, 
  size = 'md',
  className = '' 
}: AvatarProps) {
  // Générer initiales
  const initials = `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
  
  // Couleur basée sur le nom (déterministe)
  const colorIndex = (firstName.charCodeAt(0) + lastName.charCodeAt(0)) % colors.length;
  const bgColor = colors[colorIndex];

  if (imageUrl) {
    return (
      <div className={`${sizeClasses[size]} rounded-full overflow-hidden ${className}`}>
        <img 
          src={imageUrl} 
          alt={`${firstName} ${lastName}`}
          className="h-full w-full object-cover"
        />
      </div>
    );
  }

  return (
    <div 
      className={`
        ${sizeClasses[size]} 
        ${bgColor} 
        rounded-full 
        flex 
        items-center 
        justify-center 
        text-white 
        font-semibold
        shadow-md
        ${className}
      `}
    >
      {initials || '??'}
    </div>
  );
}