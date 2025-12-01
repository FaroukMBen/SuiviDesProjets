'use client';

import { useEffect, useState } from 'react';
import api from '@/lib/auth';

interface Reply {
  author: any;
  content: string;
  createdAt: string;
}

interface Feedback {
  _id: string;
  author: any;
  content: string;
  type: string;
  replies: Reply[];
  createdAt: string;
}

export function FeedbackThread({ projectId }: { projectId: string }) {
  const [feedbacks, setFeedbacks] = useState<Feedback[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [newFeedback, setNewFeedback] = useState('');
  const [replies, setReplies] = useState<{ [key: string]: string }>({});

  useEffect(() => {
    fetchFeedback();
  }, [projectId]);

  const fetchFeedback = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/api/feedback/project/${projectId}`);
      setFeedbacks(response.data.feedback);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to fetch feedback');
    } finally {
      setLoading(false);
    }
  };

  const createFeedback = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFeedback.trim()) return;

    try {
      const response = await api.post('/api/feedback', {
        projectId,
        content: newFeedback,
        type: 'comment'
      });
      setFeedbacks([response.data.feedback, ...feedbacks]);
      setNewFeedback('');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to create feedback');
    }
  };

  const addReply = async (feedbackId: string) => {
    if (!replies[feedbackId]?.trim()) return;

    try {
      const response = await api.post(`/api/feedback/${feedbackId}/reply`, {
        content: replies[feedbackId]
      });
      setFeedbacks(feedbacks.map(f => f._id === feedbackId ? response.data.feedback : f));
      setReplies({ ...replies, [feedbackId]: '' });
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to add reply');
    }
  };

  if (loading) {
    return <div className="flex justify-center py-8">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[--color-primary]"></div>
    </div>;
  }

  return (
    <div className="space-y-6">
      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
          {error}
        </div>
      )}

      <form onSubmit={createFeedback} className="bg-white p-6 rounded-lg border border-[--color-border]">
        <h3 className="text-lg font-semibold text-[--color-foreground] mb-4">Add Feedback</h3>
        <div className="space-y-4">
          <textarea
            value={newFeedback}
            onChange={(e) => setNewFeedback(e.target.value)}
            rows={4}
            className="w-full px-4 py-2 border border-[--color-border] rounded-lg focus:outline-none focus:ring-2 focus:ring-[--color-primary]"
            placeholder="Share your feedback..."
          />
          <button
            type="submit"
            className="px-6 py-2 bg-[--color-primary] text-white rounded-lg font-medium hover:bg-blue-600 transition"
          >
            Post Feedback
          </button>
        </div>
      </form>

      <div className="space-y-4">
        {feedbacks.map((feedback) => (
          <div key={feedback._id} className="bg-white p-6 rounded-lg border border-[--color-border]">
            <div className="flex items-start gap-3 mb-3">
              <div className="w-10 h-10 bg-[--color-primary] rounded-full flex items-center justify-center text-white font-bold">
                {feedback.author?.name?.charAt(0).toUpperCase()}
              </div>
              <div className="flex-1">
                <p className="font-medium text-[--color-foreground]">{feedback.author?.name}</p>
                <p className="text-xs text-[--color-muted]">
                  {new Date(feedback.createdAt).toLocaleDateString()}
                </p>
              </div>
            </div>

            <p className="text-[--color-foreground] mb-4">{feedback.content}</p>

            <div className="space-y-3 mb-4 pl-4 border-l border-[--color-border]">
              {feedback.replies?.map((reply, idx) => (
                <div key={idx} className="flex gap-3">
                  <div className="w-8 h-8 bg-[--color-secondary] rounded-full flex items-center justify-center text-white text-sm font-bold flex-shrink-0">
                    {reply.author?.name?.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <p className="font-medium text-sm text-[--color-foreground]">{reply.author?.name}</p>
                    <p className="text-sm text-[--color-foreground]">{reply.content}</p>
                  </div>
                </div>
              ))}
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                addReply(feedback._id);
              }}
              className="flex gap-2"
            >
              <input
                type="text"
                value={replies[feedback._id] || ''}
                onChange={(e) => setReplies({ ...replies, [feedback._id]: e.target.value })}
                className="flex-1 px-3 py-2 border border-[--color-border] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[--color-primary]"
                placeholder="Reply..."
              />
              <button
                type="submit"
                className="px-4 py-2 bg-[--color-primary] text-white rounded-lg text-sm hover:bg-blue-600 transition"
              >
                Reply
              </button>
            </form>
          </div>
        ))}
      </div>

      {feedbacks.length === 0 && (
        <div className="bg-white p-8 rounded-lg border border-[--color-border] text-center">
          <p className="text-[--color-muted]">No feedback yet</p>
        </div>
      )}
    </div>
  );
}
