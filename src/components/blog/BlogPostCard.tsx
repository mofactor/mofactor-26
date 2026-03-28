import Link from "next/link";
import { Badge } from "@/components/ui/Badge";

interface BlogPostCardProps {
  title: string;
  slug: string;
  excerpt: string;
  publishedAt?: number;
  tags?: string[];
  coverImageUrl?: string | null;
}

export function BlogPostCard({
  title,
  slug,
  excerpt,
  publishedAt,
  tags,
  coverImageUrl,
}: BlogPostCardProps) {
  return (
    <Link href={`/blog/${slug}`} className="group block">
      <article className="rounded-xl border border-zinc-200 bg-white p-6 transition-all hover:shadow-md dark:border-zinc-800 dark:bg-zinc-925 dark:hover:border-zinc-700">
        {coverImageUrl && (
          <img
            src={coverImageUrl}
            alt={title}
            className="mb-4 aspect-video w-full rounded-lg object-cover"
          />
        )}

        <h2 className="text-lg font-medium text-zinc-900 group-hover:underline dark:text-zinc-100">
          {title}
        </h2>

        <p className="mt-2 text-sm leading-relaxed text-zinc-600 dark:text-zinc-400">
          {excerpt}
        </p>

        <div className="mt-4 flex items-center gap-3">
          {publishedAt && (
            <time className="text-xs text-zinc-400">
              {new Date(publishedAt).toLocaleDateString("en-US", {
                year: "numeric",
                month: "long",
                day: "numeric",
              })}
            </time>
          )}

          {tags && tags.length > 0 && (
            <div className="flex gap-1">
              {tags.map((tag) => (
                <Badge key={tag} variant="secondary" size="sm">
                  {tag}
                </Badge>
              ))}
            </div>
          )}
        </div>
      </article>
    </Link>
  );
}
