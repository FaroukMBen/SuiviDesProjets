'use client';

import Link from 'next/link';
import { useAuthStore } from '@/lib/store';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
  ArrowRight, 
  Layout, 
  Kanban, 
  GraduationCap, 
  CheckCircle2, 
  ShieldCheck 
} from 'lucide-react';

export default function Home() {
  const router = useRouter();
  const { token } = useAuthStore();

  useEffect(() => {
    if (token) {
      router.push('/dashboard');
    }
  }, [token, router]);

  return (
    <div className="min-h-screen bg-white font-sans overflow-hidden selection:bg-primary-100 selection:text-primary-700">
      
      {/* --- BACKGROUND PATTERN (Grille subtile) --- */}
      <div className="absolute inset-0 -z-10 h-full w-full bg-white bg-[linear-gradient(to_right,#8080800a_1px,transparent_1px),linear-gradient(to_bottom,#8080800a_1px,transparent_1px)] bg-[size:14px_24px]">
        <div className="absolute left-0 right-0 top-0 -z-10 m-auto h-[310px] w-[310px] rounded-full bg-primary-400 opacity-20 blur-[100px]"></div>
      </div>

      {/* --- NAVBAR SIMPLE (Landing only) --- */}
      <header className="absolute top-0 w-full z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
            <div className="flex items-center gap-2 font-bold text-2xl text-gray-900 tracking-tight">
                <div className="w-8 h-8 bg-primary-600 rounded-lg flex items-center justify-center text-white">
                    <Layout size={18} strokeWidth={3} />
                </div>
                Nexus
            </div>
            <div className="flex gap-4">
                <Link href="/login" className="text-sm font-medium text-gray-600 hover:text-gray-900 transition py-2">
                    Se connecter
                </Link>
                <Link href="/register" className="hidden sm:block px-4 py-2 bg-gray-900 text-white text-sm font-medium rounded-lg hover:bg-gray-800 transition">
                    Créer un compte
                </Link>
            </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-32 pb-16">
        
        {/* --- HERO SECTION --- */}
        <div className="text-center space-y-8 mb-20">
          <h1 className="text-5xl md:text-7xl font-bold text-gray-900 tracking-tight text-balance max-w-4xl mx-auto leading-[1.1]">
            Gérez vos projets étudiants <br/>
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary-600 to-purple-600">
              sans le chaos.
            </span>
          </h1>
          
          <p className="text-xl text-gray-500 max-w-2xl mx-auto text-balance leading-relaxed">
            Nexus centralise tout : vos équipes, vos dépôts Git, vos évaluations et vos deadlines. 
            La plateforme collaborative conçue pour les IUT et Universités.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mt-8">
            <Link
              href="/register"
              className="px-8 py-4 bg-primary-600 text-white rounded-xl font-semibold hover:bg-primary-700 transition shadow-xl shadow-primary-500/20 flex items-center gap-2 group"
            >
              Commencer gratuitement
              <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform"/>
            </Link>
          </div>

          {/* --- MOCKUP VISUEL (Abstrait) --- */}
          {/* Cela crée une fausse interface pour donner l'impression de l'app */}
          <div className="relative mt-20 mx-auto max-w-5xl">
            <div className="absolute -inset-1 bg-gradient-to-r from-primary-500 to-purple-500 rounded-2xl blur opacity-20"></div>
            <div className="relative bg-white border border-gray-200 rounded-2xl shadow-2xl overflow-hidden">
                {/* Fake Header du dashboard */}
                <div className="h-12 border-b border-gray-100 bg-gray-50 flex items-center px-4 gap-2">
                    <div className="flex gap-1.5">
                        <div className="w-3 h-3 rounded-full bg-red-400"></div>
                        <div className="w-3 h-3 rounded-full bg-yellow-400"></div>
                        <div className="w-3 h-3 rounded-full bg-green-400"></div>
                    </div>
                    <div className="ml-4 h-6 w-64 bg-white rounded-md border border-gray-200"></div>
                </div>
                {/* Fake Content (Grid) */}
                <div className="p-8 bg-gray-50/50 grid grid-cols-3 gap-6 h-[300px] md:h-[400px] items-start">
                    {/* Colonne 1 : Menu */}
                    <div className="hidden md:block col-span-1 space-y-4">
                        <div className="h-8 w-3/4 bg-gray-200 rounded animate-pulse"></div>
                        <div className="h-4 w-1/2 bg-gray-200 rounded"></div>
                        <div className="h-4 w-2/3 bg-gray-200 rounded"></div>
                        <div className="h-32 w-full bg-white rounded-xl border border-gray-200 shadow-sm mt-8"></div>
                    </div>
                    {/* Colonne 2 & 3 : Cartes */}
                    <div className="col-span-3 md:col-span-2 grid grid-cols-2 gap-4">
                        <div className="h-32 bg-white rounded-xl border border-gray-200 shadow-sm p-4 space-y-3">
                            <div className="h-8 w-8 bg-blue-100 rounded-lg"></div>
                            <div className="h-4 w-3/4 bg-gray-100 rounded"></div>
                        </div>
                        <div className="h-32 bg-white rounded-xl border border-gray-200 shadow-sm p-4 space-y-3">
                             <div className="h-8 w-8 bg-purple-100 rounded-lg"></div>
                             <div className="h-4 w-3/4 bg-gray-100 rounded"></div>
                        </div>
                        <div className="col-span-2 h-40 bg-white rounded-xl border border-gray-200 shadow-sm p-4">
                             <div className="h-4 w-1/4 bg-gray-100 rounded mb-4"></div>
                             <div className="space-y-2">
                                <div className="h-2 w-full bg-gray-50 rounded"></div>
                                <div className="h-2 w-full bg-gray-50 rounded"></div>
                                <div className="h-2 w-2/3 bg-gray-50 rounded"></div>
                             </div>
                        </div>
                    </div>
                </div>
            </div>
          </div>
        </div>

        {/* --- FEATURES GRID --- */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-32">
          <FeatureCard 
            icon={<Layout className="text-primary-600" size={24} />}
            title="Gestion Centralisée"
            desc="Créez des équipes, définissez des jalons et centralisez tous vos livrables au même endroit, fini les emails perdus."
            color="bg-primary-50"
          />
          <FeatureCard 
            icon={<Kanban className="text-orange-600" size={24} />}
            title="Suivi Kanban"
            desc="Visualisez l'avancement grâce aux tableaux Kanban intuitifs. Glissez, déposez et validez vos tâches en équipe."
            color="bg-orange-50"
          />
          <FeatureCard 
            icon={<GraduationCap className="text-emerald-600" size={24} />}
            title="Évaluation Claire"
            desc="Des grilles de notation transparentes configurées par les enseignants. Sachez exactement sur quoi vous êtes notés."
            color="bg-emerald-50"
          />
        </div>

        {/* --- FOOTER MINIMAL --- */}
        <div className="mt-32 border-t border-gray-100 pt-8 flex justify-between items-center text-sm text-gray-500">
            <p>© 2026 Nexus Project. Tous droits réservés.</p>
            <div className="flex gap-4">
                <a href="#" className="hover:text-gray-900">Confidentialité</a>
                <a href="#" className="hover:text-gray-900">Contact</a>
            </div>
        </div>
      </main>
    </div>
  );
}

// Petit composant helper pour les cartes
function FeatureCard({ icon, title, desc, color }: any) {
    return (
        <div className="group bg-white p-8 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md hover:border-primary-100 transition-all duration-300">
            <div className={`w-12 h-12 ${color} rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform`}>
              {icon}
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-3">{title}</h3>
            <p className="text-gray-500 leading-relaxed">{desc}</p>
        </div>
    );
}