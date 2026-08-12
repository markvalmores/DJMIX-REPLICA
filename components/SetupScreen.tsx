
import React, { useState, useRef } from 'react';
import { UserProfile, SongSlot } from '../types';
import { generateProceduralNotes } from '../constants';

interface SetupScreenProps {
  onComplete: (p: UserProfile, s: SongSlot[]) => void;
  initialSlots: SongSlot[];
}

const SetupScreen: React.FC<SetupScreenProps> = ({ onComplete, initialSlots }) => {
  const [profile, setProfile] = useState<UserProfile>({ name: '', avatar: null, level: 1, exp: 0 });
  const [slots, setSlots] = useState<SongSlot[]>(initialSlots);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const handleAvatar = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) setProfile({ ...profile, avatar: URL.createObjectURL(file) });
  };

  const handleVideo = (index: number, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Clean up previous URL if exists
      if (slots[index].videoUrl) {
        URL.revokeObjectURL(slots[index].videoUrl!);
      }

      const url = URL.createObjectURL(file);
      // Generate thumbnail
      const tempVideo = document.createElement('video');
      tempVideo.src = url;
      tempVideo.currentTime = 2; // Grab frame at 2 seconds
      tempVideo.onloadeddata = () => {
        const canvas = document.createElement('canvas');
        canvas.width = 320;
        canvas.height = 180;
        const ctx = canvas.getContext('2d');
        ctx?.drawImage(tempVideo, 0, 0, 320, 180);
        const thumb = canvas.toDataURL('image/jpeg');
        const newSlots = [...slots];
        newSlots[index] = { 
          ...newSlots[index], 
          videoUrl: url, 
          thumbnail: thumb, 
          name: file.name.split('.')[0],
          notes: [] // Notes will be populated during RhythmGame initialization
        };
        setSlots(newSlots);
      };
    }
  };

  const removeVideo = (index: number, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    const newSlots = [...slots];
    if (newSlots[index].videoUrl) {
      URL.revokeObjectURL(newSlots[index].videoUrl!);
    }
    
    newSlots[index] = {
      ...newSlots[index],
      videoUrl: null,
      thumbnail: null,
      name: `SLOT ${index + 1}`,
      notes: []
    };
    setSlots(newSlots);
  };

  return (
    <div className="w-full h-full bg-[#0a0a0f] p-12 flex flex-col items-center overflow-y-auto">
      <h1 className="text-4xl font-black font-orbitron text-cyan-400 mb-12">SYSTEM INITIALIZATION</h1>
      
      <div className="max-w-4xl w-full grid grid-cols-1 md:grid-cols-2 gap-12">
        <section className="space-y-6 bg-white/5 p-8 rounded-2xl border border-white/10">
          <h2 className="text-xl font-bold text-white uppercase tracking-widest">Player Profile</h2>
          <div className="flex items-center gap-6">
            <label className="w-24 h-24 rounded-full border-2 border-dashed border-cyan-500/50 flex items-center justify-center cursor-pointer overflow-hidden bg-black">
              {profile.avatar ? <img src={profile.avatar} className="w-full h-full object-cover" /> : <i className="fas fa-camera text-gray-600"></i>}
              <input type="file" className="hidden" accept="image/*" onChange={handleAvatar} />
            </label>
            <input 
              type="text" 
              placeholder="ENTER DJ NAME"
              className="flex-grow bg-black border-b-2 border-cyan-500 p-4 text-xl font-bold text-white focus:outline-none"
              value={profile.name}
              onChange={(e) => setProfile({ ...profile, name: e.target.value.toUpperCase() })}
            />
          </div>
        </section>

        <section className="space-y-6">
          <h2 className="text-xl font-bold text-white uppercase tracking-widest">Data Slots (9)</h2>
          <div className="grid grid-cols-3 gap-4">
            {slots.map((slot, i) => (
              <label key={i} className={`group relative aspect-video rounded-lg border-2 border-dashed flex items-center justify-center cursor-pointer overflow-hidden transition-all ${slot.videoUrl ? 'border-cyan-500 shadow-[0_0_10px_#0ff]' : 'border-gray-700 hover:border-gray-500'}`}>
                {slot.thumbnail ? (
                  <>
                    <img src={slot.thumbnail} className="w-full h-full object-cover" />
                    <div 
                      onClick={(e) => removeVideo(i, e)}
                      className="absolute top-1 right-1 w-6 h-6 bg-red-600 rounded-full flex items-center justify-center text-white text-[10px] opacity-0 group-hover:opacity-100 transition-opacity z-10 hover:bg-red-500"
                    >
                      <i className="fas fa-times"></i>
                    </div>
                  </>
                ) : (
                  <div className="text-center">
                    <div className="text-xs text-gray-600">SLOT {i+1}</div>
                    <i className="fas fa-plus text-gray-700 mt-1"></i>
                  </div>
                )}
                <input type="file" className="hidden" accept="video/*" onChange={(e) => handleVideo(i, e)} />
              </label>
            ))}
          </div>
        </section>
      </div>

      <button 
        disabled={!profile.name || !slots.some(s => s.videoUrl)}
        onClick={() => onComplete(profile, slots)}
        className="mt-12 px-12 py-4 bg-cyan-500 text-black font-black font-orbitron text-xl rounded-full disabled:opacity-20 transition-all hover:scale-105 active:scale-95 shadow-[0_0_30px_rgba(0,255,255,0.4)]"
      >
        ACCESS SYSTEM
      </button>
    </div>
  );
};

export default SetupScreen;
