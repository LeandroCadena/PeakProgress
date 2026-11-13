BEGIN;

ALTER TABLE public.routines ADD COLUMN cover_key text
    CHECK (cover_key IN ('chest', 'back', 'legs', 'shoulders', 'arms', 'core', 'fullBody'));

-- Keep the original operation validation, idempotency and versioning.
ALTER FUNCTION public.apply_routine_sync_operation(uuid, uuid, text, bigint, jsonb)
    RENAME TO apply_routine_sync_operation_v1;
REVOKE EXECUTE ON FUNCTION public.apply_routine_sync_operation_v1(uuid, uuid, text, bigint, jsonb)
    FROM PUBLIC, anon, authenticated;

CREATE FUNCTION public.apply_routine_sync_operation(
    p_operation_id uuid,
    p_routine_id uuid,
    p_operation_type text,
    p_expected_version bigint,
    p_payload jsonb
) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = ''
AS $$
DECLARE
    v_result jsonb;
    v_cover text := p_payload ->> 'cover';
BEGIN
    IF p_operation_type = 'upsert' AND p_payload ? 'cover'
        AND (v_cover IS NULL OR v_cover NOT IN ('chest', 'back', 'legs', 'shoulders', 'arms', 'core', 'fullBody'))
    THEN
        RAISE EXCEPTION 'Invalid routine cover';
    END IF;

    v_result := public.apply_routine_sync_operation_v1(
        p_operation_id, p_routine_id, p_operation_type, p_expected_version, p_payload
    );

    IF p_operation_type = 'upsert' AND v_cover IS NOT NULL AND v_result ->> 'status' = 'applied' THEN
        UPDATE public.routines
        SET cover_key = v_cover
        WHERE id = p_routine_id AND user_id = auth.uid();
    END IF;

    RETURN v_result;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.apply_routine_sync_operation(uuid, uuid, text, bigint, jsonb)
    FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.apply_routine_sync_operation(uuid, uuid, text, bigint, jsonb)
    TO authenticated;

COMMIT;
