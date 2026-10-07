import { createServerFn } from "@tanstack/react-start";


const CHAVES = ["gr_clientes", "gr_itens", "gr_pedidos", "gr_loja"];

export const carregarDados = createServerFn({ method: "GET" }).handler(async () => {
  const { exigirLogin } = await import("./sessao.server");
  await exigirLogin();
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { data, error } = await supabaseAdmin.from("app_state").select("key, value").in("key", CHAVES);
  if (error) throw new Error("Falha ao carregar dados");
  const out: Record<string, unknown> = {};
  for (const r of data ?? []) out[r.key] = r.value;
  return { dados: JSON.stringify(out) };
});

export const salvarDado = createServerFn({ method: "POST" })
  .inputValidator((d: { key: string; value: string }) => {
    if (!CHAVES.includes(d.key)) throw new Error("Chave inválida");
    return d;
  })
  .handler(async ({ data }) => {
    const { exigirLogin } = await import("./sessao.server");
  await exigirLogin();
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin
      .from("app_state")
      .upsert({ key: data.key, value: JSON.parse(data.value), updated_at: new Date().toISOString() });
    if (error) throw new Error("Falha ao salvar");
    return { ok: true };
  });
