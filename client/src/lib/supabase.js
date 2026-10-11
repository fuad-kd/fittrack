import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

const isSupabaseConfigured =
  supabaseUrl &&
  supabaseAnonKey &&
  typeof supabaseUrl === 'string' &&
  supabaseUrl.startsWith('http') &&
  supabaseUrl !== 'https://your-project.supabase.co' &&
  !supabaseUrl.includes('placeholder');

let clientInstance;

if (isSupabaseConfigured) {
  try {
    clientInstance = createClient(supabaseUrl, supabaseAnonKey);
  } catch (err) {
    console.warn('[FitTrack] Failed to initialize real Supabase client, falling back to mock:', err);
  }
}

if (!clientInstance) {
  console.info(
    '[FitTrack] Supabase credentials not found in env — running in local demo mode with in-browser persistence.'
  );

  // Storage helper
  const loadStorage = (key, fallback) => {
    try {
      const data = localStorage.getItem(`fittrack_mock_${key}`);
      return data ? JSON.parse(data) : fallback;
    } catch {
      return fallback;
    }
  };

  const saveStorage = (key, value) => {
    try {
      localStorage.setItem(`fittrack_mock_${key}`, JSON.stringify(value));
    } catch (err) {
      console.warn('LocalStorage save failed:', err);
    }
  };

  // Seed default data
  const DEMO_USER_ID = 'user_alex_123';
  const initialUser = {
    id: DEMO_USER_ID,
    email: 'alex@fittrack.com',
    email_confirmed_at: '2025-01-01T00:00:00.000Z',
    user_metadata: {
      username: 'alex_vance',
      phone: '+1 (555) 234-5678',
    },
  };

  const initialProfiles = [
    {
      id: DEMO_USER_ID,
      username: 'alex_vance',
      phone: '+1 (555) 234-5678',
      avatar_url: null,
      created_at: new Date(Date.now() - 30 * 86400000).toISOString(),
    },
    {
      id: 'user_marcus',
      username: 'marcus_iron',
      phone: null,
      avatar_url: null,
      created_at: new Date(Date.now() - 40 * 86400000).toISOString(),
    },
    {
      id: 'user_elena',
      username: 'elena_fit',
      phone: null,
      avatar_url: null,
      created_at: new Date(Date.now() - 20 * 86400000).toISOString(),
    },
  ];

  const initialWorkoutPlans = [
    {
      id: 'plan_push_1',
      user_id: DEMO_USER_ID,
      name: 'Hypertrophy Push Protocol',
      description: 'High-volume chest, anterior delts, and tricep focus designed for mechanical tension and progressive overload.',
      difficulty: 'Advanced',
      goal: 'Upper body hypertrophy and lockout strength',
      created_at: new Date(Date.now() - 10 * 86400000).toISOString(),
    },
    {
      id: 'plan_olympic_2',
      user_id: DEMO_USER_ID,
      name: 'Olympic Strength Cycle',
      description: 'Heavy barbell compound lifts focusing on squats, deadlifts, and CNS adaptation.',
      difficulty: 'Intermediate',
      goal: 'Maximum power output and core stability',
      created_at: new Date(Date.now() - 5 * 86400000).toISOString(),
    },
  ];

  const initialExercises = [
    {
      id: 'ex_1',
      plan_id: 'plan_push_1',
      name: 'Incline Barbell Bench Press',
      muscle_group: 'Upper Chest',
      sets: 4,
      reps: 8,
      weight_kg: 85,
      notes: 'Controlled 3-second eccentric tempo, pause on sternum',
      youtube_url: 'https://www.youtube.com/watch?v=2yjwXTZQDDI',
      created_at: new Date().toISOString(),
    },
    {
      id: 'ex_2',
      plan_id: 'plan_push_1',
      name: 'Weighted Chest Dips',
      muscle_group: 'Lower Chest & Triceps',
      sets: 3,
      reps: 10,
      weight_kg: 20,
      notes: 'Slight forward torso lean for pectoral activation',
      youtube_url: 'https://www.youtube.com/watch?v=2z8JmcrW-As',
      created_at: new Date().toISOString(),
    },
    {
      id: 'ex_3',
      plan_id: 'plan_push_1',
      name: 'Standing Overhead Military Press',
      muscle_group: 'Anterior Shoulders',
      sets: 4,
      reps: 6,
      weight_kg: 60,
      notes: 'Keep glutes locked, strict lockout at the top',
      youtube_url: 'https://www.youtube.com/watch?v=QAQ64hK4SkI',
      created_at: new Date().toISOString(),
    },
    {
      id: 'ex_4',
      plan_id: 'plan_push_1',
      name: 'Cable Lateral Raises',
      muscle_group: 'Lateral Deltoids',
      sets: 3,
      reps: 15,
      weight_kg: 12.5,
      notes: 'Constant tension, lead slightly with elbows',
      youtube_url: 'https://www.youtube.com/watch?v=PPrzBWZDOhA',
      created_at: new Date().toISOString(),
    },
    {
      id: 'ex_5',
      plan_id: 'plan_olympic_2',
      name: 'High Bar Olympic Squat',
      muscle_group: 'Quadriceps',
      sets: 5,
      reps: 5,
      weight_kg: 140,
      notes: 'Depth below parallel, upright posture',
      youtube_url: 'https://www.youtube.com/watch?v=bEv6CCg2BC8',
      created_at: new Date().toISOString(),
    },
  ];

  const initialWorkoutLogs = [
    {
      id: 'log_1',
      user_id: DEMO_USER_ID,
      plan_id: 'plan_push_1',
      plan_name: 'Hypertrophy Push Protocol',
      log_date: new Date(Date.now() - 2 * 86400000).toISOString().split('T')[0],
      duration_min: 65,
      notes: 'Hit all sets of incline press with great control. Delts had solid pump.',
      created_at: new Date(Date.now() - 2 * 86400000).toISOString(),
    },
    {
      id: 'log_2',
      user_id: DEMO_USER_ID,
      plan_id: 'plan_olympic_2',
      plan_name: 'Olympic Strength Cycle',
      log_date: new Date(Date.now() - 4 * 86400000).toISOString().split('T')[0],
      duration_min: 55,
      notes: 'Fast bar speed on squats. Added 2.5kg on top sets.',
      created_at: new Date(Date.now() - 4 * 86400000).toISOString(),
    },
  ];

  const initialProgress = [
    {
      id: 'prog_1',
      user_id: DEMO_USER_ID,
      entry_date: new Date(Date.now() - 1 * 86400000).toISOString().split('T')[0],
      weight_kg: 82.4,
      calories: 2750,
      chest_cm: 108.5,
      waist_cm: 82.0,
      hips_cm: 98.0,
      arms_cm: 39.2,
      notes: 'Morning weigh-in after rest day. Waist tightened by 0.5cm.',
      photo_url: 'https://images.unsplash.com/photo-1583454110551-21f2fa2afe61?w=700&auto=format&fit=crop&q=80',
      created_at: new Date(Date.now() - 1 * 86400000).toISOString(),
    },
    {
      id: 'prog_2',
      user_id: DEMO_USER_ID,
      entry_date: new Date(Date.now() - 14 * 86400000).toISOString().split('T')[0],
      weight_kg: 83.1,
      calories: 2800,
      chest_cm: 107.8,
      waist_cm: 82.5,
      hips_cm: 98.2,
      arms_cm: 38.8,
      notes: 'Baseline check at the start of block 2.',
      photo_url: null,
      created_at: new Date(Date.now() - 14 * 86400000).toISOString(),
    },
  ];

  const initialPosts = [
    {
      id: 'post_1',
      user_id: 'user_marcus',
      username: 'marcus_iron',
      content: 'Locked in a new 140kg squat triple today. Fueling with high protein and keeping recovery dialed in!',
      media_url: 'https://images.unsplash.com/photo-1517838277536-f5f99be501cd?w=700&auto=format&fit=crop&q=80',
      media_type: 'image',
      likes_count: 14,
      dislikes_count: 0,
      created_at: new Date(Date.now() - 5 * 3600000).toISOString(),
      post_comments: [
        {
          id: 'comm_1',
          post_id: 'post_1',
          user_id: DEMO_USER_ID,
          username: 'alex_vance',
          content: 'Clean reps brother! Depth looked spot on.',
          created_at: new Date(Date.now() - 4 * 3600000).toISOString(),
        },
      ],
    },
    {
      id: 'post_2',
      user_id: 'user_elena',
      username: 'elena_fit',
      content: 'Morning 5k cadence run followed by shoulder mobility routine. Discipline over motivation every single day.',
      media_url: null,
      media_type: null,
      likes_count: 9,
      dislikes_count: 0,
      created_at: new Date(Date.now() - 12 * 3600000).toISOString(),
      post_comments: [],
    },
  ];

  const initialReactions = [];
  const initialRatings = [
    {
      id: 'rating_1',
      plan_id: 'plan_push_1',
      user_id: 'user_marcus',
      username: 'marcus_iron',
      rating: 5,
      review: 'Top notch programming. The compound-to-isolation progression delivers an unreal pump.',
      created_at: new Date(Date.now() - 3 * 86400000).toISOString(),
    },
  ];

  // Auth state management
  let currentUser = loadStorage('auth_user', initialUser);
  const authListeners = new Set();

  const notifyAuthChange = (event, session) => {
    authListeners.forEach((cb) => {
      try {
        cb(event, session);
      } catch (e) {
        console.error('Auth listener error:', e);
      }
    });
  };

  const getSessionData = () => {
    if (!currentUser) return { session: null };
    return {
      session: {
        access_token: 'mock_token',
        token_type: 'bearer',
        expires_in: 3600,
        user: currentUser,
      },
    };
  };

  // Mock Query Builder
  class MockQueryBuilder {
    constructor(tableName) {
      this.tableName = tableName;
      this.filters = [];
      this.orderRule = null;
      this.limitCount = null;
      this.rangeBounds = null;
      this.isSingle = false;
      this.isMaybeSingle = false;
      this.isCountOnly = false;
      this.selectFields = '*';
    }

    _getData() {
      let defaults = [];
      if (this.tableName === 'profiles') defaults = initialProfiles;
      else if (this.tableName === 'workout_plans') defaults = initialWorkoutPlans;
      else if (this.tableName === 'exercises') defaults = initialExercises;
      else if (this.tableName === 'workout_logs') defaults = initialWorkoutLogs;
      else if (this.tableName === 'progress_entries') defaults = initialProgress;
      else if (this.tableName === 'posts') defaults = initialPosts;
      else if (this.tableName === 'post_reactions') defaults = initialReactions;
      else if (this.tableName === 'post_comments') {
        const posts = loadStorage('posts', initialPosts);
        defaults = posts.flatMap(p => p.post_comments || []);
      }
      else if (this.tableName === 'workout_ratings') defaults = initialRatings;

      return loadStorage(this.tableName, defaults);
    }

    _saveData(data) {
      saveStorage(this.tableName, data);
    }

    select(fields = '*', options = {}) {
      this.selectFields = fields;
      if (options.count === 'exact' && options.head) {
        this.isCountOnly = true;
      }
      return this;
    }

    eq(column, value) {
      this.filters.push((row) => String(row[column]) === String(value));
      return this;
    }

    in(column, values) {
      const set = new Set((values || []).map(v => String(v)));
      this.filters.push((row) => set.has(String(row[column])));
      return this;
    }

    order(column, { ascending = true } = {}) {
      this.orderRule = { column, ascending };
      return this;
    }

    limit(n) {
      this.limitCount = n;
      return this;
    }

    range(from, to) {
      this.rangeBounds = { from, to };
      return this;
    }

    single() {
      this.isSingle = true;
      return this;
    }

    maybeSingle() {
      this.isMaybeSingle = true;
      return this;
    }

    async _execute() {
      let rows = [...this._getData()];

      // Apply filters
      for (const filter of this.filters) {
        rows = rows.filter(filter);
      }

      const totalCount = rows.length;

      // Apply ordering
      if (this.orderRule) {
        const { column, ascending } = this.orderRule;
        rows.sort((a, b) => {
          const valA = a[column];
          const valB = b[column];
          if (valA < valB) return ascending ? -1 : 1;
          if (valA > valB) return ascending ? 1 : -1;
          return 0;
        });
      }

      // Range / Limit
      if (this.rangeBounds) {
        const { from, to } = this.rangeBounds;
        rows = rows.slice(from, to + 1);
      } else if (this.limitCount !== null) {
        rows = rows.slice(0, this.limitCount);
      }

      if (this.isCountOnly) {
        return { data: null, error: null, count: totalCount };
      }

      if (this.isSingle) {
        if (rows.length === 0) {
          return { data: null, error: { message: 'Row not found' }, count: 0 };
        }
        return { data: rows[0], error: null, count: 1 };
      }

      if (this.isMaybeSingle) {
        return { data: rows.length > 0 ? rows[0] : null, error: null, count: rows.length };
      }

      return { data: rows, error: null, count: totalCount };
    }

    // Direct then-able
    then(resolve, reject) {
      return this._execute().then(resolve, reject);
    }

    async insert(records) {
      const list = Array.isArray(records) ? records : [records];
      const rows = this._getData();
      const newItems = list.map((item) => ({
        id: item.id || `gen_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
        created_at: new Date().toISOString(),
        ...item,
      }));

      rows.unshift(...newItems);
      this._saveData(rows);

      // If inserting comment, update post object if applicable
      if (this.tableName === 'post_comments') {
        const posts = loadStorage('posts', initialPosts);
        const comment = newItems[0];
        const post = posts.find((p) => p.id === comment.post_id);
        if (post) {
          post.post_comments = post.post_comments || [];
          post.post_comments.unshift(comment);
          saveStorage('posts', posts);
        }
      }

      return { data: Array.isArray(records) ? newItems : newItems[0], error: null };
    }

    async upsert(record, options = {}) {
      const rows = this._getData();
      const item = { ...record };
      const onConflict = (options.onConflict || '').split(',').map((s) => s.trim()).filter(Boolean);

      let foundIndex = -1;
      if (onConflict.length > 0) {
        foundIndex = rows.findIndex((r) => onConflict.every((k) => String(r[k]) === String(item[k])));
      } else if (item.id) {
        foundIndex = rows.findIndex((r) => r.id === item.id);
      }

      if (foundIndex >= 0) {
        rows[foundIndex] = { ...rows[foundIndex], ...item, updated_at: new Date().toISOString() };
      } else {
        item.id = item.id || `gen_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
        item.created_at = item.created_at || new Date().toISOString();
        rows.unshift(item);
      }

      this._saveData(rows);
      return { data: item, error: null };
    }

    async update(updates) {
      let rows = this._getData();
      let updatedCount = 0;

      rows = rows.map((r) => {
        const matches = this.filters.every((f) => f(r));
        if (matches) {
          updatedCount++;
          return { ...r, ...updates, updated_at: new Date().toISOString() };
        }
        return r;
      });

      this._saveData(rows);
      return { data: rows, error: null, count: updatedCount };
    }

    async delete() {
      let rows = this._getData();
      const initialLen = rows.length;
      rows = rows.filter((r) => !this.filters.every((f) => f(r)));
      this._saveData(rows);
      return { data: null, error: null, count: initialLen - rows.length };
    }
  }

  clientInstance = {
    auth: {
      getSession: async () => {
        return { data: getSessionData(), error: null };
      },

      onAuthStateChange: (callback) => {
        authListeners.add(callback);
        // Call immediately with initial session
        setTimeout(() => {
          callback('INITIAL_SESSION', getSessionData().session);
        }, 10);

        return {
          data: {
            subscription: {
              unsubscribe: () => {
                authListeners.delete(callback);
              },
            },
          },
        };
      },

      signInWithPassword: async ({ email, password }) => {
        const profiles = loadStorage('profiles', initialProfiles);
        const users = loadStorage('registered_users', [initialUser]);

        const trimmed = (email || '').trim().toLowerCase();
        // Match by email or username
        let user = users.find((u) => u.email.toLowerCase() === trimmed);
        if (!user) {
          const profile = profiles.find((p) => p.username.toLowerCase() === trimmed);
          if (profile) {
            user = users.find((u) => u.id === profile.id);
          }
        }

        if (!user) {
          // If demo email or username
          if (trimmed === 'alex@fittrack.com' || trimmed === 'alex_vance') {
            user = initialUser;
          } else {
            // Auto-provision user on demo for seamless experience
            const newId = `user_${Date.now()}`;
            user = {
              id: newId,
              email: trimmed.includes('@') ? trimmed : `${trimmed}@example.com`,
              email_confirmed_at: new Date().toISOString(),
              user_metadata: {
                username: trimmed.includes('@') ? trimmed.split('@')[0] : trimmed,
              },
            };
            users.push(user);
            saveStorage('registered_users', users);

            profiles.push({
              id: newId,
              username: user.user_metadata.username,
              phone: null,
              created_at: new Date().toISOString(),
            });
            saveStorage('profiles', profiles);
          }
        }

        currentUser = user;
        saveStorage('auth_user', currentUser);
        const session = getSessionData().session;
        notifyAuthChange('SIGNED_IN', session);

        return { data: { user, session }, error: null };
      },

      signUp: async ({ email, password, options }) => {
        const newId = `user_${Date.now()}`;
        const username = options?.data?.username || email.split('@')[0];
        const phone = options?.data?.phone || null;

        const newUser = {
          id: newId,
          email: email.trim(),
          email_confirmed_at: new Date().toISOString(),
          user_metadata: {
            username,
            phone,
          },
        };

        const users = loadStorage('registered_users', [initialUser]);
        users.push(newUser);
        saveStorage('registered_users', users);

        const profiles = loadStorage('profiles', initialProfiles);
        profiles.push({
          id: newId,
          username,
          phone,
          created_at: new Date().toISOString(),
        });
        saveStorage('profiles', profiles);

        currentUser = newUser;
        saveStorage('auth_user', currentUser);
        const session = getSessionData().session;
        notifyAuthChange('SIGNED_IN', session);

        return { data: { user: newUser, session }, error: null };
      },

      signOut: async () => {
        currentUser = null;
        saveStorage('auth_user', null);
        notifyAuthChange('SIGNED_OUT', null);
        return { error: null };
      },

      resend: async () => {
        return { data: {}, error: null };
      },
    },

    from: (table) => new MockQueryBuilder(table),

    rpc: async (fnName, params = {}) => {
      if (fnName === 'get_email_by_id') {
        const users = loadStorage('registered_users', [initialUser]);
        const user = users.find((u) => u.id === params.user_id);
        if (user) return { data: user.email, error: null };
        return { data: 'athlete@fittrack.com', error: null };
      }
      return { data: null, error: null };
    },

    storage: {
      from: () => ({
        upload: async (fileName, file) => {
          let publicUrl = '';
          if (file && typeof window !== 'undefined' && window.URL?.createObjectURL) {
            try {
              publicUrl = URL.createObjectURL(file);
            } catch {
              publicUrl = 'https://images.unsplash.com/photo-1517838277536-f5f99be501cd?w=700';
            }
          }
          return { data: { path: fileName, publicUrl }, error: null };
        },
        getPublicUrl: (fileName) => {
          return {
            data: {
              publicUrl: 'https://images.unsplash.com/photo-1583454110551-21f2fa2afe61?w=700&auto=format&fit=crop&q=80',
            },
          };
        },
      }),
    },

    channel: () => {
      const dummyChannel = {
        on: () => dummyChannel,
        subscribe: () => dummyChannel,
      };
      return dummyChannel;
    },

    removeChannel: () => {},
  };
}

export const supabase = clientInstance;
