'use client';

import React, { ReactNode } from 'react';
import { motion } from 'framer-motion';

interface StaggerContainerProps {
  children: ReactNode;
  className?: string;
  delay?: number;
  staggerChildren?: number;
  delayChildren?: number;
}

const StaggerContainer: React.FC<StaggerContainerProps> = ({
  children,
  className = '',
  delay = 0,
  staggerChildren = 0.1,
  delayChildren = 0
}) => {
  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={{
        hidden: {},
        visible: {
          transition: {
            staggerChildren,
            delayChildren
          }
        }
      }}
      transition={{ delay }}
      className={className}
    >
      {children}
    </motion.div>
  );
};

export default StaggerContainer;