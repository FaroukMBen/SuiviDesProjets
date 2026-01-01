'use client';

import Link from 'next/link';
import { useAuthStore } from '@/lib/store';
import { Navbar } from '@/components/Navbar';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function Home() {
  const router = useRouter();
  const { token } = useAuthStore();

  useEffect(() => {
    if (token) {
      router.push('/dashboard');
    }
  }, [token, router]);

  return (
    // On garde un dégradé subtil mais avec les couleurs du thème
    <div className="min-h-screen bg-gradient-to-br from-primary-50 to-white font-sans">
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
        <div className="text-center space-y-8">
          {/* Titre principal sombre (Gray-900) */}
          <h1 className="text-5xl sm:text-6xl font-bold text-gray-900 tracking-tight text-balance">
            Centralisez vos projets étudiants avec <span className="text-primary-600">Nexus</span>
          </h1>
          
          {/* Sous-titre en gris secondaire (Gray-500) */}
          <p className="text-xl text-gray-500 max-w-2xl mx-auto text-balance leading-relaxed">
            Une plateforme collaborative pour gérer les projets universitaires : Kanban, évaluations, suivi Git et feedbacks en temps réel.
          </p>

          <div className="flex gap-4 justify-center mt-8">
            {/* Bouton Primaire (Bleu Nexus) */}
            <Link
              href="/register"
              className="px-8 py-3 bg-primary-600 text-white rounded-xl font-semibold hover:bg-primary-700 transition shadow-lg shadow-primary-500/20"
            >
              Commencer
            </Link>
            {/* Bouton Secondaire (Blanc avec bordure) */}
            <Link
              href="/login"
              className="px-8 py-3 bg-white border border-gray-200 text-gray-700 rounded-xl font-semibold hover:bg-gray-50 transition shadow-sm"
            >
              Se connecter
            </Link>
          </div>

          {/* Les 3 cartes de fonctionnalités */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-20">
            {/* Carte 1 */}
            <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition">
              <div className="w-12 h-12 bg-primary-100 text-primary-600 rounded-lg flex items-center justify-center mb-4 mx-auto text-xl">
                📂
              </div>
              <h3 className="text-lg font-bold text-gray-900 mb-2">Gestion de Projet</h3>
              <p className="text-gray-500">Créez des équipes, définissez des jalons et centralisez tous vos livrables au même endroit.</p>
            </div>

            {/* Carte 2 */}
            <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition">
              <div className="w-12 h-12 bg-orange-100 text-orange-600 rounded-lg flex items-center justify-center mb-4 mx-auto text-xl">
                📊
              </div>
              <h3 className="text-lg font-bold text-gray-900 mb-2">Kanban Intuitif</h3>
              <p className="text-gray-500">Visualisez l'avancement grâce aux tableaux Kanban et assignez des tâches facilement.</p>
            </div>

            {/* Carte 3 */}
            <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition">
               <div className="w-12 h-12 bg-emerald-100 text-emerald-600 rounded-lg flex items-center justify-center mb-4 mx-auto text-xl">
                🎓
              </div>
              <h3 className="text-lg font-bold text-gray-900 mb-2">Évaluation Juste</h3>
              <p className="text-gray-500">Des grilles d'évaluation claires et un calcul automatisé des notes pour plus de transparence.</p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}