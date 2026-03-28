"use client";

import { useRef, useState, useEffect, useCallback } from "react";
import type { CSSProperties } from "react";

interface VideoPlayerProps {
  src: string;
  poster?: string;
  className?: string;
  style?: CSSProperties;
  autoplay?: boolean;
  /** Initial muted state */
  muted?: boolean;
  loop?: boolean;
  hideControls?: boolean;
}

function formatTime(seconds: number): string {
  if (!isFinite(seconds) || seconds < 0) return "0:00";
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}

export function VideoPlayer({
  src,
  poster,
  className,
  style,
  autoplay,
  muted: mutedProp,
  loop,
  hideControls,
}: VideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [playing, setPlaying] = useState(false);
  // Autoplay requires muted in browsers, so force muted when autoplay is on
  const [muted, setMuted] = useState(mutedProp || autoplay || false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [buffered, setBuffered] = useState(0);
  const [hoverX, setHoverX] = useState<number | null>(null);

  const togglePlay = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    const v = videoRef.current;
    if (!v) return;
    if (v.paused) v.play().catch(() => {});
    else v.pause();
  }, []);

  const toggleMute = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    const v = videoRef.current;
    if (!v) return;
    v.muted = !v.muted;
    setMuted(v.muted);
  }, []);

  const handleSeek = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    e.stopPropagation();
    const v = videoRef.current;
    if (!v || !isFinite(v.duration)) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const pct = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    v.currentTime = pct * v.duration;
  }, []);

  const handleProgressHover = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      const rect = e.currentTarget.getBoundingClientRect();
      const pct = Math.max(
        0,
        Math.min(100, ((e.clientX - rect.left) / rect.width) * 100)
      );
      setHoverX(pct);
    },
    []
  );

  const handleFullscreen = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    const container = videoRef.current?.closest(".video-player");
    if (!container) return;
    if (document.fullscreenElement) document.exitFullscreen();
    else container.requestFullscreen();
  }, []);

  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;

    const onPlay = () => setPlaying(true);
    const onPause = () => setPlaying(false);
    const onTimeUpdate = () => {
      setCurrentTime(v.currentTime);
      if (v.buffered.length > 0) {
        setBuffered(
          (v.buffered.end(v.buffered.length - 1) / v.duration) * 100
        );
      }
    };
    const onLoaded = () => setDuration(v.duration);
    const onEnded = () => setPlaying(false);
    const onVolumeChange = () => setMuted(v.muted);

    v.addEventListener("play", onPlay);
    v.addEventListener("pause", onPause);
    v.addEventListener("timeupdate", onTimeUpdate);
    v.addEventListener("loadedmetadata", onLoaded);
    v.addEventListener("ended", onEnded);
    v.addEventListener("volumechange", onVolumeChange);

    return () => {
      v.removeEventListener("play", onPlay);
      v.removeEventListener("pause", onPause);
      v.removeEventListener("timeupdate", onTimeUpdate);
      v.removeEventListener("loadedmetadata", onLoaded);
      v.removeEventListener("ended", onEnded);
      v.removeEventListener("volumechange", onVolumeChange);
    };
  }, []);

  const progress = duration > 0 ? (currentTime / duration) * 100 : 0;
  const remaining = duration - currentTime;
  const hoverTime =
    hoverX != null && duration > 0 ? (hoverX / 100) * duration : 0;

  const hasRadius = className && /\brounded(-|\b)/.test(className);
  const hasAspect = className && /\baspect-/.test(className);

  return (
    <div
      className={`video-player group/video relative ${hasAspect ? "" : "aspect-video"} overflow-hidden ring-1 ring-inset ring-black/10 dark:ring-white/10 ${hasRadius ? "" : "rounded-xl"} ${className || ""}`}
      style={style}
    >
      <video
        ref={videoRef}
        src={src}
        poster={poster}
        className="size-full object-cover"
        preload="metadata"
        playsInline
        autoPlay={autoplay}
        muted={muted}
        loop={loop}
      />

      {/* Click overlay — click to play/pause, double-click to fullscreen */}
      <div
        className="absolute inset-0 cursor-pointer"
        onClick={togglePlay}
        onDoubleClick={handleFullscreen}
      >
        {!playing && (
          <div className="flex size-full items-center justify-center bg-black/10 transition-colors hover:bg-black/20">
            <div className="flex size-14 items-center justify-center rounded-full bg-white/90 shadow-lg backdrop-blur-sm transition-transform hover:scale-105">
              <svg
                className="ml-0.5 size-6 text-zinc-900"
                viewBox="0 0 16 16"
                fill="currentColor"
              >
                <path d="M2.2 2.863C2.2 1.612 3.572 0.845 4.639 1.501L12.986 6.637C14.001 7.262 14.001 8.738 12.986 9.363L4.639 14.499C3.572 15.155 2.2 14.388 2.2 13.137V2.863Z" />
              </svg>
            </div>
          </div>
        )}
      </div>

      {/* Controls bar — slides up on hover, above the click overlay */}
      {!hideControls && (
      <div className="pointer-events-none absolute right-0 bottom-0 left-0 z-10 translate-y-4 transform bg-gradient-to-t from-black/20 to-transparent px-5 pt-10 pb-4 opacity-0 transition duration-150 ease-in will-change-transform group-hover/video:pointer-events-auto group-hover/video:translate-y-0 group-hover/video:opacity-100 group-hover/video:duration-200 group-hover/video:ease-out">
        <div className="flex items-center gap-0.5">
          {/* Play / Pause */}
          <button
            type="button"
            tabIndex={-1}
            aria-label={playing ? "Pause" : "Play"}
            onClick={togglePlay}
            className="group/play relative flex h-8 min-w-8 cursor-pointer items-center justify-center rounded-md p-2 text-white transition duration-100 ease-linear hover:bg-white/20 hover:backdrop-blur-sm"
          >
            {/* Pause icon */}
            <svg
              width="16"
              height="16"
              viewBox="0 0 16 16"
              fill="none"
              className={`absolute size-4 transition duration-100 ease-linear group-active/play:scale-[0.8] ${playing ? "scale-100 opacity-100" : "scale-[0.8] opacity-0"}`}
            >
              <path
                d="M2.2 2.5C2.2 2.224 2.424 2 2.7 2H5.2C5.476 2 5.7 2.224 5.7 2.5V13.5C5.7 13.776 5.476 14 5.2 14H2.7C2.424 14 2.2 13.776 2.2 13.5V2.5Z"
                fill="currentColor"
              />
              <path
                d="M10.2 2.5C10.2 2.224 10.424 2 10.7 2H13.2C13.476 2 13.7 2.224 13.7 2.5V13.5C13.7 13.776 13.476 14 13.2 14H10.7C10.424 14 10.2 13.776 10.2 13.5V2.5Z"
                fill="currentColor"
              />
            </svg>
            {/* Play icon */}
            <svg
              width="16"
              height="16"
              viewBox="0 0 16 16"
              fill="none"
              className={`size-4 transition duration-100 ease-linear group-active/play:scale-[0.8] ${!playing ? "scale-100 opacity-100" : "scale-[0.8] opacity-0"}`}
            >
              <path
                d="M2.2 2.863C2.2 1.612 3.572 0.845 4.639 1.501L12.986 6.637C14.001 7.262 14.001 8.738 12.986 9.363L4.639 14.499C3.572 15.155 2.2 14.388 2.2 13.137V2.863Z"
                fill="currentColor"
              />
            </svg>
          </button>

          {/* Mute / Unmute */}
          <button
            type="button"
            tabIndex={-1}
            aria-label={muted ? "Unmute" : "Mute"}
            onClick={toggleMute}
            className="relative flex h-8 min-w-8 cursor-pointer items-center justify-center rounded-md p-2 text-white transition duration-100 ease-linear hover:bg-white/20 hover:backdrop-blur-sm"
          >
            {muted ? (
              <svg
                viewBox="0 0 24 24"
                width="24"
                height="24"
                stroke="currentColor"
                strokeWidth="2"
                fill="none"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="size-4"
              >
                <path d="M9.635 5.366 6.468 8.53c-.173.173-.26.26-.36.322a1 1 0 0 1-.29.12C5.704 9 5.582 9 5.337 9H3.6c-.56 0-.84 0-1.054.109a1 1 0 0 0-.437.437C2 9.76 2 10.04 2 10.6v2.8c0 .56 0 .84.109 1.054a1 1 0 0 0 .437.437C2.76 15 3.04 15 3.6 15h1.737c.245 0 .367 0 .482.028a1 1 0 0 1 .29.12c.1.061.187.148.36.32l3.165 3.166c.429.429.643.643.827.657a.5.5 0 0 0 .42-.174c.119-.14.119-.443.119-1.048V5.93c0-.606 0-.908-.12-1.049a.5.5 0 0 0-.42-.173c-.183.014-.397.228-.826.657Z" />
                <path d="m22 9-6 6m0-6 6 6" />
              </svg>
            ) : (
              <svg
                viewBox="0 0 24 24"
                width="24"
                height="24"
                stroke="currentColor"
                strokeWidth="2"
                fill="none"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="size-4"
              >
                <path d="M19.748 5A11.946 11.946 0 0 1 22 12c0 2.612-.835 5.03-2.252 7M15.745 8A6.968 6.968 0 0 1 17 12a6.967 6.967 0 0 1-1.255 4M9.635 5.366 6.468 8.53c-.173.173-.26.26-.36.322a1 1 0 0 1-.29.12C5.704 9 5.582 9 5.337 9H3.6c-.56 0-.84 0-1.054.109a1 1 0 0 0-.437.437C2 9.76 2 10.04 2 10.6v2.8c0 .56 0 .84.109 1.054a1 1 0 0 0 .437.437C2.76 15 3.04 15 3.6 15h1.737c.245 0 .367 0 .482.028a1 1 0 0 1 .29.12c.1.061.187.148.36.32l3.165 3.166c.429.429.643.643.827.657a.5.5 0 0 0 .42-.174c.119-.14.119-.443.119-1.048V5.93c0-.606 0-.908-.12-1.049a.5.5 0 0 0-.42-.173c-.183.014-.397.228-.826.657Z" />
              </svg>
            )}
          </button>

          {/* Time + Progress + Remaining */}
          <div className="flex min-w-0 flex-1 items-center gap-2 px-2">
            <span className="pointer-events-none text-xs font-semibold text-white">
              {formatTime(currentTime)}
            </span>

            {/* Progress bar — expanded click target */}
            <div
              className="group/progress -my-8 flex-1 cursor-pointer py-8"
              onClick={handleSeek}
              onMouseMove={handleProgressHover}
              onMouseLeave={() => setHoverX(null)}
            >
              <div className="relative h-2 flex-1 rounded-full bg-white/30">
                {/* Buffered */}
                <div
                  className="pointer-events-none absolute h-full min-w-0.5 rounded-full bg-white/50"
                  style={{ left: "0%", width: `${buffered}%` }}
                />
                {/* Played */}
                <div
                  className="pointer-events-none absolute h-full min-w-0.5 rounded-full bg-white"
                  style={{ width: `${progress}%` }}
                />
                {/* Hover scrub line */}
                {hoverX != null && (
                  <>
                    <div
                      className="pointer-events-none absolute top-1/2 h-8 w-px -translate-y-1/2 bg-white/30 opacity-0 transition duration-100 ease-linear group-hover/progress:opacity-100"
                      style={{ left: `${hoverX}%` }}
                    />
                    {/* Hover time tooltip */}
                    <div
                      className="pointer-events-none absolute bottom-6 -translate-x-1/2 translate-y-2 transform text-xs font-semibold text-white opacity-0 transition-all duration-300 group-hover/progress:translate-y-0 group-hover/progress:opacity-100"
                      style={{ left: `${hoverX}%` }}
                    >
                      {formatTime(hoverTime)}
                    </div>
                  </>
                )}
              </div>
            </div>

            <span className="pointer-events-none text-xs font-semibold text-white">
              -{formatTime(remaining)}
            </span>
          </div>

          {/* Fullscreen */}
          <button
            type="button"
            tabIndex={-1}
            aria-label="Enter fullscreen"
            onClick={handleFullscreen}
            className="flex h-8 min-w-8 cursor-pointer items-center justify-center rounded-md p-2 text-white transition duration-100 ease-linear hover:bg-white/20 hover:backdrop-blur-sm"
          >
            <svg
              viewBox="0 0 24 24"
              width="24"
              height="24"
              stroke="currentColor"
              strokeWidth="2"
              fill="none"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="size-4"
            >
              <path d="m14 10 7-7m0 0h-6m6 0v6m-11 5-7 7m0 0h6m-6 0v-6" />
            </svg>
          </button>
        </div>
      </div>
      )}
    </div>
  );
}
