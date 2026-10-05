-- Names are required and unique inside each company, including archived projects.
-- Ignore letter case and repeated surrounding/internal whitespace.
ALTER TABLE public.projects
  ADD CONSTRAINT projects_name_required
  CHECK (btrim(regexp_replace(name, '[[:space:]]+', ' ', 'g')) <> '');
CREATE UNIQUE INDEX projects_company_name_unique
  ON public.projects (company_id, lower(btrim(regexp_replace(name, '[[:space:]]+', ' ', 'g'))));
