// The /nexus CMS as one client-only React app (mounted by src/pages/nexus/[...path].astro).
// Replaces the Next (convex) + nexus layouts: Convex provider, toasts, auth shell, routes.
import { useMemo } from "react";
import { ConvexProvider, ConvexReactClient } from "convex/react";
import { Toaster } from "sonner";
import { Route, Router, Switch } from "wouter";
import { PUBLIC_CONVEX_URL } from "astro:env/client";
import AdminLayout from "./AdminLayout";
import PostsPage from "./pages/PostsPage";
import LoginPage from "./pages/LoginPage";
import FilesPage from "./pages/FilesPage";
import NewPostPage from "./pages/NewPostPage";
import EditPostPage from "./pages/EditPostPage";
import PreviewPostPage from "./pages/PreviewPostPage";

export default function AdminApp() {
  const client = useMemo(() => new ConvexReactClient(PUBLIC_CONVEX_URL!), []);

  return (
    <ConvexProvider client={client}>
      <Router>
        <AdminLayout>
          <Switch>
            <Route path="/nexus" component={PostsPage} />
            <Route path="/nexus/login" component={LoginPage} />
            <Route path="/nexus/files" component={FilesPage} />
            <Route path="/nexus/posts/new" component={NewPostPage} />
            <Route path="/nexus/posts/:id/preview" component={PreviewPostPage} />
            <Route path="/nexus/posts/:id" component={EditPostPage} />
            <Route>
              <div className="text-sm text-zinc-400">Page not found.</div>
            </Route>
          </Switch>
        </AdminLayout>
      </Router>
      <Toaster position="bottom-center" toastOptions={{
        classNames: {
          toast: "!border-none !shadow-border font-sans text-sm",
          success: "bg-green-50 border-green-200 text-green-800",
          error: "bg-red-50 border-red-200 text-red-800",
          title: "font-medium",
          description: "text-muted-foreground",
        },
      }} />
    </ConvexProvider>
  );
}
