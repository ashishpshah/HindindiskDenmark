import React, { useState } from 'react';
import { Button } from '../components/ui/Button';
import { Card, CardContent } from '../components/ui/Card';
import { LayoutDashboard, Mail, Lock, User, Eye, EyeOff, AtSign, Phone } from 'lucide-react';
import { useNavigate, Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useSweetAlert } from '../context/SweetAlertContext';
import { useData } from '../context/DataContext';
import { showError, showSuccess } from '../lib/toast';
import { validateName, validateUsername, validateEmail, validateContact } from '../lib/validation';
import { useAvailability, type AvailabilityState } from '../hooks/useAvailability';

const PASSWORD_STRENGTH_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/;

function AuthAvailabilityHint({ state, label }: { state: AvailabilityState; label: string }) {
  if (state === 'idle') return null;
  const text =
    state === 'checking' ? `Checking ${label}…` :
    state === 'available' ? `✓ ${label} is available` :
    `✕ ${label} is already taken`;
  const color = state === 'available' ? 'text-emerald-500' : state === 'taken' ? 'text-red-500' : 'text-gray-400';
  return <p className={`text-[10px] normal-case tracking-normal ml-1 mt-1 ${color}`}>{text}</p>;
}

export default function Auth() {
  const [isLogin, setIsLogin] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [regUsername, setRegUsername] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const navigate = useNavigate();
  const { login, register, user } = useAuth();
  const { showAlert } = useSweetAlert();
  const { refreshData } = useData();

  // Live availability for the register form (only when registering and value is well-formed).
  const regUsernameAvail = useAvailability(regUsername, { field: 'userName', enabled: !isLogin && !validateUsername(regUsername) });
  const regEmailAvail = useAvailability(regEmail, { field: 'email', enabled: !isLogin && !validateEmail(regEmail) });

  if (user) {
    return <Navigate to="/" replace />;
  }

  const handleAuth = async (identifier: string, password: string) => {
    setLoginError(null);
    if (!identifier || !identifier.trim()) {
      setLoginError('Enter your username or email');
      return;
    }
    if (!password || password.length < 6) {
      setLoginError('Password must be at least 6 characters');
      return;
    }
    setIsSubmitting(true);
    try {
      await login(identifier.trim(), password);
      navigate('/');
    } catch (err) {
      setLoginError(err instanceof Error ? err.message : 'Invalid username/email or password');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRegister = async (
    firstName: string, lastName: string, username: string, email: string, contactNo: string, password: string
  ) => {
    const firstErr = validateName(firstName, 'First name');
    if (firstErr) { showAlert(firstErr, 'error'); return; }
    const lastErr = validateName(lastName, 'Last name');
    if (lastErr) { showAlert(lastErr, 'error'); return; }
    const userErr = validateUsername(username);
    if (userErr) { showAlert(userErr, 'error'); return; }
    if (regUsernameAvail === 'taken') { showAlert('This username is already taken.', 'error'); return; }
    const emailErr = validateEmail(email);
    if (emailErr) { showAlert(emailErr, 'error'); return; }
    if (regEmailAvail === 'taken') { showAlert('This email is already registered.', 'error'); return; }
    const contactErr = validateContact(contactNo);
    if (contactErr) { showAlert(contactErr, 'error'); return; }
    if (!password || password.length < 6) {
      showAlert('Password must be at least 6 characters', 'error');
      return;
    }
    if (!PASSWORD_STRENGTH_REGEX.test(password)) {
      showAlert('Password must contain at least one uppercase letter, one lowercase letter, and one number', 'error');
      return;
    }
    try {
      await register({ firstName, lastName, username, email, contactNo: contactNo || undefined, password });
      await refreshData();
      navigate('/');
      showSuccess('Registration successful!');
    } catch (err) {
      showError(err instanceof Error ? err.message : 'Registration failed. Please try again.');
    }
  };

  const handleToggleMode = () => {
    setIsLogin(prev => !prev);
    setShowPassword(false);
    setLoginError(null);
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex items-center justify-center p-6 transition-colors font-sans">
      <div className="w-full max-w-md text-center">
        <div className="mb-10">
          <div className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo-600 text-white shadow-lg shadow-indigo-500/20 mb-6">
            <LayoutDashboard size={28} />
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight text-gray-900 dark:text-white uppercase italic leading-none">PMS <span className="text-indigo-600">Enterprise</span></h1>
          <p className="text-gray-500 dark:text-gray-400 mt-4 font-medium text-sm">
            {isLogin ? 'Sign in to access your task dashboard' : 'Create an account to start managing projects'}
          </p>
        </div>

        <Card className="border-none shadow-2xl shadow-indigo-500/5 bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl ring-1 ring-gray-100 dark:ring-gray-800">
          <CardContent className="p-8 sm:p-10">
            <form
              className="space-y-6 text-left"
              onSubmit={async (e) => {
                e.preventDefault();
                const formData = new FormData(e.currentTarget);
                if (isLogin) {
                  const identifier = formData.get('identifier') as string;
                  const password = formData.get('password') as string;
                  await handleAuth(identifier, password);
                } else {
                  const firstName = formData.get('firstName') as string;
                  const lastName = formData.get('lastName') as string;
                  const username = formData.get('username') as string;
                  const email = formData.get('email') as string;
                  const contactNo = (formData.get('contactNo') as string) || '';
                  const password = formData.get('password') as string;
                  await handleRegister(firstName, lastName, username, email, contactNo, password);
                }
              }}
            >
              {!isLogin && (
                <>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5 font-bold uppercase tracking-widest text-gray-400">
                      <label htmlFor="auth-first" className="block text-[10px] ml-1">First Name</label>
                      <div className="relative">
                        <User className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" aria-hidden="true" />
                        <input
                          id="auth-first"
                          type="text"
                          placeholder="John"
                          name="firstName"
                          autoComplete="given-name"
                          className="w-full pl-10 pr-4 py-3 bg-gray-50 dark:bg-gray-950 border border-gray-100 dark:border-gray-800 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all text-sm font-medium"
                        />
                      </div>
                    </div>
                    <div className="space-y-1.5 font-bold uppercase tracking-widest text-gray-400">
                      <label htmlFor="auth-last" className="block text-[10px] ml-1">Last Name</label>
                      <input
                        id="auth-last"
                        type="text"
                        placeholder="Doe"
                        name="lastName"
                        autoComplete="family-name"
                        className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-950 border border-gray-100 dark:border-gray-800 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all text-sm font-medium"
                      />
                    </div>
                  </div>
                  <div className="space-y-1.5 font-bold uppercase tracking-widest text-gray-400">
                    <label htmlFor="auth-username" className="block text-[10px] ml-1">Username</label>
                    <div className="relative">
                      <AtSign className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" aria-hidden="true" />
                      <input
                        id="auth-username"
                        type="text"
                        placeholder="johndoe"
                        name="username"
                        value={regUsername}
                        onChange={e => setRegUsername(e.target.value)}
                        autoComplete="username"
                        className="w-full pl-10 pr-4 py-3 bg-gray-50 dark:bg-gray-950 border border-gray-100 dark:border-gray-800 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all text-sm font-medium"
                      />
                    </div>
                    <AuthAvailabilityHint state={regUsernameAvail} label="Username" />
                  </div>
                </>
              )}
              {isLogin ? (
                <div className="space-y-1.5 font-bold uppercase tracking-widest text-gray-400">
                  <label htmlFor="auth-identifier" className="block text-[10px] ml-1">Username or Email</label>
                  <div className="relative">
                    <User className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" aria-hidden="true" />
                    <input
                      id="auth-identifier"
                      type="text"
                      placeholder="Enter username or email"
                      name="identifier"
                      autoComplete="username"
                      tabIndex={1}
                      className="w-full pl-10 pr-4 py-3 bg-gray-50 dark:bg-gray-950 border border-gray-100 dark:border-gray-800 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all text-sm font-medium"
                    />
                  </div>
                </div>
              ) : (
                <div className="space-y-1.5 font-bold uppercase tracking-widest text-gray-400">
                  <label htmlFor="auth-email" className="block text-[10px] ml-1">Email Address</label>
                  <div className="relative">
                    <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" aria-hidden="true" />
                    <input
                      id="auth-email"
                      type="email"
                      placeholder="Enter your email"
                      name="email"
                      value={regEmail}
                      onChange={e => setRegEmail(e.target.value)}
                      autoComplete="email"
                      className="w-full pl-10 pr-4 py-3 bg-gray-50 dark:bg-gray-950 border border-gray-100 dark:border-gray-800 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all text-sm font-medium"
                    />
                  </div>
                  <AuthAvailabilityHint state={regEmailAvail} label="Email" />
                </div>
              )}
              {!isLogin && (
                <div className="space-y-1.5 font-bold uppercase tracking-widest text-gray-400">
                  <label htmlFor="auth-contact" className="block text-[10px] ml-1">Contact Number <span className="opacity-60">(optional)</span></label>
                  <div className="relative">
                    <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" aria-hidden="true" />
                    <input
                      id="auth-contact"
                      type="tel"
                      placeholder="+1 234 567 8900"
                      name="contactNo"
                      autoComplete="tel"
                      className="w-full pl-10 pr-4 py-3 bg-gray-50 dark:bg-gray-950 border border-gray-100 dark:border-gray-800 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all text-sm font-medium"
                    />
                  </div>
                </div>
              )}
              <div className="space-y-1.5 font-bold uppercase tracking-widest text-gray-400">
                <div className="flex justify-between items-center ml-1">
                  <label htmlFor="auth-password" className="block text-[10px]">Password</label>
                  {isLogin && (
                    <button type="button" tabIndex={4} className="text-[10px] text-indigo-600 hover:underline">
                      Forgot Password?
                    </button>
                  )}
                </div>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" aria-hidden="true" />
                  <input
                    id="auth-password"
                    type={showPassword ? 'text' : 'password'}
                    required
                    placeholder="Enter password"
                    name="password"
                    autoComplete={isLogin ? 'current-password' : 'new-password'}
                    tabIndex={2}
                    className="w-full pl-10 pr-12 py-3 bg-gray-50 dark:bg-gray-950 border border-gray-100 dark:border-gray-800 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all text-sm font-medium"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-indigo-500 transition-colors"
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              <Button
                type="submit"
                disabled={isSubmitting}
                tabIndex={3}
                className="w-full py-4 font-black uppercase tracking-widest text-sm mt-4 shadow-xl shadow-indigo-600/20 active:scale-[0.98] transition-transform flex items-center justify-center gap-2"
              >
                {isLogin ? 'Login' : 'Create Account'}
              </Button>

              {loginError && (
                <div className="flex items-center gap-2 px-3 py-2.5 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl text-sm text-red-600 dark:text-red-400 font-medium">
                  <span className="shrink-0">⚠</span>
                  {loginError}
                </div>
              )}
            </form>
          </CardContent>
        </Card>

        <div className="mt-10 pt-6 border-t border-gray-100 dark:border-gray-800">
          <button
            onClick={handleToggleMode}
            className="text-[11px] font-bold text-gray-500 dark:text-gray-400 hover:text-indigo-600 transition-colors uppercase tracking-widest"
          >
            {isLogin ? (
              <>New to PMS? <span className="text-indigo-600 underline underline-offset-4">Register your team</span></>
            ) : (
              <>Already registered? <span className="text-indigo-600 underline underline-offset-4">Access Dashboard</span></>
            )}
          </button>
        </div>

        <p className="mt-12 text-center text-[10px] font-bold uppercase tracking-[0.3em] text-gray-300 dark:text-gray-600">
          Advanced Project Architecture &copy; 2026
        </p>
      </div>
    </div>
  );
}
