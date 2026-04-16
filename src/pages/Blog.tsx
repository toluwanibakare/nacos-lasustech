import Layout from "@/components/Layout";
import BlogCard from "@/components/BlogCard";
import { blogs } from "@/data/blogs";

const Blog = () => {
  return (
    <Layout>
      <section className="bg-foreground py-14 md:py-20">
        <div className="container">
          <div className="max-w-lg">
            <span className="text-xs font-semibold uppercase tracking-widest text-primary">Insights</span>
            <h1 className="mt-2 font-display text-3xl font-bold text-white md:text-4xl">Chapter Blog</h1>
            <p className="mt-3 text-sm leading-relaxed text-white/60">
              Read latest news, tech trends, and chapter updates from NACOS LASUSTECH.
            </p>
          </div>
        </div>
      </section>

      <section className="py-14 md:py-20 text-black">
        <div className="container">
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {blogs.map((blog) => (
              <BlogCard key={blog.id} {...blog} />
            ))}
          </div>
        </div>
      </section>
    </Layout>
  );
};

export default Blog;
