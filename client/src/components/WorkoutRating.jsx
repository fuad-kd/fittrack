import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Star, Send, Sparkles, CheckCircle2, User } from 'lucide-react';
import './WorkoutRating.scss';

const WorkoutRating = ({ planId, user }) => {
  const [ratings, setRatings] = useState([]);
  const [myRating, setMyRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [review, setReview] = useState('');
  const [average, setAverage] = useState(0);
  const [loading, setLoading] = useState(false);
  const [feedback, setFeedback] = useState('');

  useEffect(() => {
    fetchRatings();
  }, [planId]);

  const fetchRatings = async () => {
    const { data } = await supabase
      .from('workout_ratings')
      .select('*')
      .eq('plan_id', planId)
      .order('created_at', { ascending: false });

    if (data) {
      setRatings(data);
      if (data.length > 0) {
        const sum = data.reduce((acc, curr) => acc + curr.rating, 0);
        setAverage((sum / data.length).toFixed(1));
      } else {
        setAverage(0);
      }
      
      if (user) {
        const mine = data.find(r => r.user_id === user.id);
        if (mine) {
          setMyRating(mine.rating);
          setReview(mine.review || '');
        }
      }
    }
  };

  const handleRatingSubmit = async (e) => {
    e.preventDefault();
    if (!myRating) return;
    setLoading(true);

    const username = user?.user_metadata?.username || user?.email?.split('@')[0] || 'Athlete';
    const { error } = await supabase
      .from('workout_ratings')
      .upsert({
        plan_id: planId,
        user_id: user.id,
        username,
        rating: myRating,
        review: review.trim() || null,
        created_at: new Date().toISOString()
      }, { onConflict: 'plan_id,user_id' });

    setLoading(false);
    if (!error) {
      setFeedback('Review submitted successfully!');
      fetchRatings();
      setTimeout(() => setFeedback(''), 3000);
    }
  };

  return (
    <div className="workout-rating-panel">
      <div className="rating-summary-header">
        <div className="avg-display">
          <div className="stars-cluster">
            {[1, 2, 3, 4, 5].map(star => (
              <Star
                key={star}
                size={18}
                className={`star-icon ${star <= Math.round(average) ? 'active' : ''}`}
              />
            ))}
          </div>
          <span className="avg-number">{average}</span>
          <span className="rating-count">({ratings.length} {ratings.length === 1 ? 'review' : 'reviews'})</span>
        </div>
      </div>

      {feedback && (
        <div className="rating-feedback-banner">
          <CheckCircle2 size={14} />
          <span>{feedback}</span>
        </div>
      )}

      {/* ── Interactive Rate Form ── */}
      <form onSubmit={handleRatingSubmit} className="rate-submission-form">
        <div className="interactive-stars-row">
          <span className="rate-prompt">Your Assessment:</span>
          <div className="stars-input-group">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                type="button"
                key={star}
                className="star-click-btn"
                onMouseEnter={() => setHoverRating(star)}
                onMouseLeave={() => setHoverRating(0)}
                onClick={() => setMyRating(star)}
              >
                <Star
                  size={20}
                  className={`star-svg ${(hoverRating || myRating) >= star ? 'selected' : ''}`}
                />
              </button>
            ))}
          </div>
        </div>

        <div className="review-input-row">
          <textarea
            placeholder="Share feedback on intensity, fatigue levels, or movement progression..."
            value={review}
            onChange={(e) => setReview(e.target.value)}
            rows={2}
          />
          <button type="submit" className="btn-submit-review" disabled={loading || !myRating}>
            <Send size={14} />
            <span>{loading ? 'Posting...' : 'Save Review'}</span>
          </button>
        </div>
      </form>

      {/* ── Community Reviews List ── */}
      {ratings.length > 0 && (
        <div className="existing-reviews-list">
          <span className="reviews-subheading">Athlete Feedback</span>
          {ratings.map(r => (
            <div key={r.id} className="single-review-card">
              <div className="review-card-top">
                <div className="reviewer-info">
                  <div className="reviewer-avatar">
                    {(r.username || 'A')[0].toUpperCase()}
                  </div>
                  <span className="reviewer-name">@{r.username}</span>
                </div>

                <div className="review-stars-static">
                  {[1, 2, 3, 4, 5].map(s => (
                    <Star
                      key={s}
                      size={12}
                      className={`micro-star ${s <= r.rating ? 'active' : ''}`}
                    />
                  ))}
                </div>
              </div>

              {r.review && <p className="review-body-text">{r.review}</p>}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default WorkoutRating;
