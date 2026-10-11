import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import { 
  Dumbbell, 
  Plus, 
  X, 
  Target, 
  Star, 
  Trash2, 
  Layers, 
  ChevronRight, 
  CheckCircle2, 
  Sparkles,
  BookOpen,
  CalendarCheck
} from 'lucide-react';
import ExerciseList from './ExerciseList';
import WorkoutRating from './WorkoutRating';
import ExerciseBank from './ExerciseBank';
import './Workouts.css';

const DIFFICULTY = ['Beginner', 'Intermediate', 'Advanced'];
const empty = { name: '', description: '', difficulty: 'Beginner', goal: '' };

export default function Workouts() {
  const { user } = useAuth();

  /* ── State ── */
  const [currentView,  setCurrentView] = useState('library'); // 'library' | 'my-plans'
  const [plans,        setPlans]       = useState([]);
  const [loading,      setLoading]     = useState(true);
  const [showForm,     setShowForm]    = useState(false);
  const [form,         setForm]        = useState(empty);
  const [errors,       setErrors]      = useState({});
  const [saving,       setSaving]      = useState(false);
  const [activePlan,   setActivePlan]  = useState(null); // plan whose exercises are shown
  const [ratingPlan,   setRatingPlan]  = useState(null); // plan to rate
  const [feedback,     setFeedback]    = useState('');
  const [ratingsMap,   setRatingsMap]  = useState({});

  /* ── Fetch plans ── */
  const fetchPlans = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('workout_plans')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (!error) {
      setPlans(data || []);
      const planIds = (data || []).map(p => p.id);
      if (planIds.length > 0) {
        const { data: ratingData } = await supabase
          .from('workout_ratings')
          .select('plan_id, rating')
          .in('plan_id', planIds);
        
        if (ratingData) {
          const map = {};
          ratingData.forEach(r => {
            if (!map[r.plan_id]) map[r.plan_id] = { sum: 0, count: 0 };
            map[r.plan_id].sum += r.rating;
            map[r.plan_id].count += 1;
          });
          setRatingsMap(map);
        }
      }
    }
    setLoading(false);
  }, [user.id]);

  useEffect(() => { fetchPlans(); }, [fetchPlans]);

  /* ── Validation ── */
  const validate = () => {
    const e = {};
    if (!form.name.trim())       e.name       = 'Workout plan name is required.';
    if (form.name.length > 60)   e.name       = 'Maximum 60 characters.';
    if (!form.difficulty)        e.difficulty = 'Please select a difficulty level.';
    if (!form.goal.trim())       e.goal       = 'Goal is required.';
    return e;
  };

  /* ── Submit ── */
  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) { setErrors(errs); return; }
    setSaving(true);
    const { error } = await supabase.from('workout_plans').insert({
      user_id:     user.id,
      name:        form.name.trim(),
      description: form.description.trim(),
      difficulty:  form.difficulty,
      goal:        form.goal.trim(),
    });
    setSaving(false);
    if (error) { 
      setFeedback('Error saving workout plan. Please try again.'); 
      return; 
    }
    setFeedback('Workout plan created successfully!');
    setForm(empty);
    setErrors({});
    setShowForm(false);
    fetchPlans();
    setTimeout(() => setFeedback(''), 3000);
  };

  /* ── Quick create plan from Exercise Library modal ── */
  const handleQuickCreatePlan = async (name) => {
    const { data, error } = await supabase
      .from('workout_plans')
      .insert({
        user_id:     user.id,
        name:        name,
        description: 'Created from Exercise Library',
        difficulty:  'Beginner',
        goal:        'Strength & Hypertrophy'
      })
      .select()
      .single();

    if (!error && data) {
      await fetchPlans();
    }
    return { data, error };
  };

  /* ── Delete plan ── */
  const handleDelete = async (id) => {
    if (!window.confirm('Delete this workout plan and all its exercises?')) return;
    await supabase.from('workout_plans').delete().eq('id', id);
    if (activePlan?.id === id) setActivePlan(null);
    if (ratingPlan?.id === id) setRatingPlan(null);
    fetchPlans();
  };

  const handleChange = (field, val) => {
    setForm(f => ({ ...f, [field]: val }));
    setErrors(e => ({ ...e, [field]: '' }));
  };

  return (
    <div className="workouts-page">
      {/* ── Top Header ── */}
      <div className="workouts-header">
        <div className="workouts-header-title">
          <div className="title-icon-badge">
            <Dumbbell size={22} />
          </div>
          <div>
            <h2>Workout Plans & Exercises</h2>
            <p>Explore exercises with machines and equipment photos, select by difficulty level, and build your routine.</p>
          </div>
        </div>

        {/* View Switcher Tabs */}
        <div className="view-switcher-group">
          <button
            className={`view-tab-btn ${currentView === 'library' ? 'active' : ''}`}
            onClick={() => setCurrentView('library')}
          >
            <BookOpen size={16} />
            <span>Exercise Library</span>
          </button>

          <button
            className={`view-tab-btn ${currentView === 'my-plans' ? 'active' : ''}`}
            onClick={() => setCurrentView('my-plans')}
          >
            <CalendarCheck size={16} />
            <span>My Workout Plans ({plans.length})</span>
          </button>
        </div>
      </div>

      {feedback && (
        <div className="pro-feedback-banner">
          <CheckCircle2 size={16} />
          <span>{feedback}</span>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════
          VIEW 1: EXERCISE LIBRARY (Browse by Body Section & Level)
         ═══════════════════════════════════════════════════════════ */}
      {currentView === 'library' && (
        <ExerciseBank
          plans={plans}
          onExerciseAdded={fetchPlans}
          onQuickCreatePlan={handleQuickCreatePlan}
        />
      )}

      {/* ═══════════════════════════════════════════════════════════
          VIEW 2: MY WORKOUT PLANS
         ═══════════════════════════════════════════════════════════ */}
      {currentView === 'my-plans' && (
        <div className="my-plans-container">
          <div className="my-plans-header-actions">
            <div>
              <h3>Your Saved Workout Plans</h3>
              <p>Manage exercise lists, reps, and weights for each routine.</p>
            </div>

            <button 
              className="btn-create-protocol" 
              onClick={() => { setShowForm(s => !s); setErrors({}); }}
            >
              {showForm ? <X size={16} /> : <Plus size={16} />}
              <span>{showForm ? 'Cancel' : 'New Workout Plan'}</span>
            </button>
          </div>

          {/* ── Create Plan Drawer Form ── */}
          {showForm && (
            <div className="plan-form-modal">
              <div className="form-card-header">
                <h3>Create New Workout Plan</h3>
                <span className="form-sub">Define training split and target goals</span>
              </div>

              <form onSubmit={handleSubmit} noValidate>
                <div className="form-group">
                  <label>Plan Name *</label>
                  <input
                    type="text"
                    placeholder="e.g., Push Day (Chest & Triceps), 3-Day Full Body"
                    value={form.name}
                    onChange={e => handleChange('name', e.target.value)}
                    className={errors.name ? 'pro-input input-error' : 'pro-input'}
                    maxLength={60}
                  />
                  {errors.name && <span className="pro-error-msg">{errors.name}</span>}
                </div>

                <div className="form-group">
                  <label>Overview & Focus</label>
                  <textarea
                    placeholder="Describe weekly frequency, focus areas, and recovery intervals..."
                    value={form.description}
                    onChange={e => handleChange('description', e.target.value)}
                    className="pro-input pro-textarea"
                    rows={2}
                  />
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label>Difficulty Level *</label>
                    <select
                      value={form.difficulty}
                      onChange={e => handleChange('difficulty', e.target.value)}
                      className={errors.difficulty ? 'pro-input input-error' : 'pro-input'}
                    >
                      {DIFFICULTY.map(d => <option key={d} value={d}>{d}</option>)}
                    </select>
                    {errors.difficulty && <span className="pro-error-msg">{errors.difficulty}</span>}
                  </div>

                  <div className="form-group">
                    <label>Target Goal *</label>
                    <input
                      type="text"
                      placeholder="e.g., Muscle Growth, Fat Loss, Strength"
                      value={form.goal}
                      onChange={e => handleChange('goal', e.target.value)}
                      className={errors.goal ? 'pro-input input-error' : 'pro-input'}
                    />
                    {errors.goal && <span className="pro-error-msg">{errors.goal}</span>}
                  </div>
                </div>

                <div className="form-actions">
                  <button type="submit" className="pro-btn-submit" disabled={saving}>
                    <Sparkles size={16} />
                    <span>{saving ? 'Creating Plan...' : 'Save Plan'}</span>
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* ── Plans List ── */}
          {loading ? (
            <div className="pro-loading-state">
              <div className="loading-spinner" />
              <span>Loading your workout plans...</span>
            </div>
          ) : plans.length === 0 ? (
            <div className="pro-empty-state">
              <div className="empty-icon-circle">
                <Dumbbell size={28} />
              </div>
              <h3>No Workout Plans Yet</h3>
              <p>You can create a plan here, or switch to the Exercise Library tab to pick exercises and add them directly!</p>
              <div className="empty-actions-row">
                <button className="pro-btn-submit" onClick={() => setShowForm(true)}>
                  <Plus size={16} />
                  <span>Create Plan</span>
                </button>
                <button className="pro-btn-secondary" onClick={() => setCurrentView('library')}>
                  <BookOpen size={16} />
                  <span>Browse Exercise Library</span>
                </button>
              </div>
            </div>
          ) : (
            <div className="plans-grid">
              {plans.map(plan => {
                const stats = ratingsMap[plan.id];
                const avg = stats ? (stats.sum / stats.count).toFixed(1) : null;
                const isExercisesActive = activePlan?.id === plan.id;
                const isRatingActive = ratingPlan?.id === plan.id;

                return (
                  <div
                    key={plan.id}
                    className={`pro-plan-card ${isExercisesActive ? 'card-active' : ''}`}
                  >
                    <div className="plan-card-top">
                      <div className="plan-badge-row">
                        <span className={`difficulty-badge badge-${plan.difficulty?.toLowerCase()}`}>
                          {plan.difficulty}
                        </span>
                        {avg && (
                          <span className="rating-pill">
                            <Star size={12} className="star-icon filled" />
                            <span>{avg}</span>
                            <span className="review-count">({stats.count})</span>
                          </span>
                        )}
                      </div>
                      <button
                        className="btn-trash"
                        onClick={() => handleDelete(plan.id)}
                        title="Delete Plan"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>

                    <h4 className="plan-title">{plan.name}</h4>
                    {plan.description && <p className="plan-desc">{plan.description}</p>}
                    
                    <div className="plan-goal-chip">
                      <Target size={14} className="goal-icon" />
                      <span>{plan.goal}</span>
                    </div>

                    <div className="card-actions-bar">
                      <button
                        className={`btn-action-primary ${isExercisesActive ? 'active' : ''}`}
                        onClick={() => setActivePlan(isExercisesActive ? null : plan)}
                      >
                        <Layers size={15} />
                        <span>{isExercisesActive ? 'Hide Exercises' : 'View & Manage Exercises'}</span>
                      </button>

                      <button
                        className={`btn-action-ghost ${isRatingActive ? 'active' : ''}`}
                        onClick={() => setRatingPlan(isRatingActive ? null : plan)}
                      >
                        <Star size={15} />
                        <span>Rate</span>
                      </button>
                    </div>

                    {isRatingActive && (
                      <div className="plan-rating-drawer">
                        <WorkoutRating planId={plan.id} user={user} />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {/* ── Exercise List for selected plan ── */}
          {activePlan && (
            <div className="exercise-manager-section">
              <ExerciseList plan={activePlan} muscleGroups={[
                'Chest', 'Back', 'Shoulders', 'Biceps', 'Triceps',
                'Core', 'Legs', 'Glutes', 'Cardio', 'Full Body',
              ]} />
            </div>
          )}
        </div>
      )}
    </div>
  );
}
