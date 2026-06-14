-- Harden RLS on darq_signals.
-- darq_signals is NOT accessed by the anon client: the app uses posts/subscribers,
-- and the Agentic OS dashboard reads via the SECURITY DEFINER function get_darq_pulse().
-- Signal ingestion uses the service-role key, which bypasses RLS.
-- Enabling RLS with no anon/authenticated policies denies all direct anon table access
-- while leaving service-role and SECURITY DEFINER RPC access intact.
alter table public.darq_signals enable row level security;
