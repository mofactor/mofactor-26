"use client";

import { useState, useCallback, useRef, useEffect, useMemo } from "react";
import { cn } from "@/lib/utils";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { useAdminSession } from "@/hooks/useAdminSession";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/Input";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
  InputGroupText,
} from "@/components/ui/input-group";
import { Button } from "@/components/ui/Button";
import { Label } from "@/components/ui/Label";
import { Badge } from "@/components/ui/Badge";
import {
  TiptapEditor,
  type TiptapEditorHandle,
  type NodeSelection,
  type NodeAncestor,
} from "@/components/admin/editor/TiptapEditor";
import { ClassPicker } from "@/components/admin/editor/ClassPicker";
import { WidthModePicker } from "@/components/admin/editor/WidthModePicker";
import { AspectRatioPicker } from "@/components/admin/editor/AspectRatioPicker";
import { BorderRadiusPicker } from "@/components/admin/editor/BorderRadiusPicker";
import { SUPPORTS_WIDTH_MODE, SUPPORTS_BORDER_RADIUS, getWidthMode, setWidthMode, getAspectRatio, setAspectRatio, getVariantView, mergeVariantChanges, type InspectorVariant } from "@/components/admin/editor/extensions/figureClasses";
import { Collapsible } from "@/components/ui/Collapsible";
import { NumberButtons } from "@/components/ui/NumberButtons";
import { X, Columns3, BoxSelect, LayoutGrid, Trash2, ImageIcon, Image, Play, Minus, Sun, Moon, Type, Heading, List, ListOrdered, TextQuote, Code, MinusSquare } from "lucide-react";
import { Dropzone } from "@/components/ui/Dropzone";
import { FilePickerDialog } from "@/components/admin/editor/FilePickerDialog";
import { InsetWrapper, InsetWrapperLabel, InsetWrapperContent } from "@/components/ui/InsetWrapper";
import { Textarea } from "@/components/ui/Textarea";
import { Switch } from "@/components/ui/Switch";
import { toast } from "sonner";
import type { Id } from "../../../convex/_generated/dataModel";

function UppercaseLabel({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <Label className={cn("mb-1.5 inline-block text-[11px] font-medium uppercase tracking-wider text-zinc-400 dark:text-zinc-500", className)}>
      {children}
    </Label>
  );
}

interface PostData {
  _id?: Id<"posts">;
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  tags?: string[];
  coverImageId?: Id<"_storage">;
  coverImageUrl?: string | null;
  seoTitle?: string;
  seoMetaDescription?: string;
  status?: "draft" | "published";
}

interface PostFormProps {
  initialData?: PostData;
}

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

function SeoCharCount({ value, min, max }: { value: string; min: number; max: number }) {
  const len = value.length;
  const color =
    len === 0
      ? "text-zinc-300 dark:text-zinc-600"
      : len < min
        ? "text-amber-500 dark:text-amber-400"
        : len <= max
          ? "text-emerald-500 dark:text-emerald-400"
          : "text-red-500 dark:text-red-400";
  const label =
    len === 0
      ? `Aim for ${min}–${max} chars`
      : len < min
        ? `Too short — add ${min - len} more`
        : len <= max
          ? "Good length"
          : `Too long by ${len - max}`;
  return (
    <span className={`text-[10px] ${color}`}>
      {len > 0 && <span className="tabular-nums">{len}</span>}
      {len > 0 && <span className="text-zinc-300 dark:text-zinc-600">/{max}</span>}
      {" "}{label}
    </span>
  );
}

const NODE_LABELS: Record<string, { label: string; icon: typeof Columns3 }> = {
  styledBlock: { label: "Styled Block", icon: BoxSelect },
  columns: { label: "Columns", icon: Columns3 },
  column: { label: "Column", icon: LayoutGrid },
  image: { label: "Image", icon: ImageIcon },
  video: { label: "Video", icon: Play },
  logoDivider: { label: "Logo Divider", icon: Minus },
  paragraph: { label: "Paragraph", icon: Type },
  heading: { label: "Heading", icon: Heading },
  bulletList: { label: "Bullet List", icon: List },
  orderedList: { label: "Ordered List", icon: ListOrdered },
  listItem: { label: "List Item", icon: List },
  blockquote: { label: "Blockquote", icon: TextQuote },
  codeBlock: { label: "Code Block", icon: Code },
  horizontalRule: { label: "Divider", icon: MinusSquare },
};

export function PostForm({ initialData }: PostFormProps) {
  const { token } = useAdminSession();
  const router = useRouter();
  const createMutation = useMutation(api.posts.create);
  const updateMutation = useMutation(api.posts.update);
  const publishMutation = useMutation(api.posts.publish);
  const unpublishMutation = useMutation(api.posts.unpublish);
  const generateUploadUrl = useMutation(api.posts.generateUploadUrl);
  const registerFile = useMutation(api.files.upload);
  const editorRef = useRef<TiptapEditorHandle>(null);
  const files = useQuery(api.files.list, token ? { token } : "skip");
  const fileNameByUrl = useMemo(() => {
    const map = new Map<string, string>();
    if (files) for (const f of files) if (f.url) map.set(f.url, f.name);
    return map;
  }, [files]);

  const isEditing = !!initialData?._id;
  const isPublished = initialData?.status === "published";

  const [title, setTitle] = useState(initialData?.title ?? "");
  const [slug, setSlug] = useState(initialData?.slug ?? "");
  const [excerpt, setExcerpt] = useState(initialData?.excerpt ?? "");
  const [content, setContent] = useState(initialData?.content ?? "");
  const [tags, setTags] = useState<string[]>(initialData?.tags ?? []);
  const [tagInput, setTagInput] = useState("");
  const [coverImageId, setCoverImageId] = useState<Id<"_storage"> | undefined>(
    initialData?.coverImageId
  );
  const [coverPreviewUrl, setCoverPreviewUrl] = useState<string | null>(
    initialData?.coverImageUrl ?? null
  );
  const [seoTitle, setSeoTitle] = useState(initialData?.seoTitle ?? "");
  const [seoMetaDescription, setSeoMetaDescription] = useState(
    initialData?.seoMetaDescription ?? ""
  );
  const [seoTitleManuallyEdited, setSeoTitleManuallyEdited] = useState(
    !!initialData?.seoTitle
  );
  const [seoDescManuallyEdited, setSeoDescManuallyEdited] = useState(
    !!initialData?.seoMetaDescription
  );
  const [saving, setSaving] = useState(false);
  const [filePickerOpen, setFilePickerOpen] = useState(false);
  const [slugManuallyEdited, setSlugManuallyEdited] = useState(isEditing);
  const [selectedNode, setSelectedNode] = useState<NodeSelection | null>(null);
  const [posterPickerOpen, setPosterPickerOpen] = useState(false);
  const [darkImagePickerOpen, setDarkImagePickerOpen] = useState(false);
  const [inspectorVariant, setInspectorVariant] = useState<InspectorVariant>("light");
  const [captionDraft, setCaptionDraft] = useState("");

  // Sync caption draft when selected node changes
  useEffect(() => {
    setCaptionDraft(selectedNode?.attrs?.title || "");
  }, [selectedNode?.pos, selectedNode?.type]);

  // Derived: the className "view" for the current variant
  const viewClassName = useMemo(
    () => selectedNode ? getVariantView(selectedNode.className, inspectorVariant) : "",
    [selectedNode?.className, inspectorVariant],
  );

  // Unsaved-changes guard: snapshot current form state and compare on beforeunload.
  // No need to call markDirty() anywhere — this captures all fields automatically.
  const formStateRef = useRef({ title, slug, excerpt, content, tags, coverImageId, seoTitle, seoMetaDescription });
  formStateRef.current = { title, slug, excerpt, content, tags, coverImageId, seoTitle, seoMetaDescription };
  const savedSnapshotRef = useRef(JSON.stringify(formStateRef.current));

  useEffect(() => {
    const handler = (e: BeforeUnloadEvent) => {
      if (JSON.stringify(formStateRef.current) === savedSnapshotRef.current) return;
      e.preventDefault();
    };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, []);

  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newTitle = e.target.value;
    setTitle(newTitle);
    if (!slugManuallyEdited) {
      setSlug(slugify(newTitle));
    }
    if (!seoTitleManuallyEdited) {
      setSeoTitle(newTitle);
    }
  };

  const handleSlugChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSlugManuallyEdited(true);

    const sanitized = e.target.value
      .toLowerCase()
      .replace(/[^a-z0-9-]/g, "-")
      .replace(/-{2,}/g, "-");
    setSlug(sanitized);
  };

  const addTag = () => {
    const tag = tagInput.trim().toLowerCase();
    if (tag && !tags.includes(tag)) {
      setTags([...tags, tag]);

    }
    setTagInput("");
  };

  const removeTag = (tag: string) => {
    setTags(tags.filter((t) => t !== tag));

  };

  const handleCoverFile = async (file: File) => {
    if (!token) return;

    setCoverPreviewUrl(URL.createObjectURL(file));

    const uploadUrl = await generateUploadUrl({ token });
    const result = await fetch(uploadUrl, {
      method: "POST",
      headers: { "Content-Type": file.type },
      body: file,
    });
    const { storageId } = await result.json();
    setCoverImageId(storageId);

    await registerFile({ token, storageId, name: file.name, type: file.type, size: file.size });
  };

  const removeCoverImage = () => {
    setCoverImageId(undefined);
    setCoverPreviewUrl(null);

  };

  const handleContentChange = useCallback((json: string) => {
    setContent(json);
  }, []);

  const handleNodeSelect = useCallback((info: NodeSelection | null) => {
    setSelectedNode(info);
  }, []);

  const handleClassChange = useCallback(
    (newViewClasses: string) => {
      if (!selectedNode) return;
      const merged = mergeVariantChanges(selectedNode.className, newViewClasses, inspectorVariant);
      editorRef.current?.updateNodeClass(selectedNode.pos, merged);
      setSelectedNode({ ...selectedNode, className: merged });
    },
    [selectedNode, inspectorVariant]
  );

  const handleVideoAttr = useCallback(
    (key: string, value: unknown) => {
      if (!selectedNode) return;
      editorRef.current?.updateNodeAttr(selectedNode.pos, key, value);
      setSelectedNode({
        ...selectedNode,
        attrs: { ...selectedNode.attrs, [key]: value },
      });
    },
    [selectedNode]
  );

  const handleEscape = useCallback(() => {
    if (!selectedNode) return;
    if (selectedNode.ancestors.length > 0) {
      // Select the immediate parent (first in ancestors array)
      const parent = selectedNode.ancestors[0];
      setSelectedNode({
        ...parent,
        ancestors: selectedNode.ancestors.slice(1),
      });
    } else {
      setSelectedNode(null);
    }
  }, [selectedNode]);

  const handleDeleteNode = useCallback(() => {
    if (!selectedNode) return;
    editorRef.current?.deleteNode(selectedNode.pos);
    setSelectedNode(null);
  }, [selectedNode]);

  const handleColumnCountChange = useCallback(
    (delta: number) => {
      if (!selectedNode || selectedNode.type !== "columns") return;
      const current = selectedNode.attrs?.count ?? 2;
      const next = Math.max(1, Math.min(6, current + delta));
      if (next === current) return;
      editorRef.current?.setColumnCount(selectedNode.pos, next);
      setSelectedNode({ ...selectedNode, attrs: { ...selectedNode.attrs, count: next } });
    },
    [selectedNode]
  );

  const save = async (action: "save" | "publish" | "unpublish" = "save") => {
    if (!token || !title || !slug) return;
    setSaving(true);

    try {
      let postId = initialData?._id;

      if (isEditing && postId) {
        await updateMutation({
          token,
          id: postId,
          title,
          slug,
          excerpt,
          content,
          tags,
          coverImageId,
          seoTitle: seoTitle || undefined,
          seoMetaDescription: seoMetaDescription || undefined,
        });
      } else {
        postId = await createMutation({
          token,
          title,
          slug,
          excerpt,
          content,
          tags,
          coverImageId,
          seoTitle: seoTitle || undefined,
          seoMetaDescription: seoMetaDescription || undefined,
        });
      }

      if (action === "publish" && postId) {
        await publishMutation({ token, id: postId });
      } else if (action === "unpublish" && postId) {
        await unpublishMutation({ token, id: postId });
      }

      savedSnapshotRef.current = JSON.stringify(formStateRef.current);

      // New post → redirect to its edit page; existing post → stay on page
      if (!isEditing && postId) {
        router.replace(`/nexus/posts/${postId}`);
      } else {
        const msg = action === "publish" ? "Published" : action === "unpublish" ? "Reverted to draft" : "Saved";
        toast.success(msg);
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to save");
    } finally {
      setSaving(false);
    }
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "s") {
        e.preventDefault();
        save();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [token, title, slug, excerpt, content, tags, coverImageId, seoTitle, seoMetaDescription]);

  const nodeInfo = selectedNode ? NODE_LABELS[selectedNode.type] : null;
  const NodeIcon = nodeInfo?.icon;

  return (
    <div className="flex gap-6">
      {/* Main form */}
      <div className="min-w-0 flex-1 space-y-6 mx-auto max-w-5xl">
        {/* Title — styled like the frontend heading */}
        <textarea
          ref={(el) => {
            if (el) {
              el.style.height = "auto";
              el.style.height = el.scrollHeight + "px";
            }
          }}
          value={title}
          onChange={(e) => {
            handleTitleChange(e as any);
            e.target.style.height = "auto";
            e.target.style.height = e.target.scrollHeight + "px";
          }}
          rows={1}
          placeholder="Post title"
          className="mx-auto block w-full max-w-2xl resize-none overflow-hidden bg-transparent text-5xl font-medium leading-[1.2] text-zinc-900 outline-none placeholder:text-zinc-300 dark:text-zinc-100 dark:placeholder:text-zinc-700"
        />

        {/* Content */}
        <div>
          <TiptapEditor
            ref={editorRef}
            content={content || undefined}
            onChange={handleContentChange}
            onNodeSelect={handleNodeSelect}
            activeNodePos={selectedNode?.pos ?? null}
            onEscape={handleEscape}
          />
        </div>

      </div>

      {/* Right sidebar — inspector */}
      <aside className="sticky top-6 hidden max-h-[calc(100vh-1.5rem)] w-72 shrink-0 flex-col xl:flex">
        {/* Actions */}
        <div className="mb-3 flex flex-col gap-0.5">
          {isPublished ? (
            <>
              <Button onClick={() => save()} disabled={saving} size="sm" className="w-full rounded-b-xs">
                {saving ? "Saving..." : "Update"}
              </Button>
              <Button
                variant="outline"
                onClick={() => save("unpublish")}
                size="sm"
                disabled={saving}
                className="w-full rounded-t-xs"
              >
                Revert to Draft
              </Button>
            </>
          ) : (
            <>
              <Button onClick={() => save()} disabled={saving} size="sm" className="w-full rounded-b-xs">
                {saving ? "Saving..." : "Save Draft"}
              </Button>
              <Button
                variant="outline"
                onClick={() => save("publish")}
                size="sm"
                disabled={saving}
                className="w-full rounded-t-xs"
              >
                Save & Publish
              </Button>
            </>
          )}

        </div>

        <InsetWrapper className="mb-3">
          <InsetWrapperLabel>Post Settings</InsetWrapperLabel>
          <InsetWrapperContent className="divide-y divide-zinc-200 overflow-hidden dark:divide-zinc-800">
            <Collapsible title="Slug & Excerpt">
              <div className="space-y-1.5">
                <Label className="text-[11px]">Slug</Label>
                <InputGroup size="sm">
                  <InputGroupAddon>
                    <InputGroupText>/blog/</InputGroupText>
                  </InputGroupAddon>
                  <InputGroupInput value={slug} onChange={handleSlugChange} placeholder="slug" />
                </InputGroup>
              </div>
              <div className="space-y-1.5">
                <Label className="text-[11px]">Excerpt</Label>
                <Textarea
                  value={excerpt}
                  onChange={(e) => {
                    setExcerpt(e.target.value);

                    if (!seoDescManuallyEdited) {
                      setSeoMetaDescription(e.target.value);
                    }
                  }}
                  placeholder="Brief description"
                  rows={2}
                  className="min-h-0 resize-y px-3 py-1.5 text-xsmd"
                />
              </div>
            </Collapsible>

            <Collapsible title="Tags">
              <div className="flex flex-wrap gap-1.5">
                {tags.map((tag) => (
                  <Badge key={tag} variant="secondary" className="rounded-sm gap-1 text-xs pr-0.5">
                    {tag}
                    <Button variant="ghost" size="icon-xs" onClick={() => removeTag(tag)} className="size-4">
                      <X className="size-2.5" />
                    </Button>
                  </Badge>
                ))}
              </div>
              <div className="flex gap-1.5">
                <Input
                  value={tagInput}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setTagInput(e.target.value)}
                  placeholder="Add tag"
                  size="sm"
                  onKeyDown={(e: React.KeyboardEvent) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      addTag();
                    }
                  }}
                />
                <Button variant="outline" onClick={addTag} type="button" size="sm">
                  Add
                </Button>
              </div>
            </Collapsible>

            <Collapsible title="Cover Image">
              {coverPreviewUrl ? (
                <div className="group relative py-1">
                  <img
                    src={coverPreviewUrl}
                    alt="Cover preview"
                    className="h-32 w-full rounded-md object-cover"
                  />
                  <Button
                    variant="ghost"
                    size="icon-xs"
                    onClick={removeCoverImage}
                    className="absolute top-1.5 right-1.5 rounded-full bg-black/60 p-0.5 text-white opacity-0 transition-opacity hover:bg-black/80 group-hover:opacity-100"
                  >
                    <X className="size-3.5" />
                  </Button>
                </div>
              ) : (
                <div className="space-y-2">
                  <Dropzone accept="image/*" onFile={handleCoverFile} />
                  <Button
                    variant="ghost"
                    size="xs"
                    onClick={() => setFilePickerOpen(true)}
                    className="w-full text-[11px] text-zinc-400 hover:text-zinc-600 dark:text-zinc-500 dark:hover:text-zinc-300"
                  >
                    <Image className="size-3" />
                    Choose from Library
                  </Button>
                </div>
              )}
            </Collapsible>

            <Collapsible title="SEO">
              <div className="space-y-1">
                <Label className="text-[11px]">SEO Title</Label>
                <Input
                  value={seoTitle}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                    setSeoTitleManuallyEdited(true);
                    setSeoTitle(e.target.value);

                  }}
                  placeholder={title || "Defaults to post title"}
                  size="sm"
                />
                <SeoCharCount value={seoTitle || title} min={50} max={60} />
              </div>
              <div className="space-y-1">
                <Label className="text-[11px]">Meta Description</Label>
                <Textarea
                  value={seoMetaDescription}
                  onChange={(e) => {
                    setSeoDescManuallyEdited(true);
                    setSeoMetaDescription(e.target.value);

                  }}
                  placeholder={excerpt || "Defaults to excerpt"}
                  rows={3}
                  className="min-h-0 resize-y px-3 py-1.5 text-xsmd"
                />
                <SeoCharCount value={seoMetaDescription || excerpt} min={120} max={160} />
              </div>
            </Collapsible>

            <FilePickerDialog
              open={filePickerOpen}
              onClose={() => setFilePickerOpen(false)}
              onSelect={(url, _name, storageId) => {
                setCoverPreviewUrl(url);
                setCoverImageId(storageId as Id<"_storage">);
              }}
            />
            <FilePickerDialog
              open={posterPickerOpen}
              onClose={() => setPosterPickerOpen(false)}
              onSelect={(url) => {
                handleVideoAttr("poster", url);
                setPosterPickerOpen(false);
              }}
            />
            <FilePickerDialog
              open={darkImagePickerOpen}
              onClose={() => setDarkImagePickerOpen(false)}
              onSelect={(url) => {
                if (!selectedNode) return;
                editorRef.current?.updateNodeAttr(selectedNode.pos, "darkSrc", url);
                setSelectedNode({ ...selectedNode, attrs: { ...selectedNode.attrs, darkSrc: url } });
                setDarkImagePickerOpen(false);
              }}
            />
          </InsetWrapperContent>
        </InsetWrapper>

        <InsetWrapper className="flex min-h-0 shrink flex-col">
          <div className="flex shrink-0 items-center gap-2">
            <InsetWrapperLabel>Inspector</InsetWrapperLabel>
            {selectedNode && (selectedNode.type === "image" || selectedNode.type === "video") && (() => {
              const displaySrc = (selectedNode.type === "image" && inspectorVariant === "dark" && selectedNode.attrs?.darkSrc)
                ? selectedNode.attrs.darkSrc
                : selectedNode.attrs?.src;
              if (!displaySrc) return null;
              return (
                <span className="min-w-0 flex-1 truncate pr-4 text-[11px] text-zinc-400 text-right dark:text-zinc-500">
                  {selectedNode.attrs?.alt || fileNameByUrl.get(displaySrc) || displaySrc.split("/").pop()}
                </span>
              );
            })()}
          </div>
          <InsetWrapperContent className="min-h-0 overflow-y-auto">


            {selectedNode && nodeInfo && (
              <div className="flex items-center gap-1 border-b border-zinc-200 px-4 py-2 mb-2 text-xs text-zinc-400 dark:border-zinc-800 dark:text-zinc-500">
                {[...selectedNode.ancestors].reverse().map((a, displayIdx) => {
                  const info = NODE_LABELS[a.type];
                  const ancestorIdx = selectedNode.ancestors.length - 1 - displayIdx;
                  return (
                    <span key={a.pos} className="flex items-center gap-1">
                      <Button
                        variant="link"
                        size="xs"
                        onClick={() =>
                          setSelectedNode({
                            ...a,
                            ancestors: selectedNode.ancestors.slice(ancestorIdx + 1),
                          })
                        }
                        className="h-auto p-0 text-xs text-zinc-400 underline underline-offset-2 hover:text-zinc-600 dark:text-zinc-500 dark:hover:text-zinc-300"
                      >
                        {info?.label ?? a.type}
                      </Button>
                      <span className="text-zinc-300 dark:text-zinc-600">
                        ›
                      </span>
                    </span>
                  );
                })}
                <span className="flex items-center gap-1.5 text-zinc-600 dark:text-zinc-300">
                  {NodeIcon && <NodeIcon className="size-3" />}
                  {nodeInfo.label}
                </span>
                <Button
                  variant="ghost"
                  size="icon-xs"
                  onClick={() => setInspectorVariant((v) => v === "light" ? "dark" : "light")}
                  className={`ml-auto shrink-0 ${inspectorVariant === "dark" ? "text-zinc-500 dark:text-zinc-500" : "text-zinc-500 dark:text-zinc-100"}`}
                  title={inspectorVariant === "dark" ? "Editing dark mode classes" : "Editing light mode classes"}
                >
                  {inspectorVariant === "dark" ? <Moon className="size-3" /> : <Sun className="size-3" />}
                </Button>
              </div>
            )}

            <div className="p-4 pt-2 pb-5">
              {selectedNode && nodeInfo ? (
                <div className="space-y-4">
                  {/* Width mode + Column count (side by side for columns) */}
                  {(SUPPORTS_WIDTH_MODE.has(selectedNode.type) ||
                    selectedNode?.type === "columns") && (
                      <div className="flex gap-4">
                        {selectedNode?.type === "columns" && (
                          <div className="space-y-2">
                            <UppercaseLabel>Columns</UppercaseLabel>
                            <NumberButtons
                              value={selectedNode.attrs?.count ?? 2}
                              onChange={(n) =>
                                handleColumnCountChange(
                                  n - (selectedNode.attrs?.count ?? 2),
                                )
                              }
                              min={1}
                              max={6}
                            />
                          </div>
                        )}
                        {SUPPORTS_WIDTH_MODE.has(selectedNode.type) && (
                          <div className="min-w-0 flex-1">
                            <WidthModePicker
                              variant={selectedNode.type === "columns" ? "icon" : "inline"}
                              buttonVariant={selectedNode.type === "columns" ? "outline" : undefined}
                              styleVariant={selectedNode.type === "columns" ? "default" : "tabs"}
                              value={getWidthMode(viewClassName)}
                              onChange={(mode) =>
                                handleClassChange(
                                  setWidthMode(viewClassName, mode),
                                )
                              }
                            />
                          </div>
                        )}
                      </div>
                    )}

                  {/* Dark mode image */}
                  {selectedNode?.type === "image" && inspectorVariant === "dark" && (
                    <div className="space-y-2">
                      <UppercaseLabel>Dark Mode Image</UppercaseLabel>
                      {selectedNode.attrs?.darkSrc ? (
                        <div className="group relative overflow-hidden rounded-md border border-indigo-200 dark:border-indigo-800/50">
                          <img
                            src={selectedNode.attrs.darkSrc}
                            alt="Dark mode"
                            className="aspect-video w-full object-cover"
                          />
                          <div className="flex gap-1 p-1.5">
                            <Button
                              variant="outline"
                              size="xs"
                              className="flex-1 rounded-sm"
                              onClick={() => setDarkImagePickerOpen(true)}
                            >
                              Change
                            </Button>
                            <Button
                              variant="outline"
                              size="xs"
                              className="rounded-sm border-red-200 text-red-500 hover:bg-red-50 dark:border-red-900/50 dark:text-red-400 dark:hover:bg-red-950/30"
                              onClick={() => {
                                editorRef.current?.updateNodeAttr(selectedNode.pos, "darkSrc", null);
                                setSelectedNode({ ...selectedNode, attrs: { ...selectedNode.attrs, darkSrc: null } });
                              }}
                            >
                              <X className="size-3" />
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <Button
                          variant="outline"
                          size="xs"
                          className="w-full"
                          onClick={() => setDarkImagePickerOpen(true)}
                        >
                          <Image className="size-3" />
                          Choose Dark Image
                        </Button>
                      )}
                    </div>
                  )}

                  {/* Video settings */}
                  {selectedNode?.type === "video" && (
                    <div className="space-y-4">
                      <UppercaseLabel>Video Settings</UppercaseLabel>

                      {/* Aspect ratio */}
                      <AspectRatioPicker
                        inline
                        value={getAspectRatio(viewClassName)}
                        onChange={(ratio) =>
                          handleClassChange(
                            setAspectRatio(viewClassName, ratio),
                          )
                        }
                      />

                      {/* Boolean toggles */}
                      <div className="grid py-1 grid-cols-2 gap-4">
                        {(
                          [
                            ["autoplay", "Autoplay"],
                            ["muted", "Muted"],
                            ["loop", "Loop"],
                            ["hideControls", "No Controls"],
                          ] as const
                        ).map(([key, label]) => (
                          <label
                            key={key}
                            className="flex cursor-pointer items-center justify-between text-xs font-medium text-zinc-600 dark:text-zinc-400"
                          >
                            {label}
                            <Switch
                              size="xs"
                              checked={!!selectedNode.attrs?.[key]}
                              onCheckedChange={(checked) => handleVideoAttr(key, checked)}
                            />
                          </label>
                        ))}
                      </div>

                      {/* Poster image */}
                      <div className="space-y-2">
                        <UppercaseLabel>Poster Image</UppercaseLabel>
                        {selectedNode.attrs?.poster ? (
                          <div className="group relative overflow-hidden rounded-md border border-zinc-200 dark:border-zinc-700">
                            <img
                              src={selectedNode.attrs.poster}
                              alt="Poster"
                              className="aspect-video w-full object-cover"
                            />
                            <div className="flex gap-1 p-1.5">
                              <Button
                                variant="outline"
                                size="xs"
                                className="flex-1 rounded-sm"
                                onClick={() => setPosterPickerOpen(true)}
                              >
                                Change
                              </Button>
                              <Button
                                variant="outline"
                                size="xs"
                                className="rounded-sm border-red-200 text-red-500 hover:bg-red-50 dark:border-red-900/50 dark:text-red-400 dark:hover:bg-red-950/30"
                                onClick={() => handleVideoAttr("poster", null)}
                              >
                                <X className="size-3" />
                              </Button>
                            </div>
                          </div>
                        ) : (
                          <InsetWrapper className="rounded-md pb-0.25">
                            <Button
                              variant="outline"
                              size="xs"
                              className="w-full"
                              onClick={() => setPosterPickerOpen(true)}
                            >
                              <Image className="size-3" />
                              Choose Poster
                            </Button>
                          </InsetWrapper>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Caption */}
                  {(selectedNode.type === "image" || selectedNode.type === "video") && (
                    <div className="space-y-1.5 pt-2">
                      <div className="flex items-center justify-between">
                        <UppercaseLabel className="mb-0">Caption</UppercaseLabel>
                        <label className="flex cursor-pointer items-center gap-1.5 text-[10px] text-zinc-400 dark:text-zinc-500">
                          Show
                          <Switch
                            size="xs"
                            checked={selectedNode.attrs?.showCaption !== false}
                            onCheckedChange={(checked) => {
                              editorRef.current?.updateNodeAttr(selectedNode.pos, "showCaption", checked);
                              setSelectedNode({ ...selectedNode, attrs: { ...selectedNode.attrs, showCaption: checked } });
                            }}
                          />
                        </label>
                      </div>
                      <Input
                        size="sm"
                        placeholder="Add a caption..."
                        value={captionDraft}
                        onChange={(e) => setCaptionDraft(e.target.value)}
                        onBlur={() => {
                          const val = captionDraft || null;
                          editorRef.current?.updateNodeAttr(selectedNode.pos, "title", val);
                          editorRef.current?.updateNodeAttr(selectedNode.pos, "alt", val || selectedNode.attrs?.alt || "");
                          setSelectedNode({ ...selectedNode, attrs: { ...selectedNode.attrs, title: val } });
                        }}
                      />
                    </div>
                  )}

                  {/* Border radius */}
                  {SUPPORTS_BORDER_RADIUS.has(selectedNode.type) && (
                    <BorderRadiusPicker
                      className={viewClassName}
                      onChange={handleClassChange}
                    />
                  )}

                  {/* Class editor */}
                  <UppercaseLabel>Classes</UppercaseLabel>
                  <ClassPicker
                    value={viewClassName}
                    onChange={handleClassChange}
                    variant={inspectorVariant}
                  />

                </div>
              ) : (
                <p className="text-xs pt-3 text-zinc-400 dark:text-zinc-500">
                  Press Escape to select an element.
                </p>
              )}
            </div>
          </InsetWrapperContent>
        </InsetWrapper>
      </aside>
    </div>
  );
}
