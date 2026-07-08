import { Link } from "@tanstack/react-router";
import { Badge } from "@/components/ui/badge";
import { formatDate } from "@/lib/format";
import { Clock } from "lucide-react";

export type PostCardData = {
  slug: string;
  title: string;
  excerpt?: string | null;
  cover_image?: string | null;
  reading_time?: number | null;
  published_at?: string | null;
  category?: { name: string; slug: string } | null;
};

export function PostCard({ post, variant = "default" }: { post: PostCardData; variant?: "default" | "compact" }) {
  return (
    <article className="group">
      <Link
        to="/post/$slug"
        params={{ slug: post.slug }}
        className="block"
      >
        {post.cover_image && (
          <div className="mb-4 aspect-[16/10] overflow-hidden rounded-md bg-muted">
            <img
              src={post.cover_image}
              alt={post.title}
              loading="lazy"
              className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
            />
          </div>
        )}
        <div className="flex items-center gap-3 text-xs text-muted-foreground">
          {post.category && (
            <Badge variant="secondary" className="rounded-sm font-normal">
              {post.category.name}
            </Badge>
          )}
          {post.published_at && <span>{formatDate(post.published_at)}</span>}
          {post.reading_time && (
            <span className="flex items-center gap-1">
              <Clock className="h-3 w-3" /> {post.reading_time} phút đọc
            </span>
          )}
        </div>
        <h3
          className={
            variant === "compact"
              ? "mt-2 font-serif text-lg font-medium leading-snug group-hover:text-accent"
              : "mt-3 font-serif text-2xl font-medium leading-snug group-hover:text-accent"
          }
        >
          {post.title}
        </h3>
        {post.excerpt && variant !== "compact" && (
          <p className="mt-2 line-clamp-2 text-sm text-muted-foreground">{post.excerpt}</p>
        )}
      </Link>
    </article>
  );
}
