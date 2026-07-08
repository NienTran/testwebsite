import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { PostEditor } from "@/components/dashboard/post-editor";

export const Route = createFileRoute("/_authenticated/dashboard/posts/new")({
  component: NewPost,
});

function NewPost() {
  const navigate = useNavigate();
  return <PostEditor onSaved={() => navigate({ to: "/dashboard/posts" })} />;
}
