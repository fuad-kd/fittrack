import React, { useState } from 'react';
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
  FolderPlus
} from 'lucide-react';
import YouTubeEmbed from './YouTubeEmbed';
import './ExerciseBank.scss';

export default function ExerciseBank({ plans, onExerciseAdded, onQuickCreatePlan }) {
  const [selectedBodyPart, setSelectedBodyPart] = useState('All');
  const [selectedLevel,    setSelectedLevel]    = useState('All');
  const [searchQuery,      setSearchQuery]      = useState('');
  const [modalExercise,    setModalExercise]    = useState(null); // Exercise being added
  const [videoModal,       setVideoModal]       = useState(null); // Exercise tutorial video

  // Add-to-plan form state
  const [targetPlanId,     setTargetPlanId]     = useState('');
  const [sets,             setSets]             = useState(3);
  const [reps,             setReps]             = useState(10);
  const [weightKg,         setWeightKg]         = useState('');
  const [customNotes,      setCustomNotes]      = useState('');
  const [saving,           setSaving]           = useState(false);
  const [feedback,         setFeedback]         = useState('');

  // New plan inline creation state
  const [showNewPlanInput, setShowNewPlanInput] = useState(false);
  const [newPlanName,      setNewPlanName]      = useState('');

  // Filter exercises
  const filteredExercises = EXERCISE_LIBRARY.filter(ex => {
    const matchBodyPart = selectedBodyPart === 'All' || ex.bodyPart === selectedBodyPart;
    const matchLevel    = selectedLevel === 'All'    || ex.level === selectedLevel;
    const matchSearch   = !searchQuery.trim() || 
      ex.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ex.equipment.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ex.bodyPart.toLowerCase().includes(searchQuery.toLowerCase());

    return matchBodyPart && matchLevel && matchSearch;
  });

  const handleOpenAddModal = (exercise) => {
    setModalExercise(exercise);
    setSets(exercise.defaultSets || 3);
    setReps(exercise.defaultReps || 10);
    setWeightKg(exercise.defaultWeight || '');
    setCustomNotes(exercise.tip || '');
    if (plans.length > 0) {
      setTargetPlanId(plans[0].id);
    } else {
      setTargetPlanId('');
    }
  };

  const handleConfirmAdd = async (e) => {
    e.preventDefault();
    if (!modalExercise) return;

    let destinationPlanId = targetPlanId;

    // If creating new plan on the fly
    if (showNewPlanInput && newPlanName.trim()) {
      setSaving(true);
      const { data: newPlan, error: planError } = await onQuickCreatePlan(newPlanName.trim());
      if (planError || !newPlan) {
        setSaving(false);
        alert('Could not create new plan.');
        return;
      }
      destinationPlanId = newPlan.id;
    }

    if (!destinationPlanId) {
      alert('Please select or create a workout plan to add this exercise to.');
      return;
    }

    setSaving(true);

    const { error } = await supabase.from('exercises').insert({
      plan_id:      destinationPlanId,
      name:         modalExercise.name,
      muscle_group: modalExercise.bodyPart,
      sets:         Number(sets) || 3,
      reps:         Number(reps) || 10,
      weight_kg:    weightKg !== '' ? Number(weightKg) : null,
      notes:        customNotes.trim() || null,
      youtube_url:  modalExercise.youtubeUrl || null,
    });

    setSaving(false);

    if (!error) {
      const planName = plans.find(p => p.id === destinationPlanId)?.name || newPlanName || 'your plan';
      setFeedback(`Added "${modalExercise.name}" to ${planName}!`);
      setModalExercise(null);
      setShowNewPlanInput(false);
      setNewPlanName('');
      if (onExerciseAdded) onExerciseAdded();
      setTimeout(() => setFeedback(''), 4000);
    } else {
      alert('Error adding exercise: ' + error.message);
    }
  };

  return (
    <div className="exercise-bank-module">
      {/* ── Top Feedback Banner ── */}
      {feedback && (
        <div className="bank-feedback-banner">
          <CheckCircle2 size={18} />
          <span>{feedback}</span>
        </div>
      )}

      {/* ── Control Header: Search & Level Filter ── */}
      <div className="bank-controls-card">
        <div className="bank-search-row">
          <div className="search-input-wrapper">
            <Search size={18} className="search-icon" />
            <input
              type="text"
              placeholder="Search exercise, machine, or equipment (e.g. Chest Press, Cable, Lat Pulldown)..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            {searchQuery && (
              <button className="clear-search-btn" onClick={() => setSearchQuery('')}>
                <X size={14} />
              </button>
            )}
          </div>
        </div>

        {/* ── Difficulty / Level Selection Options ── */}
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

        {/* ── Body Parts Selector ── */}
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

      {/* ── Exercise Catalog Grid ── */}
      <div className="catalog-meta-bar">
        <span className="results-count">
          Showing <strong>{filteredExercises.length}</strong> movements 
          {selectedLevel !== 'All' && ` for ${selectedLevel} level`}
          {selectedBodyPart !== 'All' && ` in ${selectedBodyPart}`}
        </span>
      </div>

      <div className="exercise-cards-grid">
        {filteredExercises.map(ex => {
          const levelClass = ex.level === 'Beginner' ? 'badge-low' : (ex.level === 'Intermediate' ? 'badge-mid' : 'badge-high');

          return (
            <div key={ex.id} className="exercise-card-item">
              <div className="card-image-wrap">
                <img 
                  src={ex.image} 
                  alt={ex.name} 
                  className="equipment-photo" 
                  loading="lazy"
                  onError={(e) => {
                    // Fallback gym image if web connection is offline
                    e.target.src = 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?auto=format&fit=crop&w=600&q=80';
                  }}
                />
                <div className="image-overlay-chips">
                  <span className={`level-chip ${levelClass}`}>
                    {ex.levelLabel}
                  </span>
                  <span className="body-part-chip">
                    {ex.bodyPart}
                  </span>
                </div>
              </div>

              <div className="card-info-content">
                <div className="equipment-tag">
                  <Dumbbell size={13} />
                  <span>{ex.equipment}</span>
                </div>

                <h4 className="exercise-name">{ex.name}</h4>
                <p className="exercise-tip">{ex.tip}</p>

                <div className="preset-metrics">
                  <span>Standard: <strong>{ex.defaultSets} sets</strong> × <strong>{ex.defaultReps} reps</strong></span>
                  {ex.defaultWeight > 0 && <span> • <strong>{ex.defaultWeight} kg</strong></span>}
                </div>

                <div className="card-action-footer">
                  {ex.youtubeUrl && (
                    <button 
                      className="btn-watch-guide"
                      onClick={() => setVideoModal(ex)}
                      title="Watch technique tutorial"
                    >
                      <Play size={13} />
                      <span>Video</span>
                    </button>
                  )}

                  <button 
                    className="btn-add-to-my-list"
                    onClick={() => handleOpenAddModal(ex)}
                  >
                    <Plus size={15} />
                    <span>Add to My List</span>
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* ── Quick Add Modal Drawer ── */}
      {modalExercise && (
        <div className="modal-backdrop" onClick={() => setModalExercise(null)}>
          <div className="modal-dialog-card" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <div className="modal-title-group">
                <div className="modal-thumb-wrap">
                  <img src={modalExercise.image} alt={modalExercise.name} />
                </div>
                <div>
                  <span className="modal-subtitle">Add Movement to Your Workout</span>
                  <h3>{modalExercise.name}</h3>
                  <span className="equipment-badge">{modalExercise.equipment}</span>
                </div>
              </div>
              <button className="btn-close-modal" onClick={() => setModalExercise(null)}>
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleConfirmAdd} className="modal-body-form">
              {/* Select or Create Workout Plan */}
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
                    placeholder="Enter new plan name (e.g. Upper Body Strength)..."
                    value={newPlanName}
                    onChange={(e) => setNewPlanName(e.target.value)}
                    className="modal-input"
                    required
                  />
                ) : (
                  <select
                    value={targetPlanId}
                    onChange={(e) => setTargetPlanId(e.target.value)}
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

              {/* Sets, Reps & Weight in KG */}
              <div className="modal-metrics-grid">
                <div className="modal-form-group">
                  <label>Working Sets</label>
                  <div className="input-with-icon">
                    <Layers size={14} className="field-icon" />
                    <input
                      type="number"
                      min={1}
                      max={20}
                      value={sets}
                      onChange={(e) => setSets(e.target.value)}
                      className="modal-input has-icon"
                      required
                    />
                  </div>
                </div>

                <div className="modal-form-group">
                  <label>Target Reps</label>
                  <div className="input-with-icon">
                    <Repeat size={14} className="field-icon" />
                    <input
                      type="number"
                      min={1}
                      max={200}
                      value={reps}
                      onChange={(e) => setReps(e.target.value)}
                      className="modal-input has-icon"
                      required
                    />
                  </div>
                </div>

                <div className="modal-form-group">
                  <label>Weight (kg)</label>
                  <div className="input-with-icon">
                    <Scale size={14} className="field-icon" />
                    <input
                      type="number"
                      step="0.5"
                      min={0}
                      max={1000}
                      placeholder="e.g. 40"
                      value={weightKg}
                      onChange={(e) => setWeightKg(e.target.value)}
                      className="modal-input has-icon"
                    />
                  </div>
                </div>
              </div>

              {/* Notes / Cues */}
              <div className="modal-form-group">
                <label>Technique Cues & Coaching Notes</label>
                <textarea
                  placeholder="e.g. 2-second eccentric phase, pause at stretch..."
                  value={customNotes}
                  onChange={(e) => setCustomNotes(e.target.value)}
                  rows={2}
                  className="modal-textarea"
                />
              </div>

              <div className="modal-footer-actions">
                <button 
                  type="button" 
                  className="btn-modal-cancel"
                  onClick={() => setModalExercise(null)}
                >
                  Cancel
                </button>
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
      )}

      {/* ── Video Guide Lightbox ── */}
      {videoModal && (
        <div className="modal-backdrop" onClick={() => setVideoModal(null)}>
          <div className="video-dialog-card" onClick={e => e.stopPropagation()}>
            <div className="video-dialog-header">
              <h4>{videoModal.name} Tutorial</h4>
              <button className="btn-close-modal" onClick={() => setVideoModal(null)}>
                <X size={18} />
              </button>
            </div>
            <div className="video-dialog-frame">
              <YouTubeEmbed videoId={videoModal.youtubeUrl?.split('v=')[1] || 'xUm0BiZCWlQ'} title={videoModal.name} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
