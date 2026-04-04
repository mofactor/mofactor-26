"use client";

import * as React from "react";
import { ChevronLeft, ChevronRight, XIcon, ZoomIn, ZoomOut } from "lucide-react";
import { Dialog as DialogPrimitive } from "@base-ui/react/dialog";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/Button";

export type LightboxImage = {
  src: string;
  alt: string;
};

type LightboxProps = {
  images: LightboxImage[];
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  index?: number;
  onIndexChange?: (index: number) => void;
  children?: React.ReactNode;
  className?: string;
};

function Lightbox({
  images,
  open: controlledOpen,
  onOpenChange,
  index: controlledIndex,
  onIndexChange,
  children,
  className,
}: LightboxProps) {
  const [internalOpen, setInternalOpen] = React.useState(false);
  const [internalIndex, setInternalIndex] = React.useState(0);
  const [zoomed, setZoomed] = React.useState(false);
  const [naturalSize, setNaturalSize] = React.useState<{ w: number; h: number } | null>(null);
  const [isTall, setIsTall] = React.useState(false);
  const imgRef = React.useRef<HTMLImageElement>(null);
  const scrollContainerRef = React.useRef<HTMLDivElement>(null);

  const isControlled = controlledOpen !== undefined;
  const open = isControlled ? controlledOpen : internalOpen;
  const setOpen = isControlled
    ? (onOpenChange ?? (() => { }))
    : setInternalOpen;

  const currentIndex = controlledIndex ?? internalIndex;
  const setCurrentIndex = onIndexChange ?? setInternalIndex;

  const current = images[currentIndex];

  // Reset zoom when image changes (covers both internal nav and external index changes)
  const currentSrc = current?.src;
  React.useEffect(() => {
    setZoomed(false);
    setNaturalSize(null);
    setIsTall(false);
  }, [currentSrc]);

  const toggleZoom = React.useCallback(() => {
    imgRef.current?.animate(
      [{ transform: "scale(0.96)" }, { transform: "scale(1)" }],
      { duration: 250, easing: "ease-out" }
    );
    setZoomed((z) => !z);
  }, []);

  const goTo = React.useCallback(
    (idx: number) => {
      const clamped = ((idx % images.length) + images.length) % images.length;
      setCurrentIndex(clamped);
    },
    [images.length, setCurrentIndex]
  );

  const goPrev = React.useCallback(
    () => goTo(currentIndex - 1),
    [goTo, currentIndex]
  );
  const goNext = React.useCallback(
    () => goTo(currentIndex + 1),
    [goTo, currentIndex]
  );

  const handleKeyDown = React.useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "ArrowLeft") {
        e.preventDefault();
        goPrev();
      } else if (e.key === "ArrowRight") {
        e.preventDefault();
        goNext();
      }
    },
    [goPrev, goNext]
  );

  if (!current) return null;

  const showNav = images.length > 1;

  return (
    <DialogPrimitive.Root open={open} onOpenChange={(v) => { setOpen(v); if (!v) setZoomed(false); }}>
      {children &&
        React.Children.map(children, (child, i) => (
          <DialogPrimitive.Trigger
            data-slot="lightbox-trigger"
            className={cn("contents cursor-pointer", className)}
            onClick={() => setCurrentIndex(i)}
          >
            {child}
          </DialogPrimitive.Trigger>
        ))
      }

      <DialogPrimitive.Portal>
        <DialogPrimitive.Backdrop
          data-slot="lightbox-overlay"
          className="data-open:animate-in data-closed:animate-out data-closed:fade-out-0 data-open:fade-in-0 fixed inset-0 isolate z-50 bg-black/90 backdrop-blur-md duration-100"
        />
        <DialogPrimitive.Popup
          data-slot="lightbox-content"
          className="data-open:animate-in data-closed:animate-out data-closed:fade-out-0 data-open:fade-in-0 data-closed:zoom-out-95 data-open:zoom-in-95 fixed top-1/2 left-1/2 z-50 flex flex-col w-full max-w-[calc(100vw-2rem)] -translate-x-1/2 -translate-y-1/2 rounded-xl duration-100 outline-none h-[calc(100vh-2rem)] overflow-hidden p-0"
          onKeyDown={handleKeyDown}
        >
          {/* Header */}
          <div className="flex items-start justify-between p-4 pb-0">
            <div className="flex flex-col gap-1">
              <DialogPrimitive.Title
                data-slot="lightbox-title"
                className="flex items-center gap-2 text-base leading-none font-medium text-white"
              >
                {current.alt || "Image Preview"}
              </DialogPrimitive.Title>
              {showNav && (
                <DialogPrimitive.Description
                  data-slot="lightbox-description"
                  className="text-white/60 text-sm"
                >
                  {currentIndex + 1} of {images.length}
                </DialogPrimitive.Description>
              )}
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="mr-14 size-10 mt-0 shrink-0 text-white hover:text-white hover:bg-white/10"
              onClick={toggleZoom}
            >
              {zoomed ? <ZoomOut className="size-5" /> : <ZoomIn className="size-5" />}
              <span className="sr-only">{zoomed ? "Zoom out" : "Zoom in"}</span>
            </Button>
          </div>

          {/* Image area wrapper — relative so nav buttons are pinned here */}
          <div className="relative flex-1 min-h-0">
            {/* Scrollable image */}
            <div ref={scrollContainerRef} className={cn("h-full overflow-auto px-4 py-8 flex", (zoomed || isTall) ? "items-start" : "items-center")} onClick={() => setOpen(false)}>
              <div className={cn("rounded-lg flex justify-center items-center w-full")} onClick={() => setOpen(false)}>
                <img
                  ref={imgRef}
                  src={current.src}
                  alt={current.alt}
                  className={cn(
                    "rounded-xl border border-black/12 dark:border-white/12 cursor-pointer",
                    zoomed
                      ? "max-w-none max-h-none"
                      : "w-full h-auto max-w-[1400px]"
                  )}
                  style={zoomed && naturalSize ? { width: naturalSize.w / 2, height: naturalSize.h / 2 } : undefined}
                  onClick={(e) => { e.stopPropagation(); toggleZoom(); }}
                  onLoad={(e) => {
                    const img = e.currentTarget;
                    setNaturalSize({ w: img.naturalWidth, h: img.naturalHeight });
                    const container = scrollContainerRef.current;
                    if (container) {
                      setIsTall(img.offsetHeight >= container.clientHeight);
                    }
                  }}
                />
              </div>
            </div>

            {/* Nav buttons — pinned over the image area, outside scroll */}
            {showNav && (
              <>
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute left-8 top-1/2 ml-4 -translate-y-1/2 h-8 w-8 rounded-full bg-background/80"
                  onClick={goPrev}
                >
                  <ChevronLeft className="size-7" />
                  <span className="sr-only">Previous image</span>
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute right-8 top-1/2 mr-4 -translate-y-1/2 h-8 w-8 rounded-full bg-white/10 text-white hover:bg-white/20"
                  onClick={goNext}
                >
                  <ChevronRight className="size-7" />
                  <span className="sr-only">Next image</span>
                </Button>
              </>
            )}
          </div>

          {/* Thumbnail strip — pinned to bottom */}
          {showNav && (
            <div className="flex justify-center gap-2 px-4 py-4 shrink-0">
              {images.map((img, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => goTo(i)}
                  className={cn(
                    "w-12 h-12 rounded-lg cursor-pointer overflow-hidden border-2 transition-colors",
                    i === currentIndex
                      ? "border-white"
                      : "border-transparent hover:border-white/50"
                  )}
                >
                  <img
                    src={img.src}
                    alt={img.alt}
                    className="w-full h-full object-cover"
                  />
                </button>
              ))}
            </div>
          )}

          {/* Close button */}
          <DialogPrimitive.Close
            data-slot="lightbox-close"
            render={
              <Button
                variant="ghost"
                className="absolute top-4 right-4 text-white hover:text-white hover:bg-white/10"
                size="lg"
              >
                <XIcon className="size-6" />
                <span className="sr-only">Close</span>
              </Button>
            }
          />
        </DialogPrimitive.Popup>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}

export { Lightbox };
