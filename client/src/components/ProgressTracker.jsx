import React, { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import { 
  TrendingUp, 
  Scale, 
  Flame, 
  Ruler, 
  Camera, 
  Plus, 
  Trash2, 
  X, 
  Sparkles, 
  CheckCircle2, 
  Image as ImageIcon,
  Calendar,
  Activity
} from 'lucide-react';
import './ProgressTracker.css';

const emptyForm = {
  entry_date: new Date().toISOString().split('T')[0],
  weight_kg:  '',
  calories:   '',
  chest_cm:   '',
  waist_cm:   '',
  hips_cm:    '',
  arms_cm:    '',
  notes:      '',
};

export default function ProgressTracker() {
  const { user } = useAuth();
  const fileRef = useRef(null);

  const [entries,      setEntries]      = useState([]);
  const [loading,      setLoading]      = useState(true);
  const [saving,       setSaving]       = useState(false);
  const [showForm,     setShowForm]     = useState(false);
  const [form,         setForm]         = useState(emptyForm);
  const [errors,       setErrors]       = useState({});
  const [feedback,     setFeedback]     = useState('');
  const [photoFile,    setPhotoFile]    = useState(null);
  const [photoPreview, setPhotoPreview] = useState('');
  const [previewModal, setPreviewModal] = useState(null); // photo URL for lightbox

  /* ── Fetch entries ── */
  const fetchEntries = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('progress_entries')
      .select('*')
      .eq('user_id', user.id)
      .order('entry_date', { ascending: false });
    if (!error) setEntries(data || []);
    setLoading(false);
  }, [user.id]);

  useEffect(() => { fetchEntries(); }, [fetchEntries]);

  /* ── Photo preview ── */
  const handlePhotoChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      setErrors(err => ({ ...err, photo: 'Photo must be under 5 MB.' }));
      return;
    }
    setPhotoFile(file);
    setPhotoPreview(URL.createObjectURL(file));
    setErrors(err => ({ ...err, photo: '' }));
  };

  /* ── Validation ── */
  const validate = () => {
    const e = {};
    if (!form.entry_date) e.entry_date = 'Date is required.';
    const today = new Date().toISOString().split('T')[0];
    if (form.entry_date > today) e.entry_date = 'Date cannot be in the future.';

    const numCheck = (val, field, min, max, name) => {
      if (val !== '') {
        const n = Number(val);
        if (isNaN(n) || n < min || n > max) e[field] = `${name} must be between ${min} and ${max}.`;
      }
    };

    numCheck(form.weight_kg, 'weight_kg', 20, 500, 'Weight');
    numCheck(form.calories,  'calories',  500, 15000, 'Calories');
    numCheck(form.chest_cm,  'chest_cm',  30, 250, 'Chest');
    numCheck(form.waist_cm,  'waist_cm',  30, 250, 'Waist');
    numCheck(form.hips_cm,   'hips_cm',   30, 250, 'Hips');
    numCheck(form.arms_cm,   'arms_cm',   15, 100, 'Arms');

    const hasAny = form.weight_kg || form.calories || form.chest_cm ||
                   form.waist_cm  || form.hips_cm  || form.arms_cm  ||
                   form.notes     || photoFile;
    if (!hasAny) e.general = 'Please enter at least one metric or upload a photo.';

    return e;
  };

  /* ── Submit ── */
  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) { setErrors(errs); return; }

    setSaving(true);
    let photo_url = null;

    if (photoFile) {
      const ext = photoFile.name.split('.').pop();
      const path = `${user.id}/${Date.now()}.${ext}`;
      const { error: upErr } = await supabase.storage
        .from('progress-photos')
        .upload(path, photoFile, { upsert: true });

      if (!upErr) {
        const { data: urlData } = supabase.storage
          .from('progress-photos')
          .getPublicUrl(path);
        photo_url = urlData?.publicUrl || null;
      }
    }

    const { error } = await supabase.from('progress_entries').insert({
      user_id:    user.id,
      entry_date: form.entry_date,
      weight_kg:  form.weight_kg !== '' ? Number(form.weight_kg) : null,
      calories:   form.calories  !== '' ? Number(form.calories)  : null,
      chest_cm:   form.chest_cm  !== '' ? Number(form.chest_cm)  : null,
      waist_cm:   form.waist_cm  !== '' ? Number(form.waist_cm)  : null,
      hips_cm:    form.hips_cm   !== '' ? Number(form.hips_cm)   : null,
      arms_cm:    form.arms_cm   !== '' ? Number(form.arms_cm)   : null,
      notes:      form.notes.trim() || null,
      photo_url,
    });

    setSaving(false);
    if (error) {
      setFeedback('Error saving progress entry. Please try again.');
      return;
    }

    setFeedback('Progress metrics recorded successfully!');
    setForm(emptyForm);
    setPhotoFile(null);
    setPhotoPreview('');
    if (fileRef.current) fileRef.current.value = '';
    setErrors({});
    setShowForm(false);
    fetchEntries();
    setTimeout(() => setFeedback(''), 3000);
  };

  /* ── Delete entry ── */
  const handleDelete = async (id) => {
    if (!window.confirm('Delete this progress record?')) return;
    await supabase.from('progress_entries').delete().eq('id', id);
    fetchEntries();
  };

  const handleChange = (field, val) => {
    setForm(f => ({ ...f, [field]: val }));
    setErrors(e => ({ ...e, [field]: '', general: '' }));
  };

  const latest = entries[0] || null;

  return (
    <div className="progress-tracker-page">
      {/* ── Header ── */}
      <div className="pt-header">
        <div className="pt-title-group">
          <div className="pt-icon-box">
            <TrendingUp size={22} />
          </div>
          <div>
            <h2>Body Composition & Metrics</h2>
            <p>Monitor physical transformations, caliper measurements, and caloric baselines.</p>
          </div>
        </div>

        <button
          className="btn-log-metrics"
          onClick={() => { setShowForm(s => !s); setErrors({}); }}
        >
          {showForm ? <X size={16} /> : <Plus size={16} />}
          <span>{showForm ? 'Cancel' : 'Record Metrics'}</span>
        </button>
      </div>

      {feedback && (
        <div className="pt-feedback-banner">
          <CheckCircle2 size={16} />
          <span>{feedback}</span>
        </div>
      )}

      {/* ── Current Benchmark Stat Cards ── */}
      {latest && (
        <div className="pt-kpi-grid">
          <div className="pt-kpi-card gold">
            <div className="pt-kpi-top">
              <span>Current Weight</span>
              <Scale size={18} />
            </div>
            <div className="pt-kpi-num">
              {latest.weight_kg ? `${latest.weight_kg} kg` : '—'}
            </div>
            <span className="pt-kpi-date">Recorded {latest.entry_date}</span>
          </div>

          <div className="pt-kpi-card blue">
            <div className="pt-kpi-top">
              <span>Daily Caloric Target</span>
              <Flame size={18} />
            </div>
            <div className="pt-kpi-num">
              {latest.calories ? `${latest.calories} kcal` : '—'}
            </div>
            <span className="pt-kpi-date">Active nutrition plan</span>
          </div>

          <div className="pt-kpi-card emerald">
            <div className="pt-kpi-top">
              <span>Core Waist</span>
              <Ruler size={18} />
            </div>
            <div className="pt-kpi-num">
              {latest.waist_cm ? `${latest.waist_cm} cm` : '—'}
            </div>
            <span className="pt-kpi-date">Girth measurement</span>
          </div>

          <div className="pt-kpi-card violet">
            <div className="pt-kpi-top">
              <span>Chest & Arms</span>
              <Activity size={18} />
            </div>
            <div className="pt-kpi-num">
              {latest.chest_cm ? `${latest.chest_cm} cm` : '—'}
              <span className="pt-kpi-split"> / {latest.arms_cm ? `${latest.arms_cm} cm` : '—'}</span>
            </div>
            <span className="pt-kpi-date">Upper body metrics</span>
          </div>
        </div>
      )}

      {/* ── Add Entry Form Drawer ── */}
      {showForm && (
        <form className="pt-form-card" onSubmit={handleSubmit} noValidate>
          <div className="pt-form-header">
            <h4>Log Body Metrics & Calipers</h4>
            <span>Enter updated measurements and optional progress photograph</span>
          </div>

          {errors.general && (
            <div className="pt-alert-error">{errors.general}</div>
          )}

          <div className="pt-form-grid">
            <div className="pt-form-group">
              <label>Log Date *</label>
              <input
                type="date"
                value={form.entry_date}
                max={new Date().toISOString().split('T')[0]}
                onChange={e => handleChange('entry_date', e.target.value)}
                className={errors.entry_date ? 'pt-input input-error' : 'pt-input'}
              />
              {errors.entry_date && <span className="pt-error-msg">{errors.entry_date}</span>}
            </div>

            <div className="pt-form-group">
              <label>Body Weight (kg)</label>
              <input
                type="number"
                step="0.1"
                placeholder="e.g. 78.5"
                value={form.weight_kg}
                onChange={e => handleChange('weight_kg', e.target.value)}
                className={errors.weight_kg ? 'pt-input input-error' : 'pt-input'}
              />
              {errors.weight_kg && <span className="pt-error-msg">{errors.weight_kg}</span>}
            </div>

            <div className="pt-form-group">
              <label>Caloric Target (kcal)</label>
              <input
                type="number"
                placeholder="e.g. 2400"
                value={form.calories}
                onChange={e => handleChange('calories', e.target.value)}
                className={errors.calories ? 'pt-input input-error' : 'pt-input'}
              />
              {errors.calories && <span className="pt-error-msg">{errors.calories}</span>}
            </div>
          </div>

          {/* Measurements Row */}
          <div className="pt-measurements-row">
            <div className="pt-form-group">
              <label>Chest (cm)</label>
              <input
                type="number"
                step="0.1"
                placeholder="e.g. 102"
                value={form.chest_cm}
                onChange={e => handleChange('chest_cm', e.target.value)}
                className="pt-input"
              />
            </div>

            <div className="pt-form-group">
              <label>Waist (cm)</label>
              <input
                type="number"
                step="0.1"
                placeholder="e.g. 82"
                value={form.waist_cm}
                onChange={e => handleChange('waist_cm', e.target.value)}
                className="pt-input"
              />
            </div>

            <div className="pt-form-group">
              <label>Hips (cm)</label>
              <input
                type="number"
                step="0.1"
                placeholder="e.g. 96"
                value={form.hips_cm}
                onChange={e => handleChange('hips_cm', e.target.value)}
                className="pt-input"
              />
            </div>

            <div className="pt-form-group">
              <label>Arms (cm)</label>
              <input
                type="number"
                step="0.1"
                placeholder="e.g. 39.5"
                value={form.arms_cm}
                onChange={e => handleChange('arms_cm', e.target.value)}
                className="pt-input"
              />
            </div>
          </div>

          {/* Photo Upload Zone */}
          <div className="pt-photo-section">
            <label className="photo-label">Progress Photograph (Max 5 MB)</label>
            <div
              className={`pt-dropzone ${photoPreview ? 'has-preview' : ''}`}
              onClick={() => fileRef.current?.click()}
            >
              <input
                ref={fileRef}
                type="file"
                accept="image/*"
                onChange={handlePhotoChange}
                style={{ display: 'none' }}
              />
              {photoPreview ? (
                <div className="preview-container">
                  <img src={photoPreview} alt="Preview" className="upload-preview-img" />
                  <button
                    type="button"
                    className="btn-remove-photo"
                    onClick={(e) => {
                      e.stopPropagation();
                      setPhotoFile(null);
                      setPhotoPreview('');
                    }}
                  >
                    <X size={14} />
                  </button>
                </div>
              ) : (
                <div className="dropzone-placeholder">
                  <Camera size={26} className="camera-icon" />
                  <span>Click to select high-resolution progress photo</span>
                  <span className="dropzone-sub">Supports JPEG, PNG, WEBP</span>
                </div>
              )}
            </div>
            {errors.photo && <span className="pt-error-msg">{errors.photo}</span>}
          </div>

          <div className="pt-form-group">
            <label>Physique & Conditioning Notes</label>
            <textarea
              placeholder="e.g. Improved vascularity, lower body fat visible in mirror, digestion optimal..."
              value={form.notes}
              onChange={e => handleChange('notes', e.target.value)}
              rows={2}
              className="pt-input pt-textarea"
            />
          </div>

          <div className="pt-form-footer">
            <button type="submit" className="pt-btn-submit" disabled={saving}>
              <Sparkles size={16} />
              <span>{saving ? 'Uploading & Saving...' : 'Save Metrics'}</span>
            </button>
          </div>
        </form>
      )}

      {/* ── Metric History Table ── */}
      <div className="pt-history-section">
        <div className="history-header">
          <h3>Progress History & Timeline</h3>
          <span>Detailed chronological breakdown</span>
        </div>

        {loading ? (
          <div className="pt-loading-box">
            <div className="loading-spinner" />
            <span>Loading metric records...</span>
          </div>
        ) : entries.length === 0 ? (
          <div className="pt-empty-box">
            <TrendingUp size={32} className="empty-icon" />
            <p>No body metrics tracked yet. Click "Record Metrics" above to start logging your physique benchmarks.</p>
          </div>
        ) : (
          <div className="table-responsive-container">
            <table className="pt-table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Weight</th>
                  <th>Calories</th>
                  <th>Chest</th>
                  <th>Waist</th>
                  <th>Hips</th>
                  <th>Arms</th>
                  <th>Photo</th>
                  <th>Notes</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {entries.map(entry => (
                  <tr key={entry.id}>
                    <td className="font-semibold text-white">{entry.entry_date}</td>
                    <td>{entry.weight_kg ? `${entry.weight_kg} kg` : '—'}</td>
                    <td>{entry.calories ? `${entry.calories} kcal` : '—'}</td>
                    <td>{entry.chest_cm ? `${entry.chest_cm} cm` : '—'}</td>
                    <td>{entry.waist_cm ? `${entry.waist_cm} cm` : '—'}</td>
                    <td>{entry.hips_cm ? `${entry.hips_cm} cm` : '—'}</td>
                    <td>{entry.arms_cm ? `${entry.arms_cm} cm` : '—'}</td>
                    <td>
                      {entry.photo_url ? (
                        <button
                          className="btn-photo-thumb"
                          onClick={() => setPreviewModal(entry.photo_url)}
                          title="View Photo"
                        >
                          <img src={entry.photo_url} alt="Progress thumbnail" />
                        </button>
                      ) : (
                        <span className="text-muted">—</span>
                      )}
                    </td>
                    <td className="notes-col" title={entry.notes || ''}>
                      {entry.notes || '—'}
                    </td>
                    <td>
                      <button
                        className="btn-trash-row"
                        onClick={() => handleDelete(entry.id)}
                        title="Delete Entry"
                      >
                        <Trash2 size={15} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ── Photo Lightbox Modal ── */}
      {previewModal && (
        <div className="lightbox-backdrop" onClick={() => setPreviewModal(null)}>
          <div className="lightbox-content" onClick={e => e.stopPropagation()}>
            <img src={previewModal} alt="Progress View" className="lightbox-img" />
            <button className="btn-close-lightbox" onClick={() => setPreviewModal(null)}>
              <X size={18} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
