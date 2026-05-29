import { getAllBlogs, getAllBlogTags } from "@/lib/content/blogs";
import BlogPageClient from "@/components/blog/BlogPageClient";

export default function BlogsPage() {
  const posts = getAllBlogs();
  const allTags = getAllBlogTags();

  return (
    <div className="page-container py-16">
      <h1 className="text-2xl font-semibold tracking-tight text-foreground">
        Blogs
      </h1>
      <p className="mt-2 text-sm text-muted">
        Long-form writing on topics I find interesting. Sorted by most recently updated.
      </p>

      <div className="mt-8">
        <BlogPageClient posts={posts} allTags={allTags} />
      </div>
    </div>
  );
}
