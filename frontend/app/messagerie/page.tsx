'use client';

import { useState, useEffect, useRef } from 'react';
import { useAuthStore } from '@/lib/store';
import api from '@/lib/auth';
import ProtectedRoute from '@/components/ProtectedRoute';
import { Navbar } from '@/components/Navbar';
import { NotificationBell } from '@/components/NotificationBell';
import { UserSearch } from '@/components/UserSearch';
import { Send, MessageSquare, MoreVertical, Phone, Video, Users, Plus, UserPlus, Trash2, LogOut, Info, X } from 'lucide-react';
import { format } from 'date-fns';

interface User {
  _id: string;
  name: string;
  email: string;
  profilePicture?: string;
  role: string;
}

interface Message {
  _id: string;
  conversationId: string;
  sender: User;
  content: string;
  createdAt: string;
}

interface Conversation {
  _id: string;
  participants: User[];
  lastMessage?: Message;
  updatedAt: string;
  isGroup: boolean;
  name?: string;
  admin?: string;
}

export default function MessageriePage() {
  const { user } = useAuthStore();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConversation, setActiveConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  
  // UI States
  const [showNewChat, setShowNewChat] = useState(false);
  const [showCreateGroup, setShowCreateGroup] = useState(false);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [showMembersModal, setShowMembersModal] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  
  const [groupName, setGroupName] = useState('');

  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchConversations();
    const interval = setInterval(fetchConversations, 10000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (activeConversation) {
      fetchMessages(activeConversation._id);
      const interval = setInterval(() => fetchMessages(activeConversation._id), 3000);
      return () => clearInterval(interval);
    }
  }, [activeConversation]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    function handleClickOutside(event: any) {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setShowMenu(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [showMenu]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const fetchConversations = async () => {
    try {
      if(!user) return;
      const { data } = await api.get('/api/chat/conversations');
      setConversations(data.conversations);
    } catch (error) {
      console.error('Error fetching conversations:', error);
    }
  };

  const fetchMessages = async (conversationId: string) => {
    try {
      const { data } = await api.get(`/api/chat/messages/${conversationId}`);
      setMessages(data.messages);
    } catch (error) {
      console.error('Error fetching messages:', error);
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !activeConversation) return;

    try {
      const { data } = await api.post('/api/chat/send', {
        conversationId: activeConversation._id,
        content: newMessage
      });
      
      setMessages([...messages, data.message]);
      setNewMessage('');
      fetchConversations();
    } catch (error) {
      console.error('Error sending message:', error);
    }
  };

  const handleStartConversation = async (selectedUser: any) => {
    try {
      const { data } = await api.post('/api/chat/start', {
        recipientId: selectedUser._id
      });
      const conversation = data.conversation;
      if (!conversations.find(c => c._id === conversation._id)) {
        setConversations([conversation, ...conversations]);
      }
      setActiveConversation(conversation);
      setShowNewChat(false);
    } catch (error) {
      console.error('Error starting conversation:', error);
    }
  };

  const handleCreateGroup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!groupName.trim()) return;

    try {
        const { data } = await api.post('/api/chat/create-group', { name: groupName });
        setConversations([data.conversation, ...conversations]);
        setActiveConversation(data.conversation);
        setGroupName('');
        setShowCreateGroup(false);
    } catch (error) {
        console.error('Error creating group', error);
    }
  };

  const handleInviteToGroup = async (selectedUser: any) => {
    if(!activeConversation) return;
    try {
        await api.post('/api/chat/invite-group', {
            conversationId: activeConversation._id,
            recipientId: selectedUser._id
        });
        
        alert('Invitation envoyée !');
        setShowInviteModal(false);
    } catch (error: any) {
        alert(error.response?.data?.message || 'Erreur lors de l\'invitation');
    }
  };

  const handleDeleteConversation = async () => {
    if (!activeConversation) return;
    setShowMenu(false);
    const isGroup = activeConversation.isGroup;
    const myUserId = user ? (user.id || (user as any)._id) : null;
    const isAdmin = activeConversation.admin === myUserId;

    if (isGroup && !isAdmin) {
        alert("Seul le créateur du groupe peut le supprimer. Vous pouvez cependant quitter le groupe.");
        return;
    }

    if (!window.confirm("Êtes-vous sûr de vouloir supprimer cette conversation ? Cette action est irréversible.")) {
        return;
    }

    try {
        await api.delete(`/api/chat/${activeConversation._id}`);
        setConversations(conversations.filter(c => c._id !== activeConversation._id));
        setActiveConversation(null);
        alert("Conversation supprimée.");
    } catch (error) {
        console.error("Delete error:", error);
        alert("Erreur lors de la suppression.");
    }
  };

  const handleLeaveGroup = async () => {
      if(!activeConversation || !activeConversation.isGroup) return;
      setShowMenu(false);
      
      if (!window.confirm("Voulez-vous vraiment quitter ce groupe ?")) return;

      try {
          await api.post('/api/chat/leave-group', { conversationId: activeConversation._id });
          setConversations(conversations.filter(c => c._id !== activeConversation._id));
          setActiveConversation(null);
          alert("Vous avez quitté le groupe.");
      } catch (error: any) {
          alert('Erreur: ' + (error.response?.data?.message || 'Impossible de quitter le groupe'));
      }
  };

  const handleKickMember = async (userIdToKick: string) => {
      if(!activeConversation || !activeConversation.isGroup) return;
      if(!window.confirm("Voulez-vous retirer ce membre du groupe ?")) return;

      try {
          const { data } = await api.post('/api/chat/remove-member', {
              conversationId: activeConversation._id,
              userIdToRemove: userIdToKick
          });
        
          const updatedParticipants = activeConversation.participants.filter(p => p._id !== userIdToKick);
          const updatedConversation = { ...activeConversation, participants: updatedParticipants };
          
          setActiveConversation(updatedConversation);
          setConversations(conversations.map(c => c._id === activeConversation._id ? updatedConversation : c));
          
      } catch (error: any) {
           alert('Erreur: ' + (error.response?.data?.message || 'Impossible de retirer le membre'));
      }
  }

  const getConversationName = (conv: Conversation) => {
      if (conv.isGroup) return conv.name || 'Groupe sans nom';
      if (!user) return 'Chargement...';

      const myId = user.id || (user as any)._id;
      const other = conv.participants.find(p => p._id !== myId);
      
      if (!other && conv.participants.length > 0) return conv.participants[0].name;

      return other ? other.name : 'Utilisateur inconnu';
  };

  const getConversationImage = (conv: Conversation) => {
    if (conv.isGroup) return null; 
    if (!user) return null;
    const myId = user.id || (user as any)._id;
    const other = conv.participants.find(p => p._id !== myId);
    return other?.profilePicture;
  };

  const getConversationRole = (conv: Conversation) => {
      if (conv.isGroup) return `${conv.participants.length} membres`;
        if (!user) return '';
      const myId = user.id || (user as any)._id;
      const other = conv.participants.find(p => p._id !== myId);
      return other?.role;
  }

  const isAdminUser = user?.role === 'admin';

  const myUserId = user ? (user.id || (user as any)._id) : null;
  const isGroupAdmin = activeConversation?.admin === myUserId;

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-[#f3f4f6] flex font-sans">
        <Navbar />
        
        <div className="flex-1 ml-64 flex flex-col h-screen">
          {/* Header */}
          <header className="bg-white h-20 border-b border-gray-200 flex items-center justify-between px-8 shrink-0">
            <h2 className="text-xl font-bold text-gray-800">Messagerie</h2>

            <div className="flex items-center gap-4">
              <NotificationBell />
              <div className="h-8 w-px bg-gray-200 mx-2"></div>
              <div className="text-right">
                <p className="text-sm font-bold text-gray-900">{user?.name || 'Utilisateur'}</p>
                <p className="text-xs text-gray-500">
                    {isAdminUser ? 'Administrateur' : user?.role || 'Étudiant'}
                </p>
              </div>
              <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center text-blue-700 font-bold border-2 border-white shadow-sm">
                {user?.name ? user.name[0] : 'U'}
              </div>
            </div>
          </header>

          {/* Main Content */}
          <main className="flex-1 p-6 overflow-hidden flex flex-col">
            <div className="flex-1 bg-white rounded-2xl overflow-hidden shadow-xl border border-slate-200 flex">
              
              {/* Sidebar - Conversations List */}
              <div className="w-80 border-r border-slate-200 bg-slate-50 flex flex-col">
                <div className="p-4 border-b border-slate-200 bg-white shadow-sm z-10 flex flex-col gap-3">
                  <div className="flex items-center justify-between">
                    <h2 className="text-lg font-bold text-slate-800">Discussions</h2>
                    <div className="flex gap-1">
                        <button 
                            onClick={() => { setShowNewChat(!showNewChat); setShowCreateGroup(false); }}
                            className="p-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors"
                            title="Nouveau message"
                        >
                            <MessageSquare size={18} />
                        </button>
                        <button 
                            onClick={() => { setShowCreateGroup(!showCreateGroup); setShowNewChat(false); }}
                            className="p-2 bg-indigo-50 text-indigo-600 rounded-lg hover:bg-indigo-100 transition-colors"
                            title="Créer un groupe"
                        >
                            <Users size={18} />
                        </button>
                    </div>
                  </div>
                  
                  {showNewChat && (
                    <div className="animate-in fade-in slide-in-from-top-2 border p-2 rounded-lg bg-slate-50">
                        <p className="text-xs text-slate-500 mb-2 font-medium">Nouvelle discussion privée</p>
                       <UserSearch 
                        onSelect={handleStartConversation} 
                        buttonText="Discuter"
                        placeholder="Chercher une personne..."
                        excludeIds={[user?.id || '']}
                      />
                    </div>
                  )}

                  {showCreateGroup && (
                      <div className="animate-in fade-in slide-in-from-top-2 border p-2 rounded-lg bg-slate-50">
                          <p className="text-xs text-slate-500 mb-2 font-medium">Nouveau Groupe</p>
                          <form onSubmit={handleCreateGroup} className="flex gap-2">
                              <input 
                                type="text" 
                                value={groupName}
                                onChange={e => setGroupName(e.target.value)}
                                placeholder="Nom du groupe"
                                className="flex-1 px-3 py-2 text-sm border rounded-md"
                              />
                              <button type="submit" className="p-2 bg-indigo-600 text-white rounded-md">
                                  <Plus size={16} />
                              </button>
                          </form>
                      </div>
                  )}
                </div>

                <div className="flex-1 overflow-y-auto">
                  {conversations.length === 0 ? (
                    <div className="p-8 text-center text-slate-500">
                      <p className="text-sm">Aucune conversation</p>
                    </div>
                  ) : (
                    conversations.map(conv => {
                      const isActive = activeConversation?._id === conv._id;
                      const displayName = getConversationName(conv);
                      const displayImage = getConversationImage(conv);
                      const isMeSender = conv.lastMessage?.sender._id === user?.id;

                      return (
                        <div
                          key={conv._id}
                          onClick={() => setActiveConversation(conv)}
                          className={`p-4 cursor-pointer transition-all hover:bg-white border-b border-slate-100 
                            ${isActive ? 'bg-white border-l-4 border-l-blue-500 shadow-sm' : ''}`}
                        >
                          <div className="flex items-center gap-3">
                            <div className="relative">
                               {displayImage ? (
                                 <img src={displayImage} alt={displayName} className="w-12 h-12 rounded-full object-cover shadow-sm" />
                               ) : (
                                <div className={`w-12 h-12 rounded-full flex items-center justify-center font-bold text-sm ${conv.isGroup ? 'bg-indigo-100 text-indigo-600' : 'bg-blue-100 text-blue-600'}`}>
                                  {conv.isGroup ? <Users size={20} /> : displayName[0]}
                                </div>
                              )}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex justify-between items-baseline mb-1">
                                <h4 className="font-semibold text-slate-800 text-sm truncate">{displayName}</h4>
                                {conv.lastMessage && (
                                  <span className="text-[10px] text-slate-400">
                                    {format(new Date(conv.updatedAt), 'HH:mm')}
                                  </span>
                                )}
                              </div>
                              <p className={`text-xs truncate ${isActive ? 'text-slate-600' : 'text-slate-400'}`}>
                                {conv.lastMessage ? (
                                  <span className="flex items-center gap-1">
                                    {isMeSender ? (
                                        <span className="font-medium text-slate-500">Vous:</span>
                                    ) : (
                                        <span className="font-medium text-slate-500">{conv.lastMessage.sender.name}:</span>
                                    )}
                                    <span className="truncate">{conv.lastMessage.content}</span>
                                  </span>
                                ) : (
                                  <span className="italic">Nouvelle discussion</span>
                                )}
                              </p>
                            </div>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>

              {/* Main Chat Area */}
              <div className="flex-1 flex flex-col bg-slate-50/50 relative">
                {activeConversation ? (
                  <>
                    {/* Chat Header */}
                    <div className="p-4 bg-white border-b border-slate-200 flex items-center justify-between shadow-sm z-20">
                      <div className="flex items-center gap-3 cursor-pointer" onClick={() => { if(activeConversation.isGroup) setShowMembersModal(true) }}>
                         <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold ${activeConversation.isGroup ? 'bg-indigo-100 text-indigo-600' : 'bg-blue-100 text-blue-600'}`}>
                            {activeConversation.isGroup ? <Users size={20} /> : getConversationName(activeConversation)[0]}
                          </div>
                        <div>
                          <h3 className="font-bold text-slate-800">{getConversationName(activeConversation)}</h3>
                          <p className="text-xs text-slate-500 capitalize">{getConversationRole(activeConversation)}</p>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2 text-slate-400 relative">
                          {/* Invite (Group Only) */}
                          {activeConversation.isGroup && isGroupAdmin && (
                              <button 
                                onClick={() => setShowInviteModal(!showInviteModal)}
                                className="p-2 hover:bg-slate-100 rounded-full transition-colors text-blue-600"
                                title="Inviter des membres"
                              >
                                  <UserPlus size={20} />
                              </button>
                          )}
                          
                        <div className="relative" ref={menuRef}>
                            <button 
                                onClick={() => setShowMenu(!showMenu)}
                                className="p-2 hover:bg-slate-100 rounded-full transition-colors"
                            >
                                <MoreVertical size={20} />
                            </button>

                            {/* Dropdown Menu */}
                            {showMenu && (
                                <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-xl border border-gray-100 py-1 z-50 animate-in fade-in zoom-in-95">
                                    {(activeConversation.isGroup ? isGroupAdmin : true) && (
                                        <button 
                                            onClick={handleDeleteConversation}
                                            className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center gap-2"
                                        >
                                            <Trash2 size={16} /> Supprimer
                                        </button>
                                    )}

                                    {activeConversation.isGroup && (
                                        <>
                                            <button 
                                                onClick={() => setShowMembersModal(true)}
                                                className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                                            >
                                                <Info size={16} /> Voir les membres
                                            </button>
                                            
                                            {!isGroupAdmin && (
                                                <button 
                                                    onClick={handleLeaveGroup}
                                                    className="w-full text-left px-4 py-2 text-sm text-orange-600 hover:bg-orange-50 flex items-center gap-2"
                                                >
                                                    <LogOut size={16} /> Quitter le groupe
                                                </button>
                                            )}
                                        </>
                                    )}
                                </div>
                            )}
                        </div>
                      </div>
                      
                      {/* Invite Modal */}
                      {showInviteModal && activeConversation.isGroup && (
                          <div className="absolute top-16 right-4 w-72 bg-white shadow-xl border rounded-lg p-4 z-50 animate-in fade-in zoom-in-95">
                              <h4 className="font-bold text-sm mb-2">Inviter un membre</h4>
                              <UserSearch 
                                onSelect={handleInviteToGroup} 
                                buttonText="Inviter"
                                placeholder="Rechercher..."
                                excludeIds={activeConversation.participants.map(p => p._id)}
                              />
                              <button 
                                onClick={() => setShowInviteModal(false)}
                                className="mt-2 text-xs text-red-500 hover:underline w-full text-center"
                              >
                                  Fermer
                              </button>
                          </div>
                      )}

                    </div>

                    {/* Messages Area */}
                    <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-[#f8fafc]">
                      {messages.map((msg, index) => {
                        const isMe = msg.sender._id === user?.id;
                        const isSameSenderAsPrevious = index > 0 && messages[index - 1].sender._id === msg.sender._id;

                        return (
                          <div key={msg._id} className={`flex ${isMe ? 'justify-end' : 'justify-start'} animate-in fade-in slide-in-from-bottom-2`}>
                            <div className={`flex flex-col max-w-[70%] ${isMe ? 'items-end' : 'items-start'}`}>
                              {!isSameSenderAsPrevious && !isMe && (
                                <span className="text-xs text-slate-400 ml-1 mb-1">{msg.sender.name}</span>
                              )}
                              
                              <div className={`
                                px-4 py-2 text-sm shadow-sm
                                ${isMe 
                                  ? 'bg-blue-600 text-white rounded-2xl rounded-tr-none' 
                                  : 'bg-white text-slate-700 rounded-2xl rounded-tl-none border border-slate-200'}
                              `}>
                                {msg.content}
                              </div>
                              
                              <span className={`text-[10px] mt-1 px-1 ${isMe ? 'text-slate-400' : 'text-slate-400'}`}>
                                {format(new Date(msg.createdAt), 'HH:mm')}
                              </span>
                            </div>
                          </div>
                        );
                      })}
                      <div ref={messagesEndRef} />
                    </div>

                    {/* Input Area */}
                    <div className="p-4 bg-white border-t border-slate-200 z-20">
                      <form onSubmit={handleSendMessage} className="flex items-center gap-2">
                        <input
                          type="text"
                          value={newMessage}
                          onChange={(e) => setNewMessage(e.target.value)}
                          placeholder="Écrivez votre message..."
                          className="flex-1 p-3 bg-slate-100 border-0 rounded-xl focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all outline-none"
                        />
                        <button 
                          type="submit"
                          disabled={!newMessage.trim()}
                          className="p-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-md shadow-blue-500/20"
                        >
                          <Send size={20} />
                        </button>
                      </form>
                    </div>
                  </>
                ) : (
                  <div className="flex-1 flex flex-col items-center justify-center text-slate-400 bg-slate-50">
                    <div className="w-24 h-24 bg-slate-100 rounded-full flex items-center justify-center mb-6">
                      <MessageSquare size={40} className="text-slate-300" />
                    </div>
                    <h3 className="text-xl font-semibold text-slate-600">Vos conversations</h3>
                    <p className="max-w-xs text-center mt-2 text-sm text-slate-400">
                      Sélectionnez une conversation pour commencer à discuter ou démarrez-en une nouvelle.
                    </p>
                  </div>
                )}
              </div>
            </div>
            
            {/* Modal Membres */}
            {showMembersModal && activeConversation && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 animate-in fade-in">
                    <div className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden flex flex-col max-h-[80vh]">
                        <div className="p-4 border-b flex justify-between items-center bg-slate-50">
                            <h3 className="font-bold text-lg">Membres du groupe</h3>
                            <button onClick={() => setShowMembersModal(false)} className="text-slate-400 hover:text-slate-600">
                                <span className="text-2xl">&times;</span>
                            </button>
                        </div>
                        
                        {/* Liste des membres */}
                        <div className="p-4 overflow-y-auto flex-1">
                            {activeConversation.participants.map(p => (
                                <div key={p._id} className="flex items-center gap-3 p-2 hover:bg-slate-50 rounded-lg group">
                                    {p.profilePicture ? (
                                        <img src={p.profilePicture} className="w-10 h-10 rounded-full object-cover" />
                                    ) : (
                                        <div className="w-10 h-10 rounded-full bg-slate-200 flex items-center justify-center font-bold text-slate-600">
                                            {p.name[0]}
                                        </div>
                                    )}
                                    <div className="flex-1">
                                        <p className="font-medium text-sm">{p.name}</p>
                                        <p className="text-xs text-slate-500">{p.role}</p>
                                    </div>
                                    
                                    {/* Badges/Actions */}
                                    {activeConversation.admin === p._id ? (
                                        <span className="text-[10px] bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded-full font-bold">Admin</span>
                                    ) : (
                                        isGroupAdmin && (
                                            <button 
                                                onClick={() => handleKickMember(p._id)}
                                                className="text-red-400 hover:text-red-600 opacity-0 group-hover:opacity-100 transition-opacity p-1"
                                                title="Retirer du groupe"
                                            >
                                                <X size={16} />
                                            </button>
                                        )
                                    )}
                                </div>
                            ))}
                        </div>

                        {/* Zone d'ajout (Admin seulement) */}
                        {isGroupAdmin && (
                            <div className="p-4 bg-slate-50 border-t">
                                <p className="text-xs font-bold text-slate-500 mb-2 uppercase">Ajouter un membre</p>
                                <UserSearch 
                                    onSelect={handleInviteToGroup} 
                                    buttonText="Inviter"
                                    placeholder="Chercher quelqu'un..."
                                    excludeIds={activeConversation.participants.map(p => p._id)}
                                />
                            </div>
                        )}
                    </div>
                </div>
            )}

          </main>
        </div>
      </div>
    </ProtectedRoute>
  );
}
