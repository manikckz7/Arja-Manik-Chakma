
import React from 'react';

export const COLORS = {
  primary: '#3b82f6',
  secondary: '#8b5cf6',
  accent: '#f472b6',
  background: '#030712',
  surface: '#111827',
};

export const ICONS = {
  AI_LOGO: (
    <svg className="w-8 h-8" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="50" cy="50" r="45" stroke="url(#paint0_linear)" strokeWidth="10"/>
      <path d="M50 20V80M20 50H80" stroke="white" strokeWidth="6" strokeLinecap="round"/>
      <defs>
        <linearGradient id="paint0_linear" x1="0" y1="0" x2="100" y2="100" gradientUnits="userSpaceOnUse">
          <stop stopColor="#3B82F6"/>
          <stop offset="1" stopColor="#8B5CF6"/>
        </linearGradient>
      </defs>
    </svg>
  ),
};
