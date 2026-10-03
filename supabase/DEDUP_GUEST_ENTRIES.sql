-- SGUNMS duplicate guest-entry hardening
-- Run once in Supabase SQL Editor. This keeps the existing guests table and
-- makes client retries idempotent by primary key.

-- Remove exact duplicate rows when the same logical entry was inserted multiple times.
-- Keep the oldest row (created_at, then id).
WITH ranked AS (
  SELECT id,
         ROW_NUMBER() OVER (
           PARTITION BY user_id, event_id,
             lower(trim(name)), lower(trim(coalesce(village,''))),
             coalesce(amount,0), lower(trim(coalesce(payment_mode,''))),
             lower(trim(coalesce(gift_type,''))),
             lower(trim(coalesce(gift_description,'')))
           ORDER BY created_at NULLS LAST, id
         ) AS rn
  FROM public.guests
  WHERE coalesce(deleted,false) = false
)
DELETE FROM public.guests g
USING ranked r
WHERE g.id = r.id AND r.rn > 1;

-- Client writes must use the row id and upsert on conflict.
-- The application has been updated to generate one UUID per entry and use upsert.
