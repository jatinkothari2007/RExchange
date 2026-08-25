import React, { useState, useRef } from 'react';
import { Play, Pause, Mic, Volume2 } from 'lucide-react';

interface VoiceNotePlayerProps {
  url: string;
}

export const VoiceNotePlayer: React.FC<VoiceNotePlayerProps> = ({ url }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const toggle = () => {
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      audioRef.current.play();
      setIsPlaying(true);
    }
  };

  return (
    <div className="p-3.5 rounded-2xl bg-slate-900 border border-slate-700/80 flex items-center justify-between shadow-sm">
      <audio
        ref={audioRef}
        src={url}
        onEnded={() => setIsPlaying(false)}
        className="hidden"
      />

      <div className="flex items-center space-x-3">
        <button
          onClick={toggle}
          className="w-9 h-9 rounded-full bg-amber-400 text-black flex items-center justify-center hover:bg-amber-300 transition-all shadow-md shrink-0"
        >
          {isPlaying ? <Pause className="w-4 h-4 fill-current" /> : <Play className="w-4 h-4 fill-current ml-0.5" />}
        </button>

        <div>
          <div className="flex items-center space-x-1.5 text-xs font-bold text-white">
            <Mic className="w-3.5 h-3.5 text-amber-400" />
            <span>20s Peer Voice Note</span>
          </div>
          <p className="text-[10px] text-slate-400">Listen to tutor pitch & session overview</p>
        </div>
      </div>

      <div className="flex items-center space-x-1 pr-2">
        <div className="w-1 h-3 bg-amber-400/60 rounded-full animate-pulse" />
        <div className="w-1 h-5 bg-amber-400 rounded-full animate-pulse" style={{ animationDelay: '150ms' }} />
        <div className="w-1 h-2 bg-amber-400/80 rounded-full animate-pulse" style={{ animationDelay: '300ms' }} />
        <div className="w-1 h-4 bg-amber-400 rounded-full animate-pulse" style={{ animationDelay: '450ms' }} />
      </div>
    </div>
  );
};
