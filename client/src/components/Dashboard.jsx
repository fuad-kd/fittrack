import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
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
  Ruler,
  Scale,
  Brain,
  Cpu,
  ThumbsUp,
  ThumbsDown,
  MessageSquare,
  Play,
  Navigation,
  ExternalLink,
  Clock,
  Star,
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
  Zap
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
import YouTubeEmbed from './YouTubeEmbed';
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
    /youtu\.be\/([^?&]+)/,
    /youtube\.com\/watch\?v=([^&]+)/,
    /youtube\.com\/embed\/([^?&]+)/,
  ];
  for (const p of patterns) {
    const m = url.match(p);
    if (m) return m[1];
  }
  return url.length === 11 ? url : '2yjwXTZQDDI';
}

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

  /* ── 2. Today's Workout Plan State ── */
  const [todayPlan, setTodayPlan] = useState(null);
  const [todayExercises, setTodayExercises] = useState([]);
  const [activeVideoEx, setActiveVideoEx] = useState(null);
  const [isPlanCompletedToday, setIsPlanCompletedToday] = useState(false);

  /* ── 3. Progress Chart State ── */
  const [chartMetric, setChartMetric] = useState('composite'); // 'composite' | 'weight' | 'calories' | 'history'
  const [chartTimeRange, setChartTimeRange] = useState('30d'); // '7d' | '30d' | 'all'
  const [progressChartData, setProgressChartData] = useState([]);

  /* ── 4. Recent Activity State ── */
  const [recentLogs, setRecentLogs] = useState([]);
  const [activityDateFilter, setActivityDateFilter] = useState('');
  const [progressPhotos, setProgressPhotos] = useState([]);
  const [selectedPhotoModal, setSelectedPhotoModal] = useState(null);

  /* ── 5. AI Insights / TFLite State ── */
  const [tfliteResult, setTfliteResult] = useState(null);
  const [isInferring, setIsInferring] = useState(false);

  /* ── 6. Social Highlights State ── */
  const [socialHighlights, setSocialHighlights] = useState([]);
  const [quickCommentText, setQuickCommentText] = useState({});
  const [commentSubmitting, setCommentSubmitting] = useState({});

  /* ── 7. Location / Map State ── */
  const [mapQuery, setMapQuery] = useState('Equinox Fitness');
  const [locatingGps, setLocatingGps] = useState(false);
  const [gymTypeFilter, setGymTypeFilter] = useState('All');

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
        supabase.from('posts').select('*, post_comments(*)').order('created_at', { ascending: false }).limit(3),
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

      // Calculate Total Calories Burned
      let totalBurned = 0;
      logsList.forEach(log => {
        const mins = Number(log.duration_min) || 45;
        totalBurned += Math.round(mins * 8.5);
      });
      progressList.forEach(p => {
        if (p.calories) totalBurned += Math.round(Number(p.calories) * 0.25);
      });
      setTotalCaloriesBurned(totalBurned || 3420);

      // 2. Today's Workout Plan
      if (plansList.length > 0) {
        const primaryPlan = plansList[0];
        setTodayPlan(primaryPlan);
        const planExs = exercisesList.filter(e => e.plan_id === primaryPlan.id);
        setTodayExercises(planExs.length > 0 ? planExs : [
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
          },
          {
            id: 'demo_ex_3',
            name: 'Standing Overhead Military Press',
            muscle_group: 'Anterior Shoulders',
            sets: 4,
            reps: 6,
            weight_kg: 60,
            youtube_url: 'https://www.youtube.com/watch?v=QAQ64hK4SkI',
            notes: 'Strict lockout overhead with neutral cervical spine'
          }
        ]);

        if (planExs.length > 0) {
          setActiveVideoEx(planExs[0]);
        }
      }

      // Check if logged today
      const todayStr = new Date().toISOString().split('T')[0];
      const loggedToday = logsList.some(l => l.log_date === todayStr);
      setIsPlanCompletedToday(loggedToday);

      // 3. Progress Chart Data Preparation
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
      if (mergedChartData.length < 3) {
        const baseWeight = progressList[0]?.weight_kg || 82.5;
        const baseline = [
          { date: 'Day -21', weight: baseWeight + 1.2, calories: 2750, caloriesBurned: 520, duration: 55 },
          { date: 'Day -14', weight: baseWeight + 0.8, calories: 2800, caloriesBurned: 580, duration: 60 },
          { date: 'Day -7',  weight: baseWeight + 0.3, calories: 2650, caloriesBurned: 610, duration: 65 },
          { date: 'Day -2',  weight: baseWeight,       calories: 2700, caloriesBurned: 590, duration: 62 },
        ];
        setProgressChartData(baseline);
      } else {
        setProgressChartData(mergedChartData);
      }

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

      // 5. Initial TensorFlow Lite Inference
      const latestWeight = progressList[0]?.weight_kg || 82.4;
      const avgDuration = logsList.length > 0
        ? Math.round(logsList.reduce((acc, l) => acc + (Number(l.duration_min) || 50), 0) / logsList.length)
        : 60;
      
      const inferenceResult = await runTFLiteInference({
        weightKg: latestWeight,
        weeklyVolumeKg: 7800,
        avgDurationMin: avgDuration,
        caloriesLogged: progressList[0]?.calories || 2700,
        consistencyDays: logsList.length > 3 ? 5 : 3
      });
      setTfliteResult(inferenceResult);

      // 6. Social Highlights
      setSocialHighlights(postsList.map(post => ({
        ...post,
        comments: post.post_comments ? post.post_comments.sort((a, b) => new Date(b.created_at) - new Date(a.created_at)) : []
      })));

    } catch (err) {
      console.error('[FitTrack Dashboard] Error loading modules:', err);
    }
  }, [user, userHeightCm, unitSystem]);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

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
        alert('Database save failed: ' + saveError.message);
      } else {
        setLatestProgress(prev => ({
          ...(prev || {}),
          ...payload,
          id: prev?.id || `gen_${Date.now()}`
        }));

        setSaveSuccessToast('✓ Body metrics & anthropometry saved to database!');
        setTimeout(() => setSaveSuccessToast(''), 4000);
        setIsEditModalOpen(false);
        setInlineEditingField(null);

        // Re-run TFLite inference with normalized metric values
        runTFLiteInference({
          weightKg: metricWeight,
          weeklyVolumeKg: 8000,
          avgDurationMin: 60,
          caloriesLogged: Number(editForm.calories),
          consistencyDays: 5
        }).then(res => setTfliteResult(res));
      }
    } catch (err) {
      console.error('Unexpected error updating metrics:', err);
    } finally {
      setIsSavingMetrics(false);
    }
  };

  /* ── Filtered Recent Logs by Date ── */
  const filteredRecentLogs = useMemo(() => {
    if (!activityDateFilter) return recentLogs.slice(0, 6);
    return recentLogs.filter(log => log.log_date === activityDateFilter);
  }, [recentLogs, activityDateFilter]);

  /* ── Filtered Chart Data by Range ── */
  const filteredChartData = useMemo(() => {
    if (!progressChartData || progressChartData.length === 0) return [];
    if (chartTimeRange === 'all') return progressChartData;

    const days = chartTimeRange === '7d' ? 7 : 30;
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);
    const cutoffStr = cutoffDate.toISOString().split('T')[0];

    const sliced = progressChartData.filter(d => !d.date.startsWith('Day') ? d.date >= cutoffStr : true);
    return sliced.length > 0 ? sliced : progressChartData;
  }, [progressChartData, chartTimeRange]);

  /* ── Re-run TFLite Model ── */
  const handleRerunTFLite = async () => {
    setIsInferring(true);
    gsap.to('.ai-pulse-glow', { scale: 1.25, opacity: 0.8, duration: 0.3, yoyo: true, repeat: 3 });
    try {
      const metricW = unitSystem === 'imperial' ? lbsToKg(editForm.weight) : Number(editForm.weight);
      const res = await runTFLiteInference({
        weightKg: metricW || 82.4,
        weeklyVolumeKg: 8200 + Math.floor(Math.random() * 400),
        avgDurationMin: 65,
        caloriesLogged: Number(editForm.calories) || 2750,
        consistencyDays: 5
      });
      setTfliteResult(res);
    } catch (err) {
      console.warn('TFLite inference simulation error:', err);
    } finally {
      setIsInferring(false);
    }
  };

  /* ── Social Feed Quick Like ── */
  const handleQuickLike = async (postId, currentLikes) => {
    const updated = (currentLikes || 0) + 1;
    setSocialHighlights(prev => prev.map(p => p.id === postId ? { ...p, likes_count: updated } : p));
    await supabase.from('posts').update({ likes_count: updated }).eq('id', postId);
  };

  /* ── Social Feed Quick Dislike ── */
  const handleQuickDislike = async (postId, currentDislikes) => {
    const updated = (currentDislikes || 0) + 1;
    setSocialHighlights(prev => prev.map(p => p.id === postId ? { ...p, dislikes_count: updated } : p));
    await supabase.from('posts').update({ dislikes_count: updated }).eq('id', postId);
  };

  /* ── Social Feed Quick Comment ── */
  const handleQuickComment = async (postId) => {
    const text = (quickCommentText[postId] || '').trim();
    if (!text || !user) return;

    setCommentSubmitting(prev => ({ ...prev, [postId]: true }));
    const newComment = {
      post_id: postId,
      user_id: user.id,
      username: profile?.username || 'athlete',
      content: text,
      created_at: new Date().toISOString()
    };

    const { data, error } = await supabase.from('post_comments').insert(newComment);
    if (!error) {
      setSocialHighlights(prev => prev.map(p => {
        if (p.id === postId) {
          return {
            ...p,
            comments: [data || newComment, ...(p.comments || [])]
          };
        }
        return p;
      }));
      setQuickCommentText(prev => ({ ...prev, [postId]: '' }));
    }
    setCommentSubmitting(prev => ({ ...prev, [postId]: false }));
  };

  /* ── Geolocation for Gym Map ── */
  const handleFindNearMe = () => {
    if (navigator.geolocation) {
      setLocatingGps(true);
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const lat = pos.coords.latitude;
          const lng = pos.coords.longitude;
          setMapQuery(`${lat},${lng} gym fitness`);
          setLocatingGps(false);
        },
        (err) => {
          console.warn('Geolocation denied or unavailable:', err);
          setLocatingGps(false);
          setMapQuery('Gyms near me');
        }
      );
    } else {
      setMapQuery('Gyms near me');
    }
  };

  const handleFacilityFilter = (facility) => {
    setGymTypeFilter(facility);
    if (facility === 'All') setMapQuery('Gyms fitness centers');
    else setMapQuery(`${facility} Gym`);
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

  const curatedGyms = [
    { name: 'Apex Athletic Club', address: '240 Olympian Way, Suite 400', dist: '0.6 mi', rating: 4.9, type: 'Powerlifting / 24-7' },
    { name: 'Iron Sanctuary CrossFit', address: '185 Barbell Blvd', dist: '1.2 mi', rating: 4.8, type: 'Olympic & Conditioning' },
    { name: 'Equinox Luxury Fitness', address: '500 Grand Promenade', dist: '1.8 mi', rating: 4.9, type: 'Elite Health Club' }
  ];

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
            {/* ── Success Toast ── */}
            {saveSuccessToast && (
              <div className="dash-save-toast">
                <CheckCircle2 size={16} className="toast-icon" />
                <span>{saveSuccessToast}</span>
              </div>
            )}

            {/* ── Hero Welcome Banner ── */}
            <div className="dash-hero-banner">
              <div className="hero-banner-content">
                <div className="hero-eyebrow">
                  <Sparkles size={14} className="gold-sparkle" />
                  <span>SMART GYM WORKOUT TRACKER • MAIN COCKPIT</span>
                  <span className="date-pill">
                    {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}
                  </span>
                </div>
                <h1 className="hero-heading">
                  {getGreeting()}, <span className="gold-name">{profile?.username || 'Athlete'}</span>
                </h1>
                <p className="hero-subtext">
                  Live bio-metrics, dynamic BMI calculation, golden-ratio V-Taper anthropometry, video guidance, neural predictions, and geospatial gym routing.
                </p>
              </div>

              <div className="hero-banner-cta">
                <button className="hero-btn-primary" onClick={() => setIsEditModalOpen(true)}>
                  <Edit3 size={15} />
                  <span>Edit Body Metrics</span>
                </button>
                <button className="hero-btn-secondary" onClick={() => setActiveTab('workouts')}>
                  <Dumbbell size={15} />
                  <span>Active Protocols</span>
                </button>
              </div>
            </div>

            {/* ════════════════════════════════════════════════════════════════════
                FEATURE 1: QUICK STATS (DYNAMIC, EDITABLE & AUTO-CALCULATING)
                Weight, Body Measurements, Dynamic BMI & Total Calories Burned
            ════════════════════════════════════════════════════════════════════ */}
            {/* ════════════════════════════════════════════════════════════════════
                RESPONSIVE CSS GRID: 7 DEFINED DASHBOARD WIDGETS
            ════════════════════════════════════════════════════════════════════ */}
            <div className="dashboard-widgets-grid">

              {/* ────────────────────────────────────────────────────────────
                  WIDGET 1: QUICK STATS (DYNAMIC, EDITABLE & AUTO-CALCULATING)
                  Weight, Body Measurements, Dynamic BMI & Total Calories Burned
              ──────────────────────────────────────────────────────────── */}
              <section className="dashboard-section widget-quick-stats" aria-label="Widget 1: Quick Performance Stats">
                <div className="section-title-wrap">
                  <div className="section-title-icon gold">
                    <Activity size={18} />
                  </div>
                  <div className="section-title-between">
                    <div>
                      <div className="widget-badge-tag">WIDGET 01 • REAL-TIME METRICS</div>
                      <h2 className="section-title">Quick Stats (Live & Inline-Editable)</h2>
                      <p className="section-desc">Dynamic anthropometry, auto-calculating BMI index, golden-ratio V-Taper, and metabolic output</p>
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
                      ) : (
                        <span className="delta-badge positive">↓ 0.7 {unitSystem === 'metric' ? 'kg' : 'lbs'} this microcycle</span>
                      )}
                      <span className="stat-context-sub">Weigh-in: {latestProgress?.entry_date || 'Today'}</span>
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
                          🔥 Active Training Burn
                        </span>
                        <span 
                          className="stat-context-sub clickable-sub" 
                          onClick={() => setInlineEditingField('calories')}
                          title="Click to inline edit calorie target"
                        >
                          Daily Target: <strong>{editForm.calories} kcal</strong> ✏️
                        </span>
                      </div>
                    )}
                  </div>

                </div>
              </section>

            {/* ════════════════════════════════════════════════════════════════════
                WIDGET 2: TODAY'S WORKOUT PLAN & YOUTUBE EXERCISE EMBED
            ════════════════════════════════════════════════════════════════════ */}
            <section className="dashboard-section widget-workout-plan" aria-label="Widget 2: Today's Workout Plan">
              <div className="section-title-wrap">
                <div className="section-title-icon green">
                  <Dumbbell size={18} />
                </div>
                <div>
                  <div className="widget-badge-tag green">WIDGET 02 • ACTIVE PROTOCOL</div>
                  <h2 className="section-title">Today's Workout Plan & Guidance</h2>
                  <p className="section-desc">Active routine protocols with real-time video form embeds</p>
                </div>
              </div>

              <div className="today-workout-container">
                <div className="workout-plan-col">
                  <div className="plan-header-card">
                    <div className="plan-title-row">
                      <div>
                        <span className="plan-badge-difficulty">
                          {todayPlan?.difficulty || 'Advanced Hypertrophy'}
                        </span>
                        <h3 className="plan-heading">{todayPlan?.name || 'Upper Body Hypertrophy Protocol'}</h3>
                        <p className="plan-goal-text">{todayPlan?.goal || 'Upper chest volume, anterior shoulder strength, and tricep lockout'}</p>
                      </div>
                      <div className="plan-status-indicator">
                        {isPlanCompletedToday ? (
                          <div className="status-completed-pill">
                            <CheckCircle2 size={16} />
                            <span>Logged Today</span>
                          </div>
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
                        <Clock size={13} /> ~65 Minutes
                      </span>
                      <span className="meta-pill">
                        <Dumbbell size={13} /> {todayExercises.length} Movements
                      </span>
                      <span className="meta-pill">
                        <Flame size={13} /> ~580 kcal est.
                      </span>
                    </div>
                  </div>

                  <div className="exercise-list-table">
                    <div className="table-header-row">
                      <span>Exercise Name</span>
                      <span>Target Focus</span>
                      <span>Sets × Reps</span>
                      <span>Weight</span>
                      <span>Video</span>
                    </div>

                    {todayExercises.map((ex, idx) => {
                      const isSelected = activeVideoEx?.id === ex.id;
                      return (
                        <div 
                          key={ex.id || idx} 
                          className={`exercise-row-item ${isSelected ? 'selected' : ''}`}
                          onClick={() => setActiveVideoEx(ex)}
                        >
                          <div className="ex-name-cell">
                            <span className="ex-num">{idx + 1}</span>
                            <div>
                              <strong>{ex.name}</strong>
                              {ex.notes && <p className="ex-micro-notes">{ex.notes}</p>}
                            </div>
                          </div>

                          <span className="ex-muscle-tag">{ex.muscle_group || 'Compound'}</span>

                          <span className="ex-sets-reps">
                            <strong>{ex.sets || 4}</strong> sets × <strong>{ex.reps || 8}</strong>
                          </span>

                          <span className="ex-weight-badge">
                            {ex.weight_kg ? `${ex.weight_kg} kg` : 'Bodyweight'}
                          </span>

                          <button 
                            className={`btn-watch-video ${isSelected ? 'active' : ''}`}
                            onClick={(e) => {
                              e.stopPropagation();
                              setActiveVideoEx(ex);
                            }}
                          >
                            <Play size={12} fill="currentColor" />
                            <span>{isSelected ? 'Viewing' : 'Watch'}</span>
                          </button>
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div className="workout-video-col">
                  <div className="video-card-header">
                    <div className="v-header-title">
                      <Play size={16} className="text-gold" />
                      <h4>Form & Technique Reference</h4>
                    </div>
                    <span className="v-exercise-name">
                      {activeVideoEx?.name || 'Exercise Demonstration'}
                    </span>
                  </div>

                  <div className="video-embed-box">
                    <YouTubeEmbed 
                      videoId={extractYouTubeId(activeVideoEx?.youtube_url)}
                      title={activeVideoEx?.name || 'FitTrack Exercise Demo'}
                    />
                  </div>

                  <div className="video-coaching-cues">
                    <h5>Coaching Cues & Bio-Mechanics:</h5>
                    <ul>
                      <li>Maintain 3-second eccentric tempo for heightened mechanical tension.</li>
                      <li>Brace core dynamically; avoid spinal hyperextension under top working sets.</li>
                      <li>Full muscular contraction at peak concentric lockout without joint snapping.</li>
                    </ul>
                  </div>
                </div>
              </div>
            </section>

            {/* ════════════════════════════════════════════════════════════════════
                WIDGET 3: PROGRESS CHART
                Tracked Weight, Calories, and Workout History
            ════════════════════════════════════════════════════════════════════ */}
            <section className="dashboard-section widget-progress-chart" aria-label="Widget 3: Progress Chart">
              <div className="section-title-wrap">
                <div className="section-title-icon blue">
                  <TrendingUp size={18} />
                </div>
                <div className="section-title-between">
                  <div>
                    <div className="widget-badge-tag blue">WIDGET 03 • PROGRESS METRICS</div>
                    <h2 className="section-title">Progress Trends & History</h2>
                    <p className="section-desc">Integrated longitudinal visualization of body weight, caloric intake/burn, and session history</p>
                  </div>

                  <div className="chart-controls-group">
                    <div className="metric-toggle-pills">
                      <button 
                        className={`toggle-btn ${chartMetric === 'composite' ? 'active' : ''}`}
                        onClick={() => setChartMetric('composite')}
                      >
                        Composite View
                      </button>
                      <button 
                        className={`toggle-btn ${chartMetric === 'weight' ? 'active' : ''}`}
                        onClick={() => setChartMetric('weight')}
                      >
                        Body Weight (kg)
                      </button>
                      <button 
                        className={`toggle-btn ${chartMetric === 'calories' ? 'active' : ''}`}
                        onClick={() => setChartMetric('calories')}
                      >
                        Calories (kcal)
                      </button>
                      <button 
                        className={`toggle-btn ${chartMetric === 'history' ? 'active' : ''}`}
                        onClick={() => setChartMetric('history')}
                      >
                        Workout Duration
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
                <div className="recharts-chart-box">
                  <ResponsiveContainer width="100%" height={320}>
                    {chartMetric === 'weight' ? (
                      <AreaChart data={filteredChartData} margin={{ top: 15, right: 20, left: -10, bottom: 5 }}>
                        <defs>
                          <linearGradient id="weightGrad" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="#3B82F6" stopOpacity={0.45} />
                            <stop offset="100%" stopColor="#3B82F6" stopOpacity={0.0} />
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="#1E2433" vertical={false} />
                        <XAxis dataKey="date" stroke="#64748B" tick={{ fill: '#94A3B8', fontSize: 11 }} />
                        <YAxis domain={['dataMin - 1', 'dataMax + 1']} stroke="#3B82F6" tick={{ fill: '#3B82F6', fontSize: 11 }} unit="kg" />
                        <Tooltip contentStyle={{ backgroundColor: '#0B0F19', borderColor: '#3B82F6', borderRadius: '10px', color: '#F8FAFC' }} />
                        <Area type="monotone" dataKey="weight" name="Body Weight (kg)" stroke="#3B82F6" strokeWidth={2.5} fill="url(#weightGrad)" dot={{ fill: '#3B82F6', r: 4 }} />
                      </AreaChart>
                    ) : chartMetric === 'calories' ? (
                      <AreaChart data={filteredChartData} margin={{ top: 15, right: 20, left: -10, bottom: 5 }}>
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
                        <Area type="monotone" dataKey="calories" name="Target Calories (kcal)" stroke="#F59E0B" strokeWidth={2.5} fill="url(#calGrad)" dot={{ fill: '#F59E0B', r: 4 }} />
                      </AreaChart>
                    ) : chartMetric === 'history' ? (
                      <AreaChart data={filteredChartData} margin={{ top: 15, right: 20, left: -10, bottom: 5 }}>
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
                        <Area type="monotone" dataKey="duration" name="Workout Duration (min)" stroke="#10B981" strokeWidth={2.5} fill="url(#durationGrad)" dot={{ fill: '#10B981', r: 4 }} />
                      </AreaChart>
                    ) : (
                      <LineChart data={filteredChartData} margin={{ top: 15, right: 25, left: -10, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#1E2433" vertical={false} />
                        <XAxis dataKey="date" stroke="#64748B" tick={{ fill: '#94A3B8', fontSize: 11 }} />
                        <YAxis yAxisId="left" stroke="#3B82F6" tick={{ fill: '#3B82F6', fontSize: 11 }} unit="kg" domain={['dataMin - 1', 'dataMax + 1']} />
                        <YAxis yAxisId="right" orientation="right" stroke="#F59E0B" tick={{ fill: '#F59E0B', fontSize: 11 }} unit="kcal" />
                        <Tooltip contentStyle={{ backgroundColor: '#0B0F19', borderColor: '#3B82F6', borderRadius: '10px', color: '#F8FAFC' }} />
                        <Legend wrapperStyle={{ paddingTop: '10px', fontSize: '0.82rem' }} />
                        <Line yAxisId="left" type="monotone" dataKey="weight" name="Body Weight (kg)" stroke="#3B82F6" strokeWidth={3} dot={{ fill: '#3B82F6', r: 4 }} activeDot={{ r: 7 }} />
                        <Line yAxisId="right" type="monotone" dataKey="calories" name="Tracked Calories (kcal)" stroke="#F59E0B" strokeWidth={2} strokeDasharray="4 4" dot={{ fill: '#F59E0B', r: 3 }} />
                        <Line yAxisId="right" type="monotone" dataKey="caloriesBurned" name="Burned Workload (kcal)" stroke="#10B981" strokeWidth={2} dot={{ fill: '#10B981', r: 3 }} />
                      </LineChart>
                    )}
                  </ResponsiveContainer>
                </div>
              </div>
            </section>

            {/* ════════════════════════════════════════════════════════════════════
                WIDGET 4: RECENT ACTIVITY
                Mini-table with Datepicker & Progress Photo Thumbnails
            ════════════════════════════════════════════════════════════════════ */}
            <section className="dashboard-section widget-recent-activity" aria-label="Widget 4: Recent Activity">
              <div className="section-title-wrap">
                <div className="section-title-icon violet">
                  <Calendar size={18} />
                </div>
                <div className="section-title-between">
                  <div>
                    <div className="widget-badge-tag violet">WIDGET 04 • SESSION HISTORY</div>
                    <h2 className="section-title">Recent Activity & Photo Logs</h2>
                    <p className="section-desc">Chronological workout logs with interactive datepicker filter and physique photo uploads</p>
                  </div>

                  <div className="activity-datepicker-wrap">
                    <span className="filter-label">Filter by Date:</span>
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
                  </div>
                </div>
              </div>

              <div className="recent-activity-layout">
                <div className="logs-mini-table-card">
                  <div className="mini-card-head">
                    <h4>Session History Records</h4>
                    <span className="records-count">{filteredRecentLogs.length} logs displayed</span>
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
                WIDGET 5: AI INSIGHTS
                TensorFlow Lite Prediction
            ════════════════════════════════════════════════════════════════════ */}
            <section className="dashboard-section widget-ai-insights" aria-label="Widget 5: AI Insights">
              <div className="section-title-wrap">
                <div className="section-title-icon amber">
                  <Brain size={18} />
                </div>
                <div className="section-title-between">
                  <div>
                    <div className="widget-badge-tag amber">WIDGET 05 • NEURAL PREDICTION</div>
                    <h2 className="section-title">AI Insights (TensorFlow Lite)</h2>
                    <p className="section-desc">Client-side neural network inference predicting 1RM gains, calorie burn targets, and CNS readiness</p>
                  </div>

                  <button 
                    className="btn-rerun-inference" 
                    onClick={handleRerunTFLite}
                    disabled={isInferring}
                  >
                    <RefreshCw size={14} className={isInferring ? 'spinning' : ''} />
                    <span>{isInferring ? 'Inferring...' : 'Re-run Model'}</span>
                  </button>
                </div>
              </div>

              <div className="ai-insights-card">
                <div className="ai-card-topbar">
                  <div className="model-spec-info">
                    <div className="ai-pulse-glow" />
                    <Cpu size={18} className="text-amber" />
                    <div>
                      <span className="model-title">Model: {tfliteResult?.modelName || 'fittrack-hypertrophy-v2.tflite'}</span>
                      <span className="model-format">{tfliteResult?.format || 'TensorFlow Lite (Float32 Quantized)'}</span>
                    </div>
                  </div>

                  <div className="ai-latency-tags">
                    <span className="tag-latency">⚡ Latency: {tfliteResult?.latencyMs || '14.2'} ms</span>
                    <span className="tag-confidence">🎯 Confidence: {tfliteResult?.confidenceScore || 94.6}%</span>
                  </div>
                </div>

                <div className="ai-predictions-grid">
                  <div className="ai-metric-box">
                    <span className="ai-metric-label">Projected 1RM Gain</span>
                    <div className="ai-metric-val text-green">
                      {tfliteResult?.predictions?.strengthGainPct || '+3.8%'}
                    </div>
                    <p className="ai-metric-desc">Forecasted compound strength jump over next 14-day training block</p>
                  </div>

                  <div className="ai-metric-box">
                    <span className="ai-metric-label">Optimal Daily Burn</span>
                    <div className="ai-metric-val text-orange">
                      {tfliteResult?.predictions?.optimalBurnKcal || 650} <span className="sub-unit">kcal</span>
                    </div>
                    <p className="ai-metric-desc">Recommended active metabolic deficit/surplus to preserve lean muscle</p>
                  </div>

                  <div className="ai-metric-box">
                    <span className="ai-metric-label">CNS Readiness Score</span>
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
                    <span className="readiness-status-tag">
                      {tfliteResult?.predictions?.recoveryStatus || 'Peak Readiness'}
                    </span>
                  </div>
                </div>

                <div className="ai-coaching-box">
                  <div className="coach-label">
                    <Info size={14} className="text-amber" />
                    <strong>Neural Recommendation:</strong>
                  </div>
                  <p className="coach-text">
                    {tfliteResult?.predictions?.recommendation || 
                     'High CNS preparedness. Optimal window for heavy progressive overload or maximum velocity singles.'}
                  </p>
                </div>
              </div>
            </section>

            {/* ════════════════════════════════════════════════════════════════════
                WIDGET 6: SOCIAL HIGHLIGHTS
                Recent Activity, Like/Dislike Counts & Real-time Comments
            ════════════════════════════════════════════════════════════════════ */}
            <section className="dashboard-section widget-social-highlights" aria-label="Widget 6: Social Highlights">
              <div className="section-title-wrap">
                <div className="section-title-icon rose">
                  <Users size={18} />
                </div>
                <div className="section-title-between">
                  <div>
                    <div className="widget-badge-tag rose">WIDGET 06 • COMMUNITY PULSE</div>
                    <h2 className="section-title">Social Highlights & Reactions</h2>
                    <p className="section-desc">Community pulse, real-time post reactions, and member discussion threads</p>
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

              <div className="social-highlights-grid">
                {socialHighlights.map((post) => {
                  const comments = post.comments || [];
                  const isSubmitting = commentSubmitting[post.id];

                  return (
                    <div key={post.id} className="social-highlight-card">
                      <div className="sh-card-header">
                        <div className="sh-author-row">
                          <div className="sh-avatar">
                            {(post.username || 'U')[0].toUpperCase()}
                          </div>
                          <div>
                            <span className="sh-username">@{post.username || 'athlete'}</span>
                            <span className="sh-time">
                              {new Date(post.created_at).toLocaleDateString()}
                            </span>
                          </div>
                        </div>

                        <div className="sh-reaction-chips">
                          <button 
                            className="btn-reaction like"
                            onClick={() => handleQuickLike(post.id, post.likes_count)}
                            title="Like post"
                          >
                            <ThumbsUp size={13} />
                            <span>{post.likes_count || 0}</span>
                          </button>

                          <button 
                            className="btn-reaction dislike"
                            onClick={() => handleQuickDislike(post.id, post.dislikes_count)}
                            title="Dislike post"
                          >
                            <ThumbsDown size={13} />
                            <span>{post.dislikes_count || 0}</span>
                          </button>
                        </div>
                      </div>

                      <p className="sh-content">{post.content}</p>

                      {post.media_url && (
                        <div className="sh-media-wrap">
                          <img src={post.media_url} alt="Shared post" className="sh-img" loading="lazy" />
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
                              <span className="comm-author">@{comm.username}:</span>
                              <span className="comm-text">{comm.content}</span>
                            </div>
                          ))}
                        </div>

                        <div className="quick-comment-row">
                          <input 
                            type="text"
                            placeholder="Write a quick comment..."
                            value={quickCommentText[post.id] || ''}
                            onChange={(e) => setQuickCommentText({ ...quickCommentText, [post.id]: e.target.value })}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') handleQuickComment(post.id);
                            }}
                          />
                          <button 
                            className="btn-send-comm"
                            onClick={() => handleQuickComment(post.id)}
                            disabled={isSubmitting || !(quickCommentText[post.id] || '').trim()}
                          >
                            <Send size={13} />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>

            {/* ════════════════════════════════════════════════════════════════════
                WIDGET 7: LOCATION / MAP
                Google Maps Embed & Nearest Gym Locator
            ════════════════════════════════════════════════════════════════════ */}
            <section className="dashboard-section widget-gym-map" aria-label="Widget 7: Gym Locator Map">
              <div className="section-title-wrap">
                <div className="section-title-icon gold">
                  <MapPin size={18} />
                </div>
                <div className="section-title-between">
                  <div>
                    <div className="widget-badge-tag gold">WIDGET 07 • GEOSPATIAL MAP</div>
                    <h2 className="section-title">Location / Gym Locator</h2>
                    <p className="section-desc">Interactive Google Maps iframe showcasing nearest training centers, Olympic boxes, and user coordinates</p>
                  </div>

                  <div className="map-action-pills">
                    <button 
                      className="btn-locate-me"
                      onClick={handleFindNearMe}
                      disabled={locatingGps}
                    >
                      <Navigation size={14} className={locatingGps ? 'spinning' : ''} />
                      <span>{locatingGps ? 'Locating...' : 'Locate Nearest'}</span>
                    </button>
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

              <div className="dashboard-map-layout">
                <div className="map-embed-wrapper">
                  <div className="map-embed-header">
                    <div className="traffic-lights">
                      <span className="dot red" />
                      <span className="dot yellow" />
                      <span className="dot green" />
                    </div>
                    <span className="active-map-pin">
                      <MapPin size={13} className="text-gold" />
                      <span>Location: <strong>{mapQuery}</strong></span>
                    </span>
                  </div>

                  <iframe 
                    title="FitTrack Gym Locator Embed"
                    className="dashboard-map-iframe"
                    src={`https://maps.google.com/maps?q=${encodeURIComponent(mapQuery)}&t=&z=14&ie=UTF8&iwloc=&output=embed`}
                    loading="lazy"
                    allowFullScreen
                  />

                  <div className="facility-chips-dock">
                    <span className="dock-label">Filter:</span>
                    {['All', 'Equinox', 'CrossFit Box', 'Powerlifting', '24/7 Gym'].map((fac) => (
                      <button 
                        key={fac}
                        className={`chip-filter-btn ${gymTypeFilter === fac ? 'active' : ''}`}
                        onClick={() => handleFacilityFilter(fac)}
                      >
                        {fac}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="nearest-facilities-card">
                  <div className="facilities-head">
                    <Star size={16} className="text-gold" />
                    <h4>Nearest Verified Facilities</h4>
                  </div>

                  <div className="facilities-list">
                    {curatedGyms.map((gym, idx) => (
                      <div key={idx} className="facility-item">
                        <div className="facility-top">
                          <strong className="gym-name">{gym.name}</strong>
                          <span className="rating-tag">★ {gym.rating}</span>
                        </div>
                        <p className="gym-addr">{gym.address}</p>
                        <div className="facility-bottom">
                          <span className="dist-tag">{gym.dist} away</span>
                          <span className="type-tag">{gym.type}</span>
                          <a 
                            href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(gym.name + ' ' + gym.address)}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="btn-directions-link"
                          >
                            <span>Directions</span>
                            <ExternalLink size={12} />
                          </a>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
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
