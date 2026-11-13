BEGIN;

ALTER TABLE public.users
ADD COLUMN IF NOT EXISTS auth_user_id UUID;

CREATE UNIQUE INDEX IF NOT EXISTS
akirrai_users_auth_uid_unique
ON public.users(auth_user_id)
WHERE auth_user_id IS NOT NULL;

CREATE TABLE IF NOT EXISTS public.akirrai_sepay_inbox(
  sepay_id BIGINT PRIMARY KEY,
  payment_reference TEXT NOT NULL,
  account_number TEXT NOT NULL,
  amount_vnd BIGINT NOT NULL,
  status TEXT NOT NULL DEFAULT 'RECEIVED',
  payload JSONB NOT NULL,
  received_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.akirrai_sepay_inbox
ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON TABLE public.akirrai_sepay_inbox
FROM PUBLIC, anon, authenticated;

GRANT SELECT, INSERT, UPDATE
ON TABLE public.akirrai_sepay_inbox
TO service_role;

CREATE OR REPLACE FUNCTION
public.akirrai_sepay_apply_webhook(
  p_sepay_id BIGINT,
  p_reference TEXT,
  p_amount BIGINT,
  p_account TEXT,
  p_expected_account TEXT,
  p_payload JSONB
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $fn$
DECLARE
  o public.payment_orders%ROWTYPE;
  u public.users%ROWTYPE;
  previous_event public.akirrai_sepay_inbox%ROWTYPE;
BEGIN
  IF p_sepay_id IS NULL OR p_sepay_id < 1
     OR p_amount IS NULL OR p_amount <= 0
     OR p_reference !~ '^AKR[A-F0-9]{16}$'
     OR p_account IS NULL
     OR p_account <> p_expected_account
     OR length(p_account) < 6
     OR p_payload IS NULL
  THEN
    RAISE EXCEPTION 'invalid_sepay_data';
  END IF;

  INSERT INTO public.akirrai_sepay_inbox(
    sepay_id,payment_reference,
    account_number,amount_vnd,payload
  )
  VALUES(
    p_sepay_id,p_reference,
    p_account,p_amount,p_payload
  )
  ON CONFLICT(sepay_id) DO NOTHING;

  IF NOT FOUND THEN
    SELECT * INTO previous_event
    FROM public.akirrai_sepay_inbox
    WHERE sepay_id = p_sepay_id;

    IF previous_event.payment_reference
         IS DISTINCT FROM p_reference
       OR previous_event.amount_vnd
         IS DISTINCT FROM p_amount
       OR previous_event.account_number
         IS DISTINCT FROM p_account
    THEN
      RAISE EXCEPTION 'sepay_reused_transaction_id';
    END IF;

    RETURN jsonb_build_object(
      'result','duplicate','credited',FALSE
    );
  END IF;

  SELECT * INTO o
  FROM public.payment_orders
  WHERE payment_reference = p_reference
  FOR UPDATE;

  IF NOT FOUND THEN
    UPDATE public.akirrai_sepay_inbox
    SET status='UNKNOWN_ORDER'
    WHERE sepay_id=p_sepay_id;

    RETURN jsonb_build_object(
      'result','unknown_order','credited',FALSE
    );
  END IF;

  IF o.status <> 'PENDING' THEN
    UPDATE public.akirrai_sepay_inbox
    SET status='ALREADY_FINAL'
    WHERE sepay_id=p_sepay_id;

    RETURN jsonb_build_object(
      'result','already_final','credited',FALSE
    );
  END IF;

  IF o.expires_at IS NOT NULL
     AND NOW()>o.expires_at
  THEN
    UPDATE public.akirrai_sepay_inbox
    SET status='EXPIRED'
    WHERE sepay_id=p_sepay_id;

    RETURN jsonb_build_object(
      'result','expired','credited',FALSE
    );
  END IF;

  IF o.currency <> 'VND'
     OR o.amount_vnd::BIGINT <> p_amount
  THEN
    UPDATE public.akirrai_sepay_inbox
    SET status='AMOUNT_MISMATCH'
    WHERE sepay_id=p_sepay_id;

    RETURN jsonb_build_object(
      'result','amount_mismatch','credited',FALSE
    );
  END IF;

  SELECT * INTO u
  FROM public.users
  WHERE internal_user_id=o.user_id
  FOR UPDATE;

  IF NOT FOUND
     OR u.provider_uid IS DISTINCT FROM o.provider_uid
  THEN
    RAISE EXCEPTION 'order_user_mismatch';
  END IF;

  INSERT INTO public.payment_events(
    event_id,order_id,payment_reference,
    amount_received,bank_tx_id,source,raw_payload
  )
  VALUES(
    'sepay_'||p_sepay_id,o.order_id,p_reference,
    p_amount::INTEGER,'sepay_'||p_sepay_id,
    'WEBHOOK_SEPAY',p_payload
  );

  UPDATE public.users
  SET
    paid_credits_balance=paid_credits_balance+o.credits,
    total_spent_vnd=total_spent_vnd+p_amount
  WHERE internal_user_id=o.user_id
  RETURNING * INTO u;

  INSERT INTO public.credit_ledger(
    user_id,provider_uid,delta_credits,
    balance_after,reason,reference_id
  )
  VALUES(
    o.user_id,o.provider_uid,o.credits,
    u.paid_credits_balance,
    'PURCHASE','sepay:order:'||o.order_id
  );

  UPDATE public.payment_orders
  SET status='PAID',paid_at=NOW()
  WHERE order_id=o.order_id;

  UPDATE public.akirrai_sepay_inbox
  SET status='APPLIED'
  WHERE sepay_id=p_sepay_id;

  RETURN jsonb_build_object(
    'result','applied','credited',TRUE
  );
END;
$fn$;

REVOKE ALL ON FUNCTION
public.akirrai_sepay_apply_webhook(
  BIGINT,TEXT,BIGINT,TEXT,TEXT,JSONB
)
FROM PUBLIC, anon, authenticated;

GRANT EXECUTE ON FUNCTION
public.akirrai_sepay_apply_webhook(
  BIGINT,TEXT,BIGINT,TEXT,TEXT,JSONB
)
TO service_role;

COMMIT;