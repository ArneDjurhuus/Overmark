'use client';

import { motion } from 'framer-motion';
import { ReactNode } from 'react';

interface GlassCardProps {
  children: ReactNode;
  className?: string;
  onClick?: () => void;
}

export default function GlassCard({ children, className = '', onClick }: GlassCardProps) {
  return (
    <motion.div
      className={`glass rounded-2xl p-6 shadow-xl ${className}`}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      transition={{ type: "spring", stiffness: 300, damping: 20 }}
      onClick={onClick}
    >
      {children}
    </motion.div>
  );
}

export function GlassButton({ 
  children, 
  onClick, 
  className = '',
  type = 'button',
  disabled = false 
}: { 
  children: ReactNode; 
  onClick?: () => void; 
  className?: string;
  type?: 'button' | 'submit' | 'reset';
  disabled?: boolean;
}) {
  return (
    <motion.button
      type={type}
      disabled={disabled}
      className={`glass rounded-xl px-6 py-3 font-semibold min-h-[48px] flex items-center justify-center ${
        disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'
      } ${className}`}
      whileHover={disabled ? {} : { scale: 1.05, boxShadow: "0 10px 30px rgba(0,0,0,0.2)" }}
      whileTap={disabled ? {} : { scale: 0.95 }}
      transition={{ type: "spring", stiffness: 400, damping: 17 }}
      onClick={onClick}
    >
      {children}
    </motion.button>
  );
}
