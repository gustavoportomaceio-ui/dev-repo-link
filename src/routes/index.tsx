import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState, type ReactNode } from "react";
import {
  LayoutDashboard, FileText, Calculator, Kanban, CalendarDays, Users, Package, Wrench, Settings,
  Plus, Trash2, Printer, MessageCircle, Pencil, X, ChevronLeft, ChevronRight, ShoppingCart, LogOut,
} from "lucide-react";
import {
  useLojaStore, uid, brl, totalPedido, dataBR, STATUS, faixaDe, precoPorQtd,
  type Store, type Cliente, type Item, type Pedido, type Status, type Pagamento, type Faixa,
} from "@/lib/store";
import { Caixa } from "@/components/Caixa";
import { Login } from "@/components/Login";
import { estaLogado, sair } from "@/lib/auth.functions";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Gráfica Amarelinha — Gestão da gráfica" },
      { name: "description", content: "Pedidos, notas, produção, agenda, clientes, produtos e serviços da gráfica rápida." },
      { property: "og:title", content: "Gráfica Amarelinha — Gestão da gráfica" },
      { property: "og:description", content: "Organize pedidos, emita notas e acompanhe a produção." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: AppGate,
});

const ABAS = [
  { id: "caixa", label: "Caixa", icon: ShoppingCart },
  { id: "painel", label: "Painel", icon: LayoutDashboard },
  { id: "pedidos", label: "Pedidos e Notas", icon: FileText },
  { id: "producao", label: "Produção", icon: Kanban },
  { id: "agenda", label: "Agenda", icon: CalendarDays },
  { id: "calc", label: "Calculadora", icon: Calculator },
  { id: "clientes", label: "Clientes", icon: Users },
  { id: "produtos", label: "Produtos", icon: Package },
  { id: "servicos", label: "Serviços", icon: Wrench },
  { id: "config", label: "Minha gráfica", icon: Settings },
] as const;
type Aba = (typeof ABAS)[number]["id"];

const inp = "w-full rounded-md border border-input bg-card px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring";
const btn = "inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:opacity-90";
const btn2 = "inline-flex items-center gap-2 rounded-md border border-border bg-card px-3 py-2 text-sm hover:bg-muted";

function Field({ label, children }: { label: string; children: ReactNode }) {
  return <label className="block text-sm"><span className="mb-1 block font-medium text-muted-foreground">{label}</span>{children}</label>;
}
function Card({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <div className={`rounded-xl border border-border bg-card p-5 ${className}`}>{children}</div>;
}
function Modal({ title, onClose, children }: { title: string; onClose: () => void; children: ReactNode }) {
  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-foreground/40 p-4 print:hidden">
      <div className="my-8 w-full max-w-3xl rounded-xl bg-card p-6 shadow-xl">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-xl font-bold">{title}</h2>
          <button onClick={onClose} className="rounded p-1 hover:bg-muted"><X className="h-5 w-5" /></button>
        </div>
        {children}
      </div>
    </div>
  );
}
const statusCor: Record<Status, string> = {
  orcamento: "bg-muted text-foreground",
  arte: "bg-secondary text-secondary-foreground",
  aprovacao: "bg-chart-5 text-accent-foreground",
  impressao: "bg-accent text-accent-foreground",
  pronto: "bg-primary text-primary-foreground",
  entregue: "bg-foreground text-background",
};
function StatusTag({ s }: { s: Status }) {
  return <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${statusCor[s]}`}>{STATUS.find((x) => x.id === s)?.label}</span>;
}

function AppGate() {
  const [autenticado, setAutenticado] = useState<boolean | null>(null);
  useEffect(() => { estaLogado().then((r) => setAutenticado(r.ok)).catch(() => setAutenticado(false)); }, []);
  if (autenticado === null) return null;
  if (!autenticado) return <Login onOk={() => setAutenticado(true)} />;
  return <App />;
}

function App() {
  const store = useLojaStore();
  const [aba, setAba] = useState<Aba>("caixa");
  const [nota, setNota] = useState<Pedido | null>(null);
  const [editando, setEditando] = useState<Pedido | null>(null);

  const novoPedido = () => setEditando({
    id: uid(), numero: (Math.max(0, ...store.pedidos.map((p) => p.numero)) + 1), clienteId: "", itens: [],
    desconto: 0, status: "orcamento", pagamento: "pendente", entrega: "", pago: false, sinal: 0, obs: "", criadoEm: new Date().toISOString(),
  });

  return (
    <div className="min-h-screen bg-background">
      <div className="flex print:hidden">
        <aside className="sticky top-0 hidden h-screen w-56 shrink-0 flex-col border-r border-sidebar-border bg-sidebar p-4 text-sidebar-foreground md:flex">
          <div className="mb-7 border-b border-sidebar-border px-2 pb-6 pt-3">
            <div className="text-xl font-bold leading-tight text-sidebar-primary">{store.loja.nome || "Minha Gráfica"}</div>
            <div className="mt-2 text-xs text-muted-foreground">Gestão da gráfica</div>
          </div>
          <nav className="space-y-1">
            {ABAS.map((a) => (
              <Button variant="ghost" key={a.id} onClick={() => setAba(a.id)} aria-current={aba === a.id ? "page" : undefined}
                className={`h-11 w-full justify-start gap-3 px-3 text-sm font-medium ${aba === a.id ? "bg-sidebar-primary text-sidebar-primary-foreground hover:bg-sidebar-primary/90" : "text-muted-foreground hover:bg-sidebar-accent hover:text-sidebar-foreground"}`}>
                <a.icon className="h-4 w-4" /> {a.label}
              </Button>
            ))}
          </nav>
          <Button onClick={() => { setAba("pedidos"); novoPedido(); }} className="mt-auto h-11"><Plus className="h-4 w-4" /> Novo pedido</Button>
          <Button variant="ghost" onClick={() => { sair().finally(() => location.reload()); }} className="mt-2 h-9 w-full justify-start gap-3 px-3 text-muted-foreground hover:text-sidebar-foreground"><LogOut className="h-4 w-4" /> Sair</Button>
        </aside>
        <main className="min-w-0 flex-1 p-4 md:p-8">
          <div className="mb-4 flex gap-2 overflow-x-auto md:hidden">
            {ABAS.map((a) => (
              <Button key={a.id} variant={aba === a.id ? "default" : "secondary"} onClick={() => setAba(a.id)} className="shrink-0">{a.label}</Button>
            ))}
          </div>
          {aba === "caixa" && <Caixa s={store} abrir={setEditando} />}
          {aba === "painel" && <Painel s={store} abrir={setEditando} novo={novoPedido} />}
          {aba === "pedidos" && <Pedidos s={store} abrir={setEditando} novo={novoPedido} nota={setNota} />}
          {aba === "producao" && <Producao s={store} abrir={setEditando} />}
          {aba === "agenda" && <Agenda s={store} abrir={setEditando} />}
          {aba === "calc" && <Calc s={store} />}
          {aba === "clientes" && <Clientes s={store} />}
          {aba === "produtos" && <Itens s={store} tipo="produto" />}
          {aba === "servicos" && <Itens s={store} tipo="servico" />}
          {aba === "config" && <Config s={store} />}
        </main>
      </div>
      {editando && <PedidoForm s={store} inicial={editando} fechar={() => setEditando(null)} nota={(p) => { setEditando(null); setNota(p); }} />}
      {nota && <Nota s={store} p={nota} fechar={() => setNota(null)} />}
    </div>
  );
}

function Titulo({ t, sub, children }: { t: string; sub?: string; children?: ReactNode }) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
      <div><h1 className="text-3xl font-black tracking-tight">{t}</h1>{sub && <p className="text-muted-foreground">{sub}</p>}</div>
      <div className="flex gap-2">{children}</div>
    </div>
  );
}

function whatsLink(s: Store, p: Pedido) {
  const c = s.clientes.find((x) => x.id === p.clienteId);
  const linhas = p.itens.map((i) => `• ${i.qtd}x ${i.nome} — ${brl(i.qtd * i.preco)}`).join("\n");
  const st = STATUS.find((x) => x.id === p.status)?.label;
  const msg = `Olá${c ? ` ${c.nome.split(" ")[0]}` : ""}! Aqui é da *${s.loja.nome}*.\n\n*Pedido nº ${p.numero}* (${st})\n${linhas}\n${p.desconto ? `Desconto: -${brl(p.desconto)}\n` : ""}*Total: ${brl(totalPedido(p))}*${p.sinal ? `\nSinal pago: ${brl(p.sinal)}\nRestante: ${brl(totalPedido(p) - p.sinal)}` : ""}${p.entrega ? `\nPrevisão de entrega: ${dataBR(p.entrega)}` : ""}${p.obs ? `\n\nObs: ${p.obs}` : ""}\n\nObrigado pela preferência!`;
  const tel = (c?.telefone || "").replace(/\D/g, "");
  const num = tel ? (tel.length <= 11 ? "55" + tel : tel) : "";
  return `https://wa.me/${num}?text=${encodeURIComponent(msg)}`;
}

function Painel({ s, abrir, novo }: { s: Store; abrir: (p: Pedido) => void; novo: () => void }) {
  const hoje = new Date().toISOString().slice(0, 10);
  const mes = hoje.slice(0, 7);
  const ativos = s.pedidos.filter((p) => p.status !== "entregue" && p.status !== "orcamento");
  const atrasados = ativos.filter((p) => p.entrega && p.entrega < hoje);
  const doMes = s.pedidos.filter((p) => p.criadoEm.slice(0, 7) === mes && p.status !== "orcamento");
  const fat = doMes.reduce((a, p) => a + totalPedido(p), 0);
  const aReceber = s.pedidos.filter((p) => !p.pago && p.status !== "orcamento").reduce((a, p) => a + totalPedido(p) - (p.sinal || 0), 0);
  const estoqueBaixo = s.itens.filter((i) => i.tipo === "produto" && i.estoque <= 10);
  const proximos = [...ativos].filter((p) => p.entrega).sort((a, b) => a.entrega.localeCompare(b.entrega)).slice(0, 6);
  const cards = [
    ["Vendido no mês", brl(fat)], ["A receber", brl(aReceber)],
    ["Em andamento", String(ativos.length)], ["Atrasados", String(atrasados.length)],
  ];
  return (
    <>
      <Titulo t="Bom dia! ☀️" sub="Resumo da sua gráfica hoje"><button onClick={novo} className={btn}><Plus className="h-4 w-4" />Novo pedido</button></Titulo>
      <div className="mb-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
        {cards.map(([l, v], i) => (
          <Card key={l} className={i === 3 && atrasados.length ? "border-destructive" : ""}>
            <div className="text-sm text-muted-foreground">{l}</div><div className="mt-1 text-2xl font-black">{v}</div>
          </Card>
        ))}
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <h3 className="mb-3 font-bold">Próximas entregas</h3>
          {proximos.length === 0 && <p className="text-sm text-muted-foreground">Nada agendado.</p>}
          {proximos.map((p) => (
            <button key={p.id} onClick={() => abrir(p)} className="flex w-full items-center justify-between border-b border-border py-2 text-left text-sm last:border-0 hover:bg-muted">
              <span><b>#{p.numero}</b> {s.clientes.find((c) => c.id === p.clienteId)?.nome || "Sem cliente"}</span>
              <span className={`flex items-center gap-2 ${p.entrega < hoje ? "font-bold text-destructive" : ""}`}>{dataBR(p.entrega)} <StatusTag s={p.status} /></span>
            </button>
          ))}
        </Card>
        <Card>
          <h3 className="mb-3 font-bold">Estoque baixo (10 ou menos)</h3>
          {estoqueBaixo.length === 0 && <p className="text-sm text-muted-foreground">Tudo certo com o estoque.</p>}
          {estoqueBaixo.map((i) => (
            <div key={i.id} className="flex justify-between border-b border-border py-2 text-sm last:border-0"><span>{i.nome}</span><b className="text-destructive">{i.estoque} {i.unidade}</b></div>
          ))}
        </Card>
        <CalcTabela s={s} />
      </div>
    </>
  );
}

function Pedidos({ s, abrir, novo, nota }: { s: Store; abrir: (p: Pedido) => void; novo: () => void; nota: (p: Pedido) => void }) {
  const [busca, setBusca] = useState("");
  const [filtro, setFiltro] = useState<Status | "">("");
  const lista = [...s.pedidos].sort((a, b) => b.numero - a.numero).filter((p) => {
    const c = s.clientes.find((x) => x.id === p.clienteId)?.nome || "";
    return (!filtro || p.status === filtro) && (`${p.numero} ${c}`.toLowerCase().includes(busca.toLowerCase()));
  });
  return (
    <>
      <Titulo t="Pedidos e Notas" sub="Orçamentos, pedidos e notas de serviço (não fiscal)"><button onClick={novo} className={btn}><Plus className="h-4 w-4" />Novo pedido</button></Titulo>
      <div className="mb-4 flex flex-wrap gap-2">
        <input className={`${inp} max-w-xs`} placeholder="Buscar por nº ou cliente" value={busca} onChange={(e) => setBusca(e.target.value)} />
        <select className={`${inp} max-w-[200px]`} value={filtro} onChange={(e) => setFiltro(e.target.value as Status)}>
          <option value="">Todas as etapas</option>{STATUS.map((x) => <option key={x.id} value={x.id}>{x.label}</option>)}
        </select>
      </div>
      <Card className="overflow-x-auto p-0">
        <table className="w-full text-sm">
          <thead className="bg-muted text-left"><tr><th className="p-3">Nº</th><th>Cliente</th><th>Entrega</th><th>Etapa</th><th>Total</th><th>Pagamento</th><th></th></tr></thead>
          <tbody>
            {lista.length === 0 && <tr><td colSpan={7} className="p-6 text-center text-muted-foreground">Nenhum pedido ainda.</td></tr>}
            {lista.map((p) => (
              <tr key={p.id} className="border-t border-border">
                <td className="p-3 font-bold">#{p.numero}</td>
                <td>{s.clientes.find((c) => c.id === p.clienteId)?.nome || "—"}</td>
                <td>{dataBR(p.entrega)}</td><td><StatusTag s={p.status} /></td>
                <td className="font-semibold">{brl(totalPedido(p))}</td><td>{p.pagamento === "pago" ? "✅ Pago" : p.pagamento === "sinal" ? `Sinal · falta ${brl(totalPedido(p) - p.sinal)}` : `Falta ${brl(totalPedido(p))}`}</td>
                <td className="whitespace-nowrap p-2 text-right">
                  <button title="Editar" onClick={() => abrir(p)} className="rounded p-2 hover:bg-muted"><Pencil className="h-4 w-4" /></button>
                  <button title="Nota" onClick={() => nota(p)} className="rounded p-2 hover:bg-muted"><Printer className="h-4 w-4" /></button>
                  <a title="WhatsApp" href={whatsLink(s, p)} target="_blank" rel="noreferrer" className="inline-block rounded p-2 hover:bg-muted"><MessageCircle className="h-4 w-4" /></a>
                  <button title="Excluir" onClick={() => confirm("Excluir este pedido?") && s.setPedidos((l) => l.filter((x) => x.id !== p.id))} className="rounded p-2 text-destructive hover:bg-muted"><Trash2 className="h-4 w-4" /></button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </>
  );
}

function PedidoForm({ s, inicial, fechar, nota }: { s: Store; inicial: Pedido; fechar: () => void; nota: (p: Pedido) => void }) {
  const [p, setP] = useState<Pedido>(inicial);
  const [add, setAdd] = useState("");
  const [novoCli, setNovoCli] = useState({ nome: "", telefone: "" });
  const set = (k: Partial<Pedido>) => setP((x) => ({ ...x, ...k }));
  const salvar = (depois?: (p: Pedido) => void) => {
    let final = p;
    if (!p.clienteId && novoCli.nome) {
      const c: Cliente = { id: uid(), nome: novoCli.nome, telefone: novoCli.telefone, email: "", doc: "", endereco: "" };
      s.setClientes((l) => [...l, c]); final = { ...p, clienteId: c.id };
    }
    const existia = s.pedidos.find((x) => x.id === final.id);
    // baixa de estoque ao aprovar pela primeira vez
    const baixar = (!existia || existia.status === "orcamento") && final.status !== "orcamento";
    if (baixar) s.setItens((l) => l.map((it) => {
      const q = final.itens.filter((i) => i.itemId === it.id).reduce((a, i) => a + i.qtd, 0);
      return it.tipo === "produto" && q ? { ...it, estoque: it.estoque - q } : it;
    }));
    s.setPedidos((l) => existia ? l.map((x) => (x.id === final.id ? final : x)) : [...l, final]);
    depois ? depois(final) : fechar();
  };
  const addItem = (id: string) => {
    const it = s.itens.find((x) => x.id === id); if (!it) return;
    const entrega = !p.entrega && it.prazoDias ? new Date(Date.now() + it.prazoDias * 864e5).toISOString().slice(0, 10) : p.entrega;
    set({ itens: [...p.itens, { itemId: it.id, nome: it.nome, qtd: 1, preco: precoPorQtd(it, 1) }], entrega }); setAdd("");
  };
  const upd = (i: number, k: Partial<Pedido["itens"][0]>) => set({ itens: p.itens.map((x, j) => (j === i ? { ...x, ...k } : x)) });
  return (
    <Modal title={`Pedido #${p.numero}`} onClose={fechar}>
      <div className="grid gap-4 md:grid-cols-2">
        <Field label="Cliente">
          <select className={inp} value={p.clienteId} onChange={(e) => set({ clienteId: e.target.value })}>
            <option value="">— Novo cliente / balcão —</option>
            {s.clientes.map((c) => <option key={c.id} value={c.id}>{c.nome}</option>)}
          </select>
        </Field>
        {!p.clienteId ? (
          <div className="grid grid-cols-2 gap-2">
            <Field label="Nome"><input className={inp} value={novoCli.nome} onChange={(e) => setNovoCli({ ...novoCli, nome: e.target.value })} /></Field>
            <Field label="WhatsApp"><input className={inp} value={novoCli.telefone} onChange={(e) => setNovoCli({ ...novoCli, telefone: e.target.value })} /></Field>
          </div>
        ) : <div />}
        <Field label="Etapa"><select className={inp} value={p.status} onChange={(e) => set({ status: e.target.value as Status })}>{STATUS.map((x) => <option key={x.id} value={x.id}>{x.label}</option>)}</select></Field>
        <Field label="Data de entrega"><input type="date" className={inp} value={p.entrega} onChange={(e) => set({ entrega: e.target.value })} /></Field>
      </div>
      <div className="mt-5">
        <h3 className="mb-2 font-bold">Itens</h3>
        <select className={inp} value={add} onChange={(e) => addItem(e.target.value)}>
          <option value="">+ Adicionar produto ou serviço...</option>
          <optgroup label="Serviços">{s.itens.filter((i) => i.tipo === "servico").map((i) => <option key={i.id} value={i.id}>{i.nome} — {brl(i.preco)}</option>)}</optgroup>
          <optgroup label="Produtos">{s.itens.filter((i) => i.tipo === "produto").map((i) => <option key={i.id} value={i.id}>{i.nome} — {brl(i.preco)}</option>)}</optgroup>
        </select>
        <div className="mt-2 space-y-2">
          {p.itens.map((i, idx) => (
            <div key={idx} className="grid grid-cols-12 items-center gap-2">
              <select aria-label="Produto ou serviço do pedido" className={`${inp} col-span-6`} value={i.itemId} onChange={(e) => { const it = s.itens.find((x) => x.id === e.target.value); if (!it) return; upd(idx, { itemId: it.id, nome: it.nome, preco: precoPorQtd(it, i.qtd) }); }}>
                {!s.itens.some((it) => it.id === i.itemId) && <option value={i.itemId}>{i.nome}</option>}
                <optgroup label="Serviços">{s.itens.filter((it) => it.tipo === "servico").map((it) => <option key={it.id} value={it.id}>{it.nome}</option>)}</optgroup>
                <optgroup label="Produtos">{s.itens.filter((it) => it.tipo === "produto").map((it) => <option key={it.id} value={it.id}>{it.nome}</option>)}</optgroup>
              </select>
              <input type="number" min={0} className={`${inp} col-span-2`} value={i.qtd} onChange={(e) => { const q = +e.target.value; const it = s.itens.find((x) => x.id === i.itemId); upd(idx, it?.faixas?.length ? { qtd: q, preco: precoPorQtd(it, q) } : { qtd: q }); }} />
              <input type="number" step="0.01" title="Valor unitário (pode editar)" className={`${inp} col-span-2`} value={i.preco} onChange={(e) => upd(idx, { preco: +e.target.value })} />
              <span className="col-span-1 text-right text-sm font-semibold">{brl(i.qtd * i.preco)}</span>
              <button onClick={() => set({ itens: p.itens.filter((_, j) => j !== idx) })} className="col-span-1 justify-self-end p-1 text-destructive"><Trash2 className="h-4 w-4" /></button>
            </div>
          ))}
        </div>
      </div>
      <div className="mt-5 grid gap-4 md:grid-cols-3">
        <Field label="Desconto (R$)"><input type="number" step="0.01" className={inp} value={p.desconto} onChange={(e) => set({ desconto: +e.target.value })} /></Field>
        <Field label="Pagamento">
          <select className={inp} value={p.pagamento ?? "pendente"} onChange={(e) => { const v = e.target.value as Pagamento; set({ pagamento: v, pago: v === "pago", sinal: v === "sinal" ? p.sinal : 0 }); }}>
            <option value="pendente">Pagar tudo na retirada</option>
            <option value="sinal">Sinal recebido</option>
            <option value="pago">Pago</option>
          </select>
        </Field>
        {p.pagamento === "sinal" ? <Field label="Valor do sinal (R$)"><input type="number" step="0.01" className={inp} value={p.sinal} onChange={(e) => set({ sinal: +e.target.value })} /></Field> : <div />}
      </div>
      <div className={`mt-3 rounded-lg p-3 text-sm font-semibold ${p.pagamento === "pago" ? "bg-secondary" : "bg-muted"}`}>
        {p.pagamento === "pago" ? "✅ Pedido totalmente pago" : `Valor pendente na retirada: ${brl(totalPedido(p) - (p.pagamento === "sinal" ? p.sinal : 0))}`}
      </div>
      <div className="mt-4"><Field label="Observações (arte, acabamento, papel...)"><textarea rows={3} className={inp} value={p.obs} onChange={(e) => set({ obs: e.target.value })} /></Field></div>
      <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-border pt-4">
        <div className="text-2xl font-black">Total: {brl(totalPedido(p))}</div>
        <div className="flex flex-wrap gap-2">
          <button className={btn2} onClick={() => salvar((f) => window.open(whatsLink(s, f), "_blank"))}><MessageCircle className="h-4 w-4" />Salvar e enviar WhatsApp</button>
          <button className={btn2} onClick={() => salvar(nota)}><Printer className="h-4 w-4" />Salvar e ver nota</button>
          <button className={btn} onClick={() => salvar()}>Salvar</button>
        </div>
      </div>
    </Modal>
  );
}

function Nota({ s, p, fechar }: { s: Store; p: Pedido; fechar: () => void }) {
  const c = s.clientes.find((x) => x.id === p.clienteId);
  const sub = p.itens.reduce((a, i) => a + i.qtd * i.preco, 0);
  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-foreground/40 p-4 print:static print:bg-transparent print:p-0">
      <div className="mx-auto max-w-2xl">
        <div className="mb-3 flex justify-end gap-2 print:hidden">
          <button className={btn} onClick={() => window.print()}><Printer className="h-4 w-4" />Imprimir / PDF</button>
          <a className={btn2} href={whatsLink(s, p)} target="_blank" rel="noreferrer"><MessageCircle className="h-4 w-4" />WhatsApp</a>
          <button className={btn2} onClick={fechar}><X className="h-4 w-4" />Fechar</button>
        </div>
        <div className="bg-card p-8 text-sm text-card-foreground shadow-xl print:shadow-none">
          <div className="flex justify-between border-b-4 border-primary pb-4">
            <div><div className="text-2xl font-black">{s.loja.nome}</div><div>{s.loja.endereco}</div><div>{s.loja.telefone} {s.loja.doc && `· ${s.loja.doc}`}</div></div>
            <div className="text-right"><div className="text-lg font-bold">{p.status === "orcamento" ? "ORÇAMENTO" : "NOTA DE SERVIÇO"}</div><div>Nº {String(p.numero).padStart(5, "0")}</div><div>{new Date(p.criadoEm).toLocaleDateString("pt-BR")}</div></div>
          </div>
          <div className="my-4"><b>Cliente:</b> {c?.nome || "Consumidor"} {c?.telefone && `· ${c.telefone}`}{c?.doc && ` · ${c.doc}`}{c?.endereco && <div>{c.endereco}</div>}</div>
          <table className="w-full">
            <thead><tr className="border-b border-border text-left"><th className="py-1">Descrição</th><th className="text-right">Qtd</th><th className="text-right">Unit.</th><th className="text-right">Total</th></tr></thead>
            <tbody>{p.itens.map((i, k) => <tr key={k} className="border-b border-border"><td className="py-1">{i.nome}</td><td className="text-right">{i.qtd}</td><td className="text-right">{brl(i.preco)}</td><td className="text-right">{brl(i.qtd * i.preco)}</td></tr>)}</tbody>
          </table>
          <div className="ml-auto mt-4 w-64 space-y-1">
            <div className="flex justify-between"><span>Subtotal</span><span>{brl(sub)}</span></div>
            {!!p.desconto && <div className="flex justify-between"><span>Desconto</span><span>-{brl(p.desconto)}</span></div>}
            <div className="flex justify-between text-lg font-black"><span>Total</span><span>{brl(totalPedido(p))}</span></div>
            {!!p.sinal && !p.pago && <><div className="flex justify-between"><span>Sinal</span><span>{brl(p.sinal)}</span></div><div className="flex justify-between font-bold"><span>Restante</span><span>{brl(totalPedido(p) - p.sinal)}</span></div></>}
            {p.pago && <div className="text-right font-bold">PAGO</div>}
          </div>
          {p.entrega && <p className="mt-4"><b>Previsão de entrega:</b> {dataBR(p.entrega)}</p>}
          {p.obs && <p className="mt-2"><b>Obs.:</b> {p.obs}</p>}
          <p className="mt-8 text-center text-xs text-muted-foreground">Documento sem valor fiscal.</p>
          <div className="mt-10 grid grid-cols-2 gap-8 text-center text-xs"><div className="border-t border-foreground pt-1">{s.loja.nome}</div><div className="border-t border-foreground pt-1">Cliente</div></div>
        </div>
      </div>
    </div>
  );
}

function Producao({ s, abrir }: { s: Store; abrir: (p: Pedido) => void }) {
  const mover = (p: Pedido, d: number) => {
    const i = STATUS.findIndex((x) => x.id === p.status) + d;
    if (i < 0 || i >= STATUS.length) return;
    s.setPedidos((l) => l.map((x) => (x.id === p.id ? { ...x, status: STATUS[i]!.id } : x)));
  };
  const hoje = new Date().toISOString().slice(0, 10);
  return (
    <>
      <Titulo t="Produção" sub="Painel das etapas: arte → aprovação do cliente → impressão e acabamento → pronto para retirada. Use as setas para mover." />
      <div className="grid gap-4 overflow-x-auto xl:grid-cols-6">
        {STATUS.map((st) => {
          const l = s.pedidos.filter((p) => p.status === st.id).sort((a, b) => (a.entrega || "9").localeCompare(b.entrega || "9"));
          return (
            <div key={st.id} className="min-w-[220px] rounded-xl bg-muted p-3">
              <div className="mb-3 flex justify-between font-bold"><span>{st.label}</span><span className="text-muted-foreground">{l.length}</span></div>
              <div className="space-y-2">
                {l.map((p) => (
                  <div key={p.id} className="rounded-lg border border-border bg-card p-3 text-sm">
                    <button onClick={() => abrir(p)} className="w-full text-left">
                      <div className="font-bold">#{p.numero} · {s.clientes.find((c) => c.id === p.clienteId)?.nome || "Balcão"}</div>
                      <div className="truncate text-muted-foreground">{p.itens.map((i) => i.nome).join(", ")}</div>
                      <div className="text-xs font-semibold">{p.pagamento === "pago" ? "✅ Pago" : `💰 Falta ${brl(totalPedido(p) - (p.pagamento === "sinal" ? p.sinal : 0))}`}</div>
                      {p.entrega && <div className={p.entrega < hoje && st.id !== "entregue" ? "font-bold text-destructive" : ""}>Entrega {dataBR(p.entrega)}</div>}
                    </button>
                    <div className="mt-2 flex justify-between">
                      <button onClick={() => mover(p, -1)} className="rounded p-1 hover:bg-muted"><ChevronLeft className="h-4 w-4" /></button>
                      <a href={whatsLink(s, p)} target="_blank" rel="noreferrer" className="rounded p-1 hover:bg-muted"><MessageCircle className="h-4 w-4" /></a>
                      <button onClick={() => mover(p, 1)} className="rounded p-1 hover:bg-muted"><ChevronRight className="h-4 w-4" /></button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </>
  );
}

function Agenda({ s, abrir }: { s: Store; abrir: (p: Pedido) => void }) {
  const [ref, setRef] = useState(() => { const d = new Date(); return new Date(d.getFullYear(), d.getMonth(), 1); });
  const dias = useMemo(() => {
    const ini = new Date(ref); ini.setDate(1 - ref.getDay());
    return Array.from({ length: 42 }, (_, i) => { const d = new Date(ini); d.setDate(ini.getDate() + i); return d; });
  }, [ref]);
  const iso = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  const hoje = iso(new Date());
  return (
    <>
      <Titulo t="Agenda de serviços" sub="Entregas programadas por dia">
        <button className={btn2} onClick={() => setRef(new Date(ref.getFullYear(), ref.getMonth() - 1, 1))}><ChevronLeft className="h-4 w-4" /></button>
        <div className="px-3 py-2 font-bold capitalize">{ref.toLocaleDateString("pt-BR", { month: "long", year: "numeric" })}</div>
        <button className={btn2} onClick={() => setRef(new Date(ref.getFullYear(), ref.getMonth() + 1, 1))}><ChevronRight className="h-4 w-4" /></button>
      </Titulo>
      <div className="grid grid-cols-7 gap-1 text-sm">
        {["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"].map((d) => <div key={d} className="p-2 text-center font-bold text-muted-foreground">{d}</div>)}
        {dias.map((d) => {
          const k = iso(d); const ps = s.pedidos.filter((p) => p.entrega === k);
          return (
            <div key={k} className={`min-h-24 rounded-lg border p-1 ${d.getMonth() !== ref.getMonth() ? "opacity-40" : ""} ${k === hoje ? "border-primary border-2" : "border-border"} bg-card`}>
              <div className="text-xs font-bold">{d.getDate()}</div>
              {ps.map((p) => (
                <button key={p.id} onClick={() => abrir(p)} className={`mt-1 block w-full truncate rounded px-1 text-left text-xs ${statusCor[p.status]}`}>
                  #{p.numero} {s.clientes.find((c) => c.id === p.clienteId)?.nome || ""}
                </button>
              ))}
            </div>
          );
        })}
      </div>
    </>
  );
}

function Clientes({ s }: { s: Store }) {
  const vazio: Cliente = { id: "", nome: "", telefone: "", email: "", doc: "", endereco: "" };
  const [ed, setEd] = useState<Cliente | null>(null);
  const [busca, setBusca] = useState("");
  const salvar = () => {
    if (!ed?.nome) return;
    s.setClientes((l) => ed.id ? l.map((c) => (c.id === ed.id ? ed : c)) : [...l, { ...ed, id: uid() }]); setEd(null);
  };
  const lista = s.clientes.filter((c) => `${c.nome} ${c.telefone}`.toLowerCase().includes(busca.toLowerCase()));
  return (
    <>
      <Titulo t="Clientes" sub={`${s.clientes.length} cadastrados`}><button className={btn} onClick={() => setEd(vazio)}><Plus className="h-4 w-4" />Novo cliente</button></Titulo>
      <input className={`${inp} mb-4 max-w-xs`} placeholder="Buscar cliente" value={busca} onChange={(e) => setBusca(e.target.value)} />
      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        {lista.map((c) => {
          const ps = s.pedidos.filter((p) => p.clienteId === c.id && p.status !== "orcamento");
          return (
            <Card key={c.id}>
              <div className="flex justify-between">
                <div><div className="font-bold">{c.nome}</div><div className="text-sm text-muted-foreground">{c.telefone} {c.email && `· ${c.email}`}</div></div>
                <div className="flex">
                  {c.telefone && <a href={`https://wa.me/55${c.telefone.replace(/\D/g, "")}`} target="_blank" rel="noreferrer" className="rounded p-2 hover:bg-muted"><MessageCircle className="h-4 w-4" /></a>}
                  <button onClick={() => setEd(c)} className="rounded p-2 hover:bg-muted"><Pencil className="h-4 w-4" /></button>
                  <button onClick={() => confirm("Excluir cliente?") && s.setClientes((l) => l.filter((x) => x.id !== c.id))} className="rounded p-2 text-destructive hover:bg-muted"><Trash2 className="h-4 w-4" /></button>
                </div>
              </div>
              <div className="mt-3 text-sm">{ps.length} pedidos · <b>{brl(ps.reduce((a, p) => a + totalPedido(p), 0))}</b> gastos</div>
            </Card>
          );
        })}
      </div>
      {ed && (
        <Modal title={ed.id ? "Editar cliente" : "Novo cliente"} onClose={() => setEd(null)}>
          <div className="grid gap-3 md:grid-cols-2">
            <Field label="Nome *"><input className={inp} value={ed.nome} onChange={(e) => setEd({ ...ed, nome: e.target.value })} /></Field>
            <Field label="WhatsApp"><input className={inp} placeholder="(11) 99999-9999" value={ed.telefone} onChange={(e) => setEd({ ...ed, telefone: e.target.value })} /></Field>
            <Field label="E-mail"><input className={inp} value={ed.email} onChange={(e) => setEd({ ...ed, email: e.target.value })} /></Field>
            <Field label="CPF / CNPJ"><input className={inp} value={ed.doc} onChange={(e) => setEd({ ...ed, doc: e.target.value })} /></Field>
            <div className="md:col-span-2"><Field label="Endereço"><input className={inp} value={ed.endereco} onChange={(e) => setEd({ ...ed, endereco: e.target.value })} /></Field></div>
          </div>
          <div className="mt-4 flex justify-end"><button className={btn} onClick={salvar}>Salvar</button></div>
        </Modal>
      )}
    </>
  );
}

function Itens({ s, tipo }: { s: Store; tipo: "produto" | "servico" }) {
  const vazio: Item = { id: "", tipo, nome: "", preco: 0, unidade: "un", estoque: 0, prazoDias: tipo === "servico" ? 1 : 0 };
  const [ed, setEd] = useState<Item | null>(null);
  const lista = s.itens.filter((i) => i.tipo === tipo);
  const prod = tipo === "produto";
  const salvar = () => {
    if (!ed?.nome) return;
    s.setItens((l) => ed.id ? l.map((i) => (i.id === ed.id ? ed : i)) : [...l, { ...ed, id: uid() }]); setEd(null);
  };
  return (
    <>
      <Titulo t={prod ? "Produtos" : "Serviços"} sub={prod ? "Materiais e itens para venda, com controle de estoque" : "Serviços oferecidos, preço e prazo de produção"}>
        <button className={btn} onClick={() => setEd(vazio)}><Plus className="h-4 w-4" />{prod ? "Novo produto" : "Novo serviço"}</button>
      </Titulo>
      <Card className="overflow-x-auto p-0">
        <table className="w-full text-sm">
          <thead className="bg-muted text-left"><tr><th className="p-3">Nome</th><th>Preço</th><th>Unidade</th><th>{prod ? "Estoque" : "Prazo"}</th><th></th></tr></thead>
          <tbody>
            {lista.length === 0 && <tr><td colSpan={5} className="p-6 text-center text-muted-foreground">Nada cadastrado.</td></tr>}
            {lista.map((i) => (
              <tr key={i.id} className="border-t border-border">
                <td className="p-3 font-medium">{i.nome}</td><td>{brl(i.preco)}{i.faixas?.length ? <span className="ml-1 rounded bg-secondary px-1.5 text-xs">{i.faixas.length} faixas</span> : null}</td><td>{i.unidade}</td>
                <td className={prod && i.estoque <= 10 ? "font-bold text-destructive" : ""}>{prod ? i.estoque : `${i.prazoDias} dia(s)`}</td>
                <td className="p-2 text-right">
                  <button onClick={() => setEd(i)} className="rounded p-2 hover:bg-muted"><Pencil className="h-4 w-4" /></button>
                  <button onClick={() => confirm("Excluir?") && s.setItens((l) => l.filter((x) => x.id !== i.id))} className="rounded p-2 text-destructive hover:bg-muted"><Trash2 className="h-4 w-4" /></button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
      {ed && (
        <Modal title={ed.id ? "Editar" : prod ? "Novo produto" : "Novo serviço"} onClose={() => setEd(null)}>
          <div className="grid gap-3 md:grid-cols-2">
            <div className="md:col-span-2"><Field label="Nome *"><input className={inp} value={ed.nome} onChange={(e) => setEd({ ...ed, nome: e.target.value })} /></Field></div>
            <Field label="Preço (R$)"><input type="number" step="0.01" className={inp} value={ed.preco} onChange={(e) => setEd({ ...ed, preco: +e.target.value })} /></Field>
            <Field label="Unidade (un, m², milheiro...)"><input className={inp} value={ed.unidade} onChange={(e) => setEd({ ...ed, unidade: e.target.value })} /></Field>
            {prod
              ? <Field label="Quantidade em estoque"><input type="number" className={inp} value={ed.estoque} onChange={(e) => setEd({ ...ed, estoque: +e.target.value })} /></Field>
              : <Field label="Prazo de produção (dias)"><input type="number" className={inp} value={ed.prazoDias} onChange={(e) => setEd({ ...ed, prazoDias: +e.target.value })} /></Field>}
          </div>
          <FaixasEditor faixas={ed.faixas ?? []} unidade={ed.unidade} onChange={(faixas) => setEd({ ...ed, faixas })} />
          <FaixasEditor faixas={ed.faixas ?? []} unidade={ed.unidade} onChange={(faixas) => setEd({ ...ed, faixas })} />
          <div className="mt-4 flex justify-end"><button className={btn} onClick={salvar}>Salvar</button></div>
        </Modal>
      )}
    </>
  );
}

function Config({ s }: { s: Store }) {
  const l = s.loja;
  const exportar = () => {
    const blob = new Blob([JSON.stringify({ clientes: s.clientes, itens: s.itens, pedidos: s.pedidos, loja: s.loja })], { type: "application/json" });
    const a = document.createElement("a"); a.href = URL.createObjectURL(blob); a.download = `backup-grafica-${new Date().toISOString().slice(0, 10)}.json`; a.click();
  };
  const importar = (f: File) => f.text().then((t) => {
    const d = JSON.parse(t);
    if (d.clientes) s.setClientes(d.clientes); if (d.itens) s.setItens(d.itens); if (d.pedidos) s.setPedidos(d.pedidos); if (d.loja) s.setLoja(d.loja);
    alert("Cópia restaurada!");
  });
  return (
    <>
      <Titulo t="Minha gráfica" sub="Dados que aparecem na nota e nas mensagens" />
      <Card className="max-w-2xl">
        <div className="grid gap-3 md:grid-cols-2">
          <Field label="Nome da gráfica"><input className={inp} value={l.nome} onChange={(e) => s.setLoja({ ...l, nome: e.target.value })} /></Field>
          <Field label="Telefone / WhatsApp"><input className={inp} value={l.telefone} onChange={(e) => s.setLoja({ ...l, telefone: e.target.value })} /></Field>
          <Field label="CNPJ / CPF"><input className={inp} value={l.doc} onChange={(e) => s.setLoja({ ...l, doc: e.target.value })} /></Field>
          <Field label="Endereço"><input className={inp} value={l.endereco} onChange={(e) => s.setLoja({ ...l, endereco: e.target.value })} /></Field>
        </div>
      </Card>
      <Card className="mt-4 max-w-2xl">
        <h3 className="font-bold">Cópia de segurança</h3>
        <p className="mb-3 text-sm text-muted-foreground">Os dados ficam salvos neste computador. Baixe uma cópia de vez em quando para não perder nada.</p>
        <div className="flex flex-wrap gap-2">
          <button className={btn} onClick={exportar}>Baixar cópia</button>
          <label className={`${btn2} cursor-pointer`}>Restaurar cópia<input type="file" accept=".json" className="hidden" onChange={(e) => e.target.files?.[0] && importar(e.target.files[0])} /></label>
        </div>
      </Card>
    </>
  );
}

function FaixasEditor({ faixas, unidade, onChange }: { faixas: Faixa[]; unidade: string; onChange: (f: Faixa[]) => void }) {
  const up = (i: number, k: Partial<Faixa>) => onChange(faixas.map((f, j) => (j === i ? { ...f, ...k } : f)));
  const nova = () => { const u = faixas[faixas.length - 1]; const de = u ? (u.ate || u.de) + 1 : 1; onChange([...faixas, { de, ate: 0, preco: u?.preco ?? 0 }]); };
  return (
    <div className="mt-4 rounded-lg border border-border p-3">
      <div className="mb-1 font-bold">Tabela de preços por quantidade</div>
      <p className="mb-2 text-xs text-muted-foreground">Valor por {unidade || "unidade"} conforme a quantidade. Deixe "até" vazio para "ou mais". Sem faixas, vale o preço normal.</p>
      {faixas.length > 0 && <div className="mb-1 grid grid-cols-12 gap-2 text-xs font-semibold text-muted-foreground"><span className="col-span-3">De</span><span className="col-span-3">Até</span><span className="col-span-5">Valor unitário (R$)</span></div>}
      <div className="space-y-2">
        {faixas.map((f, i) => (
          <div key={i} className="grid grid-cols-12 items-center gap-2">
            <input type="number" className={`${inp} col-span-3`} value={f.de} onChange={(e) => up(i, { de: +e.target.value })} />
            <input type="number" className={`${inp} col-span-3`} placeholder="ou mais" value={f.ate || ""} onChange={(e) => up(i, { ate: +e.target.value })} />
            <input type="number" step="0.01" className={`${inp} col-span-5`} value={f.preco} onChange={(e) => up(i, { preco: +e.target.value })} />
            <button onClick={() => onChange(faixas.filter((_, j) => j !== i))} className="col-span-1 justify-self-end p-1 text-destructive"><Trash2 className="h-4 w-4" /></button>
          </div>
        ))}
      </div>
      <button className={`${btn2} mt-2`} onClick={nova}><Plus className="h-4 w-4" /> Adicionar faixa</button>
    </div>
  );
}

function CalcTabela({ s }: { s: Store }) {
  const lista = s.itens.filter((i) => i.faixas?.length);
  const [id, setId] = useState("");
  const [qtd, setQtd] = useState(1);
  const [final, setFinal] = useState<number | null>(null);
  const it = s.itens.find((i) => i.id === id) ?? lista[0];
  const fx = faixaDe(it, qtd);
  const unit = precoPorQtd(it, qtd);
  const total = qtd * unit;
  return (
    <Card className="lg:col-span-2">
      <h3 className="mb-3 text-lg font-bold">Pela tabela de preços (faixas de quantidade)</h3>
      {lista.length === 0 ? <p className="text-sm text-muted-foreground">Nenhum serviço ou produto tem faixas ainda. Abra um serviço, clique no lápis e use "Adicionar faixa".</p> : (
        <div className="grid gap-4 md:grid-cols-2">
          <div className="grid gap-3">
            <Field label="Serviço / produto"><select className={inp} value={it?.id} onChange={(e) => { setId(e.target.value); setFinal(null); }}>{lista.map((i) => <option key={i.id} value={i.id}>{i.nome}</option>)}</select></Field>
            <Field label="Quantidade"><input className={inp} type="number" value={qtd} onChange={(e) => { setQtd(+e.target.value || 0); setFinal(null); }} /></Field>
            <div className="text-xs text-muted-foreground">{it?.faixas?.map((f) => <div key={f.de} className={f === fx ? "font-bold text-foreground" : ""}>{f.de}{f.ate ? ` a ${f.ate}` : " ou mais"}: {brl(f.preco)}</div>)}</div>
          </div>
          <div className="rounded-lg bg-secondary p-4">
            <div className="text-sm">{qtd} × {brl(unit)} {fx ? `(faixa ${fx.de}${fx.ate ? `–${fx.ate}` : "+"})` : "(preço normal)"}</div>
            <div className="text-3xl font-black">{brl(final ?? total)}</div>
            <Field label="Ajustar valor final no balcão (R$)"><input className={inp} type="number" step="0.01" value={final ?? total.toFixed(2)} onChange={(e) => setFinal(+e.target.value)} /></Field>
          </div>
        </div>
      )}
    </Card>
  );
}

function Calc({ s }: { s: Store }) {
  const [m, setM] = useState({ larg: 1, alt: 1, qtd: 1, preco: 60, min: 0 });
  const [f, setF] = useState({ folhas: 100, cor: 2, pb: 0.5, colorido: true, faces: 1, desc: 0 });
  const area = m.larg * m.alt * m.qtd;
  const totM = Math.max(area * m.preco, m.min);
  const unit = f.colorido ? f.cor : f.pb;
  const subF = f.folhas * f.faces * unit;
  const totF = subF * (1 - f.desc / 100);
  const n = (v: string) => +v.replace(",", ".") || 0;
  return (
    <>
      <Titulo t="Calculadora rápida" sub="Estime o preço na hora para o cliente" />
      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <h3 className="mb-3 text-lg font-bold">Lonas e adesivos (m²)</h3>
          <div className="mb-3 flex flex-wrap gap-2">
            {[["Lona", 60], ["Adesivo vinil", 70], ["Adesivo perfurado", 90], ["Lona com ilhós", 75]].map(([l, v]) => (
              <button key={l} className={btn2} onClick={() => setM({ ...m, preco: v as number })}>{l} · {brl(v as number)}</button>
            ))}
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Largura (m)"><input className={inp} type="number" step="0.01" value={m.larg} onChange={(e) => setM({ ...m, larg: n(e.target.value) })} /></Field>
            <Field label="Altura (m)"><input className={inp} type="number" step="0.01" value={m.alt} onChange={(e) => setM({ ...m, alt: n(e.target.value) })} /></Field>
            <Field label="Quantidade"><input className={inp} type="number" value={m.qtd} onChange={(e) => setM({ ...m, qtd: n(e.target.value) })} /></Field>
            <Field label="Preço do m² (R$)"><input className={inp} type="number" step="0.01" value={m.preco} onChange={(e) => setM({ ...m, preco: n(e.target.value) })} /></Field>
            <Field label="Valor mínimo (R$)"><input className={inp} type="number" step="0.01" value={m.min} onChange={(e) => setM({ ...m, min: n(e.target.value) })} /></Field>
          </div>
          <div className="mt-4 rounded-lg bg-secondary p-4">
            <div className="text-sm">Área total: <b>{area.toFixed(2)} m²</b></div>
            <div className="text-3xl font-black">{brl(totM)}</div>
          </div>
        </Card>
        <Card>
          <h3 className="mb-3 text-lg font-bold">Impressões por folha</h3>
          <div className="mb-3 flex gap-2">
            <button className={f.colorido ? btn : btn2} onClick={() => setF({ ...f, colorido: true })}>Colorida</button>
            <button className={!f.colorido ? btn : btn2} onClick={() => setF({ ...f, colorido: false })}>Preto e branco</button>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Quantidade de folhas"><input className={inp} type="number" value={f.folhas} onChange={(e) => setF({ ...f, folhas: n(e.target.value) })} /></Field>
            <Field label="Lados"><select className={inp} value={f.faces} onChange={(e) => setF({ ...f, faces: +e.target.value })}><option value={1}>Frente</option><option value={2}>Frente e verso</option></select></Field>
            <Field label="Preço colorida (R$)"><input className={inp} type="number" step="0.01" value={f.cor} onChange={(e) => setF({ ...f, cor: n(e.target.value) })} /></Field>
            <Field label="Preço P&B (R$)"><input className={inp} type="number" step="0.01" value={f.pb} onChange={(e) => setF({ ...f, pb: n(e.target.value) })} /></Field>
            <Field label="Desconto por quantidade (%)"><input className={inp} type="number" value={f.desc} onChange={(e) => setF({ ...f, desc: n(e.target.value) })} /></Field>
          </div>
          <div className="mt-4 rounded-lg bg-secondary p-4">
            <div className="text-sm">{f.folhas * f.faces} impressões × {brl(unit)}{f.desc ? ` − ${f.desc}%` : ""}</div>
            <div className="text-3xl font-black">{brl(totF)}</div>
          </div>
        </Card>
        <CalcTabela s={s} />
      </div>
    </>
  );
}
