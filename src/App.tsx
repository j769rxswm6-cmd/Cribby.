import React, { useState } from 'react';
import { Home } from './components/Home';
import { BabyCamera } from './components/BabyCamera';
import { ParentMonitor } from './components/ParentMonitor';
import { Settings } from './components/Settings';

type AppMode = 'home' | 'baby' | 'parent' | 'preview' | 'settings';

export default function App() {
  const [mode, setMode] = useState<AppMode>('home');
  const [roomCode, setRoomCode] = useState<string>('');
  const [refreshRate, setRefreshRate] = useState<number>(1000);

  const handleSelectMode = (selectedMode: 'baby' | 'parent' | 'preview' | 'settings', code?: string) => {
    if (code) setRoomCode(code);
    setMode(selectedMode);
  };

  const handleExit = () => {
    setMode('home');
    setRoomCode('');
  };

  if (mode === 'settings') {
    return <Settings refreshRate={refreshRate} setRefreshRate={setRefreshRate} onBack={() => setMode('home')} />;
  }

  if (mode === 'preview') {
    return (
      <div className="min-h-screen bg-zinc-950 flex flex-col xl:flex-row items-center justify-center p-8 overflow-auto gap-12 relative w-full">
        
        <div className="relative w-full max-w-md shrink-0">
          <div className="absolute -top-8 left-1/2 -translate-x-1/2 text-white/50 text-xs font-bold uppercase tracking-widest whitespace-nowrap">
            Baby Device (Camera)
          </div>
          <div className="h-fit">
            <BabyCamera roomCode={roomCode} onExit={handleExit} refreshRate={refreshRate} />
          </div>
        </div>

        <div className="hidden xl:flex flex-col items-center justify-center border-l border-white/10 h-64 mx-4">
          <div className="bg-white/10 py-2 px-4 rounded-full text-white/50 text-[10px] font-bold uppercase tracking-widest mt-0">
             Same Network
          </div>
        </div>

        <div className="relative w-full max-w-md shrink-0">
          <div className="absolute -top-8 left-1/2 -translate-x-1/2 text-white/50 text-xs font-bold uppercase tracking-widest whitespace-nowrap">
             Parent Device (Monitor)
          </div>
          <div className="h-fit">
             <ParentMonitor roomCode={roomCode} onExit={handleExit} />
          </div>
        </div>

        <button 
          onClick={handleExit} 
          className="fixed bottom-4 right-4 z-50 bg-white text-zinc-900 rounded-full px-6 py-3 font-bold text-xs uppercase tracking-widest shadow-[0_0_40px_rgba(255,255,255,0.2)] hover:scale-105 transition-transform"
        >
          Exit Preview
        </button>
      </div>
    );
  }

  if (mode === 'baby') {
    return <BabyCamera roomCode={roomCode} onExit={handleExit} refreshRate={refreshRate} />;
  }

  if (mode === 'parent') {
    return <ParentMonitor roomCode={roomCode} onExit={handleExit} />;
  }

  return <Home onSelectMode={handleSelectMode} />;
}
