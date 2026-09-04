import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { User, Lock, BarChart2, ShieldCheck, CheckCircle2, AlertCircle, ArrowLeft, RefreshCw } from 'lucide-react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { usersApi } from '../services/api';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import SkeletonLoader from '../components/SkeletonLoader';

export default function ProfilePage() {
  const { user, updateUser, isAuthenticated } = useAuth();
  const { isDark } = useTheme();
  const navigate = useNavigate();

  // Profile fields
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [profileLoading, setProfileLoading] = useState(true);
  const [profileSaving, setProfileSaving] = useState(false);
  const [profileSuccess, setProfileSuccess] = useState('');
  const [profileError, setProfileError] = useState('');

  // Password fields
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordSaving, setPasswordSaving] = useState(false);
  const [passwordSuccess, setPasswordSuccess] = useState('');
  const [passwordError, setPasswordError] = useState('');

  // Analytics
  const [analytics, setAnalytics] = useState([]);
  const [totalVisits, setTotalVisits] = useState(0);
  const [analyticsLoading, setAnalyticsLoading] = useState(true);

  // Redirect if not logged in
  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
    }
  }, [isAuthenticated, navigate]);

  // Load profile data and analytics
  useEffect(() => {
    async function loadData() {
      setProfileLoading(true);
      setAnalyticsLoading(true);

      try {
        const [profRes, analyticsRes] = await Promise.all([
          usersApi.getProfile(),
          usersApi.getAnalytics(),
        ]);

        const u = profRes.data.user;
        setName(u.name || '');
        setPhone(u.phone || '');
        setEmail(u.email || '');

        setAnalytics(analyticsRes.data.analytics || []);
        setTotalVisits(analyticsRes.data.totalVisits || 0);
      } catch (err) {
        console.error('Failed to load profile data:', err);
      } finally {
        setProfileLoading(false);
        setAnalyticsLoading(false);
      }
    }

    if (isAuthenticated) {
      loadData();
    }
  }, [isAuthenticated]);

  // Handle Profile Update
  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    setProfileError('');
    setProfileSuccess('');
    setProfileSaving(true);

    try {
      const res = await usersApi.updateProfile({ name, phone, email });
      setProfileSuccess('Profile details updated successfully.');
      if (res.data.user) {
        updateUser(res.data.user);
      }
    } catch (err) {
      setProfileError(err.response?.data?.error || 'Failed to update profile.');
    } finally {
      setProfileSaving(false);
    }
  };

  // Handle Password Change
  const handleUpdatePassword = async (e) => {
    e.preventDefault();
    setPasswordError('');
    setPasswordSuccess('');

    if (newPassword !== confirmPassword) {
      setPasswordError('New password and confirmation do not match.');
      return;
    }

    if (newPassword.length < 6) {
      setPasswordError('New password must be at least 6 characters long.');
      return;
    }

    setPasswordSaving(true);

    try {
      await usersApi.updatePassword({ currentPassword, newPassword });
      setPasswordSuccess('Password changed successfully.');
      setCurrentPassword('');
      setNewPassword('');
      confirmPassword('');
    } catch (err) {
      setPasswordError(err.response?.data?.error || 'Failed to update password.');
    } finally {
      setPasswordSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-background text-gray-100 flex flex-col">
      <Navbar />
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full space-y-8 flex-1">
        
        {/* Header */}
        <div className="flex items-center space-x-3 pb-4 border-b border-surface-border">
          <Link to="/dashboard" className="text-gray-400 hover:text-white transition-colors">
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-white tracking-tight">Account & Analytics</h1>
            <p className="text-xs text-gray-400">Manage your profile, credentials, and view your stock interaction analytics</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* LEFT: Profile & Password Settings (7 cols) */}
          <div className="lg:col-span-7 space-y-6">
            
            {/* 1. Personal Information Form */}
            <div className="bg-surface border border-surface-border rounded-xl p-5 shadow space-y-4">
              <div className="flex items-center space-x-2 pb-3 border-b border-surface-border">
                <User className="w-4 h-4 text-white" />
                <h2 className="text-sm font-bold text-white">Personal Information</h2>
              </div>

              {profileSuccess && (
                <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-lg text-xs text-market-gain flex items-center space-x-2">
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                  <span>{profileSuccess}</span>
                </div>
              )}

              {profileError && (
                <div className="p-3 bg-severity-critical/10 border border-severity-critical/20 rounded-lg text-xs text-severity-critical flex items-center space-x-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{profileError}</span>
                </div>
              )}

              {profileLoading ? (
                <SkeletonLoader count={3} />
              ) : (
                <form onSubmit={handleUpdateProfile} className="space-y-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-400 mb-1">Full Name</label>
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Your Full Name"
                      className="w-full px-3 py-2 text-xs bg-surface-subtle border border-surface-border rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-gray-400"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-gray-400 mb-1">Phone Number</label>
                    <input
                      type="text"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="+1 (555) 000-0000"
                      className="w-full px-3 py-2 text-xs bg-surface-subtle border border-surface-border rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-gray-400"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-gray-400 mb-1">Email Address</label>
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="investor@example.com"
                      className="w-full px-3 py-2 text-xs bg-surface-subtle border border-surface-border rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-gray-400"
                    />
                  </div>

                  <div className="pt-2">
                    <button
                      type="submit"
                      disabled={profileSaving}
                      className="px-4 py-2 bg-white text-black font-semibold text-xs rounded-lg hover:bg-gray-200 transition-colors shadow-sm disabled:opacity-50"
                    >
                      {profileSaving ? 'Saving...' : 'Save Profile Details'}
                    </button>
                  </div>
                </form>
              )}
            </div>

            {/* 2. Security & Password Update */}
            <div className="bg-surface border border-surface-border rounded-xl p-5 shadow space-y-4">
              <div className="flex items-center space-x-2 pb-3 border-b border-surface-border">
                <Lock className="w-4 h-4 text-white" />
                <h2 className="text-sm font-bold text-white">Security & Password</h2>
              </div>

              {passwordSuccess && (
                <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-lg text-xs text-market-gain flex items-center space-x-2">
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                  <span>{passwordSuccess}</span>
                </div>
              )}

              {passwordError && (
                <div className="p-3 bg-severity-critical/10 border border-severity-critical/20 rounded-lg text-xs text-severity-critical flex items-center space-x-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{passwordError}</span>
                </div>
              )}

              <form onSubmit={handleUpdatePassword} className="space-y-3">
                <div>
                  <label className="block text-xs font-medium text-gray-400 mb-1">Current Password</label>
                  <input
                    type="password"
                    required
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    placeholder="Enter current password"
                    className="w-full px-3 py-2 text-xs bg-surface-subtle border border-surface-border rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-gray-400"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-400 mb-1">New Password</label>
                    <input
                      type="password"
                      required
                      minLength={6}
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="Min 6 characters"
                      className="w-full px-3 py-2 text-xs bg-surface-subtle border border-surface-border rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-gray-400"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-gray-400 mb-1">Confirm New Password</label>
                    <input
                      type="password"
                      required
                      minLength={6}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Repeat new password"
                      className="w-full px-3 py-2 text-xs bg-surface-subtle border border-surface-border rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-gray-400"
                    />
                  </div>
                </div>

                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={passwordSaving}
                    className="px-4 py-2 bg-surface-subtle hover:bg-surface-hover text-white border border-surface-border font-semibold text-xs rounded-lg transition-colors disabled:opacity-50"
                  >
                    {passwordSaving ? 'Updating...' : 'Update Password'}
                  </button>
                </div>
              </form>
            </div>

          </div>

          {/* RIGHT: User Analytics & Most Visited Stocks (5 cols) */}
          <div className="lg:col-span-5 space-y-6" id="analytics">
            <div className="bg-surface border border-surface-border rounded-xl p-5 shadow space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-surface-border">
                <div className="flex items-center space-x-2">
                  <BarChart2 className="w-4 h-4 text-white" />
                  <h2 className="text-sm font-bold text-white">Most Visited Stocks</h2>
                </div>
                <span className="text-[11px] font-mono text-gray-400">
                  Total: {totalVisits} visits
                </span>
              </div>

              <p className="text-xs text-gray-400">
                Server-side interaction telemetry aggregated across your research sessions
              </p>

              {analyticsLoading ? (
                <SkeletonLoader count={4} />
              ) : analytics.length === 0 ? (
                <div className="p-6 text-center text-xs text-gray-500 bg-surface-subtle border border-surface-border rounded-lg">
                  No stock views recorded yet. Visit stocks from your watchlists or the market rankings to build analytics.
                </div>
              ) : (
                <div className="space-y-4">
                  {/* Recharts Bar Chart */}
                  <div className="h-56 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={analytics} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke={isDark ? '#26282E' : '#E2E8F0'} vertical={false} />
                        <XAxis dataKey="symbol" stroke="#64748B" fontSize={11} fontMono />
                        <YAxis stroke="#64748B" fontSize={10} allowDecimals={false} />
                        <Tooltip 
                          contentStyle={{
                            backgroundColor: isDark ? '#111215' : '#FFFFFF',
                            borderColor: isDark ? '#26282E' : '#CBD5E1',
                            borderRadius: '8px',
                            fontSize: '11px',
                            color: isDark ? '#F1F5F9' : '#0F172A',
                          }}
                          formatter={(val) => [`${val} views`, 'Frequency']}
                        />
                        <Bar dataKey="visits" fill={isDark ? '#FFFFFF' : '#0F172A'} radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>

                  {/* List of Top Visited Symbols */}
                  <div className="divide-y divide-surface-border border-t border-surface-border pt-2 text-xs">
                    {analytics.slice(0, 5).map((item, idx) => (
                      <div key={item.symbol} className="py-2 flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <span className="text-gray-500 font-mono text-[11px]">#{idx + 1}</span>
                          <Link to={`/stocks/${item.symbol}`} className="font-mono font-bold text-white hover:text-gray-300">
                            {item.symbol}
                          </Link>
                        </div>
                        <span className="font-mono text-gray-300 bg-surface-subtle px-2 py-0.5 rounded border border-surface-border">
                          {item.visits} {item.visits === 1 ? 'view' : 'views'}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Privacy & Telemetry Info */}
            <div className="p-4 bg-surface-subtle border border-surface-border rounded-xl text-xs text-gray-400 space-y-1.5">
              <div className="flex items-center space-x-1.5 text-white font-medium">
                <ShieldCheck className="w-3.5 h-3.5 text-market-gain" />
                <span>Private & User Isolated</span>
              </div>
              <p className="text-[11px] leading-relaxed">
                Interaction events are scoped strictly to your authenticated session and used only to power your personalized research workflow.
              </p>
            </div>
          </div>

        </div>

      </div>
      <Footer />
    </div>
  );
}
