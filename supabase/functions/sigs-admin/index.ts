import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};
const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status, headers: { ...cors, "Content-Type": "application/json" } });

function validDemoDays(value:unknown){const n=Number(value??30);return Number.isInteger(n)&&n>=1&&n<=365;}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);

  const url = Deno.env.get("SUPABASE_URL")!;
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const jwt = (req.headers.get("Authorization") || "").replace(/^Bearer\s+/i, "");
  if (!jwt) return json({ error: "Missing token" }, 401);

  const admin = createClient(url, serviceKey, { auth: { persistSession: false, autoRefreshToken: false } });
  const { data: userData, error: userErr } = await admin.auth.getUser(jwt);
  if (userErr || !userData.user) return json({ error: "Invalid session" }, 401);
  const callerId = userData.user.id;

  const { data: caller, error: callerErr } = await admin.from("profiles").select("id,role,active").eq("id", callerId).single();
  if (callerErr || !caller?.active) return json({ error: "Inactive user" }, 403);

  const { data: membership } = await admin.from("company_members").select("company_id,role,active").eq("user_id", callerId).eq("active", true).maybeSingle();
  const isSuper = caller.role === "SUPER_ADMIN";
  const isAdmin = membership?.role === "ADMIN" && membership?.active === true;

  let body: any;
  try { body = await req.json(); } catch { return json({ error: "Invalid JSON" }, 400); }
  let action = String(body?.action || "");
  // Cached clients must also invite the customer instead of setting a password.
  if (action === "create_admin_with_password") {
    action = "invite_user";
    body.role = "ADMIN";
  }

  try {
    if (action === "provision_customer") {
      if (!isSuper) return json({ error: "SUPER_ADMIN required" }, 403);
      if(String(body.plan_code).toUpperCase()==="DEMO"&&!validDemoDays(body.demo_days))return json({error:"A demo deve durar entre 1 e 365 dias."},400);
      const email=String(body.email||"").trim().toLowerCase(), name=String(body.name||"").trim();
      if (!name || !String(body.company_name||"").trim()) return json({error:"Empresa e nome do cliente são obrigatórios."},400);
      const {error: checkError}=await admin.rpc("sigs_admin_customer",{p_caller:callerId,p_action:"check_email",p_data:{email}});
      if(checkError) return json({error:checkError.message},checkError.code==="23505"?409:400);
      const {data: invited,error:inviteError}=await admin.auth.admin.inviteUserByEmail(email,{redirectTo:"https://www.sigs-studio.pt/acesso.html",data:{name}});
      if(inviteError) return json({error:inviteError.message},inviteError.status===422?409:502);
      const userId=invited.user?.id;if(!userId) return json({error:"O convite não criou uma conta."},500);
      const {data: customer,error:createError}=await admin.rpc("sigs_admin_customer",{p_caller:callerId,p_action:"create",p_data:{...body,email,name,user_id:userId}});
      if(createError){
        const {error:cleanupError}=await admin.rpc("sigs_admin_customer",{p_caller:callerId,p_action:"cancel_invite",p_data:{user_id:userId}});
        return json({error:cleanupError?"O registo falhou e a conta do convite precisa de revisão pelo Super Admin.":"O registo não foi concluído. Nenhuma empresa ou licença foi criada; tenta novamente."},500);
      }
      return json(customer);
    }
    if (action === "create_company") {
      if (!isSuper) return json({ error: "SUPER_ADMIN required" }, 403);
      const name = String(body.name || "").trim();
      if (!name) return json({ error: "Company name required" }, 400);
      const { data: company, error } = await admin.from("companies").insert({ name, legal_name: body.legal_name || null, nif: body.nif || null, email: body.email || null, phone: body.phone || null, address: body.address || null, postal_code: body.postal_code || null, city: body.city || null, country: body.country || "PT", client_code: body.client_code || null, created_by: callerId }).select().single();
      if (error) throw error;
      const { error: se } = await admin.from("company_settings").insert({ company_id: company.id, commercial_name: name });
      if (se) throw se;
      await admin.from("audit_logs").insert({ company_id: company.id, user_id: callerId, action: "COMPANY_CREATED", entity_type: "company", entity_id: company.id });
      return json({ company });
    }

    if (action === "issue_license") {
      if (!isSuper) return json({ error: "SUPER_ADMIN required" }, 403);
      const companyId = String(body.company_id || "");
      if (!companyId) return json({ error: "company_id required" }, 400);
      const maxSales = null;
      const licenseKey = body.license_key || `SIGS-${crypto.randomUUID().slice(0,8).toUpperCase()}-${crypto.randomUUID().slice(0,4).toUpperCase()}`;
      const modules = Array.isArray(body.modules) && body.modules.length ? body.modules : ["CCTV","INTRUSION","FIRE","MAPS","BOM","BUDGET","PDF_EXPORT","CLOUD","ADVANCED_REPORTS"];
      const planCode = String(body.plan_code || "EXPRESS").toUpperCase();
      const billingInterval = String(body.billing_interval || "MONTH").toUpperCase() === "YEAR" ? "YEAR" : "MONTH";
      const { data: plan } = await admin.from("plans").select("id,code").eq("code", planCode).maybeSingle();
      if (!plan) return json({ error: "Invalid plan" }, 400);
      if(planCode==="DEMO"&&!validDemoDays(body.demo_days))return json({error:"A demo deve durar entre 1 e 365 dias."},400);
      const startsAt = body.starts_at ? new Date(body.starts_at) : new Date();
      let expiresAt = body.expires_at ? new Date(body.expires_at) : new Date(startsAt);
      if (!body.expires_at) {
        if (billingInterval === "YEAR") expiresAt.setFullYear(expiresAt.getFullYear() + 1);
        else expiresAt.setMonth(expiresAt.getMonth() + 1);
      }
      if(planCode==="DEMO")expiresAt=new Date(startsAt.getTime()+Number(body.demo_days??30)*86400000);
      if(!Number.isFinite(startsAt.getTime())||!Number.isFinite(expiresAt.getTime())||expiresAt<=startsAt)return json({error:"Validade inválida"},400);
      const { data: lic, error } = await admin.from("licenses").insert({ company_id: companyId, plan_id: plan.id, license_key: licenseKey, status: body.status || "ACTIVE", max_sales_users: null, billing_interval: billingInterval, starts_at: startsAt.toISOString(), expires_at: expiresAt.toISOString(), trial_until: planCode==="DEMO"?expiresAt.toISOString():null, auto_renew:false, notes: body.notes || null, created_by: callerId }).select().single();
      if (error) throw error;
      if (modules.length) {
        const { error: me } = await admin.from("license_modules").insert(modules.map((m: string) => ({ license_id: lic.id, module_code: m, enabled: true })));
        if (me) throw me;
      }
      await admin.from("audit_logs").insert({ company_id: companyId, user_id: callerId, action: "LICENSE_ISSUED", entity_type: "license", entity_id: lic.id, metadata: { max_sales_users: maxSales, modules } });
      return json({ license: lic });
    }


    if (action === "create_sales_with_password") {
      const companyId = String(body.company_id || membership?.company_id || "");
      const email = String(body.email || "").trim().toLowerCase();
      const name = String(body.name || "").trim();
      const password = String(body.password || "");
      if (!companyId || !email || !password) return json({ error: "company_id, email and password required" }, 400);
      if (password.length < 8) return json({ error: "Password must have at least 8 characters" }, 400);
      if (!isSuper && !(isAdmin && membership?.company_id === companyId)) return json({ error: "Not allowed" }, 403);

      const nowIso = new Date().toISOString();
      const { data: lic } = await admin.from("licenses")
        .select("id,status,starts_at,expires_at")
        .eq("company_id", companyId)
        .eq("status", "ACTIVE")
        .lte("starts_at", nowIso)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (!lic || (lic.expires_at && new Date(lic.expires_at) <= new Date())) {
        return json({ error: "No active license", code: "NO_ACTIVE_LICENSE" }, 402);
      }

      const { data: created, error: createErr } = await admin.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: { name }
      });
      if (createErr) throw createErr;
      const user = created.user;
      if (!user?.id) return json({ error: "User creation failed" }, 500);

      const { error: pe } = await admin.from("profiles").update({
        name: name || email.split("@")[0],
        email,
        role: "SALES",
        active: true
      }).eq("id", user.id);
      if (pe) throw pe;

      const { error: me } = await admin.from("company_members").upsert({
        company_id: companyId,
        user_id: user.id,
        role: "SALES",
        active: true,
        invited_by: callerId
      }, { onConflict: "company_id,user_id" });
      if (me) throw me;

      await admin.from("audit_logs").insert({
        company_id: companyId,
        user_id: callerId,
        action: "SALES_CREATED",
        entity_type: "user",
        entity_id: user.id,
        metadata: { email }
      });

      return json({ user_id: user.id, email, role: "SALES" });
    }

    if (action === "invite_user") {
      const companyId = String(body.company_id || membership?.company_id || "");
      const role = String(body.role || "SALES").toUpperCase();
      const email = String(body.email || "").trim().toLowerCase();
      const name = String(body.name || "").trim();
      if (!companyId || !email) return json({ error: "company_id and email required" }, 400);
      if (!(role === "ADMIN" || role === "SALES")) return json({ error: "Invalid role" }, 400);
      if (!isSuper && !(isAdmin && membership?.company_id === companyId && role === "SALES")) return json({ error: "Not allowed" }, 403);

      if (role === "SALES") {
        const nowIso = new Date().toISOString();
        const { data: lic } = await admin.from("licenses").select("id,status,starts_at,expires_at").eq("company_id", companyId).eq("status", "ACTIVE").lte("starts_at", nowIso).order("created_at", { ascending: false }).limit(1).maybeSingle();
        if (!lic || (lic.expires_at && new Date(lic.expires_at) <= new Date())) return json({ error: "No active license", code: "NO_ACTIVE_LICENSE" }, 402);
      }

      if (!name || !/^[^\s@,;<>]+@[^\s@,;<>]+\.[^\s@,;<>]+$/.test(email)) return json({ error: "Nome e email válido são obrigatórios." }, 400);
      const { data: company, error: companyErr } = await admin.from("companies").select("id").eq("id", companyId).maybeSingle();
      if (companyErr) throw companyErr;
      if (!company) return json({ error: "Empresa não encontrada." }, 404);
      // This redirect is server-controlled; passwords are never supplied by the inviter.
      const { data: invite, error: inviteErr } = await admin.auth.admin.inviteUserByEmail(email, { redirectTo: "https://www.sigs-studio.pt/acesso.html", data: { name } });
      if (inviteErr) throw inviteErr;
      const invitedUser = invite.user;
      if (!invitedUser?.id) return json({ error: "Invite did not return user" }, 500);

      const { error: pe } = await admin.from("profiles").update({ name: name || email.split("@")[0], email, role, active: true }).eq("id", invitedUser.id);
      if (pe) throw pe;
      const { error: memberErr } = await admin.from("company_members").upsert({ company_id: companyId, user_id: invitedUser.id, role, active: true, invited_by: callerId }, { onConflict: "company_id,user_id" });
      if (memberErr) throw memberErr;

      await admin.from("invitations").update({ status: "CANCELLED" }).eq("company_id", companyId).eq("email", email).eq("status", "PENDING");
      const { error: invErr } = await admin.from("invitations").insert({ company_id: companyId, email, role, status: "PENDING", expires_at: new Date(Date.now()+7*24*60*60*1000).toISOString(), invited_by: callerId });
      if (invErr) throw invErr;
      await admin.from("audit_logs").insert({ company_id: companyId, user_id: callerId, action: "USER_INVITED", entity_type: "user", entity_id: invitedUser.id, metadata: { email, role } });
      return json({ user_id: invitedUser.id, email, role, activation_email_sent: true });
    }


    if (action === "set_user_password") {
      const userId = String(body.user_id || "");
      const password = String(body.password || "");
      if (!userId || !password) return json({ error: "user_id and password required" }, 400);
      if (password.length < 8) return json({ error: "Password must have at least 8 characters" }, 400);

      if (callerId !== userId) {
        if (!isSuper) return json({ error: "SUPER_ADMIN required" }, 403);
        const { data: targetProfile } = await admin.from("profiles").select("role,active").eq("id", userId).maybeSingle();
        if (!targetProfile || targetProfile.role !== "ADMIN") return json({ error: "Only Admin passwords can be changed here" }, 403);
      }

      const { error: pwErr } = await admin.auth.admin.updateUserById(userId, { password });
      if (pwErr) throw pwErr;

      await admin.from("audit_logs").insert({
        company_id: membership?.company_id || null,
        user_id: callerId,
        action: callerId === userId ? "PASSWORD_CHANGED_SELF" : "ADMIN_PASSWORD_CHANGED",
        entity_type: "user",
        entity_id: userId
      });

      return json({ ok: true });
    }

    if (action === "set_member_active") {
      const companyId = String(body.company_id || membership?.company_id || "");
      const userId = String(body.user_id || "");
      const active = Boolean(body.active);
      if (!companyId || !userId) return json({ error: "company_id and user_id required" }, 400);
      if (!isSuper && !(isAdmin && membership?.company_id === companyId)) return json({ error: "Not allowed" }, 403);
      const { data: target } = await admin.from("company_members").select("role").eq("company_id",companyId).eq("user_id",userId).maybeSingle();
      if (!target) return json({ error: "Member not found" }, 404);
      if (!isSuper && target.role !== "SALES") return json({ error: "Admin can only manage sales users" }, 403);
      const { error: me } = await admin.from("company_members").update({ active }).eq("company_id", companyId).eq("user_id", userId);
      if (me) throw me;
      const { error: pe } = await admin.from("profiles").update({ active }).eq("id", userId);
      if (pe) throw pe;
      await admin.from("audit_logs").insert({ company_id: companyId, user_id: callerId, action: active ? "USER_REACTIVATED" : "USER_DISABLED", entity_type: "user", entity_id: userId });
      return json({ ok: true });
    }


    if (action === "renew_license") {
      if (!isSuper) return json({ error: "SUPER_ADMIN required" }, 403);
      const licenseId = String(body.license_id || "");
      if (!licenseId) return json({ error: "license_id required" }, 400);

      const { data: lic, error: le } = await admin.from("licenses")
        .select("id,company_id,plan_id,billing_interval,starts_at,expires_at,trial_until")
        .eq("id", licenseId).single();
      if (le || !lic) return json({ error: "License not found" }, 404);

      const now = new Date();
      const currentEnd = lic.expires_at ? new Date(lic.expires_at) : null;
      const end = currentEnd && currentEnd > now ? new Date(currentEnd) : new Date(now);
      const {data: currentPlan}=await admin.from("plans").select("code").eq("id",lic.plan_id).maybeSingle();
      if(currentPlan?.code==="DEMO"){const days=Math.max(1,Math.min(365,Math.round((Date.parse(lic.trial_until||lic.expires_at)-Date.parse(lic.starts_at))/86400000)||30));end.setTime(end.getTime()+days*86400000);}
      else if (lic.billing_interval === "YEAR") end.setFullYear(end.getFullYear() + 1);
      else end.setMonth(end.getMonth() + 1);

      const { data: updated, error: ue } = await admin.from("licenses")
        .update({ expires_at: end.toISOString(), status: "ACTIVE" })
        .eq("id", licenseId).select().single();
      if (ue) throw ue;

      await admin.from("audit_logs").insert({
        company_id: lic.company_id,
        user_id: callerId,
        action: "LICENSE_RENEWED",
        entity_type: "license",
        entity_id: licenseId,
        metadata: { expires_at: end.toISOString(), billing_interval: lic.billing_interval }
      });
      return json({ license: updated });
    }

    if (action === "change_license") {
      if (!isSuper) return json({ error: "SUPER_ADMIN required" }, 403);
      const licenseId = String(body.license_id || "");
      const planCode = String(body.plan_code || "").toUpperCase();
      const billingInterval = String(body.billing_interval || "").toUpperCase() === "YEAR" ? "YEAR" : "MONTH";
      if (!licenseId || !planCode) return json({ error: "license_id and plan_code required" }, 400);

      const { data: plan } = await admin.from("plans").select("id").eq("code", planCode).maybeSingle();
      if (!plan) return json({ error: "Invalid plan" }, 400);

      if(planCode==="DEMO"&&!validDemoDays(body.demo_days))return json({error:"A demo deve durar entre 1 e 365 dias."},400);
      const startsAt = new Date();
      const expiresAt = new Date(startsAt);
      if (billingInterval === "YEAR") expiresAt.setFullYear(expiresAt.getFullYear() + 1);
      else expiresAt.setMonth(expiresAt.getMonth() + 1);

      if(planCode==="DEMO")expiresAt.setTime(startsAt.getTime()+Number(body.demo_days??30)*86400000);
      const { data: updated, error: ue } = await admin.from("licenses")
        .update({
          plan_id: plan.id,
          billing_interval: billingInterval,
          starts_at: startsAt.toISOString(),
          expires_at: expiresAt.toISOString(),
          trial_until: planCode==="DEMO"?expiresAt.toISOString():null,
          auto_renew:false,
          status: "ACTIVE"
        })
        .eq("id", licenseId).select().single();
      if (ue) throw ue;

      await admin.from("audit_logs").insert({
        company_id: updated.company_id,
        user_id: callerId,
        action: "LICENSE_CHANGED",
        entity_type: "license",
        entity_id: licenseId,
        metadata: { plan_code: planCode, billing_interval: billingInterval, expires_at: expiresAt.toISOString() }
      });
      return json({ license: updated });
    }

    if (action === "delete_company") {
      if (!isSuper) return json({ error: "SUPER_ADMIN required" }, 403);
      const companyId=String(body.company_id||"");if(!companyId)return json({error:"company_id required"},400);
      const args={p_caller:callerId,p_data:{company_id:companyId}};
      const {data:preview,error:previewError}=await admin.rpc("sigs_admin_customer",{...args,p_action:"delete_preview"});
      if(previewError)return json({error:previewError.message},409);
      const buckets=new Map<string,string[]>();
      for(const item of preview.objects||[]){const paths=buckets.get(item.bucket)||[];paths.push(item.path);buckets.set(item.bucket,paths);}
      for(const [bucket,paths] of buckets){for(let offset=0;offset<paths.length;offset+=1000){
        const {error:storageError}=await admin.storage.from(bucket).remove(paths.slice(offset,offset+1000));
        if(storageError)return json({error:"Não foi possível remover os ficheiros. A conta e a empresa foram mantidas; tenta novamente."},502);
      }}
      const {data:deleted,error:deleteError}=await admin.rpc("sigs_admin_customer",{...args,p_action:"delete"});
      if(deleteError)return json({error:deleteError.message},409);
      return json(deleted);
    }

    if (action === "update_license") {
      if (!isSuper) return json({ error: "SUPER_ADMIN required" }, 403);
      const licenseId = String(body.license_id || "");
      if (!licenseId) return json({ error: "license_id required" }, 400);
      const patch: Record<string, unknown> = {};
      for (const key of ["status","starts_at","expires_at","billing_interval","auto_renew","notes"]) if (body[key] !== undefined) patch[key] = body[key];
      const { data: lic, error } = await admin.from("licenses").update(patch).eq("id", licenseId).select().single();
      if (error) throw error;
      if (Array.isArray(body.modules)) {
        await admin.from("license_modules").delete().eq("license_id", licenseId);
        if (body.modules.length) {
          const { error: lmErr } = await admin.from("license_modules").insert(body.modules.map((m:string)=>({ license_id: licenseId, module_code:m, enabled:true })));
          if (lmErr) throw lmErr;
        }
      }
      await admin.from("audit_logs").insert({ company_id: lic.company_id, user_id: callerId, action: "LICENSE_UPDATED", entity_type: "license", entity_id: licenseId, metadata: patch });
      return json({ license: lic });
    }

    return json({ error: "Unknown action" }, 400);
  } catch (e) {
    console.error(e);
    return json({ error: e instanceof Error ? e.message : "Unexpected error" }, 500);
  }
});

