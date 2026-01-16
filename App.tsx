
import React, { useState, useEffect, useRef } from 'react';
import { AIMode, Message } from './types';
import ChatInterface from './components/ChatInterface';
import Sidebar from './components/Sidebar';
import LiveMode from './components/LiveMode';
import Header from './components/Header';

const App: React.FC = () => {
  const [currentMode, setCurrentMode] = useState<AIMode>(AIMode.CHAT);
  const [messages, setMessages] = useState<Message[]>([]);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  // Auto-scroll logic for the main container if needed
  const containerRef = useRef<HTMLDivElement>(null);

  const handleModeChange = (mode: AIMode) => {
    setCurrentMode(mode);
  };

  const addMessage = (message: Message) => {
    setMessages(prev => [...prev, message]);
  };

  return (
    <div className="flex h-screen w-full overflow-hidden bg-gray-950 text-gray-100">
      <Sidebar 
        isOpen={isSidebarOpen} 
        currentMode={currentMode} 
        onModeChange={handleModeChange} 
        toggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
      />
      
      <main className="flex-1 flex flex-col relative overflow-hidden">
        <Header 
          mode={currentMode} 
          onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)} 
          isSidebarOpen={isSidebarOpen}
        />
        
        <div className="flex-1 overflow-hidden relative">
          {currentMode === AIMode.LIVE ? (
            <LiveMode />
          ) : (
            <ChatInterface 
              mode={currentMode} 
              messages={messages.filter(m => {
                if (currentMode === AIMode.CHAT) return m.type === 'text';
                if (currentMode === AIMode.IMAGE) return m.type === 'image';
                if (currentMode === AIMode.SEARCH) return m.type === 'search';
                return true;
              })}
              onSendMessage={addMessage}
            />
          )}
        </div>
      </main>
    </div>
  );
};

export default App;
