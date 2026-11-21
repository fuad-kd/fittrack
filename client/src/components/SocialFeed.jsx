import React, { useState, useEffect, useRef, useCallback } from 'react';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import gsap from 'gsap';
import {
  Users,
  Heart,
  ThumbsDown,
  MessageSquare,
  Image as ImageIcon,
  Send,
  ChevronLeft,
  ChevronRight,
  X,
  Loader2,
  AlertCircle
} from 'lucide-react';
import './SocialFeed.scss';

const POSTS_SELECT_QUERY =
  '*, profiles:user_id ( username, avatar_url ), post_comments(*, profiles:user_id ( username, avatar_url ))';

const SocialFeed = ({ user, profile }) => {
  const [posts, setPosts] = useState([]);
  const [content, setContent] = useState('');
  const [mediaFile, setMediaFile] = useState(null);
  const [mediaPreview, setMediaPreview] = useState(null);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [openComments, setOpenComments] = useState({});
  const [commentInputs, setCommentInputs] = useState({});
  const [reactionPending, setReactionPending] = useState({});
  const [commentSubmitting, setCommentSubmitting] = useState({});
  const [feedError, setFeedError] = useState('');
  const postsPerPage = 5;
  const fileInputRef = useRef(null);
  const lastAnimatedPageRef = useRef(0);

  const currentUsername =
    profile?.username ||
    user?.user_metadata?.username ||
    user?.email?.split('@')[0] ||
    'athlete';

  const currentAvatarUrl = profile?.avatar_url || null;

  const fetchPosts = useCallback(async () => {
    setFeedError('');
    const { data, error } = await supabase
      .from('posts')
      .select(POSTS_SELECT_QUERY)
      .order('created_at', { ascending: false })
      .range((page - 1) * postsPerPage, page * postsPerPage - 1);

    if (error) {
      setFeedError(error.message || 'Failed to load community posts.');
      return;
    }

    const rawPosts = data || [];
    const postIds = rawPosts.map((p) => p.id);

    let reactionsList = [];
    let reactionsFetchFailed = false;

    if (postIds.length > 0) {
      const { data: reactionsData, error: reactionsError } = await supabase
        .from('post_reactions')
        .select('id, post_id, user_id, reaction_type')
        .in('post_id', postIds);

      if (reactionsError) {
        reactionsFetchFailed = true;
        console.warn('Could not fetch post_reactions:', reactionsError.message);
      } else {
        reactionsList = reactionsData || [];
      }
    }

    const formattedPosts = rawPosts.map((post) => {
      const postReactions = reactionsList.filter((r) => String(r.post_id) === String(post.id));
      const userReactionRow = user
        ? postReactions.find((r) => String(r.user_id) === String(user.id))
        : null;

      const likesCount =
        isSupabaseConfigured && !reactionsFetchFailed
          ? postReactions.filter((r) => r.reaction_type === 'like').length
          : post.likes_count || 0;

      const dislikesCount =
        isSupabaseConfigured && !reactionsFetchFailed
          ? postReactions.filter((r) => r.reaction_type === 'dislike').length
          : post.dislikes_count || 0;

      return {
        ...post,
        likes_count: likesCount,
        dislikes_count: dislikesCount,
        userReaction: userReactionRow ? userReactionRow.reaction_type : null,
        comments: post.post_comments
          ? [...post.post_comments].sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
          : [],
      };
    });

    lastAnimatedPageRef.current = 0;
    setPosts(formattedPosts);
  }, [page, user]);

  useEffect(() => {
    fetchPosts();

    // Realtime comments subscription
    const channel = supabase
      .channel('realtime-post-comments')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'post_comments' }, (payload) => {
        setPosts((current) =>
          current.map((post) => {
            if (post.id === payload.new.post_id) {
              const existing = post.comments || [];
              if (!existing.some((c) => c.id === payload.new.id)) {
                return { ...post, comments: [payload.new, ...existing] };
              }
            }
            return post;
          })
        );
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchPosts]);

  // Animate cards only when a new page of posts loads (never on likes, comments, or optimistic posts)
  useEffect(() => {
    if (posts.length > 0 && lastAnimatedPageRef.current !== page) {
      lastAnimatedPageRef.current = page;
      gsap.from('.social-post-card', {
        opacity: 0,
        y: 20,
        duration: 0.35,
        stagger: 0.08,
        ease: 'power2.out',
      });
    }
  }, [posts, page]);

  const handleMediaChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      setMediaFile(file);
      setMediaPreview(URL.createObjectURL(file));
    }
  };

  const handlePost = async (e) => {
    e.preventDefault();
    const trimmedContent = content.trim();
    if ((!trimmedContent && !mediaFile) || !user || loading) return;

    setLoading(true);
    setFeedError('');

    const contentSnapshot = content;
    const mediaFileSnapshot = mediaFile;
    const mediaPreviewSnapshot = mediaPreview;
    const detectedMediaType = mediaFileSnapshot
      ? mediaFileSnapshot.type.startsWith('video')
        ? 'video'
        : 'image'
      : null;

    const tempPostId = `temp_post_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
    const optimisticPost = {
      id: tempPostId,
      user_id: user.id,
      username: currentUsername,
      profiles: {
        username: currentUsername,
        avatar_url: currentAvatarUrl,
      },
      content: trimmedContent,
      media_url: mediaPreviewSnapshot,
      media_type: detectedMediaType,
      likes_count: 0,
      dislikes_count: 0,
      userReaction: null,
      comments: [],
      created_at: new Date().toISOString(),
      isOptimistic: true,
    };

    // Optimistically clear composer & prepend post on page 1
    setContent('');
    setMediaFile(null);
    setMediaPreview(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
    if (page === 1) {
      setPosts((prev) => [optimisticPost, ...prev]);
    }

    let mediaUrl = null;

    try {
      if (mediaFileSnapshot) {
        const ext = (mediaFileSnapshot.name.split('.').pop() || 'bin').toLowerCase();
        const fileName = `${user.id}/${Date.now()}_${Math.random().toString(36).slice(2, 7)}.${ext}`;
        const bucketName = 'progress-photos';

        const { error: uploadError } = await supabase.storage
          .from(bucketName)
          .upload(fileName, mediaFileSnapshot, { upsert: true });

        if (uploadError) {
          throw new Error(uploadError.message || 'Failed to upload media attachment.');
        }

        const {
          data: { publicUrl },
        } = supabase.storage.from(bucketName).getPublicUrl(fileName);
        mediaUrl = publicUrl;
      }

      const { data: insertedPost, error } = await supabase
        .from('posts')
        .insert({
          user_id: user.id,
          username: currentUsername,
          content: trimmedContent,
          media_url: mediaUrl,
          media_type: detectedMediaType,
        })
        .select('*, profiles:user_id ( username, avatar_url )')
        .single();

      if (error) throw error;

      if (page === 1 && insertedPost) {
        const confirmedPost = {
          ...insertedPost,
          profiles: insertedPost.profiles || {
            username: currentUsername,
            avatar_url: currentAvatarUrl,
          },
          likes_count: insertedPost.likes_count || 0,
          dislikes_count: insertedPost.dislikes_count || 0,
          userReaction: null,
          comments: [],
          isOptimistic: false,
        };
        setPosts((prev) =>
          prev.map((p) => (p.id === tempPostId ? confirmedPost : p))
            .filter((p, idx, arr) => p.id !== confirmedPost.id || arr.findIndex((x) => x.id === confirmedPost.id) === idx)
        );
      } else {
        setPage(1);
      }
    } catch (err) {
      // Roll back optimistic post and restore draft
      setPosts((prev) => prev.filter((p) => p.id !== tempPostId));
      setContent(contentSnapshot);
      setMediaFile(mediaFileSnapshot);
      setMediaPreview(mediaPreviewSnapshot);
      setFeedError(err.message || 'Could not publish your post. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleReaction = async (postId, type) => {
    if (!user || reactionPending[postId]) return;

    const targetPost = posts.find((p) => p.id === postId);
    if (!targetPost || targetPost.isOptimistic) return;

    setFeedError('');
    setReactionPending((prev) => ({ ...prev, [postId]: true }));

    const prevSnapshot = {
      userReaction: targetPost.userReaction || null,
      likes_count: targetPost.likes_count || 0,
      dislikes_count: targetPost.dislikes_count || 0,
    };

    const currentReaction = prevSnapshot.userReaction;
    let nextReaction = null;
    let nextLikes = prevSnapshot.likes_count;
    let nextDislikes = prevSnapshot.dislikes_count;

    if (currentReaction === type) {
      // Toggle off (Unlike / Undislike)
      nextReaction = null;
      if (type === 'like') nextLikes = Math.max(0, nextLikes - 1);
      else nextDislikes = Math.max(0, nextDislikes - 1);
    } else if (currentReaction && currentReaction !== type) {
      // Switch reaction
      nextReaction = type;
      if (type === 'like') {
        nextLikes += 1;
        nextDislikes = Math.max(0, nextDislikes - 1);
      } else {
        nextDislikes += 1;
        nextLikes = Math.max(0, nextLikes - 1);
      }
    } else {
      // New reaction
      nextReaction = type;
      if (type === 'like') nextLikes += 1;
      else nextDislikes += 1;
    }

    // Optimistic UI update — instant, zero delay
    setPosts((current) =>
      current.map((p) =>
        p.id === postId
          ? {
              ...p,
              userReaction: nextReaction,
              likes_count: nextLikes,
              dislikes_count: nextDislikes,
            }
          : p
      )
    );

    try {
      if (nextReaction === null) {
        const { error: deleteError } = await supabase
          .from('post_reactions')
          .delete()
          .eq('post_id', postId)
          .eq('user_id', user.id);

        if (deleteError) throw deleteError;
      } else {
        const { error: upsertError } = await supabase
          .from('post_reactions')
          .upsert(
            {
              post_id: postId,
              user_id: user.id,
              reaction_type: nextReaction,
            },
            { onConflict: 'post_id,user_id' }
          );

        if (upsertError) throw upsertError;
      }

      // In local demo mode, persist the aggregate counters on the mock post record
      if (!isSupabaseConfigured) {
        await supabase
          .from('posts')
          .update({
            likes_count: nextLikes,
            dislikes_count: nextDislikes,
          })
          .eq('id', postId);
      }
    } catch (err) {
      // Roll back optimistic state on failure
      setPosts((current) =>
        current.map((p) =>
          p.id === postId
            ? {
                ...p,
                userReaction: prevSnapshot.userReaction,
                likes_count: prevSnapshot.likes_count,
                dislikes_count: prevSnapshot.dislikes_count,
              }
            : p
        )
      );
      setFeedError(err.message || 'Failed to update reaction. Your change was reverted.');
    } finally {
      setReactionPending((prev) => ({ ...prev, [postId]: false }));
    }
  };

  const handleAddComment = async (e, postId) => {
    if (e && e.preventDefault) e.preventDefault();
    const rawText = commentInputs[postId] || '';
    const trimmedText = rawText.trim();
    if (!trimmedText || !user || commentSubmitting[postId]) return;

    const targetPost = posts.find((p) => p.id === postId);
    if (!targetPost || targetPost.isOptimistic) return;

    setFeedError('');
    setCommentSubmitting((prev) => ({ ...prev, [postId]: true }));

    const tempId = `temp_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
    const optimisticComment = {
      id: tempId,
      post_id: postId,
      user_id: user.id,
      username: currentUsername,
      profiles: {
        username: currentUsername,
        avatar_url: currentAvatarUrl,
      },
      content: trimmedText,
      created_at: new Date().toISOString(),
      isOptimistic: true,
    };

    // Optimistic append + clear input immediately
    setCommentInputs((prev) => ({ ...prev, [postId]: '' }));
    setPosts((current) =>
      current.map((post) =>
        post.id === postId
          ? { ...post, comments: [optimisticComment, ...(post.comments || [])] }
          : post
      )
    );

    try {
      const { data: confirmedComment, error } = await supabase
        .from('post_comments')
        .insert({
          post_id: postId,
          user_id: user.id,
          username: currentUsername,
          content: trimmedText,
        })
        .select('*, profiles:user_id ( username, avatar_url )')
        .single();

      if (error) throw error;

      if (confirmedComment) {
        const hydratedComment = {
          ...confirmedComment,
          profiles: confirmedComment.profiles || {
            username: currentUsername,
            avatar_url: currentAvatarUrl,
          },
        };
        setPosts((current) =>
          current.map((post) => {
            if (post.id !== postId) return post;
            const filtered = (post.comments || []).filter(
              (c) => c.id !== tempId && c.id !== hydratedComment.id
            );
            return { ...post, comments: [hydratedComment, ...filtered] };
          })
        );
      }
    } catch (err) {
      // Roll back optimistic comment and restore text
      setPosts((current) =>
        current.map((post) =>
          post.id === postId
            ? { ...post, comments: (post.comments || []).filter((c) => c.id !== tempId) }
            : post
        )
      );
      setCommentInputs((prev) => ({ ...prev, [postId]: trimmedText }));
      setFeedError(err.message || 'Failed to post comment. Please try again.');
    } finally {
      setCommentSubmitting((prev) => ({ ...prev, [postId]: false }));
    }
  };

  const toggleComments = (postId) => {
    setOpenComments((prev) => ({ ...prev, [postId]: !prev[postId] }));
  };

  return (
    <div className="social-feed-container">
      {/* ── Header ── */}
      <div className="social-header">
        <div className="social-title-group">
          <div className="social-icon-box">
            <Users size={22} />
          </div>
          <div>
            <h2>Community Pulse</h2>
            <p>Connect with dedicated athletes, share transformation milestones, and exchange advice.</p>
          </div>
        </div>
      </div>

      {feedError && (
        <div className="social-error-banner" role="alert">
          <div className="social-error-content">
            <AlertCircle size={16} />
            <span>{feedError}</span>
          </div>
          <button
            type="button"
            className="btn-dismiss-error"
            onClick={() => setFeedError('')}
            aria-label="Dismiss error"
          >
            <X size={14} />
          </button>
        </div>
      )}

      {/* ── Post Creation Card ── */}
      <form className="create-post-card" onSubmit={handlePost}>
        <div className="create-post-top">
          <div className="user-avatar-circle">
            {currentAvatarUrl ? (
              <img src={currentAvatarUrl} alt={currentUsername} className="avatar-img" />
            ) : (
              currentUsername[0].toUpperCase()
            )}
          </div>
          <div className="input-field-wrapper">
            <textarea
              placeholder="What training milestone or insight did you conquer today?"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              rows={3}
            />
          </div>
        </div>

        {mediaPreview && (
          <div className="media-preview-box">
            {mediaFile?.type.startsWith('video') ? (
              <video src={mediaPreview} controls className="media-element" />
            ) : (
              <img src={mediaPreview} alt="Upload preview" className="media-element" />
            )}
            <button
              type="button"
              className="btn-cancel-media"
              onClick={() => {
                setMediaFile(null);
                setMediaPreview(null);
                if (fileInputRef.current) fileInputRef.current.value = '';
              }}
              title="Remove media"
            >
              <X size={14} />
            </button>
          </div>
        )}

        <div className="create-post-actions">
          <div className="media-triggers">
            <label className="btn-attach-media" title="Attach Image or Video">
              <ImageIcon size={16} />
              <span>Media</span>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*,video/*"
                onChange={handleMediaChange}
                style={{ display: 'none' }}
              />
            </label>
          </div>

          <button
            type="submit"
            className="btn-publish-post"
            disabled={loading || (!content.trim() && !mediaFile)}
          >
            <Send size={15} />
            <span>{loading ? 'Publishing...' : 'Publish'}</span>
          </button>
        </div>
      </form>

      {/* ── Posts Timeline ── */}
      <div className="posts-timeline">
        {posts.length === 0 ? (
          <div className="empty-feed-card">
            <Users size={32} className="empty-icon" />
            <p>No community posts yet. Be the first athlete to share your journey!</p>
          </div>
        ) : (
          posts.map((post) => {
            const isCommentsOpen = !!openComments[post.id];
            const commentsCount = (post.comments || []).length;
            const isLiked = post.userReaction === 'like';
            const isDisliked = post.userReaction === 'dislike';
            const isReactionBusy = !!reactionPending[post.id] || !!post.isOptimistic;
            const isCommentBusy = !!commentSubmitting[post.id] || !!post.isOptimistic;
            const commentDraft = commentInputs[post.id] || '';
            const postUsername = post.profiles?.username || post.username || 'athlete';
            const postAvatarUrl = post.profiles?.avatar_url || null;
            const postDate = new Date(post.created_at).toLocaleDateString('en-US', {
              month: 'short',
              day: 'numeric',
              hour: '2-digit',
              minute: '2-digit',
            });

            return (
              <div
                key={post.id}
                className={`social-post-card ${post.isOptimistic ? 'optimistic' : ''}`}
              >
                <div className="post-header">
                  <div className="post-author-group">
                    <div className="author-avatar">
                      {postAvatarUrl ? (
                        <img src={postAvatarUrl} alt={postUsername} className="avatar-img" />
                      ) : (
                        postUsername[0].toUpperCase()
                      )}
                    </div>
                    <div>
                      <h4 className="author-name">@{postUsername}</h4>
                      <span className="post-timestamp">{postDate}</span>
                    </div>
                  </div>
                </div>

                <div className="post-body">
                  {post.content && <p>{post.content}</p>}
                  {post.media_url && (
                    <div className="post-media-container">
                      {post.media_type === 'video' ? (
                        <video src={post.media_url} controls className="post-video" />
                      ) : (
                        <img src={post.media_url} alt="Post attachment" className="post-image" />
                      )}
                    </div>
                  )}
                </div>

                <div className="post-engagement-bar">
                  <div className="reaction-group">
                    <button
                      type="button"
                      className={`reaction-btn like ${isLiked ? 'active' : ''}`}
                      onClick={() => handleReaction(post.id, 'like')}
                      disabled={isReactionBusy}
                      aria-pressed={isLiked}
                      title={isLiked ? 'Unlike Post' : 'Like Post'}
                    >
                      <Heart size={15} fill={isLiked ? 'currentColor' : 'none'} />
                      <span>{post.likes_count || 0}</span>
                    </button>

                    <button
                      type="button"
                      className={`reaction-btn dislike ${isDisliked ? 'active' : ''}`}
                      onClick={() => handleReaction(post.id, 'dislike')}
                      disabled={isReactionBusy}
                      aria-pressed={isDisliked}
                      title={isDisliked ? 'Remove Dislike' : 'Dislike Post'}
                    >
                      <ThumbsDown size={15} />
                      <span>{post.dislikes_count || 0}</span>
                    </button>
                  </div>

                  <button
                    type="button"
                    className={`btn-comment-toggle ${isCommentsOpen ? 'active' : ''}`}
                    onClick={() => toggleComments(post.id)}
                  >
                    <MessageSquare size={15} />
                    <span>
                      {commentsCount} {commentsCount === 1 ? 'Comment' : 'Comments'}
                    </span>
                  </button>
                </div>

                {/* ── Realtime Comments Section ── */}
                {isCommentsOpen && (
                  <div className="comments-drawer">
                    <form
                      className="add-comment-row"
                      onSubmit={(e) => handleAddComment(e, post.id)}
                    >
                      <input
                        type="text"
                        placeholder="Write a supportive reply or feedback..."
                        value={commentDraft}
                        onChange={(e) =>
                          setCommentInputs((prev) => ({ ...prev, [post.id]: e.target.value }))
                        }
                        disabled={isCommentBusy}
                      />
                      <button
                        type="submit"
                        className="btn-send-comment"
                        disabled={isCommentBusy || !commentDraft.trim()}
                        aria-label="Send comment"
                      >
                        {commentSubmitting[post.id] ? (
                          <Loader2 size={14} className="spin-icon" />
                        ) : (
                          <Send size={14} />
                        )}
                      </button>
                    </form>

                    <div className="comments-list">
                      {post.comments && post.comments.length > 0 ? (
                        post.comments.map((c) => {
                          const commentUsername = c.profiles?.username || c.username || 'athlete';
                          const commentAvatarUrl = c.profiles?.avatar_url || null;

                          return (
                            <div
                              key={c.id}
                              className={`comment-bubble ${c.isOptimistic ? 'optimistic' : ''}`}
                            >
                              <div className="comment-author-badge">
                                {commentAvatarUrl ? (
                                  <img
                                    src={commentAvatarUrl}
                                    alt={commentUsername}
                                    className="avatar-img"
                                  />
                                ) : (
                                  commentUsername[0].toUpperCase()
                                )}
                              </div>
                              <div className="comment-text-content">
                                <div className="comment-header-row">
                                  <span className="comment-author">@{commentUsername}</span>
                                  <span className="comment-time">
                                    {new Date(c.created_at).toLocaleTimeString([], {
                                      hour: '2-digit',
                                      minute: '2-digit',
                                    })}
                                  </span>
                                </div>
                                <p className="comment-msg">{c.content}</p>
                              </div>
                            </div>
                          );
                        })
                      ) : (
                        <span className="no-comments-msg">
                          No comments yet. Join the conversation!
                        </span>
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* ── Feed Pagination ── */}
      <div className="feed-pagination">
        <button
          type="button"
          className="btn-feed-nav"
          disabled={page === 1}
          onClick={() => setPage((p) => p - 1)}
        >
          <ChevronLeft size={16} />
          <span>Previous</span>
        </button>

        <span className="current-page-pill">Page {page}</span>

        <button
          type="button"
          className="btn-feed-nav"
          disabled={posts.length < postsPerPage}
          onClick={() => setPage((p) => p + 1)}
        >
          <span>Next</span>
          <ChevronRight size={16} />
        </button>
      </div>
    </div>
  );
};

export default SocialFeed;
