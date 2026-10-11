import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import { 
  Calendar, 
  Clock, 
  Dumbbell, 
  Plus, 
  Trash2, 
  Filter, 
  X, 
  Sparkles, 
  CheckCircle2, 
  Activity,
  CalendarDays
} from 'lucide-react';
import './WorkoutLog.css';

const emptyForm = {
  log_date: new Date().toISOString().split('T')[0],
  plan_id: '',
  duration_min: '',
  notes: '',
};

export default function WorkoutLog() {
  const { user } = useAuth();

  const [logs,       setLogs]       = useState([]);
  const [plans,      setPlans]      = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [saving,     setSaving]     = useState(false);
  const [showForm,   setShowForm]   = useState(false);
  const [form,       setForm]       = useState(emptyForm);
  const [errors,     setErrors]     = useState({});
  const [feedback,   setFeedback]   = useState('');
  const [filterFrom, setFilterFrom] = useState('');
  const [filterTo,   setFilterTo]   = useState('');

  /* ── Fetch workout plans for dropdown ── */
  const fetchPlans = useCallback(async () => {
    const { data } = await supabase
      .from('workout_plans')
      .select('id, name')
      .eq('user_id', user.id)
      .order('name');
    setPlans(data || []);
  }, [user.id]);

  /* ── Fetch workout logs ── */
  const fetchLogs = useCallback(async () => {
    setLoading(true);
    let query = supabase
      .from('workout_logs')
      .select('*')
      .eq('user_id', user.id)
      .order('log_date', { ascending: false });

    if (filterFrom) query = query.gte('log_date', filterFrom);
    if (filterTo)   query = query.lte('log_date', filterTo);

    const { data, error } = await query;
    if (!error) setLogs(data || []);
    setLoading(false);
  }, [user.id, filterFrom, filterTo]);

  useEffect(() => { fetchPlans(); }, [fetchPlans]);
  useEffect(() => { fetchLogs();  }, [fetchLogs]);

  /* ── Validation ── */
  const validate = () => {
    const e = {};
    if (!form.log_date) e.log_date = 'Date is required.';
    const today = new Date().toISOString().split('T')[0];
    if (form.log_date > today) e.log_date = 'Date cannot be in the future.';
    if (form.duration_min !== '') {
      const d = Number(form.duration_min);
      if (isNaN(d) || d < 1 || d > 600) e.duration_min = 'Duration must be 1–600 minutes.';
    }
    return e;
  };

  /* ── Submit ── */
  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) { setErrors(errs); return; }

    setSaving(true);
    const selectedPlan = plans.find(p => p.id === form.plan_id);

    const { error } = await supabase.from('workout_logs').insert({
      user_id:      user.id,
      plan_id:      form.plan_id || null,
      plan_name:    selectedPlan ? selectedPlan.name : null,
      log_date:     form.log_date,
      duration_min: form.duration_min !== '' ? Number(form.duration_min) : null,
      notes:        form.notes.trim() || null,
    });

    setSaving(false);
    if (error) {
      setFeedback('Error saving log. Please try again.');
      return;
    }

    setFeedback('Workout session logged successfully!');
    setForm(emptyForm);
    setErrors({});
    setShowForm(false);
    fetchLogs();
    setTimeout(() => setFeedback(''), 3000);
  };

  /* ── Delete log ── */
  const handleDelete = async (id) => {
    if (!window.confirm('Delete this workout log?')) return;
    await supabase.from('workout_logs').delete().eq('id', id);
    fetchLogs();
  };

  const handleChange = (field, val) => {
    setForm(f => ({ ...f, [field]: val }));
    setErrors(e => ({ ...e, [field]: '' }));
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    const [y, m, d] = dateStr.split('-');
    const dt = new Date(Number(y), Number(m) - 1, Number(d));
    return dt.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' });
  };

  // Quick stats
  const totalMinutes = logs.reduce((acc, curr) => acc + (curr.duration_min || 0), 0);

  return (
    <div className="workout-log-page">
      {/* ── Header ── */}
      <div className="wl-header">
        <div className="wl-title-group">
          <div className="wl-icon-box">
            <CalendarDays size={22} />
          </div>
          <div>
            <h2>Session Tracker</h2>
            <p>Maintain consistent logs, record training volume, and monitor consistency.</p>
          </div>
        </div>

        <button
          className="btn-log-session"
          onClick={() => { setShowForm(s => !s); setErrors({}); }}
        >
          {showForm ? <X size={16} /> : <Plus size={16} />}
          <span>{showForm ? 'Cancel' : 'Log New Session'}</span>
        </button>
      </div>

      {feedback && (
        <div className="wl-feedback-banner">
          <CheckCircle2 size={16} />
          <span>{feedback}</span>
        </div>
      )}

      {/* ── Summary KPIs Strip ── */}
      <div className="wl-summary-strip">
        <div className="summary-pill">
          <Activity size={16} className="pill-icon gold" />
          <span>Total Logged Sessions: <strong>{logs.length}</strong></span>
        </div>
        <div className="summary-pill">
          <Clock size={16} className="pill-icon blue" />
          <span>Cumulative Training Time: <strong>{totalMinutes} mins</strong></span>
        </div>
      </div>

      {/* ── Add Log Form Drawer ── */}
      {showForm && (
        <form className="wl-form-card" onSubmit={handleSubmit} noValidate>
          <div className="wl-form-header">
            <h4>Record Training Session</h4>
            <span>Benchmark workout time and specific focus</span>
          </div>

          <div className="wl-form-grid">
            <div className="wl-form-group">
              <label>Workout Date *</label>
              <input
                type="date"
                value={form.log_date}
                max={new Date().toISOString().split('T')[0]}
                onChange={e => handleChange('log_date', e.target.value)}
                className={errors.log_date ? 'wl-input input-error' : 'wl-input'}
              />
              {errors.log_date && <span className="wl-error-msg">{errors.log_date}</span>}
            </div>

            <div className="wl-form-group">
              <label>Workout Protocol (Optional)</label>
              <select
                value={form.plan_id}
                onChange={e => handleChange('plan_id', e.target.value)}
                className="wl-input"
              >
                <option value="">Select custom or standard protocol...</option>
                {plans.map(p => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
            </div>

            <div className="wl-form-group">
              <label>Session Duration (Minutes)</label>
              <input
                type="number"
                min={1}
                max={600}
                placeholder="e.g. 60"
                value={form.duration_min}
                onChange={e => handleChange('duration_min', e.target.value)}
                className={errors.duration_min ? 'wl-input input-error' : 'wl-input'}
              />
              {errors.duration_min && <span className="wl-error-msg">{errors.duration_min}</span>}
            </div>
          </div>

          <div className="wl-form-group">
            <label>Session Notes & Performance Feedback</label>
            <textarea
              placeholder="e.g. Hit a new PR on squats, felt high energy, recovery was optimal..."
              value={form.notes}
              onChange={e => handleChange('notes', e.target.value)}
              rows={2}
              className="wl-input wl-textarea"
            />
          </div>

          <div className="wl-form-footer">
            <button type="submit" className="wl-btn-submit" disabled={saving}>
              <Sparkles size={16} />
              <span>{saving ? 'Saving Entry...' : 'Save Session'}</span>
            </button>
          </div>
        </form>
      )}

      {/* ── Filter Bar ── */}
      <div className="wl-filter-card">
        <div className="filter-title">
          <Filter size={15} />
          <span>Filter Session History</span>
        </div>

        <div className="wl-filter-inputs">
          <div className="wl-filter-item">
            <label>From Date</label>
            <input
              type="date"
              value={filterFrom}
              onChange={e => setFilterFrom(e.target.value)}
              className="wl-filter-field"
            />
          </div>

          <div className="wl-filter-item">
            <label>To Date</label>
            <input
              type="date"
              value={filterTo}
              onChange={e => setFilterTo(e.target.value)}
              className="wl-filter-field"
            />
          </div>

          {(filterFrom || filterTo) && (
            <button
              className="wl-btn-clear"
              onClick={() => { setFilterFrom(''); setFilterTo(''); }}
            >
              <X size={14} />
              <span>Reset Filter</span>
            </button>
          )}
        </div>
      </div>

      {/* ── Log History ── */}
      {loading ? (
        <div className="wl-loading-box">
          <div className="loading-spinner" />
          <span>Retrieving session history...</span>
        </div>
      ) : logs.length === 0 ? (
        <div className="wl-empty-box">
          <CalendarDays size={32} className="empty-icon" />
          <p>
            {filterFrom || filterTo 
              ? 'No sessions logged in this timeframe.' 
              : 'No sessions recorded yet. Click "Log New Session" to track your first workout.'}
          </p>
        </div>
      ) : (
        <div className="wl-timeline-grid">
          {logs.map(log => (
            <div key={log.id} className="wl-entry-card">
              <div className="entry-header">
                <div className="entry-date-badge">
                  <Calendar size={13} className="date-icon" />
                  <span>{formatDate(log.log_date)}</span>
                </div>
                <button 
                  className="btn-trash-entry" 
                  onClick={() => handleDelete(log.id)} 
                  title="Delete Session"
                >
                  <Trash2 size={15} />
                </button>
              </div>

              <div className="entry-tags-row">
                {log.plan_name ? (
                  <span className="protocol-chip">
                    <Dumbbell size={13} />
                    <span>{log.plan_name}</span>
                  </span>
                ) : (
                  <span className="protocol-chip custom">
                    <Activity size={13} />
                    <span>Custom Training</span>
                  </span>
                )}

                {log.duration_min && (
                  <span className="duration-chip">
                    <Clock size={13} />
                    <span>{log.duration_min} mins</span>
                  </span>
                )}
              </div>

              {log.notes && (
                <p className="entry-notes">{log.notes}</p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
