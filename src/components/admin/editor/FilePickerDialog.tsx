"use client";

import { useQuery } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import { useAdminSession } from "@/hooks/useAdminSession";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/Dialog";

interface FilePickerDialogProps {
  open: boolean;
  onClose: () => void;
  onSelect: (url: string, name: string, storageId: string) => void;
  /** MIME prefix filter — "image" (default) or "video" */
  accept?: "image" | "video";
}

function formatSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function FilePickerDialog({
  open,
  onClose,
  onSelect,
  accept = "image",
}: FilePickerDialogProps) {
  const { token } = useAdminSession();
  const files = useQuery(api.files.list, token ? { token } : "skip");

  const filtered = files?.filter((f) => f.type.startsWith(`${accept}/`));

  return (
    <Dialog open={open} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-4xl">
        <DialogHeader>
          <DialogTitle>Choose from Library</DialogTitle>
        </DialogHeader>

        {filtered === undefined && (
          <div className="py-8 text-center text-sm text-zinc-400">
            Loading...
          </div>
        )}

        {filtered?.length === 0 && (
          <div className="py-8 text-center text-sm text-zinc-400">
            No {accept}s in library. Upload
            files at /nexus/files first.
          </div>
        )}

        {filtered && filtered.length > 0 && (
          <div className="grid max-h-[32rem] grid-cols-4 gap-x-3 gap-y-4 overflow-y-auto">
            {filtered.map((file) => (
              <button
                key={file._id}
                onClick={() => {
                  if (file.url) {
                    onSelect(file.url, file.name, file.storageId);
                    onClose();
                  }
                }}
                className="group cursor-pointer text-left"
              >
                <div className="overflow-hidden rounded-lg border border-zinc-200 transition-colors group-hover:border-zinc-400 dark:border-zinc-700 dark:group-hover:border-zinc-500">
                  {file.url && file.type.startsWith("image/") && (
                    <img
                      src={file.url}
                      alt={file.name}
                      className="aspect-[4/3] w-full object-cover"
                    />
                  )}
                  {file.url && file.type.startsWith("video/") && (
                    <div className="relative aspect-[4/3] w-full bg-zinc-100 dark:bg-zinc-800">
                      <video
                        src={file.url}
                        muted
                        preload="metadata"
                        className="size-full object-cover"
                      />
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="flex size-8 items-center justify-center rounded-full bg-black/60 text-white">
                          <svg
                            className="ml-0.5 size-3.5"
                            viewBox="0 0 16 16"
                            fill="currentColor"
                          >
                            <path d="M2.2 2.863C2.2 1.612 3.572 0.845 4.639 1.501L12.986 6.637C14.001 7.262 14.001 8.738 12.986 9.363L4.639 14.499C3.572 15.155 2.2 14.388 2.2 13.137V2.863Z" />
                          </svg>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
                <div className="mt-1.5 px-0.5">
                  <p className="truncate text-xs font-medium text-zinc-700 dark:text-zinc-300">
                    {file.name}
                  </p>
                  <p className="text-[10px] text-zinc-400 dark:text-zinc-500">
                    {formatSize(file.size)}
                  </p>
                </div>
              </button>
            ))}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
