import { createFileRoute } from "@tanstack/react-router";
import { useMutation } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { toast } from "sonner";
import { SiteLayout } from "@/components/layout/site-layout";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { sendContact } from "@/lib/marketing.functions";

export const Route = createFileRoute("/contact")({
  head: () => ({
    meta: [
      { title: "Liên hệ — Mikan Money Blog" },
      { name: "description", content: "Liên hệ với đội ngũ Mikan Money Blog." },
      { property: "og:title", content: "Liên hệ — Mikan Money Blog" },
      { property: "og:url", content: "/contact" },
    ],
    links: [{ rel: "canonical", href: "/contact" }],
  }),
  component: Contact,
});

function Contact() {
  const sendFn = useServerFn(sendContact);
  const [form, setForm] = useState({ name: "", email: "", message: "" });
  const send = useMutation({
    mutationFn: () => sendFn({ data: form }),
    onSuccess: () => {
      toast.success("Đã gửi. Cảm ơn bạn!");
      setForm({ name: "", email: "", message: "" });
    },
    onError: (e: any) => toast.error(e.message ?? "Không gửi được."),
  });

  return (
    <SiteLayout>
      <section className="mx-auto max-w-xl px-4 py-16">
        <h1 className="font-serif text-4xl">Liên hệ</h1>
        <p className="mt-2 text-muted-foreground">Có góp ý, câu hỏi hay đề xuất chủ đề? Hãy gửi cho chúng tôi.</p>
        <form
          onSubmit={(e) => { e.preventDefault(); send.mutate(); }}
          className="mt-8 space-y-4"
        >
          <div>
            <Label htmlFor="name">Họ tên</Label>
            <Input id="name" required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          </div>
          <div>
            <Label htmlFor="email">Email</Label>
            <Input id="email" type="email" required value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
          </div>
          <div>
            <Label htmlFor="message">Lời nhắn</Label>
            <Textarea id="message" rows={5} required value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })} />
          </div>
          <Button type="submit" disabled={send.isPending}>Gửi</Button>
        </form>
      </section>
    </SiteLayout>
  );
}
