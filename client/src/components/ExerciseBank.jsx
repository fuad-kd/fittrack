import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import {
  BODY_PARTS,
  LEVELS,
  EXERCISE_LIBRARY
} from '../data/exerciseLibrary';
import {
  Search,
  Dumbbell,
  Plus,
  Check,
  Layers,
  Repeat,
  Scale,
  Play,
  X,
  Sparkles,
  ChevronRight,
  Filter,
  CheckCircle2,
  FolderPlus,
  Target,
  Zap,
  BookOpen,
  PlayCircle,
  Eye
} from 'lucide-react';

// YouTube icon (SVG — lucide-react version in this project doesn't ship it)
const YoutubeIcon = ({ size = 16, className = '' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true">
    <path d="M21.8 8s-.2-1.4-.8-2c-.8-.8-1.6-.8-2-.9C16.5 5 12 5 12 5s-4.5 0-7 .1c-.4.1-1.2.1-2 .9-.6.6-.8 2-.8 2S2 9.6 2 11.2v1.5c0 1.6.2 3.2.2 3.2s.2 1.4.8 2c.8.8 1.8.8 2.3.9C6.8 19 12 19 12 19s4.5 0 7-.1c.4-.1 1.2-.1 2-.9.6-.6.8-2 .8-2s.2-1.6.2-3.2v-1.5C22 9.6 21.8 8 21.8 8zM9.7 14.5V9.2l5.5 2.7-5.5 2.6z"/>
  </svg>
);
import './ExerciseBank.scss';

/* ─────────────────────────────────────────────
   YouTubeEmbed — inline iframe utility
   ───────────────────────────────────────────── */
function YouTubeEmbed({ videoId, title }) {
  return (
    <div style={{ position: 'relative', paddingTop: '56.25%', background: '#000', borderRadius: '12px', overflow: 'hidden' }}>
      <iframe
        src={`https://www.youtube.com/embed/${videoId}?rel=0&modestbranding=1&autoplay=1`}
        title={title || 'Exercise Tutorial'}
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        allowFullScreen
        loading="lazy"
        style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', border: 'none' }}
      />
    </div>
  );
}

/* ─────────────────────────────────────────────
   StepIllustration — AI-generated 2D image placeholder
   (In production, replace src with actual AI-generated URL)
   ───────────────────────────────────────────── */
function StepIllustration({ step, exerciseName }) {
  const illustrations = [
    'https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?auto=format&fit=crop&w=400&q=80',
    'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?auto=format&fit=crop&w=400&q=80',
    'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?auto=format&fit=crop&w=400&q=80',
    'https://images.unsplash.com/photo-1581009146145-b5ef050c2e1e?auto=format&fit=crop&w=400&q=80',
    'https://images.unsplash.com/photo-1517838277536-f5f99be501cd?auto=format&fit=crop&w=400&q=80',
  ];
  const imgSrc = illustrations[(step.number - 1) % illustrations.length];

  return (
    <div className="step-illustration-wrap">
      <div className="step-illustration-badge">
        <Sparkles size={10} />
        <span>AI Illustration</span>
      </div>
      <img
        src={imgSrc}
        alt={`${exerciseName} — Step ${step.number}: ${step.title}`}
        className="step-illustration-img"
        loading="lazy"
        onError={e => { e.target.style.display = 'none'; }}
      />
      <div className="step-illustration-overlay">
        <span className="step-illustration-label">Step {step.number} Illustration</span>
        <span className="step-illustration-sub">AI-Generated Instructional Diagram</span>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────
   ExerciseDetailModal — step-by-step floating modal
   ───────────────────────────────────────────── */
function ExerciseDetailModal({ exercise, onClose }) {
  const [activeStep, setActiveStep] = useState(1);

  // Lock body scroll while modal is open
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = ''; };
  }, []);

  if (!exercise) return null;
  const steps = exercise.steps || [];

  const levelClass =
    exercise.level === 'Beginner'
      ? 'badge-low'
      : exercise.level === 'Intermediate'
      ? 'badge-mid'
      : 'badge-high';

  const currentStep = steps.find(s => s.number === activeStep) || steps[0];

  return (
    <div className="detail-modal-backdrop" onClick={onClose}>
      <div className="detail-modal-container" onClick={e => e.stopPropagation()}>

        {/* ── Modal Header ── */}
        <div className="detail-modal-header">
          <div className="detail-modal-thumb">
            <img src={exercise.image} alt={exercise.name} />
          </div>
          <div className="detail-modal-meta">
            <div className="detail-modal-tags">
              <span className={`level-chip ${levelClass}`}>{exercise.levelLabel}</span>
              <span className="body-part-chip">{exercise.bodyPart}</span>
            </div>
            <h2 className="detail-modal-title">{exercise.name}</h2>
            <p className="detail-modal-target">
              <Target size={13} />
              Target Muscle: <strong>{exercise.targetMuscle || exercise.bodyPart}</strong>
            </p>
            <p className="detail-modal-equip">
              <Dumbbell size={13} />
              {exercise.equipment}
            </p>
          </div>
          <button className="detail-modal-close" onClick={onClose} title="Close">
            <X size={20} />
          </button>
        </div>

        {/* ── Step Navigator Tabs ── */}
        <div className="detail-step-tabs-bar">
          <span className="step-tabs-label">
            <BookOpen size={13} />
            Form Breakdown
          </span>
          <div className="step-tabs-pills">
            {steps.map(s => (
              <button
                key={s.number}
                className={`step-tab-pill ${activeStep === s.number ? 'active' : ''}`}
                onClick={() => setActiveStep(s.number)}
              >
                {s.number}
              </button>
            ))}
          </div>
        </div>

        {/* ── Active Step Content ── */}
        {currentStep && (
          <div className="detail-step-body">
            {/* Left: Illustration */}
            <div className="step-illustration-col">
              <StepIllustration step={currentStep} exerciseName={exercise.name} />
            </div>

            {/* Right: Instructions */}
            <div className="step-instruction-col">
              <div className="step-number-badge">
                <span>STEP {currentStep.number}</span>
                <span className="step-of">/ {steps.length}</span>
              </div>
              <h3 className="step-title">{currentStep.title}</h3>
              <p className="step-instruction-text">{currentStep.instruction}</p>

              {currentStep.cue && (
                <div className="step-coaching-cue">
                  <Zap size={14} className="cue-icon" />
                  <span>{currentStep.cue}</span>
                </div>
              )}

              {/* Step Navigation Arrows */}
              <div className="step-nav-arrows">
                <button
                  className="step-nav-btn"
                  onClick={() => setActiveStep(s => Math.max(1, s - 1))}
                  disabled={activeStep === 1}
                >
                  ← Previous
                </button>
                <span className="step-progress-dots">
                  {steps.map(s => (
                    <span
                      key={s.number}
                      className={`step-dot ${activeStep === s.number ? 'active' : activeStep > s.number ? 'done' : ''}`}
                      onClick={() => setActiveStep(s.number)}
                    />
                  ))}
                </span>
                <button
                  className="step-nav-btn primary"
                  onClick={() => setActiveStep(s => Math.min(steps.length, s + 1))}
                  disabled={activeStep === steps.length}
                >
                  Next →
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ── Modal Footer ── */}
        <div className="detail-modal-footer">
          <div className="detail-footer-metrics">
            <span className="footer-metric">
              <Layers size={13} />
              {exercise.defaultSets} Sets
            </span>
            <span className="footer-metric">
              <Repeat size={13} />
              {exercise.defaultReps} Reps
            </span>
            {exercise.defaultWeight > 0 && (
              <span className="footer-metric">
                <Scale size={13} />
                {exercise.defaultWeight} kg
              </span>
            )}
          </div>
          <div className="detail-footer-tip">
            <span>💡 Pro Tip: {exercise.tip}</span>
          </div>
        </div>

      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────
   VideoModal — YouTube embed floating lightbox
   ───────────────────────────────────────────── */
function VideoModal({ exercise, onClose }) {
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = ''; };
  }, []);

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="video-dialog-card" onClick={e => e.stopPropagation()}>
        <div className="video-dialog-header">
          <div className="video-dialog-title-group">
            <YoutubeIcon size={18} className="yt-icon" />
            <h4>{exercise.name} — Technique Tutorial</h4>
          </div>
          <button className="btn-close-modal" onClick={onClose}>
            <X size={18} />
          </button>
        </div>
        <div className="video-dialog-frame">
          <YouTubeEmbed
            videoId={exercise.youtubeId || exercise.youtubeUrl?.split('v=')[1] || 'xUm0BiZCWlQ'}
            title={exercise.name}
          />
        </div>
        <div className="video-dialog-footer">
          <span>
            <Target size={13} /> Target: <strong>{exercise.targetMuscle || exercise.bodyPart}</strong>
          </span>
          <span className={`level-chip ${exercise.level === 'Beginner' ? 'badge-low' : exercise.level === 'Intermediate' ? 'badge-mid' : 'badge-high'}`}>
            {exercise.levelLabel}
          </span>
        </div>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────
   AddToPlantModal — Quick add to plan dialog
   ───────────────────────────────────────────── */
function AddToPlanModal({ exercise, plans, onQuickCreatePlan, onExerciseAdded, onClose }) {
  const [targetPlanId,     setTargetPlanId]     = useState(plans.length > 0 ? plans[0].id : '');
  const [sets,             setSets]             = useState(exercise.defaultSets || 3);
  const [reps,             setReps]             = useState(exercise.defaultReps || 10);
  const [weightKg,         setWeightKg]         = useState(exercise.defaultWeight || '');
  const [customNotes,      setCustomNotes]      = useState(exercise.tip || '');
  const [saving,           setSaving]           = useState(false);
  const [showNewPlanInput, setShowNewPlanInput] = useState(false);
  const [newPlanName,      setNewPlanName]      = useState('');

  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = ''; };
  }, []);

  const handleConfirmAdd = async (e) => {
    e.preventDefault();
    let destinationPlanId = targetPlanId;

    if (showNewPlanInput && newPlanName.trim()) {
      setSaving(true);
      const { data: newPlan, error: planError } = await onQuickCreatePlan(newPlanName.trim());
      if (planError || !newPlan) { setSaving(false); alert('Could not create new plan.'); return; }
      destinationPlanId = newPlan.id;
    }

    if (!destinationPlanId) { alert('Please select or create a workout plan.'); return; }

    setSaving(true);
    const { error } = await supabase.from('exercises').insert({
      plan_id:      destinationPlanId,
      name:         exercise.name,
      muscle_group: exercise.bodyPart,
      sets:         Number(sets) || 3,
      reps:         Number(reps) || 10,
      weight_kg:    weightKg !== '' ? Number(weightKg) : null,
      notes:        customNotes.trim() || null,
      youtube_url:  exercise.youtubeUrl || null,
    });
    setSaving(false);

    if (!error) {
      if (onExerciseAdded) onExerciseAdded();
      onClose();
    } else {
      alert('Error adding exercise: ' + error.message);
    }
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-dialog-card" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <div className="modal-title-group">
            <div className="modal-thumb-wrap">
              <img src={exercise.image} alt={exercise.name} />
            </div>
            <div>
              <span className="modal-subtitle">Add Movement to Your Workout</span>
              <h3>{exercise.name}</h3>
              <span className="equipment-badge">{exercise.equipment}</span>
            </div>
          </div>
          <button className="btn-close-modal" onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleConfirmAdd} className="modal-body-form">
          <div className="modal-form-group">
            <div className="plan-label-row">
              <label>Choose Workout Plan</label>
              <button
                type="button"
                className="btn-toggle-new-plan"
                onClick={() => setShowNewPlanInput(!showNewPlanInput)}
              >
                <FolderPlus size={13} />
                <span>{showNewPlanInput ? 'Select Existing' : '+ New Plan'}</span>
              </button>
            </div>

            {showNewPlanInput ? (
              <input
                type="text"
                placeholder="Enter new plan name..."
                value={newPlanName}
                onChange={e => setNewPlanName(e.target.value)}
                className="modal-input"
                required
              />
            ) : (
              <select
                value={targetPlanId}
                onChange={e => setTargetPlanId(e.target.value)}
                className="modal-select"
                required
              >
                {plans.length === 0 ? (
                  <option value="">No plans yet — click "+ New Plan" above</option>
                ) : (
                  plans.map(p => (
                    <option key={p.id} value={p.id}>{p.name} ({p.difficulty || 'Custom'})</option>
                  ))
                )}
              </select>
            )}
          </div>

          <div className="modal-metrics-grid">
            <div className="modal-form-group">
              <label>Working Sets</label>
              <div className="input-with-icon">
                <Layers size={14} className="field-icon" />
                <input type="number" min={1} max={20} value={sets} onChange={e => setSets(e.target.value)} className="modal-input has-icon" required />
              </div>
            </div>
            <div className="modal-form-group">
              <label>Target Reps</label>
              <div className="input-with-icon">
                <Repeat size={14} className="field-icon" />
                <input type="number" min={1} max={200} value={reps} onChange={e => setReps(e.target.value)} className="modal-input has-icon" required />
              </div>
            </div>
            <div className="modal-form-group">
              <label>Weight (kg)</label>
              <div className="input-with-icon">
                <Scale size={14} className="field-icon" />
                <input type="number" step="0.5" min={0} max={1000} placeholder="e.g. 40" value={weightKg} onChange={e => setWeightKg(e.target.value)} className="modal-input has-icon" />
              </div>
            </div>
          </div>

          <div className="modal-form-group">
            <label>Technique Cues & Coaching Notes</label>
            <textarea
              placeholder="e.g. 2-second eccentric phase, pause at stretch..."
              value={customNotes}
              onChange={e => setCustomNotes(e.target.value)}
              rows={2}
              className="modal-textarea"
            />
          </div>

          <div className="modal-footer-actions">
            <button type="button" className="btn-modal-cancel" onClick={onClose}>Cancel</button>
            <button
              type="submit"
              className="btn-modal-confirm"
              disabled={saving || (!targetPlanId && !newPlanName.trim())}
            >
              <Sparkles size={16} />
              <span>{saving ? 'Adding Movement...' : 'Add to Workout Plan'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────
   Main ExerciseBank Component
   ───────────────────────────────────────────── */
export default function ExerciseBank({ plans, onExerciseAdded, onQuickCreatePlan }) {
  const [selectedBodyPart, setSelectedBodyPart] = useState('All');
  const [selectedLevel,    setSelectedLevel]    = useState('All');
  const [searchQuery,      setSearchQuery]      = useState('');
  const [detailExercise,   setDetailExercise]   = useState(null); // Step-by-step modal
  const [videoExercise,    setVideoExercise]    = useState(null); // YouTube video modal
  const [addExercise,      setAddExercise]      = useState(null); // Add to plan modal
  const [feedback,         setFeedback]         = useState('');

  const filteredExercises = EXERCISE_LIBRARY.filter(ex => {
    const matchBodyPart = selectedBodyPart === 'All' || ex.bodyPart === selectedBodyPart;
    const matchLevel    = selectedLevel === 'All'    || ex.level === selectedLevel;
    const matchSearch   = !searchQuery.trim() ||
      ex.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ex.equipment.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ex.bodyPart.toLowerCase().includes(searchQuery.toLowerCase());
    return matchBodyPart && matchLevel && matchSearch;
  });

  const handleExerciseAdded = useCallback((exerciseName, planName) => {
    setFeedback(`Added "${exerciseName}" to ${planName}!`);
    if (onExerciseAdded) onExerciseAdded();
    setTimeout(() => setFeedback(''), 4000);
  }, [onExerciseAdded]);

  return (
    <div className="exercise-bank-module">
      {/* ── Feedback Banner ── */}
      {feedback && (
        <div className="bank-feedback-banner">
          <CheckCircle2 size={18} />
          <span>{feedback}</span>
        </div>
      )}

      {/* ── Controls: Search & Filters ── */}
      <div className="bank-controls-card">
        <div className="bank-search-row">
          <div className="search-input-wrapper">
            <Search size={18} className="search-icon" />
            <input
              type="text"
              placeholder="Search exercise, machine, or equipment (e.g. Chest Press, Cable, Lat Pulldown)..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
            />
            {searchQuery && (
              <button className="clear-search-btn" onClick={() => setSearchQuery('')}>
                <X size={14} />
              </button>
            )}
          </div>
        </div>

        <div className="level-selection-row">
          <span className="filter-row-label">
            <Filter size={14} />
            <span>Select Difficulty Level:</span>
          </span>
          <div className="level-pills">
            {LEVELS.map(lvl => (
              <button
                key={lvl.key}
                className={`level-pill-btn ${selectedLevel === lvl.key ? 'active ' + (lvl.badgeClass || '') : ''}`}
                onClick={() => setSelectedLevel(lvl.key)}
              >
                <span>{lvl.label}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="body-parts-row">
          <span className="filter-row-label">Body Section:</span>
          <div className="body-part-pills">
            {BODY_PARTS.map(part => (
              <button
                key={part}
                className={`body-part-btn ${selectedBodyPart === part ? 'active' : ''}`}
                onClick={() => setSelectedBodyPart(part)}
              >
                {part === 'All' ? 'All Body Sections' : part}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ── Catalog Meta ── */}
      <div className="catalog-meta-bar">
        <span className="results-count">
          Showing <strong>{filteredExercises.length}</strong> movements
          {selectedLevel !== 'All' && ` · ${selectedLevel} level`}
          {selectedBodyPart !== 'All' && ` · ${selectedBodyPart}`}
        </span>
        <span className="catalog-meta-hint">
          <Eye size={13} /> Click any card to view step-by-step form guide
        </span>
      </div>

      {/* ── Exercise Cards Grid ── */}
      <div className="exercise-cards-grid">
        {filteredExercises.map(ex => {
          const levelClass = ex.level === 'Beginner' ? 'badge-low' : (ex.level === 'Intermediate' ? 'badge-mid' : 'badge-high');

          return (
            <div
              key={ex.id}
              className="exercise-card-item"
              onClick={() => setDetailExercise(ex)}
              title="Click to view full exercise guide"
            >
              <div className="card-image-wrap">
                <img
                  src={ex.image}
                  alt={ex.name}
                  className="equipment-photo"
                  loading="lazy"
                  onError={e => {
                    e.target.src = 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?auto=format&fit=crop&w=600&q=80';
                  }}
                />
                <div className="image-overlay-chips">
                  <span className={`level-chip ${levelClass}`}>{ex.levelLabel}</span>
                  <span className="body-part-chip">{ex.bodyPart}</span>
                </div>
                {/* Click hint overlay */}
                <div className="card-click-hint">
                  <Eye size={16} />
                  <span>View Guide</span>
                </div>
              </div>

              <div className="card-info-content">
                <div className="equipment-tag">
                  <Dumbbell size={13} />
                  <span>{ex.equipment}</span>
                </div>

                <h4 className="exercise-name">{ex.name}</h4>

                {ex.targetMuscle && (
                  <div className="target-muscle-tag">
                    <Target size={11} />
                    <span>{ex.targetMuscle}</span>
                  </div>
                )}

                <p className="exercise-tip">{ex.tip}</p>

                <div className="preset-metrics">
                  <span>Standard: <strong>{ex.defaultSets} sets</strong> × <strong>{ex.defaultReps} reps</strong></span>
                  {ex.defaultWeight > 0 && <span> · <strong>{ex.defaultWeight} kg</strong></span>}
                </div>

                <div className="card-action-footer" onClick={e => e.stopPropagation()}>
                  {/* Watch Video Button */}
                  {(ex.youtubeId || ex.youtubeUrl) && (
                    <button
                      className="btn-watch-video"
                      onClick={e => { e.stopPropagation(); setVideoExercise(ex); }}
                      title="Watch technique tutorial on YouTube"
                    >
                      <YoutubeIcon size={14} />
                      <span>Watch Video</span>
                    </button>
                  )}

                  {/* Add to Plan Button */}
                  <button
                    className="btn-add-to-my-list"
                    onClick={e => { e.stopPropagation(); setAddExercise(ex); }}
                  >
                    <Plus size={15} />
                    <span>Add to Plan</span>
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* ── MODALS ── */}

      {/* Step-by-step Exercise Detail Modal */}
      {detailExercise && (
        <ExerciseDetailModal
          exercise={detailExercise}
          onClose={() => setDetailExercise(null)}
        />
      )}

      {/* YouTube Video Modal */}
      {videoExercise && (
        <VideoModal
          exercise={videoExercise}
          onClose={() => setVideoExercise(null)}
        />
      )}

      {/* Add to Plan Modal */}
      {addExercise && (
        <AddToPlanModal
          exercise={addExercise}
          plans={plans}
          onQuickCreatePlan={onQuickCreatePlan}
          onExerciseAdded={() => handleExerciseAdded(addExercise.name, 'your plan')}
          onClose={() => setAddExercise(null)}
        />
      )}
    </div>
  );
}
