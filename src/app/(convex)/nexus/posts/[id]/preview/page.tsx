"use client";

import { useQuery } from "convex/react";
import { api } from "../../../../../../../convex/_generated/api";
import { useAdminSession } from "@/hooks/useAdminSession";
import { useParams } from "next/navigation";
import { TiptapRenderer } from "@/components/cms/TiptapRenderer";
import { Badge } from "@/components/ui/Badge";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import type { Id } from "../../../../../../../convex/_generated/dataModel";

export default function PreviewPostPage() {
  const { id } = useParams<{ id: string }>();
  const { token } = useAdminSession();

  const post = useQuery(
    api.posts.getById,
    token ? { token, id: id as Id<"posts"> } : "skip"
  );

  if (post === undefined) {
    return (
      <div className="mx-auto max-w-2xl py-20 text-center text-sm text-zinc-400">
        Loading...
      </div>
    );
  }

  if (post === null) {
    return (
      <div className="mx-auto max-w-2xl py-20 text-center">
        <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">
          Post not found
        </h1>
      </div>
    );
  }

  return (
    <article className="blog-prose mx-auto max-w-5xl pb-24">
      <header className="pt-12 text-left">
        <Link
          href={`/nexus/posts/${id}`}
          className="mb-2 inline-flex items-center gap-1 text-sm text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100"
        >
          <ArrowLeft className="size-3.5" />
          Back to editor
        </Link>

        {post.status === "draft" && (
          <Badge variant="secondary" size="sm" className="ml-2">
            Draft
          </Badge>
        )}

        <h1 className="mt-0 text-3xl leading-tight text-zinc-900 dark:text-zinc-100">
          {post.title}
        </h1>

        <div className="mt-4 flex items-center gap-3 pb-4">
          {post.publishedAt && (
            <time className="text-sm text-zinc-400">
              {new Date(post.publishedAt).toLocaleDateString("en-US", {
                year: "numeric",
                month: "long",
                day: "numeric",
              })}
            </time>
          )}

          {post.tags && post.tags.length > 0 && (
            <div className="flex gap-1">
              {post.tags.map((tag) => (
                <Badge key={tag} variant="secondary" size="sm">
                  {tag}
                </Badge>
              ))}
            </div>
          )}
        </div>
      </header>

      {post.coverImageUrl && (
        <img
          src={post.coverImageUrl}
          alt={post.title}
          className="wide mt-8 aspect-video w-full rounded-xl object-cover mb-10"
        />
      )}

      <div className="mt-10 full">
        <TiptapRenderer content={post.content} />
      </div>
    </article>
  );
}
