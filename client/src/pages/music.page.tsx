import React, { useState, useRef, useEffect } from "react";
import {
  ArrowLeft,
  Play,
  Pause,
  Send,
  Disc,
  SkipBack,
  SkipForward,
  X,
  Check,
  Link2,
  MoreHorizontal,
} from "lucide-react";
import { config } from "../config";
import type { MusicItem } from "../types";
import { useNavigate, useSearchParams } from "react-router-dom";

export const MusicPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  
  // Initialize currentTrack from URL parameter if exists
  const [currentTrack, setCurrentTrack] = useState<MusicItem | null>(() => {
    const trackId = searchParams.get("trackId");
    if (trackId) {
      const track = config.music.find((t) => t.id === parseInt(trackId));
      return track || null;
    }
    return null;
  });
  const [isPlaying, setIsPlaying] = useState(false);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);

  // Share Sheet States
  const [showShareSheet, setShowShareSheet] = useState(false);
  const [isCopied, setIsCopied] = useState(false);

  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    const audio = audioRef.current;
    if (audio && currentTrack) {
      if (isPlaying) {
        const playPromise = audio.play();
        if (playPromise !== undefined) {
          playPromise.catch(() => {
            console.warn("Audio playback failed");
            setIsPlaying(false);
          });
        }
      } else {
        audio.pause();
      }
    }

    return () => {
      if (audio) audio.pause();
    };
  }, [isPlaying, currentTrack]);

  const handleTrackClick = (track: MusicItem) => {
    if (currentTrack?.id === track.id) {
      setIsPlaying(!isPlaying);
    } else {
      setCurrentTrack(track);
      // Update URL with track ID for deep linking
      setSearchParams({ trackId: track.id.toString() }, { replace: true });
      setIsPlaying(true);
      setCurrentTime(0);
      setShowShareSheet(false);
      // Optional: Scroll top to ensure player is visible
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  const changeTrack = (direction: "next" | "prev") => {
    if (!currentTrack) return;
    const currentIndex = config.music.findIndex(
      (t) => t.id === currentTrack.id
    );
    if (currentIndex === -1) return;

    let newIndex;
    if (direction === "next") {
      newIndex = (currentIndex + 1) % config.music.length;
    } else {
      newIndex = (currentIndex - 1 + config.music.length) % config.music.length;
    }

    const newTrack = config.music[newIndex];
    setCurrentTrack(newTrack);
    // Update URL with new track ID for deep linking
    setSearchParams({ trackId: newTrack.id.toString() }, { replace: true });
    setIsPlaying(true);
    setCurrentTime(0);
  };

  const onTimeUpdate = () => {
    if (audioRef.current) {
      setCurrentTime(audioRef.current.currentTime);
    }
  };

  const onLoadedMetadata = () => {
    if (audioRef.current) {
      setDuration(audioRef.current.duration);
    }
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const time = parseFloat(e.target.value);
    if (audioRef.current) {
      audioRef.current.currentTime = time;
      setCurrentTime(time);
    }
  };

  const formatTime = (time: number) => {
    if (isNaN(time)) return "0:00";
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds < 10 ? "0" : ""}${seconds}`;
  };

  // --- SHARE LOGIC ---

  const handleShareClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowShareSheet(true);
  };

  const handleCopyLink = async () => {
    if (!currentTrack) return;
    
    try {
      // Create a deep link to the specific music track
      const musicUrl = `${window.location.origin}/music?trackId=${currentTrack.id}`;
      await navigator.clipboard.writeText(musicUrl);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy:", err);
      // Fallback for older browsers
      try {
        const musicUrl = `${window.location.origin}/music?trackId=${currentTrack.id}`;
        const textArea = document.createElement("textarea");
        textArea.value = musicUrl;
        document.body.appendChild(textArea);
        textArea.select();
        document.execCommand("copy");
        document.body.removeChild(textArea);
        setIsCopied(true);
        setTimeout(() => setIsCopied(false), 2000);
      } catch (fallbackErr) {
        console.error("Fallback copy also failed:", fallbackErr);
      }
    }
  };

  const handleTelegramShare = () => {
    if (!currentTrack) return;
    
    // Create a deep link to the specific music track
    const musicUrl = `${window.location.origin}/music?trackId=${currentTrack.id}`;
    const text = `Assalomu alaykum, taklifnoma uchun ushbu musiqani tanladim: \n\n🎵 ${currentTrack.title} - ${currentTrack.author}\n\n🔗 ${musicUrl}`;
    
    // Use Telegram direct message or share URL
    const telegramUrl = `https://t.me/share/url?url=${encodeURIComponent(musicUrl)}&text=${encodeURIComponent(text)}`;
    window.open(telegramUrl, "_blank", "noopener,noreferrer");
  };

  const handleSystemShare = async () => {
    if (!currentTrack) return;
    
    // Create a deep link to the specific music track
    const musicUrl = `${window.location.origin}/music?trackId=${currentTrack.id}`;
    
    const shareData = {
      title: "Taklifnoma Musiqasi",
      text: `🎵 ${currentTrack.title} - ${currentTrack.author}`,
      url: musicUrl,
    };
    
    if (navigator.share) {
      try {
        await navigator.share(shareData);
      } catch (err) {
        // User cancelled share or error occurred
        if ((err as Error).name !== "AbortError") {
          console.error("Share failed:", err);
          // Fallback to copy link
          handleCopyLink();
        }
      }
    } else {
      // Fallback for browsers that don't support Web Share API
      handleCopyLink();
    }
  };

  return (
    <div className="w-full min-h-screen bg-[#FDFCF8] animate-fade-in pb-24 relative max-w-md mx-auto">
      {/* iOS Style Header */}
      <div className="sticky top-0 z-30 bg-[#FDFCF8]/90 backdrop-blur-xl px-6 pt-12 pb-4 flex items-center justify-between transition-all duration-300 border-b border-stone-100">
        <button
          onClick={() => {
            if (audioRef.current) audioRef.current.pause();
            navigate(-1);
          }}
          className="p-2 -ml-2 rounded-full text-stone-800 hover:bg-stone-100/50 active:scale-90 transition-all"
        >
          <ArrowLeft size={24} strokeWidth={2} />
        </button>
        <h2 className="absolute left-1/2 -translate-x-1/2 text-[17px] font-sans font-semibold text-stone-900 tracking-tight">
          Musiqa Tanlash
        </h2>
        <div className="w-10" />
      </div>

      <div className="px-5 pt-4 pb-10">
        {/* ACTIVE PLAYER CARD (FIXED POSITION) */}
        {currentTrack && (
          <div className="w-full bg-white rounded-[32px] p-6 shadow-[0_20px_50px_-12px_rgba(0,0,0,0.1)] border border-stone-50 mb-8 animate-scale-in relative z-20">
            {/* Big Album Art with Elegant Visualizer */}
            <div className="w-full aspect-square rounded-[36px] bg-[#FAFAFA] mb-8 flex items-center justify-center relative overflow-visible isolate">
              {/* Soft Ambient Glow */}
              <div
                className={`absolute inset-4 bg-gradient-to-tr from-stone-200 to-stone-100 rounded-full blur-[40px] transition-all duration-1000 -z-10 ${
                  isPlaying ? "opacity-80 scale-105" : "opacity-30 scale-95"
                }`}
              ></div>

              {/* Elegant Ripples - Contained but soft */}
              {isPlaying && (
                <>
                  <div className="absolute inset-0 m-auto w-[90%] h-[90%] rounded-full border border-stone-200/50 bg-stone-50/20 animate-ripple-elegant-1 -z-10"></div>
                  <div className="absolute inset-0 m-auto w-[90%] h-[90%] rounded-full border border-stone-200/40 bg-stone-50/10 animate-ripple-elegant-2 -z-10"></div>
                  <div className="absolute inset-0 m-auto w-[90%] h-[90%] rounded-full border border-stone-200/30 bg-stone-50/5 animate-ripple-elegant-3 -z-10"></div>
                </>
              )}

              {/* Central Spinning Disc - Clean and Minimal */}
              <div
                className={`
                        relative z-10 w-[70%] h-[70%] rounded-full bg-white 
                        shadow-[0_15px_35px_-5px_rgba(0,0,0,0.1),inset_0_-5px_20px_rgba(0,0,0,0.02)] 
                        flex items-center justify-center border-[6px] border-white
                        transition-all duration-1000
                        ${
                          isPlaying
                            ? "scale-105 shadow-[0_25px_45px_-10px_rgba(0,0,0,0.15)]"
                            : "scale-100"
                        }
                    `}
              >
                <div
                  className={`w-full h-full rounded-full flex items-center justify-center overflow-hidden relative ${
                    isPlaying ? "animate-spin-slow" : ""
                  }`}
                >
                  <div className="absolute inset-0 bg-gradient-to-br from-stone-100 to-transparent opacity-50"></div>
                  <Disc
                    size={110}
                    strokeWidth={0.5}
                    className="text-stone-300 opacity-60"
                  />
                </div>

                {/* Static Minimal Center */}
                <div className="absolute w-20 h-20 bg-[#FDFCF8] rounded-full shadow-[0_5px_15px_-5px_rgba(0,0,0,0.08)] flex items-center justify-center border border-stone-50">
                  <div className="w-2 h-2 bg-stone-300 rounded-full"></div>
                </div>
              </div>
            </div>

            {/* Title Section */}
            <div className="flex items-start justify-between mb-8 px-1">
              <div className="min-w-0 pr-4">
                <h3 className="text-2xl font-medium text-stone-900 leading-tight mb-1 font-serif tracking-tight">
                  {currentTrack.title}
                </h3>
                <p className="text-stone-400 text-sm tracking-wide">
                  {currentTrack.author}
                </p>
              </div>

              <button
                onClick={handleShareClick}
                className="w-12 h-12 rounded-full bg-stone-50 text-stone-800 flex items-center justify-center hover:bg-stone-100 active:scale-90 transition-all border border-stone-100"
              >
                <Send size={20} className="-ml-0.5 mt-0.5" strokeWidth={1.5} />
              </button>
            </div>

            {/* Progress Bar - Minimal */}
            <div className="mb-4 px-1">
              <input
                type="range"
                min="0"
                max={duration || 100}
                value={currentTime}
                onChange={handleSeek}
                className="w-full h-1 bg-stone-100 rounded-full appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:bg-stone-800 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:shadow-sm hover:[&::-webkit-slider-thumb]:scale-125 transition-all"
              />
              <div className="flex justify-between mt-3 text-[10px] font-medium text-stone-300 tracking-wider font-sans uppercase">
                <span>{formatTime(currentTime)}</span>
                <span>{formatTime(duration)}</span>
              </div>
            </div>

            {/* Controls - Elegant */}
            <div className="flex items-center justify-center gap-10 mt-2">
              <button
                onClick={() => changeTrack("prev")}
                className="text-stone-300 hover:text-stone-600 transition-colors active:scale-90 p-2"
              >
                <SkipBack size={26} strokeWidth={1.5} />
              </button>

              <button
                onClick={() => setIsPlaying(!isPlaying)}
                className="w-18 h-18 rounded-full text-stone-900 flex items-center justify-center hover:scale-105 active:scale-95 transition-all"
              >
                {isPlaying ? (
                  <div className="w-16 h-16 rounded-full bg-stone-900 text-white flex items-center justify-center shadow-lg shadow-stone-900/20">
                    <Pause size={24} fill="currentColor" />
                  </div>
                ) : (
                  <div className="w-16 h-16 rounded-full bg-stone-900 text-white flex items-center justify-center shadow-lg shadow-stone-900/20">
                    <Play size={24} fill="currentColor" className="ml-1" />
                  </div>
                )}
              </button>

              <button
                onClick={() => changeTrack("next")}
                className="text-stone-300 hover:text-stone-600 transition-colors active:scale-90 p-2"
              >
                <SkipForward size={26} strokeWidth={1.5} />
              </button>
            </div>
          </div>
        )}

        {/* TRACK LIST - Refined */}
        <div className="flex flex-col gap-2 relative z-10">
          {config.music.map((track) => {
            const isActive = currentTrack?.id === track.id;

            return (
              <div
                key={track.id}
                onClick={() => handleTrackClick(track)}
                className={`
                        group flex items-center justify-between p-4 rounded-[24px] cursor-pointer active:scale-[0.99] transition-all duration-500
                        ${
                          isActive
                            ? "bg-white shadow-[0_10px_30px_-10px_rgba(0,0,0,0.08)]"
                            : "bg-transparent hover:bg-white/60"
                        }
                    `}
              >
                <div className="flex items-center gap-5">
                  <div
                    className={`
                            w-10 h-10 rounded-full flex items-center justify-center transition-all duration-500
                            ${
                              isActive
                                ? "bg-stone-900 text-white shadow-md scale-110"
                                : "bg-stone-100 text-stone-400 group-hover:bg-white"
                            }
                        `}
                  >
                    {isActive && isPlaying ? (
                      <Pause size={14} fill="currentColor" />
                    ) : (
                      <Play size={14} fill="currentColor" className="ml-0.5" />
                    )}
                  </div>
                  <div>
                    <h4
                      className={`text-[15px] font-medium font-serif tracking-tight transition-colors ${
                        isActive ? "text-stone-900" : "text-stone-600"
                      }`}
                    >
                      {track.title}
                    </h4>
                    <p className="text-[11px] text-stone-400 tracking-wide mt-0.5">
                      {track.author}
                    </p>
                  </div>
                </div>
                {isActive && (
                  <div className="pr-2">
                    <div className="flex gap-1 items-end h-4">
                      <div className="w-0.5 h-full bg-stone-800 rounded-full animate-[bounce_1s_infinite]"></div>
                      <div className="w-0.5 h-full bg-stone-800 rounded-full animate-[bounce_1.4s_infinite]"></div>
                      <div className="w-0.5 h-full bg-stone-800 rounded-full animate-[bounce_0.8s_infinite]"></div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* SHARE SHEET MODAL */}
      {showShareSheet && (
        <div className="fixed inset-0 z-[60] flex items-end justify-center sm:items-center pointer-events-auto animate-fade-in touch-none">
          <div
            className="absolute inset-0 bg-stone-100/60 backdrop-blur-md transition-opacity"
            onClick={() => setShowShareSheet(false)}
          />
          <div className="relative w-full max-w-sm bg-white rounded-t-[40px] sm:rounded-[40px] p-8 shadow-[0_-10px_40px_rgba(0,0,0,0.1)] transform transition-transform animate-[fadeInUp_0.3s_ease-out]">
            <div className="w-10 h-1 bg-stone-200/50 rounded-full mx-auto mb-8"></div>
            <div className="flex items-center justify-between mb-8">
              <h3 className="font-serif text-2xl text-stone-900">Ulashish</h3>
              <button
                onClick={() => setShowShareSheet(false)}
                className="p-2 bg-stone-50 rounded-full text-stone-400 hover:bg-stone-100 transition-colors"
              >
                <X size={20} />
              </button>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <button
                onClick={handleTelegramShare}
                className="flex flex-col items-center gap-3 group"
              >
                <div className="w-16 h-16 rounded-[24px] bg-[#229ED9] text-white flex items-center justify-center shadow-lg shadow-blue-200 group-active:scale-95 transition-all">
                  <Send
                    size={26}
                    className="-rotate-3 translate-x-0.5 translate-y-0.5"
                    strokeWidth={1.5}
                  />
                </div>
                <span className="text-[11px] font-medium text-stone-500 tracking-wide">
                  Telegram
                </span>
              </button>
              <button
                onClick={handleCopyLink}
                className="flex flex-col items-center gap-3 group"
              >
                <div className="w-16 h-16 rounded-[24px] bg-stone-50 text-stone-600 flex items-center justify-center border border-stone-100 group-active:scale-95 transition-all">
                  {isCopied ? (
                    <Check size={26} className="text-green-500" />
                  ) : (
                    <Link2 size={26} strokeWidth={1.5} />
                  )}
                </div>
                <span className="text-[11px] font-medium text-stone-500 tracking-wide">
                  {isCopied ? "Nusxalandi" : "Nusxa"}
                </span>
              </button>
              <button
                onClick={handleSystemShare}
                className="flex flex-col items-center gap-3 group"
              >
                <div className="w-16 h-16 rounded-[24px] bg-stone-900 text-white flex items-center justify-center shadow-lg group-active:scale-95 transition-all">
                  <MoreHorizontal size={26} />
                </div>
                <span className="text-[11px] font-medium text-stone-500 tracking-wide">
                  Boshqalar
                </span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Hidden Audio Player Element */}
      {currentTrack && (
        <audio
          ref={audioRef}
          src={currentTrack.url}
          preload="auto"
          onTimeUpdate={onTimeUpdate}
          onLoadedMetadata={onLoadedMetadata}
          onEnded={() => changeTrack("next")} // Auto play next track
          onError={() => setIsPlaying(false)}
        />
      )}
    </div>
  );
};
