import React, { useState, useEffect, useRef } from "react";
import {
  ArrowLeft,
  Play,
  X,
  Share2,
  Heart,
  Instagram,
  Send,
  Link2,
  MoreHorizontal,
  Check,
  VolumeX,
  AlertCircle,
} from "lucide-react";
import { VideoCard } from "../components/VideoCard";
import { config } from "../config";
import type { VideoItem } from "../types";
import { useNavigate, useSearchParams } from "react-router-dom";

interface TemplatesPageProps {
  title: string;
  filter?: "popular" | "all";
  likedVideos: number[];
  onToggleLike: (id: number) => void;
}

export const TemplatesPage: React.FC<TemplatesPageProps> = ({
  title,
  filter,
  likedVideos,
  onToggleLike,
}) => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [selectedVideo, setSelectedVideo] = useState<VideoItem | null>(() => {
    const videoId = searchParams.get("videoId");

    if (videoId) {
      return config.videos.find((v) => v.id === parseInt(videoId)) ?? null;
    }

    return null;
  });
  const [showOverlay, setShowOverlay] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(true);
  const [showSocials, setShowSocials] = useState(false);
  const [showShareSheet, setShowShareSheet] = useState(false);
  const [isCopied, setIsCopied] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isVisible, setIsVisible] = useState(false);

  // Filter state
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false);

  const videoRef = useRef<HTMLVideoElement>(null);

  // Swipe Variables
  const touchStartY = useRef<number | null>(null);
  const touchStartX = useRef<number | null>(null);
  const minSwipeDistance = 50;

  useEffect(() => {
    const timer = setTimeout(() => setIsVisible(true), 100);
    return () => clearTimeout(timer);
  }, []);

  // Reset state when video changes
  useEffect(() => {
    if (selectedVideo) {
      setIsPlaying(false);
      // setIsMuted(true); olib tashlandi, avvalgi holat saqlanadi
      setShowOverlay(false);
      setShowSocials(false);
      setShowShareSheet(false);
      setHasError(false);
      setIsLoading(true);

      const timer = setTimeout(() => {
        setShowOverlay(true);
      }, 500);

      // Majburiy yuklash mobil qurilmalar uchu
      if (videoRef.current) {
        // Agar tanlangan muted holati bo'lsa uni ta'minlash:
        videoRef.current.muted = isMuted;
        videoRef.current.load();
        const playPromise = videoRef.current.play();
        if (playPromise !== undefined) {
          playPromise.catch(e => {
            console.warn("Autoplay prevented by browser", e);
            setIsPlaying(false);
          });
        }
      }

      return () => clearTimeout(timer);
    }
  }, [selectedVideo]);

  // SWIPE LOGIC
  const onTouchStart = (e: React.TouchEvent<HTMLDivElement>) => {
    touchStartY.current = e.targetTouches[0].clientY;
    touchStartX.current = e.targetTouches[0].clientX;
  };

  const onTouchEnd = (e: React.TouchEvent<HTMLDivElement>) => {
    if (touchStartY.current === null || touchStartX.current === null) return;

    const touchEndY = e.changedTouches[0].clientY;
    const touchEndX = e.changedTouches[0].clientX;

    const distanceY = touchStartY.current - touchEndY;
    const distanceX = touchStartX.current - touchEndX;

    // Check if horizontal swipe is dominant and significant
    if (Math.abs(distanceX) > Math.abs(distanceY)) {
      if (Math.abs(distanceX) > minSwipeDistance) {
        // Swipe Left -> Next Video
        if (distanceX > 0) changeVideo("next");
        // Swipe Right -> Prev Video
        else changeVideo("prev");
      }
    } else {
      // Vertical swipe is dominant
      if (Math.abs(distanceY) > minSwipeDistance) {
        // Swipe Up -> Next Video
        if (distanceY > 0) changeVideo("next");
        // Swipe Down -> Prev Video
        else changeVideo("prev");
      }
    }

    touchStartY.current = null;
    touchStartX.current = null;
  };

  const changeVideo = (direction: "next" | "prev") => {
    if (!selectedVideo) return;
    const currentList = getFilteredVideos();
    const currentIndex = currentList.findIndex(
      (v) => v.id === selectedVideo.id
    );
    if (currentIndex === -1) return;

    const total = currentList.length;
    let newIndex;
    if (direction === "next") {
      newIndex = (currentIndex + 1) % total;
    } else {
      newIndex = (currentIndex - 1 + total) % total;
    }
    setSelectedVideo(currentList[newIndex]);
  };

  const handleVideoReady = () => {
    setIsLoading(false);
    if (videoRef.current && videoRef.current.paused) {
      videoRef.current.play().catch(() => {
        setIsPlaying(false);
        console.log("Play interrupted");
      });
    }
  };

  const handleVideoError = (
    e: React.SyntheticEvent<HTMLVideoElement, Event>
  ) => {
    const mediaError = e.currentTarget.error;
    // Don't report error if user just aborted loading (navigated away)
    if (mediaError?.code === MediaError.MEDIA_ERR_ABORTED) return;

    console.error("Video Playback Error:", {
      code: mediaError?.code,
      message: mediaError?.message || "Unknown error",
      src: e.currentTarget.src,
    });
    setHasError(true);
    setIsLoading(false);
    setIsPlaying(false);
  };

  const handleMainClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!videoRef.current || hasError) return;

    if (isMuted) {
      videoRef.current.muted = false;
      setIsMuted(false);
      // Ensure it's playing
      if (videoRef.current.paused) {
        videoRef.current.play().then(() => setIsPlaying(true));
      }
    } else {
      if (videoRef.current.paused) {
        videoRef.current
          .play()
          .then(() => setIsPlaying(true))
          .catch(() => setIsPlaying(false));
      } else {
        videoRef.current.pause();
        setIsPlaying(false);
      }
    }
  };

  const getTelegramLink = () => {
    if (!selectedVideo) return "#";
    const message = `Assalomu Alaykum! Men sayt orqali ushbu taklifnoma dizaynini buyurtma qilmoqchiman.\n\n🎬 Dizayn: ${selectedVideo.title}, Havola: ${window.location.href}`;
    return `https://t.me/+998993955537?text=${encodeURIComponent(message)}`;
  };

  const handleShareClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowShareSheet(true);
  };

  const handleCopyLink = async () => {
    if (!selectedVideo) return;
    try {
      await navigator.clipboard.writeText(window.location.href);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy", err);
    }
  };

  const handleTelegramShare = () => {
    if (!selectedVideo) return;
    const text = `Ajoyib taklifnoma dizayni: ${selectedVideo.title}`;
    const url = window.location.href;
    window.open(
      `https://t.me/share/url?url=${encodeURIComponent(
        url
      )}&text=${encodeURIComponent(text)}`,
      "_blank"
    );
  };

  const handleSystemShare = async () => {
    if (!selectedVideo) return;
    const shareData = {
      title: selectedVideo.title,
      text: `Taklifnoma dizayni: ${selectedVideo.title} | Creative_designuz`,
      url: window.location.href,
    };
    if (navigator.share) {
      try {
        await navigator.share(shareData);
      } catch (err) {
        console.log("Share skipped");
      }
    } else {
      handleCopyLink();
    }
  };

  const getFilteredVideos = () => {
    let videos =
      filter === "popular" ? config.videos.slice(0, 4) : config.videos;
    if (showFavoritesOnly) {
      videos = videos.filter((v) => likedVideos.includes(v.id));
    }
    return videos;
  };

  const handleVideoClick = (video: VideoItem | null) => {
    if (video) {
      setSelectedVideo(video);
      setSearchParams({ videoId: video.id.toString() });
    } else {
      setSelectedVideo(null);
      setSearchParams({});
    }
  };

  const displayVideos = getFilteredVideos();
  const featuredVideos = config.videos.slice(0, 5);
  const isSelectedLiked = selectedVideo
    ? likedVideos.includes(selectedVideo.id)
    : false;

  return (
    <>
      <div className={`w-full transition-all duration-1000 pb-10 max-w-md mx-auto ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>

        <div className="sticky top-0 z-20 bg-[#FAF9F6]/90 backdrop-blur-xl px-6 py-4 flex items-center justify-between mb-2 border-b border-stone-100/50 shadow-sm transition-all duration-300">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate("/")}
              className="p-2 -ml-2 rounded-full hover:bg-stone-100 transition-colors text-stone-600 active:scale-95"
            >
              <ArrowLeft size={20} />
            </button>
            <h2 className="text-lg font-serif font-medium text-stone-800">
              {showFavoritesOnly ? "Sevimlilar" : title}
            </h2>
          </div>
          <button
            onClick={() => setShowFavoritesOnly(!showFavoritesOnly)}
            className={`
              p-2.5 rounded-full transition-all duration-300 active:scale-90 border
              ${showFavoritesOnly
                ? "bg-rose-50 text-rose-500 border-rose-200 shadow-inner"
                : "bg-transparent text-stone-400 border-transparent hover:bg-stone-50"
              }
            `}
          >
            <Heart
              size={22}
              fill={showFavoritesOnly ? "currentColor" : "none"}
              strokeWidth={showFavoritesOnly ? 0 : 2}
            />
          </button>
        </div>

        {!showFavoritesOnly && (
          <div className={`mb-8 pt-2 transition-all duration-700 ease-in-out ${selectedVideo ? 'scale-90 opacity-0 blur-xl' : 'scale-100 opacity-100 blur-0'}`}>
            <div className="px-6 mb-4 flex items-center justify-between">
              <h3 className="text-sm font-serif font-bold text-stone-800">
                Top Dizaynlar
              </h3>
              <span className="text-[10px] text-stone-400 tracking-wider uppercase">
                Surib ko'ring
              </span>
            </div>

            <div className="flex overflow-x-auto snap-x snap-mandatory gap-4 px-6 pb-8 no-scrollbar items-center">
              {featuredVideos.map((video, index) => (
                <div
                  key={`slider-${video.id}`}
                  className="snap-center shrink-0 w-[68vw] sm:w-[256px] transition-transform duration-500"
                  style={{ animationDelay: `${index * 100}ms` }}
                >
                  <div
                    onClick={() => handleVideoClick(video)}
                    className="group relative w-full aspect-[9/14] rounded-2xl overflow-hidden shadow-[0_10px_30px_rgba(0,0,0,0.12)] bg-stone-200 border border-white/60 cursor-pointer active:scale-[0.98] transition-transform"
                  >
                    <img
                      src={video.image}
                      alt={video.title}
                      loading={index < 2 ? "eager" : "lazy"}
                      decoding="async"
                      className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/10 opacity-80" />

                    <div className="absolute bottom-6 left-6 right-6 text-white translate-y-2 group-hover:translate-y-0 transition-transform duration-500 flex justify-center">
                      <h4 className="inline-block px-4 py-1.5 bg-white/10 backdrop-blur-md border border-white/20 rounded-full text-[10px] font-semibold text-white tracking-[0.2em] uppercase shadow-sm">
                        {video.title}
                      </h4>
                    </div>
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-16 h-16 rounded-full bg-white/30 backdrop-blur-md border border-white/50 flex items-center justify-center shadow-lg animate-fade-in">
                      <Play
                        size={24}
                        className="fill-white text-white ml-1 opacity-90"
                      />
                    </div>
                  </div>
                </div>
              ))}
              <div className="snap-center shrink-0 w-2" />
            </div>
          </div>
        )}

        <div className="px-6 min-h-[50vh]">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-serif font-bold text-stone-800 opacity-90">
              {showFavoritesOnly ? "Saqlanganlar" : "Barchasi"}
            </h3>
            {showFavoritesOnly && (
              <span className="text-xs text-stone-400">
                {displayVideos.length} ta dizayn
              </span>
            )}
          </div>

          {displayVideos.length > 0 ? (
            <div className={`grid grid-cols-2 gap-x-4 gap-y-6 transition-all duration-700 ease-in-out ${selectedVideo ? 'scale-90 opacity-0 blur-xl' : 'scale-100 opacity-100 blur-0'}`}>
              {displayVideos.map((video, index) => (
                <RevealWrapper key={video.id} index={index}>
                  <VideoCard
                    title={video.title}
                    image={video.image}
                    onClick={() => handleVideoClick(video)}
                  />
                </RevealWrapper>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-20 text-center animate-fade-in">
              <div className="w-16 h-16 bg-stone-100 rounded-full flex items-center justify-center mb-4 text-stone-300">
                <Heart size={32} />
              </div>
              <p className="text-stone-500 font-medium text-sm">
                Hozircha sevimlilar yo'q
              </p>
            </div>
          )}
        </div>
      </div>

      {selectedVideo && (
        <>
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black animate-fade-in touch-none">
            <button
              onClick={() => handleVideoClick(null)}
              className="absolute top-6 right-6 z-30 w-10 h-10 rounded-full bg-white/10 backdrop-blur-md flex items-center justify-center text-white hover:bg-white/20 transition-colors"
            >
              <X size={24} />
            </button>

            <div
              className="relative bg-black cursor-pointer overflow-hidden shadow-2xl md:rounded-2xl flex flex-col justify-center"
              style={{
                width: "auto",
                height: "auto",
                maxWidth: "100%",
                maxHeight: "100dvh",
                aspectRatio: "9/16",
              }}
              onClick={handleMainClick}
              onTouchStart={onTouchStart}
              onTouchEnd={onTouchEnd}
            >
              {/* Standard Video Player */}
              {!hasError ? (
                <video
                  ref={videoRef}
                  src={selectedVideo.videoUrl}
                  poster={selectedVideo.image}
                  playsInline
                  webkit-playsinline="true"
                  autoPlay
                  muted={isMuted}
                  preload="metadata"
                  className="w-full h-full object-cover bg-stone-900"
                  onCanPlay={handleVideoReady}
                  onWaiting={() => setIsLoading(true)}
                  onPlaying={() => {
                    setIsPlaying(true);
                    setIsLoading(false);
                  }}
                  onPause={() => setIsPlaying(false)}
                  onVolumeChange={() => {
                    if (videoRef.current) setIsMuted(videoRef.current.muted);
                  }}
                  onError={handleVideoError}
                  loop
                />
              ) : (
                <div className="absolute inset-0 flex flex-col items-center justify-center text-white p-6 text-center">
                  <AlertCircle size={48} className="text-red-400 mb-4" />
                  <h3 className="text-lg font-bold mb-2">
                    Videoni yuklab bo'lmadi
                  </h3>
                  <p className="text-sm text-white/60">
                    Internet aloqasini tekshiring yoki keyinroq urinib ko'ring.
                  </p>
                </div>
              )}

              {/* Loading / Play Indicator */}
              {isLoading && !hasError && !isPlaying && (
                <div className="absolute inset-0 flex items-center justify-center z-10 pointer-events-none animate-scale-in">
                  <div className="w-16 h-16 bg-black/30 backdrop-blur-md rounded-full flex items-center justify-center border border-white/20">
                    <div className="w-10 h-10 rounded-full border-2 border-white/80 border-t-transparent animate-spin opacity-80" />
                  </div>
                </div>
              )}

              {/* Play Icon (when paused and loaded) */}
              {!isLoading && !isPlaying && !hasError && (
                <div className="absolute inset-0 flex items-center justify-center z-10 pointer-events-none animate-scale-in">
                  <div className="w-20 h-20 bg-black/30 backdrop-blur-md rounded-full flex items-center justify-center border border-white/20">
                    <Play size={32} className="fill-white text-white ml-2" />
                  </div>
                </div>
              )}

              {/* Mute Indicator / Unmute CTA */}
              {isMuted && isPlaying && !hasError && (
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-10 pointer-events-none animate-pulse-soft">
                  <div className="bg-black/40 backdrop-blur-md px-4 py-2 rounded-full text-white/90 text-xs font-medium border border-white/10 flex items-center gap-2">
                    <VolumeX size={14} /> Ovozni yoqish
                  </div>
                </div>
              )}

              {/* VIDEO OVERLAY CONTROLS */}
              <div
                className={`
                absolute bottom-0 left-0 w-full p-8 bg-gradient-to-t from-black/90 via-black/50 to-transparent pointer-events-auto
                transition-all duration-500 ease-out transform
                ${showOverlay
                    ? "opacity-100 translate-y-0"
                    : "opacity-0 translate-y-10"
                  }
            `}
              >
                <h3 className="text-white font-serif text-2xl mb-4 drop-shadow-md">
                  {selectedVideo.title}
                </h3>

                <div
                  className="flex gap-4"
                  onClick={(e) => e.stopPropagation()}
                >
                  {!showSocials ? (
                    <button
                      onClick={() => setShowSocials(true)}
                      className="flex-1 py-4 bg-[#229ED9] text-white rounded-xl font-medium text-sm hover:bg-[#1c81b4] flex items-center justify-center gap-2 active:scale-95 transition-transform shadow-lg shadow-blue-500/30"
                    >
                      <Share2 size={18} />
                      Buyurtma berish
                    </button>
                  ) : (
                    <div className="flex-1 flex gap-3 animate-fade-in">
                      <a
                        href="https://www.instagram.com/creative_designuz/"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex-1 py-4 bg-gradient-to-tr from-[#f09433] via-[#dc2743] to-[#bc1888] text-white rounded-xl flex items-center justify-center shadow-lg active:scale-95 transition-transform"
                      >
                        <Instagram size={24} />
                      </a>
                      <a
                        href={getTelegramLink()}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex-1 py-4 bg-[#229ED9] text-white rounded-xl flex items-center justify-center shadow-lg active:scale-95 transition-transform"
                      >
                        <Send size={24} />
                      </a>
                    </div>
                  )}

                  {/* SHARE BUTTON */}
                  <button
                    onClick={handleShareClick}
                    className="w-14 h-14 rounded-xl backdrop-blur-md flex items-center justify-center border border-white/20 bg-white/10 text-white hover:bg-white/20 transition-all duration-300 active:scale-95"
                  >
                    <Send
                      size={24}
                      className="-rotate-12 translate-x-0.5 translate-y-0.5"
                    />
                  </button>

                  <button
                    onClick={() => onToggleLike(selectedVideo.id)}
                    className={`
                     w-14 h-14 rounded-xl backdrop-blur-md flex items-center justify-center border transition-all duration-300 active:scale-75
                     ${isSelectedLiked
                        ? "bg-rose-500 text-white border-rose-500 shadow-[0_0_20px_rgba(244,63,94,0.5)]"
                        : "bg-white/10 text-white border-white/20 hover:bg-white/20"
                      }
                   `}
                  >
                    <Heart
                      size={24}
                      fill={isSelectedLiked ? "currentColor" : "none"}
                      className={isSelectedLiked ? "animate-pulse-soft" : ""}
                    />
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Share Sheet code remains the same as before */}
          {showShareSheet && (
            <div className="fixed inset-0 z-[60] flex items-end justify-center sm:items-center pointer-events-auto animate-fade-in">
              <div
                className="absolute inset-0 bg-black/50 backdrop-blur-sm"
                onClick={() => setShowShareSheet(false)}
              />
              <div className="relative w-full max-w-sm bg-white rounded-t-[32px] sm:rounded-[32px] p-8 shadow-2xl transform transition-transform animate-[fadeInUp_0.3s_ease-out]">
                <div className="w-12 h-1.5 bg-stone-200 rounded-full mx-auto mb-6"></div>
                <div className="flex items-center justify-between mb-8">
                  <h3 className="font-serif text-xl text-stone-900 font-semibold">
                    Ulashish
                  </h3>
                  <button
                    onClick={() => setShowShareSheet(false)}
                    className="p-2 bg-stone-100 rounded-full text-stone-500"
                  >
                    <X size={20} />
                  </button>
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <button
                    onClick={handleTelegramShare}
                    className="flex flex-col items-center gap-3 group"
                  >
                    <div className="w-16 h-16 rounded-2xl bg-[#229ED9] text-white flex items-center justify-center shadow-lg group-active:scale-90 transition-transform">
                      <Send
                        size={28}
                        className="-rotate-3 translate-x-0.5 translate-y-0.5"
                      />
                    </div>
                    <span className="text-xs font-medium text-stone-600">
                      Telegram
                    </span>
                  </button>
                  <button
                    onClick={handleCopyLink}
                    className="flex flex-col items-center gap-3 group"
                  >
                    <div className="w-16 h-16 rounded-2xl bg-stone-100 text-stone-700 flex items-center justify-center shadow-sm border border-stone-200 group-active:scale-90 transition-transform">
                      {isCopied ? (
                        <Check size={28} className="text-green-500" />
                      ) : (
                        <Link2 size={28} />
                      )}
                    </div>
                    <span className="text-xs font-medium text-stone-600">
                      {isCopied ? "Nusxalandi" : "Nusxa olish"}
                    </span>
                  </button>
                  <button
                    onClick={handleSystemShare}
                    className="flex flex-col items-center gap-3 group"
                  >
                    <div className="w-16 h-16 rounded-2xl bg-stone-800 text-white flex items-center justify-center shadow-lg group-active:scale-90 transition-transform">
                      <MoreHorizontal size={28} />
                    </div>
                    <span className="text-xs font-medium text-stone-600">
                      Boshqalar
                    </span>
                  </button>
                </div>
                <div className="mt-8 p-4 bg-stone-50 rounded-xl border border-stone-100 flex items-center gap-3 text-stone-400">
                  <Link2 size={16} />
                  <span className="text-xs truncate flex-1">
                    {window.location.host}/...
                  </span>
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </>
  );
};

const RevealWrapper = ({ children, index }: { children: React.ReactNode, index: number }) => {
  const [inView, setInView] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setInView(true);
          observer.unobserve(entry.target);
        }
      },
      { threshold: 0.05, rootMargin: '100px' }
    );

    if (ref.current) {
      observer.observe(ref.current);
    }

    return () => observer.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      className={`transition-all duration-1000 ease-out ${inView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-16'}`}
      style={{ transitionDelay: `${(index % 2) * 100}ms` }}
    >
      {children}
    </div>
  );
};
