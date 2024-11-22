import React from 'react';
import { motion } from 'framer-motion';

const Card = ({ 
  children,
  className = '',
  hover = false,
  ...props 
}) => {
  const Component = hover ? motion.div : 'div';
  const hoverProps = hover ? {
    whileHover: { scale: 1.02 },
    transition: { type: 'spring', stiffness: 300 }
  } : {};

  return (
    <Component
      className={`
        bg-white dark:bg-gray-800
        rounded-lg shadow-md
        p-6
        ${className}
      `}
      {...hoverProps}
      {...props}
    >
      {children}
    </Component>
  );
};

export default Card;