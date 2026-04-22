import React, { useEffect, useRef, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import { ShieldAlert, VideoOff } from 'lucide-react';
import { cn } from '../lib/utils';
import { motion, AnimatePresence } from 'motion/react';

interface BabyCameraProps {
  roomCode: string;
  onExit: () => void;
  refreshRate: number;
}

export const BabyCamera: React.FC<BabyCameraProps> = ({ roomCode, onExit, refreshRate }) => {
  const [error, setError] = useState<string>('');
  const [isConnected, setIsConnected] = useState(false);
  const [hasMotion, setHasMotion] = useState(false);
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const remoteAudioRef = useRef<HTMLAudioElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const socketRef = useRef<Socket | null>(null);
  const pcRef = useRef<RTCPeerConnection | null>(null);
  const motionCanvasRef = useRef<HTMLCanvasElement>(document.createElement('canvas'));
  const prevFrameRef = useRef<Uint8ClampedArray | null>(null);

  useEffect(() => {
    // Setup Socket
    // In dev mode, we connect to exact same port. In prod, same port.
    const socketURL = window.location.protocol + "//" + window.location.host;
    socketRef.current = io(socketURL);
    const socket = socketRef.current;

    const setupMedia = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ 
          video: { facingMode: { ideal: "environment" } }, 
          audio: true 
        });
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }

        socket.emit('join-room', roomCode);

        socket.on('user-joined', async (callerId: string) => {
          setIsConnected(true);
          await createPeerConnection(callerId, stream);
        });

        socket.on('signal', async (data: any) => {
          if (data.signal.type === 'answer') {
            await pcRef.current?.setRemoteDescription(new RTCSessionDescription(data.signal));
          } else if (data.signal.candidate) {
            await pcRef.current?.addIceCandidate(new RTCIceCandidate(data.signal));
          }
        });

      } catch (err) {
        console.error("Error accessing media devices.", err);
        setError("Could not access camera or microphone. Please check permissions.");
      }
    };

    setupMedia();

    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
      pcRef.current?.close();
      socket.disconnect();
    };
  }, [roomCode]);

  useEffect(() => {
    // Motion Detection Loop (controlled by slider)
    const motionInterval = setInterval(() => {
      detectMotion();
    }, refreshRate);

    return () => clearInterval(motionInterval);
  }, [refreshRate]);

  const createPeerConnection = async (callerId: string, stream: MediaStream) => {
    const pc = new RTCPeerConnection({
        iceServers: [{ urls: 'stun:stun.l.google.com:19302' }]
    });
    pcRef.current = pc;

    stream.getTracks().forEach(track => pc.addTrack(track, stream));

    pc.onicecandidate = (event) => {
      if (event.candidate) {
        socketRef.current?.emit('signal', { to: callerId, signal: event.candidate });
      }
    };

    // Receive audio from parent
    pc.ontrack = (event) => {
      if (remoteAudioRef.current) {
        remoteAudioRef.current.srcObject = event.streams[0];
      }
    };

    const offer = await pc.createOffer();
    await pc.setLocalDescription(offer);

    socketRef.current?.emit('signal', { to: callerId, signal: offer });
  };

  const detectMotion = () => {
    const video = videoRef.current;
    if (!video || video.videoWidth === 0 || video.videoHeight === 0) return;

    const canvas = motionCanvasRef.current;
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    if (!ctx) return;

    canvas.width = 64;
    canvas.height = 64;
    ctx.drawImage(video, 0, 0, 64, 64);
    
    const currentFrame = ctx.getImageData(0, 0, 64, 64);
    const data = currentFrame.data;
    
    let changedPixels = 0;
    if (prevFrameRef.current) {
      const prevData = prevFrameRef.current;
      for (let i = 0; i < data.length; i += 4) {
        const rDiff = Math.abs(data[i] - prevData[i]);
        const gDiff = Math.abs(data[i+1] - prevData[i+1]);
        const bDiff = Math.abs(data[i+2] - prevData[i+2]);
        
        // Filter out ambient sensor noise (base threshold per pixel)
        if (rDiff + gDiff + bDiff > 45) {
          changedPixels++;
        }
      }
      
      // Ultra-high sensitivity: if just 10 pixels out of 4096 change significantly
      // This catches very small spatial movements like a baby's finger twitch
      if (changedPixels > 10) {
        setHasMotion(true);
        socketRef.current?.emit('motion-alert', { roomId: roomCode, timestamp: Date.now() });
        setTimeout(() => setHasMotion(false), 3000);
      }
    }
    
    prevFrameRef.current = new Uint8ClampedArray(data);
  };

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-6 text-center">
        <VideoOff className="w-12 h-12 text-red-500 mb-4" />
        <p className="text-gray-900 font-medium">{error}</p>
        <button onClick={onExit} className="mt-6 px-4 py-2 bg-gray-100 rounded-lg text-gray-900 font-medium">Go Back</button>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-[#18181b] relative overflow-hidden md:mx-auto md:my-8 md:max-h-[850px] md:border-8 md:border-zinc-800 md:rounded-[48px] md:shadow-2xl">
      {/* Video Feed */}
      <video 
        ref={videoRef} 
        autoPlay 
        playsInline 
        muted 
        className="absolute inset-0 w-full h-full object-cover opacity-80 -scale-x-100"
      />
      {/* Hidden audio element for parent's voice */}
      <audio ref={remoteAudioRef} autoPlay />

      {/* Header Overlays */}
      <div className="absolute inset-x-0 top-0 p-6 z-10 pointer-events-none">
        <div className="flex justify-between items-start">
          
          <div className="flex flex-col items-start gap-4">
            <div className="bg-white/10 backdrop-blur-md rounded-[20px] p-5 border border-white/10 pointer-events-auto shadow-sm">
              <p className="text-white/50 text-[10px] font-bold uppercase tracking-widest mb-2">Paired Code</p>
              <p className="text-white text-4xl font-mono tracking-widest leading-none">{roomCode}</p>
            </div>
            
            <div className={cn(
              "px-3 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-widest border transition-colors shadow-sm flex items-center space-x-2 pointer-events-auto backdrop-blur-md",
              isConnected ? "bg-white/10 text-white border-white/20" : "bg-black/40 text-yellow-500 border-yellow-500/20"
            )}>
              <div className={cn("w-1.5 h-1.5 rounded-full", isConnected ? "bg-green-400" : "bg-yellow-500 animate-pulse")} />
              <span>{isConnected ? 'Transmitting' : 'Waiting...'}</span>
            </div>
          </div>
          
          <div className="flex flex-col items-end gap-2 pointer-events-auto">
            <button onClick={onExit} className="bg-white/10 hover:bg-white/20 text-white backdrop-blur-md rounded-full w-12 h-12 flex items-center justify-center transition-colors border border-white/10 shadow-sm">
              <VideoOff className="w-5 h-5" />
            </button>

            <AnimatePresence>
              {hasMotion && (
                <motion.div 
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0 }}
                  className="flex items-center space-x-1 bg-red-500/90 text-white shadow-lg border border-red-400/30 px-3 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-widest backdrop-blur-md mt-2"
                >
                  <ShieldAlert className="w-3 h-3" />
                  <span>Motion</span>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

        </div>
      </div>
      
      <div className="absolute inset-x-0 bottom-0 p-8 pt-24 bg-gradient-to-t from-black/80 via-black/40 to-transparent pointer-events-none flex flex-col items-center">
        <p className="text-white/40 text-[10px] font-mono uppercase tracking-widest text-center mt-auto">
            {isConnected ? 'Secure Connection Active' : 'Baby Unit • Connecting'}
        </p>
      </div>
    </div>
  );
};
