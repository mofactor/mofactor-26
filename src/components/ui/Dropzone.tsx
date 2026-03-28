"use client";

import { useState, useRef, useCallback } from "react";
import { cn } from "@/lib/utils";
import { Upload } from "lucide-react";

interface DropzoneProps {
  accept?: string;
  multiple?: boolean;
  onFile: (file: File) => void;
  className?: string;
  children?: React.ReactNode;
}

export function Dropzone({ accept, multiple, onFile, className, children }: DropzoneProps) {
  const [isDragging, setIsDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const dragCounter = useRef(0);

  const handleDragEnter = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounter.current++;
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounter.current--;
    if (dragCounter.current === 0) setIsDragging(false);
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      dragCounter.current = 0;
      setIsDragging(false);
      const files = Array.from(e.dataTransfer.files);
      for (const file of files) onFile(file);
    },
    [onFile]
  );

  const handleClick = () => inputRef.current?.click();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    for (const file of files) onFile(file);
    e.target.value = "";
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      onDragEnter={handleDragEnter}
      onDragLeave={handleDragLeave}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
      className={cn(
        "flex w-full cursor-pointer flex-col items-center justify-center gap-1.5 rounded-lg border border-dashed border-zinc-300 px-4 py-5 text-xs text-zinc-400 transition-colors hover:border-zinc-400 hover:text-zinc-500 dark:border-zinc-700 dark:text-zinc-500 dark:hover:border-zinc-600 dark:hover:text-zinc-400",
        isDragging && "border-blue-400 bg-blue-50/50 text-blue-500 dark:border-blue-500 dark:bg-blue-950/20 dark:text-blue-400",
        className
      )}
    >
      <input ref={inputRef} type="file" accept={accept} multiple={multiple} onChange={handleChange} className="hidden" />
      {children ?? (
        <>
          <Upload className="size-5" />
          <span>Drop image or click to upload</span>
        </>
      )}
    </button>
  );
}
