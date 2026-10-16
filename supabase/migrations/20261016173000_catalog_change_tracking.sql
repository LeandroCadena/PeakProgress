-- PeakProgress Step 103A: transactionally ordered catalog change feed.
-- Review and apply in staging before production.
BEGIN;

ALTER TABLE public.exercises
  ADD COLUMN IF NOT EXISTS is_active boolean NOT NULL DEFAULT true;

CREATE TABLE IF NOT EXISTS public.catalog_sync_clock (
  singleton boolean PRIMARY KEY DEFAULT true CHECK (singleton),
  version bigint NOT NULL DEFAULT 0 CHECK (version >= 0)
);
INSERT INTO public.catalog_sync_clock (singleton, version)
VALUES (true, 0) ON CONFLICT (singleton) DO NOTHING;

CREATE TABLE IF NOT EXISTS public.catalog_change_log (
  version bigint PRIMARY KEY,
  entity_type text NOT NULL CHECK (entity_type IN ('exercises','muscles','muscle_regions','exercise_muscles')),
  entity_id uuid NOT NULL,
  operation text NOT NULL CHECK (operation IN ('upsert','delete')),
  payload jsonb,
  changed_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT catalog_change_payload_check CHECK (
    (operation = 'delete' AND payload IS NULL)
    OR (operation = 'upsert' AND payload IS NOT NULL)
  )
);
CREATE INDEX IF NOT EXISTS catalog_change_log_entity_idx
  ON public.catalog_change_log (entity_type, entity_id, version DESC);

CREATE OR REPLACE FUNCTION public.record_catalog_change()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
DECLARE
  v_version bigint;
  v_row jsonb;
  v_id uuid;
BEGIN
  IF TG_OP = 'DELETE' THEN
    v_row := NULL;
    v_id := OLD.id;
  ELSE
    v_row := to_jsonb(NEW);
    v_id := NEW.id;
  END IF;

  -- Updating this single row holds a row lock until transaction commit.
  -- Concurrent writers therefore cannot publish a later committed version first.
  UPDATE public.catalog_sync_clock
     SET version = version + 1
   WHERE singleton = true
   RETURNING version INTO v_version;
  IF v_version IS NULL THEN
    RAISE EXCEPTION 'Catalog sync clock is missing';
  END IF;

  INSERT INTO public.catalog_change_log (version, entity_type, entity_id, operation, payload)
  VALUES (v_version, TG_TABLE_NAME, v_id,
          CASE WHEN TG_OP = 'DELETE' THEN 'delete' ELSE 'upsert' END, v_row);
  RETURN NULL;
END;
$$;

DO $$
DECLARE v_table text;
BEGIN
  FOREACH v_table IN ARRAY ARRAY['muscle_regions','muscles','exercises','exercise_muscles'] LOOP
    EXECUTE format('DROP TRIGGER IF EXISTS catalog_change_tracking ON public.%I', v_table);
    EXECUTE format('CREATE TRIGGER catalog_change_tracking AFTER INSERT OR UPDATE OR DELETE ON public.%I FOR EACH ROW EXECUTE FUNCTION public.record_catalog_change()', v_table);
  END LOOP;
END;
$$;

-- No direct client access to internal change tracking tables.
ALTER TABLE public.catalog_sync_clock ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.catalog_change_log ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.catalog_sync_clock FROM PUBLIC, anon, authenticated;
REVOKE ALL ON public.catalog_change_log FROM PUBLIC, anon, authenticated;

-- Clients only read catalog changes through authenticated, bounded RPCs.
CREATE OR REPLACE FUNCTION public.get_catalog_version()
RETURNS bigint LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
DECLARE v_version bigint;
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'Authentication required'; END IF;
  SELECT version INTO v_version FROM public.catalog_sync_clock WHERE singleton = true;
  RETURN v_version;
END;
$$;

CREATE OR REPLACE FUNCTION public.get_catalog_changes(p_after_version bigint, p_limit integer DEFAULT 200)
RETURNS TABLE(version bigint, entity_type text, entity_id uuid, operation text, payload jsonb)
LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'Authentication required'; END IF;
  IF p_after_version IS NULL OR p_after_version < 0 THEN
    RAISE EXCEPTION 'Invalid catalog cursor';
  END IF;
  IF p_limit IS NULL OR p_limit < 1 OR p_limit > 500 THEN
    RAISE EXCEPTION 'Invalid catalog page size';
  END IF;
  RETURN QUERY
    SELECT l.version, l.entity_type, l.entity_id, l.operation, l.payload
    FROM public.catalog_change_log AS l
    WHERE l.version > p_after_version
    ORDER BY l.version ASC
    LIMIT p_limit;
END;
$$;

REVOKE ALL ON FUNCTION public.get_catalog_version() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.get_catalog_changes(bigint, integer) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_catalog_version() TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_catalog_changes(bigint, integer) TO authenticated;

-- Seed a complete, transactionally consistent initial snapshot into the log.
-- All concurrent catalog writes wait on the sync clock once their trigger fires.
DO $$
DECLARE v_table text;
DECLARE v_record record;
DECLARE v_version bigint;
BEGIN
  PERFORM 1 FROM public.catalog_sync_clock WHERE singleton = true FOR UPDATE;
  FOREACH v_table IN ARRAY ARRAY['muscle_regions','muscles','exercises','exercise_muscles'] LOOP
    FOR v_record IN EXECUTE format('SELECT id, to_jsonb(t) AS payload FROM public.%I t ORDER BY id', v_table) LOOP
      UPDATE public.catalog_sync_clock SET version = version + 1 WHERE singleton = true
        RETURNING version INTO v_version;
      INSERT INTO public.catalog_change_log(version, entity_type, entity_id, operation, payload)
      VALUES (v_version, v_table, v_record.id, 'upsert', v_record.payload);
    END LOOP;
  END LOOP;
END;
$$;

COMMIT;
