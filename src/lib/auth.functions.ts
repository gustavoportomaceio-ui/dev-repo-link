import { createServerFn } from "@tanstack/react-start";

async function sha256(texto: string): Promise<string> {
  const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(texto));
  return Array.from(new Uint8Array(buf)).map((b) => b.toString(16).padStart(2, "0")).join("");
}

export const verificarSenha = createServerFn({ method: "POST" })
  .inputValidator((d: { senha: string }) => d)
  .handler(async ({ data }) => {
    const esperado = process.env['SITE_PASSWORD'];
    if (!esperado) return { ok: false };
    const [a, b] = await Promise.all([sha256(data.senha), sha256(esperado)]);
    let diff = 0;
    for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
    if (diff !== 0) return { ok: false };
    const { abrirSessao } = await import("./sessao.server");
    const s = await abrirSessao();
    await s.update({ ok: true });
    return { ok: true };
  });

export const estaLogado = createServerFn({ method: "GET" }).handler(async () => {
  const { abrirSessao } = await import("./sessao.server");
  const s = await abrirSessao();
  return { ok: !!s.data.ok };
});

export const sair = createServerFn({ method: "POST" }).handler(async () => {
  const { abrirSessao } = await import("./sessao.server");
  const s = await abrirSessao();
  await s.clear();
  return { ok: true };
});
