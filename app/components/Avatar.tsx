'use client';

import React from 'react';
import { motion } from 'framer-motion';

interface AvatarProps {
  isThinking?: boolean;
}

export default function Avatar({ isThinking = false }: AvatarProps) {
  return (
    <motion.div
      animate={{
        scale: isThinking ? [1, 1.1, 1] : 1,
        opacity: isThinking ? [0.8, 1, 0.8] : 1
      }}
      transition={{
        duration: 1.5,
        repeat: isThinking ? Infinity : 0,
        ease: "easeInOut"
      }}
      className="relative w-12 h-12 sm:w-16 sm:h-16"
    >
      <div className="rounded-full w-full h-full bg-gradient-to-br from-red-500 to-red-600 flex items-center justify-center text-white text-xl sm:text-2xl">
        🔍
      </div>
      {isThinking && (
        <div className="absolute -bottom-2 left-1/2 transform -translate-x-1/2 text-xs text-gray-500 whitespace-nowrap">
          Analyzing...
        </div>
      )}
    </motion.div>
  );
} 