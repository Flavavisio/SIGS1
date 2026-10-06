-- Prices are monthly EUR excluding VAT; no annual price was specified.
insert into public.plans (code,name,description,default_max_sales_users,monthly_price,yearly_price,currency,active,sort_order,max_projects,max_items_per_project)
values ('SUPREME','Supreme','Acesso completo. Projetos ilimitados por empresa e 200 equipamentos por projeto. IVA não incluído.',0,19.99,null,'EUR',true,40,null,200)
on conflict (code) do update set name=excluded.name,description=excluded.description,monthly_price=excluded.monthly_price,max_projects=excluded.max_projects,max_items_per_project=excluded.max_items_per_project,active=true,sort_order=40;
