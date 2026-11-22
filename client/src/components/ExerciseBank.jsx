import React, { useState, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { supabase } from '../lib/supabase';
import ImageLightboxPortal from './ImageLightboxPortal';
import {
  BODY_PARTS,
  LEVELS,
  EXERCISE_LIBRARY
} from '../data/exerciseLibrary';
import {
  Search,
  Dumbbell,
  Plus,
  Layers,
  Repeat,
  Scale,
  X,
  Sparkles,
  Filter,
  CheckCircle2,
  FolderPlus,
  Target,
  Zap,
  BookOpen,
  Eye,
  Maximize2,
  Activity,
  Shield,
  AlertTriangle
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

const FALLBACK_STEP_ILLUSTRATIONS = [
  'https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?auto=format&fit=crop&w=800&q=80',
  'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?auto=format&fit=crop&w=800&q=80',
  'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?auto=format&fit=crop&w=800&q=80',
  'https://images.unsplash.com/photo-1581009146145-b5ef050c2e1e?auto=format&fit=crop&w=800&q=80',
  'https://images.unsplash.com/photo-1517838277536-f5f99be501cd?auto=format&fit=crop&w=800&q=80',
];

function getStepFallbackSrc(stepNumber = 1) {
  return FALLBACK_STEP_ILLUSTRATIONS[(Math.max(1, stepNumber) - 1) % FALLBACK_STEP_ILLUSTRATIONS.length];
}

function getStepIllustrationSrc(step) {
  return step?.illustration || getStepFallbackSrc(step?.number || 1);
}

/* ─────────────────────────────────────────────
   StepIllustration — Diagram / Image display with Zoom
   ───────────────────────────────────────────── */
function StepIllustration({ step, exerciseName, onZoom }) {
  const resolvedSrc = getStepIllustrationSrc(step);
  const [imgSrc, setImgSrc] = useState(resolvedSrc);
  const isCustom = Boolean(step.illustration);

  useEffect(() => {
    setImgSrc(resolvedSrc);
  }, [resolvedSrc]);

  const triggerInspect = (e) => {
    if (e) e.stopPropagation();
    if (onZoom) onZoom(imgSrc);
  };

  return (
    <div
      className="step-illustration-wrap"
      onClick={triggerInspect}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          triggerInspect(e);
        }
      }}
      title="Click to inspect full view"
    >
      <div className={`step-illustration-badge ${isCustom ? 'custom-anatomy' : ''}`}>
        <Sparkles size={10} />
        <span>{isCustom ? 'Anatomical Diagram' : 'Form Illustration'}</span>
      </div>
      <img
        src={imgSrc}
        alt={`${exerciseName} — Step ${step.number}: ${step.title}`}
        className="step-illustration-img"
        loading="lazy"
        onError={() => {
          const fallback = getStepFallbackSrc(step.number);
          if (imgSrc !== fallback) setImgSrc(fallback);
        }}
      />
      <div className="step-illustration-overlay">
        <button
          type="button"
          className="step-overlay-inner step-overlay-trigger-btn"
          onClick={triggerInspect}
        >
          <Maximize2 size={16} className="zoom-hint-icon" />
          <span className="step-illustration-label">Step {step.number} Diagram</span>
          <span className="step-illustration-sub">Click to inspect full view</span>
        </button>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────
   ExerciseDetailModal — Form & Anatomy Visualizer
   ───────────────────────────────────────────── */
function ExerciseDetailModal({ exercise, initialTab = 'steps', onClose }) {
  const [modalTab, setModalTab] = useState(initialTab); // 'steps' | infographic.id
  const [activeStep, setActiveStep] = useState(1);
  const [lightboxState, setLightboxState] = useState(null);

  useEffect(() => {
    setModalTab(initialTab);
    setActiveStep(1);
    setLightboxState(null);
  }, [exercise?.id, initialTab]);

  // Lock body scroll while modal is open
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = ''; };
  }, []);

  // Close ExerciseDetailModal on Esc only when Lightbox is NOT open
  useEffect(() => {
    const handleModalKey = (e) => {
      if (e.key === 'Escape' && !lightboxState) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleModalKey);
    return () => window.removeEventListener('keydown', handleModalKey);
  }, [lightboxState, onClose]);

  if (!exercise) return null;
  const steps = exercise.steps || [];
  const infographics = exercise.infographics || [];

  const levelClass =
    exercise.level === 'Beginner'
      ? 'badge-low'
      : exercise.level === 'Intermediate'
      ? 'badge-mid'
      : 'badge-high';

  const currentStep = steps.find(s => s.number === activeStep) || steps[0];
  const currentStepIndex = Math.max(0, steps.findIndex(s => s.number === (currentStep?.number || activeStep)));
  const currentInfographicIndex = infographics.findIndex(info => info.id === modalTab);
  const currentInfographic = currentInfographicIndex >= 0 ? infographics[currentInfographicIndex] : null;

  const openCoverLightbox = () => {
    setLightboxState({
      items: [
        {
          src: exercise.image,
          title: `${exercise.name} — Cover Reference`,
          subtitle: `${exercise.targetMuscle || exercise.bodyPart} • ${exercise.equipment}`,
          description: exercise.tip,
          badge: 'Exercise Cover Diagram',
        },
      ],
      index: 0,
      syncSteps: false,
    });
  };

  const openStepLightbox = (stepIndex, overrideSrc) => {
    const stepItems = steps.map((s, idx) => ({
      src: idx === stepIndex && overrideSrc ? overrideSrc : getStepIllustrationSrc(s),
      title: `Phase ${s.number}/${steps.length}: ${s.title} — Step ${s.number} Diagram`,
      subtitle: `${exercise.name} • ${exercise.targetMuscle || exercise.bodyPart}`,
      description: s.cue ? `${s.instruction} (Coaching Cue: ${s.cue})` : s.instruction,
      badge: `Step ${s.number} of ${steps.length} Diagram`,
    }));

    setLightboxState({
      items: stepItems,
      index: Math.max(0, Math.min(stepIndex, stepItems.length - 1)),
      syncSteps: true,
    });
  };

  const openAnatomyLightbox = (infoIndex) => {
    const infoItems = infographics.map((info) => ({
      src: info.image,
      title: `${exercise.name} — ${info.title}`,
      subtitle: info.subtitle || exercise.targetMuscle || exercise.bodyPart,
      description: info.summary,
      badge: info.badge || '3D Mannequin Anatomy',
    }));

    setLightboxState({
      items: infoItems,
      index: Math.max(0, Math.min(infoIndex, infoItems.length - 1)),
      syncSteps: false,
    });
  };

  const handleLightboxIndexChange = (nextIdx) => {
    setLightboxState((prev) => {
      if (!prev) return prev;
      if (prev.syncSteps && steps[nextIdx]) {
        setActiveStep(steps[nextIdx].number);
      }
      return { ...prev, index: nextIdx };
    });
  };

  const modalMarkup = (
    <>
      <div className="detail-modal-backdrop" onClick={onClose}>
        <div className="detail-modal-container" onClick={e => e.stopPropagation()}>

          {/* ── Modal Header ── */}
          <div className="detail-modal-header">
            <div
              className="detail-modal-thumb clickable"
              onClick={openCoverLightbox}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  openCoverLightbox();
                }
              }}
              title="Click to inspect cover diagram"
            >
              <img src={exercise.image} alt={exercise.name} />
              <div className="thumb-zoom-badge">
                <Maximize2 size={11} />
              </div>
            </div>
            <div className="detail-modal-meta">
              <div className="detail-modal-tags">
                <span className={`level-chip ${levelClass}`}>{exercise.levelLabel}</span>
                <span className="body-part-chip">{exercise.bodyPart}</span>
                {infographics.length > 0 && (
                  <span className="infographics-count-chip">
                    <Sparkles size={11} /> {infographics.length} Visual Infographics
                  </span>
                )}
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

          {/* ── Navigation Tabs (Form Steps vs Anatomical Infographics) ── */}
          <div className="detail-nav-sections-bar">
            <button
              className={`nav-section-btn ${modalTab === 'steps' ? 'active' : ''}`}
              onClick={() => setModalTab('steps')}
            >
              <BookOpen size={14} />
              <span>Step-by-Step Technique ({steps.length})</span>
            </button>

            {infographics.map(info => (
              <button
                key={info.id}
                className={`nav-section-btn ${modalTab === info.id ? 'active' : ''}`}
                onClick={() => setModalTab(info.id)}
              >
                <Activity size={14} />
                <span>{info.badge || info.title}</span>
              </button>
            ))}
          </div>

          {/* ── MODE 1: STEP-BY-STEP BREAKDOWN ── */}
          {modalTab === 'steps' && (
            <>
              {/* Step Navigator Tabs */}
              <div className="detail-step-tabs-bar">
                <span className="step-tabs-label">
                  <BookOpen size={13} />
                  Phased Movement:
                </span>
                <div className="step-tabs-pills">
                  {steps.map(s => (
                    <button
                      key={s.number}
                      className={`step-tab-pill ${activeStep === s.number ? 'active' : ''}`}
                      onClick={() => setActiveStep(s.number)}
                    >
                      Step {s.number}
                    </button>
                  ))}
                </div>
              </div>

              {/* Active Step Content */}
              {currentStep && (
                <div className="detail-step-body">
                  {/* Left: Illustration */}
                  <div className="step-illustration-col">
                    <StepIllustration
                      step={currentStep}
                      exerciseName={exercise.name}
                      onZoom={(resolvedSrc) => openStepLightbox(currentStepIndex, resolvedSrc)}
                    />
                  </div>

                  {/* Right: Instructions */}
                  <div className="step-instruction-col">
                    <div className="step-number-badge">
                      <span>PHASE {currentStep.number}</span>
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
            </>
          )}

          {/* ── MODE 2: INFOGRAPHIC ANATOMY & VARIATIONS VIEW ── */}
          {modalTab !== 'steps' && currentInfographic && (
            <div className="infographic-panel-body">
              <div className="infographic-preview-col">
                <div
                  className="infographic-hero-container"
                  onClick={() => openAnatomyLightbox(currentInfographicIndex)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      openAnatomyLightbox(currentInfographicIndex);
                    }
                  }}
                  title="Click to inspect full-resolution diagram"
                >
                  <img
                    src={currentInfographic.image}
                    alt={currentInfographic.title}
                    className="infographic-full-view"
                  />
                  <button
                    type="button"
                    className="infographic-zoom-btn"
                    onClick={(e) => {
                      e.stopPropagation();
                      openAnatomyLightbox(currentInfographicIndex);
                    }}
                  >
                    <Maximize2 size={15} />
                    <span>Click to Zoom High-Res</span>
                  </button>
                </div>
              </div>

              <div className="infographic-details-col">
                <div className="infographic-header-card">
                  <span className="info-badge-tag">{currentInfographic.badge}</span>
                  <h3>{currentInfographic.title}</h3>
                  <p className="info-subtitle">{currentInfographic.subtitle}</p>
                  <p className="info-summary-text">{currentInfographic.summary}</p>
                </div>

                {/* If this infographic has variations breakdown (like Push-Up Mastery) */}
                {currentInfographic.variations && (
                  <div className="variations-guide-list">
                    <h4>Variations & Targeted Muscle Groups:</h4>
                    <div className="variations-grid">
                      {currentInfographic.variations.map((v, i) => (
                        <div key={i} className="variation-card-box">
                          <div className="var-header">
                            <span className="var-index">{v.number || i + 1}</span>
                            <h5>{v.name}</h5>
                            <span className="var-focus-chip">{v.focus}</span>
                          </div>
                          <p className="var-cue-text">{v.cues}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* If this infographic has target muscles list (like Anatomical Breakdown) */}
                {currentInfographic.targetMuscles && (
                  <div className="anatomy-muscles-card">
                    <h4>Primary Anatomical Callouts:</h4>
                    <ul className="anatomy-bullet-list">
                      {currentInfographic.targetMuscles.map((muscle, idx) => (
                        <li key={idx}>
                          <CheckCircle2 size={14} className="check-bullet" />
                          <span>{muscle}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                <div className="infographic-coaching-callout">
                  <Zap size={15} className="text-amber-400" />
                  <div>
                    <strong>Biomechanical Rule of Thumb:</strong>
                    <p>Keep the shoulder blades protracted at top lockout and depressed down away from ears to protect the rotator cuff.</p>
                  </div>
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
              {exercise.defaultWeight > 0 ? (
                <span className="footer-metric">
                  <Scale size={13} />
                  {exercise.defaultWeight} kg
                </span>
              ) : (
                <span className="footer-metric bodyweight">
                  <Shield size={13} />
                  Bodyweight Protocol
                </span>
              )}
            </div>
            <div className="detail-footer-tip">
              <span>💡 Pro Tip: {exercise.tip}</span>
            </div>
          </div>

        </div>
      </div>

      <ImageLightboxPortal
        isOpen={Boolean(lightboxState)}
        items={lightboxState?.items || []}
        currentIndex={lightboxState?.index || 0}
        onIndexChange={handleLightboxIndexChange}
        onClose={() => setLightboxState(null)}
      />
    </>
  );

  return typeof document !== 'undefined'
    ? createPortal(modalMarkup, document.body)
    : modalMarkup;
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
            videoId={
              exercise.youtubeId ||
              exercise.youtubeUrl?.match(/(?:v=|shorts\/|youtu\.be\/)([^?&/]+)/)?.[1] ||
              'xUm0BiZCWlQ'
            }
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
  const [existingNames,    setExistingNames]    = useState([]);
  const [checkingDup,      setCheckingDup]      = useState(false);
  const [confirmDuplicate, setConfirmDuplicate] = useState(false);
  const [modalError,       setModalError]       = useState('');

  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = ''; };
  }, []);

  // Fetch existing exercises for the currently selected workout plan
  useEffect(() => {
    let active = true;
    setConfirmDuplicate(false);
    setModalError('');

    if (showNewPlanInput || !targetPlanId) {
      setExistingNames([]);
      return () => { active = false; };
    }

    const loadPlanExercises = async () => {
      setCheckingDup(true);
      const { data, error } = await supabase
        .from('exercises')
        .select('name')
        .eq('plan_id', targetPlanId);
      if (!active) return;
      if (!error && Array.isArray(data)) {
        setExistingNames(data.map((row) => (row.name || '').trim().toLowerCase()));
      } else {
        setExistingNames([]);
      }
      setCheckingDup(false);
    };

    loadPlanExercises();
    return () => { active = false; };
  }, [targetPlanId, showNewPlanInput]);

  const normalizedExerciseName = (exercise.name || '').trim().toLowerCase();
  const isDuplicateInPlan =
    !showNewPlanInput &&
    Boolean(targetPlanId) &&
    existingNames.includes(normalizedExerciseName);

  const selectedPlan = plans.find((p) => String(p.id) === String(targetPlanId));

  const handleConfirmAdd = async (e) => {
    e.preventDefault();
    setModalError('');
    let destinationPlanId = targetPlanId;

    if (showNewPlanInput && newPlanName.trim()) {
      setSaving(true);
      const { data: newPlan, error: planError } = await onQuickCreatePlan(newPlanName.trim());
      if (planError || !newPlan) {
        setSaving(false);
        setModalError('Could not create new plan. Please try again.');
        return;
      }
      destinationPlanId = newPlan.id;
    }

    if (!destinationPlanId) {
      setModalError('Please select or create a workout plan.');
      return;
    }

    // Authoritative duplicate check against the destination plan before inserting
    if (!showNewPlanInput && !confirmDuplicate) {
      setSaving(true);
      const { data: latestExercises, error: checkErr } = await supabase
        .from('exercises')
        .select('name')
        .eq('plan_id', destinationPlanId);

      if (!checkErr && Array.isArray(latestExercises)) {
        const latestNames = latestExercises.map((row) => (row.name || '').trim().toLowerCase());
        setExistingNames(latestNames);
        if (latestNames.includes(normalizedExerciseName)) {
          setSaving(false);
          setModalError(
            `"${exercise.name}" is already in "${selectedPlan?.name || 'this workout plan'}". Check "Add duplicate anyway" above or choose another plan.`
          );
          return;
        }
      }
    }

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
      setModalError('Error adding exercise: ' + error.message);
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

          {isDuplicateInPlan && (
            <div className="modal-duplicate-warning" role="alert">
              <div className="warning-banner-top">
                <AlertTriangle size={17} className="warning-icon" />
                <div>
                  <strong>Already in this exercise list</strong>
                  <p>
                    &ldquo;{exercise.name}&rdquo; is already added to{' '}
                    <strong>{selectedPlan?.name || 'this workout plan'}</strong>.
                  </p>
                </div>
              </div>
              <label className="duplicate-override-check">
                <input
                  type="checkbox"
                  checked={confirmDuplicate}
                  onChange={(e) => {
                    setConfirmDuplicate(e.target.checked);
                    setModalError('');
                  }}
                />
                <span>Add duplicate anyway</span>
              </label>
            </div>
          )}

          {modalError && (
            <div className="modal-error-banner" role="alert">
              <AlertTriangle size={15} />
              <span>{modalError}</span>
            </div>
          )}

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
              disabled={saving || checkingDup || (!targetPlanId && !newPlanName.trim())}
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
  const [detailModalState, setDetailModalState] = useState(null); // { exercise, initialTab }
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
              onClick={() => setDetailModalState({ exercise: ex, initialTab: 'steps' })}
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
                  {ex.infographics?.length > 0 && (
                    <span className="infographic-pill-chip">
                      <Sparkles size={10} />
                      <span>Anatomy & Variations</span>
                    </span>
                  )}
                </div>
                {/* Click hint overlay */}
                <div className="card-click-hint">
                  <Eye size={16} />
                  <span>View Guide & Anatomy</span>
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
                  {/* Anatomy / Infographic Guide Button */}
                  {ex.infographics?.length > 0 && (
                    <button
                      className="btn-infographic-guide"
                      onClick={e => {
                        e.stopPropagation();
                        setDetailModalState({ exercise: ex, initialTab: ex.infographics[0].id });
                      }}
                      title="View anatomical breakdown and 4 variations guide"
                    >
                      <Activity size={13} />
                      <span>Anatomy ({ex.infographics.length})</span>
                    </button>
                  )}

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
      {detailModalState?.exercise && (
        <ExerciseDetailModal
          exercise={detailModalState.exercise}
          initialTab={detailModalState.initialTab}
          onClose={() => setDetailModalState(null)}
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
