// app/dashboard/[role]/messages/[conversationId]/page.tsx
'use client';

import { useEffect, useRef, useState } from 'react';
import { useParams } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import toast from 'react-hot-toast';

type Message = {
  id: string;
  sender_id: string;
  content: string;
  created_at: string;
};

export default function ChatPage() {
  const { conversationId } = useParams<{ conversationId: string }>();
  const { user, profile, loading: authLoading } = useAuth();  // ← using profile here

  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [loadingMessages, setLoadingMessages] = useState(true);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const supabase = createClient();

  const currentUserId = user?.id;

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // Load initial messages
  useEffect(() => {
    if (!conversationId || !user || authLoading) return;

    const loadMessages = async () => {
      setLoadingMessages(true);
      try {
        const { data, error } = await supabase
          .from('messages')
          .select('*')
          .eq('conversation_id', conversationId)
          .order('created_at', { ascending: true });

        if (error) throw error;
        setMessages(data || []);
        setTimeout(scrollToBottom, 100); // small delay for smooth render
      } catch (err: any) {
        console.error('Failed to load messages:', err);
        toast.error('Could not load chat history');
      } finally {
        setLoadingMessages(false);
      }
    };

    loadMessages();
  }, [conversationId, user, authLoading, supabase]);

  // Realtime subscription
  useEffect(() => {
    if (!conversationId || !user || authLoading) return;

    const channel = supabase
      .channel(`conversation:${conversationId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `conversation_id=eq.${conversationId}`,
        },
        (payload) => {
          const newMsg = payload.new as Message;
          setMessages((prev) => [...prev, newMsg]);
          scrollToBottom();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [conversationId, user, authLoading, supabase]);

  const handleSend = async () => {
    if (!newMessage.trim() || !user || sending) return;

    const content = newMessage.trim();
    setSending(true);

    try {
      const { error } = await supabase.from('messages').insert({
        conversation_id: conversationId,
        sender_id: user.id,
        content,
      });

      if (error) throw error;

      setNewMessage('');
    } catch (err: any) {
      console.error('Send failed:', err);
      toast.error('Message not sent – try again');
    } finally {
      setSending(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  // ────────────────────────────────────────────────
  //  RENDER
  // ────────────────────────────────────────────────

  if (authLoading) {
    return (
      <div className="h-screen flex items-center justify-center bg-[var(--background)]">
        <div className="text-[var(--white)] text-lg">Loading account...</div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="h-screen flex items-center justify-center bg-[var(--background)]">
        <div className="text-[var(--white)] text-lg">Please sign in to chat</div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen bg-[var(--background)] text-[var(--white)]">
      {/* Header – using profile?.role */}
      <header className="bg-[var(--blue)] px-4 py-3.5 shadow-md flex items-center justify-between">
        <h1 className="text-xl font-semibold">
          {profile?.role === 'admin' ? 'Support Chat' : 'Chat with Admin'}
        </h1>
        {/* Optional: back button or job info */}
      </header>

      {/* Messages container */}
      <main className="flex-1 overflow-y-auto px-4 py-5 space-y-5 bg-gradient-to-b from-[var(--blue)]/5 to-transparent">
        {loadingMessages ? (
          // Loading skeleton
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <div
                key={i}
                className={`flex ${i % 2 === 0 ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`w-3/5 h-16 rounded-2xl animate-pulse ${
                    i % 2 === 0 ? 'bg-[var(--orange)]/30' : 'bg-white/10'
                  }`}
                />
              </div>
            ))}
          </div>
        ) : messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center opacity-70">
            <div className="text-5xl mb-4">💬</div>
            <p className="text-lg">No messages yet</p>
            <p className="text-sm mt-2">Start the conversation</p>
          </div>
        ) : (
          messages.map((msg) => {
            const isOwn = msg.sender_id === currentUserId;
            return (
              <div
                key={msg.id}
                className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[78%] px-4 py-3 rounded-2xl shadow-sm ${
                    isOwn
                      ? 'bg-[var(--orange)] text-white rounded-br-none'
                      : 'bg-white/10 backdrop-blur-sm text-[var(--white)] rounded-bl-none border border-white/10'
                  }`}
                >
                  <p className="leading-relaxed break-words">{msg.content}</p>
                  <time className="text-xs opacity-70 mt-1.5 block text-right">
                    {new Date(msg.created_at).toLocaleTimeString([], {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </time>
                </div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </main>

      {/* Input area */}
      <footer className="bg-[var(--blue)]/95 border-t border-[var(--orange)]/30 p-4 backdrop-blur-sm">
        <div className="flex items-center gap-3 max-w-4xl mx-auto">
          <input
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type your message..."
            className="flex-1 bg-white/10 border border-white/20 rounded-full px-5 py-3.5 text-[var(--white)] placeholder:text-white/50 focus:outline-none focus:border-[var(--orange)] focus:ring-2 focus:ring-[var(--orange)]/40 transition-all"
            disabled={sending}
          />
          <button
            onClick={handleSend}
            disabled={sending || !newMessage.trim()}
            className="bg-[var(--orange)] text-white px-7 py-3.5 rounded-full font-medium hover:bg-[var(--orange)]/90 active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-md"
          >
            {sending ? 'Sending...' : 'Send'}
          </button>
        </div>
      </footer>
    </div>
  );
}