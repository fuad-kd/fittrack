import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { 
  Layers, 
  Repeat, 
  Dumbbell, 
  Play, 
  ChevronUp, 
  Search, 
  Plus, 
  Trash2, 
  Video, 
  Sparkles, 
  X, 
  ChevronLeft, 
  ChevronRight,
  MessageSquare
} from 'lucide-react';
import YouTubeEmbed from './YouTubeEmbed';
import './ExerciseList.css';

const PAGE_SIZE = 5;

const emptyEx = {
  name: '', muscle_group: '', sets: '', reps: '', weight_kg: '',
  notes: '', youtube_url: '',
};

/* ── YouTube URL → embed ID ── */
function extractYouTubeId(url) {
  if (!url) return null;
  const patterns = [
    /youtu\.be\/([^?&]+)/,
    /youtube\.com\/watch\?v=([^&]+)/,
    /youtube\.com\/embed\/([^?&]+)/,
  ];
  for (const p of patterns) {
    const m = url.match(p);
    if (m) return m[1];
  }
  return null;
}

export default function ExerciseList({ plan, muscleGroups }) {
  const [exercises,    setExercises]    = useState([]);
  const [loading,      setLoading]      = useState(true);
  const [showForm,     setShowForm]     = useState(false);
  const [form,         setForm]         = useState(emptyEx);
  const [errors,       setErrors]       = useState({});
  const [saving,       setSaving]       = useState(false);
  const [search,       setSearch]       = useState('');
  const [filterMuscle, setFilterMuscle] = useState('');
  const [page,         setPage]         = useState(1);
  const [previewEx,    setPreviewEx]    = useState(null); // exercise whose video is shown

  /* ── Fetch exercises ── */
  const fetchExercises = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('exercises')
      .select('*')
      .eq('plan_id', plan.id)
      .order('created_at', { ascending: true });
    if (!error) setExercises(data || []);
    setLoading(false);
  }, [plan.id]);

  useEffect(() => {
    fetchExercises();
    setPage(1);
    setSearch('');
    setFilterMuscle('');
    setShowForm(false);
    setPreviewEx(null);
  }, [fetchExercises]);

  /* ── Filtered + Paginated ── */
  const filtered = exercises.filter(ex => {
    const matchSearch = ex.name.toLowerCase().includes(search.toLowerCase()) ||
      (ex.notes || '').toLowerCase().includes(search.toLowerCase());
    const matchMuscle = filterMuscle ? ex.muscle_group === filterMuscle : true;
    return matchSearch && matchMuscle;
  });

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paginated  = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  /* ── Reset page when filters change ── */
  useEffect(() => { setPage(1); }, [search, filterMuscle]);

  /* ── Validation ── */
  const validate = () => {
    const e = {};
    if (!form.name.trim())         e.name        = 'Exercise name is required.';
    if (!form.muscle_group)        e.muscle_group = 'Select a muscle group.';
    const sets = Number(form.sets);
    const reps = Number(form.reps);
    const w    = Number(form.weight_kg);
    if (!form.sets || isNaN(sets) || sets < 1 || sets > 20)
      e.sets = 'Sets must be between 1 and 20.';
    if (!form.reps || isNaN(reps) || reps < 1 || reps > 200)
      e.reps = 'Reps must be between 1 and 200.';
    if (form.weight_kg !== '' && (isNaN(w) || w < 0 || w > 1000))
      e.weight_kg = 'Weight must be 0–1000 kg.';
    if (form.youtube_url && !extractYouTubeId(form.youtube_url))
      e.youtube_url = 'Enter a valid YouTube URL.';
    return e;
  };

  /* ── Submit ── */
  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) { setErrors(errs); return; }
    setSaving(true);
    const { error } = await supabase.from('exercises').insert({
      plan_id:      plan.id,
      name:         form.name.trim(),
      muscle_group: form.muscle_group,
      sets:         Number(form.sets),
      reps:         Number(form.reps),
      weight_kg:    form.weight_kg !== '' ? Number(form.weight_kg) : null,
      notes:        form.notes.trim() || null,
      youtube_url:  form.youtube_url.trim() || null,
    });
    setSaving(false);
    if (!error) {
      setForm(emptyEx);
      setErrors({});
      setShowForm(false);
      fetchExercises();
    }
  };

  /* ── Delete exercise ── */
  const handleDelete = async (id) => {
    if (previewEx?.id === id) setPreviewEx(null);
    await supabase.from('exercises').delete().eq('id', id);
    fetchExercises();
  };

  const handleChange = (field, val) => {
    setForm(f => ({ ...f, [field]: val }));
    setErrors(er => ({ ...er, [field]: '' }));
  };

  /* ── Render ── */
  return (
    <div className="exercise-list-wrapper">
      <div className="exercise-list-header">
        <div className="header-meta-group">
          <div className="plan-badge-icon">
            <Layers size={18} />
          </div>
          <div>
            <h3>Protocol Exercises: <span className="plan-name-inline">{plan.name}</span></h3>
            <p className="plan-subtitle">Total programmed movements: {exercises.length}</p>
          </div>
        </div>

        <button 
          className="btn-add-movement" 
          onClick={() => { setShowForm(s => !s); setErrors({}); }}
        >
          {showForm ? <X size={15} /> : <Plus size={15} />}
          <span>{showForm ? 'Cancel' : 'Add Movement'}</span>
        </button>
      </div>

      {/* ── Add Exercise Form ── */}
      {showForm && (
        <form className="exercise-form-card" onSubmit={handleSubmit} noValidate>
          <div className="form-inner-header">
            <h4>Program New Movement</h4>
            <span>Specify rep scheme, target load, and technique cues</span>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Exercise Name *</label>
              <input
                type="text"
                placeholder="e.g. Barbell Incline Bench Press"
                value={form.name}
                onChange={e => handleChange('name', e.target.value)}
                className={errors.name ? 'ex-input input-error' : 'ex-input'}
              />
              {errors.name && <span className="ex-error-msg">{errors.name}</span>}
            </div>

            <div className="form-group">
              <label>Target Muscle Group *</label>
              <select
                value={form.muscle_group}
                onChange={e => handleChange('muscle_group', e.target.value)}
                className={errors.muscle_group ? 'ex-input input-error' : 'ex-input'}
              >
                <option value="">Select target muscle...</option>
                {muscleGroups.map(m => <option key={m} value={m}>{m}</option>)}
              </select>
              {errors.muscle_group && <span className="ex-error-msg">{errors.muscle_group}</span>}
            </div>
          </div>

          <div className="form-row three-col">
            <div className="form-group">
              <label>Working Sets *</label>
              <input
                type="number"
                min={1} max={20}
                placeholder="3"
                value={form.sets}
                onChange={e => handleChange('sets', e.target.value)}
                className={errors.sets ? 'ex-input input-error' : 'ex-input'}
              />
              {errors.sets && <span className="ex-error-msg">{errors.sets}</span>}
            </div>

            <div className="form-group">
              <label>Target Reps *</label>
              <input
                type="number"
                min={1} max={200}
                placeholder="10"
                value={form.reps}
                onChange={e => handleChange('reps', e.target.value)}
                className={errors.reps ? 'ex-input input-error' : 'ex-input'}
              />
              {errors.reps && <span className="ex-error-msg">{errors.reps}</span>}
            </div>

            <div className="form-group">
              <label>Weight (kg)</label>
              <input
                type="number"
                min={0} max={1000} step={0.5}
                placeholder="Optional"
                value={form.weight_kg}
                onChange={e => handleChange('weight_kg', e.target.value)}
                className={errors.weight_kg ? 'ex-input input-error' : 'ex-input'}
              />
              {errors.weight_kg && <span className="ex-error-msg">{errors.weight_kg}</span>}
            </div>
          </div>

          <div className="form-group">
            <label>Video Guide URL (YouTube)</label>
            <input
              type="url"
              placeholder="https://www.youtube.com/watch?v=..."
              value={form.youtube_url}
              onChange={e => handleChange('youtube_url', e.target.value)}
              className={errors.youtube_url ? 'ex-input input-error' : 'ex-input'}
            />
            {errors.youtube_url && <span className="ex-error-msg">{errors.youtube_url}</span>}
          </div>

          <div className="form-group">
            <label>Technique Cues & Notes</label>
            <textarea
              placeholder="Pause at chest, 2-sec eccentric tempo..."
              value={form.notes}
              onChange={e => handleChange('notes', e.target.value)}
              rows={2}
              className="ex-input ex-textarea"
            />
          </div>

          <div className="form-btn-row">
            <button type="submit" className="btn-save-movement" disabled={saving}>
              <Sparkles size={16} />
              <span>{saving ? 'Saving Movement...' : 'Save Movement'}</span>
            </button>
          </div>
        </form>
      )}

      {/* ── Search & Filter ── */}
      <div className="filter-controls-row">
        <div className="search-wrap">
          <Search size={16} className="search-icon" />
          <input
            type="text"
            className="search-input"
            placeholder="Search movements or cues..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>

        <select
          className="filter-select"
          value={filterMuscle}
          onChange={e => setFilterMuscle(e.target.value)}
        >
          <option value="">All Muscle Groups</option>
          {muscleGroups.map(m => <option key={m} value={m}>{m}</option>)}
        </select>
      </div>

      {/* ── Exercise Cards ── */}
      {loading ? (
        <div className="loading-state">
          <div className="spinner-dots" />
          <span>Retrieving movement list...</span>
        </div>
      ) : paginated.length === 0 ? (
        <div className="empty-exercise-box">
          <Dumbbell size={32} className="empty-icon" />
          <p>
            {filtered.length === 0 && exercises.length > 0
              ? 'No exercises match your search criteria.'
              : 'No movements added yet. Click "+ Add Movement" above to program your first exercise.'}
          </p>
        </div>
      ) : (
        <div className="exercise-cards-stack">
          {paginated.map(ex => {
            const ytId = extractYouTubeId(ex.youtube_url);
            const isOpen = previewEx?.id === ex.id;
            return (
              <div key={ex.id} className="pro-exercise-item">
                <div className="exercise-item-main">
                  <div className="exercise-title-meta">
                    <div className="title-row">
                      <h4>{ex.name}</h4>
                      <span className="muscle-pill">{ex.muscle_group}</span>
                    </div>

                    <div className="metrics-chip-row">
                      <span className="metric-chip">
                        <Layers size={13} />
                        <strong>{ex.sets}</strong> sets
                      </span>
                      <span className="metric-chip">
                        <Repeat size={13} />
                        <strong>{ex.reps}</strong> reps
                      </span>
                      {ex.weight_kg != null && (
                        <span className="metric-chip weight">
                          <Dumbbell size={13} />
                          <strong>{ex.weight_kg}</strong> kg
                        </span>
                      )}
                    </div>

                    {ex.notes && (
                      <p className="movement-notes">
                        <MessageSquare size={13} className="notes-icon" />
                        <span>{ex.notes}</span>
                      </p>
                    )}
                  </div>

                  <div className="item-actions">
                    {ytId && (
                      <button
                        className={`btn-video-guide ${isOpen ? 'active' : ''}`}
                        onClick={() => setPreviewEx(isOpen ? null : ex)}
                      >
                        {isOpen ? <ChevronUp size={14} /> : <Play size={14} />}
                        <span>{isOpen ? 'Close Video' : 'Video Tutorial'}</span>
                      </button>
                    )}

                    <button 
                      className="btn-delete-movement" 
                      onClick={() => handleDelete(ex.id)} 
                      title="Remove Exercise"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>

                {isOpen && ytId && (
                  <div className="video-player-drawer">
                    <YouTubeEmbed videoId={ytId} title={ex.name} />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* ── Pagination ── */}
      {totalPages > 1 && (
        <div className="pro-pagination">
          <button
            className="page-nav-btn"
            disabled={page === 1}
            onClick={() => setPage(p => p - 1)}
          >
            <ChevronLeft size={16} />
            <span>Prev</span>
          </button>

          <div className="page-numbers">
            {Array.from({ length: totalPages }, (_, i) => i + 1).map(n => (
              <button
                key={n}
                className={`page-num-btn ${n === page ? 'active' : ''}`}
                onClick={() => setPage(n)}
              >
                {n}
              </button>
            ))}
          </div>

          <button
            className="page-nav-btn"
            disabled={page === totalPages}
            onClick={() => setPage(p => p + 1)}
          >
            <span>Next</span>
            <ChevronRight size={16} />
          </button>

          <span className="page-range-info">
            Showing {(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, filtered.length)} of {filtered.length}
          </span>
        </div>
      )}
    </div>
  );
}
