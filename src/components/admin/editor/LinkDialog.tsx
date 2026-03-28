"use client";

import { useState, useEffect, useCallback } from "react";
import { type Editor } from "@tiptap/react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/Dialog";
import { Input } from "@/components/ui/Input";
import { Switch } from "@/components/ui/Switch";
import { Button } from "@/components/ui/Button";

interface LinkDialogProps {
  editor: Editor;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function LinkDialog({ editor, open, onOpenChange }: LinkDialogProps) {
  const [url, setUrl] = useState("");
  const [newTab, setNewTab] = useState(false);

  const isImage = editor.isActive("image");

  // Pre-fill from existing link when opening
  useEffect(() => {
    if (!open) return;
    if (isImage) {
      const attrs = editor.getAttributes("image");
      setUrl(attrs.href ?? "");
      setNewTab(attrs.target === "_blank");
    } else {
      const attrs = editor.getAttributes("link");
      setUrl(attrs.href ?? "");
      setNewTab(attrs.target === "_blank");
    }
  }, [open, editor, isImage]);

  const apply = useCallback(() => {
    if (!url.trim()) return;
    if (isImage) {
      editor
        .chain()
        .focus()
        .updateAttributes("image", {
          href: url.trim(),
          target: newTab ? "_blank" : null,
        })
        .run();
    } else {
      editor
        .chain()
        .focus()
        .setLink({
          href: url.trim(),
          target: newTab ? "_blank" : null,
          rel: newTab ? "noopener noreferrer" : null,
        })
        .run();
    }
    onOpenChange(false);
  }, [editor, url, newTab, onOpenChange, isImage]);

  const remove = useCallback(() => {
    if (isImage) {
      editor
        .chain()
        .focus()
        .updateAttributes("image", { href: null, target: null })
        .run();
    } else {
      editor.chain().focus().unsetLink().run();
    }
    onOpenChange(false);
  }, [editor, onOpenChange, isImage]);

  const hasLink = isImage ? !!editor.getAttributes("image")?.href : editor.isActive("link");

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>
            {hasLink ? "Edit link" : "Insert link"}
          </DialogTitle>
        </DialogHeader>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            apply();
          }}
          className="flex flex-col gap-3"
        >
          <Input
            placeholder="https://example.com"
            value={url}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
              setUrl(e.target.value)
            }
            size="sm"
            autoFocus
          />

          <label className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Open in new tab</span>
            <Switch
              size="sm"
              checked={newTab}
              onCheckedChange={setNewTab}
            />
          </label>
        </form>

        <DialogFooter>
          {hasLink && (
            <Button variant="outline" size="sm" onClick={remove}>
              Remove link
            </Button>
          )}
          <Button size="sm" onClick={apply} disabled={!url.trim()}>
            Apply
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
