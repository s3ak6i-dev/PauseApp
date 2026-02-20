-- ─── Pause App — Supabase Schema ──────────────────────────────────────────────
-- Run this in your Supabase project: SQL Editor → New query → paste → Run
-- Timestamps are Unix epoch milliseconds stored as BIGINT in column "ts".
-- user_id is a device UUID stored in localStorage (no auth required).

-- Drop existing tables cleanly (safe to re-run)
DROP TABLE IF EXISTS weekly_reviews  CASCADE;
DROP TABLE IF EXISTS evidence_logs   CASCADE;
DROP TABLE IF EXISTS mood_logs       CASCADE;
DROP TABLE IF EXISTS challenge_logs  CASCADE;
DROP TABLE IF EXISTS slip_logs       CASCADE;
DROP TABLE IF EXISTS urge_events     CASCADE;

-- ─── Tables ───────────────────────────────────────────────────────────────────

CREATE TABLE urge_events (
  id                 BIGSERIAL   PRIMARY KEY,
  user_id            TEXT        NOT NULL,
  ts                 BIGINT      NOT NULL,
  duration_seconds   INTEGER     NOT NULL DEFAULT 0,
  intensity_rating   INTEGER     NOT NULL DEFAULT 5,
  trigger_categories TEXT[]      NOT NULL DEFAULT '{}',
  outcome            TEXT        NOT NULL,
  level              INTEGER     NOT NULL DEFAULT 1,
  notes              TEXT,
  extension_count    INTEGER     NOT NULL DEFAULT 0,
  created_at         TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE slip_logs (
  id                     BIGSERIAL   PRIMARY KEY,
  user_id                TEXT        NOT NULL,
  ts                     BIGINT      NOT NULL,
  trigger_categories     TEXT[]      NOT NULL DEFAULT '{}',
  emotion_emoji          TEXT        NOT NULL DEFAULT '',
  emotion_score          INTEGER     NOT NULL DEFAULT 3,
  emotion_notes          TEXT,
  intention              TEXT,
  reflection_depth_score INTEGER     NOT NULL DEFAULT 0,
  is_quick_log           BOOLEAN     NOT NULL DEFAULT FALSE,
  created_at             TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE challenge_logs (
  id               BIGSERIAL   PRIMARY KEY,
  user_id          TEXT        NOT NULL,
  challenge_id     TEXT        NOT NULL,
  ts               BIGINT      NOT NULL,
  completed        BOOLEAN     NOT NULL DEFAULT FALSE,
  difficulty       TEXT        NOT NULL,
  challenge_type   TEXT        NOT NULL,
  duration_minutes INTEGER     NOT NULL DEFAULT 0,
  created_at       TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE mood_logs (
  id          BIGSERIAL   PRIMARY KEY,
  user_id     TEXT        NOT NULL,
  ts          BIGINT      NOT NULL,
  time_of_day TEXT        NOT NULL,
  mood_score  INTEGER     NOT NULL,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE evidence_logs (
  id             BIGSERIAL   PRIMARY KEY,
  user_id        TEXT        NOT NULL,
  ts             BIGINT      NOT NULL,
  text           TEXT        NOT NULL,
  values_tags    TEXT[]      NOT NULL DEFAULT '{}',
  identity_label TEXT        NOT NULL DEFAULT '',
  created_at     TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE weekly_reviews (
  id                  BIGSERIAL   PRIMARY KEY,
  user_id             TEXT        NOT NULL,
  week_start          BIGINT      NOT NULL,
  pause_score         NUMERIC     NOT NULL DEFAULT 0,
  intention_trigger   TEXT        NOT NULL DEFAULT '',
  intention_action    TEXT        NOT NULL DEFAULT '',
  alignment_score     INTEGER     NOT NULL DEFAULT 5,
  reflection_text     TEXT,
  reflection_question TEXT        NOT NULL DEFAULT '',
  follow_through      TEXT,
  completed_at        BIGINT      NOT NULL,
  created_at          TIMESTAMPTZ DEFAULT NOW()
);

-- ─── Indexes ──────────────────────────────────────────────────────────────────
CREATE INDEX idx_urge_events_user_ts    ON urge_events    (user_id, ts DESC);
CREATE INDEX idx_slip_logs_user_ts      ON slip_logs      (user_id, ts DESC);
CREATE INDEX idx_challenge_logs_user_ts ON challenge_logs (user_id, ts DESC);
CREATE INDEX idx_mood_logs_user_ts      ON mood_logs      (user_id, ts DESC);
CREATE INDEX idx_evidence_logs_user_ts  ON evidence_logs  (user_id, ts DESC);
CREATE INDEX idx_weekly_reviews_user_ts ON weekly_reviews (user_id, week_start DESC);
