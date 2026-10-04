-- Runs after server/supabase/schema.sql on the first start: the server's service role reads and writes the tables.
-- (Hosted Supabase grants this by default.)
grant usage on schema public to service_role;
grant all on all tables in schema public to service_role;
notify pgrst, 'reload schema';
