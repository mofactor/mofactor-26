import type { Metadata } from "next";
import { convexHttp } from "@/lib/convex";
import { api } from "../../../../../convex/_generated/api";
import { BlogPostClient } from "./BlogPostClient";

type Props = {
  params: Promise<{ slug: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;

  const post = convexHttp
    ? await convexHttp.query(api.posts.getBySlug, { slug })
    : null;

  if (!post) {
    return { title: "Post not found" };
  }

  const title = post.seoTitle || post.title;
  const description = post.seoMetaDescription || post.excerpt;
  const ogImage = post.coverImageUrl
    ? { url: post.coverImageUrl, width: 1200, height: 630, alt: post.title }
    : {
        url: `/og?title=${encodeURIComponent(post.title)}&subtitle=Blog`,
        width: 1200,
        height: 630,
      };

  return {
    title,
    description,
    openGraph: {
      type: "article",
      title,
      description,
      url: `/blog/${slug}`,
      images: [ogImage],
      publishedTime: post.publishedAt
        ? new Date(post.publishedAt).toISOString()
        : undefined,
      tags: post.tags ?? undefined,
    },
    twitter: {
      card: "summary_large_image",
      site: "@onuro",
      creator: "@onuro",
      title,
      description,
      images: post.coverImageUrl
        ? [{ url: post.coverImageUrl, alt: post.title }]
        : [{ url: `/og?title=${encodeURIComponent(post.title)}&subtitle=Blog`, alt: post.title }],
    },
  };
}

export default async function BlogPostPage({ params }: Props) {
  const { slug } = await params;

  const post = convexHttp
    ? await convexHttp.query(api.posts.getBySlug, { slug })
    : null;

  return (
    <>
      {post && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "BlogPosting",
              headline: post.title,
              description: post.seoMetaDescription || post.excerpt,
              ...(post.coverImageUrl && { image: post.coverImageUrl }),
              ...(post.publishedAt && {
                datePublished: new Date(post.publishedAt).toISOString(),
              }),
              author: {
                "@type": "Person",
                name: "Onur Oztaskiran",
                url: "https://monofactor.com",
              },
              publisher: {
                "@type": "Organization",
                name: "Monofactor",
                url: "https://monofactor.com",
              },
              mainEntityOfPage: {
                "@type": "WebPage",
                "@id": `https://monofactor.com/blog/${slug}`,
              },
            }),
          }}
        />
      )}
      <BlogPostClient slug={slug} />
    </>
  );
}
