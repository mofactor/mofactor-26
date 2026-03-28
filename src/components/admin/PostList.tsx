"use client";

import { useQuery, useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { useAdminSession } from "@/hooks/useAdminSession";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { InsetWrapper, InsetWrapperContent } from "@/components/ui/InsetWrapper";
import Link from "next/link";
import { Pencil, Trash2, Eye, EyeOff } from "lucide-react";
import type { Id } from "../../../convex/_generated/dataModel";

export function PostList() {
  const { token } = useAdminSession();
  const posts = useQuery(api.posts.listAll, token ? { token } : "skip");
  const publishMutation = useMutation(api.posts.publish);
  const unpublishMutation = useMutation(api.posts.unpublish);
  const removeMutation = useMutation(api.posts.remove);

  if (!token) return null;
  if (posts === undefined) {
    return <div className="text-sm text-zinc-400">Loading posts...</div>;
  }

  if (posts.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-zinc-300 p-12 text-center dark:border-zinc-700">
        <p className="text-sm text-zinc-500 dark:text-zinc-400">
          No posts yet.
        </p>
        <Link href="/nexus/posts/new">
          <Button className="mt-4">Create your first post</Button>
        </Link>
      </div>
    );
  }

  const togglePublish = async (
    id: Id<"posts">,
    status: "draft" | "published"
  ) => {
    if (status === "draft") {
      await publishMutation({ token: token!, id });
    } else {
      await unpublishMutation({ token: token!, id });
    }
  };

  const handleDelete = async (id: Id<"posts">, title: string) => {
    if (!confirm(`Delete "${title}"?`)) return;
    await removeMutation({ token: token!, id });
  };

  const gridCols =
    "grid grid-cols-[minmax(0,1fr)_6.5rem_7rem_6rem] gap-x-6 items-center";

  return (
    <InsetWrapper>
      <div
        className={`${gridCols} px-6 py-2 text-[11px] font-medium uppercase tracking-widest text-zinc-500 dark:text-zinc-400`}
      >
        <span>Title</span>
        <span>Status</span>
        <span>Updated</span>
        <span className="text-right">Actions</span>
      </div>
      <InsetWrapperContent className="overflow-hidden">
        <div className="divide-y divide-zinc-100 text-sm dark:divide-zinc-800">
          {posts.map((post) => (
            <div
              key={post._id}
              className={`${gridCols} relative px-6 py-3 transition-colors hover:bg-zinc-50 dark:hover:bg-zinc-800/50`}
            >
              <Link
                href={`/nexus/posts/${post._id}`}
                className="absolute inset-0"
                aria-label={`Edit ${post.title}`}
              />
              <div>
                <span className="text-smd font-medium text-zinc-900 dark:text-zinc-100">
                  {post.title}
                </span>
                <div className="mt-0.5 text-xs text-zinc-400">
                  /{post.slug}
                </div>
              </div>
              <div>
                <Badge
                  variant={
                    post.status === "published" ? "default" : "secondary"
                  }
                >
                  {post.status}
                </Badge>
              </div>
              <div className="text-zinc-500 dark:text-zinc-400">
                {new Date(post.updatedAt).toLocaleDateString()}
              </div>
              <div className="relative z-10 flex items-center justify-end gap-1">
                <Button
                  variant="ghost"
                  size="icon-xs"
                  onClick={() => togglePublish(post._id, post.status)}
                  title={
                    post.status === "published" ? "Unpublish" : "Publish"
                  }
                >
                  {post.status === "published" ? (
                    <EyeOff className="size-3.5" />
                  ) : (
                    <Eye className="size-3.5" />
                  )}
                </Button>
                <Link href={`/nexus/posts/${post._id}`}>
                  <Button variant="ghost" size="icon-xs" title="Edit">
                    <Pencil className="size-3.5" />
                  </Button>
                </Link>
                <Button
                  variant="ghost"
                  size="icon-xs"
                  onClick={() => handleDelete(post._id, post.title)}
                  title="Delete"
                  className="text-red-500 hover:text-red-600"
                >
                  <Trash2 className="size-3.5" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      </InsetWrapperContent>
    </InsetWrapper>
  );
}
