// Port of app/(convex)/nexus/files/page.tsx (routing via ../navigation)
import { FileLibrary } from "@/components/admin/FileLibrary";

export default function FilesPage() {
  return (
    <div className="space-y-6">
      <FileLibrary />
    </div>
  );
}
