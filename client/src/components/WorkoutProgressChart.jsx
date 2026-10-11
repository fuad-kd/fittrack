import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import {
  ResponsiveContainer,
  ComposedChart,
  LineChart,
  Line,
  BarChart,
  Bar,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ReferenceLine
} from 'recharts';
import {
  TrendingUp,
  Dumbbell,
  Layers,
  Award,
  Zap,
  Plus,
  Trash2,
  Calendar,
  Sparkles,
  ChevronRight,
  Filter,
  CheckCircle2,
  X,
  PieChart as PieIcon,
  Flame,
  Activity
} from 'lucide-react';
import './WorkoutProgressChart.css';

// Custom Tooltip component for Recharts
const CustomChartTooltip = ({ active, payload, label }) => {
  if (!active || !payload || !payload.length) return null;

  const data = payload[0]?.payload || {};

  return (
    <div className="recharts-custom-tooltip">
      <div className="tooltip-header">
        <Calendar size={13} className="text-gold" />
        <span className="tooltip-date">{label}</span>
      </div>
      <div className="tooltip-body">
        {payload.map((entry, index) => {
          const isWeight = entry.dataKey === 'weight_kg';
          const isVolume = entry.dataKey === 'volume_kg';
          const isOneRm = entry.dataKey === 'estimated_1rm';

          let labelText = entry.name;
          let unit = 'kg';

          if (isWeight) labelText = 'Working Weight';
          if (isVolume) labelText = 'Session Volume';
          if (isOneRm) labelText = 'Projected 1RM';

          return (
            <div key={`item-${index}`} className="tooltip-metric-row">
              <span className="tooltip-dot" style={{ backgroundColor: entry.color }} />
              <span className="tooltip-label">{labelText}:</span>
              <strong className="tooltip-val" style={{ color: entry.color }}>
                {entry.value != null ? Number(entry.value).toLocaleString() : '—'} {unit}
              </strong>
            </div>
          );
        })}

        {data.sets && data.reps && (
          <div className="tooltip-sub-info">
            <span>Protocol: <strong>{data.sets} sets × {data.reps} reps</strong></span>
            {data.rpe ? <span className="rpe-badge">RPE {data.rpe}</span> : null}
          </div>
        )}

        {data.notes && (
          <p className="tooltip-notes">"{data.notes}"</p>
        )}
      </div>
    </div>
  );
};

export default function WorkoutProgressChart({ initialExercise = null }) {
  const { user } = useAuth();

  const [logs, setLogs] = useState([]);
  const [plans, setPlans] = useState([]);
  const [exercisesList, setExercisesList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedExercise, setSelectedExercise] = useState(initialExercise || 'Incline Barbell Bench Press');
  const [chartMode, setChartMode] = useState('dual'); // 'weight' | 'volume' | '1rm' | 'dual'
  const [timeRange, setTimeRange] = useState('all'); // '30d' | '90d' | 'all'
  const [showLogModal, setShowLogModal] = useState(false);
  const [feedback, setFeedback] = useState('');

  // Form state for logging a new session performance entry
  const [newEntry, setNewEntry] = useState({
    exercise_name: '',
    muscle_group: 'Upper Chest',
    log_date: new Date().toISOString().split('T')[0],
    weight_kg: '',
    sets: '4',
    reps: '8',
    rpe: '8.5',
    notes: '',
  });
  const [formErrors, setFormErrors] = useState({});
  const [saving, setSaving] = useState(false);

  /* ── 1. Fetch exercise logs & user's workout plans ── */
  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [logsRes, plansRes, exercisesRes] = await Promise.all([
        supabase
          .from('exercise_logs')
          .select('*')
          .eq('user_id', user.id)
          .order('log_date', { ascending: true }),
        supabase
          .from('workout_plans')
          .select('id, name')
          .eq('user_id', user.id),
        supabase
          .from('exercises')
          .select('name, muscle_group')
      ]);

      const logData = logsRes.data || [];
      setLogs(logData);
      setPlans(plansRes.data || []);

      // Extract unique exercise names
      const knownExercises = new Set([
        'Incline Barbell Bench Press',
        'High Bar Olympic Squat',
        'Weighted Chest Dips',
        'Standing Overhead Military Press',
        'Barbell Deadlift',
        'Cable Lateral Raises'
      ]);

      logData.forEach(l => { if (l.exercise_name) knownExercises.add(l.exercise_name); });
      (exercisesRes.data || []).forEach(e => { if (e.name) knownExercises.add(e.name); });

      const sortedList = Array.from(knownExercises);
      setExercisesList(sortedList);

      if (!initialExercise && sortedList.length > 0 && !sortedList.includes(selectedExercise)) {
        setSelectedExercise(sortedList[0]);
      }
    } catch (err) {
      console.error('Error fetching progress data:', err);
    } finally {
      setLoading(false);
    }
  }, [user.id, initialExercise, selectedExercise]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // When selected exercise changes, prepopulate form exercise name
  useEffect(() => {
    setNewEntry(prev => ({
      ...prev,
      exercise_name: selectedExercise
    }));
  }, [selectedExercise]);

  /* ── 2. Filter & format chart data for selected exercise ── */
  const exerciseData = useMemo(() => {
    if (!selectedExercise) return [];

    let filtered = logs.filter(
      l => l.exercise_name?.toLowerCase() === selectedExercise.toLowerCase()
    );

    // Apply time range filter
    if (timeRange === '30d') {
      const cutOff = new Date(Date.now() - 30 * 86400000).toISOString().split('T')[0];
      filtered = filtered.filter(l => l.log_date >= cutOff);
    } else if (timeRange === '90d') {
      const cutOff = new Date(Date.now() - 90 * 86400000).toISOString().split('T')[0];
      filtered = filtered.filter(l => l.log_date >= cutOff);
    }

    // Sort chronologically
    filtered.sort((a, b) => new Date(a.log_date) - new Date(b.log_date));

    // Map to recharts format with computed fields
    return filtered.map(item => {
      const weight = Number(item.weight_kg) || 0;
      const sets = Number(item.sets) || 1;
      const reps = Number(item.reps) || 1;
      const vol = item.volume_kg != null ? Number(item.volume_kg) : weight * sets * reps;
      // Epley formula for 1RM: weight * (1 + reps / 30)
      const oneRm = reps > 1 ? Math.round(weight * (1 + reps / 30) * 10) / 10 : weight;

      // Format date for label
      let displayDate = item.log_date;
      try {
        const [y, m, d] = item.log_date.split('-');
        displayDate = new Date(Number(y), Number(m) - 1, Number(d)).toLocaleDateString('en-US', {
          month: 'short',
          day: 'numeric'
        });
      } catch {
        // fallback
      }

      return {
        ...item,
        dateLabel: displayDate,
        weight_kg: weight,
        volume_kg: vol,
        estimated_1rm: oneRm,
        sets,
        reps,
      };
    });
  }, [logs, selectedExercise, timeRange]);

  /* ── 3. KPI Statistics for Selected Exercise ── */
  const kpis = useMemo(() => {
    if (exerciseData.length === 0) {
      return {
        prWeight: 0,
        maxVolume: 0,
        currentWeight: 0,
        current1RM: 0,
        totalSessions: 0,
        growthPercent: 0
      };
    }

    const prWeight = Math.max(...exerciseData.map(d => d.weight_kg));
    const maxVolume = Math.max(...exerciseData.map(d => d.volume_kg));
    const latest = exerciseData[exerciseData.length - 1];
    const earliest = exerciseData[0];

    const growth = earliest.weight_kg > 0
      ? Math.round(((latest.weight_kg - earliest.weight_kg) / earliest.weight_kg) * 100)
      : 0;

    return {
      prWeight,
      maxVolume,
      currentWeight: latest.weight_kg,
      current1RM: latest.estimated_1rm,
      totalSessions: exerciseData.length,
      growthPercent: growth
    };
  }, [exerciseData]);

  /* ── 4. Volume by Muscle Group across entire log history ── */
  const muscleGroupDistribution = useMemo(() => {
    const map = {};
    logs.forEach(l => {
      const group = l.muscle_group || 'Other';
      const vol = Number(l.volume_kg) || ((Number(l.weight_kg) || 0) * (Number(l.sets) || 1) * (Number(l.reps) || 1));
      map[group] = (map[group] || 0) + vol;
    });

    return Object.entries(map).map(([name, volume]) => ({
      name,
      volume: Math.round(volume)
    })).sort((a, b) => b.volume - a.volume);
  }, [logs]);

  /* ── 5. Form submission to log a new performance point ── */
  const handleLogSubmit = async (e) => {
    e.preventDefault();
    const errors = {};

    if (!newEntry.exercise_name?.trim()) errors.exercise_name = 'Exercise name required.';
    if (!newEntry.log_date) errors.log_date = 'Date required.';
    const w = Number(newEntry.weight_kg);
    if (!newEntry.weight_kg || isNaN(w) || w <= 0) errors.weight_kg = 'Enter a valid weight (> 0).';
    const s = Number(newEntry.sets);
    if (!newEntry.sets || isNaN(s) || s < 1) errors.sets = 'Sets must be at least 1.';
    const r = Number(newEntry.reps);
    if (!newEntry.reps || isNaN(r) || r < 1) errors.reps = 'Reps must be at least 1.';

    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }

    setSaving(true);
    const weightNum = Number(newEntry.weight_kg);
    const setsNum = Number(newEntry.sets);
    const repsNum = Number(newEntry.reps);
    const totalVolume = Math.round(weightNum * setsNum * repsNum);

    const { error } = await supabase.from('exercise_logs').insert({
      user_id: user.id,
      exercise_name: newEntry.exercise_name.trim(),
      muscle_group: newEntry.muscle_group,
      log_date: newEntry.log_date,
      weight_kg: weightNum,
      sets: setsNum,
      reps: repsNum,
      volume_kg: totalVolume,
      rpe: newEntry.rpe ? Number(newEntry.rpe) : null,
      notes: newEntry.notes.trim() || null
    });

    setSaving(false);

    if (error) {
      setFeedback('Failed to log exercise session. Try again.');
    } else {
      setFeedback(`Logged ${newEntry.exercise_name}: ${weightNum}kg (${totalVolume}kg volume)!`);
      setSelectedExercise(newEntry.exercise_name.trim());
      setShowLogModal(false);
      setNewEntry(prev => ({
        ...prev,
        weight_kg: '',
        notes: ''
      }));
      setFormErrors({});
      fetchData();
      setTimeout(() => setFeedback(''), 4000);
    }
  };

  /* ── 6. Delete an entry ── */
  const handleDeleteEntry = async (id) => {
    if (!window.confirm('Delete this performance record?')) return;
    await supabase.from('exercise_logs').delete().eq('id', id);
    fetchData();
  };

  return (
    <div className="workout-progress-chart-container">
      {/* ── Top Header Bar ── */}
      <div className="wpc-header">
        <div className="wpc-header-left">
          <div className="wpc-badge-icon">
            <TrendingUp size={22} className="text-gold" />
          </div>
          <div>
            <h2>Workout Volume & Weight Progression</h2>
            <p>Interactive Recharts visualization of overload metrics, personal bests, and total tonnage.</p>
          </div>
        </div>

        <button
          className="btn-wpc-primary"
          onClick={() => { setShowLogModal(s => !s); setFormErrors({}); }}
        >
          {showLogModal ? <X size={16} /> : <Plus size={16} />}
          <span>{showLogModal ? 'Cancel' : 'Log Exercise Set'}</span>
        </button>
      </div>

      {feedback && (
        <div className="wpc-feedback-banner">
          <CheckCircle2 size={16} />
          <span>{feedback}</span>
        </div>
      )}

      {/* ── Exercise Quick Selector & Filters ── */}
      <div className="wpc-controls-bar">
        <div className="wpc-exercise-selector-wrap">
          <label className="wpc-filter-label">
            <Dumbbell size={14} />
            <span>Select Exercise:</span>
          </label>
          <select
            className="wpc-select"
            value={selectedExercise}
            onChange={e => setSelectedExercise(e.target.value)}
          >
            {exercisesList.map(name => (
              <option key={name} value={name}>{name}</option>
            ))}
          </select>
        </div>

        {/* Metric Mode Switcher */}
        <div className="wpc-mode-pills">
          <button
            className={`wpc-pill ${chartMode === 'dual' ? 'active' : ''}`}
            onClick={() => setChartMode('dual')}
            title="Combined Weight & Volume"
          >
            <Activity size={14} />
            <span>Dual Axis (Weight + Volume)</span>
          </button>
          <button
            className={`wpc-pill ${chartMode === 'weight' ? 'active' : ''}`}
            onClick={() => setChartMode('weight')}
          >
            <Award size={14} />
            <span>Weight (kg)</span>
          </button>
          <button
            className={`wpc-pill ${chartMode === 'volume' ? 'active' : ''}`}
            onClick={() => setChartMode('volume')}
          >
            <Layers size={14} />
            <span>Volume (kg)</span>
          </button>
          <button
            className={`wpc-pill ${chartMode === '1rm' ? 'active' : ''}`}
            onClick={() => setChartMode('1rm')}
          >
            <Zap size={14} />
            <span>Estimated 1RM</span>
          </button>
        </div>

        {/* Timeframe Selector */}
        <div className="wpc-timeframe-pills">
          <button
            className={`wpc-time-btn ${timeRange === '30d' ? 'active' : ''}`}
            onClick={() => setTimeRange('30d')}
          >
            30D
          </button>
          <button
            className={`wpc-time-btn ${timeRange === '90d' ? 'active' : ''}`}
            onClick={() => setTimeRange('90d')}
          >
            90D
          </button>
          <button
            className={`wpc-time-btn ${timeRange === 'all' ? 'active' : ''}`}
            onClick={() => setTimeRange('all')}
          >
            All Time
          </button>
        </div>
      </div>

      {/* ── Quick Exercise Pills Row ── */}
      <div className="wpc-quick-pills-row">
        <span className="quick-label">Key Movements:</span>
        {[
          'Incline Barbell Bench Press',
          'High Bar Olympic Squat',
          'Weighted Chest Dips',
          'Standing Overhead Military Press',
          'Barbell Deadlift',
        ].map(exName => (
          <button
            key={exName}
            className={`quick-pill ${selectedExercise === exName ? 'active' : ''}`}
            onClick={() => setSelectedExercise(exName)}
          >
            {exName}
          </button>
        ))}
      </div>

      {/* ── KPI Stat Cards for Chosen Exercise ── */}
      <div className="wpc-kpi-grid">
        <div className="wpc-kpi-card gold">
          <div className="wpc-kpi-top">
            <span>Personal Record (PR)</span>
            <Award size={18} className="text-gold" />
          </div>
          <div className="wpc-kpi-value">
            {kpis.prWeight > 0 ? `${kpis.prWeight} kg` : '—'}
          </div>
          <span className="wpc-kpi-sub">Peak load achieved</span>
        </div>

        <div className="wpc-kpi-card emerald">
          <div className="wpc-kpi-top">
            <span>Peak Session Volume</span>
            <Layers size={18} className="text-emerald" />
          </div>
          <div className="wpc-kpi-value">
            {kpis.maxVolume > 0 ? `${kpis.maxVolume.toLocaleString()} kg` : '—'}
          </div>
          <span className="wpc-kpi-sub">Total weight moved</span>
        </div>

        <div className="wpc-kpi-card violet">
          <div className="wpc-kpi-top">
            <span>Estimated 1-Rep Max</span>
            <Zap size={18} className="text-violet" />
          </div>
          <div className="wpc-kpi-value">
            {kpis.current1RM > 0 ? `${kpis.current1RM} kg` : '—'}
          </div>
          <span className="wpc-kpi-sub">Epley projected max</span>
        </div>

        <div className="wpc-kpi-card cyan">
          <div className="wpc-kpi-top">
            <span>Progression Rate</span>
            <TrendingUp size={18} className="text-cyan" />
          </div>
          <div className="wpc-kpi-value">
            {kpis.growthPercent > 0 ? `+${kpis.growthPercent}%` : `${kpis.growthPercent}%`}
          </div>
          <span className="wpc-kpi-sub">{kpis.totalSessions} sessions logged</span>
        </div>
      </div>

      {/* ── Log Exercise Entry Drawer/Modal ── */}
      {showLogModal && (
        <form className="wpc-log-form-card" onSubmit={handleLogSubmit} noValidate>
          <div className="wpc-form-head">
            <h4>Log Exercise Session Performance</h4>
            <span>Record your working sets and weights to plot your overload trajectory</span>
          </div>

          <div className="wpc-form-grid">
            <div className="wpc-form-group">
              <label>Exercise Name *</label>
              <input
                type="text"
                placeholder="e.g. Incline Barbell Bench Press"
                value={newEntry.exercise_name}
                onChange={e => setNewEntry(prev => ({ ...prev, exercise_name: e.target.value }))}
                className={formErrors.exercise_name ? 'wpc-input input-error' : 'wpc-input'}
              />
              {formErrors.exercise_name && <span className="wpc-error-text">{formErrors.exercise_name}</span>}
            </div>

            <div className="wpc-form-group">
              <label>Target Muscle Group</label>
              <select
                value={newEntry.muscle_group}
                onChange={e => setNewEntry(prev => ({ ...prev, muscle_group: e.target.value }))}
                className="wpc-input"
              >
                <option value="Upper Chest">Upper Chest</option>
                <option value="Lower Chest & Triceps">Lower Chest & Triceps</option>
                <option value="Quadriceps">Quadriceps</option>
                <option value="Back & Hamstrings">Back & Hamstrings</option>
                <option value="Anterior Shoulders">Anterior Shoulders</option>
                <option value="Lateral Deltoids">Lateral Deltoids</option>
                <option value="Biceps & Forearms">Biceps & Forearms</option>
                <option value="Core & Abs">Core & Abs</option>
              </select>
            </div>

            <div className="wpc-form-group">
              <label>Log Date *</label>
              <input
                type="date"
                max={new Date().toISOString().split('T')[0]}
                value={newEntry.log_date}
                onChange={e => setNewEntry(prev => ({ ...prev, log_date: e.target.value }))}
                className={formErrors.log_date ? 'wpc-input input-error' : 'wpc-input'}
              />
              {formErrors.log_date && <span className="wpc-error-text">{formErrors.log_date}</span>}
            </div>
          </div>

          <div className="wpc-form-grid four-col">
            <div className="wpc-form-group">
              <label>Working Weight (kg) *</label>
              <input
                type="number"
                step="0.5"
                min="1"
                max="1000"
                placeholder="e.g. 85"
                value={newEntry.weight_kg}
                onChange={e => setNewEntry(prev => ({ ...prev, weight_kg: e.target.value }))}
                className={formErrors.weight_kg ? 'wpc-input input-error' : 'wpc-input'}
              />
              {formErrors.weight_kg && <span className="wpc-error-text">{formErrors.weight_kg}</span>}
            </div>

            <div className="wpc-form-group">
              <label>Sets *</label>
              <input
                type="number"
                min="1"
                max="20"
                placeholder="4"
                value={newEntry.sets}
                onChange={e => setNewEntry(prev => ({ ...prev, sets: e.target.value }))}
                className={formErrors.sets ? 'wpc-input input-error' : 'wpc-input'}
              />
              {formErrors.sets && <span className="wpc-error-text">{formErrors.sets}</span>}
            </div>

            <div className="wpc-form-group">
              <label>Reps per Set *</label>
              <input
                type="number"
                min="1"
                max="200"
                placeholder="8"
                value={newEntry.reps}
                onChange={e => setNewEntry(prev => ({ ...prev, reps: e.target.value }))}
                className={formErrors.reps ? 'wpc-input input-error' : 'wpc-input'}
              />
              {formErrors.reps && <span className="wpc-error-text">{formErrors.reps}</span>}
            </div>

            <div className="wpc-form-group">
              <label>Perceived Exertion (RPE)</label>
              <select
                value={newEntry.rpe}
                onChange={e => setNewEntry(prev => ({ ...prev, rpe: e.target.value }))}
                className="wpc-input"
              >
                <option value="7">7 - Light warmup / recovery</option>
                <option value="7.5">7.5 - Fast bar speed</option>
                <option value="8">8 - 2-3 reps in reserve</option>
                <option value="8.5">8.5 - 1-2 reps in reserve</option>
                <option value="9">9 - 1 rep in reserve</option>
                <option value="9.5">9.5 - Maybe 1 grind rep left</option>
                <option value="10">10 - Maximal effort / PR</option>
              </select>
            </div>
          </div>

          <div className="wpc-form-group">
            <label>Technique Cues & Barbell Feedback</label>
            <input
              type="text"
              placeholder="e.g. 3-sec pause on chest, explosive concentric lockout..."
              value={newEntry.notes}
              onChange={e => setNewEntry(prev => ({ ...prev, notes: e.target.value }))}
              className="wpc-input"
            />
          </div>

          <div className="wpc-form-footer">
            {newEntry.weight_kg && newEntry.sets && newEntry.reps && (
              <span className="live-volume-preview">
                Computed Volume: <strong>{(Number(newEntry.weight_kg) * Number(newEntry.sets) * Number(newEntry.reps)).toLocaleString()} kg</strong>
              </span>
            )}
            <button type="submit" className="btn-wpc-submit" disabled={saving}>
              <Sparkles size={16} />
              <span>{saving ? 'Saving Data Point...' : 'Save & Plot on Chart'}</span>
            </button>
          </div>
        </form>
      )}

      {/* ── Main Chart Section ── */}
      <div className="wpc-chart-card">
        <div className="wpc-chart-head">
          <div className="chart-title-group">
            <h3>{selectedExercise}</h3>
            <span className="chart-mode-badge">
              {chartMode === 'dual' && 'Dual-Axis Overload (Weight & Volume)'}
              {chartMode === 'weight' && 'Working Weight Progression'}
              {chartMode === 'volume' && 'Total Session Volume (Tonnage)'}
              {chartMode === '1rm' && 'Projected 1-Rep Maximum'}
            </span>
          </div>

          <div className="chart-legend-custom">
            {(chartMode === 'dual' || chartMode === 'weight') && (
              <div className="legend-item">
                <span className="legend-indicator gold" />
                <span>Weight (kg)</span>
              </div>
            )}
            {(chartMode === 'dual' || chartMode === 'volume') && (
              <div className="legend-item">
                <span className="legend-indicator emerald" />
                <span>Volume (kg)</span>
              </div>
            )}
            {chartMode === '1rm' && (
              <div className="legend-item">
                <span className="legend-indicator violet" />
                <span>Est. 1RM (kg)</span>
              </div>
            )}
          </div>
        </div>

        {exerciseData.length === 0 ? (
          <div className="wpc-empty-chart">
            <Dumbbell size={36} className="text-muted" />
            <h4>No Sessions Logged for {selectedExercise}</h4>
            <p>Click "Log Exercise Set" above to record your first working weight and reps for this movement.</p>
          </div>
        ) : (
          <div className="wpc-chart-canvas-wrap">
            <ResponsiveContainer width="100%" height={380}>
              {chartMode === 'dual' ? (
                <ComposedChart data={exerciseData} margin={{ top: 20, right: 25, left: 0, bottom: 20 }}>
                  <defs>
                    <linearGradient id="volumeBarGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#10B981" stopOpacity={0.85} />
                      <stop offset="100%" stopColor="#059669" stopOpacity={0.2} />
                    </linearGradient>
                    <linearGradient id="weightLineGlow" x1="0" y1="0" x2="1" y2="0">
                      <stop offset="0%" stopColor="#F5C542" />
                      <stop offset="100%" stopColor="#FBBF24" />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#232838" vertical={false} />
                  <XAxis
                    dataKey="dateLabel"
                    stroke="#8B949E"
                    tick={{ fill: '#8B949E', fontSize: 12 }}
                    tickLine={{ stroke: '#2A3042' }}
                  />
                  {/* Left Axis: Weight (kg) */}
                  <YAxis
                    yAxisId="weightAxis"
                    orientation="left"
                    stroke="#F5C542"
                    tick={{ fill: '#F5C542', fontSize: 12 }}
                    domain={['dataMin - 5', 'dataMax + 5']}
                    unit="kg"
                  />
                  {/* Right Axis: Volume (kg) */}
                  <YAxis
                    yAxisId="volumeAxis"
                    orientation="right"
                    stroke="#10B981"
                    tick={{ fill: '#10B981', fontSize: 12 }}
                    unit="kg"
                  />
                  <Tooltip content={<CustomChartTooltip />} />
                  <Bar
                    yAxisId="volumeAxis"
                    dataKey="volume_kg"
                    name="Volume"
                    fill="url(#volumeBarGrad)"
                    radius={[4, 4, 0, 0]}
                    maxBarSize={45}
                  />
                  <Line
                    yAxisId="weightAxis"
                    type="monotone"
                    dataKey="weight_kg"
                    name="Weight"
                    stroke="url(#weightLineGlow)"
                    strokeWidth={3}
                    dot={{ fill: '#F5C542', r: 5, strokeWidth: 2, stroke: '#07070A' }}
                    activeDot={{ fill: '#FFF', r: 7, stroke: '#F5C542', strokeWidth: 3 }}
                  />
                  {kpis.prWeight > 0 && (
                    <ReferenceLine
                      yAxisId="weightAxis"
                      y={kpis.prWeight}
                      stroke="#F5C542"
                      strokeDasharray="4 4"
                      label={{ value: `PR: ${kpis.prWeight}kg`, fill: '#F5C542', fontSize: 11, position: 'top' }}
                    />
                  )}
                </ComposedChart>
              ) : chartMode === 'weight' ? (
                <AreaChart data={exerciseData} margin={{ top: 20, right: 25, left: 0, bottom: 20 }}>
                  <defs>
                    <linearGradient id="weightAreaGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#F5C542" stopOpacity={0.4} />
                      <stop offset="100%" stopColor="#F5C542" stopOpacity={0.0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#232838" vertical={false} />
                  <XAxis
                    dataKey="dateLabel"
                    stroke="#8B949E"
                    tick={{ fill: '#8B949E', fontSize: 12 }}
                  />
                  <YAxis
                    stroke="#F5C542"
                    tick={{ fill: '#F5C542', fontSize: 12 }}
                    domain={['dataMin - 5', 'dataMax + 5']}
                    unit="kg"
                  />
                  <Tooltip content={<CustomChartTooltip />} />
                  <Area
                    type="monotone"
                    dataKey="weight_kg"
                    name="Weight"
                    stroke="#F5C542"
                    strokeWidth={3}
                    fill="url(#weightAreaGrad)"
                    dot={{ fill: '#F5C542', r: 5, strokeWidth: 2, stroke: '#07070A' }}
                    activeDot={{ fill: '#FFFFFF', r: 8, stroke: '#F5C542', strokeWidth: 3 }}
                  />
                  {kpis.prWeight > 0 && (
                    <ReferenceLine
                      y={kpis.prWeight}
                      stroke="#F5C542"
                      strokeDasharray="4 4"
                      label={{ value: `Peak PR: ${kpis.prWeight}kg`, fill: '#F5C542', fontSize: 12, position: 'top' }}
                    />
                  )}
                </AreaChart>
              ) : chartMode === 'volume' ? (
                <BarChart data={exerciseData} margin={{ top: 20, right: 25, left: 0, bottom: 20 }}>
                  <defs>
                    <linearGradient id="pureVolumeGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#10B981" stopOpacity={0.9} />
                      <stop offset="100%" stopColor="#047857" stopOpacity={0.3} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#232838" vertical={false} />
                  <XAxis
                    dataKey="dateLabel"
                    stroke="#8B949E"
                    tick={{ fill: '#8B949E', fontSize: 12 }}
                  />
                  <YAxis
                    stroke="#10B981"
                    tick={{ fill: '#10B981', fontSize: 12 }}
                    unit="kg"
                  />
                  <Tooltip content={<CustomChartTooltip />} />
                  <Bar
                    dataKey="volume_kg"
                    name="Volume"
                    fill="url(#pureVolumeGrad)"
                    radius={[6, 6, 0, 0]}
                    maxBarSize={50}
                  />
                </BarChart>
              ) : (
                <LineChart data={exerciseData} margin={{ top: 20, right: 25, left: 0, bottom: 20 }}>
                  <defs>
                    <linearGradient id="oneRmLineGlow" x1="0" y1="0" x2="1" y2="0">
                      <stop offset="0%" stopColor="#A855F7" />
                      <stop offset="100%" stopColor="#C084FC" />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#232838" vertical={false} />
                  <XAxis
                    dataKey="dateLabel"
                    stroke="#8B949E"
                    tick={{ fill: '#8B949E', fontSize: 12 }}
                  />
                  <YAxis
                    stroke="#A855F7"
                    tick={{ fill: '#A855F7', fontSize: 12 }}
                    domain={['dataMin - 5', 'dataMax + 5']}
                    unit="kg"
                  />
                  <Tooltip content={<CustomChartTooltip />} />
                  <Line
                    type="monotone"
                    dataKey="estimated_1rm"
                    name="Est 1RM"
                    stroke="url(#oneRmLineGlow)"
                    strokeWidth={3}
                    dot={{ fill: '#A855F7', r: 5, strokeWidth: 2, stroke: '#07070A' }}
                    activeDot={{ fill: '#FFFFFF', r: 8, stroke: '#A855F7', strokeWidth: 3 }}
                  />
                </LineChart>
              )}
            </ResponsiveContainer>
          </div>
        )}
      </div>

      {/* ── Secondary Section: Muscle Group Distribution & Recent Table ── */}
      <div className="wpc-bottom-grid">
        {/* Muscle Group Volume Distribution */}
        <div className="wpc-secondary-card">
          <div className="wpc-card-header-small">
            <PieIcon size={16} className="text-gold" />
            <h4>Cumulative Volume by Muscle Group</h4>
          </div>
          <p className="card-sub-small">Total volume moved (kg) across all logged movements.</p>

          <div className="muscle-bars-list">
            {muscleGroupDistribution.slice(0, 5).map(item => {
              const maxVol = muscleGroupDistribution[0]?.volume || 1;
              const pct = Math.round((item.volume / maxVol) * 100);

              return (
                <div key={item.name} className="muscle-progress-row">
                  <div className="muscle-info-row">
                    <span className="muscle-name">{item.name}</span>
                    <strong className="muscle-vol">{item.volume.toLocaleString()} kg</strong>
                  </div>
                  <div className="muscle-bar-track">
                    <div className="muscle-bar-fill" style={{ width: `${pct}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Detailed Session History Table */}
        <div className="wpc-secondary-card table-card">
          <div className="wpc-card-header-small">
            <Calendar size={16} className="text-cyan" />
            <h4>Recent Sessions: {selectedExercise}</h4>
          </div>
          <p className="card-sub-small">Logged progression points in chronological order.</p>

          {exerciseData.length === 0 ? (
            <div className="table-empty-small">No session history yet.</div>
          ) : (
            <div className="table-scroll-wrap">
              <table className="wpc-table">
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Weight</th>
                    <th>Sets × Reps</th>
                    <th>Volume</th>
                    <th>RPE</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {[...exerciseData].reverse().map(row => (
                    <tr key={row.id}>
                      <td className="font-semibold text-white">{row.log_date}</td>
                      <td className="text-gold font-bold">{row.weight_kg} kg</td>
                      <td>{row.sets} × {row.reps}</td>
                      <td className="text-emerald font-semibold">{row.volume_kg.toLocaleString()} kg</td>
                      <td>
                        {row.rpe ? <span className="table-rpe-badge">RPE {row.rpe}</span> : '—'}
                      </td>
                      <td>
                        <button
                          className="btn-trash-row-small"
                          onClick={() => handleDeleteEntry(row.id)}
                          title="Delete Record"
                        >
                          <Trash2 size={13} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
