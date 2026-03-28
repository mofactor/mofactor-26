"use client";

import { useQuery } from "convex/react";
import { api } from "../../../../../../convex/_generated/api";
import { useAdminSession } from "@/hooks/useAdminSession";
import { PostForm } from "@/components/admin/PostForm";
import { useParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, ExternalLink } from "lucide-react";
import type { Id } from "../../../../../../convex/_generated/dataModel";

export default function EditPostPage() {
  const { id } = useParams<{ id: string }>();
  const { token } = useAdminSession();

  const post = useQuery(
    api.posts.getById,
    token ? { token, id: id as Id<"posts"> } : "skip"
  );

  if (post === undefined) {
    return (
      <div className="text-sm text-zinc-400">Loading...</div>
    );
  }

  if (post === null) {
    return (
      <div className="text-sm text-red-500">Post not found.</div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Link
          href="/nexus"
          className="inline-flex items-center gap-1.5 text-sm text-zinc-400 transition-colors hover:text-zinc-600 dark:text-zinc-500 dark:hover:text-zinc-300"
        >
          <ArrowLeft className="size-3.5" />
          Back to posts
        </Link>
        {post.slug && (
          <Link
            href={post.status === "published" ? `/blog/${post.slug}` : `/nexus/posts/${id}/preview`}
            target="_blank"
            className="inline-flex items-center gap-1.5 text-sm text-zinc-400 transition-colors hover:text-zinc-600 dark:text-zinc-500 dark:hover:text-zinc-300"
          >
            {post.status === "published" ? "View Post" : "Preview"}
            <ExternalLink className="size-3.5" />
          </Link>
        )}
      </div>
      <PostForm
        initialData={{
          _id: post._id,
          title: post.title,
          slug: post.slug,
          excerpt: post.excerpt,
          content: post.content,
          tags: post.tags,
          coverImageId: post.coverImageId,
          coverImageUrl: post.coverImageUrl,
          seoTitle: post.seoTitle,
          seoMetaDescription: post.seoMetaDescription,
          status: post.status,
        }}
      />
    </div>
  );
}
