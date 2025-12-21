'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { Navbar } from '@/components/Navbar';
import api from '@/lib/auth';

import { UserSearch } from '@/components/UserSearch';

export default function NewProjectPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    repositoryUrl: '',
    deadline: '',
    tags: ''
  });
  const [selectedMembers, setSelectedMembers] = useState<any[]>([]); // To store invited members
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await api.post('/api/projects', {
        ...formData,
        tags: formData.tags.split(',').map(t => t.trim()).filter(t => t),
        members: selectedMembers.map(m => m._id)
      });
      router.push(`/projects/${response.data.project._id}`);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Erreur lors de la création du projet');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gray-50">
        <Navbar />

        <main className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          {/* En-tête de page */}
          <div className="mb-8">
            <h1 className="text-2xl font-bold text-gray-900">Nouveau Projet</h1>
            <p className="text-gray-500 mt-1">Créez un espace collaboratif pour votre équipe.</p>
          </div>

          {/* Carte du formulaire */}
          <div className="bg-white p-8 rounded-xl border border-gray-200 shadow-soft">
            {error && (
              <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm flex items-center gap-2">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" /></svg>
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
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
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-colors placeholder-gray-400 text-gray-900"
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
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-colors placeholder-gray-400 text-gray-900 resize-none"
                  placeholder="Décrivez les objectifs et le contexte du projet..."
                />
              </div>

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
                      className="w-full pl-10 px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-colors placeholder-gray-400 text-gray-900"
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
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-colors text-gray-900"
                  />
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
                          <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center text-blue-700 font-bold">
                            {member.name.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <p className="text-sm font-medium text-gray-900">{member.name}</p>
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
              <div className="pt-4 flex gap-4 justify-end border-t border-gray-100 mt-8">
                <button
                  type="button"
                  onClick={() => router.back()}
                  className="px-6 py-2.5 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition focus:outline-none focus:ring-2 focus:ring-gray-200"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-6 py-2.5 bg-primary-600 text-white rounded-lg font-medium hover:bg-primary-700 transition shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? 'Création...' : 'Créer le projet'}
                </button>
              </div>
            </form>
          </div>
        </main>
      </div>
    </ProtectedRoute>
  );
}