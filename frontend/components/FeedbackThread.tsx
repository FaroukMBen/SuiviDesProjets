'use client';

import { useEffect, useState } from 'react';
import api from '@/lib/auth';
import { Send, MessageSquare, User, CornerDownRight, Clock } from 'lucide-react'; // Icônes modernes
import { Card } from '@/components/ui/Card'; // Ta carte standard

interface Reply {
  _id: string; // Ajouté si présent en base, sinon optionnel
  author: { name: string };
  content: string;
  createdAt: string;
}

interface Feedback {
  _id: string;
  author: { name: string };
  content: string;
  type: 'comment' | 'issue' | 'suggestion';
  replies: Reply[];
  createdAt: string;
}

export function FeedbackThread({ projectId }: { projectId: string }) {
  const [feedbacks, setFeedbacks] = useState<Feedback[]>([]);
  const [loading, setLoading] = useState(true);
  const [newFeedback, setNewFeedback] = useState('');
  
  // Gestion des réponses (input par feedback)
  const [replyContent, setReplyContent] = useState<{ [key: string]: string }>({});
  const [activeReplyId, setActiveReplyId] = useState<string | null>(null);

  useEffect(() => {
    fetchFeedback();
  }, [projectId]);

  const fetchFeedback = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/api/feedback/project/${projectId}`);
      setFeedbacks(response.data.feedback);
    } catch (err) {
      console.error("Erreur chargement feedback", err);
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
      // Ajout au début de la liste
      setFeedbacks([response.data.feedback, ...feedbacks]);
      setNewFeedback('');
    } catch (err) {
      alert("Erreur lors de l'envoi du feedback");
    }
  };

  const addReply = async (feedbackId: string) => {
    const content = replyContent[feedbackId];
    if (!content?.trim()) return;

    try {
      const response = await api.post(`/api/feedback/${feedbackId}/reply`, { content });
      
      // Mise à jour locale optimiste ou via réponse serveur
      setFeedbacks(feedbacks.map(f => f._id === feedbackId ? response.data.feedback : f));
      
      // Reset input
      setReplyContent({ ...replyContent, [feedbackId]: '' });
      setActiveReplyId(null);
    } catch (err) {
      alert("Erreur lors de la réponse");
    }
  };

  // Helper pour formater la date
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit'
    });
  };

  if (loading) return (
    <div className="space-y-4 animate-pulse">
      <div className="h-32 bg-gray-100 rounded-xl"></div>
      <div className="h-32 bg-gray-100 rounded-xl"></div>
    </div>
  );

  return (
    <div className="space-y-8 pb-12">
      
      {/* 1. Zone de Nouveau Feedback (En haut) */}
      <Card className="border-blue-100 shadow-sm relative overflow-hidden">
        <div className="absolute top-0 left-0 w-1 h-full bg-blue-600"></div>
        <form onSubmit={createFeedback} className="pl-2">
          <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
            <MessageSquare className="text-blue-600" size={20} />
            Nouveau sujet
          </h3>
          <div className="relative">
            <textarea
              value={newFeedback}
              onChange={(e) => setNewFeedback(e.target.value)}
              rows={3}
              className="w-full p-4 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition resize-none text-gray-800 placeholder-gray-400"
              placeholder="Partagez une remarque, un bug ou une suggestion..."
            />
            <div className="mt-3 flex justify-end">
              <button
                type="submit"
                disabled={!newFeedback.trim()}
                className="flex items-center gap-2 px-6 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
              >
                <Send size={16} />
                Publier
              </button>
            </div>
          </div>
        </form>
      </Card>

      {/* 2. Liste des Feedbacks */}
      <div className="space-y-6">
        {feedbacks.length === 0 ? (
          <div className="text-center py-12">
            <div className="bg-gray-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 text-gray-400">
              <MessageSquare size={32} />
            </div>
            <p className="text-gray-500 font-medium">Aucun feedback pour le moment.</p>
            <p className="text-sm text-gray-400">Soyez le premier à lancer la discussion !</p>
          </div>
        ) : (
          feedbacks.map((feedback) => (
            <div key={feedback._id} className="group">
              <Card className="p-6 border-gray-200 hover:border-blue-200 transition-colors">
                
                {/* Header Message Principal */}
                <div className="flex items-start gap-4">
                  {/* Avatar */}
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white font-bold text-sm shadow-sm shrink-0">
                    {feedback.author?.name ? feedback.author.name[0] : <User size={16}/>}
                  </div>
                  
                  <div className="flex-1">
                    <div className="flex justify-between items-start">
                      <div>
                        <span className="font-bold text-gray-900 mr-2">{feedback.author?.name}</span>
                        <span className="text-xs text-gray-400 flex items-center gap-1 inline-flex">
                           <Clock size={12} /> {formatDate(feedback.createdAt)}
                        </span>
                      </div>
                      <span className="px-2 py-1 bg-gray-100 text-gray-600 rounded text-[10px] font-bold uppercase tracking-wide">
                        {feedback.type || 'Commentaire'}
                      </span>
                    </div>

                    {/* Contenu */}
                    <p className="mt-3 text-gray-700 leading-relaxed whitespace-pre-line">
                      {feedback.content}
                    </p>

                    {/* Actions (Répondre) */}
                    <div className="mt-4 flex items-center gap-4">
                      <button 
                        onClick={() => setActiveReplyId(activeReplyId === feedback._id ? null : feedback._id)}
                        className="text-sm font-medium text-gray-500 hover:text-blue-600 transition flex items-center gap-1"
                      >
                        <MessageSquare size={14} />
                        {activeReplyId === feedback._id ? 'Annuler' : 'Répondre'}
                      </button>
                    </div>
                  </div>
                </div>
              </Card>

              {/* Section Réponses (Thread) */}
              <div className="ml-8 pl-8 border-l-2 border-gray-100 mt-2 space-y-4">
                {/* Liste des réponses existantes */}
                {feedback.replies?.map((reply, idx) => (
                  <div key={idx} className="flex gap-3 items-start py-2">
                    <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center text-xs font-bold text-gray-600 shrink-0">
                      {reply.author?.name ? reply.author.name[0] : 'U'}
                    </div>
                    <div className="bg-gray-50 p-3 rounded-lg rounded-tl-none border border-gray-100 flex-1">
                      <div className="flex items-baseline justify-between mb-1">
                         <span className="text-sm font-bold text-gray-900">{reply.author?.name}</span>
                         <span className="text-[10px] text-gray-400">{formatDate(reply.createdAt)}</span>
                      </div>
                      <p className="text-sm text-gray-700">{reply.content}</p>
                    </div>
                  </div>
                ))}

                {/* Input de réponse (Visible si "Répondre" cliqué) */}
                {activeReplyId === feedback._id && (
                  <div className="flex gap-3 items-start animate-in slide-in-from-top-2 duration-200">
                    <CornerDownRight className="text-gray-300 mt-2 ml-[-20px]" size={20} />
                    <div className="flex-1">
                        <textarea
                            autoFocus
                            value={replyContent[feedback._id] || ''}
                            onChange={(e) => setReplyContent({ ...replyContent, [feedback._id]: e.target.value })}
                            className="w-full p-3 bg-white border border-blue-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 text-sm"
                            placeholder="Écrivez votre réponse..."
                            rows={2}
                        />
                        <div className="flex justify-end mt-2">
                             <button
                                onClick={() => addReply(feedback._id)}
                                className="px-3 py-1.5 bg-gray-900 text-white text-xs font-medium rounded hover:bg-black transition"
                             >
                                Répondre
                             </button>
                        </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}