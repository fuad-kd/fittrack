import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
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
  Ruler,
  Scale,
  Brain,
  Cpu,
  Heart,
  ThumbsDown,
  MessageSquare,
  Play,
  ExternalLink,
  Clock,
  Camera,
  RefreshCw,
  Send,
  X,
  Eye,
  Info,
  Edit3,
  Check,
  Calculator,
  RotateCcw,
  Trophy,
  Zap,
  Maximize2,
  Loader2,
  AlertCircle
} from 'lucide-react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend
} from 'recharts';

import Workouts from './Workouts';
import WorkoutLog from './WorkoutLog';
import ProgressTracker from './ProgressTracker';
import SocialFeed from './SocialFeed';
import GymMap from './GymMap';
import GoogleGymLocator, { GoogleMapsProvider } from './GoogleGymLocator';
import YouTubeEmbed from './YouTubeEmbed';
import { EXERCISE_LIBRARY } from '../data/exerciseLibrary';
import { runTFLiteInference } from '../utils/tfliteModel';
import './Dashboard.css';

const NAV_ITEMS = [
  { key: 'home',      label: 'Overview',     icon: LayoutDashboard },
  { key: 'workouts',  label: 'Protocols',    icon: Dumbbell },
  { key: 'log',       label: 'Session Log',  icon: Calendar },
  { key: 'progress',  label: 'Metrics',      icon: TrendingUp },
  { key: 'social',    label: 'Community',    icon: Users },
  { key: 'map',       label: 'Gym Locator',  icon: MapPin },
];

// Helper to extract YouTube video ID from various URL formats
function extractYouTubeId(url) {
  if (!url) return '2yjwXTZQDDI';
  const patterns = [
    /youtu\.be\/([^?&/]+)/,
    /youtube\.com\/watch\?v=([^&]+)/,
    /youtube\.com\/shorts\/([^?&/]+)/,
    /youtube\.com\/embed\/([^?&/]+)/,
  ];
  for (const p of patterns) {
    const m = url.match(p);
    if (m) return m[1];
  }
  return url.length === 11 ? url : '2yjwXTZQDDI';
}

// Match a plan exercise to the curated EXERCISE_LIBRARY for accurate 3D anatomy, cues, and fallback videos
function findLibraryExercise(exercise) {
  if (!exercise) return null;
  const nameLower = (exercise.name || '').trim().toLowerCase();
  const ytId = exercise.youtube_url ? extractYouTubeId(exercise.youtube_url) : null;

  if (nameLower) {
    const exact = EXERCISE_LIBRARY.find((lib) => lib.name.toLowerCase() === nameLower);
    if (exact) return exact;

    const partial = EXERCISE_LIBRARY.find(
      (lib) =>
        nameLower.includes(lib.name.toLowerCase()) ||
        lib.name.toLowerCase().includes(nameLower)
    );
    if (partial) return partial;
  }

  if (ytId) {
    const byVideo = EXERCISE_LIBRARY.find((lib) => lib.youtubeId === ytId);
    if (byVideo) return byVideo;
  }

  return null;
}

function isPushUpVariant(exercise) {
  if (!exercise) return false;
  if (exercise.infographicKey) return true;
  const lower = (exercise.name || '').toLowerCase();
  return lower.includes('push-up') || lower.includes('push up') || lower.includes('pushup');
}

function getPushUpInfographicKey(exercise) {
  if (exercise?.infographicKey) return exercise.infographicKey;
  const lower = (exercise?.name || '').toLowerCase();
  if (lower.includes('elbow')) return 'elbows-in';
  if (lower.includes('wide')) return 'wide-grip';
  if (lower.includes('pike')) return 'pike';
  return 'anatomy';
}

const DEFAULT_PROTOCOL_MOVEMENTS = [
  {
    id: 'demo_ex_pushup',
    name: 'Bodyweight Push-Up (Mastery Protocol)',
    muscle_group: 'Chest & Triceps',
    sets: 3,
    reps: 15,
    weight_kg: 0,
    youtube_url: 'https://www.youtube.com/watch?v=IODxDxX7oi4',
    notes: 'Keep elbows tucked at 45° — see anatomical guide for variations and muscle activation',
    hasInfographics: true,
    infographicKey: 'anatomy'
  },
  {
    id: 'demo_ex_elbows',
    name: 'Elbows-In Push-Up (Triceps Focus)',
    muscle_group: 'Triceps & Front Deltoids',
    sets: 3,
    reps: 12,
    weight_kg: 0,
    youtube_url: 'https://www.youtube.com/shorts/40auFxqBlGE',
    notes: 'Keep elbows pinned tight to ribs for direct tricep overload',
    hasInfographics: true,
    infographicKey: 'elbows-in'
  },
  {
    id: 'demo_ex_wide',
    name: 'Wide-Grip Push-Up (Chest Width)',
    muscle_group: 'Outer Pectorals & Shoulders',
    sets: 3,
    reps: 15,
    weight_kg: 0,
    youtube_url: 'https://www.youtube.com/watch?v=EsIdzx1J0iA',
    notes: '1.5x shoulder width for deep chest adduction and outer sternal stretch',
    hasInfographics: true,
    infographicKey: 'wide-grip'
  },
  {
    id: 'demo_ex_pike',
    name: 'Pike Push-Up (Shoulder Variation)',
    muscle_group: 'Anterior Shoulders & Upper Chest',
    sets: 3,
    reps: 10,
    weight_kg: 0,
    youtube_url: 'https://www.youtube.com/watch?v=sposDXWEB0A',
    notes: 'Inverted V stance to shift mechanical load directly to shoulders',
    hasInfographics: true,
    infographicKey: 'pike'
  },
  {
    id: 'demo_ex_1',
    name: 'Incline Barbell Bench Press',
    muscle_group: 'Upper Chest',
    sets: 4,
    reps: 8,
    weight_kg: 85,
    youtube_url: 'https://www.youtube.com/watch?v=2yjwXTZQDDI',
    notes: 'Pause 1s on chest for maximum mechanical tension'
  },
  {
    id: 'demo_ex_2',
    name: 'Weighted Chest Dips',
    muscle_group: 'Lower Chest & Triceps',
    sets: 3,
    reps: 10,
    weight_kg: 20,
    youtube_url: 'https://www.youtube.com/watch?v=2z8JmcrW-As',
    notes: 'Keep torso pitched forward 30 degrees'
  }
];

// ── Unit Conversion Constants & Helpers ──
const KG_TO_LBS = 2.20462262;
const CM_TO_IN = 0.393700787;

function kgToLbs(kg) {
  if (kg === '' || kg === null || isNaN(kg)) return '';
  return Number((Number(kg) * KG_TO_LBS).toFixed(1));
}

function lbsToKg(lbs) {
  if (lbs === '' || lbs === null || isNaN(lbs)) return '';
  return Number((Number(lbs) / KG_TO_LBS).toFixed(1));
}

function cmToInches(cm) {
  if (cm === '' || cm === null || isNaN(cm)) return '';
  return Number((Number(cm) * CM_TO_IN).toFixed(1));
}

function inchesToCm(inches) {
  if (inches === '' || inches === null || isNaN(inches)) return '';
  return Number((Number(inches) / CM_TO_IN).toFixed(1));
}

function formatInchesToFeet(inches) {
  const val = Number(inches);
  if (!val || isNaN(val)) return '';
  const feet = Math.floor(val / 12);
  const remainingIn = Math.round(val % 12);
  return `${feet}' ${remainingIn}"`;
}

// Dynamic Multi-Parameter BMI Calculator: Supports both Metric and Imperial units
function calculateBMI(weight, height, unitSystem = 'metric') {
  if (!weight || !height) {
    return {
      bmi: null,
      category: 'Awaiting Metrics',
      color: '#94a3b8',
      minHealthy: 0,
      maxHealthy: 0,
      unitLabel: unitSystem === 'metric' ? 'kg' : 'lbs'
    };
  }

  let bmiVal;
  let minHealthy;
  let maxHealthy;
  const unitLabel = unitSystem === 'metric' ? 'kg' : 'lbs';

  if (unitSystem === 'metric') {
    const hM = Number(height) / 100;
    if (hM <= 0) return { bmi: null, category: 'Invalid Height', color: '#94a3b8', minHealthy: 0, maxHealthy: 0, unitLabel };
    bmiVal = Number(weight) / (hM * hM);
    minHealthy = Number((18.5 * hM * hM).toFixed(1));
    maxHealthy = Number((24.9 * hM * hM).toFixed(1));
  } else {
    // Imperial formula: BMI = (weight_lbs * 703.0695) / (height_in ^ 2)
    const hIn = Number(height);
    if (hIn <= 0) return { bmi: null, category: 'Invalid Height', color: '#94a3b8', minHealthy: 0, maxHealthy: 0, unitLabel };
    bmiVal = (Number(weight) * 703.0695) / (hIn * hIn);
    minHealthy = Number(((18.5 * hIn * hIn) / 703.0695).toFixed(1));
    maxHealthy = Number(((24.9 * hIn * hIn) / 703.0695).toFixed(1));
  }

  const rounded = Number(bmiVal.toFixed(1));

  if (rounded < 18.5) return { bmi: rounded, category: 'Underweight', color: '#38bdf8', minHealthy, maxHealthy, unitLabel };
  if (rounded <= 24.9) return { bmi: rounded, category: 'Normal Weight (Optimal)', color: '#10b981', minHealthy, maxHealthy, unitLabel };
  if (rounded <= 29.9) return { bmi: rounded, category: 'Athletic / Hypertrophy Bulk', color: '#f59e0b', minHealthy, maxHealthy, unitLabel };
  return { bmi: rounded, category: 'High Mass / Class I', color: '#ef4444', minHealthy, maxHealthy, unitLabel };
}

// Dynamic Waist-to-Chest ratio (V-Taper index) — unit invariant
function calculateWaistToChest(waist, chest) {
  const w = Number(waist);
  const c = Number(chest);
  if (!w || !c || c <= 0) {
    return { ratio: null, category: 'Standard Frame', color: '#94a3b8', pctDiff: 0 };
  }
  const ratio = Number((w / c).toFixed(3));
  const pctDiff = Number((((c - w) / w) * 100).toFixed(1));

  if (ratio <= 0.75) {
    return { ratio, category: 'Golden Ratio V-Taper (Elite)', color: '#f59e0b', pctDiff };
  }
  if (ratio <= 0.80) {
    return { ratio, category: 'Athletic V-Taper (Optimal)', color: '#10b981', pctDiff };
  }
  if (ratio <= 0.85) {
    return { ratio, category: 'Balanced Athletic Frame', color: '#38bdf8', pctDiff };
  }
  return { ratio, category: 'Standard Frame', color: '#94a3b8', pctDiff };
}

const Dashboard = () => {
  const { user, profile, signOut } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('home');

  /* ── 1. Quick Stats State & Dynamic Calculations ── */
  const [unitSystem, setUnitSystem] = useState(() => {
    return localStorage.getItem('fittrack_preferred_unit') || 'metric';
  });
  const [latestProgress, setLatestProgress] = useState(null);
  const [prevProgress, setPrevProgress] = useState(null);
  const [userHeightCm, setUserHeightCm] = useState(() => {
    return Number(localStorage.getItem('fittrack_height_cm')) || 178;
  });
  const [totalCaloriesBurned, setTotalCaloriesBurned] = useState(0);
  const [_statsCounts, setStatsCounts] = useState({
    plansCount: 0,
    logsCount: 0,
    postsCount: 0,
    loading: true
  });

  // Modal / Inline Editing for Quick Stats
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [inlineEditingField, setInlineEditingField] = useState(null);
  const [editForm, setEditForm] = useState({
    weight: 82.4,
    height: 178,
    chest: 108.5,
    waist: 82.0,
    hips: 98.0,
    arms: 39.2,
    calories: 2750,
  });
  const [isSavingMetrics, setIsSavingMetrics] = useState(false);
  const [saveSuccessToast, setSaveSuccessToast] = useState('');
  const [saveErrorToast, setSaveErrorToast] = useState('');
  const [weeklyGoalSessions, setWeeklyGoalSessions] = useState(() => {
    const saved = Number(localStorage.getItem('fittrack_weekly_goal'));
    return saved >= 2 && saved <= 7 ? saved : 4;
  });

  /* ── 2. Today's Workout Plan State ── */
  const [userPlans, setUserPlans] = useState([]);
  const [allPlanExercises, setAllPlanExercises] = useState([]);
  const [todayPlan, setTodayPlan] = useState(null);
  const [todayExercises, setTodayExercises] = useState([]);
  const [activeVideoEx, setActiveVideoEx] = useState(null);
  const [isPlanCompletedToday, setIsPlanCompletedToday] = useState(false);
  const [guidanceView, setGuidanceView] = useState('anatomy'); // 'anatomy' | 'video'
  const [selectedInfographicKey, setSelectedInfographicKey] = useState('anatomy'); // 'anatomy' | 'variations' | 'biomechanics'
  const [dashboardLightbox, setDashboardLightbox] = useState(null);

  /* ── 3. Progress Chart State ── */
  const [chartMetric, setChartMetric] = useState('composite'); // 'composite' | 'weight' | 'calories' | 'history'
  const [chartTimeRange, setChartTimeRange] = useState('30d'); // '7d' | '30d' | 'all'
  const [progressChartData, setProgressChartData] = useState([]);

  /* ── 4. Recent Activity State ── */
  const [recentLogs, setRecentLogs] = useState([]);
  const [activityDateFilter, setActivityDateFilter] = useState('');
  const [progressPhotos, setProgressPhotos] = useState([]);
  const [selectedPhotoModal, setSelectedPhotoModal] = useState(null);

  /* ── 5. Readiness & Forecast State ── */
  const [tfliteResult, setTfliteResult] = useState(null);
  const [isInferring, setIsInferring] = useState(false);

  /* ── 6. Social Highlights State ── */
  const [socialHighlights, setSocialHighlights] = useState([]);
  const [quickCommentText, setQuickCommentText] = useState({});
  const [commentSubmitting, setCommentSubmitting] = useState({});
  const [quickReactionPending, setQuickReactionPending] = useState({});
  const [socialHighlightError, setSocialHighlightError] = useState('');

  // GSAP Container Refs
  const overviewRef = useRef(null);

  /* ── Fetch All Dashboard Data ── */
  const fetchDashboardData = useCallback(async () => {
    if (!user) return;

    try {
      const [plansRes, logsRes, progressRes, postsRes, exercisesRes] = await Promise.all([
        supabase.from('workout_plans').select('*').eq('user_id', user.id).order('created_at', { ascending: false }),
        supabase.from('workout_logs').select('*').eq('user_id', user.id).order('log_date', { ascending: false }),
        supabase.from('progress_entries').select('*').eq('user_id', user.id).order('entry_date', { ascending: false }),
        supabase
          .from('posts')
          .select('*, profiles:user_id ( username, avatar_url ), post_comments(*, profiles:user_id ( username, avatar_url ))')
          .order('created_at', { ascending: false })
          .limit(3),
        supabase.from('exercises').select('*')
      ]);

      const plansList = plansRes.data || [];
      const logsList = logsRes.data || [];
      const progressList = progressRes.data || [];
      const postsList = postsRes.data || [];
      const exercisesList = exercisesRes.data || [];

      setStatsCounts({
        plansCount: plansList.length,
        logsCount: logsList.length,
        postsCount: postsList.length,
        loading: false,
      });

      // Quick Stats: Latest & Previous progress measurements
      if (progressList.length > 0) {
        const latest = progressList[0];
        setLatestProgress(latest);
        if (progressList.length > 1) {
          setPrevProgress(progressList[1]);
        }
        
        const rawW = Number(latest.weight_kg) || 82.4;
        const rawH = userHeightCm;
        const rawC = Number(latest.chest_cm) || 108.5;
        const rawWa = Number(latest.waist_cm) || 82.0;
        const rawHi = Number(latest.hips_cm) || 98.0;
        const rawA = Number(latest.arms_cm) || 39.2;

        setEditForm({
          weight: unitSystem === 'imperial' ? kgToLbs(rawW) : rawW,
          height: unitSystem === 'imperial' ? cmToInches(rawH) : rawH,
          chest: unitSystem === 'imperial' ? cmToInches(rawC) : rawC,
          waist: unitSystem === 'imperial' ? cmToInches(rawWa) : rawWa,
          hips: unitSystem === 'imperial' ? cmToInches(rawHi) : rawHi,
          arms: unitSystem === 'imperial' ? cmToInches(rawA) : rawA,
          calories: Number(latest.calories) || 2750,
        });
      }

      // Calculate Total Calories Burned from real logs & entries
      let totalBurned = 0;
      logsList.forEach(log => {
        const mins = Number(log.duration_min) || 45;
        totalBurned += Math.round(mins * 8.5);
      });
      setTotalCaloriesBurned(totalBurned);

      // 2. Today's Workout Plan & Movement Protocols
      setUserPlans(plansList);
      setAllPlanExercises(exercisesList);

      if (plansList.length > 0) {
        const primaryPlan = plansList[0];
        setTodayPlan(primaryPlan);
        const planExs = exercisesList.filter(e => e.plan_id === primaryPlan.id);
        const finalExs = planExs.length > 0 ? planExs : DEFAULT_PROTOCOL_MOVEMENTS;
        setTodayExercises(finalExs);
        const firstEx = finalExs[0];
        setActiveVideoEx(firstEx);
        if (isPushUpVariant(firstEx)) {
          setSelectedInfographicKey(getPushUpInfographicKey(firstEx));
          setGuidanceView('anatomy');
        } else {
          const matchedLib = findLibraryExercise(firstEx);
          setGuidanceView(matchedLib?.infographics?.length ? 'anatomy' : 'video');
        }
      } else {
        setTodayPlan(null);
        setTodayExercises(DEFAULT_PROTOCOL_MOVEMENTS);
        setActiveVideoEx(DEFAULT_PROTOCOL_MOVEMENTS[0]);
        setSelectedInfographicKey('anatomy');
        setGuidanceView('anatomy');
      }

      // Check if logged today
      const todayStr = new Date().toISOString().split('T')[0];
      const loggedToday = logsList.some(l => l.log_date === todayStr);
      setIsPlanCompletedToday(loggedToday);

      // 3. Progress Chart Data Preparation (real logged entries only)
      const dateMap = {};
      progressList.forEach(p => {
        const d = p.entry_date;
        if (!dateMap[d]) dateMap[d] = { date: d };
        dateMap[d].weight = Number(p.weight_kg) || null;
        dateMap[d].calories = Number(p.calories) || null;
      });

      logsList.forEach(l => {
        const d = l.log_date;
        if (!dateMap[d]) dateMap[d] = { date: d };
        dateMap[d].duration = Number(l.duration_min) || 45;
        dateMap[d].caloriesBurned = Math.round((Number(l.duration_min) || 45) * 8.5);
      });

      const mergedChartData = Object.values(dateMap).sort((a, b) => new Date(a.date) - new Date(b.date));
      setProgressChartData(mergedChartData);

      // 4. Recent Activity Data
      setRecentLogs(logsList);
      const photos = progressList.filter(p => p.photo_url).map(p => ({
        id: p.id,
        date: p.entry_date,
        url: p.photo_url,
        weight: p.weight_kg,
        notes: p.notes || 'Physique check-in'
      }));
      setProgressPhotos(photos);

      // 5. Training Readiness & Forecast Calculation (driven by actual logged sessions & volume)
      const latestWeight = progressList[0]?.weight_kg || 75;
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      const sevenDayCutoff = sevenDaysAgo.toISOString().split('T')[0];
      const recentWeekLogs = logsList.filter(l => l.log_date >= sevenDayCutoff);
      const avgDuration = logsList.length > 0
        ? Math.round(logsList.reduce((acc, l) => acc + (Number(l.duration_min) || 45), 0) / logsList.length)
        : 45;
      const estimatedPlanVolume = exercisesList
        .filter(e => !plansList[0] || e.plan_id === plansList[0].id)
        .reduce((acc, e) => acc + ((Number(e.sets) || 3) * (Number(e.reps) || 10) * (Number(e.weight_kg) || 20)), 0);

      const inferenceResult = await runTFLiteInference({
        weightKg: latestWeight,
        weeklyVolumeKg: estimatedPlanVolume > 0 ? estimatedPlanVolume : Math.max(2500, recentWeekLogs.length * 1800),
        avgDurationMin: avgDuration,
        caloriesLogged: progressList[0]?.calories || 2500,
        consistencyDays: Math.min(7, new Set(recentWeekLogs.map(l => l.log_date)).size)
      });
      setTfliteResult(inferenceResult);

      // 6. Social Highlights (with post_reactions persisted state & profile joins)
      if (postsRes.error) {
        setSocialHighlightError(postsRes.error.message || 'Could not load community highlights.');
      } else {
        const highlightIds = postsList.map((p) => p.id);
        let highlightReactions = [];
        let reactionsErr = false;
        if (highlightIds.length > 0) {
          const { data: rData, error: rErr } = await supabase
            .from('post_reactions')
            .select('id, post_id, user_id, reaction_type')
            .in('post_id', highlightIds);
          if (rErr) {
            reactionsErr = true;
          } else {
            highlightReactions = rData || [];
          }
        }

        setSocialHighlights(
          postsList.map((post) => {
            const postReactions = highlightReactions.filter((r) => String(r.post_id) === String(post.id));
            const userReactionRow = postReactions.find((r) => String(r.user_id) === String(user.id));
            const likesCount =
              isSupabaseConfigured && !reactionsErr
                ? postReactions.filter((r) => r.reaction_type === 'like').length
                : post.likes_count || 0;
            const dislikesCount =
              isSupabaseConfigured && !reactionsErr
                ? postReactions.filter((r) => r.reaction_type === 'dislike').length
                : post.dislikes_count || 0;

            return {
              ...post,
              likes_count: likesCount,
              dislikes_count: dislikesCount,
              userReaction: userReactionRow ? userReactionRow.reaction_type : null,
              comments: post.post_comments
                ? [...post.post_comments].sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
                : [],
            };
          })
        );
      }

    } catch (err) {
      console.error('[FitTrack Dashboard] Error loading modules:', err);
    }
  }, [user, userHeightCm, unitSystem]);

  const refreshSocialHighlights = useCallback(async () => {
    if (!user) return;
    try {
      const { data: postsData, error: postsErr } = await supabase
        .from('posts')
        .select('*, profiles:user_id ( username, avatar_url ), post_comments(*, profiles:user_id ( username, avatar_url ))')
        .order('created_at', { ascending: false })
        .limit(3);

      if (postsErr) {
        setSocialHighlightError(postsErr.message || 'Could not refresh community highlights.');
        return;
      }

      if (!postsData) return;

      const highlightIds = postsData.map((p) => p.id);
      let highlightReactions = [];
      let reactionsErr = false;

      if (highlightIds.length > 0) {
        const { data: rData, error: rErr } = await supabase
          .from('post_reactions')
          .select('id, post_id, user_id, reaction_type')
          .in('post_id', highlightIds);
        if (rErr) reactionsErr = true;
        else highlightReactions = rData || [];
      }

      setSocialHighlights(
        postsData.map((post) => {
          const postReactions = highlightReactions.filter((r) => String(r.post_id) === String(post.id));
          const userReactionRow = postReactions.find((r) => String(r.user_id) === String(user.id));
          const likesCount =
            isSupabaseConfigured && !reactionsErr
              ? postReactions.filter((r) => r.reaction_type === 'like').length
              : post.likes_count || 0;
          const dislikesCount =
            isSupabaseConfigured && !reactionsErr
              ? postReactions.filter((r) => r.reaction_type === 'dislike').length
              : post.dislikes_count || 0;

          return {
            ...post,
            likes_count: likesCount,
            dislikes_count: dislikesCount,
            userReaction: userReactionRow ? userReactionRow.reaction_type : null,
            comments: post.post_comments
              ? [...post.post_comments].sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
              : [],
          };
        })
      );
    } catch (err) {
      console.warn('[FitTrack Dashboard] Could not refresh social highlights:', err);
    }
  }, [user]);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  useEffect(() => {
    if (activeTab === 'home') {
      refreshSocialHighlights();
    }
  }, [activeTab, refreshSocialHighlights]);

  // GSAP Animations when viewing Overview
  useEffect(() => {
    if (activeTab === 'home') {
      const ctx = gsap.context(() => {
        gsap.from('.dash-hero-banner', { opacity: 0, y: -20, duration: 0.5, ease: 'power2.out' });
        gsap.from('.stat-metric-card', { opacity: 0, y: 15, duration: 0.4, stagger: 0.06, ease: 'power2.out', delay: 0.1 });
        gsap.from('.dashboard-section', { opacity: 0, y: 25, duration: 0.45, stagger: 0.08, ease: 'power2.out', delay: 0.2 });
      }, overviewRef);
      return () => ctx.revert();
    }
  }, [activeTab]);

  /* ── Dynamic Real-Time Calculations (Derived State) ── */
  const dynamicBMI = useMemo(() => {
    return calculateBMI(editForm.weight, editForm.height, unitSystem);
  }, [editForm.weight, editForm.height, unitSystem]);

  const dynamicRatio = useMemo(() => {
    return calculateWaistToChest(editForm.waist, editForm.chest);
  }, [editForm.waist, editForm.chest]);

  /* ── Unit Switcher Handler with Live Conversion ── */
  const handleUnitToggle = (newUnit) => {
    if (newUnit === unitSystem) return;

    if (newUnit === 'imperial') {
      // Metric -> Imperial conversion
      setEditForm(prev => ({
        ...prev,
        weight: kgToLbs(prev.weight),
        height: cmToInches(prev.height),
        chest: cmToInches(prev.chest),
        waist: cmToInches(prev.waist),
        hips: cmToInches(prev.hips),
        arms: cmToInches(prev.arms),
      }));
    } else {
      // Imperial -> Metric conversion
      setEditForm(prev => ({
        ...prev,
        weight: lbsToKg(prev.weight),
        height: inchesToCm(prev.height),
        chest: inchesToCm(prev.chest),
        waist: inchesToCm(prev.waist),
        hips: inchesToCm(prev.hips),
        arms: inchesToCm(prev.arms),
      }));
    }

    setUnitSystem(newUnit);
    localStorage.setItem('fittrack_preferred_unit', newUnit);
  };

  /* ── Weekly Momentum, Streak & 7-Day Activity Tracker ── */
  const momentumStats = useMemo(() => {
    const today = new Date();
    const todayIso = today.toISOString().split('T')[0];

    // Build current week (Monday -> Sunday)
    const dayOfWeek = today.getDay(); // 0 = Sun, 1 = Mon...
    const diffToMonday = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
    const monday = new Date(today);
    monday.setDate(today.getDate() + diffToMonday);

    const logDatesSet = new Set(recentLogs.map((l) => l.log_date));
    const weekDays = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((label, idx) => {
      const d = new Date(monday);
      d.setDate(monday.getDate() + idx);
      const iso = d.toISOString().split('T')[0];
      return {
        label,
        iso,
        completed: logDatesSet.has(iso),
        isToday: iso === todayIso,
      };
    });

    const sessionsThisWeek = weekDays.filter((d) => d.completed).length;

    // Consecutive-day streak ending today or yesterday
    let streak = 0;
    const cursor = new Date(today);
    if (!logDatesSet.has(todayIso)) {
      cursor.setDate(cursor.getDate() - 1);
    }
    while (logDatesSet.has(cursor.toISOString().split('T')[0])) {
      streak += 1;
      cursor.setDate(cursor.getDate() - 1);
    }

    const totalSessions = recentLogs.length;
    const avgDuration =
      totalSessions > 0
        ? Math.round(
            recentLogs.reduce((sum, l) => sum + (Number(l.duration_min) || 45), 0) / totalSessions
          )
        : 0;

    return {
      weekDays,
      sessionsThisWeek,
      streak,
      totalSessions,
      avgDuration,
    };
  }, [recentLogs]);

  const todayMetricsSummary = useMemo(() => {
    const totalSets = todayExercises.reduce((sum, ex) => sum + (Number(ex.sets) || 3), 0);
    const estMinutes = Math.max(20, Math.round(totalSets * 3.5));
    const estBurn = Math.round(estMinutes * 8.5);
    const estimatedVolumeKg = todayExercises.reduce(
      (sum, ex) => sum + (Number(ex.sets) || 3) * (Number(ex.reps) || 10) * (Number(ex.weight_kg) || 20),
      0
    );
    return { totalSets, estMinutes, estBurn, estimatedVolumeKg };
  }, [todayExercises]);

  const activeLibraryMatch = useMemo(() => findLibraryExercise(activeVideoEx), [activeVideoEx]);
  const activeIsPushUp = useMemo(() => isPushUpVariant(activeVideoEx), [activeVideoEx]);

  const handleWeeklyGoalChange = (goal) => {
    setWeeklyGoalSessions(goal);
    localStorage.setItem('fittrack_weekly_goal', String(goal));
  };

  /* ── Switch Active Plan Preview in Today's Workout ── */
  const handleSelectTodayPlan = (planId) => {
    const chosen = userPlans.find((p) => String(p.id) === String(planId));
    if (!chosen) return;
    setTodayPlan(chosen);
    const planExs = allPlanExercises.filter((e) => String(e.plan_id) === String(chosen.id));
    const finalExs = planExs.length > 0 ? planExs : DEFAULT_PROTOCOL_MOVEMENTS;
    setTodayExercises(finalExs);
    const firstEx = finalExs[0];
    setActiveVideoEx(firstEx);
    if (isPushUpVariant(firstEx)) {
      setSelectedInfographicKey(getPushUpInfographicKey(firstEx));
      setGuidanceView('anatomy');
    } else {
      const matchedLib = findLibraryExercise(firstEx);
      setGuidanceView(matchedLib?.infographics?.length ? 'anatomy' : 'video');
    }
  };

  /* ── Database Update / Save Body Metrics Logic ── */
  const handleSaveMetrics = async (e) => {
    if (e && e.preventDefault) e.preventDefault();
    if (!user) return;

    setIsSavingMetrics(true);
    const todayStr = new Date().toISOString().split('T')[0];

    try {
      // Always normalize to Metric for standard DB storage
      const metricWeight = unitSystem === 'imperial' ? lbsToKg(editForm.weight) : Number(editForm.weight);
      const metricHeight = unitSystem === 'imperial' ? inchesToCm(editForm.height) : Number(editForm.height);
      const metricChest  = unitSystem === 'imperial' ? inchesToCm(editForm.chest)  : Number(editForm.chest);
      const metricWaist  = unitSystem === 'imperial' ? inchesToCm(editForm.waist)  : Number(editForm.waist);
      const metricHips   = unitSystem === 'imperial' ? inchesToCm(editForm.hips)   : Number(editForm.hips);
      const metricArms   = unitSystem === 'imperial' ? inchesToCm(editForm.arms)   : Number(editForm.arms);

      localStorage.setItem('fittrack_height_cm', String(metricHeight));
      setUserHeightCm(metricHeight);

      const payload = {
        user_id: user.id,
        entry_date: todayStr,
        weight_kg: metricWeight,
        chest_cm: metricChest,
        waist_cm: metricWaist,
        hips_cm: metricHips,
        arms_cm: metricArms,
        calories: Number(editForm.calories),
        notes: `Body metrics update (${unitSystem}): BMI ${dynamicBMI.bmi}, V-Taper ${dynamicRatio.ratio}`,
      };

      let saveError = null;

      if (latestProgress?.entry_date === todayStr && latestProgress.id) {
        const { error } = await supabase
          .from('progress_entries')
          .update(payload)
          .eq('id', latestProgress.id);
        saveError = error;
      } else {
        const { error } = await supabase
          .from('progress_entries')
          .insert(payload);
        saveError = error;
      }

      if (saveError) {
        console.error('Error saving metrics to database:', saveError);
        setSaveErrorToast('Could not save metrics: ' + saveError.message);
        setTimeout(() => setSaveErrorToast(''), 5000);
      } else {
        setLatestProgress(prev => ({
          ...(prev || {}),
          ...payload,
          id: prev?.id || `gen_${Date.now()}`
        }));

        setSaveSuccessToast('Body metrics & anthropometry saved.');
        setTimeout(() => setSaveSuccessToast(''), 4000);
        setIsEditModalOpen(false);
        setInlineEditingField(null);

        // Refresh readiness forecast with updated metric values
        runTFLiteInference({
          weightKg: metricWeight,
          weeklyVolumeKg: todayMetricsSummary.estimatedVolumeKg || 6500,
          avgDurationMin: momentumStats.avgDuration || 50,
          caloriesLogged: Number(editForm.calories),
          consistencyDays: Math.max(1, momentumStats.sessionsThisWeek)
        }).then(res => setTfliteResult(res));
      }
    } catch (err) {
      console.error('Unexpected error updating metrics:', err);
      setSaveErrorToast('Unexpected error saving metrics. Please try again.');
      setTimeout(() => setSaveErrorToast(''), 5000);
    } finally {
      setIsSavingMetrics(false);
    }
  };

  /* ── Filtered Recent Logs by Date ── */
  const filteredRecentLogs = useMemo(() => {
    if (!activityDateFilter) return recentLogs.slice(0, 6);
    return recentLogs.filter(log => log.log_date === activityDateFilter);
  }, [recentLogs, activityDateFilter]);

  /* ── Filtered Chart Data by Range (unit-aware) ── */
  const filteredChartData = useMemo(() => {
    if (!progressChartData || progressChartData.length === 0) return [];
    let sliced = progressChartData;
    if (chartTimeRange !== 'all') {
      const days = chartTimeRange === '7d' ? 7 : 30;
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - days);
      const cutoffStr = cutoffDate.toISOString().split('T')[0];
      const filtered = progressChartData.filter(d => d.date >= cutoffStr);
      sliced = filtered.length > 0 ? filtered : progressChartData;
    }

    return sliced.map((d) => ({
      ...d,
      weightDisplay:
        d.weight == null
          ? null
          : unitSystem === 'imperial'
          ? kgToLbs(d.weight)
          : d.weight,
    }));
  }, [progressChartData, chartTimeRange, unitSystem]);

  /* ── Re-run Readiness & Forecast Model ── */
  const handleRerunTFLite = async () => {
    setIsInferring(true);
    try {
      const metricW = unitSystem === 'imperial' ? lbsToKg(editForm.weight) : Number(editForm.weight);
      const res = await runTFLiteInference({
        weightKg: metricW || 75,
        weeklyVolumeKg: todayMetricsSummary.estimatedVolumeKg || 6500,
        avgDurationMin: momentumStats.avgDuration || 50,
        caloriesLogged: Number(editForm.calories) || 2500,
        consistencyDays: Math.max(1, momentumStats.sessionsThisWeek)
      });
      setTfliteResult(res);
    } catch (err) {
      console.warn('Readiness inference error:', err);
    } finally {
      setIsInferring(false);
    }
  };

  /* ── Social Highlights Optimistic Reaction (Like / Unlike / Dislike) ── */
  const handleQuickReaction = async (postId, type) => {
    if (!user || quickReactionPending[postId]) return;
    const target = socialHighlights.find((p) => p.id === postId);
    if (!target) return;

    setSocialHighlightError('');
    setQuickReactionPending((prev) => ({ ...prev, [postId]: true }));

    const prevSnapshot = {
      userReaction: target.userReaction || null,
      likes_count: target.likes_count || 0,
      dislikes_count: target.dislikes_count || 0,
    };

    const currentReaction = prevSnapshot.userReaction;
    let nextReaction = null;
    let nextLikes = prevSnapshot.likes_count;
    let nextDislikes = prevSnapshot.dislikes_count;

    if (currentReaction === type) {
      nextReaction = null;
      if (type === 'like') nextLikes = Math.max(0, nextLikes - 1);
      else nextDislikes = Math.max(0, nextDislikes - 1);
    } else if (currentReaction && currentReaction !== type) {
      nextReaction = type;
      if (type === 'like') {
        nextLikes += 1;
        nextDislikes = Math.max(0, nextDislikes - 1);
      } else {
        nextDislikes += 1;
        nextLikes = Math.max(0, nextLikes - 1);
      }
    } else {
      nextReaction = type;
      if (type === 'like') nextLikes += 1;
      else nextDislikes += 1;
    }

    setSocialHighlights((prev) =>
      prev.map((p) =>
        p.id === postId
          ? {
              ...p,
              userReaction: nextReaction,
              likes_count: nextLikes,
              dislikes_count: nextDislikes,
            }
          : p
      )
    );

    try {
      if (nextReaction === null) {
        const { error } = await supabase
          .from('post_reactions')
          .delete()
          .eq('post_id', postId)
          .eq('user_id', user.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('post_reactions')
          .upsert(
            { post_id: postId, user_id: user.id, reaction_type: nextReaction },
            { onConflict: 'post_id,user_id' }
          );
        if (error) throw error;
      }

      if (!isSupabaseConfigured) {
        await supabase
          .from('posts')
          .update({ likes_count: nextLikes, dislikes_count: nextDislikes })
          .eq('id', postId);
      }
    } catch (err) {
      setSocialHighlights((prev) =>
        prev.map((p) => (p.id === postId ? { ...p, ...prevSnapshot } : p))
      );
      setSocialHighlightError(err.message || 'Could not save reaction. Change reverted.');
    } finally {
      setQuickReactionPending((prev) => ({ ...prev, [postId]: false }));
    }
  };

  /* ── Social Feed Quick Comment (Optimistic + Form Safe) ── */
  const handleQuickComment = async (e, postId) => {
    if (e && e.preventDefault) e.preventDefault();
    const text = (quickCommentText[postId] || '').trim();
    if (!text || !user || commentSubmitting[postId]) return;

    setSocialHighlightError('');
    setCommentSubmitting((prev) => ({ ...prev, [postId]: true }));

    const authorName =
      profile?.username || user?.user_metadata?.username || user?.email?.split('@')[0] || 'athlete';
    const tempId = `temp_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
    const optimisticComment = {
      id: tempId,
      post_id: postId,
      user_id: user.id,
      username: authorName,
      profiles: {
        username: authorName,
        avatar_url: profile?.avatar_url || null,
      },
      content: text,
      created_at: new Date().toISOString(),
    };

    setQuickCommentText((prev) => ({ ...prev, [postId]: '' }));
    setSocialHighlights((prev) =>
      prev.map((p) =>
        p.id === postId ? { ...p, comments: [optimisticComment, ...(p.comments || [])] } : p
      )
    );

    try {
      const { data: confirmedComment, error } = await supabase
        .from('post_comments')
        .insert({
          post_id: postId,
          user_id: user.id,
          username: authorName,
          content: text,
        })
        .select('*, profiles:user_id ( username, avatar_url )')
        .single();

      if (error) throw error;

      if (confirmedComment) {
        const hydratedComment = {
          ...confirmedComment,
          profiles: confirmedComment.profiles || {
            username: authorName,
            avatar_url: profile?.avatar_url || null,
          },
        };
        setSocialHighlights((prev) =>
          prev.map((p) => {
            if (p.id !== postId) return p;
            const filtered = (p.comments || []).filter(
              (c) => c.id !== tempId && c.id !== hydratedComment.id
            );
            return { ...p, comments: [hydratedComment, ...filtered] };
          })
        );
      }
    } catch (err) {
      setSocialHighlights((prev) =>
        prev.map((p) =>
          p.id === postId
            ? { ...p, comments: (p.comments || []).filter((c) => c.id !== tempId) }
            : p
        )
      );
      setQuickCommentText((prev) => ({ ...prev, [postId]: text }));
      setSocialHighlightError(err.message || 'Could not post comment. Please try again.');
    } finally {
      setCommentSubmitting((prev) => ({ ...prev, [postId]: false }));
    }
  };

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
    <GoogleMapsProvider>
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
              <span className="brand-sub">SMART GYM</span>
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
                <span className="user-tier">Pro Athlete</span>
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
          <div className="home-dashboard-view" ref={overviewRef}>
            {/* ── Success / Error Toasts ── */}
            {saveSuccessToast && (
              <div className="dash-save-toast" role="status">
                <CheckCircle2 size={16} className="toast-icon" />
                <span>{saveSuccessToast}</span>
              </div>
            )}
            {saveErrorToast && (
              <div className="dash-error-toast" role="alert">
                <AlertCircle size={16} />
                <span>{saveErrorToast}</span>
                <button type="button" className="sh-error-close" onClick={() => setSaveErrorToast('')} aria-label="Dismiss error">
                  <X size={14} />
                </button>
              </div>
            )}

            {/* ── Hero Welcome Banner ── */}
            <div className="dash-hero-banner">
              <div className="hero-banner-content">
                <div className="hero-eyebrow">
                  <Sparkles size={14} className="gold-sparkle" />
                  <span>TRAINING OVERVIEW</span>
                  <span className="date-pill">
                    {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}
                  </span>
                </div>
                <h1 className="hero-heading">
                  {getGreeting()}, <span className="gold-name">{profile?.username || 'Athlete'}</span>
                </h1>
                <p className="hero-subtext">
                  {momentumStats.sessionsThisWeek > 0
                    ? `You've logged ${momentumStats.sessionsThisWeek} of ${weeklyGoalSessions} target sessions this week${momentumStats.streak > 1 ? ` with a ${momentumStats.streak}-day streak` : ''}. Track your composition, active workout plan, and recovery below.`
                    : 'Track your daily training plan, body composition, session history, and nearby gyms from one clean hub.'}
                </p>
              </div>

              <div className="hero-banner-cta">
                <button className="hero-btn-primary" onClick={() => setActiveTab('log')}>
                  <Play size={15} fill="currentColor" />
                  <span>{isPlanCompletedToday ? 'Log Another Session' : 'Log Today’s Session'}</span>
                </button>
                <button className="hero-btn-secondary" onClick={() => setIsEditModalOpen(true)}>
                  <Edit3 size={15} />
                  <span>Edit Body Metrics</span>
                </button>
              </div>
            </div>

            {/* ── Weekly Momentum & Consistency Strip ── */}
            <section className="momentum-strip" aria-label="Weekly Training Momentum">
              <div className="momentum-card momentum-week-card">
                <div className="momentum-head">
                  <div>
                    <span className="momentum-label">Weekly Training Target</span>
                    <div className="momentum-value-row">
                      <strong className="momentum-big-num">
                        {momentumStats.sessionsThisWeek} <span className="momentum-slash">/ {weeklyGoalSessions}</span>
                      </strong>
                      <span className="momentum-sub-pill">
                        {momentumStats.sessionsThisWeek >= weeklyGoalSessions ? 'Goal Met' : `${Math.max(0, weeklyGoalSessions - momentumStats.sessionsThisWeek)} left this week`}
                      </span>
                    </div>
                  </div>
                  <div className="weekly-goal-picker" title="Adjust weekly workout target">
                    {[3, 4, 5, 6].map((goal) => (
                      <button
                        key={goal}
                        type="button"
                        className={`goal-chip-btn ${weeklyGoalSessions === goal ? 'active' : ''}`}
                        onClick={() => handleWeeklyGoalChange(goal)}
                      >
                        {goal}d
                      </button>
                    ))}
                  </div>
                </div>

                <div className="week-days-strip">
                  {momentumStats.weekDays.map((day) => (
                    <div
                      key={day.iso}
                      className={`week-day-pill ${day.completed ? 'completed' : ''} ${day.isToday ? 'today' : ''}`}
                      title={`${day.label} (${day.iso})${day.completed ? ' — Workout logged' : ''}`}
                    >
                      <span className="wd-name">{day.label}</span>
                      <span className="wd-dot">
                        {day.completed ? <Check size={11} strokeWidth={3} /> : null}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="momentum-card">
                <span className="momentum-label">Current Streak</span>
                <div className="momentum-kpi-line">
                  <Flame size={20} className="text-orange" />
                  <strong className="momentum-big-num">{momentumStats.streak}</strong>
                  <span className="momentum-unit">{momentumStats.streak === 1 ? 'day' : 'days'}</span>
                </div>
                <span className="momentum-foot">
                  {momentumStats.streak > 0 ? 'Consecutive training days' : 'Log today to start a streak'}
                </span>
              </div>

              <div className="momentum-card">
                <span className="momentum-label">Logged Sessions</span>
                <div className="momentum-kpi-line">
                  <Calendar size={20} className="text-blue-400" />
                  <strong className="momentum-big-num">{momentumStats.totalSessions}</strong>
                  <span className="momentum-unit">total</span>
                </div>
                <span className="momentum-foot">
                  {momentumStats.avgDuration > 0 ? `Avg ${momentumStats.avgDuration} min / session` : 'No sessions logged yet'}
                </span>
              </div>

              <div className="momentum-card momentum-action-card" onClick={() => setActiveTab('workouts')} role="button" tabIndex={0} onKeyDown={(e) => e.key === 'Enter' && setActiveTab('workouts')}>
                <span className="momentum-label">Active Protocols</span>
                <div className="momentum-kpi-line">
                  <Dumbbell size={20} className="text-gold" />
                  <strong className="momentum-big-num">{_statsCounts.plansCount}</strong>
                  <span className="momentum-unit">{_statsCounts.plansCount === 1 ? 'plan' : 'plans'}</span>
                </div>
                <span className="momentum-foot momentum-link">
                  Manage routines & exercises <ChevronRight size={13} />
                </span>
              </div>
            </section>

            <div className="dashboard-widgets-grid">

              {/* ────────────────────────────────────────────────────────────
                  WIDGET 1: BODY COMPOSITION & QUICK STATS
              ──────────────────────────────────────────────────────────── */}
              <section className="dashboard-section widget-quick-stats" aria-label="Body Composition and Quick Metrics">
                <div className="section-title-wrap">
                  <div className="section-title-icon gold">
                    <Activity size={18} />
                  </div>
                  <div className="section-title-between">
                    <div>
                      <div className="widget-badge-tag">BODY COMPOSITION</div>
                      <h2 className="section-title">Quick Stats & Anthropometry</h2>
                      <p className="section-desc">Click any metric to update inline, or open the configurator for full calculations</p>
                    </div>

                    <div className="quick-stats-actions">
                      {/* Live Global Unit Switcher on the Dashboard */}
                      <div className="quick-unit-toggle" role="group" aria-label="Measurement Unit Switcher">
                        <button
                          type="button"
                          className={`quick-unit-btn ${unitSystem === 'metric' ? 'active' : ''}`}
                          onClick={() => handleUnitToggle('metric')}
                        >
                          Metric (kg, cm)
                        </button>
                        <button
                          type="button"
                          className={`quick-unit-btn ${unitSystem === 'imperial' ? 'active' : ''}`}
                          onClick={() => handleUnitToggle('imperial')}
                        >
                          Imperial (lbs, in)
                        </button>
                      </div>

                      <button 
                        className="btn-edit-metrics"
                        onClick={() => setIsEditModalOpen(true)}
                        title="Open Full Anthropometry Configurator"
                      >
                        <Edit3 size={14} />
                        <span>Advanced Modal</span>
                      </button>
                    </div>
                  </div>
                </div>

                {/* 4-Card Responsive Grid for Quick Stats */}
                <div className="stats-kpi-grid editable-stats-grid">
                  
                  {/* 1A: Dynamic Weight Benchmark with Inline Editing */}
                  <div className="stat-metric-card highlight-border interactive-card">
                    <div className="stat-card-header">
                      <div className="stat-icon-wrapper gold-tint">
                        <Scale size={20} />
                      </div>
                      <div className="header-chips-wrap">
                        <span className="stat-chip-pill">Weight Benchmark</span>
                        <button 
                          className="btn-inline-pencil"
                          onClick={() => setInlineEditingField(inlineEditingField === 'weight' ? null : 'weight')}
                          title="Inline Edit Weight"
                        >
                          <Edit3 size={12} />
                        </button>
                      </div>
                    </div>

                    {inlineEditingField === 'weight' ? (
                      <div className="inline-edit-box">
                        <label className="inline-label">Weight ({unitSystem === 'metric' ? 'kg' : 'lbs'}):</label>
                        <div className="inline-input-group">
                          <input 
                            type="number"
                            step="0.1"
                            value={editForm.weight}
                            onChange={(e) => setEditForm({ ...editForm, weight: e.target.value })}
                            className="inline-stat-input"
                            autoFocus
                          />
                          <button 
                            className="btn-inline-save"
                            onClick={handleSaveMetrics}
                            disabled={isSavingMetrics}
                            title="Save to database"
                          >
                            <Check size={14} />
                          </button>
                          <button 
                            className="btn-inline-cancel"
                            onClick={() => setInlineEditingField(null)}
                            title="Cancel"
                          >
                            <X size={14} />
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="stat-main-number" onClick={() => setInlineEditingField('weight')} title="Click to edit inline">
                        {editForm.weight} <span className="stat-unit">{unitSystem === 'metric' ? 'kg' : 'lbs'}</span>
                      </div>
                    )}

                    <div className="stat-delta-row">
                      {prevProgress && latestProgress ? (
                        (() => {
                          const prevW = unitSystem === 'metric' 
                            ? Number(prevProgress.weight_kg) 
                            : Number(kgToLbs(prevProgress.weight_kg));
                          const diff = (Number(editForm.weight) - prevW).toFixed(1);
                          const isLoss = diff <= 0;
                          return (
                            <span className={`delta-badge ${isLoss ? 'positive' : 'neutral'}`}>
                              {isLoss ? '↓' : '↑'} {Math.abs(diff)} {unitSystem === 'metric' ? 'kg' : 'lbs'} vs prev
                            </span>
                          );
                        })()
                      ) : latestProgress ? (
                        <span className="delta-badge neutral">Baseline logged</span>
                      ) : (
                        <span className="delta-badge neutral">Tap weight to record</span>
                      )}
                      <span className="stat-context-sub">
                        {latestProgress?.entry_date ? `Last: ${latestProgress.entry_date}` : 'No weigh-ins yet'}
                      </span>
                    </div>
                  </div>

                  {/* 1B: Real-time Dynamic BMI Calculator Card */}
                  <div className="stat-metric-card highlight-border-green">
                    <div className="stat-card-header">
                      <div className="stat-icon-wrapper green-tint">
                        <Calculator size={20} />
                      </div>
                      <span className="stat-chip-pill bmi-pill">Dynamic BMI Engine</span>
                    </div>

                    <div className="bmi-display-row">
                      <div className="stat-main-number" style={{ color: dynamicBMI.color }}>
                        {dynamicBMI.bmi || '26.0'}
                      </div>
                      <div className="bmi-badge-pill" style={{ borderColor: dynamicBMI.color, color: dynamicBMI.color, backgroundColor: `${dynamicBMI.color}18` }}>
                        {dynamicBMI.category}
                      </div>
                    </div>

                    {/* Visual BMI Gauge Spectrum */}
                    <div className="bmi-spectrum-bar" title={`BMI: ${dynamicBMI.bmi}`}>
                      <div 
                        className="bmi-pointer-needle"
                        style={{ 
                          left: `${Math.min(100, Math.max(0, ((dynamicBMI.bmi - 15) / (35 - 15)) * 100))}%`,
                          backgroundColor: dynamicBMI.color
                        }} 
                      />
                      <div className="bmi-seg under" title="Underweight (<18.5)" />
                      <div className="bmi-seg normal" title="Normal (18.5 - 24.9)" />
                      <div className="bmi-seg over" title="Overweight / Athletic Bulk (25 - 29.9)" />
                      <div className="bmi-seg obese" title="High Mass / Class I (30+)" />
                    </div>

                    <div className="stat-context-row">
                      <span className="stat-context-sub">
                        Height: <strong>{editForm.height} {unitSystem === 'metric' ? 'cm' : 'in'}</strong> • Target: <strong>{dynamicBMI.minHealthy}–{dynamicBMI.maxHealthy} {dynamicBMI.unitLabel}</strong>
                      </span>
                    </div>
                  </div>

                  {/* 1C: Dynamic Body Anthropometry with Inline Editing & Auto-Calculated Waist-to-Chest Ratio */}
                  <div className="stat-metric-card wide-metric-card">
                    <div className="stat-card-header">
                      <div className="stat-icon-wrapper blue-tint">
                        <Ruler size={20} />
                      </div>
                      <div className="header-chips-wrap">
                        <span className="stat-chip-pill">Body Anthropometry</span>
                        <button 
                          className={`btn-inline-pencil ${inlineEditingField === 'anthropometry' ? 'active' : ''}`}
                          onClick={() => setInlineEditingField(inlineEditingField === 'anthropometry' ? null : 'anthropometry')}
                          title={inlineEditingField === 'anthropometry' ? 'Close Inline Edit' : 'Inline Edit Measurements'}
                        >
                          <Edit3 size={12} />
                        </button>
                      </div>
                    </div>

                    {inlineEditingField === 'anthropometry' ? (
                      <div className="inline-anthro-edit-card">
                        <div className="inline-anthro-grid">
                          <div className="anthro-input-field">
                            <label>Chest ({unitSystem === 'metric' ? 'cm' : 'in'}):</label>
                            <input
                              type="number"
                              step="0.1"
                              value={editForm.chest}
                              onChange={(e) => setEditForm({ ...editForm, chest: e.target.value })}
                              className="inline-stat-input-small"
                              autoFocus
                            />
                          </div>
                          <div className="anthro-input-field">
                            <label>Waist ({unitSystem === 'metric' ? 'cm' : 'in'}):</label>
                            <input
                              type="number"
                              step="0.1"
                              value={editForm.waist}
                              onChange={(e) => setEditForm({ ...editForm, waist: e.target.value })}
                              className="inline-stat-input-small"
                            />
                          </div>
                          <div className="anthro-input-field">
                            <label>Hips ({unitSystem === 'metric' ? 'cm' : 'in'}):</label>
                            <input
                              type="number"
                              step="0.1"
                              value={editForm.hips}
                              onChange={(e) => setEditForm({ ...editForm, hips: e.target.value })}
                              className="inline-stat-input-small"
                            />
                          </div>
                          <div className="anthro-input-field">
                            <label>Arms ({unitSystem === 'metric' ? 'cm' : 'in'}):</label>
                            <input
                              type="number"
                              step="0.1"
                              value={editForm.arms}
                              onChange={(e) => setEditForm({ ...editForm, arms: e.target.value })}
                              className="inline-stat-input-small"
                            />
                          </div>
                        </div>

                        <div className="anthro-actions-row">
                          <button 
                            className="btn-inline-save-pill" 
                            onClick={handleSaveMetrics} 
                            disabled={isSavingMetrics}
                          >
                            <Check size={13} />
                            <span>{isSavingMetrics ? 'Saving...' : 'Save Measurements'}</span>
                          </button>
                          <button 
                            className="btn-inline-cancel-pill" 
                            onClick={() => setInlineEditingField(null)}
                          >
                            <X size={13} />
                            <span>Cancel</span>
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div 
                        className="measurements-inline-grid clickable-anthro-grid" 
                        onClick={() => setInlineEditingField('anthropometry')}
                        title="Click to inline edit measurements"
                      >
                        <div className="measure-tile">
                          <span className="m-label">Chest</span>
                          <strong className="m-val">{editForm.chest} {unitSystem === 'metric' ? 'cm' : 'in'}</strong>
                        </div>
                        <div className="measure-tile">
                          <span className="m-label">Waist</span>
                          <strong className="m-val">{editForm.waist} {unitSystem === 'metric' ? 'cm' : 'in'}</strong>
                        </div>
                        <div className="measure-tile">
                          <span className="m-label">Hips</span>
                          <strong className="m-val">{editForm.hips} {unitSystem === 'metric' ? 'cm' : 'in'}</strong>
                        </div>
                        <div className="measure-tile">
                          <span className="m-label">Arms</span>
                          <strong className="m-val">{editForm.arms} {unitSystem === 'metric' ? 'cm' : 'in'}</strong>
                        </div>
                      </div>
                    )}

                    {/* Auto-Calculated Waist-to-Chest V-Taper Ratio */}
                    <div className="ratio-computed-bar">
                      <div className="ratio-label-group">
                        <span className="ratio-title">Waist-to-Chest Ratio:</span>
                        <strong className="ratio-num" style={{ color: dynamicRatio.color }}>
                          {dynamicRatio.ratio || '0.756'}
                        </strong>
                      </div>
                      <span className="ratio-badge" style={{ color: dynamicRatio.color, borderColor: dynamicRatio.color, backgroundColor: `${dynamicRatio.color}15` }}>
                        {dynamicRatio.category}
                      </span>
                      <span className="ratio-taper-sub">
                        Chest is +{dynamicRatio.pctDiff}% broader than waist
                      </span>
                    </div>
                  </div>

                  {/* 1D: Total Metabolic Output with Inline Editing */}
                  <div className="stat-metric-card highlight-border-orange">
                    <div className="stat-card-header">
                      <div className="stat-icon-wrapper orange-tint">
                        <Flame size={20} />
                      </div>
                      <div className="header-chips-wrap">
                        <span className="stat-chip-pill burned">Metabolic Output</span>
                        <button 
                          className="btn-inline-pencil"
                          onClick={() => setInlineEditingField(inlineEditingField === 'calories' ? null : 'calories')}
                          title="Inline Edit Daily Calorie Target"
                        >
                          <Edit3 size={12} />
                        </button>
                      </div>
                    </div>

                    <div className="stat-main-number text-orange">
                      {totalCaloriesBurned.toLocaleString()} <span className="stat-unit">kcal</span>
                    </div>

                    {inlineEditingField === 'calories' ? (
                      <div className="inline-edit-box">
                        <label className="inline-label">Daily Budget Target (kcal):</label>
                        <div className="inline-input-group">
                          <input 
                            type="number"
                            step="50"
                            value={editForm.calories}
                            onChange={(e) => setEditForm({ ...editForm, calories: e.target.value })}
                            className="inline-stat-input"
                            autoFocus
                          />
                          <button 
                            className="btn-inline-save"
                            onClick={handleSaveMetrics}
                            disabled={isSavingMetrics}
                            title="Save target"
                          >
                            <Check size={14} />
                          </button>
                          <button 
                            className="btn-inline-cancel"
                            onClick={() => setInlineEditingField(null)}
                            title="Cancel"
                          >
                            <X size={14} />
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="stat-delta-row">
                        <span className="delta-badge flame">
                          <Flame size={12} /> {recentLogs.length > 0 ? `${recentLogs.length} sessions logged` : 'Log a workout to track'}
                        </span>
                        <span 
                          className="stat-context-sub clickable-sub" 
                          onClick={() => setInlineEditingField('calories')}
                          title="Click to inline edit calorie target"
                        >
                          Target: <strong>{editForm.calories} kcal</strong>
                        </span>
                      </div>
                    )}
                  </div>

                </div>
              </section>

            {/* ════════════════════════════════════════════════════════════════════
                TODAY'S WORKOUT PLAN & EXERCISE GUIDANCE
            ════════════════════════════════════════════════════════════════════ */}
            <section className="dashboard-section widget-workout-plan" aria-label="Today's Workout Plan">
              <div className="section-title-wrap">
                <div className="section-title-icon green">
                  <Dumbbell size={18} />
                </div>
                <div className="section-title-between">
                  <div>
                    <div className="widget-badge-tag green">TODAY'S TRAINING</div>
                    <h2 className="section-title">Workout Plan & Movement Guidance</h2>
                    <p className="section-desc">Preview exercises, switch saved routines, and inspect form diagrams or video tutorials</p>
                  </div>

                  <div className="plan-toolbar-actions">
                    {userPlans.length > 1 && (
                      <select
                        className="plan-switcher-select"
                        value={todayPlan?.id || ''}
                        onChange={(e) => handleSelectTodayPlan(e.target.value)}
                        aria-label="Select Workout Plan"
                      >
                        {userPlans.map((p) => (
                          <option key={p.id} value={p.id}>
                            {p.name}
                          </option>
                        ))}
                      </select>
                    )}
                    <button
                      type="button"
                      className="btn-manage-plans"
                      onClick={() => setActiveTab('workouts')}
                    >
                      <span>{userPlans.length > 0 ? 'Manage Plans' : 'Create Custom Plan'}</span>
                      <ChevronRight size={14} />
                    </button>
                  </div>
                </div>
              </div>

              <div className="today-workout-container">
                <div className="workout-plan-col">
                  <div className="plan-header-card">
                    <div className="plan-title-row">
                      <div>
                        <span className="plan-badge-difficulty">
                          {todayPlan?.difficulty || 'Starter Protocol'}
                        </span>
                        <h3 className="plan-heading">{todayPlan?.name || 'Upper Body Hypertrophy Protocol'}</h3>
                        <p className="plan-goal-text">{todayPlan?.goal || 'Upper chest volume, anterior shoulder strength, and tricep lockout'}</p>
                      </div>
                      <div className="plan-status-indicator">
                        {isPlanCompletedToday ? (
                          <button
                            type="button"
                            className="status-completed-pill clickable"
                            onClick={() => setActiveTab('log')}
                            title="Log another workout session"
                          >
                            <CheckCircle2 size={15} />
                            <span>Logged Today · Log Again</span>
                          </button>
                        ) : (
                          <button 
                            className="btn-start-protocol"
                            onClick={() => setActiveTab('log')}
                          >
                            <Play size={14} fill="currentColor" />
                            <span>Start Routine</span>
                          </button>
                        )}
                      </div>
                    </div>

                    <div className="plan-meta-pills">
                      <span className="meta-pill">
                        <Clock size={13} /> ~{todayMetricsSummary.estMinutes} min
                      </span>
                      <span className="meta-pill">
                        <Dumbbell size={13} /> {todayExercises.length} movements · {todayMetricsSummary.totalSets} sets
                      </span>
                      <span className="meta-pill">
                        <Flame size={13} /> ~{todayMetricsSummary.estBurn} kcal est.
                      </span>
                    </div>
                  </div>

                  <div className="exercise-list-table">
                    <div className="table-header-row">
                      <span>Exercise Name</span>
                      <span>Target Focus</span>
                      <span>Sets × Reps</span>
                      <span>Weight</span>
                      <span>Guide</span>
                    </div>

                    {todayExercises.map((ex, idx) => {
                      const isSelected = activeVideoEx?.id === ex.id;
                      return (
                        <div 
                          key={ex.id || idx} 
                          className={`exercise-row-item ${isSelected ? 'selected' : ''}`}
                          onClick={() => {
                            setActiveVideoEx(ex);
                            if (isPushUpVariant(ex)) {
                              setSelectedInfographicKey(getPushUpInfographicKey(ex));
                              setGuidanceView('anatomy');
                            } else {
                              const matched = findLibraryExercise(ex);
                              setGuidanceView(matched?.infographics?.length ? 'anatomy' : 'video');
                            }
                          }}
                        >
                          <div className="ex-name-cell">
                            <span className="ex-num">{idx + 1}</span>
                            <div className="ex-name-stack">
                              <strong>{ex.name}</strong>
                              {ex.notes && <p className="ex-micro-notes">{ex.notes}</p>}
                            </div>
                          </div>

                          <span className="ex-muscle-tag">{ex.muscle_group || 'Compound'}</span>

                          <span className="ex-sets-reps">
                            <strong>{ex.sets || 4}</strong> × <strong>{ex.reps || 8}</strong>
                          </span>

                          <span className="ex-weight-badge">
                            {ex.weight_kg
                              ? unitSystem === 'imperial'
                                ? `${kgToLbs(ex.weight_kg)} lbs`
                                : `${ex.weight_kg} kg`
                              : 'Bodyweight'}
                          </span>

                          <button 
                            type="button"
                            className={`btn-watch-video ${isSelected ? 'active' : ''}`}
                            onClick={(e) => {
                              e.stopPropagation();
                              setActiveVideoEx(ex);
                              setGuidanceView('video');
                            }}
                          >
                            <Play size={12} fill="currentColor" />
                            <span>{isSelected && guidanceView === 'video' ? 'Playing' : 'Watch'}</span>
                          </button>
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div className="workout-video-col">
                  <div className="video-card-header">
                    <div className="v-header-title">
                      <Activity size={16} className="text-amber-400" />
                      <h4>Movement Guidance</h4>
                    </div>

                    {/* View Mode Switcher: Anatomy vs Video */}
                    <div className="guidance-toggle-bar">
                      {(activeIsPushUp || activeLibraryMatch?.infographics?.length > 0) && (
                        <button 
                          type="button"
                          className={`guidance-tab-btn ${guidanceView === 'anatomy' ? 'active' : ''}`}
                          onClick={() => setGuidanceView('anatomy')}
                          title="View anatomical diagram and cues"
                        >
                          <Sparkles size={12} />
                          <span>Anatomy Guide</span>
                        </button>
                      )}
                      <button 
                        type="button"
                        className={`guidance-tab-btn ${guidanceView === 'video' ? 'active' : ''}`}
                        onClick={() => setGuidanceView('video')}
                        title="View video execution tutorial"
                      >
                        <Play size={12} fill="currentColor" />
                        <span>Video Guide</span>
                      </button>
                    </div>
                  </div>

                  <div className="active-guidance-subhead">
                    <span className="v-exercise-name">
                      {activeVideoEx?.name || 'Bodyweight Push-Up Protocol'}
                    </span>
                    <span className="v-focus-chip">
                      {activeVideoEx?.muscle_group || activeLibraryMatch?.bodyPart || 'Full Body'}
                    </span>
                  </div>

                  {guidanceView === 'anatomy' && activeIsPushUp ? (
                    <div className="protocol-anatomy-container">
                      {/* Image sub-tabs */}
                      <div className="protocol-infographic-tabs">
                        <button
                          className={`proto-tab-pill ${selectedInfographicKey === 'variations' ? 'active' : ''}`}
                          onClick={() => setSelectedInfographicKey('variations')}
                        >
                          <span>1. Mastery (4 Variations)</span>
                        </button>
                        <button
                          className={`proto-tab-pill ${selectedInfographicKey === 'anatomy' ? 'active' : ''}`}
                          onClick={() => setSelectedInfographicKey('anatomy')}
                        >
                          <span>2. Anatomy Breakdown</span>
                        </button>
                        <button
                          className={`proto-tab-pill ${selectedInfographicKey === 'elbows-in' ? 'active' : ''}`}
                          onClick={() => setSelectedInfographicKey('elbows-in')}
                        >
                          <span>3. Elbows-In (Triceps 3D)</span>
                        </button>
                        <button
                          className={`proto-tab-pill ${selectedInfographicKey === 'wide-grip' ? 'active' : ''}`}
                          onClick={() => setSelectedInfographicKey('wide-grip')}
                        >
                          <span>4. Wide-Grip (Chest 3D)</span>
                        </button>
                        <button
                          className={`proto-tab-pill ${selectedInfographicKey === 'pike' ? 'active' : ''}`}
                          onClick={() => setSelectedInfographicKey('pike')}
                        >
                          <span>5. Pike Push-Up (Shoulders 3D)</span>
                        </button>
                        <button
                          className={`proto-tab-pill ${selectedInfographicKey === 'biomechanics' ? 'active' : ''}`}
                          onClick={() => setSelectedInfographicKey('biomechanics')}
                        >
                          <span>6. Grips & Biomechanics</span>
                        </button>
                      </div>

                      {/* 1. Push-Up Mastery 4-Variation Overview */}
                      {selectedInfographicKey === 'variations' && (
                        <div className="proto-diagram-card">
                          <div 
                            className="proto-diagram-img-wrap"
                            onClick={() => setDashboardLightbox({
                              src: '/assets/aistudio/images__1__f41e5def.jpg',
                              title: 'Push-Up Mastery: 4 Variations Protocol',
                              subtitle: 'Elbows-In, Wide-Grip, Shoulder-Width & Pike Push-Up'
                            })}
                            title="Click to zoom high-resolution variations guide"
                          >
                            <img 
                              src="/assets/aistudio/images__1__f41e5def.jpg" 
                              alt="Push-Up Mastery 4 Variations"
                              className="proto-diagram-image" 
                            />
                            <div className="proto-zoom-overlay">
                              <Maximize2 size={14} />
                              <span>Click to Zoom Full Poster</span>
                            </div>
                          </div>

                          <div className="proto-diagram-analysis">
                            <div className="analysis-title-row">
                              <h6>4 Core Variations Breakdown</h6>
                              <span className="kpi-badge gold">Click Any to Inspect 3D</span>
                            </div>
                            <div className="proto-variations-micro-grid">
                              <div 
                                className="micro-var-card" 
                                onClick={() => setSelectedInfographicKey('elbows-in')}
                                title="Click to view dedicated 3D Anatomical diagram & cover"
                              >
                                <strong>1. Elbows-In:</strong>
                                <span>Focus: Triceps. Elbows pinned close to body. (Click for 3D)</span>
                              </div>
                              <div 
                                className="micro-var-card" 
                                onClick={() => setSelectedInfographicKey('wide-grip')}
                                title="Click to view dedicated 3D Anatomical diagram & cover"
                              >
                                <strong>2. Wide-Grip:</strong>
                                <span>Focus: Chest Width. 1.5x shoulder spread. (Click for 3D)</span>
                              </div>
                              <div 
                                className="micro-var-card" 
                                onClick={() => setSelectedInfographicKey('anatomy')}
                                title="Click to view anatomical muscle chart"
                              >
                                <strong>3. Shoulder-Width:</strong>
                                <span>Focus: Anterior Deltoids & general stability. (Click for 3D)</span>
                              </div>
                              <div 
                                className="micro-var-card" 
                                onClick={() => setSelectedInfographicKey('pike')}
                                title="Click to view dedicated 3D Anatomical diagram & cover"
                              >
                                <strong>4. Pike Push-Up:</strong>
                                <span>Focus: Overhead Shoulders & Upper Chest. (Click for 3D)</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* 2. Standard Anatomy Breakdown */}
                      {selectedInfographicKey === 'anatomy' && (
                        <div className="proto-diagram-card">
                          <div 
                            className="proto-diagram-img-wrap"
                            onClick={() => setDashboardLightbox({
                              src: '/assets/aistudio/images__5__692e1d52.jpg',
                              title: 'Bodyweight Push-Up: Anatomical Muscle Activation',
                              subtitle: 'Anterior Deltoid, Upper/Lower Pectoralis Major & Triceps Brachii'
                            })}
                            title="Click to zoom high-resolution anatomical chart"
                          >
                            <img 
                              src="/assets/aistudio/images__5__692e1d52.jpg" 
                              alt="Push-Up Anatomical Muscle Breakdown"
                              className="proto-diagram-image" 
                            />
                            <div className="proto-zoom-overlay">
                              <Maximize2 size={14} />
                              <span>Click to Zoom High-Res</span>
                            </div>
                          </div>

                          <div className="proto-diagram-analysis">
                            <div className="analysis-title-row">
                              <h6>Primary Muscular Targets</h6>
                              <span className="kpi-badge emerald">Medical Anatomy</span>
                            </div>
                            <div className="muscles-pills-wrap">
                              <span className="muscle-callout-pill">Anterior Deltoid (Front Shoulder)</span>
                              <span className="muscle-callout-pill">Pectoralis Major Upper (Clavicular)</span>
                              <span className="muscle-callout-pill">Pectoralis Major Lower (Sternal)</span>
                              <span className="muscle-callout-pill">Triceps Brachii (Long & Lateral Heads)</span>
                            </div>
                            <p className="proto-analysis-text">
                              Concentric force transfers through the triceps and sternal pecs, stabilizing through the serratus anterior and anterior deltoid. Maintain rigid lumbar alignment.
                            </p>
                          </div>
                        </div>
                      )}

                      {/* 3. Dedicated Elbows-In Push-Up 3D Anatomical Diagram */}
                      {selectedInfographicKey === 'elbows-in' && (
                        <div className="proto-diagram-card">
                          <div 
                            className="proto-diagram-img-wrap"
                            onClick={() => setDashboardLightbox({
                              src: '/assets/diagrams/elbows_in_pushup_diagram.jpg',
                              title: '3D Anatomical Elbows-In Push-Up Diagram',
                              subtitle: 'Start Plank vs Bottom Contracted Position — Vivid Red Highlighted Triceps Brachii'
                            })}
                            title="Click to zoom 3D Dummy anatomical diagram"
                          >
                            <img 
                              src="/assets/diagrams/elbows_in_pushup_diagram.jpg" 
                              alt="Elbows-In Push-Up 3D Anatomical Diagram"
                              className="proto-diagram-image" 
                            />
                            <div className="proto-zoom-overlay">
                              <Maximize2 size={14} />
                              <span>Click to Zoom 3D Diagram</span>
                            </div>
                          </div>

                          <div className="proto-diagram-analysis">
                            <div className="analysis-title-row">
                              <h6>Elbows-In Push-Up (Triceps Dominant)</h6>
                              <button
                                className="kpi-badge blue cursor-pointer"
                                onClick={() => setDashboardLightbox({
                                  src: '/assets/covers/elbows_in_pushup_cover.jpg',
                                  title: 'Elbows-In Push-Up: Cinematic Gym Cover',
                                  subtitle: 'Real human athlete executing strict rib-grazing tricep push-up'
                                })}
                                title="Click to view cinematic human cover"
                              >
                                View Real Human Cover
                              </button>
                            </div>
                            <div className="muscles-pills-wrap">
                              <span className="muscle-callout-pill">Triceps Brachii (All 3 Heads)</span>
                              <span className="muscle-callout-pill">Anterior Deltoid (Shoulder Stabilizer)</span>
                              <span className="muscle-callout-pill">Transverse & Rectus Abdominis</span>
                            </div>
                            <p className="proto-analysis-text">
                              <strong>Form Protocol:</strong> Hands shoulder-width beneath chest. Keep elbows pinned tight against your ribcage (pencil-tight tracking) throughout the descent. Drive through outer palms to explosive tricep lockout.
                            </p>
                          </div>
                        </div>
                      )}

                      {/* 4. Dedicated Wide-Grip Push-Up 3D Anatomical Diagram */}
                      {selectedInfographicKey === 'wide-grip' && (
                        <div className="proto-diagram-card">
                          <div 
                            className="proto-diagram-img-wrap"
                            onClick={() => setDashboardLightbox({
                              src: '/assets/diagrams/wide_grip_pushup_diagram.jpg',
                              title: '3D Anatomical Wide-Grip Push-Up Diagram',
                              subtitle: 'Wide Starting Position vs Floor-Level Deep Concentric Stretch'
                            })}
                            title="Click to zoom 3D Dummy anatomical diagram"
                          >
                            <img 
                              src="/assets/diagrams/wide_grip_pushup_diagram.jpg" 
                              alt="Wide-Grip Push-Up 3D Anatomical Diagram"
                              className="proto-diagram-image" 
                            />
                            <div className="proto-zoom-overlay">
                              <Maximize2 size={14} />
                              <span>Click to Zoom 3D Diagram</span>
                            </div>
                          </div>

                          <div className="proto-diagram-analysis">
                            <div className="analysis-title-row">
                              <h6>Wide-Grip Push-Up (Outer Chest Width)</h6>
                              <button
                                className="kpi-badge emerald cursor-pointer"
                                onClick={() => setDashboardLightbox({
                                  src: '/assets/covers/wide_grip_pushup_cover.jpg',
                                  title: 'Wide-Grip Push-Up: Cinematic Gym Cover',
                                  subtitle: 'Real human athlete with wide hand spacing and deep horizontal adduction'
                                })}
                                title="Click to view cinematic human cover"
                              >
                                View Real Human Cover
                              </button>
                            </div>
                            <div className="muscles-pills-wrap">
                              <span className="muscle-callout-pill">Outer Pectoralis Major (Sternal Head)</span>
                              <span className="muscle-callout-pill">Anterior Deltoids</span>
                              <span className="muscle-callout-pill">Serratus Anterior</span>
                            </div>
                            <p className="proto-analysis-text">
                              <strong>Form Protocol:</strong> Place hands 1.5× shoulder width with fingers turned slightly outward. Descend until chest is level with hands for an intense pectoral stretch. Squeeze the pecs inward across the floor to press up.
                            </p>
                          </div>
                        </div>
                      )}

                      {/* 5. Dedicated Pike Push-Up 3D Anatomical Diagram */}
                      {selectedInfographicKey === 'pike' && (
                        <div className="proto-diagram-card">
                          <div 
                            className="proto-diagram-img-wrap"
                            onClick={() => setDashboardLightbox({
                              src: '/assets/diagrams/pike_pushup_diagram.jpg',
                              title: '3D Anatomical Pike Push-Up Diagram',
                              subtitle: 'Inverted V Starting Position vs Diagonal Head Descent — Red Deltoids'
                            })}
                            title="Click to zoom 3D Dummy anatomical diagram"
                          >
                            <img 
                              src="/assets/diagrams/pike_pushup_diagram.jpg" 
                              alt="Pike Push-Up 3D Anatomical Diagram"
                              className="proto-diagram-image" 
                            />
                            <div className="proto-zoom-overlay">
                              <Maximize2 size={14} />
                              <span>Click to Zoom 3D Diagram</span>
                            </div>
                          </div>

                          <div className="proto-diagram-analysis">
                            <div className="analysis-title-row">
                              <h6>Pike Push-Up (Overhead Shoulder Power)</h6>
                              <button
                                className="kpi-badge gold cursor-pointer"
                                onClick={() => setDashboardLightbox({
                                  src: '/assets/covers/pike_pushup_cover.jpg',
                                  title: 'Pike Push-Up: Cinematic Gym Cover',
                                  subtitle: 'Real human athlete executing inverted V pike push-up on mat'
                                })}
                                title="Click to view cinematic human cover"
                              >
                                View Real Human Cover
                              </button>
                            </div>
                            <div className="muscles-pills-wrap">
                              <span className="muscle-callout-pill">Anterior Deltoids (Overhead Press)</span>
                              <span className="muscle-callout-pill">Clavicular Pectoralis (Upper Chest)</span>
                              <span className="muscle-callout-pill">Upper Trapezius & Triceps</span>
                            </div>
                            <p className="proto-analysis-text">
                              <strong>Form Protocol:</strong> Walk feet toward hands and hike hips high into an inverted V. Bend elbows to lower the crown of your head forward into a tripod base. Press back and up into your shoulders.
                            </p>
                          </div>
                        </div>
                      )}

                      {/* 6. Biomechanics Guide */}
                      {selectedInfographicKey === 'biomechanics' && (
                        <div className="proto-diagram-card">
                          <div 
                            className="proto-diagram-img-wrap"
                            onClick={() => setDashboardLightbox({
                              src: '/assets/aistudio/images_cb48d6e2.jpg',
                              title: 'Push-Up Biomechanics & Kinetic Grips Guide',
                              subtitle: 'Torque Vectors, Joint Angles & Muscle Focus'
                            })}
                            title="Click to zoom biomechanics guide"
                          >
                            <img 
                              src="/assets/aistudio/images_cb48d6e2.jpg" 
                              alt="Push-Up Biomechanics & Grips"
                              className="proto-diagram-image" 
                            />
                            <div className="proto-zoom-overlay">
                              <Maximize2 size={14} />
                              <span>Click to Zoom Biomechanics</span>
                            </div>
                          </div>

                          <div className="proto-diagram-analysis">
                            <div className="analysis-title-row">
                              <h6>Kinematic Angle & Grip Alignment</h6>
                              <span className="kpi-badge blue">Force Vectors</span>
                            </div>
                            <p className="proto-analysis-text">
                              Hand position dictates rotational torque at the glenohumeral joint. Tucking elbows at 45° optimizes pectoral recruitment while reducing anterior impingement risk.
                            </p>
                          </div>
                        </div>
                      )}
                    </div>
                  ) : guidanceView === 'anatomy' && activeLibraryMatch?.infographics?.length > 0 ? (
                    <div className="protocol-anatomy-container">
                      {(() => {
                        const info = activeLibraryMatch.infographics[0];
                        return (
                          <div className="proto-diagram-card">
                            <div
                              className="proto-diagram-img-wrap"
                              onClick={() =>
                                setDashboardLightbox({
                                  src: info.image,
                                  title: info.title || activeVideoEx?.name,
                                  subtitle: info.subtitle || activeLibraryMatch.targetMuscle,
                                })
                              }
                              title="Click to zoom anatomical diagram"
                            >
                              <img
                                src={info.image}
                                alt={info.title || activeVideoEx?.name}
                                className="proto-diagram-image"
                                referrerPolicy="no-referrer"
                              />
                              <div className="proto-zoom-overlay">
                                <Maximize2 size={14} />
                                <span>Click to Zoom Diagram</span>
                              </div>
                            </div>

                            <div className="proto-diagram-analysis">
                              <div className="analysis-title-row">
                                <h6>{info.title}</h6>
                                <span className="kpi-badge emerald">{info.badge || '3D Anatomy'}</span>
                              </div>
                              {info.targetMuscles?.length > 0 && (
                                <div className="muscles-pills-wrap">
                                  {info.targetMuscles.map((m, i) => (
                                    <span key={i} className="muscle-callout-pill">
                                      {m}
                                    </span>
                                  ))}
                                </div>
                              )}
                              <p className="proto-analysis-text">
                                {activeLibraryMatch.tip || info.summary}
                              </p>
                            </div>
                          </div>
                        );
                      })()}
                    </div>
                  ) : (
                    <>
                      <div className="video-embed-box">
                        <YouTubeEmbed 
                          videoId={extractYouTubeId(activeVideoEx?.youtube_url || activeLibraryMatch?.youtubeUrl)}
                          title={activeVideoEx?.name || 'FitTrack Exercise Demo'}
                        />
                      </div>

                      <div className="video-coaching-cues">
                        <h5>Form Cues & Setup:</h5>
                        <ul>
                          {activeLibraryMatch?.tip && <li>{activeLibraryMatch.tip}</li>}
                          {activeVideoEx?.notes && <li>{activeVideoEx.notes}</li>}
                          <li>Maintain a controlled 3-second eccentric lowering phase with full joint control.</li>
                          <li>Brace your core before initiating each repetition and avoid momentum swinging.</li>
                        </ul>
                      </div>
                    </>
                  )}
                </div>
              </div>
            </section>

            {/* ════════════════════════════════════════════════════════════════════
                PROGRESS TRENDS & READINESS FORECAST
            ════════════════════════════════════════════════════════════════════ */}
            <section className="dashboard-section widget-progress-chart" aria-label="Progress Trends Chart">
              <div className="section-title-wrap">
                <div className="section-title-icon blue">
                  <TrendingUp size={18} />
                </div>
                <div className="section-title-between">
                  <div>
                    <div className="widget-badge-tag blue">PROGRESS TRENDS</div>
                    <h2 className="section-title">Weight, Calories & Duration</h2>
                    <p className="section-desc">Track body weight, nutrition targets, and session duration over time</p>
                  </div>

                  <div className="chart-controls-group">
                    <div className="metric-toggle-pills">
                      <button 
                        className={`toggle-btn ${chartMetric === 'composite' ? 'active' : ''}`}
                        onClick={() => setChartMetric('composite')}
                      >
                        Composite
                      </button>
                      <button 
                        className={`toggle-btn ${chartMetric === 'weight' ? 'active' : ''}`}
                        onClick={() => setChartMetric('weight')}
                      >
                        Weight ({unitSystem === 'imperial' ? 'lbs' : 'kg'})
                      </button>
                      <button 
                        className={`toggle-btn ${chartMetric === 'calories' ? 'active' : ''}`}
                        onClick={() => setChartMetric('calories')}
                      >
                        Calories
                      </button>
                      <button 
                        className={`toggle-btn ${chartMetric === 'history' ? 'active' : ''}`}
                        onClick={() => setChartMetric('history')}
                      >
                        Duration
                      </button>
                    </div>

                    <div className="range-toggle-pills">
                      <button 
                        className={`range-btn ${chartTimeRange === '7d' ? 'active' : ''}`}
                        onClick={() => setChartTimeRange('7d')}
                      >
                        7D
                      </button>
                      <button 
                        className={`range-btn ${chartTimeRange === '30d' ? 'active' : ''}`}
                        onClick={() => setChartTimeRange('30d')}
                      >
                        30D
                      </button>
                      <button 
                        className={`range-btn ${chartTimeRange === 'all' ? 'active' : ''}`}
                        onClick={() => setChartTimeRange('all')}
                      >
                        All
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              <div className="chart-card-container">
                {filteredChartData.length === 0 ? (
                  <div className="empty-chart-state">
                    <TrendingUp size={32} className="text-blue-400" />
                    <h4>No Progress Points Recorded Yet</h4>
                    <p>Log a workout session or save a weigh-in in Body Metrics to visualize your progress curves here.</p>
                    <div className="empty-chart-actions">
                      <button type="button" className="btn-edit-metrics" onClick={() => setIsEditModalOpen(true)}>
                        <Scale size={14} />
                        <span>Log First Weigh-In</span>
                      </button>
                      <button type="button" className="btn-manage-plans" onClick={() => setActiveTab('log')}>
                        <Calendar size={14} />
                        <span>Log Workout</span>
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="recharts-chart-box">
                    <ResponsiveContainer width="100%" height={300}>
                      {chartMetric === 'weight' ? (
                        <AreaChart data={filteredChartData} margin={{ top: 15, right: 16, left: -8, bottom: 5 }}>
                          <defs>
                            <linearGradient id="weightGrad" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="0%" stopColor="#3B82F6" stopOpacity={0.45} />
                              <stop offset="100%" stopColor="#3B82F6" stopOpacity={0.0} />
                            </linearGradient>
                          </defs>
                          <CartesianGrid strokeDasharray="3 3" stroke="#1E2433" vertical={false} />
                          <XAxis dataKey="date" stroke="#64748B" tick={{ fill: '#94A3B8', fontSize: 11 }} />
                          <YAxis domain={['dataMin - 2', 'dataMax + 2']} stroke="#3B82F6" tick={{ fill: '#3B82F6', fontSize: 11 }} unit={unitSystem === 'imperial' ? 'lb' : 'kg'} />
                          <Tooltip contentStyle={{ backgroundColor: '#0B0F19', borderColor: '#3B82F6', borderRadius: '10px', color: '#F8FAFC' }} />
                          <Area type="monotone" dataKey="weightDisplay" name={`Body Weight (${unitSystem === 'imperial' ? 'lbs' : 'kg'})`} stroke="#3B82F6" strokeWidth={2.5} fill="url(#weightGrad)" dot={{ fill: '#3B82F6', r: 4 }} connectNulls />
                        </AreaChart>
                      ) : chartMetric === 'calories' ? (
                        <AreaChart data={filteredChartData} margin={{ top: 15, right: 16, left: -8, bottom: 5 }}>
                          <defs>
                            <linearGradient id="calGrad" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="0%" stopColor="#F59E0B" stopOpacity={0.45} />
                              <stop offset="100%" stopColor="#F59E0B" stopOpacity={0.0} />
                            </linearGradient>
                          </defs>
                          <CartesianGrid strokeDasharray="3 3" stroke="#1E2433" vertical={false} />
                          <XAxis dataKey="date" stroke="#64748B" tick={{ fill: '#94A3B8', fontSize: 11 }} />
                          <YAxis stroke="#F59E0B" tick={{ fill: '#F59E0B', fontSize: 11 }} unit="kcal" />
                          <Tooltip contentStyle={{ backgroundColor: '#0B0F19', borderColor: '#F59E0B', borderRadius: '10px', color: '#F8FAFC' }} />
                          <Area type="monotone" dataKey="calories" name="Target Calories (kcal)" stroke="#F59E0B" strokeWidth={2.5} fill="url(#calGrad)" dot={{ fill: '#F59E0B', r: 4 }} connectNulls />
                        </AreaChart>
                      ) : chartMetric === 'history' ? (
                        <AreaChart data={filteredChartData} margin={{ top: 15, right: 16, left: -8, bottom: 5 }}>
                          <defs>
                            <linearGradient id="durationGrad" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="0%" stopColor="#10B981" stopOpacity={0.45} />
                              <stop offset="100%" stopColor="#10B981" stopOpacity={0.0} />
                            </linearGradient>
                          </defs>
                          <CartesianGrid strokeDasharray="3 3" stroke="#1E2433" vertical={false} />
                          <XAxis dataKey="date" stroke="#64748B" tick={{ fill: '#94A3B8', fontSize: 11 }} />
                          <YAxis stroke="#10B981" tick={{ fill: '#10B981', fontSize: 11 }} unit="m" />
                          <Tooltip contentStyle={{ backgroundColor: '#0B0F19', borderColor: '#10B981', borderRadius: '10px', color: '#F8FAFC' }} />
                          <Area type="monotone" dataKey="duration" name="Workout Duration (min)" stroke="#10B981" strokeWidth={2.5} fill="url(#durationGrad)" dot={{ fill: '#10B981', r: 4 }} connectNulls />
                        </AreaChart>
                      ) : (
                        <LineChart data={filteredChartData} margin={{ top: 15, right: 16, left: -8, bottom: 5 }}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#1E2433" vertical={false} />
                          <XAxis dataKey="date" stroke="#64748B" tick={{ fill: '#94A3B8', fontSize: 11 }} />
                          <YAxis yAxisId="left" stroke="#3B82F6" tick={{ fill: '#3B82F6', fontSize: 11 }} unit={unitSystem === 'imperial' ? 'lb' : 'kg'} domain={['dataMin - 2', 'dataMax + 2']} />
                          <YAxis yAxisId="right" orientation="right" stroke="#F59E0B" tick={{ fill: '#F59E0B', fontSize: 11 }} unit="kcal" />
                          <Tooltip contentStyle={{ backgroundColor: '#0B0F19', borderColor: '#3B82F6', borderRadius: '10px', color: '#F8FAFC' }} />
                          <Legend wrapperStyle={{ paddingTop: '10px', fontSize: '0.8rem' }} />
                          <Line yAxisId="left" type="monotone" dataKey="weightDisplay" name={`Weight (${unitSystem === 'imperial' ? 'lbs' : 'kg'})`} stroke="#3B82F6" strokeWidth={3} dot={{ fill: '#3B82F6', r: 4 }} activeDot={{ r: 7 }} connectNulls />
                          <Line yAxisId="right" type="monotone" dataKey="calories" name="Calorie Budget (kcal)" stroke="#F59E0B" strokeWidth={2} strokeDasharray="4 4" dot={{ fill: '#F59E0B', r: 3 }} connectNulls />
                          <Line yAxisId="right" type="monotone" dataKey="caloriesBurned" name="Session Burn (kcal)" stroke="#10B981" strokeWidth={2} dot={{ fill: '#10B981', r: 3 }} connectNulls />
                        </LineChart>
                      )}
                    </ResponsiveContainer>
                  </div>
                )}
              </div>
            </section>

            {/* ════════════════════════════════════════════════════════════════════
                READINESS & TRAINING FORECAST (PAIRED BESIDE PROGRESS CHART)
            ════════════════════════════════════════════════════════════════════ */}
            <section className="dashboard-section widget-ai-insights" aria-label="Readiness and Training Insights">
              <div className="section-title-wrap">
                <div className="section-title-icon amber">
                  <Brain size={18} />
                </div>
                <div className="section-title-between">
                  <div>
                    <div className="widget-badge-tag amber">READINESS & FORECAST</div>
                    <h2 className="section-title">Training Insights</h2>
                    <p className="section-desc">Strength projection, energy target, and recovery readiness from your recent logs</p>
                  </div>

                  <button 
                    className="btn-rerun-inference" 
                    onClick={handleRerunTFLite}
                    disabled={isInferring}
                  >
                    <RefreshCw size={14} className={isInferring ? 'spinning' : ''} />
                    <span>{isInferring ? 'Updating...' : 'Refresh'}</span>
                  </button>
                </div>
              </div>

              <div className="ai-insights-card">
                <div className="ai-card-topbar">
                  <div className="model-spec-info">
                    <Cpu size={18} className="text-amber" />
                    <div>
                      <span className="model-title">Weekly Load Summary</span>
                      <span className="model-format">
                        {momentumStats.sessionsThisWeek} session{momentumStats.sessionsThisWeek === 1 ? '' : 's'} this week · {todayExercises.length} movements queued
                      </span>
                    </div>
                  </div>

                  <div className="ai-latency-tags">
                    <span className="tag-confidence">
                      {tfliteResult?.predictions?.recoveryStatus || 'Peak Readiness'}
                    </span>
                  </div>
                </div>

                <div className="ai-predictions-grid">
                  <div className="ai-metric-box">
                    <span className="ai-metric-label">14-Day Strength Trend</span>
                    <div className="ai-metric-val text-green">
                      {tfliteResult?.predictions?.strengthGainPct || '+3.8%'}
                    </div>
                    <p className="ai-metric-desc">Projected compound lift progression at current volume</p>
                  </div>

                  <div className="ai-metric-box">
                    <span className="ai-metric-label">Session Burn Target</span>
                    <div className="ai-metric-val text-orange">
                      {tfliteResult?.predictions?.optimalBurnKcal || 580} <span className="sub-unit">kcal</span>
                    </div>
                    <p className="ai-metric-desc">Active training output to match your nutrition budget</p>
                  </div>

                  <div className="ai-metric-box ai-metric-box-wide">
                    <div className="readiness-top-row">
                      <span className="ai-metric-label">Recovery & Readiness Score</span>
                      <span className="readiness-status-tag" style={{ color: tfliteResult?.predictions?.recoveryColor || '#10B981' }}>
                        {tfliteResult?.predictions?.recoveryStatus || 'Peak Readiness'}
                      </span>
                    </div>
                    <div className="ai-metric-val" style={{ color: tfliteResult?.predictions?.recoveryColor || '#10B981' }}>
                      {tfliteResult?.predictions?.recoveryScore || 88}<span className="sub-unit">/100</span>
                    </div>
                    <div className="recovery-meter-bar">
                      <div 
                        className="meter-fill"
                        style={{ 
                          width: `${tfliteResult?.predictions?.recoveryScore || 88}%`,
                          backgroundColor: tfliteResult?.predictions?.recoveryColor || '#10B981'
                        }}
                      />
                    </div>
                  </div>
                </div>

                <div className="ai-coaching-box">
                  <div className="coach-label">
                    <Info size={14} className="text-amber" />
                    <strong>Coach Recommendation:</strong>
                  </div>
                  <p className="coach-text">
                    {tfliteResult?.predictions?.recommendation || 
                     'High readiness. Great window for progressive overload on your primary compound lifts.'}
                  </p>
                </div>
              </div>
            </section>

            {/* ════════════════════════════════════════════════════════════════════
                RECENT ACTIVITY & PHYSIQUE CHECK-INS
            ════════════════════════════════════════════════════════════════════ */}
            <section className="dashboard-section widget-recent-activity" aria-label="Recent Activity">
              <div className="section-title-wrap">
                <div className="section-title-icon violet">
                  <Calendar size={18} />
                </div>
                <div className="section-title-between">
                  <div>
                    <div className="widget-badge-tag violet">SESSION HISTORY</div>
                    <h2 className="section-title">Recent Activity & Check-ins</h2>
                    <p className="section-desc">Filter completed sessions by date and review your physique progress gallery</p>
                  </div>

                  <div className="activity-datepicker-wrap">
                    <span className="filter-label">Filter Date:</span>
                    <input 
                      type="date"
                      className="dash-datepicker-input"
                      value={activityDateFilter}
                      onChange={(e) => setActivityDateFilter(e.target.value)}
                    />
                    {activityDateFilter && (
                      <button 
                        className="btn-clear-date"
                        onClick={() => setActivityDateFilter('')}
                        title="Clear filter"
                      >
                        <X size={14} />
                        <span>Clear</span>
                      </button>
                    )}
                    <button
                      type="button"
                      className="btn-manage-plans"
                      onClick={() => setActiveTab('log')}
                    >
                      <span>All Logs</span>
                      <ChevronRight size={14} />
                    </button>
                  </div>
                </div>
              </div>

              <div className="recent-activity-layout">
                <div className="logs-mini-table-card">
                  <div className="mini-card-head">
                    <h4>Session History Records</h4>
                    <span className="records-count">{filteredRecentLogs.length} logs shown</span>
                  </div>

                  <div className="mini-table-scroll">
                    <table className="dash-mini-table">
                      <thead>
                        <tr>
                          <th>Date</th>
                          <th>Protocol Name</th>
                          <th>Duration</th>
                          <th>Notes & Stimulus</th>
                          <th>Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredRecentLogs.length > 0 ? (
                          filteredRecentLogs.map((log) => (
                            <tr key={log.id}>
                              <td className="log-date-cell">
                                <strong>{log.log_date}</strong>
                              </td>
                              <td className="log-plan-cell">
                                {log.plan_name || 'Strength Hypertrophy'}
                              </td>
                              <td className="log-duration-cell">
                                <span className="duration-pill">
                                  <Clock size={12} /> {log.duration_min || 60}m
                                </span>
                              </td>
                              <td className="log-notes-cell">
                                <span className="notes-snippet" title={log.notes}>
                                  {log.notes || 'Strict execution, progressive overload achieved.'}
                                </span>
                              </td>
                              <td>
                                <span className="badge-verified">Completed</span>
                              </td>
                            </tr>
                          ))
                        ) : (
                          <tr>
                            <td colSpan={5} className="empty-table-cell">
                              No workout logs found for selected date filter.
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>

                <div className="progress-photos-card">
                  <div className="mini-card-head">
                    <div className="photo-head-title">
                      <Camera size={16} className="text-violet" />
                      <h4>Physique Check-in Gallery</h4>
                    </div>
                    <button 
                      className="btn-add-progress-photo"
                      onClick={() => setActiveTab('progress')}
                    >
                      <Plus size={13} />
                      <span>Upload</span>
                    </button>
                  </div>

                  <div className="photos-grid-wrapper">
                    {progressPhotos.length > 0 ? (
                      progressPhotos.map((photo) => (
                        <div 
                          key={photo.id} 
                          className="photo-thumb-item"
                          onClick={() => setSelectedPhotoModal(photo)}
                        >
                          <img 
                            src={photo.url} 
                            alt={`Progress check ${photo.date}`} 
                            className="thumb-img" 
                            loading="lazy"
                          />
                          <div className="thumb-overlay">
                            <Eye size={16} />
                            <span className="thumb-date">{photo.date}</span>
                          </div>
                          {photo.weight && (
                            <span className="thumb-weight-tag">{photo.weight} kg</span>
                          )}
                        </div>
                      ))
                    ) : (
                      <div className="empty-photos-placeholder" onClick={() => setActiveTab('progress')}>
                        <Camera size={26} className="placeholder-camera" />
                        <p>No photos uploaded yet. Snap your first check-in photo in the Metrics tab.</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {selectedPhotoModal && (
                <div className="photo-lightbox-backdrop" onClick={() => setSelectedPhotoModal(null)}>
                  <div className="photo-lightbox-modal" onClick={(e) => e.stopPropagation()}>
                    <button className="btn-close-lightbox" onClick={() => setSelectedPhotoModal(null)}>
                      <X size={18} />
                    </button>
                    <img src={selectedPhotoModal.url} alt="Progress Full" className="lightbox-full-img" />
                    <div className="lightbox-caption">
                      <h4>Physique Log — {selectedPhotoModal.date}</h4>
                      <p>Weight: <strong>{selectedPhotoModal.weight} kg</strong></p>
                      <p className="lightbox-notes">{selectedPhotoModal.notes}</p>
                    </div>
                  </div>
                </div>
              )}
            </section>

            {/* ════════════════════════════════════════════════════════════════════
                SOCIAL HIGHLIGHTS
            ════════════════════════════════════════════════════════════════════ */}
            <section className="dashboard-section widget-social-highlights" aria-label="Social Highlights">
              <div className="section-title-wrap">
                <div className="section-title-icon rose">
                  <Users size={18} />
                </div>
                <div className="section-title-between">
                  <div>
                    <div className="widget-badge-tag rose">COMMUNITY PULSE</div>
                    <h2 className="section-title">Social Highlights & Reactions</h2>
                    <p className="section-desc">Latest athlete updates, quick reactions, and discussion threads</p>
                  </div>

                  <button 
                    className="btn-view-community"
                    onClick={() => setActiveTab('social')}
                  >
                    <span>Full Community Feed</span>
                    <ChevronRight size={14} />
                  </button>
                </div>
              </div>

              {socialHighlightError && (
                <div className="sh-error-banner" role="alert">
                  <AlertCircle size={14} />
                  <span>{socialHighlightError}</span>
                  <button
                    type="button"
                    className="sh-error-close"
                    onClick={() => setSocialHighlightError('')}
                    aria-label="Dismiss"
                  >
                    <X size={13} />
                  </button>
                </div>
              )}

              <div className="social-highlights-grid">
                {socialHighlights.length === 0 ? (
                  <div className="empty-social-highlights">
                    <Users size={28} className="text-rose-400" />
                    <h4>No Community Posts Yet</h4>
                    <p>Share a workout milestone or training photo in the Community tab to inspire other athletes.</p>
                    <button type="button" className="btn-view-community" onClick={() => setActiveTab('social')}>
                      <span>Open Community Feed</span>
                      <ChevronRight size={14} />
                    </button>
                  </div>
                ) : socialHighlights.map((post) => {
                  const comments = post.comments || [];
                  const isSubmitting = !!commentSubmitting[post.id];
                  const isReactionBusy = !!quickReactionPending[post.id];
                  const isLiked = post.userReaction === 'like';
                  const isDisliked = post.userReaction === 'dislike';
                  const draft = quickCommentText[post.id] || '';
                  const postUsername = post.profiles?.username || post.username || 'athlete';
                  const postAvatarUrl = post.profiles?.avatar_url || null;

                  return (
                    <div key={post.id} className="social-highlight-card">
                      <div className="sh-card-header">
                        <div className="sh-author-row">
                          <div className="sh-avatar">
                            {postAvatarUrl ? (
                              <img src={postAvatarUrl} alt={postUsername} className="sh-avatar-img" />
                            ) : (
                              postUsername[0].toUpperCase()
                            )}
                          </div>
                          <div>
                            <span className="sh-username">@{postUsername}</span>
                            <span className="sh-time">
                              {new Date(post.created_at).toLocaleDateString()}
                            </span>
                          </div>
                        </div>

                        <div className="sh-reaction-chips">
                          <button
                            type="button"
                            className={`btn-reaction like ${isLiked ? 'active' : ''}`}
                            onClick={() => handleQuickReaction(post.id, 'like')}
                            disabled={isReactionBusy}
                            aria-pressed={isLiked}
                            title={isLiked ? 'Unlike post' : 'Like post'}
                          >
                            <Heart size={13} fill={isLiked ? 'currentColor' : 'none'} />
                            <span>{post.likes_count || 0}</span>
                          </button>

                          <button
                            type="button"
                            className={`btn-reaction dislike ${isDisliked ? 'active' : ''}`}
                            onClick={() => handleQuickReaction(post.id, 'dislike')}
                            disabled={isReactionBusy}
                            aria-pressed={isDisliked}
                            title={isDisliked ? 'Remove dislike' : 'Dislike post'}
                          >
                            <ThumbsDown size={13} />
                            <span>{post.dislikes_count || 0}</span>
                          </button>
                        </div>
                      </div>

                      <p className="sh-content">{post.content}</p>

                      {post.media_url && (
                        <div className="sh-media-wrap">
                          {post.media_type === 'video' ? (
                            <video src={post.media_url} controls className="sh-img" />
                          ) : (
                            <img src={post.media_url} alt="Shared post" className="sh-img" loading="lazy" />
                          )}
                        </div>
                      )}

                      <div className="sh-comments-box">
                        <div className="comments-head">
                          <MessageSquare size={13} className="text-gold" />
                          <span>Comments ({comments.length})</span>
                        </div>

                        <div className="comments-mini-list">
                          {comments.slice(0, 2).map((comm) => (
                            <div key={comm.id} className="comm-bubble">
                              <span className="comm-author">
                                @{comm.profiles?.username || comm.username || 'athlete'}:
                              </span>
                              <span className="comm-text">{comm.content}</span>
                            </div>
                          ))}
                        </div>

                        <form
                          className="quick-comment-row"
                          onSubmit={(e) => handleQuickComment(e, post.id)}
                        >
                          <input
                            type="text"
                            placeholder="Write a quick comment..."
                            value={draft}
                            onChange={(e) =>
                              setQuickCommentText((prev) => ({ ...prev, [post.id]: e.target.value }))
                            }
                            disabled={isSubmitting}
                          />
                          <button
                            type="submit"
                            className="btn-send-comm"
                            disabled={isSubmitting || !draft.trim()}
                          >
                            {isSubmitting ? <Loader2 size={13} className="spinning" /> : <Send size={13} />}
                          </button>
                        </form>
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>

            {/* ════════════════════════════════════════════════════════════════════
                LOCATION / GYM LOCATOR
            ════════════════════════════════════════════════════════════════════ */}
            <section className="dashboard-section widget-gym-map" aria-label="Gym Locator Map">
              <div className="section-title-wrap">
                <div className="section-title-icon gold">
                  <MapPin size={18} />
                </div>
                <div className="section-title-between">
                  <div>
                    <div className="widget-badge-tag gold">GYM LOCATOR</div>
                    <h2 className="section-title">Nearby Training Centers</h2>
                    <p className="section-desc">Live GPS tracking with nearby gyms, ratings, and directions via Google Maps</p>
                  </div>

                  <div className="map-action-pills">
                    <button
                      className="btn-full-map"
                      onClick={() => setActiveTab('map')}
                    >
                      <span>Full Map View</span>
                      <ExternalLink size={13} />
                    </button>
                  </div>
                </div>
              </div>

              <GoogleGymLocator
                mode="compact"
                onOpenFullMap={() => setActiveTab('map')}
              />
            </section>
            </div> {/* End .dashboard-widgets-grid */}

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

            {/* ════════════════════════════════════════════════════════════════════
                REDESIGNED ULTRA-LUXURY MODAL: EDIT BODY METRICS & ANTHROPOMETRY
            ════════════════════════════════════════════════════════════════════ */}
            {isEditModalOpen && (
              <div className="modal-backdrop" onClick={() => setIsEditModalOpen(false)}>
                <div className="modal-card-luxury ultra-modal" onClick={(e) => e.stopPropagation()}>
                  
                  {/* Modal Header with Integrated Unit Switcher */}
                  <div className="modal-header-refined">
                    <div className="modal-header-left">
                      <div className="modal-badge-icon">
                        <Activity size={20} className="text-gold" />
                      </div>
                      <div className="modal-title-stack">
                        <div className="modal-eyebrow">
                          <Sparkles size={13} className="text-gold" />
                          <span>BODY PROFILE CONFIGURATOR</span>
                        </div>
                        <h3>Edit Body Metrics & Anthropometry</h3>
                        <p>Synchronized anthropometric profiling & bio-mechanical index computation</p>
                      </div>
                    </div>

                    <div className="modal-header-right">
                      {/* Dynamic Unit Switcher Pill */}
                      <div className="unit-toggle-selector" role="radiogroup" aria-label="Measurement Unit System">
                        <button
                          type="button"
                          className={`unit-btn ${unitSystem === 'metric' ? 'active' : ''}`}
                          onClick={() => handleUnitToggle('metric')}
                        >
                          <span className="unit-title">Metric</span>
                          <span className="unit-sub">(kg, cm)</span>
                        </button>
                        <button
                          type="button"
                          className={`unit-btn ${unitSystem === 'imperial' ? 'active' : ''}`}
                          onClick={() => handleUnitToggle('imperial')}
                        >
                          <span className="unit-title">Imperial</span>
                          <span className="unit-sub">(lbs, in)</span>
                        </button>
                      </div>

                      <button 
                        className="btn-close-modal" 
                        onClick={() => setIsEditModalOpen(false)}
                        aria-label="Close modal"
                      >
                        <X size={18} />
                      </button>
                    </div>
                  </div>

                  <form onSubmit={handleSaveMetrics} className="modal-form-refined">
                    
                    {/* SECTION 1: PRIMARY STATURE & MASS */}
                    <div className="modal-section-card">
                      <div className="section-pill-tag">
                        <Scale size={13} />
                        <span>SECTION 01 • PRIMARY MASS & STATURE</span>
                      </div>

                      <div className="form-fields-grid-2">
                        {/* Body Weight */}
                        <div className="form-card-field">
                          <div className="field-header-row">
                            <label className="field-label">Body Weight</label>
                            <span className="field-unit-tag">{unitSystem === 'metric' ? 'Kilograms' : 'Pounds'}</span>
                          </div>
                          <div className="input-luxury-wrap">
                            <Scale size={16} className="input-icon" />
                            <input
                              type="number"
                              step="0.1"
                              value={editForm.weight}
                              onChange={(e) => setEditForm({ ...editForm, weight: e.target.value })}
                              required
                              className="input-luxury"
                              placeholder={unitSystem === 'metric' ? 'e.g. 82.5' : 'e.g. 182.0'}
                            />
                            <span className="input-adornment">{unitSystem === 'metric' ? 'kg' : 'lbs'}</span>
                          </div>
                          <div className="field-sub-calc">
                            {unitSystem === 'metric' ? (
                              <span>≈ {kgToLbs(editForm.weight)} lbs (Imperial Equivalent)</span>
                            ) : (
                              <span>≈ {lbsToKg(editForm.weight)} kg (Metric Equivalent)</span>
                            )}
                          </div>
                        </div>

                        {/* Stature / Height */}
                        <div className="form-card-field">
                          <div className="field-header-row">
                            <label className="field-label">Stature / Height</label>
                            <span className="field-unit-tag">{unitSystem === 'metric' ? 'Centimeters' : 'Inches'}</span>
                          </div>
                          <div className="input-luxury-wrap">
                            <Ruler size={16} className="input-icon" />
                            <input
                              type="number"
                              step={unitSystem === 'metric' ? '1' : '0.1'}
                              value={editForm.height}
                              onChange={(e) => setEditForm({ ...editForm, height: e.target.value })}
                              required
                              className="input-luxury"
                              placeholder={unitSystem === 'metric' ? 'e.g. 178' : 'e.g. 70'}
                            />
                            <span className="input-adornment">{unitSystem === 'metric' ? 'cm' : 'in'}</span>
                          </div>
                          <div className="field-sub-calc">
                            {unitSystem === 'metric' ? (
                              <span>≈ {formatInchesToFeet(cmToInches(editForm.height))} ({cmToInches(editForm.height)} in)</span>
                            ) : (
                              <span>≈ {inchesToCm(editForm.height)} cm ({formatInchesToFeet(editForm.height)})</span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* SECTION 2: REAL-TIME DYNAMIC COMPUTATION HUDS */}
                    <div className="modal-hud-grid">
                      {/* HUD A: Calculated BMI Engine */}
                      <div className="hud-card bmi-hud">
                        <div className="hud-header">
                          <div className="hud-title-wrap">
                            <Calculator size={16} className="text-green" />
                            <span className="hud-title">Calculated BMI Index</span>
                          </div>
                          <span 
                            className="hud-badge"
                            style={{ 
                              color: dynamicBMI.color, 
                              borderColor: dynamicBMI.color, 
                              backgroundColor: `${dynamicBMI.color}15` 
                            }}
                          >
                            {dynamicBMI.category}
                          </span>
                        </div>

                        <div className="hud-main-stat">
                          <span className="hud-digital-num" style={{ color: dynamicBMI.color }}>
                            {dynamicBMI.bmi || '—'}
                          </span>
                          <span className="hud-unit">kg/m²</span>
                        </div>

                        {/* 4-Zone Spectrum Needle Gauge */}
                        <div className="hud-spectrum-bar" title={`BMI: ${dynamicBMI.bmi}`}>
                          <div 
                            className="hud-needle"
                            style={{ 
                              left: `${Math.min(100, Math.max(0, ((dynamicBMI.bmi - 15) / (35 - 15)) * 100))}%`,
                              backgroundColor: dynamicBMI.color
                            }}
                          />
                          <div className="hud-seg under" title="Underweight (<18.5)" />
                          <div className="hud-seg normal" title="Normal (18.5 - 24.9)" />
                          <div className="hud-seg over" title="Overweight / Athletic Bulk (25 - 29.9)" />
                          <div className="hud-seg obese" title="High Mass / Class I (30+)" />
                        </div>

                        <div className="hud-footer-info">
                          <span>Target Range:</span>
                          <strong>{dynamicBMI.minHealthy} – {dynamicBMI.maxHealthy} {dynamicBMI.unitLabel}</strong>
                        </div>
                      </div>

                      {/* HUD B: Waist-to-Chest V-Taper Ratio */}
                      <div className="hud-card ratio-hud">
                        <div className="hud-header">
                          <div className="hud-title-wrap">
                            <Trophy size={16} className="text-gold" />
                            <span className="hud-title">Waist-to-Chest V-Taper</span>
                          </div>
                          <span 
                            className="hud-badge"
                            style={{ 
                              color: dynamicRatio.color, 
                              borderColor: dynamicRatio.color, 
                              backgroundColor: `${dynamicRatio.color}15` 
                            }}
                          >
                            {dynamicRatio.category}
                          </span>
                        </div>

                        <div className="hud-main-stat">
                          <span className="hud-digital-num" style={{ color: dynamicRatio.color }}>
                            {dynamicRatio.ratio || '—'}
                          </span>
                          <span className="hud-unit">Index</span>
                        </div>

                        <div className="hud-delta-gauge">
                          <div className="gauge-bar">
                            <div 
                              className="gauge-fill"
                              style={{ 
                                width: `${Math.min(100, Math.max(10, dynamicRatio.pctDiff * 2))}%`,
                                backgroundColor: dynamicRatio.color
                              }} 
                            />
                          </div>
                        </div>

                        <div className="hud-footer-info">
                          <span>Anatomical Divergence:</span>
                          <strong>Chest is +{dynamicRatio.pctDiff}% broader</strong>
                        </div>
                      </div>
                    </div>

                    {/* SECTION 3: CALIPER & CIRCUMFERENCE ANTHROPOMETRY */}
                    <div className="modal-section-card">
                      <div className="section-pill-tag">
                        <Ruler size={13} />
                        <span>SECTION 02 • CALIPER & CIRCUMFERENCE ANTHROPOMETRY</span>
                      </div>

                      <div className="form-fields-grid-4">
                        <div className="form-card-field mini">
                          <label className="field-label">Chest Girth</label>
                          <div className="input-luxury-wrap compact">
                            <input
                              type="number"
                              step="0.1"
                              value={editForm.chest}
                              onChange={(e) => setEditForm({ ...editForm, chest: e.target.value })}
                              required
                              className="input-luxury"
                            />
                            <span className="input-adornment">{unitSystem === 'metric' ? 'cm' : 'in'}</span>
                          </div>
                        </div>

                        <div className="form-card-field mini">
                          <label className="field-label">Waist Girth</label>
                          <div className="input-luxury-wrap compact">
                            <input
                              type="number"
                              step="0.1"
                              value={editForm.waist}
                              onChange={(e) => setEditForm({ ...editForm, waist: e.target.value })}
                              required
                              className="input-luxury"
                            />
                            <span className="input-adornment">{unitSystem === 'metric' ? 'cm' : 'in'}</span>
                          </div>
                        </div>

                        <div className="form-card-field mini">
                          <label className="field-label">Hips Girth</label>
                          <div className="input-luxury-wrap compact">
                            <input
                              type="number"
                              step="0.1"
                              value={editForm.hips}
                              onChange={(e) => setEditForm({ ...editForm, hips: e.target.value })}
                              required
                              className="input-luxury"
                            />
                            <span className="input-adornment">{unitSystem === 'metric' ? 'cm' : 'in'}</span>
                          </div>
                        </div>

                        <div className="form-card-field mini">
                          <label className="field-label">Arms Flexed</label>
                          <div className="input-luxury-wrap compact">
                            <input
                              type="number"
                              step="0.1"
                              value={editForm.arms}
                              onChange={(e) => setEditForm({ ...editForm, arms: e.target.value })}
                              required
                              className="input-luxury"
                            />
                            <span className="input-adornment">{unitSystem === 'metric' ? 'cm' : 'in'}</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* SECTION 4: METABOLIC NUTRITION & CALORIC TARGET */}
                    <div className="modal-section-card">
                      <div className="section-pill-tag">
                        <Flame size={13} />
                        <span>SECTION 03 • METABOLIC NUTRITION TARGET</span>
                      </div>

                      <div className="form-card-field">
                        <div className="field-header-row">
                          <label className="field-label">Daily Caloric Budget</label>
                          <span className="field-unit-tag">Basal Metabolic + Activity</span>
                        </div>
                        <div className="input-luxury-wrap">
                          <Zap size={16} className="input-icon text-orange" />
                          <input
                            type="number"
                            step="50"
                            value={editForm.calories}
                            onChange={(e) => setEditForm({ ...editForm, calories: e.target.value })}
                            required
                            className="input-luxury"
                          />
                          <span className="input-adornment">kcal / day</span>
                        </div>
                        <div className="field-sub-calc">
                          <span>Maintains lean tissue during high volume resistance training</span>
                        </div>
                      </div>
                    </div>

                    {/* FOOTER ACTIONS */}
                    <div className="modal-footer-refined">
                      <button
                        type="button"
                        className="btn-modal-cancel-luxury"
                        onClick={() => setIsEditModalOpen(false)}
                      >
                        Cancel
                      </button>

                      <button
                        type="submit"
                        className="btn-modal-save-luxury"
                        disabled={isSavingMetrics}
                      >
                        {isSavingMetrics ? (
                          <>
                            <RotateCcw size={15} className="spinning" />
                            <span>Updating Database...</span>
                          </>
                        ) : (
                          <>
                            <Check size={16} />
                            <span>Save & Auto-Calculate</span>
                          </>
                        )}
                      </button>
                    </div>

                  </form>
                </div>
              </div>
            )}

            {/* Lightbox Modal for Dashboard Infographics */}
            {dashboardLightbox && (
              <div className="lightbox-backdrop" onClick={() => setDashboardLightbox(null)}>
                <div className="lightbox-modal-content" onClick={(e) => e.stopPropagation()}>
                  <div className="lightbox-topbar">
                    <div className="lightbox-titles">
                      <span className="lightbox-badge">High-Resolution Anatomical Diagram</span>
                      <h3>{dashboardLightbox.title}</h3>
                      {dashboardLightbox.subtitle && <p>{dashboardLightbox.subtitle}</p>}
                    </div>
                    <button className="lightbox-close-btn" onClick={() => setDashboardLightbox(null)} title="Close">
                      <X size={20} />
                    </button>
                  </div>
                  <div className="lightbox-image-viewport">
                    <img src={dashboardLightbox.src} alt={dashboardLightbox.title} className="lightbox-full-img" />
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ── Other Tab Views ── */}
        {activeTab === 'workouts' && <Workouts />}
        {activeTab === 'log' && <WorkoutLog />}
        {activeTab === 'progress' && <ProgressTracker />}
        {activeTab === 'social' && <SocialFeed user={user} profile={profile} />}
        {activeTab === 'map' && <GymMap />}
      </main>
    </div>
    </GoogleMapsProvider>
  );
};

export default Dashboard;
