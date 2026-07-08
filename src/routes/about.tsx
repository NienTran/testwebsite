import { createFileRoute } from "@tanstack/react-router";
import { SiteLayout } from "@/components/layout/site-layout";

export const Route = createFileRoute("/about")({
  head: () => ({
    meta: [
      { title: "Giới thiệu — Mikan Money Blog" },
      { name: "description", content: "Về Mikan Money Blog: định hướng, giá trị và cam kết nội dung." },
      { property: "og:title", content: "Giới thiệu — Mikan Money Blog" },
      { property: "og:url", content: "/about" },
    ],
    links: [{ rel: "canonical", href: "/about" }],
  }),
  component: About,
});

function About() {
  return (
    <SiteLayout>
      <article className="mx-auto max-w-2xl px-4 py-16">
        <h1 className="font-serif text-4xl">Về Mikan Money Blog</h1>
        <p className="mt-6 text-muted-foreground">
          Mikan Money Blog là không gian đọc chậm dành cho những ai muốn học kỹ năng số,
          công nghệ và tài chính một cách trung lập, có trách nhiệm.
        </p>
        <div className="prose-article mt-6">
          <h2>Chúng tôi tin điều gì</h2>
          <ul>
            <li>Kiến thức nên được chia sẻ với sự khiêm tốn — không cường điệu, không hứa hẹn.</li>
            <li>Rủi ro tài chính cần được nhắc rõ, đặc biệt trong lĩnh vực crypto và đầu tư.</li>
            <li>Nội dung là để giáo dục, không thay thế cho lời khuyên chuyên môn.</li>
          </ul>
          <h2>Chủ đề chúng tôi viết</h2>
          <ul>
            <li>Kỹ năng số cơ bản và nâng cao.</li>
            <li>Giáo dục về làm việc và học tập trực tuyến.</li>
            <li>Kiến thức nhập môn blockchain, cập nhật airdrop có sàng lọc.</li>
            <li>Mẹo công nghệ, tin tài chính cá nhân, quản lý tiền.</li>
          </ul>
          <blockquote>
            Bài viết mang tính giáo dục. Chúng tôi không đưa ra khuyến nghị đầu tư.
          </blockquote>
        </div>
      </article>
    </SiteLayout>
  );
}
