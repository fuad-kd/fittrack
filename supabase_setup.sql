-- ============================================================
-- FitTrack – Supabase Database Setup
-- Run this entire script in: Supabase Dashboard → SQL Editor
-- ============================================================

-- 1. Create the profiles table (extends Supabase auth.users)
create table if not exists public.profiles (
  id          uuid references auth.users(id) on delete cascade primary key,
  username    text unique not null,
  phone       text,
  avatar_url  text,
  created_at  timestamptz default now(),
  updated_at  timestamptz default now()
);

-- 2. Enable Row Level Security (RLS)
alter table public.profiles enable row level security;

-- 3. Policy: Anyone can read profiles (needed for username availability check)
create policy "Profiles are publicly readable"
  on public.profiles
  for select
  using (true);

-- 4. Policy: Users can only insert their own profile
create policy "Users can insert own profile"
  on public.profiles
  for insert
  with check (auth.uid() = id);

-- 5. Policy: Users can only update their own profile
create policy "Users can update own profile"
  on public.profiles
  for update
  using (auth.uid() = id);

-- 6. Policy: Users can delete their own profile
create policy "Users can delete own profile"
  on public.profiles
  for delete
  using (auth.uid() = id);

-- 7. Function: Get email by user ID (used for username-based login)
--    This is a SECURITY DEFINER function so it can read auth.users
create or replace function public.get_email_by_id(user_id uuid)
returns text
language sql
security definer
stable
as $$
  select email from auth.users where id = user_id;
$$;

-- 8. Grant execute permission on the function
grant execute on function public.get_email_by_id(uuid) to anon, authenticated;

-- 8.5 Trigger to automatically create a profile for new users
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, username, phone)
  values (
    new.id,
    new.raw_user_meta_data->>'username',
    new.raw_user_meta_data->>'phone'
  );
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ============================================================
-- WEEK 3: Workout & Exercise Module
-- ============================================================

-- 9. Workout Plans table
create table if not exists public.workout_plans (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid references auth.users(id) on delete cascade not null,
  name        text not null,
  description text,
  difficulty  text check (difficulty in ('Beginner', 'Intermediate', 'Advanced')),
  goal        text,
  created_at  timestamptz default now(),
  updated_at  timestamptz default now()
);

alter table public.workout_plans enable row level security;

create policy "Users manage own workout plans"
  on public.workout_plans
  for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- 10. Exercises table (belongs to a workout plan)
create table if not exists public.exercises (
  id            uuid primary key default gen_random_uuid(),
  plan_id       uuid references public.workout_plans(id) on delete cascade not null,
  name          text not null,
  muscle_group  text,
  sets          integer check (sets >= 1 and sets <= 20),
  reps          integer check (reps >= 1 and reps <= 200),
  weight_kg     numeric(6,2) check (weight_kg >= 0 and weight_kg <= 1000),
  notes         text,
  youtube_url   text,
  created_at    timestamptz default now()
);

alter table public.exercises enable row level security;

-- Users can manage exercises that belong to their own plans
create policy "Users manage exercises in own plans"
  on public.exercises
  for all
  using (
    exists (
      select 1 from public.workout_plans
      where workout_plans.id = exercises.plan_id
        and workout_plans.user_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from public.workout_plans
      where workout_plans.id = exercises.plan_id
        and workout_plans.user_id = auth.uid()
    )
  );

-- ============================================================
-- DONE! Your database is ready.
-- ============================================================


-- ============================================================
-- WEEK 4: Workout Log & Progress Tracker
-- ============================================================

-- 11. Workout Logs table
create table if not exists public.workout_logs (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null references auth.users(id) on delete cascade,
  plan_id       uuid,
  plan_name     text,
  log_date      date not null default current_date,
  duration_min  integer check (duration_min >= 1 and duration_min <= 600),
  notes         text,
  created_at    timestamptz default now(),
  constraint fk_workout_log_plan
    foreign key (plan_id)
    references public.workout_plans(id)
    on delete set null
);

alter table public.workout_logs enable row level security;

create policy "Users manage own workout logs"
  on public.workout_logs
  for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- 12. Progress measurements table
create table if not exists public.progress_entries (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid references auth.users(id) on delete cascade not null,
  entry_date  date not null default current_date,
  weight_kg   numeric(5,2),
  calories    integer,
  chest_cm    numeric(5,1),
  waist_cm    numeric(5,1),
  hips_cm     numeric(5,1),
  arms_cm     numeric(5,1),
  notes       text,
  photo_url   text,
  created_at  timestamptz default now()
);

alter table public.progress_entries enable row level security;

create policy "Users manage own progress entries"
  on public.progress_entries
  for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- ============================================================
-- WEEK 5 & 6: Social & Ratings Module
-- ============================================================

create table if not exists public.posts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  username text,
  content text not null,
  media_url text,
  media_type text check (media_type in ('image', 'video')),
  likes_count integer default 0,
  dislikes_count integer default 0,
  created_at timestamptz default now()
);
alter table public.posts enable row level security;
drop policy if exists "Anyone readable" on public.posts;
create policy "Anyone readable" on public.posts for select using (true);
drop policy if exists "Users insert own posts" on public.posts;
create policy "Users insert own posts" on public.posts for insert with check (auth.uid() = user_id);
drop policy if exists "Users delete own posts" on public.posts;
create policy "Users delete own posts" on public.posts for delete using (auth.uid() = user_id);

create table if not exists public.post_comments (
  id uuid primary key default gen_random_uuid(),
  post_id uuid references public.posts(id) on delete cascade not null,
  user_id uuid references auth.users(id) on delete cascade not null,
  username text not null,
  content text not null,
  created_at timestamptz default now()
);
alter table public.post_comments enable row level security;
drop policy if exists "Anyone readable" on public.post_comments;
create policy "Anyone readable" on public.post_comments for select using (true);
drop policy if exists "Users insert own comments" on public.post_comments;
create policy "Users insert own comments" on public.post_comments for insert with check (auth.uid() = user_id);
drop policy if exists "Users delete own comments" on public.post_comments;
create policy "Users delete own comments" on public.post_comments for delete using (auth.uid() = user_id);

create table if not exists public.post_reactions (
  id uuid primary key default gen_random_uuid(),
  post_id uuid references public.posts(id) on delete cascade not null,
  user_id uuid references auth.users(id) on delete cascade not null,
  reaction_type text check (reaction_type in ('like', 'dislike')) not null,
  created_at timestamptz default now(),
  constraint unique_user_post_reaction unique(post_id, user_id)
);
alter table public.post_reactions enable row level security;
drop policy if exists "Anyone readable" on public.post_reactions;
create policy "Anyone readable" on public.post_reactions for select using (true);
drop policy if exists "Users manage own reactions" on public.post_reactions;
create policy "Users manage own reactions" on public.post_reactions for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create table if not exists public.workout_ratings (
  id uuid primary key default gen_random_uuid(),
  plan_id uuid references public.workout_plans(id) on delete cascade not null,
  user_id uuid references auth.users(id) on delete cascade not null,
  username text,
  rating integer check (rating >= 1 and rating <= 5) not null,
  review text,
  created_at timestamptz default now(),
  constraint unique_user_plan_rating unique(plan_id, user_id)
);
alter table public.workout_ratings enable row level security;
drop policy if exists "Anyone readable" on public.workout_ratings;
create policy "Anyone readable" on public.workout_ratings for select using (true);
drop policy if exists "Users manage own ratings" on public.workout_ratings;
create policy "Users manage own ratings" on public.workout_ratings for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- ============================================================
-- WEEK 7: Exercise Volume & Progression Analytics
-- ============================================================

create table if not exists public.exercise_logs (
  id             uuid primary key default gen_random_uuid(),
  user_id        uuid not null references auth.users(id) on delete cascade,
  exercise_name  text not null,
  muscle_group   text,
  log_date       date not null default current_date,
  weight_kg      numeric(6,2) not null,
  sets           integer not null check (sets >= 1 and sets <= 50),
  reps           integer not null check (reps >= 1 and reps <= 200),
  volume_kg      numeric(8,2),
  notes          text,
  rpe            numeric(3,1),
  created_at     timestamptz default now()
);

alter table public.exercise_logs enable row level security;
drop policy if exists "Users manage own exercise logs" on public.exercise_logs;
create policy "Users manage own exercise logs"
  on public.exercise_logs
  for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);


