
import React from 'react';
import { AIMode } from '../types';

interface HeaderProps {
  mode: AIMode;
  isSidebarOpen: boolean;
  onToggleSidebar: () => void;
}

const Header: React.FC<HeaderProps> = ({ mode, isSidebarOpen, onToggleSidebar }) => {
  const getModeTitle = () => {
    switch (mode) {
      case AIMode.CHAT: return 'Reasoning & Chat';
      case AIMode.IMAGE: return 'Creative Synthesis';
      case AIMode.LIVE: return 'Real-time Multimodal';
      case AIMode.SEARCH: return 'World Knowledge';
      default: return 'Astra AI';
    }
  };

  return (
    <header className="h-16 border-b border-white/5 flex items-center justify-between px-6 glass-panel z-10">
      <div className="flex items-center gap-4">
        {!isSidebarOpen && (
          <button 
            onClick={onToggleSidebar}
            className="p-2 hover:bg-white/10 rounded-lg transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
        )}
        <h2 className="text-xl font-semibold tracking-tight gradient-text">
          {getModeTitle()}
        </h2>
      </div>

      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2 px-3 py-1 bg-blue-500/10 border border-blue-500/20 rounded-full">
          <div className="w-2 h-2 rounded-full bg-blue-400 animate-pulse"></div>
          <span className="text-xs font-medium text-blue-400">Gemini 3 Pro Active</span>
        </div>
      </div>
    </header>
  );
};

export default Header;
