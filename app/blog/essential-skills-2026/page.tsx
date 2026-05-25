'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { FaArrowLeft, FaHeart, FaRegHeart, FaComment, FaShare, FaUser } from 'react-icons/fa';
import { supabase } from '@/lib/supabase';
import toast from 'react-hot-toast';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';

interface Comment {
  id: string;
  user_id: string;
  content: string;
  created_at: string;
  likes: number;
  user?: {
    first_name?: string;
    last_name?: string;
    profile_image?: string;
  };
}

export default function EssentialSkills2026() {
  const [liked, setLiked] = useState(false);
  const [likes, setLikes] = useState(0);
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [loading, setLoading] = useState(false);

  // Like Article
  const handleLike = () => {
    setLiked(!liked);
    setLikes(liked ? likes - 1 : likes + 1);
  };

  // Fetch Comments
  const fetchComments = async () => {
    try {
      const { data, error } = await supabase
        .from('blog_comments')
        .select(`
          *,
          user:profiles(first_name, last_name, profile_image)
        `)
        .eq('post_slug', 'essential-skills-2026')
        .order('created_at', { ascending: true });

      if (error) throw error;
      setComments(data || []);
    } catch (err) {
      console.error('Error fetching comments:', err);
    }
  };

  // Post Comment
  const postComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim()) return;

    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error("Please sign in to comment");
        return;
      }

      const { error } = await supabase
        .from('blog_comments')
        .insert({
          post_slug: 'essential-skills-2026',
          user_id: user.id,
          content: newComment.trim(),
        });

      if (error) throw error;

      setNewComment('');
      fetchComments();
      toast.success("Comment posted successfully!");
    } catch (err) {
      toast.error("Failed to post comment");
    } finally {
      setLoading(false);
    }
  };

  // Real-time Comments
  useEffect(() => {
    fetchComments();

    const channel = supabase
      .channel('blog-comments')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'blog_comments',
          filter: 'post_slug=eq.essential-skills-2026'
        },
        fetchComments
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
        <Navbar/>
      <div className="max-w-4xl mx-auto px-4 pt-8">
        {/* Back Button */}
        <Link href="/blog" className="inline-flex items-center gap-2 text-[var(--blue)] mb-8 hover:underline">
          <FaArrowLeft /> Back to Blog
        </Link>

        {/* Featured Image */}
        <div className="relative h-[480px] rounded-3xl overflow-hidden mb-10 shadow-2xl">
          <Image 
            src="/blog/skills.jpg" 
            alt="10 Essential Skills Every Artisan Should Master in 2026" 
            fill 
            className="object-cover" 
            priority
          />
        </div>

        {/* Title */}
        <h1 className="text-4xl md:text-5xl font-bold text-[var(--blue)] leading-tight mb-6">
          10 Essential Skills Every Artisan Should Master in 2026
        </h1>

        {/* Meta Info */}
        <div className="flex items-center gap-6 text-sm text-gray-500 mb-10">
          <div className="flex items-center gap-2">
            <FaUser /> Adegbesan Oluwakayode
          </div>
          <div>May 12, 2026</div>
          <div>10 min read</div>
        </div>

        

        {/* Full Article Content */}
        <article className="prose prose-lg max-w-none text-gray-700 leading-relaxed">
          <h2>Why Skills Matter More Than Ever</h2>
          <p>The artisan industry in Nigeria is evolving rapidly. Customers are now more informed and selective. To succeed and grow your business in 2026 and beyond, you need more than just traditional craftsmanship.</p>

          <h3>1. Digital Marketing &amp; Social Media</h3>
          <p>Mastering Instagram, WhatsApp Business, and platforms like Artismart is no longer optional. Learn how to showcase your work professionally and reach more customers.</p>

          <h3>2. Professional Customer Service</h3>
          <p>Clear communication, punctuality, respect, and excellent after-service support build trust and generate repeat business and referrals.</p>

          <h3>3. Business Management Basics</h3>
          <p>Understand pricing strategies, proper record keeping, invoicing, and basic financial management to run a sustainable business.</p>

          <h3>4. High-Quality Photography</h3>
          <p>Learn to take professional photos of your finished work. Great visuals are one of the strongest marketing tools available to you.</p>

          <h3>5. Time Management &amp; Project Planning</h3>
          <p>Deliver jobs on time. Learn how to manage multiple projects efficiently without compromising quality.</p>

          <h3>6. Negotiation Skills</h3>
          <p>Master professional negotiation techniques to secure fair prices while maintaining excellent customer relationships.</p>

          <h3>7. Basic Financial Literacy</h3>
          <p>Track your expenses, savings, and profits properly. This skill separates struggling artisans from successful business owners.</p>

          <h3>8. Safety &amp; Professionalism</h3>
          <p>Always prioritize safety on job sites. Wear proper work attire and present yourself professionally to win bigger contracts.</p>

          <h3>9. Continuous Learning</h3>
          <p>The best artisans never stop learning new techniques, tools, and industry trends.</p>

          <h3>10. Online Reputation Management</h3>
          <p>Respond to reviews professionally — both positive and negative. Your online reputation directly impacts your income.</p>

          <div className="bg-[var(--blue)]/10 p-8 rounded-2xl mt-12">
            <p className="font-semibold text-[var(--blue)] text-lg">
              Pro Tip: Don’t try to master all 10 skills at once. Pick 2–3 skills from this list and focus on them deeply before moving to the next. Consistency beats perfection.
            </p>
          </div>
        </article>
        {/* Action Bar */}
        <div className="flex items-center gap-6  py-6 mt-12">
          <button 
            onClick={handleLike}
            className="flex items-center gap-3 text-xl hover:text-red-500 transition"
          >
            {liked ? <FaHeart className="text-red-500" /> : <FaRegHeart />}
            <span>{likes}</span>
          </button>
          {/* <button className="flex items-center gap-3 text-xl">
            <FaShare /> Share
          </button> */}
        </div>

        {/* Comments Section */}
        <div className="mt-16 border-t pt-6">
          <h3 className="text-2xl font-semibold mb-6 flex items-center gap-3">
            <FaComment /> Comments ({comments.length})
          </h3>

          {/* Add Comment */}
          <form onSubmit={postComment} className="mb-12">
            <textarea
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              placeholder="Share your thoughts..."
              className="w-full border border-gray-300 rounded-2xl p-5 focus:outline-none focus:border-[var(--blue)] min-h-[110px]"
            />
            <button
              type="submit"
              disabled={loading}
              className="mt-4 bg-[var(--blue)] text-white px-8 py-3 rounded-xl hover:bg-blue-700 disabled:opacity-50"
            >
              {loading ? 'Posting...' : 'Post Comment'}
            </button>
          </form>

          {/* Comments Display */}
          <div className="space-y-8">
            {comments.map((comment) => (
              <div key={comment.id} className="flex gap-4 bg-white p-6 rounded-2xl shadow-sm">
                <div className="flex-shrink-0">
                  <Image 
                    src={comment.user?.profile_image || '/default-avatar.png'} 
                    alt="User Avatar" 
                    width={48} 
                    height={48} 
                    className="rounded-full" 
                  />
                </div>
                
                <div className="flex-1">
                  <p className="font-medium">
                    {comment.user?.first_name} {comment.user?.last_name}
                  </p>
                  <p className="text-gray-700 mt-1 leading-relaxed">{comment.content}</p>
                  <p className="text-xs text-gray-400 mt-3">
                    {new Date(comment.created_at).toLocaleDateString('en-GB', { 
                      year: 'numeric', month: 'long', day: 'numeric' 
                    })}
                  </p>
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