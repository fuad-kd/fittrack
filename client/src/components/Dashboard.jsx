import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';
import gsap from 'gsap';
import {
  LayoutDashboard,
  Dumbbell,
  Calendar,
  TrendingUp,
  Users,
  MapPin,
  LogOut,
  CheckCircle2,
  ChevronRight,
  Flame,
  Activity,
  Plus,
  Shield,
  Sparkles,
  BarChart3
} from 'lucide-react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid
} from 'recharts';

import Workouts from './Workouts';
import WorkoutLog from './WorkoutLog';
import ProgressTracker from './ProgressTracker';
import SocialFeed from './SocialFeed';
import GymMap from './GymMap';
import './Dashboard.css';

const NAV_ITEMS = [
  { key: 'home',      label: 'Overview',     icon: LayoutDashboard },
  { key: 'workouts',  label: 'Protocols',    icon: Dumbbell },
  { key: 'log',       label: 'Session Log',  icon: Calendar },
  { key: 'progress',  label: 'Metrics',      icon: TrendingUp },
  { key: 'social',    label: 'Community',    icon: Users },
  { key: 'map',       label: 'Gym Locator',  icon: MapPin },
];

const Dashboard = () => {
  const { user, profile, signOut } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('home');
  const [stats, setStats] = useState({
    plansCount: 0,
    logsCount: 0,
    latestWeight: null,
    postsCount: 0,
    loading: true,
  });
  const [volumeChartData, setVolumeChartData] = useState([]);
  const [totalVolumeLogged, setTotalVolumeLogged] = useState(0);
  const [selectedExerciseForProgression, setSelectedExerciseForProgression] = useState(null);

  const bannerRef = useRef(null);
  const kpiRef = useRef(null);
  const gridRef = useRef(null);

  // Fetch live KPI metrics for dashboard
  useEffect(() => {
    if (!user) return;
    const fetchKPIs = async () => {
      try {
        const [plansRes, logsRes, progressRes, postsRes, exerciseLogsRes] = await Promise.all([
          supabase.from('workout_plans').select('id', { count: 'exact', head: true }).eq('user_id', user.id),
          supabase.from('workout_logs').select('id', { count: 'exact', head: true }).eq('user_id', user.id),
          supabase.from('progress_entries').select('weight_kg').eq('user_id', user.id).order('entry_date', { ascending: false }).limit(1),
          supabase.from('posts').select('id', { count: 'exact', head: true }),
          supabase.from('exercise_logs').select('log_date, volume_kg, weight_kg, sets, reps').eq('user_id', user.id).order('log_date', { ascending: true }),
        ]);

        const eLogs = exerciseLogsRes.data || [];
        const dateMap = {};
        let totalVol = 0;
        eLogs.forEach(l => {
          const v = Number(l.volume_kg) || ((Number(l.weight_kg) || 0) * (Number(l.sets) || 1) * (Number(l.reps) || 1));
          dateMap[l.log_date] = (dateMap[l.log_date] || 0) + v;
          totalVol += v;
        });

        const vData = Object.entries(dateMap).map(([date, volume]) => ({
          date,
          volume: Math.round(volume),
        })).slice(-10);

        setVolumeChartData(vData);
        setTotalVolumeLogged(totalVol);

        setStats({
          plansCount: plansRes.count || 0,
          logsCount: logsRes.count || 0,
          latestWeight: progressRes.data?.[0]?.weight_kg || null,
          postsCount: postsRes.count || 0,
          loading: false,
        });
      } catch (err) {
        console.error('Failed to fetch KPI stats:', err);
        setStats(prev => ({ ...prev, loading: false }));
      }
    };

    fetchKPIs();
  }, [user]);

  // GSAP Entrance Animations
  useEffect(() => {
    if (activeTab === 'home') {
      const ctx = gsap.context(() => {
        gsap.from('.dash-hero-card', { opacity: 0, y: -15, duration: 0.5, ease: 'power2.out' });
        gsap.from('.kpi-stat-card', { opacity: 0, y: 20, duration: 0.4, stagger: 0.08, ease: 'power2.out', delay: 0.1 });
        gsap.from('.feature-tile', { opacity: 0, scale: 0.96, duration: 0.4, stagger: 0.08, ease: 'power2.out', delay: 0.2 });
      });
      return () => ctx.revert();
    }
  }, [activeTab]);

  const handleLogout = async () => {
    await signOut();
    navigate('/login');
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
  };

  const userInitial = (profile?.username || user?.email || 'A')[0].toUpperCase();

  return (
    <div className="dashboard-page">
      {/* ── Top Luxury Navigation Bar ── */}
      <header className="dashboard-nav">
        <div className="nav-container">
          <div className="brand-group" onClick={() => setActiveTab('home')}>
            <div className="brand-badge-icon">
              <Dumbbell className="brand-svg" size={20} />
            </div>
            <div className="brand-text">
              <span className="brand-title">FITTRACK</span>
              <span className="brand-sub">ELITE</span>
            </div>
          </div>

          <nav className="nav-tabs" aria-label="Main Navigation">
            {NAV_ITEMS.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.key;
              return (
                <button
                  key={item.key}
                  className={`nav-tab ${isActive ? 'active' : ''}`}
                  onClick={() => setActiveTab(item.key)}
                >
                  <Icon size={16} className="nav-tab-icon" />
                  <span>{item.label}</span>
                  {isActive && <span className="tab-glow" />}
                </button>
              );
            })}
          </nav>

          <div className="nav-right">
            <div className="user-profile-badge">
              <div className="avatar-ring">
                <span className="avatar-initial">{userInitial}</span>
              </div>
              <div className="user-text-info">
                <span className="user-handle">@{profile?.username || 'athlete'}</span>
                <span className="user-tier">Premium Member</span>
              </div>
            </div>

            <button className="btn-logout" onClick={handleLogout} title="Sign Out">
              <LogOut size={16} />
              <span className="btn-logout-text">Exit</span>
            </button>
          </div>
        </div>
      </header>

      {/* ── Main View Area ── */}
      <main className="dashboard-main">
        {activeTab === 'home' && (
          <div className="home-dashboard-view">
            {/* ── Hero Welcome Banner ── */}
            <div className="dash-hero-card" ref={bannerRef}>
              <div className="hero-text-content">
                <div className="hero-eyebrow">
                  <Sparkles size={14} className="gold-sparkle" />
                  <span>DAILY PERFORMANCE HUB</span>
                  <span className="date-pill">
                    {new Date().toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                  </span>
                </div>
                <h1 className="hero-heading">
                  {getGreeting()}, <span className="gold-name">{profile?.username || 'Athlete'}</span>
                </h1>
                <p className="hero-subtext">
                  Your training discipline shapes your future. Track every rep, benchmark your progress, and stay relentless.
                </p>
              </div>

              <div className="hero-actions">
                <button className="hero-btn-primary" onClick={() => setActiveTab('workouts')}>
                  <Dumbbell size={16} />
                  <span>View Protocols</span>
                </button>
                <button className="hero-btn-secondary" onClick={() => setActiveTab('log')}>
                  <Plus size={16} />
                  <span>Log Session</span>
                </button>
              </div>
            </div>

            {/* ── Live Performance Metrics (KPIs) ── */}
            <div className="kpi-grid" ref={kpiRef}>
              <div className="kpi-stat-card">
                <div className="kpi-header">
                  <span className="kpi-label">Active Protocols</span>
                  <Dumbbell size={18} className="kpi-icon gold" />
                </div>
                <div className="kpi-value">{stats.plansCount}</div>
                <span className="kpi-sub">Custom workout plans</span>
              </div>

              <div className="kpi-stat-card">
                <div className="kpi-header">
                  <span className="kpi-label">Logged Sessions</span>
                  <Activity size={18} className="kpi-icon green" />
                </div>
                <div className="kpi-value">{stats.logsCount}</div>
                <span className="kpi-sub">Total training logs</span>
              </div>

              <div className="kpi-stat-card">
                <div className="kpi-header">
                  <span className="kpi-label">Latest Weight</span>
                  <TrendingUp size={18} className="kpi-icon blue" />
                </div>
                <div className="kpi-value">
                  {stats.latestWeight ? `${stats.latestWeight} kg` : '—'}
                </div>
                <span className="kpi-sub">Current benchmark</span>
              </div>

              <div className="kpi-stat-card">
                <div className="kpi-header">
                  <span className="kpi-label">Community Pulse</span>
                  <Flame size={18} className="kpi-icon amber" />
                </div>
                <div className="kpi-value">{stats.postsCount}</div>
                <span className="kpi-sub">Member shared posts</span>
              </div>
            </div>

            {/* ── Recharts Training Volume Trajectory Preview ── */}
            {volumeChartData.length > 0 && (
              <div className="dash-volume-preview-card">
                <div className="dash-volume-preview-header">
                  <div className="vol-title-group">
                    <div className="vol-icon-badge">
                      <BarChart3 size={18} className="text-gold" />
                    </div>
                    <div>
                      <h3>Overall Training Volume Trajectory</h3>
                      <p>Cumulative workload moved across recent workout sessions (Recharts visualization)</p>
                    </div>
                  </div>

                  <div className="vol-header-right">
                    <div className="total-tonnage-chip">
                      <span>Total Workload:</span>
                      <strong>{totalVolumeLogged.toLocaleString()} kg</strong>
                    </div>
                    <button
                      className="btn-view-full-analytics"
                      onClick={() => setActiveTab('progress')}
                    >
                      <TrendingUp size={15} />
                      <span>Exercise Progression Charts</span>
                    </button>
                  </div>
                </div>

                <div className="dash-recharts-chart-wrap">
                  <ResponsiveContainer width="100%" height={230}>
                    <AreaChart data={volumeChartData} margin={{ top: 15, right: 15, left: -15, bottom: 5 }}>
                      <defs>
                        <linearGradient id="dashVolumeGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#10B981" stopOpacity={0.5} />
                          <stop offset="100%" stopColor="#10B981" stopOpacity={0.0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#232838" vertical={false} />
                      <XAxis
                        dataKey="date"
                        stroke="#8B949E"
                        tick={{ fill: '#8B949E', fontSize: 11 }}
                      />
                      <YAxis
                        stroke="#10B981"
                        tick={{ fill: '#10B981', fontSize: 11 }}
                        unit="kg"
                      />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: '#0E1320',
                          borderColor: '#10B981',
                          borderRadius: '8px',
                          color: '#F0EDE8',
                          fontSize: '0.82rem'
                        }}
                      />
                      <Area
                        type="monotone"
                        dataKey="volume"
                        name="Session Volume"
                        stroke="#10B981"
                        strokeWidth={2.5}
                        fill="url(#dashVolumeGrad)"
                        dot={{ fill: '#10B981', r: 4 }}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>
            )}

            {/* ── Feature Launchpad Tiles ── */}
            <div className="section-header">
              <h2>Navigation Launchpad</h2>
              <p>Quick access to all training modules</p>
            </div>

            <div className="feature-grid" ref={gridRef}>
              <div className="feature-tile" onClick={() => setActiveTab('workouts')}>
                <div className="tile-top">
                  <div className="tile-icon-box gold">
                    <Dumbbell size={22} />
                  </div>
                  <span className="status-badge live">Live Module</span>
                </div>
                <h3>Workout Protocols</h3>
                <p>Build custom routines, organize exercises, sets, reps and embedded video guidance.</p>
                <div className="tile-footer">
                  <span>Enter Protocols</span>
                  <ChevronRight size={16} />
                </div>
              </div>

              <div className="feature-tile" onClick={() => setActiveTab('log')}>
                <div className="tile-top">
                  <div className="tile-icon-box blue">
                    <Calendar size={22} />
                  </div>
                  <span className="status-badge live">Live Module</span>
                </div>
                <h3>Session Tracker</h3>
                <p>Record your workout dates, duration, volume notes, and filter through workout history.</p>
                <div className="tile-footer">
                  <span>Open Tracker</span>
                  <ChevronRight size={16} />
                </div>
              </div>

              <div className="feature-tile" onClick={() => setActiveTab('progress')}>
                <div className="tile-top">
                  <div className="tile-icon-box emerald">
                    <TrendingUp size={22} />
                  </div>
                  <span className="status-badge live">Live Module</span>
                </div>
                <h3>Body Composition</h3>
                <p>Track body weight, calorie targets, chest, waist, hips, and progress photo timeline.</p>
                <div className="tile-footer">
                  <span>View Metrics</span>
                  <ChevronRight size={16} />
                </div>
              </div>

              <div className="feature-tile" onClick={() => setActiveTab('social')}>
                <div className="tile-top">
                  <div className="tile-icon-box violet">
                    <Users size={22} />
                  </div>
                  <span className="status-badge live">Live Module</span>
                </div>
                <h3>Social Feed</h3>
                <p>Share transformations, interact with comments, reactions, and community media.</p>
                <div className="tile-footer">
                  <span>Join Discussion</span>
                  <ChevronRight size={16} />
                </div>
              </div>

              <div className="feature-tile" onClick={() => setActiveTab('map')}>
                <div className="tile-top">
                  <div className="tile-icon-box rose">
                    <MapPin size={22} />
                  </div>
                  <span className="status-badge live">Live Module</span>
                </div>
                <h3>Gym Locator</h3>
                <p>Locate elite fitness centers, CrossFit boxes, and 24/7 gyms nearby with interactive maps.</p>
                <div className="tile-footer">
                  <span>Explore Centers</span>
                  <ChevronRight size={16} />
                </div>
              </div>
            </div>

            {/* ── Security & Account Verification Card ── */}
            <div className="account-overview-card">
              <div className="acc-card-header">
                <div className="acc-title-group">
                  <Shield size={18} className="gold-icon" />
                  <h3>Account Credentials</h3>
                </div>
                <div className="verified-chip">
                  <CheckCircle2 size={14} />
                  <span>Secure Session Active</span>
                </div>
              </div>

              <div className="acc-grid">
                <div className="acc-item">
                  <span className="acc-label">Email Address</span>
                  <span className="acc-val">{user?.email}</span>
                </div>
                <div className="acc-item">
                  <span className="acc-label">Username Handle</span>
                  <span className="acc-val">@{profile?.username || 'not set'}</span>
                </div>
                <div className="acc-item">
                  <span className="acc-label">Contact Phone</span>
                  <span className="acc-val">{profile?.phone || 'Not provided'}</span>
                </div>
                <div className="acc-item">
                  <span className="acc-label">Email Verification</span>
                  <span className="acc-val text-green">
                    {user?.email_confirmed_at ? '✓ Confirmed' : 'Verification Pending'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ── Other Tab Views ── */}
        {activeTab === 'workouts' && <Workouts />}
        {activeTab === 'log' && <WorkoutLog />}
        {activeTab === 'progress' && <ProgressTracker />}
        {activeTab === 'social' && <SocialFeed user={user} />}
        {activeTab === 'map' && <GymMap />}
      </main>
    </div>
  );
};

export default Dashboard;
