import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '../lib/supabase';
import gsap from 'gsap';
import {
  Users,
  ThumbsUp,
  ThumbsDown,
  MessageSquare,
  Image as ImageIcon,
  Film,
  Send,
  Trash2,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  X,
  Share2
} from 'lucide-react';
import './SocialFeed.scss';

const SocialFeed = ({ user }) => {
  const [posts, setPosts] = useState([]);
  const [content, setContent] = useState('');
  const [mediaFile, setMediaFile] = useState(null);
  const [mediaPreview, setMediaPreview] = useState(null);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [openComments, setOpenComments] = useState({});
  const [commentInputs, setCommentInputs] = useState({});
  const postsPerPage = 5;
  const fileInputRef = useRef(null);
  
  useEffect(() => {
    fetchPosts();
    
    // Realtime comments subscription
    const channel = supabase.channel('realtime-post-comments')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'post_comments' }, payload => {
        setPosts(current => current.map(post => {
          if (post.id === payload.new.post_id) {
            const existing = post.comments || [];
            if (!existing.some(c => c.id === payload.new.id)) {
              return { ...post, comments: [payload.new, ...existing] };
            }
          }
          return post;
        }));
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [page]);

  useEffect(() => {
    if (posts.length > 0) {
      gsap.from('.social-post-card', { opacity: 0, y: 20, duration: 0.35, stagger: 0.08, ease: 'power2.out' });
    }
  }, [posts]);

  const fetchPosts = async () => {
    const { data } = await supabase
      .from('posts')
      .select('*, post_comments(*)')
      .order('created_at', { ascending: false })
      .range((page - 1) * postsPerPage, page * postsPerPage - 1);
    
    if (data) {
      const formattedPosts = data.map(post => ({
        ...post,
        comments: post.post_comments ? post.post_comments.sort((a,b) => new Date(b.created_at) - new Date(a.created_at)) : []
      }));
      setPosts(formattedPosts);
    }
  };

  const handleMediaChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setMediaFile(file);
      setMediaPreview(URL.createObjectURL(file));
    }
  };

  const handlePost = async (e) => {
    e.preventDefault();
    if (!content.trim() && !mediaFile) return;
    setLoading(true);
    let mediaUrl = null;
    let mediaType = null;
    
    if (mediaFile) {
      const ext = mediaFile.name.split('.').pop();
      const fileName = `${Date.now()}.${ext}`;
      const bucketName = 'progress-photos'; // Reliable storage bucket
      
      const { error: uploadError } = await supabase.storage
        .from(bucketName)
        .upload(fileName, mediaFile, { upsert: true });

      if (!uploadError) {
        const { data: { publicUrl } } = supabase.storage
          .from(bucketName)
          .getPublicUrl(fileName);
        mediaUrl = publicUrl;
        mediaType = mediaFile.type.startsWith('video') ? 'video' : 'image';
      }
    }

    const username = user?.user_metadata?.username || user?.email?.split('@')[0] || 'Athlete';
    const { error } = await supabase.from('posts').insert({
      user_id: user.id,
      username,
      content: content.trim(),
      media_url: mediaUrl,
      media_type: mediaType
    });

    setLoading(false);
    if (!error) {
      setContent('');
      setMediaFile(null);
      setMediaPreview(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
      fetchPosts();
    }
  };

  const handleReaction = async (postId, type) => {
    if (!user) return;
    
    // Check existing reaction
    const { data: existing } = await supabase
      .from('post_reactions')
      .select('*')
      .eq('post_id', postId)
      .eq('user_id', user.id)
      .maybeSingle();

    if (existing) {
      if (existing.reaction_type === type) {
        // Remove reaction
        await supabase.from('post_reactions').delete().eq('id', existing.id);
        const col = type === 'like' ? 'likes_count' : 'dislikes_count';
        const post = posts.find(p => p.id === postId);
        const count = Math.max(0, (post[col] || 1) - 1);
        await supabase.from('posts').update({ [col]: count }).eq('id', postId);
      } else {
        // Toggle reaction
        await supabase.from('post_reactions').update({ reaction_type: type }).eq('id', existing.id);
        const post = posts.find(p => p.id === postId);
        if (type === 'like') {
          await supabase.from('posts').update({
            likes_count: (post.likes_count || 0) + 1,
            dislikes_count: Math.max(0, (post.dislikes_count || 1) - 1)
          }).eq('id', postId);
        } else {
          await supabase.from('posts').update({
            dislikes_count: (post.dislikes_count || 0) + 1,
            likes_count: Math.max(0, (post.likes_count || 1) - 1)
          }).eq('id', postId);
        }
      }
    } else {
      // Add reaction
      await supabase.from('post_reactions').insert({
        post_id: postId,
        user_id: user.id,
        reaction_type: type
      });
      const col = type === 'like' ? 'likes_count' : 'dislikes_count';
      const post = posts.find(p => p.id === postId);
      await supabase.from('posts').update({ [col]: (post[col] || 0) + 1 }).eq('id', postId);
    }

    fetchPosts();
  };

  const handleAddComment = async (postId) => {
    const text = commentInputs[postId];
    if (!text?.trim() || !user) return;

    const username = user?.user_metadata?.username || user?.email?.split('@')[0] || 'Athlete';
    const { error } = await supabase.from('post_comments').insert({
      post_id: postId,
      user_id: user.id,
      username,
      content: text.trim()
    });

    if (!error) {
      setCommentInputs(prev => ({ ...prev, [postId]: '' }));
    }
  };

  const toggleComments = (postId) => {
    setOpenComments(prev => ({ ...prev, [postId]: !prev[postId] }));
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

      {/* ── Post Creation Card ── */}
      <div className="create-post-card">
        <div className="create-post-top">
          <div className="user-avatar-circle">
            {(user?.user_metadata?.username || user?.email || 'A')[0].toUpperCase()}
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
              className="btn-cancel-media"
              onClick={() => { setMediaFile(null); setMediaPreview(null); }}
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
            className="btn-publish-post"
            onClick={handlePost}
            disabled={loading || (!content.trim() && !mediaFile)}
          >
            <Send size={15} />
            <span>{loading ? 'Publishing...' : 'Publish'}</span>
          </button>
        </div>
      </div>

      {/* ── Posts Timeline ── */}
      <div className="posts-timeline">
        {posts.length === 0 ? (
          <div className="empty-feed-card">
            <Users size={32} className="empty-icon" />
            <p>No community posts yet. Be the first athlete to share your journey!</p>
          </div>
        ) : (
          posts.map(post => {
            const isCommentsOpen = !!openComments[post.id];
            const commentsCount = (post.comments || []).length;
            const postDate = new Date(post.created_at).toLocaleDateString('en-US', {
              month: 'short',
              day: 'numeric',
              hour: '2-digit',
              minute: '2-digit'
            });

            return (
              <div key={post.id} className="social-post-card">
                <div className="post-header">
                  <div className="post-author-group">
                    <div className="author-avatar">
                      {(post.username || 'A')[0].toUpperCase()}
                    </div>
                    <div>
                      <h4 className="author-name">@{post.username || 'athlete'}</h4>
                      <span className="post-timestamp">{postDate}</span>
                    </div>
                  </div>
                </div>

                <div className="post-body">
                  <p>{post.content}</p>
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
                      className="reaction-btn like"
                      onClick={() => handleReaction(post.id, 'like')}
                      title="Like Post"
                    >
                      <ThumbsUp size={15} />
                      <span>{post.likes_count || 0}</span>
                    </button>

                    <button
                      className="reaction-btn dislike"
                      onClick={() => handleReaction(post.id, 'dislike')}
                      title="Dislike Post"
                    >
                      <ThumbsDown size={15} />
                      <span>{post.dislikes_count || 0}</span>
                    </button>
                  </div>

                  <button
                    className={`btn-comment-toggle ${isCommentsOpen ? 'active' : ''}`}
                    onClick={() => toggleComments(post.id)}
                  >
                    <MessageSquare size={15} />
                    <span>{commentsCount} {commentsCount === 1 ? 'Comment' : 'Comments'}</span>
                  </button>
                </div>

                {/* ── Realtime Comments Section ── */}
                {isCommentsOpen && (
                  <div className="comments-drawer">
                    <div className="add-comment-row">
                      <input
                        type="text"
                        placeholder="Write a supportive reply or feedback..."
                        value={commentInputs[post.id] || ''}
                        onChange={(e) => setCommentInputs({ ...commentInputs, [post.id]: e.target.value })}
                        onKeyDown={(e) => e.key === 'Enter' && handleAddComment(post.id)}
                      />
                      <button
                        className="btn-send-comment"
                        onClick={() => handleAddComment(post.id)}
                      >
                        <Send size={14} />
                      </button>
                    </div>

                    <div className="comments-list">
                      {post.comments && post.comments.length > 0 ? (
                        post.comments.map(c => (
                          <div key={c.id} className="comment-bubble">
                            <div className="comment-author-badge">
                              {(c.username || 'A')[0].toUpperCase()}
                            </div>
                            <div className="comment-text-content">
                              <div className="comment-header-row">
                                <span className="comment-author">@{c.username}</span>
                                <span className="comment-time">
                                  {new Date(c.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </span>
                              </div>
                              <p className="comment-msg">{c.content}</p>
                            </div>
                          </div>
                        ))
                      ) : (
                        <span className="no-comments-msg">No comments yet. Join the conversation!</span>
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
          className="btn-feed-nav"
          disabled={page === 1}
          onClick={() => setPage(p => p - 1)}
        >
          <ChevronLeft size={16} />
          <span>Previous</span>
        </button>

        <span className="current-page-pill">Page {page}</span>

        <button
          className="btn-feed-nav"
          disabled={posts.length < postsPerPage}
          onClick={() => setPage(p => p + 1)}
        >
          <span>Next</span>
          <ChevronRight size={16} />
        </button>
      </div>
    </div>
  );
};

export default SocialFeed;
