import { useState } from "react";
import { Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { verificarSenha } from "@/lib/auth.functions";

export function Login({ onOk }: { onOk: () => void }) {
  const [senha, setSenha] = useState("");
  const [erro, setErro] = useState(false);
  const [carregando, setCarregando] = useState(false);

  async function entrar(e: React.FormEvent) {
    e.preventDefault();
    setCarregando(true);
    const { ok } = await verificarSenha({ data: { senha } });
    setCarregando(false);
    if (ok) {
      onOk();
    } else {
      setErro(true);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <form onSubmit={entrar} className="w-full max-w-sm rounded-xl border border-border bg-card p-8 shadow-xl">
        <div className="mb-6 flex flex-col items-center gap-3 text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary/15">
            <Lock className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h1 className="text-xl font-bold">Gestão da Gráfica</h1>
            <p className="mt-1 text-sm text-muted-foreground">Digite a senha para entrar</p>
          </div>
        </div>
        <input
          type="password"
          value={senha}
          onChange={(e) => { setSenha(e.target.value); setErro(false); }}
          placeholder="Senha"
          autoFocus
          className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
        />
        {erro && <p className="mt-2 text-sm text-destructive">Senha incorreta. Tente novamente.</p>}
        <Button type="submit" disabled={!senha || carregando} className="mt-4 w-full h-11">
          {carregando ? "Entrando..." : "Entrar"}
        </Button>
      </form>
    </div>
  );
}
