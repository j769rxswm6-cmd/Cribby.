import React from 'react';
import { ArrowLeft, Settings as SettingsIcon } from 'lucide-react';
import { motion } from 'motion/react';

interface SettingsProps {
  refreshRate: number;
  setRefreshRate: (val: number) => void;
  onBack: () => void;
}

export const Settings: React.FC<SettingsProps> = ({ refreshRate, setRefreshRate, onBack }) => {
  return (
    <div className="flex flex-col min-h-screen bg-zinc-100 text-zinc-900 p-6 relative">
      <motion.div 
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        className="w-full max-w-md mx-auto space-y-8 mt-12"
      >
        <button 
          onClick={onBack} 
          className="flex items-center space-x-2 text-zinc-500 hover:text-zinc-900 transition-colors absolute top-6 left-6"
        >
          <ArrowLeft className="w-5 h-5" />
          <span className="font-bold text-[10px] uppercase tracking-widest">Back</span>
        </button>
        
        <div>
          <h1 className="text-3xl font-light tracking-tighter text-zinc-800 flex items-center gap-3">
            <SettingsIcon className="w-7 h-7 text-zinc-500" /> Settings
          </h1>
          <p className="text-xs uppercase tracking-widest text-zinc-500 mt-2">Adjust Cribby Preferences</p>
        </div>

        <div className="bg-white border border-zinc-200 rounded-[24px] p-6 shadow-sm space-y-6">
          <div>
            <h3 className="text-sm font-bold text-zinc-900 mb-1">Motion Detection Sensitivity</h3>
            <p className="text-xs text-zinc-500 leading-relaxed mb-6">Adjust how frequently the camera scans for small movements. Faster refresh detects tinier motions but may consume slightly more battery.</p>
            
            <div className="flex justify-between text-[9px] text-zinc-400 uppercase tracking-widest mb-3 font-mono">
              <span>Fast (500ms)</span>
              <span>Relaxed (10s)</span>
            </div>
            
            <input 
              type="range" 
              min="500" 
              max="10000" 
              step="500" 
              value={refreshRate}
              onChange={(e) => setRefreshRate(Number(e.target.value))}
              className="w-full accent-zinc-800"
            />
            
            <div className="text-center mt-4">
              <span className="inline-block bg-zinc-100 px-3 py-1.5 rounded-full text-[10px] text-zinc-600 font-mono uppercase tracking-widest shadow-[inset_0_1px_2px_rgba(0,0,0,0.05)] border border-zinc-200">
                 Refresh Interval: <strong className="text-zinc-900">{refreshRate >= 1000 ? `${(refreshRate / 1000).toFixed(1)}s` : `${refreshRate}ms`}</strong>
              </span>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
};
