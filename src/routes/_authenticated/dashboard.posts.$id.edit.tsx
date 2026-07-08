import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { PostEditor } from "@/components/dashboard/post-editor";
import { getPostForEdit } from "@/lib/posts.functions";

export const Route = createFileRoute("/_authenticated/dashboard/posts/$id/edit")({
  component: EditPost,
});

function EditPost() {
  const { id } = Route.useParams();
  const navigate = useNavigate();
  const fn = useServerFn(getPostForEdit);
  const { data, isLoading } = useQuery({
    queryKey: ["post-edit", id],
    queryFn: () => fn({ data: { id } }),
  });
  if (isLoading) return <p className="text-sm text-muted-foreground">Đang tải...</p>;
  if (!data) return <p>Không tìm thấy bài viết.</p>;
  return <PostEditor initial={data} onSaved={() => navigate({ to: "/dashboard/posts" })} />;
}
