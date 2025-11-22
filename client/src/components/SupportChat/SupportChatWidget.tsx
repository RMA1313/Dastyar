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
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
      return;
    }
    fetchThread();
    intervalRef.current = setInterval(fetchThread, refreshIntervalMs);
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
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
      // fail silently; widget is best-effort
    } finally {
      setSending(false);
    }
  };

  const sortedMessages = useMemo(
    () =>
      (thread?.messages ?? []).slice().sort((a, b) => {
        const aDate = a.createdAt ? new Date(a.createdAt).getTime() : 0;
        const bDate = b.createdAt ? new Date(b.createdAt).getTime() : 0;
        return aDate - bDate;
      }),
    [thread?.messages],
  );

  return (
    <div dir="rtl" className="fixed bottom-4 right-4 z-[60] flex flex-col items-end space-y-2">
      {open && (
        <div className="flex w-80 flex-col overflow-hidden rounded-2xl bg-white/95 text-right shadow-2xl ring-1 ring-[#8ed5ff] backdrop-blur dark:bg-slate-900/95 dark:text-white">
          <div className="flex items-center justify-between bg-gradient-to-l from-[#008dc4] via-[#0028be] to-[#8ed5ff] px-3 py-2 text-white">
            <div className="flex items-center gap-2">
              <MessageSquare size={18} />
              <span className="font-semibold">چت پشتیبانی</span>
            </div>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="rounded-full p-1 transition hover:bg-white/20"
            >
              <X size={16} />
            </button>
          </div>
          <div className="flex h-64 flex-col gap-2 overflow-y-auto px-3 py-2">
            {!isAuthenticated ? (
              <p className="text-sm text-slate-600 dark:text-slate-300">
                برای ارسال پیام به پشتیبانی ابتدا وارد حساب شوید.
              </p>
            ) : loading ? (
              <div className="flex h-full items-center justify-center">
                <Spinner />
              </div>
            ) : sortedMessages.length === 0 ? (
              <p className="text-sm text-slate-600 dark:text-slate-300">
                پرسش خود را بنویسید تا تیم پشتیبانی پاسخ دهد.
              </p>
            ) : (
              sortedMessages.map((msg, idx) => (
                <div
                  key={idx}
                  className={`flex ${msg.sender === 'user' ? 'justify-start' : 'justify-end'}`}
                >
                  <div
                    className={`max-w-[90%] rounded-2xl px-3 py-2 text-sm shadow ${
                      msg.sender === 'user'
                        ? 'bg-[#8ed5ff]/40 text-[#0028be]'
                        : 'bg-[#0028be] text-white'
                    }`}
                  >
                    {msg.text}
                  </div>
                </div>
              ))
            )}
          </div>
          <div className="border-t border-[#8ed5ff]/50 bg-white/60 p-3 backdrop-blur dark:bg-slate-900/70">
            <div className="flex items-center gap-2">
              <input
                disabled={!isAuthenticated || sending}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    sendMessage();
                  }
                }}
                className="flex-1 rounded-xl border border-[#aab8c3] bg-white px-3 py-2 text-sm text-[#0028be] focus:border-[#008dc4] focus:outline-none dark:bg-slate-800 dark:text-white"
                placeholder={
                  isAuthenticated ? 'پیام پشتیبانی خود را بنویسید...' : 'پس از ورود می‌توانید پیام دهید'
                }
              />
              <Button
                disabled={!isAuthenticated || sending || !input.trim()}
                onClick={sendMessage}
                className="rounded-xl bg-[#0028be] px-3 py-2 text-white hover:bg-[#008dc4]"
              >
                {sending ? <Spinner /> : 'ارسال'}
              </Button>
            </div>
          </div>
        </div>
      )}
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className="flex items-center gap-2 rounded-full bg-[#0028be] px-4 py-2 text-sm font-semibold text-white shadow-lg ring-2 ring-[#8ed5ff] transition hover:bg-[#008dc4]"
      >
        <MessageSquare size={18} />
        <span>پشتیبانی</span>
      </button>
    </div>
  );
};

export default SupportChatWidget;
