import { notFound } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { FaArrowLeft, FaCalendar, FaUser } from 'react-icons/fa';

const blogPosts = [
  {
    id: 1,
    title: "10 Essential Skills Every Artisan Should Master in 2026",
    excerpt: "Discover the most in-demand skills...",
    image: "/blog/skills.jpg",
    date: "May 10, 2026",
    author: "Artismart Team",
    content: "<h2>Full content here...</h2><p>This is where the full article goes.</p>"
  },
  {
    id: 2,
    title: "How to Get Your First 10 Customers as a New Artisan",
    excerpt: "Practical strategies every new artisan should use...",
    image: "/blog/customers.jpg",
    date: "May 8, 2026",
    author: "Adekunle Johnson",
    content: "<h2>Full content here...</h2>"
  },
  {
    id: 3,
    title: "The Ultimate Guide to Home Maintenance in Nigeria",
    excerpt: "Learn how to maintain your home properly...",
    image: "/blog/home-maintenance.jpg",
    date: "May 5, 2026",
    author: "Artismart Team",
    content: "<h2>Full content here...</h2>"
  }
];

export default function BlogPost({ params }: { params: { id: string } }) {
  const post = blogPosts.find(p => p.id === parseInt(params.id));

  if (!post) notFound();

  return (
    <div className="min-h-screen bg-gray-50 pb-16">
      <div className="max-w-4xl mx-auto px-4 pt-8">
        <Link href="/blog" className="inline-flex items-center gap-2 text-[var(--blue)] mb-8 hover:underline">
          <FaArrowLeft /> Back to Blog
        </Link>

        <Image 
          src={post.image} 
          alt={post.title} 
          width={1200} 
          height={600} 
          className="rounded-3xl mb-8 w-full object-cover" 
        />

        <h1 className="text-4xl md:text-5xl font-bold text-[var(--blue)] leading-tight mb-6">
          {post.title}
        </h1>

        <div className="flex items-center gap-6 text-sm text-gray-500 my-8">
          <div className="flex items-center gap-2">
            <FaUser /> {post.author}
          </div>
          <div className="flex items-center gap-2">
            <FaCalendar /> {post.date}
          </div>
        </div>

        <div 
          className="prose prose-lg max-w-none text-gray-700 leading-relaxed"
          dangerouslySetInnerHTML={{ __html: post.content }} 
        />
      </div>
    </div>
  );
}