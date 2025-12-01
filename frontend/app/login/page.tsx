'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { authService } from '@/lib/auth';
import { useAuthStore } from '@/lib/store';
import { Navbar } from '@/components/Navbar';

export default function LoginPage() {
  const router = useRouter();
  const { setToken, setUser } = useAuthStore();
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await authService.login(formData.email, formData.password);
      setToken(response.token);
      setUser(response.user);
      router.push('/dashboard');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[--color-background]">
      <Navbar />
      
      <div className="max-w-md mx-auto px-4 py-16">
        <div className="bg-white p-8 rounded-lg shadow-sm border border-[--color-border]">
          <h1 className="text-2xl font-bold text-[--color-foreground] mb-6 text-center">Login</h1>

          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded text-red-700 text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-[--color-foreground] mb-1">
                Email
              </label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                required
                className="w-full px-4 py-2 border border-[--color-border] rounded-lg focus:outline-none focus:ring-2 focus:ring-[--color-primary]"
                placeholder="your@email.com"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-[--color-foreground] mb-1">
                Password
              </label>
              <input
                type="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                required
                className="w-full px-4 py-2 border border-[--color-border] rounded-lg focus:outline-none focus:ring-2 focus:ring-[--color-primary]"
                placeholder="••••••••"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full px-4 py-2 bg-[--color-primary] text-white rounded-lg font-medium hover:bg-blue-600 transition disabled:opacity-50"
            >
              {loading ? 'Logging in...' : 'Login'}
            </button>
          </form>

          <p className="text-center text-[--color-muted] text-sm mt-4">
            Don't have an account?{' '}
            <Link href="/register" className="text-[--color-primary] hover:underline">
              Register here
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
