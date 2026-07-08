import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { listAllComments, moderateComment } from "@/lib/comments.functions";
import { formatDate } from "@/lib/format";

type StatusFilter = "all" | "pending" | "approved" | "hidden";

const STATUS_LABEL: Record<string, string> = {
  pending: "Chờ duyệt",
  approved: "Đã duyệt",
  hidden: "Đã ẩn",
};

export const Route = createFileRoute("/_authenticated/dashboard/comments")({
  component: CommentsAdmin,
});

function CommentsAdmin() {
  const listFn = useServerFn(listAllComments);
  const modFn = useServerFn(moderateComment);
  const qc = useQueryClient();
  const [status, setStatus] = useState<StatusFilter>("pending");

  const { data: comments = [], error } = useQuery({
    queryKey: ["dashboard-comments", status],
    queryFn: () => listFn({ data: { status } }),
    retry: false,
  });

  const mut = useMutation({
    mutationFn: (v: { id: string; action: "approve" | "hide" | "delete" }) =>
      modFn({ data: v }),
    onSuccess: () => {
      toast.success("Đã cập nhật bình luận.");
      qc.invalidateQueries({ queryKey: ["dashboard-comments"] });
    },
    onError: (e: any) => toast.error(e.message),
  });

  if (error) {
    return (
      <div>
        <h1 className="font-serif text-3xl">Bình luận</h1>
        <p className="mt-6 text-sm text-muted-foreground">
          Chỉ Admin mới có thể kiểm duyệt bình luận.
        </p>
      </div>
    );
  }

  return (
    <div>
      <h1 className="font-serif text-3xl">Kiểm duyệt bình luận</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Bình luận mới mặc định ở trạng thái chờ duyệt trước khi hiển thị công khai.
      </p>

      <Tabs value={status} onValueChange={(v) => setStatus(v as StatusFilter)} className="mt-6">
        <TabsList>
          <TabsTrigger value="pending">Chờ duyệt</TabsTrigger>
          <TabsTrigger value="approved">Đã duyệt</TabsTrigger>
          <TabsTrigger value="hidden">Đã ẩn</TabsTrigger>
          <TabsTrigger value="all">Tất cả</TabsTrigger>
        </TabsList>
      </Tabs>

      <ul className="mt-6 space-y-4">
        {comments.map((c: any) => (
          <li key={c.id} className="rounded-md border p-4">
            <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-muted-foreground">
              <span>
                {c.author?.display_name ?? "Ẩn danh"} · {c.post?.title ?? "—"} ·{" "}
                {formatDate(c.created_at)}
                {c.parent_id && <span className="ml-2 italic">(trả lời)</span>}
              </span>
              <Badge
                variant={
                  c.status === "approved"
                    ? "default"
                    : c.status === "pending"
                      ? "secondary"
                      : "outline"
                }
                className="rounded-sm"
              >
                {STATUS_LABEL[c.status] ?? c.status}
              </Badge>
            </div>
            <p className="mt-2 text-sm">{c.body}</p>
            <div className="mt-3 flex flex-wrap gap-2">
              {c.status !== "approved" && (
                <Button
                  size="sm"
                  onClick={() => mut.mutate({ id: c.id, action: "approve" })}
                  disabled={mut.isPending}
                >
                  Duyệt
                </Button>
              )}
              {c.status !== "hidden" && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => mut.mutate({ id: c.id, action: "hide" })}
                  disabled={mut.isPending}
                >
                  Ẩn
                </Button>
              )}
              <Button
                size="sm"
                variant="outline"
                onClick={() =>
                  confirm("Xóa bình luận này?") &&
                  mut.mutate({ id: c.id, action: "delete" })
                }
                disabled={mut.isPending}
              >
                Xóa
              </Button>
            </div>
          </li>
        ))}
        {comments.length === 0 && (
          <p className="text-sm text-muted-foreground">Không có bình luận nào ở trạng thái này.</p>
        )}
      </ul>
    </div>
  );
}
