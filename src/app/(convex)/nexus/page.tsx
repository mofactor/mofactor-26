"use client";

import { PostList } from "@/components/admin/PostList";
import { Button } from "@/components/ui/Button";
import Link from "next/link";
import { Plus } from "lucide-react";

export default function AdminPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-medium text-zinc-900 dark:text-zinc-100">
          Posts
        </h1>
        <Link href="/nexus/posts/new">
          <Button size="sm" className="gap-1.5">
            <Plus className="size-4" />
            New Post
          </Button>
        </Link>
      </div>
      <PostList />
    </div>
  );
}
