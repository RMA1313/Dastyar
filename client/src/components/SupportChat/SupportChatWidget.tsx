// Redesigned SupportChatWidget.tsx
// Modern glassmorphism style matching main UI

import { useEffect, useMemo, useRef, useState } from 'react';
import { MessageSquare, X } from 'lucide-react';
import { Button, Spinner } from '@librechat/client';
import { useOptionalAuthContext } from '~/hooks/AuthContext';

type SupportMessage = {
  sender: 'user' | 'admin';
  text: string;
  createdAt?: string;
};

type SupportThread = {
  id?: string;
  messages: SupportMessage[];
  status?: string;
};

const refreshIntervalMs = 20000;

const SupportChatWidget = () => {
  const auth = useOptionalAuthContext();
  const isAuthenticated = auth?.isAuthenticated ?? false;
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [thread, setThread] = useState<SupportThread | null>(null);
  const [input, setInput] = useState('');
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const fetchThread = async () => {
    if (!isAuthenticated) {
      setThread(null);
      return;
    }
    setLoading(true);
    try {
      const res = await fetch('/api/support', { credentials: 'include' });
      const data = await res.json();
      setThread(data?.thread ?? { messages: [] });
    } catch {
      setThread((prev) => prev || { messages: [] });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!isAuthenticated || !open) {
      if (intervalRef.current) clearInterval(intervalRef.current);
      return;
    }
    fetchThread();
    intervalRef.current = setInterval(fetchThread, refreshIntervalMs);
    return () => intervalRef.current && clearInterval(intervalRef.current);
  }, [isAuthenticated, open]);

  const sendMessage = async () => {
    if (!input.trim() || !isAuthenticated) return;
    setSending(true);
    try {
      const res = await fetch('/api/support', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ message: input.trim() }),
      });
      const data = await res.json();
      setThread(data?.thread ?? { messages: [] });
      setInput('');
    } catch {
    } finally {
      setSending(false);
    }
  };

  const sortedMessages = useMemo(
    () => (thread?.messages ?? []).slice().sort((a, b) => {
      const aDate = a.createdAt ? new Date(a.createdAt).getTime() : 0;
      const bDate = b.createdAt ? new Date(b.createdAt).getTime() : 0;
      return aDate - bDate;
    }),
    [thread?.messages],
  );

  return (
    <div dir="rtl" className="fixed bottom-4 right-4 z-[60] flex flex-col items-end space-y-3">
      {open && (
        <div className="flex w-80 flex-col overflow-hidden rounded-3xl bg-white/70 backdrop-blur-xl shadow-2xl border border-white/40">
          {/* Header */}
          <div className="flex items-center justify-between bg-gradient-to-l from-[#2E5BFF] to-[#00A4FF] px-4 py-2 text-white">
            <div className="flex items-center gap-2">
              <MessageSquare size={18} />
              <span className="font-[Vazir]">چت پشتیبانی</span>
            </div>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="rounded-full p-1 transition hover:bg-white/20"
            >
              <X size={16} />
            </button>
          </div>

          {/* Messages */}
          <div className="flex h-64 flex-col gap-3 overflow-y-auto px-4 py-3">
            {!isAuthenticated ? (
              <p className="text-sm text-slate-600">برای ارسال پیام ابتدا وارد حساب شوید.</p>
            ) : loading ? (
              <div className="flex h-full items-center justify-center"><Spinner /></div>
            ) : sortedMessages.length === 0 ? (
              <p className="text-sm text-slate-600">سوال خود را بنویسید تا پاسخ دهیم.</p>
            ) : (
              sortedMessages.map((msg, i) => (
                <div key={i} className={`flex ${msg.sender === 'user' ? 'justify-start' : 'justify-end'}`}>
                  <div
                    className={`max-w-[85%] px-4 py-2 rounded-2xl shadow-sm backdrop-blur text-sm whitespace-pre-wrap ${
                      msg.sender === 'user'
                        ? 'bg-[#E8F2FF]/80 text-[#003D8F]' // user bubble
                        : 'bg-white/90 text-[#0F172A] border border-[#E5EAF1]' // admin bubble
                    }`}
                  >
                    {msg.text}
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Input */}
          <div className="border-t border-white/30 bg-white/60 backdrop-blur-xl p-3">
            <div className="flex items-center gap-2">
              <input
                disabled={!isAuthenticated || sending}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
                className="flex-1 rounded-2xl border border-[#D0D7E0] bg-white/80 backdrop-blur px-3 py-2 text-sm text-[#003D8F] focus:border-[#2E5BFF] focus:outline-none"
                placeholder={
                  isAuthenticated
                    ? 'پیام پشتیبانی خود را بنویسید...'
                    : 'برای پیام به پشتیبانی ابتدا وارد شوید'
                }
              />

              <Button
                disabled={!isAuthenticated || sending || !input.trim()}
                onClick={sendMessage}
                className="rounded-2xl bg-gradient-to-l from-[#2E5BFF] to-[#00A4FF] px-4 py-2 text-white shadow-md hover:opacity-90"
              >
                {sending ? <Spinner /> : 'ارسال'}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Floating button */}
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="glass-fab flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold text-[var(--brand-navy)] hover:shadow-lg"
      >
        <MessageSquare size={18} />
        <span>پشتیبانی</span>
      </button>
    </div>
  );
};

export default SupportChatWidget;