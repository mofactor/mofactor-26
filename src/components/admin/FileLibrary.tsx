"use client";

import { useState, useCallback } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { useAdminSession } from "@/hooks/useAdminSession";
import { Button } from "@/components/ui/Button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/Dialog";
import { Dropzone } from "@/components/ui/Dropzone";
import { Upload, Trash2, Copy, Check, Download } from "lucide-react";
import type { Id } from "../../../convex/_generated/dataModel";

type FileItem = {
  _id: Id<"files">;
  name: string;
  type: string;
  size: number;
  url: string | null;
  createdAt: number;
};

function VideoIcon({ className }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M18 17.5V6.5C18 5.39543 17.1046 4.5 16 4.5H4C2.89543 4.5 2 5.39543 2 6.5V17.5C2 18.6046 2.89543 19.5 4 19.5H16C17.1046 19.5 18 18.6046 18 17.5Z" />
      <path d="M15 9C15 9.82843 14.3284 10.5 13.5 10.5C12.6716 10.5 12 9.82843 12 9C12 8.17157 12.6716 7.5 13.5 7.5C14.3284 7.5 15 8.17157 15 9Z" />
      <path d="M18 15L22 17.5V6.5L18 9" />
    </svg>
  );
}

function formatSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function FileLibrary() {
  const { token } = useAdminSession();
  const files = useQuery(api.files.list, token ? { token } : "skip");
  const uploadMutation = useMutation(api.files.upload);
  const removeMutation = useMutation(api.files.remove);
  const generateUploadUrl = useMutation(api.files.generateUploadUrl);
  const [uploading, setUploading] = useState(false);
  const [uploadOpen, setUploadOpen] = useState(false);
  const [copiedId, setCopiedId] = useState<Id<"files"> | null>(null);
  const [selectedFile, setSelectedFile] = useState<FileItem | null>(null);

  const handleFile = useCallback(
    async (file: File) => {
      if (!token) return;
      setUploading(true);
      setUploadOpen(false);
      try {
        const uploadUrl = await generateUploadUrl({ token });
        const result = await fetch(uploadUrl, {
          method: "POST",
          headers: { "Content-Type": file.type },
          body: file,
        });
        const { storageId } = await result.json();
        await uploadMutation({
          token,
          storageId,
          name: file.name,
          type: file.type,
          size: file.size,
        });
      } catch (err) {
        console.error("Upload failed:", err);
      } finally {
        setUploading(false);
      }
    },
    [token, generateUploadUrl, uploadMutation]
  );

  const handleDelete = async (id: Id<"files">, name: string) => {
    if (!confirm(`Delete "${name}"?`)) return;
    if (!token) return;
    await removeMutation({ token, id });
  };

  const handleCopyUrl = async (id: Id<"files">, url: string) => {
    await navigator.clipboard.writeText(url);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  if (!token) return null;

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
          Files
        </h1>
        <Button
          onClick={() => setUploadOpen(true)}
          disabled={uploading}
          size="sm"
        >
          <Upload className="mr-1.5 size-3.5" />
          {uploading ? "Uploading..." : "Upload"}
        </Button>
      </div>

      {files === undefined && (
        <div className="text-sm text-zinc-400">Loading...</div>
      )}

      {files?.length === 0 && (
        <div className="rounded-xl border border-dashed border-zinc-300 p-12 text-center dark:border-zinc-700">
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            No files yet. Upload your first file.
          </p>
        </div>
      )}

      {files && files.length > 0 && (() => {
        const images = files.filter((f) => f.type.startsWith("image/"));
        const videos = files.filter((f) => f.type.startsWith("video/"));
        const others = files.filter(
          (f) => !f.type.startsWith("image/") && !f.type.startsWith("video/")
        );

        const renderFileCard = (file: FileItem) => (
          <div
            key={file._id}
            onClick={() => setSelectedFile(file)}
            className="group relative cursor-pointer overflow-hidden rounded-lg bg-white p-0.5 shadow-border transition-colors dark:bg-zinc-900"
          >
            {file.url && file.type.startsWith("image/") ? (
              <img
                src={file.url}
                alt={file.name}
                className="aspect-[4/3] w-full object-cover rounded-t-md"
              />
            ) : file.type.startsWith("video/") ? (
              <div className="flex aspect-[4/3] flex-col items-center rounded-t-md justify-center gap-2 bg-zinc-900 text-xs text-zinc-400 dark:bg-zinc-800 dark:text-zinc-500">
                <div className="flex size-8 items-center justify-center rounded-full bg-zinc-700">
                  <VideoIcon className="size-4 text-zinc-100" />
                </div>
                {file.type.split("/")[1]?.toUpperCase() || "VIDEO"}
              </div>
            ) : (
              <div className="flex aspect-[4/3] flex-col items-center rounded-t-md justify-center gap-2 bg-zinc-900 text-xs text-zinc-400 dark:bg-zinc-800 dark:text-zinc-500">
                {file.type.split("/")[1]?.toUpperCase() || "FILE"}
              </div>
            )}

            {/* Hover overlay */}
            <div className="absolute inset-0 flex items-center justify-center gap-2 bg-black/50 opacity-0 transition-opacity group-hover:opacity-100">
              {file.url && (
                <Button
                  variant="secondary"
                  size="icon-xs"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleCopyUrl(file._id, file.url!);
                  }}
                  title="Copy URL"
                >
                  {copiedId === file._id ? (
                    <Check className="size-3.5" />
                  ) : (
                    <Copy className="size-3.5" />
                  )}
                </Button>
              )}
              <Button
                variant="secondary"
                size="icon-xs"
                onClick={(e) => {
                  e.stopPropagation();
                  handleDelete(file._id, file.name);
                }}
                title="Delete"
                className="text-red-500 hover:text-red-600"
              >
                <Trash2 className="size-3.5" />
              </Button>
            </div>

            {/* Info */}
            <div className="px-2.5 py-2">
              <p className="truncate text-xs font-medium text-zinc-700 dark:text-zinc-300">
                {file.name}
              </p>
              <p className="text-[10px] text-zinc-400 dark:text-zinc-500">
                {formatSize(file.size)}
              </p>
            </div>
          </div>
        );

        return (
          <div className="space-y-10">
            {images.length > 0 && (
              <section>
                <h2 className="mb-4 text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                  Images
                </h2>
                <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
                  {images.map(renderFileCard)}
                </div>
              </section>
            )}

            {videos.length > 0 && (
              <section>
                <h2 className="mb-4 text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                  Videos
                </h2>
                <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
                  {videos.map(renderFileCard)}
                </div>
              </section>
            )}

            {others.length > 0 && (
              <section>
                <h2 className="mb-4 text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                  Other Files
                </h2>
                <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
                  {others.map(renderFileCard)}
                </div>
              </section>
            )}
          </div>
        );
      })()}

      {/* Upload dialog */}
      <Dialog open={uploadOpen} onOpenChange={setUploadOpen}>
        <DialogContent showCloseButton className="!max-w-sm">
          <DialogHeader>
            <DialogTitle>Upload Files</DialogTitle>
          </DialogHeader>
          <Dropzone
            accept="image/*,video/*"
            multiple
            onFile={handleFile}
            className="py-10"
          >
            <Upload className="size-6" />
            <span>Drop files here or click to browse</span>
          </Dropzone>
        </DialogContent>
      </Dialog>

      {/* Preview dialog */}
      <Dialog
        open={!!selectedFile}
        onOpenChange={(open) => {
          if (!open) setSelectedFile(null);
        }}
      >
        {selectedFile && (
          <DialogContent
            showCloseButton
            className="!max-w-[1400px] !p-0 overflow-hidden"
          >
            <div className="flex">
              {/* Left: Preview */}
              <div className="flex flex-1 items-center justify-center bg-zinc-100 p-6 dark:bg-zinc-950">
                {selectedFile.url && selectedFile.type.startsWith("image/") ? (
                  <img
                    src={selectedFile.url}
                    alt={selectedFile.name}
                    className="max-h-[70vh] rounded-lg object-contain"
                  />
                ) : selectedFile.url &&
                  selectedFile.type.startsWith("video/") ? (
                  <video
                    src={selectedFile.url}
                    controls
                    className="max-h-[70vh] rounded-lg"
                  />
                ) : (
                  <div className="flex size-40 items-center justify-center rounded-xl bg-zinc-200 text-lg font-medium text-zinc-400 dark:bg-zinc-800 dark:text-zinc-500">
                    {selectedFile.type.split("/")[1]?.toUpperCase() || "FILE"}
                  </div>
                )}
              </div>

              {/* Right: Details sidebar */}
              <div className="flex w-72 shrink-0 flex-col border-l border-zinc-200 dark:border-zinc-800">
                {/* Title */}
                <div className="p-5">
                  <DialogTitle className="text-base font-semibold text-zinc-900 dark:text-zinc-100">
                    File Details
                  </DialogTitle>
                </div>

                {/* Divider */}
                <hr className="border-zinc-200 dark:border-zinc-800" />

                {/* Info rows */}
                <div className="p-5">
                  <dl className="space-y-3 text-sm">
                    <div className="flex justify-between">
                      <dt className="text-zinc-500 dark:text-zinc-400">Name</dt>
                      <dd className="max-w-[140px] truncate text-right font-medium text-zinc-800 dark:text-zinc-200">
                        {selectedFile.name}
                      </dd>
                    </div>
                    <div className="flex justify-between">
                      <dt className="text-zinc-500 dark:text-zinc-400">Type</dt>
                      <dd className="font-medium text-zinc-800 dark:text-zinc-200">
                        {selectedFile.type.split("/")[1]?.toUpperCase() ||
                          "Unknown"}
                      </dd>
                    </div>
                    <div className="flex justify-between">
                      <dt className="text-zinc-500 dark:text-zinc-400">Size</dt>
                      <dd className="font-medium text-zinc-800 dark:text-zinc-200">
                        {formatSize(selectedFile.size)}
                      </dd>
                    </div>
                    <div className="flex justify-between">
                      <dt className="text-zinc-500 dark:text-zinc-400">
                        Created
                      </dt>
                      <dd className="font-medium text-zinc-800 dark:text-zinc-200">
                        {new Date(selectedFile.createdAt).toLocaleDateString(
                          "en-US",
                          {
                            month: "short",
                            day: "numeric",
                            year: "numeric",
                          }
                        )}
                      </dd>
                    </div>
                  </dl>
                </div>

                {/* Divider */}
                <hr className="border-zinc-200 dark:border-zinc-800" />

                {/* Actions */}
                <div className="flex flex-col gap-2 p-5">
                  {selectedFile.url && (
                    <>
                      <Button
                        variant="outline"
                        size="sm"
                        className="w-full"
                        onClick={() =>
                          handleCopyUrl(selectedFile._id, selectedFile.url!)
                        }
                      >
                        {copiedId === selectedFile._id ? (
                          <Check className="mr-1.5 size-3.5" />
                        ) : (
                          <Copy className="mr-1.5 size-3.5" />
                        )}
                        {copiedId === selectedFile._id ? "Copied!" : "Copy URL"}
                      </Button>
                      <a
                        href={selectedFile.url}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        <Button variant="outline" size="sm" className="w-full">
                          <Download className="mr-1.5 size-3.5" />
                          Open in new tab
                        </Button>
                      </a>
                    </>
                  )}
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full text-red-500 hover:text-red-600"
                    onClick={() => {
                      handleDelete(selectedFile._id, selectedFile.name);
                      setSelectedFile(null);
                    }}
                  >
                    <Trash2 className="mr-1.5 size-3.5" />
                    Delete
                  </Button>
                </div>
              </div>
            </div>
          </DialogContent>
        )}
      </Dialog>
    </div>
  );
}
