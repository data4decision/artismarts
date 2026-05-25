'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { FaArrowLeft, FaHeart, FaRegHeart, FaComment, FaShare, FaUser, FaCheck } from 'react-icons/fa';
import { supabase } from '@/lib/supabase';
import toast from 'react-hot-toast';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';

interface Comment {
  id: string;
  user_id: string;
  content: string;
  created_at: string;
  user?: { first_name?: string; last_name?: string; profile_image?: string };
}

export default function GetFirstCustomers() {
  const [liked, setLiked] = useState(false);
  const [likes, setLikes] = useState(189);
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLike = () => {
    setLiked(!liked);
    setLikes(liked ? likes - 1 : likes + 1);
  };

  const fetchComments = async () => {
    const { data } = await supabase
      .from('blog_comments')
      .select(`*, user:profiles(first_name, last_name, profile_image)`)
      .eq('post_slug', 'get-first-customers')
      .order('created_at', { ascending: true });
    setComments(data || []);
  };

  const postComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim()) return;

    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return toast.error("Please sign in to comment");

      await supabase.from('blog_comments').insert({
        post_slug: 'get-first-customers',
        user_id: user.id,
        content: newComment.trim(),
      });

      setNewComment('');
      fetchComments();
      toast.success("Comment posted!");
    } catch (err) {
      toast.error("Failed to post comment");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
  fetchComments();

  const channel = supabase
    .channel('get-first-customers-comments')
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'blog_comments',
        filter: 'post_slug=eq.get-first-customers',
      },
      () => {
        fetchComments();
      }
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-white pb-20">
        <Navbar/>
      <div className="max-w-4xl mx-auto px-4 pt-8">
        <Link href="/blog" className="inline-flex items-center gap-2 text-[var(--blue)] mb-8 hover:underline">
          <FaArrowLeft /> Back to Blog
        </Link>

        <div className="grid md:grid-cols-2 gap-8 mb-10">
          <div className="relative h-[420px] rounded-3xl overflow-hidden shadow-2xl">
            <Image src="/blog/customers.jpg" alt="First Customers" priority fill className="object-cover" />
          </div>
          <div className="flex flex-col justify-center">
            <h1 className="text-4xl md:text-5xl font-bold text-[var(--blue)] leading-tight">
              How to Get Your First 10 Customers as a New Artisan
            </h1>
            <div className="flex items-center gap-6 text-sm text-gray-500 mt-6">
              <div><FaUser /> Adegbesan Oluwakayode</div>
              <div>May 8, 2026</div>
              <div>12 min read</div>
            </div>
          </div>
        </div>

        <div className="flex gap-6 mb-12">
          <button onClick={handleLike} className="flex items-center gap-3 text-2xl">
            {liked ? <FaHeart className="text-red-500" /> : <FaRegHeart />}
            <span>{likes}</span>
          </button>
          {/* <button className="flex items-center gap-3 text-2xl">
            <FaShare /> Share
          </button> */}
        </div>

        <article className="prose prose-lg max-w-none text-gray-700 leading-relaxed">
          <h2>Starting Strong as a New Artisan</h2>
          <p>Getting your first customers is often the hardest part of starting your artisan business. Here are proven strategies that actually work:</p>

          <h3>1. Optimize Your Artismart Profile</h3>
          <p>Use high-quality photos of your work, write a compelling bio, and clearly list all services you offer. A complete profile builds trust.</p>

          <h3>2. Offer Special Introductory Rates</h3>
          <p>Attract your first clients by offering 10-20% discount for first-time customers. This helps you build reviews and portfolio quickly.</p>

          <h3>3. Ask for Referrals</h3>
          <p>After completing a job, politely ask satisfied customers to refer you to their friends and family.</p>

          <h3>4. Be Active in Your Community</h3>
          <p>Join local WhatsApp groups, attend community events, and build genuine relationships.</p>

          <p className="mt-8 font-semibold">Remember: Your first 10 customers are the foundation of your business. Treat them exceptionally well.</p>
        </article>
      

        {/* Comments Section */}
        <div className="mt-16 border-t pt-12">
          <h3 className="text-2xl font-semibold mb-6">Comments ({comments.length})</h3>

          <form onSubmit={postComment} className="mb-10">
            <textarea
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              placeholder="Share your experience or ask a question..."
              className="w-full border border-gray-300 rounded-2xl p-5 min-h-[120px] focus:border-[var(--blue)]"
            />
            <button type="submit" disabled={loading} className="mt-4 bg-[var(--blue)] text-white px-8 py-3 rounded-xl">
              {loading ? 'Posting...' : 'Post Comment'}
            </button>
          </form>

          <div className="space-y-8">
            {comments.map((c) => (
              <div key={c.id} className="flex gap-4 bg-white p-6 rounded-2xl">
                <Image src={c.user?.profile_image || '/default-avatar.png'} alt="" width={48} height={48} className="rounded-full" />
                <div>
                  <p className="font-medium">{c.user?.first_name} {c.user?.last_name}</p>
                  <p className="text-gray-700 mt-1">{c.content}</p>
                  <p className="text-xs text-gray-400 mt-2">{new Date(c.created_at).toLocaleDateString()}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
      <Footer/>
    </div>
  );
}