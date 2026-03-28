"use client";

import { PostForm } from "@/components/admin/PostForm";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export default function NewPostPage() {
  return (
    <div className="space-y-6">
      <Link
        href="/nexus"
        className="inline-flex items-center gap-1.5 text-sm text-zinc-400 transition-colors hover:text-zinc-600 dark:text-zinc-500 dark:hover:text-zinc-300"
      >
        <ArrowLeft className="size-3.5" />
        Back to posts
      </Link>
      <PostForm />
    </div>
  );
}
