import { useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { upsertPost } from "@/lib/posts.functions";
import { listCategories, listTags } from "@/lib/posts.functions";
import { slugify, readingTime } from "@/lib/format";

export function PostEditor({
  initial,
  onSaved,
}: {
  initial?: any;
  onSaved: () => void;
}) {
  const upsert = useServerFn(upsertPost);
  const catsFn = useServerFn(listCategories);
  const tagsFn = useServerFn(listTags);
  const { data: categories = [] } = useQuery({ queryKey: ["categories"], queryFn: () => catsFn() });
  const { data: allTags = [] } = useQuery({ queryKey: ["tags"], queryFn: () => tagsFn() });

  const [form, setForm] = useState({
    title: initial?.title ?? "",
    slug: initial?.slug ?? "",
    excerpt: initial?.excerpt ?? "",
    cover_image: initial?.cover_image ?? "",
    og_image: initial?.og_image ?? "",
    content: initial?.content ?? "",
    category_id: initial?.category_id ?? null,
    status: initial?.status ?? "draft",
    featured: initial?.featured ?? false,
    meta_title: initial?.meta_title ?? "",
    meta_description: initial?.meta_description ?? "",
    canonical_url: initial?.canonical_url ?? "",
  });
  const [tagIds, setTagIds] = useState<string[]>(
    initial?.post_tags?.map((pt: any) => pt.tag_id) ?? [],
  );

  const save = useMutation({
    mutationFn: (status: "draft" | "published") =>
      upsert({
        data: {
          id: initial?.id,
          ...form,
          slug: form.slug || slugify(form.title),
          reading_time: readingTime(form.content),
          status,
          tag_ids: tagIds,
        } as any,
      }),
    onSuccess: () => {
      toast.success("Đã lưu bài viết.");
      onSaved();
    },
    onError: (e: any) => toast.error(e.message ?? "Không thể lưu."),
  });

  return (
    <div>
      <h1 className="font-serif text-3xl">{initial ? "Chỉnh sửa bài viết" : "Viết bài mới"}</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Nội dung hỗ trợ Markdown (tiêu đề, danh sách, mã, trích dẫn).
      </p>

      <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_320px]">
        <div className="space-y-4">
          <div>
            <Label>Tiêu đề</Label>
            <Input
              value={form.title}
              onChange={(e) =>
                setForm((f) => ({
                  ...f,
                  title: e.target.value,
                  slug: f.slug || slugify(e.target.value),
                }))
              }
              placeholder="Tiêu đề bài viết"
            />
          </div>
          <div>
            <Label>Slug (URL)</Label>
            <Input value={form.slug} onChange={(e) => setForm({ ...form, slug: slugify(e.target.value) })} />
          </div>
          <div>
            <Label>Tóm tắt</Label>
            <Textarea
              rows={3}
              value={form.excerpt}
              onChange={(e) => setForm({ ...form, excerpt: e.target.value })}
              placeholder="1–2 câu tóm tắt bài viết."
            />
          </div>
          <div>
            <Label>Ảnh bìa (URL)</Label>
            <Input value={form.cover_image} onChange={(e) => setForm({ ...form, cover_image: e.target.value })} />
          </div>
          <div>
            <Label>Nội dung (Markdown)</Label>
            <Textarea
              rows={18}
              value={form.content}
              onChange={(e) => setForm({ ...form, content: e.target.value })}
              className="font-mono text-sm"
            />
          </div>
        </div>

        <div className="space-y-4">
          <Card className="space-y-3 p-4">
            <div className="flex items-center justify-between">
              <Label>Nổi bật</Label>
              <Switch checked={form.featured} onCheckedChange={(v) => setForm({ ...form, featured: v })} />
            </div>
            <div>
              <Label>Chuyên mục</Label>
              <Select
                value={form.category_id ?? "__none"}
                onValueChange={(v) => setForm({ ...form, category_id: v === "__none" ? null : v })}
              >
                <SelectTrigger><SelectValue placeholder="Chọn chuyên mục" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="__none">— Không —</SelectItem>
                  {categories.map((c: any) => (
                    <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Thẻ</Label>
              <div className="mt-2 flex flex-wrap gap-2">
                {allTags.map((t: any) => {
                  const on = tagIds.includes(t.id);
                  return (
                    <button
                      type="button"
                      key={t.id}
                      onClick={() =>
                        setTagIds((ids) => (on ? ids.filter((i) => i !== t.id) : [...ids, t.id]))
                      }
                    >
                      <Badge variant={on ? "default" : "outline"} className="cursor-pointer rounded-sm">
                        #{t.name}
                      </Badge>
                    </button>
                  );
                })}
              </div>
            </div>
          </Card>

          <Card className="space-y-3 p-4">
            <p className="text-xs uppercase tracking-widest text-muted-foreground">SEO</p>
            <div>
              <Label>Meta title</Label>
              <Input value={form.meta_title} onChange={(e) => setForm({ ...form, meta_title: e.target.value })} />
            </div>
            <div>
              <Label>Meta description</Label>
              <Textarea rows={3} value={form.meta_description} onChange={(e) => setForm({ ...form, meta_description: e.target.value })} />
            </div>
            <div>
              <Label>OG image (URL)</Label>
              <Input
                value={form.og_image}
                onChange={(e) => setForm({ ...form, og_image: e.target.value })}
                placeholder="Bỏ trống sẽ dùng ảnh bìa làm ảnh chia sẻ."
              />
            </div>
            <div>
              <Label>Canonical URL</Label>
              <Input value={form.canonical_url} onChange={(e) => setForm({ ...form, canonical_url: e.target.value })} />
            </div>
          </Card>

          <div className="flex gap-2">
            <Button variant="outline" className="flex-1" disabled={save.isPending} onClick={() => save.mutate("draft")}>
              Lưu nháp
            </Button>
            <Button className="flex-1" disabled={save.isPending} onClick={() => save.mutate("published")}>
              Xuất bản
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
