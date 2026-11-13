CREATE OR REPLACE FUNCTION public.akirrai_reserve_ai_job(p_user_id uuid, p_request_key text, p_filter_id text)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
DECLARE
  u public.users%ROWTYPE;
  q public.daily_quotas%ROWTYPE;
  old_job public.ai_jobs%ROWTYPE;
  vn_day TEXT := ((NOW() AT TIME ZONE 'Asia/Ho_Chi_Minh')::DATE)::TEXT;
  new_job_id TEXT := 'job_' || replace(gen_random_uuid()::TEXT, '-', '');
  chosen_type TEXT;
BEGIN
  IF p_user_id IS NULL
     OR p_request_key IS NULL
     OR length(p_request_key) NOT BETWEEN 8 AND 128
     OR p_filter_id IS NULL
     OR p_filter_id !~ '^[A-Za-z0-9_.:-]{2,100}$'
  THEN
    RAISE EXCEPTION 'invalid_job_request';
  END IF;

  SELECT * INTO u
  FROM public.users
  WHERE internal_user_id = p_user_id
  FOR UPDATE;

  IF NOT FOUND
     OR u.account_status <> 'ACTIVE'
     OR u.verification_status <> 'ADMIN_VERIFIED'
  THEN
    RAISE EXCEPTION 'account_not_verified';
  END IF;

  SELECT * INTO old_job
  FROM public.ai_jobs
  WHERE idempotency_key = p_request_key;

  IF FOUND THEN
    IF old_job.user_id IS DISTINCT FROM p_user_id
       OR old_job.filter_id <> p_filter_id
    THEN
      RAISE EXCEPTION 'idempotency_key_conflict';
    END IF;

    RETURN jsonb_build_object(
      'jobId', old_job.job_id,
      'status', old_job.status,
      'reservationType', old_job.reservation_type,
      'replayed', TRUE
    );
  END IF;

  IF u.is_unlimited
     AND u.role IN ('ADMIN', 'SUPER_ADMIN')
  THEN
    chosen_type := 'ADMIN_UNLIMITED';
  ELSE
    INSERT INTO public.daily_quotas(user_id, vn_date)
    VALUES(p_user_id, vn_day)
    ON CONFLICT(user_id, vn_date) DO NOTHING;

    SELECT * INTO q
    FROM public.daily_quotas
    WHERE user_id = p_user_id
      AND vn_date = vn_day
    FOR UPDATE;

    IF q.free_used + q.reserved_count < q.free_limit THEN
      UPDATE public.daily_quotas
      SET reserved_count = reserved_count + 1,
          updated_at = NOW()
      WHERE id = q.id;

      chosen_type := 'FREE_DAILY';

    ELSIF u.paid_credits_balance > 0 THEN
      UPDATE public.users
      SET paid_credits_balance = paid_credits_balance - 1
      WHERE internal_user_id = p_user_id
      RETURNING * INTO u;

      chosen_type := 'PAID_CREDIT';

    ELSE
      RAISE EXCEPTION 'quota_exhausted';
    END IF;
  END IF;

  INSERT INTO public.ai_jobs(
    job_id, idempotency_key, user_id,
    provider_uid, vn_date, filter_id, reservation_type, status
  )
  VALUES(
    new_job_id, p_request_key, p_user_id,
    u.provider_uid, vn_day, p_filter_id, chosen_type, 'RESERVED'
  );

  IF chosen_type = 'PAID_CREDIT' THEN
    INSERT INTO public.credit_ledger(
      user_id, provider_uid, delta_credits,
      balance_after, reason, reference_id
    )
    VALUES(
      p_user_id, u.provider_uid, -1,
      u.paid_credits_balance, 'AI_CONSUME',
      'consume:' || new_job_id
    );
  END IF;

  RETURN jsonb_build_object(
    'jobId', new_job_id,
    'status', 'RESERVED',
    'reservationType', chosen_type,
    'replayed', FALSE
  );
END;
$function$
;
ALTER TABLE public.payment_orders ADD COLUMN IF NOT EXISTS package_id TEXT;
DO $block$ DECLARE f record; BEGIN FOR f IN SELECT p.oid::regprocedure AS signature FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace WHERE n.nspname='public' AND p.proname IN ('rpc_reserve_ai_quota','rpc_finalize_ai_job','rpc_settle_payment_order','rls_auto_enable') LOOP EXECUTE format('REVOKE EXECUTE ON FUNCTION %s FROM PUBLIC, anon, authenticated',f.signature); END LOOP; END $block$;

