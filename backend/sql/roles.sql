-- Least-privilege roles. Run once per branch in the Neon SQL Editor, as neondb_owner.
-- Roles made in the Neon Console, CLI or API join neon_superuser (read/write all
-- data, CREATEROLE, BYPASSRLS), so these must be created with SQL.
-- No passwords here: a login role without one cannot sign in until a separate
-- ALTER ROLE ... WITH PASSWORD sets it (32+ random letters and digits, never committed).

-- The app (Render). Only what the endpoints need.
create role app_user with login;
grant usage on schema public to app_user;
grant select, insert, update, delete on table public.preparations to app_user;
grant select, insert, delete on table public.users to app_user;
grant insert on table public.web_vitals to app_user;
grant usage on sequence public.users_id_seq, public.web_vitals_id_seq to app_user;

-- The daily backup job (pg_dump). Read-only, and new tables are covered by default
-- so a later migration can't silently drop out of the backup.
create role backup_reader with login;
grant usage on schema public, drizzle to backup_reader;
grant select on all tables in schema public, drizzle to backup_reader;
grant select on all sequences in schema public, drizzle to backup_reader;
alter default privileges for role neondb_owner in schema public, drizzle grant select on tables to backup_reader;
alter default privileges for role neondb_owner in schema public, drizzle grant select on sequences to backup_reader;
