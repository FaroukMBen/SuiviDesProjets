'use client';

import { useState, useEffect } from 'react';
import { Navbar } from '@/components/Navbar';
import ProtectedRoute from '@/components/ProtectedRoute';
import api from '@/lib/auth';
import { useAuthStore } from '@/lib/store';
import {
  User,
  Mail,
  Lock,
  Shield,
  Calendar,
  Users,
  Save,
  CheckCircle,
  AlertCircle,
  Camera,
  PenTool,
  LayoutTemplate,
  GitCommit,
  Info
} from 'lucide-react';
import { NotificationBell } from '@/components/NotificationBell';
import { useToast } from '@/components/ui/Toast';
import { useConfirm } from '@/components/ui/ConfirmDialog';

export default function SettingsPage() {
  const { user, setUser } = useAuthStore();
  const { showToast } = useToast();
  const { confirm: confirmDialog } = useConfirm();
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    confirmPassword: '',
    academicYear: 'BUT1',
    group: 'G1',
    theme: 'modern'
  });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    if (user) {
      setFormData(prev => ({
        ...prev,
        firstName: user.firstName || '',
        lastName: user.lastName || user.name || '',
        email: user.email || '',
        academicYear: user.academicYear || 'BUT1',
        group: user.group || 'G1',
        theme: user.theme || 'modern'
      }));
    }
  }, [user]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);

    if (formData.password && formData.password !== formData.confirmPassword) {
      setMessage({ type: 'error', text: 'Les mots de passe ne correspondent pas.' });
      return;
    }

    setLoading(true);
    try {
      const payload: any = {
        firstName: formData.firstName,
        lastName: formData.lastName,
        email: formData.email,
        academicYear: formData.academicYear,
        group: formData.group,
        theme: formData.theme
      };
      if (formData.password) {
        payload.password = formData.password;
      }

      const res = await api.put('/api/auth/profile', payload);
      setUser(res.data.user);

      setMessage({ type: 'success', text: 'Profil mis à jour avec succès !' });
      setFormData(prev => ({ ...prev, password: '', confirmPassword: '' }));
    } catch (err: any) {
      setMessage({
        type: 'error',
        text: err.response?.data?.message || 'Une erreur est survenue lors de la mise à jour.'
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-[#f3f4f6] flex font-sans">
        <Navbar />

        <div className="flex-1 ml-64 flex flex-col min-h-screen">

          {/* Header */}
          <header className="bg-white h-20 border-b border-gray-200 flex items-center justify-between px-8 sticky top-0 z-40 shadow-sm">
            <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
              <User className="text-blue-600" />
              Paramètres du compte
            </h2>

            <div className="flex items-center gap-4">
              <NotificationBell />
              <div className="h-8 w-px bg-gray-200 mx-2"></div>
              <div className="text-right hidden sm:block">
                <p className="text-sm font-bold text-gray-900">
                  {user ? `${user.firstName} ${user.lastName || user.name}` : 'Utilisateur'}
                </p>
                <p className="text-xs text-gray-500">{user?.role === 'instructor' ? 'Enseignant' : 'Étudiant'}</p>
              </div>
              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center text-white font-bold border-2 border-white shadow-md">
                {user?.firstName ? user.firstName[0] : (user?.name ? user.name[0] : 'U')}
              </div>
            </div>
          </header>

          <main className="flex-1 p-8 max-w-5xl mx-auto w-full space-y-8">

            {/* Bannière de Profil */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden relative">
              <div className="h-32 bg-gradient-to-r from-blue-600 to-indigo-700"></div>
              <div className="px-8 pb-8 flex flex-col md:flex-row items-end -mt-12 gap-6">
                <div className="relative">
                  <div className="w-32 h-32 bg-white rounded-full p-1 shadow-lg">
                    <div className="w-full h-full bg-slate-100 rounded-full flex items-center justify-center text-4xl font-bold text-slate-400">
                      {user?.firstName ? user.firstName[0] : (user?.name ? user.name[0] : 'U')}
                    </div>
                  </div>
                  <button className="absolute bottom-2 right-2 p-2 bg-blue-600 text-white rounded-full shadow-md hover:bg-blue-700 transition cursor-not-allowed" title="Changer la photo (bientôt disponible)">
                    <Camera size={16} />
                  </button>
                </div>

                <div className="flex-1 mb-2 text-center md:text-left">
                  <h1 className="text-2xl font-bold text-gray-900">
                    {user ? `${user.firstName} ${user.lastName || user.name}` : ''}
                  </h1>
                  <p className="text-gray-500">{user?.email}</p>
                </div>

                <div className="flex gap-2 mb-2">
                  <span className="px-3 py-1 bg-blue-50 text-blue-700 rounded-full text-xs font-semibold uppercase tracking-wide border border-blue-100">
                    {user?.role === 'instructor' ? 'Enseignant' : 'Étudiant'}
                  </span>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

              {/* Colonne Gauche: Infos en lecture seule */}
              <div className="lg:col-span-1 space-y-6">
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                  <h3 className="font-bold text-gray-800 mb-4 border-b pb-2">Informations Académiques</h3>
                  <div className="space-y-4">

                    <div className="flex items-center gap-3 text-slate-600">
                      <Shield className="w-5 h-5 text-gray-400" />
                      <div>
                        <p className="text-xs text-gray-400 font-medium">Rôle</p>
                        <p className="text-sm font-semibold capitalize">{user?.role || 'Non défini'}</p>
                      </div>
                    </div>

                    {user?.role === 'student' && (
                      <>
                        <div className="flex items-center gap-3 text-slate-600">
                          <Calendar className="w-5 h-5 text-gray-400" />
                          <div>
                            <p className="text-xs text-gray-400 font-medium">Année</p>
                            <p className="text-sm font-semibold">{user?.academicYear || 'Non renseigné'}</p>
                          </div>
                        </div>

                        <div className="flex items-center gap-3 text-slate-600">
                          <Users className="w-5 h-5 text-gray-400" />
                          <div>
                            <p className="text-xs text-gray-400 font-medium">Groupe</p>
                            <p className="text-sm font-semibold">{user?.group || 'Non assigné'}</p>
                          </div>
                        </div>
                      </>
                    )}

                  </div>
                </div>

                <div className="bg-blue-50 p-6 rounded-2xl border border-blue-100 text-blue-800 text-sm">
                  <h4 className="font-bold mb-2 flex items-center gap-2">
                    <Shield size={16} />
                    Sécurité
                  </h4>
                  <p className="mb-2 opacity-80">
                    Votre compte est sécurisé. Si vous remarquez une activité suspecte, changez votre mot de passe immédiatement.
                  </p>
                </div>
              </div>

              {/* Colonne Droite: Formulaire d'édition */}
              <div className="lg:col-span-2">
                <form onSubmit={handleSubmit} className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 relative overflow-hidden">

                  <div className="flex items-center justify-between mb-6">
                    <h3 className="text-lg font-bold text-gray-800">Modifier le profil</h3>
                    {loading && <span className="text-xs text-blue-600 font-medium animate-pulse">Sauvegarde en cours...</span>}
                  </div>

                  {message && (
                    <div className={`mb-6 p-4 rounded-xl flex items-start gap-3 ${message.type === 'success' ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'
                      }`}>
                      {message.type === 'success' ? <CheckCircle size={20} /> : <AlertCircle size={20} />}
                      <p className="text-sm font-medium">{message.text}</p>
                    </div>
                  )}

                  <div className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

                      {/* Prénom */}
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-700">Prénom</label>
                        <div className="relative">
                          <User className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 h-5 w-5" />
                          <input
                            type="text"
                            name="firstName"
                            value={formData.firstName}
                            onChange={handleChange}
                            className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition"
                            placeholder="John"
                          />
                        </div>
                      </div>

                      {/* Nom */}
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-700">Nom</label>
                        <div className="relative">
                          <User className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 h-5 w-5" />
                          <input
                            type="text"
                            name="lastName"
                            value={formData.lastName}
                            onChange={handleChange}
                            className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition"
                            placeholder="Doe"
                          />
                        </div>
                      </div>

                      <div className="space-y-2 md:col-span-2">
                        <label className="text-sm font-medium text-gray-700">Adresse Email</label>
                        <div className="relative">
                          <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 h-5 w-5" />
                          <input
                            type="email"
                            name="email"
                            value={formData.email}
                            onChange={handleChange}
                            className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition"
                            placeholder="john@example.com"
                          />
                        </div>
                      </div>

                      {/* Champs Année et Groupe (Uniquement si étudiant) */}
                      {user?.role === 'student' && (
                        <>
                          <div className="space-y-2">
                            <label className="text-sm font-medium text-gray-700">Année</label>
                            <div className="relative">
                              <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 h-5 w-5" />
                              <select
                                name="academicYear"
                                value={formData.academicYear}
                                onChange={handleChange}
                                className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition"
                              >
                                <option value="BUT1">BUT1</option>
                                <option value="BUT2">BUT2</option>
                                <option value="BUT3">BUT3</option>
                                <option value="LP">Licence Pro</option>
                                <option value="Master">Master</option>
                              </select>
                            </div>
                          </div>

                          <div className="space-y-2">
                            <label className="text-sm font-medium text-gray-700">Groupe</label>
                            <div className="relative">
                              <Users className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 h-5 w-5" />
                              <select
                                name="group"
                                value={formData.group}
                                onChange={handleChange}
                                className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition"
                              >
                                {['G1', 'G2', 'G3', 'G4', 'G5', 'G6', 'TP-A', 'TP-B', 'TP-C', 'TP-D'].map(g => (
                                  <option key={g} value={g}>{g}</option>
                                ))}
                              </select>
                            </div>
                          </div>
                        </>
                      )}

                      {/* Thème */}
                      <div className="space-y-4 md:col-span-2 pt-4 border-t border-gray-100">
                        <label className="text-sm font-bold text-gray-800 flex items-center gap-2">
                          <PenTool className="text-blue-500" size={16} />
                          Apparence de l&apos;interface
                        </label>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <button
                            type="button"
                            onClick={() => setFormData({ ...formData, theme: 'classic' })}
                            className={`flex items-center gap-4 p-4 rounded-xl border-2 transition-all ${formData.theme === 'classic'
                              ? 'border-blue-600 bg-blue-50 shadow-sm'
                              : 'border-gray-100 hover:border-gray-200 bg-gray-50'
                              }`}
                          >
                            <div className={`p-2 rounded-lg ${formData.theme === 'classic' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-500'}`}>
                              <LayoutTemplate size={20} />
                            </div>
                            <div className="text-left">
                              <p className={`text-sm font-bold ${formData.theme === 'classic' ? 'text-blue-900' : 'text-gray-700'}`}>Style Basique</p>
                              <p className="text-xs text-gray-500">Interface classique et épurée</p>
                            </div>
                          </button>

                          <button
                            type="button"
                            onClick={() => setFormData({ ...formData, theme: 'modern' })}
                            className={`flex items-center gap-4 p-4 rounded-xl border-2 transition-all ${formData.theme === 'modern'
                              ? 'border-indigo-600 bg-indigo-50 shadow-sm'
                              : 'border-gray-100 hover:border-gray-200 bg-gray-50'
                              }`}
                          >
                            <div className={`p-2 rounded-lg ${formData.theme === 'modern' ? 'bg-indigo-600 text-white' : 'bg-gray-200 text-gray-500'}`}>
                              <PenTool size={20} />
                            </div>
                            <div className="text-left">
                              <p className={`text-sm font-bold ${formData.theme === 'modern' ? 'text-indigo-900' : 'text-gray-700'}`}>Style Moderne / Animé</p>
                              <p className="text-xs text-gray-500">Effets premium et animations</p>
                            </div>
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Intégration GitHub */}
                    <div className="pt-6 border-t border-gray-100">
                      <h4 className="text-sm font-bold text-gray-800 mb-4 flex items-center gap-2">
                        <GitCommit size={16} className="text-gray-400" />
                        Intégration GitHub
                      </h4>

                      {user?.githubUsername ? (
                        /* Connecté */
                        <div className="flex items-center justify-between p-4 bg-emerald-50 border border-emerald-100 rounded-xl">
                          <div className="flex items-center gap-3">
                            {user.profilePicture ? (
                              <img src={user.profilePicture} alt="" className="w-10 h-10 rounded-full" />
                            ) : (
                              <div className="w-10 h-10 rounded-full bg-emerald-500 flex items-center justify-center text-white font-bold">
                                {user.githubUsername[0]?.toUpperCase()}
                              </div>
                            )}
                            <div>
                              <p className="text-sm font-bold text-emerald-900">Compte GitHub connecté</p>
                              <p className="text-xs text-emerald-700">@{user.githubUsername}</p>
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={async () => {
                              const ok = await confirmDialog({
                                title: 'Déconnecter GitHub',
                                message: 'Voulez-vous déconnecter votre compte GitHub ?',
                                confirmText: 'Déconnecter',
                                cancelText: 'Annuler',
                                type: 'danger'
                              });
                              if (ok) {
                                try {
                                  await api.post('/api/github/disconnect');
                                  const res = await api.get('/api/auth/profile');
                                  setUser(res.data.user);
                                  showToast('Compte GitHub déconnecté.', 'success');
                                } catch (err) {
                                  showToast('Erreur lors de la déconnexion.', 'error');
                                }
                              }
                            }}
                            className="text-xs text-red-600 hover:text-red-800 font-medium px-3 py-1.5 rounded-lg hover:bg-red-50 transition"
                          >
                            Déconnecter
                          </button>
                        </div>
                      ) : (
                        /* Non connecté */
                        <div>
                          <div className="flex items-start gap-3 p-4 bg-blue-50 border border-blue-100 rounded-xl mb-4">
                            <Info size={18} className="text-blue-600 flex-shrink-0 mt-0.5" />
                            <div className="text-xs text-blue-800">
                              <p className="font-semibold mb-1">La connexion n&apos;est pas obligatoire !</p>
                              <p className="text-blue-700">
                                Les dépôts publics fonctionnent sans connexion. Connectez votre compte GitHub pour :
                              </p>
                              <ul className="list-disc list-inside mt-2 space-y-1 text-blue-700">
                                <li>Synchroniser des dépôts <strong>privés</strong></li>
                                <li>Effectuer des synchronisations <strong>illimitées</strong></li>
                              </ul>
                            </div>
                          </div>

                          <button
                            type="button"
                            onClick={async () => {
                              try {
                                const res = await api.get('/api/github/connect-url');
                                if (res.data.url) {
                                  window.location.href = res.data.url;
                                }
                              } catch (err: any) {
                                showToast(err.response?.data?.message || 'GitHub OAuth non configuré sur le serveur.', 'error');
                              }
                            }}
                            className="flex items-center gap-3 px-6 py-3 bg-gray-900 hover:bg-gray-800 text-white font-bold rounded-xl transition shadow-lg shadow-gray-900/10 w-full justify-center"
                          >
                            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" /></svg>
                            Connecter avec GitHub
                          </button>
                        </div>
                      )}
                    </div>

                    {/* Sécurité & Mot de passe */}
                    <div className="pt-6 border-t border-gray-100">
                      <h4 className="text-sm font-bold text-gray-800 mb-4 flex items-center gap-2">
                        <Lock size={16} className="text-gray-400" />
                        Sécurité &amp; Mot de passe
                      </h4>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                          <label className="text-sm font-medium text-gray-700">Nouveau mot de passe</label>
                          <input
                            type="password"
                            name="password"
                            value={formData.password}
                            onChange={handleChange}
                            className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition"
                            placeholder="Laisser vide pour ne pas changer"
                          />
                        </div>
                        <div className="space-y-2">
                          <label className="text-sm font-medium text-gray-700">Confirmer le mot de passe</label>
                          <input
                            type="password"
                            name="confirmPassword"
                            value={formData.confirmPassword}
                            onChange={handleChange}
                            className={`w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:bg-white transition
                              ${formData.password && formData.password !== formData.confirmPassword ? 'ring-2 ring-red-500 bg-red-50' : 'focus:ring-blue-500'}
                            `}
                            placeholder="Répétez le mot de passe"
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="mt-8 flex justify-end">
                    <button
                      type="submit"
                      disabled={loading}
                      className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-xl font-bold transition shadow-lg shadow-blue-900/20 disabled:opacity-70 disabled:cursor-not-allowed transform active:scale-95"
                    >
                      {loading ? (
                        <>
                          <div className="h-5 w-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                          Enregistrement...
                        </>
                      ) : (
                        <>
                          <Save size={20} />
                          Enregistrer les modifications
                        </>
                      )}
                    </button>
                  </div>

                </form>
              </div>

            </div>
          </main>
        </div>
      </div>
    </ProtectedRoute>
  );
}
