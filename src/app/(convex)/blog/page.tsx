"use client";

import { useQuery } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import { BlogPostCard } from "@/components/blog/BlogPostCard";

export default function BlogPage() {
  const posts = useQuery(api.posts.list);

  return (
    <div className="mx-auto max-w-3xl">
      <h1 className="text-3xl font-bold text-zinc-900 dark:text-zinc-100">
        Blog
      </h1>
      <p className="mt-2 text-zinc-500 dark:text-zinc-400">
        Thoughts on design, development, and building digital products.
      </p>

      <div className="mt-10 space-y-6">
        {posts === undefined && (
          <div className="text-sm text-zinc-400">Loading...</div>
        )}

        {posts && posts.length === 0 && (
          <p className="text-sm text-zinc-400">No posts yet.</p>
        )}

        {posts?.map((post) => (
          <BlogPostCard
            key={post._id}
            title={post.title}
            slug={post.slug}
            excerpt={post.excerpt}
            publishedAt={post.publishedAt}
            tags={post.tags}
            coverImageUrl={post.coverImageUrl}
          />
        ))}
      </div>
    </div>
  );
}
