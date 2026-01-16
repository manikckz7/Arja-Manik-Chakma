
import React from 'react';
import { AIMode } from '../types';

interface SidebarProps {
  isOpen: boolean;
  currentMode: AIMode;
  onModeChange: (mode: AIMode) => void;
  toggleSidebar: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ isOpen, currentMode, onModeChange, toggleSidebar }) => {
  const menuItems = [
    { mode: AIMode.CHAT, label: 'Advanced Chat', icon: 'M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z' },
    { mode: AIMode.SEARCH, label: 'Search Grounding', icon: 'M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z' },
    { mode: AIMode.IMAGE, label: 'Image Generation', icon: 'M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z' },
    { mode: AIMode.LIVE, label: 'Live Interaction', icon: 'M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z' },
  ];

  if (!isOpen) return null;

  return (
    <aside className="w-72 h-full bg-gray-900 border-r border-white/5 flex flex-col transition-all duration-300">
      <div className="p-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-blue-600 to-purple-600 flex items-center justify-center font-bold text-white shadow-lg shadow-blue-500/20">
            A
          </div>
          <h1 className="text-xl font-bold tracking-tighter">ASTRA <span className="text-blue-500">AI</span></h1>
        </div>
        <button onClick={toggleSidebar} className="text-gray-400 hover:text-white transition-colors">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 19l-7-7 7-7m8 14l-7-7 7-7" />
          </svg>
        </button>
      </div>

      <nav className="flex-1 px-4 py-6 space-y-2">
        {menuItems.map((item) => (
          <button
            key={item.mode}
            onClick={() => onModeChange(item.mode)}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group ${
              currentMode === item.mode 
              ? 'bg-blue-600/10 text-blue-400 border border-blue-500/20 shadow-sm' 
              : 'text-gray-400 hover:bg-white/5 hover:text-gray-100'
            }`}
          >
            <svg className={`w-5 h-5 ${currentMode === item.mode ? 'text-blue-400' : 'text-gray-500 group-hover:text-gray-300'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={item.icon} />
            </svg>
            <span className="font-medium">{item.label}</span>
          </button>
        ))}
      </nav>

      <div className="p-4 mt-auto">
        <div className="p-4 bg-gray-800/50 rounded-2xl border border-white/5">
          <p className="text-xs text-gray-500 mb-2">PRO PLAN STATUS</p>
          <div className="w-full bg-gray-700 h-1.5 rounded-full overflow-hidden mb-3">
            <div className="bg-blue-500 h-full w-3/4"></div>
          </div>
          <p className="text-xs font-medium text-gray-300">Unlimited API Usage</p>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
