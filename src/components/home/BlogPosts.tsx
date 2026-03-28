"use client";

import Link from "next/link";
import { ConvexProvider, ConvexReactClient, useQuery } from "convex/react";
import { useMemo } from "react";
import { api } from "../../../convex/_generated/api";
import { Badge } from "@/components/ui/Badge";
import DualLineHeading from "@/components/ui/DualLineHeading";

const convexUrl = process.env.NEXT_PUBLIC_CONVEX_URL!;

function BlogPostItem({
  title,
  slug,
  excerpt,
  coverImageUrl,
  publishedAt,
  tags,
}: {
  title: string;
  slug: string;
  excerpt: string;
  coverImageUrl?: string | null;
  publishedAt?: number;
  tags?: string[];
}) {
  const date = publishedAt ? new Date(publishedAt) : null;
  const fullDate = date?.toLocaleDateString("en-US", {
    month: "long",
    day: "2-digit",
    year: "numeric",
  });

  return (
    <Link href={`/blog/${slug}`} className="group block">
      <article>
        <div className="pt-12 relative before:absolute after:absolute before:bg-zinc-900 after:bg-zinc-900/10 dark:before:bg-zinc-100 dark:after:bg-zinc-100/10 before:top-0 before:left-0 before:h-px before:w-6 after:top-0 after:right-0 after:left-8 after:h-px">
          <div className="grid grid-cols-1 items-center gap-6 pt-10 md:grid-cols-12 md:gap-16 md:pt-0">
            {/* Left — cover image & date */}
            <div className="md:col-span-5">
              <div className="flex items-center gap-6">
                {coverImageUrl && (
                  <img
                    src={coverImageUrl}
                    alt=""
                    className="flex-none w-40 rounded-lg"
                  />
                )}
                <div>
                  {date && (
                    <time
                      dateTime={date.toISOString().split("T")[0]}
                      className="text-lg font-medium text-zinc-500 dark:text-zinc-400"
                    >
                      {fullDate}
                    </time>
                  )}
                  {tags && tags.length > 0 && (
                    <div className="mt-3.5 flex flex-wrap gap-1">
                      {tags.map((tag) => (
                        <Badge key={tag} variant="secondary" size="sm">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Right — title & excerpt */}
            <div className="md:col-span-6 md:col-start-7">
              <h3 className="text-[22px] font-medium text-zinc-900 dark:text-zinc-100 group-hover:text-zinc-600 dark:group-hover:text-zinc-300 transition-colors">
                {title}
              </h3>
              <p className="mt-2 text-sm text-muted-foreground line-clamp-2">
                {excerpt}
              </p>
            </div>
          </div>
        </div>
      </article>
    </Link>
  );
}

function BlogPostsList() {
  const posts = useQuery(api.posts.listRecent, { limit: 3 });

  if (!posts || posts.length === 0) return null;

  return (
    <div className="mb-32 md:mb-40">
      <DualLineHeading topLine="Journal" bottomLine="The Ramblings." />

      <div className="mt-10 space-y-16">
        {posts.map((post) => (
          <BlogPostItem
            key={post._id}
            title={post.title}
            slug={post.slug}
            excerpt={post.excerpt}
            coverImageUrl={post.coverImageUrl}
            publishedAt={post.publishedAt}
            tags={post.tags}
          />
        ))}
      </div>

    </div>
  );
}

export default function BlogPosts() {
  const client = useMemo(() => new ConvexReactClient(convexUrl), []);

  return (
    <ConvexProvider client={client}>
      <BlogPostsList />
    </ConvexProvider>
  );
}
