import { convexHttp } from "@/lib/convex";
import { api } from "../../../convex/_generated/api";
import Link from "next/link";

const staticNotes = [
  { title: "A Netflix style screensaver for Plex/Android TV", icon: "</>" },
  { title: "Syncing Hue lights with Plex", icon: "</>" },
  { title: "August Smart Lock with a Euro Cylinder", icon: "</>" },
  { title: "Control your TV/Home Cinema using Siri and Logitech Harmony", icon: "</>" },
  { title: "How to make your blinds smart on a low budget", icon: "</>" },
  { title: "Getting started with Homebridge", icon: "</>" },
];

export default async function Notes() {
  let posts: { title: string; slug: string }[] | null = null;

  try {
    if (convexHttp) {
      posts = await convexHttp.query(api.posts.listRecent, { limit: 6 });
    }
  } catch {
    // Convex unavailable — fall through to static
  }

  const items =
    posts && posts.length > 0
      ? posts.map((p) => ({
          title: p.title,
          href: `/blog/${p.slug}`,
          icon: "</>",
        }))
      : staticNotes.map((n) => ({ ...n, href: "#" }));

  return (
    <div>
      <h2 className="text-[30px] md:text-[36px] font-normal leading-[1.1] mb-12">
        <span className="text-body opacity-75 dark:text-body-dark">
          Release notes.
        </span>
        <br />
        <span className="text-black dark:text-white">My heritage posts.</span>
      </h2>

      <div className="divide-y divide-gray-200 dark:divide-zinc-800">
        {items.map((item, index) => (
          <Link
            key={index}
            href={item.href}
            className="blog-row group"
          >
            <div className="flex items-center gap-3">
              <span className="text-gray-400 text-sm font-mono dark:text-zinc-500">
                {item.icon}
              </span>
              <span className="text-sm text-black group-hover:text-gray-600 transition-colors dark:text-zinc-100 dark:group-hover:text-zinc-400">
                {item.title}
              </span>
            </div>
            <svg
              width="16"
              height="16"
              viewBox="0 0 16 16"
              fill="none"
              className="text-gray-400 flex-shrink-0 dark:text-zinc-500"
            >
              <path
                d="M6 4l4 4-4 4"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </Link>
        ))}
      </div>

      {posts && posts.length > 0 && (
        <div className="mt-6">
          <Link
            href="/blog"
            className="text-sm text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors"
          >
            View all posts →
          </Link>
        </div>
      )}
    </div>
  );
}
