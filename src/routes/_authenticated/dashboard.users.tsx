import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { listUsersWithRoles, setUserRole } from "@/lib/admin.functions";
import { formatDate } from "@/lib/format";

const ROLES = ["admin", "author", "user"] as const;

export const Route = createFileRoute("/_authenticated/dashboard/users")({
  component: UsersAdmin,
});

function UsersAdmin() {
  const listFn = useServerFn(listUsersWithRoles);
  const setFn = useServerFn(setUserRole);
  const qc = useQueryClient();
  const { data: users = [], error } = useQuery({
    queryKey: ["dashboard-users"],
    queryFn: () => listFn(),
    retry: false,
  });

  const mut = useMutation({
    mutationFn: (v: { user_id: string; role: (typeof ROLES)[number]; add: boolean }) => setFn({ data: v }),
    onSuccess: () => {
      toast.success("Đã cập nhật vai trò.");
      qc.invalidateQueries({ queryKey: ["dashboard-users"] });
    },
    onError: (e: any) => toast.error(e.message),
  });

  if (error) {
    return (
      <div>
        <h1 className="font-serif text-3xl">Người dùng</h1>
        <p className="mt-6 text-sm text-muted-foreground">Chỉ Admin mới có quyền quản lý người dùng.</p>
      </div>
    );
  }

  return (
    <div>
      <h1 className="font-serif text-3xl">Người dùng & Vai trò</h1>
      <ul className="mt-6 divide-y rounded-md border">
        {users.map((u: any) => (
          <li key={u.id} className="flex flex-wrap items-center gap-4 p-4">
            <div className="flex-1 min-w-0">
              <p className="truncate font-medium">{u.display_name ?? "Ẩn danh"}</p>
              <p className="text-xs text-muted-foreground">Đăng ký: {formatDate(u.created_at)}</p>
            </div>
            <div className="flex flex-wrap gap-2">
              {ROLES.map((role) => {
                const has = u.roles.includes(role);
                return (
                  <Button
                    key={role}
                    size="sm"
                    variant={has ? "default" : "outline"}
                    onClick={() => mut.mutate({ user_id: u.id, role, add: !has })}
                  >
                    {has ? "✓ " : ""}{role}
                  </Button>
                );
              })}
            </div>
          </li>
        ))}
        {users.length === 0 && <p className="p-6 text-sm text-muted-foreground">Chưa có người dùng.</p>}
      </ul>
    </div>
  );
}
