import React from 'react';

const Avatar = ({ 
  src, 
  alt, 
  size = 'md',
  status,
  className = '' 
}) => {
  const sizes = {
    sm: 'w-8 h-8',
    md: 'w-10 h-10',
    lg: 'w-12 h-12'
  };

  const statusColors = {
    online: 'bg-green-500',
    offline: 'bg-gray-500',
    busy: 'bg-red-500',
    away: 'bg-yellow-500'
  };

  return (
    <div className="relative inline-block">
      <img
        src={src}
        alt={alt}
        className={`
          ${sizes[size]}
          rounded-full object-cover
          ${className}
        `}
      />
      {status && (
        <span className={`
          absolute bottom-0 right-0
          w-3 h-3 rounded-full
          border-2 border-white dark:border-gray-800
          ${statusColors[status]}
        `} />
      )}
    </div>
  );
};

export default Avatar;