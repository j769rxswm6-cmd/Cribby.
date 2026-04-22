import React, { useEffect, useRef, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import { Mic, MicOff, PhoneOff, ShieldAlert, FlipHorizontal, Volume2, VolumeX, Smartphone } from 'lucide-react';
import { cn } from '../lib/utils';
import { motion, AnimatePresence } from 'motion/react';

interface ParentMonitorProps {
  roomCode: string;
  onExit: () => void;
}

export const ParentMonitor: React.FC<ParentMonitorProps> = ({ roomCode, onExit }) => {
  const [error, setError] = useState<string>('');
  const [isConnected, setIsConnected] = useState(false);
  const [isTalking, setIsTalking] = useState(false);
  const [isMirrored, setIsMirrored] = useState(true);
  const [motionAlertTime, setMotionAlertTime] = useState<number>(0);
  
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [vibrateEnabled, setVibrateEnabled] = useState(true);
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const socketRef = useRef<Socket | null>(null);
  const pcRef = useRef<RTCPeerConnection | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const audioTrackRef = useRef<MediaStreamTrack | null>(null);
  const alertTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  const soundRef = useRef(soundEnabled);
  const vibrateRef = useRef(vibrateEnabled);

  useEffect(() => { soundRef.current = soundEnabled; }, [soundEnabled]);
  useEffect(() => { vibrateRef.current = vibrateEnabled; }, [vibrateEnabled]);

  const playBeep = () => {
    try {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioContextClass) return;
      const ctx = new AudioContextClass();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.type = "sine";
      osc.frequency.setValueAtTime(880, ctx.currentTime);
      gain.gain.setValueAtTime(0.1, ctx.currentTime);
      osc.start();
      osc.stop(ctx.currentTime + 0.15);
      
      setTimeout(() => {
        if (ctx.state !== "closed") {
           const osc2 = ctx.createOscillator();
           const gain2 = ctx.createGain();
           osc2.connect(gain2);
           gain2.connect(ctx.destination);
           osc2.type = "sine";
           osc2.frequency.setValueAtTime(1046.50, ctx.currentTime);
           gain2.gain.setValueAtTime(0.1, ctx.currentTime);
           osc2.start();
           osc2.stop(ctx.currentTime + 0.15);
        }
      }, 150);
    } catch(e) {
      console.warn("AudioContext error", e);
    }
  };

  useEffect(() => {
    const socketURL = window.location.protocol + "//" + window.location.host;
    socketRef.current = io(socketURL);
    const socket = socketRef.current;

    const initConnection = async () => {
      try {
        // Attempt to get audio for two-way comms
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
        localStreamRef.current = stream;
        const audioTrack = stream.getAudioTracks()[0];
        if (audioTrack) {
          audioTrack.enabled = false; // Initially muted
          audioTrackRef.current = audioTrack;
        }

        socket.emit('join-room', roomCode);

      } catch (err) {
        console.error("Could not access microphone format", err);
        setError("Microphone access is recommended for two-way audio.");
        // We still join the room to receive video even if no mix
        socket.emit('join-room', roomCode);
      }
    };

    socket.on('signal', async (data: any) => {
      const { from, signal } = data;
      
      if (signal.type === 'offer') {
        setIsConnected(true);
        const pc = new RTCPeerConnection({
          iceServers: [{ urls: 'stun:stun.l.google.com:19302' }]
        });
        pcRef.current = pc;

        // Add local audio stream if available
        if (localStreamRef.current) {
          localStreamRef.current.getTracks().forEach(track => {
            pc.addTrack(track, localStreamRef.current!);
          });
        }

        pc.onicecandidate = (event) => {
          if (event.candidate) {
            socket.emit('signal', { to: from, signal: event.candidate });
          }
        };

        pc.ontrack = (event) => {
          if (videoRef.current) {
            videoRef.current.srcObject = event.streams[0];
          }
        };

        await pc.setRemoteDescription(new RTCSessionDescription(signal));
        const answer = await pc.createAnswer();
        await pc.setLocalDescription(answer);

        socket.emit('signal', { to: from, signal: answer });
      } else if (signal.candidate && pcRef.current) {
        await pcRef.current.addIceCandidate(new RTCIceCandidate(signal));
      }
    });

    socket.on('motion-alert', (data: any) => {
      setMotionAlertTime(Date.now());
      
      if (soundRef.current) {
        playBeep();
      }
      if (vibrateRef.current && navigator.vibrate) {
        navigator.vibrate([200, 100, 200]);
      }

      if (alertTimeoutRef.current) clearTimeout(alertTimeoutRef.current);
      alertTimeoutRef.current = setTimeout(() => {
        setMotionAlertTime(0);
      }, 5000);
    });

    initConnection();

    return () => {
      if (alertTimeoutRef.current) clearTimeout(alertTimeoutRef.current);
      if (localStreamRef.current) localStreamRef.current.getTracks().forEach(t => t.stop());
      pcRef.current?.close();
      socket.disconnect();
    };
  }, [roomCode]);

  const toggleMic = () => {
    if (audioTrackRef.current) {
      const newState = !isTalking;
      audioTrackRef.current.enabled = newState;
      setIsTalking(newState);
    }
  };

  const showMotionAlert = motionAlertTime > 0;

  return (
    <div className="flex flex-col min-h-screen bg-white text-zinc-900 relative h-[100dvh] overflow-hidden md:max-w-md md:mx-auto md:my-8 md:max-h-[850px] md:border-8 md:border-zinc-800 md:rounded-[48px] md:shadow-2xl">
      {/* Video Area (Camera Feed) */}
      <div className="relative w-full h-[50vh] bg-[#18181b] flex items-center justify-center flex-shrink-0">
        <video 
          ref={videoRef} 
          autoPlay 
          playsInline 
          className={cn("w-full h-full object-cover transition-transform duration-300", isMirrored ? "-scale-x-100" : "")}
        />

        {/* Header Badges */}
        <div className="absolute top-4 left-4 z-20">
          <div className="bg-white/10 backdrop-blur-md rounded-full px-3 py-1 font-semibold tracking-wider text-[10px] uppercase text-white shadow-sm flex items-center space-x-2">
            <div className={cn("w-1.5 h-1.5 rounded-full", isConnected ? "bg-green-400" : "bg-yellow-400 animate-pulse")} />
            <span>{isConnected ? 'Live Feed' : 'Connecting...'}</span>
          </div>
        </div>

        <div className="absolute top-4 right-4 z-20 flex items-center space-x-2">
          <button 
            onClick={() => setIsMirrored(!isMirrored)}
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 transition-colors backdrop-blur-md flex items-center justify-center border border-white/20 text-white shadow-sm"
            title="Mirror Video"
          >
            <FlipHorizontal className="w-4 h-4" />
          </button>
          
          <button 
            onClick={onExit}
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 transition-colors backdrop-blur-md flex items-center justify-center border border-white/20 text-white shadow-sm"
          >
            <PhoneOff className="w-4 h-4" />
          </button>
        </div>
        
        {!isConnected && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
             <div className="text-zinc-400 text-sm italic">Connecting to Baby...</div>
          </div>
        )}

        <div className="absolute bottom-4 right-4 text-white font-mono text-xs opacity-50 uppercase tracking-widest">
           CAM 01 // {roomCode}
        </div>
      </div>

      {/* Controls Area */}
      <div className="p-6 flex-1 flex flex-col bg-white">
        <div className="flex justify-between items-start mb-8">
          <div className="space-y-1">
            <h1 className="text-2xl font-bold text-zinc-900 tracking-tight">Nursery</h1>
            <p className="text-xs text-zinc-500 uppercase tracking-widest">Status: Monitoring</p>
          </div>
        </div>

        <div className="flex justify-center flex-1 items-center mb-8">
          <div className="text-center group">
            <button
              onClick={toggleMic}
              disabled={!isConnected}
              className={cn(
                "w-16 h-16 rounded-full flex items-center justify-center text-white border-none transition-all outline-none mx-auto mb-2 shadow-lg hover:shadow-xl",
                isTalking ? "bg-red-500 scale-105 animate-pulse" : "bg-zinc-800 hover:bg-zinc-900 disabled:opacity-50"
              )}
            >
               {isTalking ? <Mic className="w-6 h-6" /> : <MicOff className="w-6 h-6 opacity-80" />}
            </button>
            <p className="text-[10px] uppercase font-bold text-zinc-400 tracking-widest">
              {isTalking ? "Tap to Mute" : "Tap to Talk"}
            </p>
          </div>
        </div>

        <div className="bg-zinc-100 rounded-[24px] p-4 flex items-center justify-between mt-auto">
           <div className="flex items-center space-x-3">
             <div className={cn("w-2 h-2 rounded-full", showMotionAlert ? "bg-red-500 animate-pulse" : "bg-zinc-400")} />
             <div>
               <p className="text-xs font-bold text-zinc-900">Motion Alerts</p>
               <AnimatePresence mode="wait">
                 {showMotionAlert ? (
                   <motion.div
                     key="detected"
                     initial={{ opacity: 0 }}
                     animate={{ opacity: 1 }}
                     exit={{ opacity: 0 }}
                     className="text-[10px] text-red-500 font-bold uppercase tracking-widest mt-0.5"
                   >
                     Detected
                   </motion.div>
                 ) : (
                   <motion.div
                     key="standby"
                     initial={{ opacity: 0 }}
                     animate={{ opacity: 1 }}
                     exit={{ opacity: 0 }}
                     className="text-[10px] text-zinc-500 uppercase tracking-widest mt-0.5"
                   >
                     Standby
                   </motion.div>
                 )}
               </AnimatePresence>
             </div>
           </div>
           
           <div className="flex items-center space-x-2">
             <button title="Sound Alerts" onClick={() => setSoundEnabled(!soundEnabled)} className={cn("w-9 h-9 flex justify-center items-center rounded-full transition-colors", soundEnabled ? "bg-white text-zinc-800 shadow-sm" : "bg-zinc-200 text-zinc-400")}>
               {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
             </button>
             <button title="Vibration Alerts" onClick={() => setVibrateEnabled(!vibrateEnabled)} className={cn("w-9 h-9 flex justify-center items-center rounded-full transition-colors", vibrateEnabled ? "bg-white text-zinc-800 shadow-sm" : "bg-zinc-200 text-zinc-400")}>
               <Smartphone className="w-4 h-4" />
             </button>
           </div>
        </div>
      </div>
      
      {error && (
        <div className="absolute top-1/2 left-4 right-4 -translate-y-1/2 bg-red-50 border border-red-200 text-red-600 p-4 rounded-[16px] text-sm text-center shadow-lg z-50">
          {error}
        </div>
      )}
    </div>
  );
};
