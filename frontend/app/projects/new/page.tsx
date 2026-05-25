'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import ProtectedRoute from '@/components/ProtectedRoute';
import { Navbar } from '@/components/Navbar';
import api from '@/lib/auth';
import { UserSearch } from '@/components/UserSearch';
import { LayoutTemplate, PenTool } from 'lucide-react';

interface Campaign {
  _id: string;
  title: string;
  endDate: string;
  tags?: string[];
}

export default function NewProjectPage() {
  const router = useRouter();

  // Tabs
  const [mode, setMode] = useState<'classic' | 'campaign'>('classic');
  const [availableCampaigns, setAvailableCampaigns] = useState<Campaign[]>([]);
  const [selectedCampaignId, setSelectedCampaignId] = useState('');

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    repositoryUrl: '',
    deadline: '',
    tags: '',
    banner: ''
  });
  const [selectedMembers, setSelectedMembers] = useState<any[]>([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchCampaigns = async () => {
      try {
        const res = await api.get('/api/campaigns?scope=student');
        setAvailableCampaigns(res.data.campaigns);

        const urlParams = new URLSearchParams(window.location.search);
        const campId = urlParams.get('campaignId');
        if (campId) {
          setMode('campaign');
          setSelectedCampaignId(campId);
          handleCampaignSelect(campId, res.data.campaigns);
        }
      } catch (err) {
        console.error(err);
      }
    };
    fetchCampaigns();
  }, []);

  const handleCampaignSelect = (campId: string, campaignsList = availableCampaigns) => {
    setSelectedCampaignId(campId);
    const camp = campaignsList.find(c => c._id === campId);
    if (camp) {
      setFormData(prev => ({
        ...prev,
        deadline: camp.endDate ? camp.endDate.split('T')[0] : '',
        tags: camp.tags ? camp.tags.join(', ') : ''
      }));
    }
  };

  const getMemberName = (member: any) => {
    if (member.firstName || member.lastName) {
      return `${member.firstName || ''} ${member.lastName || ''}`.trim();
    }
    return member.name || 'U';
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const payload: any = {
        ...formData,
        tags: formData.tags.split(',').map(t => t.trim()).filter(t => t),
        members: selectedMembers.map(m => m._id)
      };

      if (mode === 'campaign' && selectedCampaignId) {
        payload.campaignId = selectedCampaignId;
      }

      const response = await api.post('/api/projects', payload);
      router.push(`/projects/${response.data.project._id}`);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Erreur lors de la création du projet');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-[#f8fafc] flex">
        <Navbar />

        <div className="flex-1 ml-64 relative overflow-hidden">
          {/* Decorative Background Elements */}
          <div className="absolute top-0 right-0 -mr-20 -mt-20 w-96 h-96 bg-blue-500/5 rounded-full blur-3xl"></div>
          <div className="absolute bottom-0 left-0 -ml-20 -mb-20 w-96 h-96 bg-purple-500/5 rounded-full blur-3xl"></div>

          <main className="relative max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12">
            <div className="mb-8 text-center">
              <span className="inline-block px-4 py-1.5 mb-2 text-[10px] font-black tracking-widest text-blue-600 uppercase bg-blue-50 rounded-full">
                Espace Création
              </span>
              <h1 className="text-3xl md:text-4xl font-extrabold text-gray-900 tracking-tight">
                Lancer un <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600">Nouveau Projet</span>
              </h1>
              <p className="text-gray-500 mt-2 text-base md:text-lg">Donnez vie à vos idées et commencez à collaborer.</p>
            </div>

            {/* MODE SELECTION TABS */}
            <div className="grid grid-cols-2 gap-4 mb-6">
              <button
                onClick={() => setMode('classic')}
                className={`group relative flex items-center justify-center gap-4 p-4 rounded-2xl border-2 transition-all duration-300 font-bold overflow-hidden
                      ${mode === 'classic'
                    ? 'border-blue-600 bg-white text-blue-700 shadow-xl shadow-blue-500/10'
                    : 'border-white bg-white/60 backdrop-blur-sm text-gray-400 hover:border-gray-200 hover:scale-[1.01]'
                  }`}
              >
                <div className={`p-2 rounded-xl transition-colors ${mode === 'classic' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-400 group-hover:bg-gray-200'}`}>
                  <PenTool size={20} />
                </div>
                <span className="text-sm">Projet Libre</span>
                {mode === 'classic' && <div className="absolute bottom-0 left-0 w-full h-1 bg-blue-600"></div>}
              </button>
              <button
                onClick={() => setMode('campaign')}
                className={`group relative flex items-center justify-center gap-4 p-4 rounded-2xl border-2 transition-all duration-300 font-bold overflow-hidden
                      ${mode === 'campaign'
                    ? 'border-purple-600 bg-white text-purple-700 shadow-xl shadow-purple-500/10'
                    : 'border-white bg-white/60 backdrop-blur-sm text-gray-400 hover:border-gray-200 hover:scale-[1.01]'
                  }`}
              >
                <div className={`p-2 rounded-xl transition-colors ${mode === 'campaign' ? 'bg-purple-600 text-white' : 'bg-gray-100 text-gray-400 group-hover:bg-gray-200'}`}>
                  <LayoutTemplate size={20} />
                </div>
                <span className="text-sm">Via Campagne</span>
                {mode === 'campaign' && <div className="absolute bottom-0 left-0 w-full h-1 bg-purple-600"></div>}
              </button>
            </div>

            <div className="bg-white/80 backdrop-blur-md p-8 md:p-10 rounded-3xl border border-white shadow-2xl shadow-gray-200/50 relative overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500"></div>
              {error && (
                <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm flex items-center gap-2">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" /></svg>
                  {error}
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-6">

                {/* CAMPAIGN SELECTION DROPDOWN */}
                {mode === 'campaign' && (
                  <div className="mb-6 p-4 bg-purple-50 rounded-xl border border-purple-100">
                    <label className="block text-sm font-bold text-purple-900 mb-2">
                      Sélectionnez la campagne pédagogique
                    </label>
                    <select
                      value={selectedCampaignId}
                      onChange={(e) => handleCampaignSelect(e.target.value)}
                      required={mode === 'campaign'}
                      className="w-full px-4 py-3 border border-purple-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 bg-white"
                    >
                      <option value="">-- Choisir une campagne --</option>
                      {availableCampaigns.map(c => (
                        <option key={c._id} value={c._id}>
                          {c.title} (Fin : {new Date(c.endDate).toLocaleDateString()})
                        </option>
                      ))}
                    </select>
                    <p className="text-xs text-purple-600 mt-2">
                      La date limite et les tags seront automatiquement remplis selon la campagne choisie.
                    </p>
                  </div>
                )}

                {/* Titre */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Titre du projet <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="title"
                    value={formData.title}
                    onChange={handleChange}
                    required
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all placeholder-gray-400 text-gray-900 bg-gray-50/50"
                    placeholder="Ex: Application Mobile Santé"
                  />
                </div>

                {/* Description */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Description
                  </label>
                  <textarea
                    name="description"
                    value={formData.description}
                    onChange={handleChange}
                    rows={4}
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all placeholder-gray-400 text-gray-900 bg-gray-50/50 resize-none"
                    placeholder="Décrivez les objectifs et le contexte du projet..."
                  />
                </div>

                {/* Banner pour projets libres */}
                {mode === 'classic' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      URL de la bannière (Optionnel)
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <span className="text-gray-400 text-sm">🖼️</span>
                      </div>
                      <input
                        type="url"
                        name="banner"
                        value={formData.banner}
                        onChange={handleChange}
                        className="w-full pl-10 px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all placeholder-gray-400 text-gray-900 bg-gray-50/50"
                        placeholder="https://images.unsplash.com/photo-..."
                      />
                    </div>
                  </div>
                )}

                {/* Grid pour URL et Deadline */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      URL du dépôt (Git)
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <span className="text-gray-400 text-sm">🔗</span>
                      </div>
                      <input
                        type="url"
                        name="repositoryUrl"
                        value={formData.repositoryUrl}
                        onChange={handleChange}
                        className="w-full pl-10 px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all placeholder-gray-400 text-gray-900 bg-gray-50/50"
                        placeholder="https://github.com/..."
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Date limite
                    </label>
                    <input
                      type="date"
                      name="deadline"
                      value={formData.deadline}
                      onChange={handleChange}
                      readOnly={mode === 'campaign'}
                      className={`w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all text-gray-900 bg-gray-50/50
                        ${mode === 'campaign' ? 'bg-gray-100 cursor-not-allowed opacity-60' : ''}
                      `}
                    />
                    {mode === 'campaign' && <p className="text-xs text-gray-500 mt-1">Imposée par la campagne</p>}
                  </div>
                </div>

                {/* Tags */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Tags <span className="text-gray-400 font-normal text-xs">(séparés par des virgules)</span>
                  </label>
                  <input
                    type="text"
                    name="tags"
                    value={formData.tags}
                    onChange={handleChange}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-colors placeholder-gray-400 text-gray-900"
                    placeholder="web, react, stage, pfe"
                  />
                </div>

                {/* Membres du projet */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Inviter des étudiants
                  </label>
                  <div className="mb-4">
                    <UserSearch
                      onSelect={(user) => setSelectedMembers([...selectedMembers, user])}
                      excludeIds={selectedMembers.map(m => m._id)}
                    />
                  </div>

                  {selectedMembers.length > 0 && (
                    <div className="space-y-2">
                      {selectedMembers.map((member) => (
                        <div key={member._id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center text-blue-700 font-bold uppercase">
                              {getMemberName(member).charAt(0)}
                            </div>
                            <div>
                              <p className="text-sm font-medium text-gray-900">{getMemberName(member)}</p>
                              <p className="text-xs text-gray-500">{member.email}</p>
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={() => setSelectedMembers(selectedMembers.filter(m => m._id !== member._id))}
                            className="text-red-500 hover:text-red-700 p-1"
                            title="Retirer"
                          >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Actions */}
                <div className="pt-8 flex gap-4 justify-end border-t border-gray-100 mt-10">
                  <button
                    type="button"
                    onClick={() => router.back()}
                    className="px-8 py-3 border border-gray-200 text-gray-600 rounded-xl font-bold hover:bg-gray-50 hover:text-gray-900 transition-all focus:outline-none focus:ring-2 focus:ring-gray-100"
                  >
                    Annuler
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="px-8 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl font-bold hover:from-blue-700 hover:to-indigo-700 transition-all shadow-lg shadow-blue-500/25 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transform hover:-translate-y-0.5 active:translate-y-0"
                  >
                    {loading ? 'Création en cours...' : 'Lancer le projet'}
                  </button>
                </div>
              </form>
            </div>
          </main>
        </div>
      </div>
    </ProtectedRoute>
  );
}