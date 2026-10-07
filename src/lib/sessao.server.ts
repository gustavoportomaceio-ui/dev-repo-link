import { useSession } from "@tanstack/react-start/server";

type Sessao = { ok?: boolean };

export function abrirSessao() {
  return useSession<Sessao>({
    password: process.env['SESSION_SECRET']!,
    name: "grafica-sessao",
    maxAge: 60 * 60 * 24 * 30,
    cookie: { httpOnly: true, secure: true, sameSite: "lax", path: "/" },
  });
}

export async function exigirLogin() {
  const s = await abrirSessao();
  if (!s.data.ok) throw new Error("Não autorizado");
}
