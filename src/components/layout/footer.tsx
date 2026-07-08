import { Link } from "@tanstack/react-router";
import { SITE } from "@/lib/site";

export function Footer() {
  return (
    <footer className="mt-24 border-t bg-secondary/40">
      <div className="mx-auto grid max-w-6xl gap-10 px-4 py-12 md:grid-cols-4">
        <div>
          <div className="flex items-center gap-2 font-serif text-lg">
            <span className="grid h-7 w-7 place-items-center rounded-full bg-accent text-accent-foreground">
              蜜
            </span>
            {SITE.name}
          </div>
          <p className="mt-3 text-sm text-muted-foreground">
            Không gian đọc chậm về kỹ năng số, công nghệ và tài chính — trung lập, có trách
            nhiệm, và luôn nhắc nhở về rủi ro.
          </p>
        </div>
        <div>
          <h4 className="mb-3 text-sm font-medium">Chuyên mục</h4>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li><Link to="/category/$slug" params={{ slug: "ky-nang-so" }} className="hover:text-accent">Kỹ năng số</Link></li>
            <li><Link to="/category/$slug" params={{ slug: "blockchain-crypto" }} className="hover:text-accent">Blockchain & Crypto</Link></li>
            <li><Link to="/category/$slug" params={{ slug: "airdrop-bounty" }} className="hover:text-accent">Airdrop & Bounty</Link></li>
            <li><Link to="/category/$slug" params={{ slug: "tin-tai-chinh" }} className="hover:text-accent">Tin tài chính</Link></li>
          </ul>
        </div>
        <div>
          <h4 className="mb-3 text-sm font-medium">Điều hướng</h4>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li><Link to="/blog" className="hover:text-accent">Tất cả bài viết</Link></li>
            <li><Link to="/about" className="hover:text-accent">Giới thiệu</Link></li>
            <li><Link to="/contact" className="hover:text-accent">Liên hệ</Link></li>
            <li><Link to="/auth" className="hover:text-accent">Đăng nhập</Link></li>
          </ul>
        </div>
        <div>
          <h4 className="mb-3 text-sm font-medium">Ghi chú</h4>
          <p className="text-sm text-muted-foreground">
            Nội dung trên blog mang tính giáo dục, không phải khuyến nghị đầu tư. Đầu tư tài
            sản số có rủi ro. Hãy tự nghiên cứu và cân nhắc.
          </p>
        </div>
      </div>
      <div className="border-t">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-2 px-4 py-4 text-xs text-muted-foreground md:flex-row">
          <p>© {new Date().getFullYear()} {SITE.name}. All rights reserved.</p>
          <p>Made with 静けさ · Silence & simplicity.</p>
        </div>
      </div>
    </footer>
  );
}
