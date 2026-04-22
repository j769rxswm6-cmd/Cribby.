import React, { useState } from 'react';
import { Baby, MonitorSmartphone, LayoutTemplate, Settings as SettingsIcon } from 'lucide-react';
import { cn } from '../lib/utils';
import { motion } from 'motion/react';

interface HomeProps {
  onSelectMode: (mode: 'baby' | 'parent' | 'preview' | 'settings', roomCode?: string) => void;
}

const CribLogo = () => (
  <svg viewBox="0 0 200 200" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-28 h-28 mx-auto mb-2 text-zinc-900 drop-shadow-sm">
    {/* Messy hand-drawn scribbles rocking base */}
    <path d="M30 160 Q 100 180 170 160 M32 163 Q 98 183 168 158 M28 157 Q 102 177 172 162" opacity="0.8" /> 
    {/* Left and Right Posts with multiple strokes */}
    <path d="M40 160 L40 60 M43 158 L42 62 M37 162 L38 58" opacity="0.9" />
    <path d="M160 160 L160 60 M163 158 L162 62 M157 162 L158 58" opacity="0.9" />
    {/* Horizontal Rails */}
    <path d="M40 135 L160 135 M42 138 L158 137" />
    <path d="M40 80 L160 80 M42 83 L158 82" />
    {/* Spindles */}
    <path d="M64 135 L64 80 M66 135 L65 80" />
    <path d="M88 135 L88 80 M90 135 L89 80" />
    <path d="M112 135 L112 80 M114 135 L113 80" />
    <path d="M136 135 L136 80 M138 135 L137 80" />
    {/* Baby sleeping in blanket */}
    <path d="M65 130 C70 95, 135 105, 135 135" fill="currentColor" fillOpacity="0.1" />
    <circle cx="85" cy="118" r="8" fill="currentColor" fillOpacity="0.8" />
    <path d="M82 118 Q85 120 88 118" stroke="white" strokeWidth="1.5" />
    {/* Zzz */}
    <path d="M100 90 l 10 0 l -10 10 l 10 0" strokeWidth="1.5" />
    <path d="M115 80 l 8 0 l -8 8 l 8 0" strokeWidth="1" />
    <path d="M130 95 l 6 0 l -6 6 l 6 0" strokeWidth="1" />
  </svg>
);

export const Home: React.FC<HomeProps> = ({ onSelectMode }) => {
  const [roomCodeInput, setRoomCodeInput] = useState('');

  const handleBabyMode = () => {
    // Generate a random 4-digit code
    const code = Math.floor(1000 + Math.random() * 9000).toString();
    onSelectMode('baby', code);
  };

  const handlePreviewMode = () => {
    // Shared testing code
    onSelectMode('preview', 'TEST');
  };

  const handleParentMode = (e: React.FormEvent) => {
    e.preventDefault();
    if (roomCodeInput.length === 4) {
      onSelectMode('parent', roomCodeInput);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-zinc-100 text-zinc-900 p-6 relative">
      
      <button 
        onClick={() => onSelectMode('settings')}
        className="absolute top-6 right-6 p-2 text-zinc-400 hover:text-zinc-600 transition-colors bg-white rounded-full shadow-sm border border-zinc-200"
        title="Settings"
      >
        <SettingsIcon className="w-5 h-5" />
      </button>

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md space-y-12"
      >
        <div className="text-center space-y-2 relative group">
          <CribLogo />

          <h1 className="text-4xl font-bold tracking-tighter text-zinc-800">
             Cribby.
          </h1>
          <p className="text-xs font-medium uppercase tracking-widest text-zinc-500 border-b border-zinc-200 inline-block pb-1 mt-1">
             Quiet watch, Constant care
          </p>
        </div>

        <div className="space-y-6">
          <button
            onClick={handleBabyMode}
            className="w-full relative group overflow-hidden bg-white hover:bg-zinc-50 border border-zinc-200 rounded-[24px] p-6 shadow-sm transition-all duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-zinc-800 focus:ring-offset-2 focus:ring-offset-zinc-100"
          >
            <div className="flex items-center space-x-4">
              <div className="flex-shrink-0 bg-zinc-100 p-3 rounded-full shadow-[inset_0_2px_4px_rgba(0,0,0,0.02)]">
                <Baby className="w-6 h-6 text-zinc-800" />
              </div>
              <div className="text-left">
                <h3 className="text-sm font-bold text-zinc-900">SETUP AS CAMERA</h3>
                <p className="text-xs text-zinc-500 mt-1 leading-relaxed">Place this device near your baby. It will transmit video and audio.</p>
              </div>
            </div>
          </button>

          <div className="relative">
            <div className="absolute inset-0 flex items-center" aria-hidden="true">
              <div className="w-full border-t border-zinc-200" />
            </div>
            <div className="relative flex justify-center">
              <span className="px-3 bg-zinc-100 text-[10px] font-bold uppercase tracking-widest text-zinc-400">OR</span>
            </div>
          </div>

          <div className="bg-white border border-zinc-200 rounded-[24px] p-6 shadow-sm">
            <div className="flex items-center space-x-4 mb-6">
              <div className="flex-shrink-0 bg-zinc-100 p-3 rounded-full shadow-[inset_0_2px_4px_rgba(0,0,0,0.02)]">
                <MonitorSmartphone className="w-6 h-6 text-zinc-800" />
              </div>
              <div className="text-left">
                <h3 className="text-sm font-bold text-zinc-900">SETUP AS MONITOR</h3>
                <p className="text-xs text-zinc-500 mt-1 leading-relaxed">Watch and listen from this device.</p>
              </div>
            </div>
            
            <form onSubmit={handleParentMode} className="space-y-3">
              <div className="flex gap-2">
                <input
                  type="text"
                  maxLength={4}
                  placeholder="CODE"
                  value={roomCodeInput}
                  onChange={(e) => setRoomCodeInput(e.target.value.replace(/\D/g, ''))}
                  className="flex-1 min-w-0 appearance-none bg-zinc-50 border border-zinc-200 rounded-[16px] px-4 py-3 text-sm text-zinc-900 placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-800 focus:border-transparent text-center font-mono tracking-widest uppercase"
                />
                <button
                  type="submit"
                  disabled={roomCodeInput.length !== 4}
                  className="inline-flex items-center justify-center px-6 py-3 border border-transparent text-xs uppercase font-bold tracking-widest rounded-[16px] text-white bg-zinc-800 hover:bg-zinc-900 disabled:opacity-50 disabled:cursor-not-allowed transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-zinc-800 focus:ring-offset-white"
                >
                  Join
                </button>
              </div>
            </form>
          </div>

          <button
            onClick={handlePreviewMode}
            className="w-full text-center text-[10px] text-zinc-400 font-bold uppercase tracking-widest hover:text-zinc-600 transition-colors pt-4 flex items-center justify-center gap-1"
          >
            <LayoutTemplate className="w-3 h-3" /> PREVIEW UNIFIED EXPERIENCE
          </button>
        </div>
      </motion.div>
    </div>
  );
};
