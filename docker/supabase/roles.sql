-- Gives the auth and REST services' database logins the stack's password. Runs once, on the first start.
\set pgpass `echo "$POSTGRES_PASSWORD"`
alter user authenticator with password :'pgpass';
alter user supabase_auth_admin with password :'pgpass';
