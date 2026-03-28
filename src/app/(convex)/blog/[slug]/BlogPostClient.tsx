"use client";

import { useQuery } from "convex/react";
import { api } from "../../../../../convex/_generated/api";
import { TiptapRenderer } from "@/components/cms/TiptapRenderer";
import { ShareBar } from "@/components/blog/ShareBar";
import { Badge } from "@/components/ui/Badge";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export function BlogPostClient({ slug }: { slug: string }) {
  const post = useQuery(api.posts.getBySlug, { slug });

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
        <Link
          href="/blog"
          className="mt-4 inline-flex items-center gap-1 text-sm text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100"
        >
          <ArrowLeft className="size-3.5" />
          Back to blog
        </Link>
      </div>
    );
  }

  return (
    <article className="blog-prose mx-auto max-w-5xl pb-24">
      <header className="text-left pt-12">
        <Link
          href="/"
          className="mb-3 inline-flex items-center gap-1 text-sm text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100"
        >
          <ArrowLeft className="size-3.5" />
          Home
        </Link>
        <h1 className="mt-0 text-4xl md:text-5xl md:leading-14 text-zinc-900 dark:text-zinc-100">
          {post.title}
        </h1>

        <div className="mt-5 pb-4 flex items-center gap-3">
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
        <ShareBar title={post.title} slug={slug} />
        <TiptapRenderer content={post.content} />
      </div>
    </article>
  );
}
