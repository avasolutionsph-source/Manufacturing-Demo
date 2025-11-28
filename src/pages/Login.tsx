import { useState } from 'react';
import { useNavigate, Navigate } from 'react-router-dom';
import { Factory, Eye, EyeOff } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { useAuthStore, useIsAuthenticated } from '@/stores/authStore';
import { authApi } from '@/services/api';

export function LoginPage() {
  const navigate = useNavigate();
  const isAuthenticated = useIsAuthenticated();
  const login = useAuthStore((state) => state.login);

  const [email, setEmail] = useState('sarah.johnson@manufacturing.demo');
  const [password, setPassword] = useState('demo123');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const response = await authApi.login(email, password);
      login(response.user, response.token);
      navigate('/dashboard');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-50 to-secondary-100 p-4">
      <div className="w-full max-w-md">
        {/* Logo and title */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-primary-600 rounded-2xl mb-4">
            <Factory className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-secondary-900">Manufacturing Demo</h1>
          <p className="text-secondary-500 mt-1">Sign in to your account</p>
        </div>

        {/* Login form */}
        <div className="bg-white rounded-2xl shadow-xl p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="p-3 text-sm text-danger-700 bg-danger-50 border border-danger-200 rounded-lg\" role="alert">
                {error}
              </div>
            )}

            <Input
              label="Email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter your email"
              autoComplete="email"
              required
            />

            <div className="relative">
              <Input
                label="Password"
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
                autoComplete="current-password"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-8 text-secondary-400 hover:text-secondary-600"
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>

            <Button type="submit" className="w-full" isLoading={isLoading}>
              Sign in
            </Button>
          </form>

          {/* Demo credentials */}
          <div className="mt-6 pt-6 border-t border-secondary-200">
            <p className="text-xs text-secondary-500 text-center mb-3">Demo Accounts</p>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <button
                type="button"
                onClick={() => {
                  setEmail('sarah.johnson@manufacturing.demo');
                  setPassword('demo123');
                }}
                className="p-2 text-left rounded-lg bg-secondary-50 hover:bg-secondary-100 transition-colors"
              >
                <span className="font-medium text-secondary-700">Planner</span>
                <br />
                <span className="text-secondary-500">sarah.johnson@...</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setEmail('mike.rodriguez@manufacturing.demo');
                  setPassword('demo123');
                }}
                className="p-2 text-left rounded-lg bg-secondary-50 hover:bg-secondary-100 transition-colors"
              >
                <span className="font-medium text-secondary-700">Shop Foreman</span>
                <br />
                <span className="text-secondary-500">mike.rodriguez@...</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setEmail('emily.chen@manufacturing.demo');
                  setPassword('demo123');
                }}
                className="p-2 text-left rounded-lg bg-secondary-50 hover:bg-secondary-100 transition-colors"
              >
                <span className="font-medium text-secondary-700">QC Inspector</span>
                <br />
                <span className="text-secondary-500">emily.chen@...</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setEmail('admin@manufacturing.demo');
                  setPassword('admin123');
                }}
                className="p-2 text-left rounded-lg bg-secondary-50 hover:bg-secondary-100 transition-colors"
              >
                <span className="font-medium text-secondary-700">Admin</span>
                <br />
                <span className="text-secondary-500">admin@...</span>
              </button>
            </div>
          </div>
        </div>

        <p className="text-center text-sm text-secondary-500 mt-6">
          This is a demo application. No real data is stored.
        </p>
      </div>
    </div>
  );
}
