-- PeakProgress: atomic routine synchronization.
-- Apply only after reviewing on a staging Supabase project.
BEGIN;

ALTER TABLE
  public.routine_sync_operations
ADD
  COLUMN IF NOT EXISTS applied_version bigint;

CREATE
OR REPLACE FUNCTION public.apply_routine_sync_operation(
  p_operation_id uuid,
  p_routine_id uuid,
  p_operation_type text,
  p_expected_version bigint,
  p_payload jsonb
) RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER
SET
  search_path = '' AS $function$ DECLARE v_user_id uuid := (
    SELECT
      auth.uid()
  );

v_state public.routine_sync_state % ROWTYPE;

v_owner uuid;

v_old public.routine_sync_operations % ROWTYPE;

v_hash text;

v_new_version bigint;

v_name text;

v_ex jsonb;

v_set jsonb;

v_ex_id uuid;

v_set_id uuid;

v_catalog_id uuid;

v_parent_id uuid;

v_count integer;

v_ex_ids uuid [] := ARRAY [] :: uuid [];

v_set_ids uuid [] := ARRAY [] :: uuid [];

v_position integer;

v_rest integer;

v_exercise_rest integer;

v_reps integer;

v_weight numeric;

v_is_pr boolean;

v_notes text;

BEGIN IF v_user_id IS NULL THEN RAISE EXCEPTION 'Authentication required';

END IF;

IF p_operation_id IS NULL
OR p_routine_id IS NULL THEN RAISE EXCEPTION 'Operation and routine IDs are required';

END IF;

IF p_operation_type IS NULL
OR p_operation_type NOT IN ('upsert', 'delete') THEN RAISE EXCEPTION 'Invalid operation type';

END IF;

IF p_expected_version IS NOT NULL
AND p_expected_version < 0 THEN RAISE EXCEPTION 'Invalid expected version';

END IF;

IF p_payload IS NULL
OR pg_catalog.jsonb_typeof(p_payload) <> 'object' THEN RAISE EXCEPTION 'Payload must be an object';

END IF;

-- Serialize all operations for a given routine through this RPC.
PERFORM pg_catalog.pg_advisory_xact_lock(
  pg_catalog.hashtextextended(p_routine_id :: text, 0)
);

SELECT
  r.user_id INTO v_owner
FROM
  public.routines r
WHERE
  r.id = p_routine_id;

IF v_owner IS NOT NULL
AND v_owner <> v_user_id THEN RAISE EXCEPTION 'Routine belongs to another user';

END IF;

SELECT
  * INTO v_state
FROM
  public.routine_sync_state s
WHERE
  s.routine_id = p_routine_id FOR
UPDATE
;

IF FOUND
AND v_state.user_id <> v_user_id THEN RAISE EXCEPTION 'Sync state belongs to another user';

END IF;

IF v_owner IS NOT NULL
AND v_state.routine_id IS NOT NULL
AND v_owner <> v_state.user_id THEN RAISE EXCEPTION 'Inconsistent routine ownership';

END IF;

v_hash := pg_catalog.md5(
  pg_catalog.jsonb_build_object(
    'routineId',
    p_routine_id,
    'operationType',
    p_operation_type,
    'expectedVersion',
    p_expected_version,
    'payload',
    p_payload
  ) :: text
);

SELECT
  * INTO v_old
FROM
  public.routine_sync_operations o
WHERE
  o.user_id = v_user_id
  AND o.operation_id = p_operation_id;

IF FOUND THEN IF v_old.routine_id <> p_routine_id
OR v_old.operation_type <> p_operation_type
OR v_old.request_hash <> v_hash THEN RAISE EXCEPTION 'Operation ID reused with different content';

END IF;

-- Historical operations may have NULL applied_version; do not invent it.
IF v_old.applied_version IS NULL THEN
  RETURN pg_catalog.jsonb_build_object(
    'status', 'version_unknown',
    'routine_id', p_routine_id,
    'remote_version', v_state.version
  );
END IF;

RETURN pg_catalog.jsonb_build_object(
  'status', 'already_applied',
  'routine_id', p_routine_id,
  'remote_version', v_old.applied_version
);

END IF;

-- NULL only matches a missing sync-state row.
IF v_state.version IS DISTINCT
FROM
  p_expected_version THEN RETURN pg_catalog.jsonb_build_object(
    'status',
    'conflict',
    'routine_id',
    p_routine_id,
    'remote_version',
    v_state.version
  );

END IF;

-- A legacy routine without sync state must not be overwritten as a new routine.
IF v_state.routine_id IS NULL
AND v_owner IS NOT NULL THEN RAISE EXCEPTION 'Legacy routine has no sync state';

END IF;

IF p_operation_type = 'upsert' THEN IF v_state.is_deleted IS TRUE THEN RETURN pg_catalog.jsonb_build_object(
  'status',
  'conflict',
  'routine_id',
  p_routine_id,
  'remote_version',
  v_state.version
);

END IF;

IF p_payload ->> 'routineId' IS DISTINCT
FROM
  p_routine_id :: text THEN RAISE EXCEPTION 'Snapshot routineId mismatch';

END IF;

IF pg_catalog.jsonb_typeof(p_payload -> 'name') IS DISTINCT
FROM
  'string' THEN RAISE EXCEPTION 'Invalid routine name';

END IF;

v_name := pg_catalog.btrim(p_payload ->> 'name');

IF v_name = ''
OR pg_catalog.length(v_name) > 200 THEN RAISE EXCEPTION 'Invalid routine name length';

END IF;

IF pg_catalog.jsonb_typeof(p_payload -> 'exercises') IS DISTINCT
FROM
  'array'
  OR pg_catalog.jsonb_typeof(p_payload -> 'setsByExerciseId') IS DISTINCT
FROM
  'object' THEN RAISE EXCEPTION 'Invalid snapshot collections';

END IF;

IF pg_catalog.jsonb_array_length(p_payload -> 'exercises') > 500 THEN RAISE EXCEPTION 'Too many exercises';

END IF;

-- Validate every exercise and collect its stable ID before any write.
FOR v_ex IN
SELECT
  value
FROM
  pg_catalog.jsonb_array_elements(p_payload -> 'exercises') LOOP IF pg_catalog.jsonb_typeof(v_ex) IS DISTINCT
FROM
  'object'
  OR (v_ex ->> 'id') IS NULL
  OR (v_ex ->> 'exercise_id') IS NULL THEN RAISE EXCEPTION 'Invalid exercise';

END IF;

v_ex_id := (v_ex ->> 'id') :: uuid;

v_catalog_id := (v_ex ->> 'exercise_id') :: uuid;

IF v_ex_id = ANY(v_ex_ids) THEN RAISE EXCEPTION 'Duplicate exercise ID';

END IF;

v_ex_ids := pg_catalog.array_append(v_ex_ids, v_ex_id);

IF NOT EXISTS (
  SELECT
    1
  FROM
    public.exercises e
  WHERE
    e.id = v_catalog_id
) THEN RAISE EXCEPTION 'Exercise catalog entry not found';

END IF;

IF EXISTS (
  SELECT
    1
  FROM
    public.routine_exercises AS re
  WHERE
    re.id = v_ex_id
    AND (
      re.routine_id <> p_routine_id
      OR re.exercise_id <> v_catalog_id
    )
) THEN RAISE EXCEPTION 'Exercise ID already belongs to another identity';

END IF;

IF pg_catalog.jsonb_typeof(v_ex -> 'position') IS DISTINCT
FROM
  'number'
  OR pg_catalog.jsonb_typeof(v_ex -> 'rest_seconds') IS DISTINCT
FROM
  'number'
  OR (
    v_ex ? 'exercise_rest_seconds'
    AND v_ex -> 'exercise_rest_seconds' <> 'null' :: jsonb
    AND pg_catalog.jsonb_typeof(v_ex -> 'exercise_rest_seconds') IS DISTINCT
    FROM
      'number'
  ) THEN RAISE EXCEPTION 'Invalid exercise configuration';

END IF;

v_position := (v_ex ->> 'position') :: integer;

v_rest := (v_ex ->> 'rest_seconds') :: integer;

v_exercise_rest := COALESCE(
  (v_ex ->> 'exercise_rest_seconds') :: integer,
  120
);

IF v_position < 0
OR v_rest < 0
OR v_exercise_rest < 0 THEN RAISE EXCEPTION 'Negative exercise configuration';

END IF;

IF v_ex ? 'notes'
AND v_ex -> 'notes' <> 'null' :: jsonb
AND pg_catalog.jsonb_typeof(v_ex -> 'notes') IS DISTINCT
FROM
  'string' THEN RAISE EXCEPTION 'Invalid notes';

END IF;

END LOOP;

-- Validate set groups and each set, including global UUID ownership.
FOR v_parent_id IN
SELECT
  key :: uuid
FROM
  pg_catalog.jsonb_each(p_payload -> 'setsByExerciseId') LOOP IF NOT v_parent_id = ANY(v_ex_ids) THEN RAISE EXCEPTION 'Set group references missing exercise';

END IF;

IF pg_catalog.jsonb_typeof(
  p_payload -> 'setsByExerciseId' ->(v_parent_id :: text)
) IS DISTINCT
FROM
  'array' THEN RAISE EXCEPTION 'Set group must be an array';

END IF;

FOR v_set IN
SELECT
  value
FROM
  pg_catalog.jsonb_array_elements(
    p_payload -> 'setsByExerciseId' ->(v_parent_id :: text)
  ) LOOP IF pg_catalog.jsonb_typeof(v_set) IS DISTINCT
FROM
  'object'
  OR v_set ->> 'id' IS NULL
  OR v_set ->> 'routine_exercise_id' IS DISTINCT
FROM
  v_parent_id :: text
  OR pg_catalog.jsonb_typeof(v_set -> 'reps') IS DISTINCT
FROM
  'number'
  OR (
  pg_catalog.jsonb_typeof(v_set -> 'weight')
  NOT IN ('number', 'null')
)
OR NOT (v_set ? 'weight')
  OR (
    v_set ? 'is_pr'
    AND v_set -> 'is_pr' <> 'null' :: jsonb
    AND pg_catalog.jsonb_typeof(v_set -> 'is_pr') IS DISTINCT
    FROM
      'boolean'
  ) THEN RAISE EXCEPTION 'Invalid set';

END IF;

v_set_id := (v_set ->> 'id') :: uuid;

IF v_set_id = ANY(v_set_ids) THEN RAISE EXCEPTION 'Duplicate set ID';

END IF;

v_set_ids := pg_catalog.array_append(v_set_ids, v_set_id);

IF pg_catalog.array_length(v_set_ids, 1) > 5000 THEN RAISE EXCEPTION 'Too many routine sets';

END IF;

IF EXISTS (
  SELECT
    1
  FROM
    public.routine_exercise_sets AS s
  WHERE
    s.id = v_set_id
    AND s.routine_exercise_id <> v_parent_id
) THEN RAISE EXCEPTION 'Set ID already belongs to another exercise';

END IF;

v_reps := (v_set ->> 'reps') :: integer;

v_weight := (v_set ->> 'weight') :: numeric;

IF v_reps < 0
OR v_weight < 0 THEN RAISE EXCEPTION 'Negative set values';

END IF;

END LOOP;

END LOOP;

-- Upsert parent without recreating it.
INSERT INTO
  public.routines (id, user_id, name)
VALUES
  (p_routine_id, v_user_id, v_name) ON CONFLICT (id) DO
UPDATE
SET
  name = EXCLUDED.name
WHERE
  public.routines.user_id = EXCLUDED.user_id;

-- Insert/update exercises first so every set parent exists.
FOR v_ex IN
SELECT
  value
FROM
  pg_catalog.jsonb_array_elements(p_payload -> 'exercises') LOOP v_ex_id := (v_ex ->> 'id') :: uuid;

v_notes := v_ex ->> 'notes';

INSERT INTO
  public.routine_exercises (
    id,
    routine_id,
    exercise_id,
    position,
    rest_seconds,
    exercise_rest_seconds,
    notes
  )
VALUES
  (
    v_ex_id,
    p_routine_id,
    (v_ex ->> 'exercise_id') :: uuid,
    (v_ex ->> 'position') :: integer,
    (v_ex ->> 'rest_seconds') :: integer,
    COALESCE(
      (v_ex ->> 'exercise_rest_seconds') :: integer,
      120
    ),
    v_notes
  ) ON CONFLICT (id) DO
UPDATE
SET
  position = EXCLUDED.position,
  rest_seconds = EXCLUDED.rest_seconds,
  exercise_rest_seconds = EXCLUDED.exercise_rest_seconds,
  notes = EXCLUDED.notes
WHERE
  public.routine_exercises.routine_id = p_routine_id
  AND public.routine_exercises.exercise_id = EXCLUDED.exercise_id;
GET DIAGNOSTICS v_count = ROW_COUNT;

IF v_count <> 1 THEN
  RAISE EXCEPTION
    'Exercise identity conflict for ID %', v_ex_id;
END IF;

END LOOP;

-- Insert/update sets; keep original created_at on existing rows.
FOR v_parent_id IN
SELECT
  key :: uuid
FROM
  pg_catalog.jsonb_each(p_payload -> 'setsByExerciseId') LOOP FOR v_set IN
SELECT
  value
FROM
  pg_catalog.jsonb_array_elements(
    p_payload -> 'setsByExerciseId' ->(v_parent_id :: text)
  ) LOOP
INSERT INTO
  public.routine_exercise_sets (
    id,
    routine_exercise_id,
    reps,
    weight,
    is_pr
  )
VALUES
  (
    (v_set ->> 'id') :: uuid,
    v_parent_id,
    (v_set ->> 'reps') :: integer,
    (v_set ->> 'weight') :: numeric,
    COALESCE((v_set ->> 'is_pr') :: boolean, false)
  ) ON CONFLICT (id) DO
UPDATE
SET
  reps = EXCLUDED.reps,
  weight = EXCLUDED.weight,
  is_pr = EXCLUDED.is_pr
WHERE
  public.routine_exercise_sets.routine_exercise_id = EXCLUDED.routine_exercise_id;
GET DIAGNOSTICS v_count = ROW_COUNT;

IF v_count <> 1 THEN
  RAISE EXCEPTION
    'Set identity conflict for ID %', (v_set->>'id')::uuid;
END IF;

END LOOP;

END LOOP;

-- Remove only items absent from the new snapshot.
DELETE FROM
  public.routine_exercise_sets s USING public.routine_exercises re
WHERE
  s.routine_exercise_id = re.id
  AND re.routine_id = p_routine_id
  AND NOT (s.id = ANY(v_set_ids));

DELETE FROM
  public.routine_exercises re
WHERE
  re.routine_id = p_routine_id
  AND NOT (re.id = ANY(v_ex_ids));

ELSE -- Tombstone: preserve the routine and workout_sessions relationship.
-- A delete of a never-existing routine is not accepted.
IF v_state.routine_id IS NULL
OR v_owner IS NULL THEN RETURN pg_catalog.jsonb_build_object(
  'status',
  'conflict',
  'routine_id',
  p_routine_id,
  'remote_version',
  v_state.version
);

END IF;

IF v_state.is_deleted THEN RETURN pg_catalog.jsonb_build_object(
  'status',
  'conflict',
  'routine_id',
  p_routine_id,
  'remote_version',
  v_state.version
);

END IF;

END IF;

v_new_version := COALESCE(v_state.version, 0) + 1;

INSERT INTO
  public.routine_sync_state (
    routine_id,
    user_id,
    version,
    is_deleted,
    updated_at
  )
VALUES
  (
    p_routine_id,
    v_user_id,
    v_new_version,
    p_operation_type = 'delete',
    pg_catalog.now()
  ) ON CONFLICT (routine_id) DO
UPDATE
SET
  version = EXCLUDED.version,
  is_deleted = EXCLUDED.is_deleted,
  updated_at = EXCLUDED.updated_at
WHERE
  public.routine_sync_state.user_id = EXCLUDED.user_id;

INSERT INTO
  public.routine_sync_operations (
    operation_id,
    user_id,
    routine_id,
    operation_type,
    request_hash,
    applied_version
  )
VALUES
  (
    p_operation_id,
    v_user_id,
    p_routine_id,
    p_operation_type,
    v_hash,
    v_new_version
  );

RETURN pg_catalog.jsonb_build_object(
  'status',
  'applied',
  'routine_id',
  p_routine_id,
  'remote_version',
  v_new_version
);

END;

$function$;

COMMIT;