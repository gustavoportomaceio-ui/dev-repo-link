import { useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { Minus, Plus, Printer, Search, Trash2, X, Package, Wrench, ShoppingCart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { brl, dataBR, precoPorQtd, totalPedido, uid, STATUS, type Pedido, type PedidoItem, type Store } from "@/lib/store";

const inp = "w-full rounded-md border border-input bg-card px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring";
const card = "rounded-lg border border-border bg-card p-5 text-card-foreground";
const FORMAS = ["Dinheiro", "PIX", "Cartão de débito", "Cartão de crédito"];
const hojeISO = () => new Date().toISOString().slice(0, 10);

export function Caixa({ s, abrir }: { s: Store; abrir: (p: Pedido) => void }) {
  const [busca, setBusca] = useState("");
  const [filtro, setFiltro] = useState<"todos" | "servico" | "produto">("todos");
  const [cart, setCart] = useState<PedidoItem[]>([]);
  const [clienteId, setClienteId] = useState("");
  const [forma, setForma] = useState("Dinheiro");
  const [recebido, setRecebido] = useState(0);
  const [desconto, setDesconto] = useState(0);
  const [entrega, setEntrega] = useState("");
  const [cupom, setCupom] = useState<Pedido | null>(null);

  const itens = s.itens.filter((i) => (filtro === "todos" || i.tipo === filtro) && i.nome.toLowerCase().includes(busca.toLowerCase()));
  const sub = cart.reduce((a, i) => a + i.qtd * i.preco, 0);
  const total = Math.max(0, sub - desconto);
  const troco = forma === "Dinheiro" && recebido > total ? recebido - total : 0;

  const setQtd = (itemId: string, qtd: number) => setCart((c) => c.flatMap((x) => {
    if (x.itemId !== itemId) return [x];
    if (qtd <= 0) return [];
    const it = s.itens.find((i) => i.id === itemId);
    return [{ ...x, qtd, preco: it?.faixas?.length ? precoPorQtd(it, qtd) : x.preco }];
  }));
  const add = (id: string) => {
    const ja = cart.find((x) => x.itemId === id);
    if (ja) return setQtd(id, ja.qtd + 1);
    const it = s.itens.find((i) => i.id === id);
    if (!it) return;
    setCart((c) => [...c, { itemId: id, nome: it.nome, qtd: 1, preco: precoPorQtd(it, 1) }]);
  };

  const finalizar = () => {
    const p: Pedido = {
      id: uid(), numero: Math.max(0, ...s.pedidos.map((x) => x.numero)) + 1, clienteId, itens: cart, desconto,
      status: entrega ? "impressao" : "entregue", pagamento: "pago", pago: true, sinal: 0, entrega,
      obs: "", criadoEm: new Date().toISOString(), forma, recebido: recebido || total,
    };
    s.setPedidos((l) => [...l, p]);
    s.setItens((l) => l.map((it) => {
      const q = cart.filter((c) => c.itemId === it.id).reduce((a, c) => a + c.qtd, 0);
      return it.tipo === "produto" && q ? { ...it, estoque: it.estoque - q } : it;
    }));
    setCart([]); setRecebido(0); setDesconto(0); setEntrega(""); setClienteId("");
    setCupom(p);
  };

  return (
    <>
      <header className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div><p className="mb-1 text-xs font-semibold uppercase text-primary">Balcão de atendimento</p><h1 className="text-3xl font-bold">Caixa</h1></div>
        <div className="flex items-center gap-3 text-sm text-muted-foreground"><CalendarLabel /><span className="rounded-md border border-border bg-card px-3 py-2">{s.itens.length} itens cadastrados</span></div>
      </header>
      <div className="grid gap-4 xl:grid-cols-[1fr_380px]">
        <div className={card}>
          <div className="mb-4 flex items-center justify-between border-b border-border pb-4"><h2 className="font-semibold">Produtos e serviços</h2><span className="text-xs text-muted-foreground">{itens.length} disponíveis</span></div>
          <div className="mb-3 flex flex-wrap gap-2">
            <div className="relative min-w-48 flex-1">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
              <input className={`${inp} pl-9`} placeholder="Buscar serviço ou produto..." value={busca} onChange={(e) => setBusca(e.target.value)} />
            </div>
            {(["todos", "servico", "produto"] as const).map((f) => (
              <Button key={f} variant={filtro === f ? "default" : "secondary"} onClick={() => setFiltro(f)} aria-pressed={filtro === f}>
                {f === "todos" ? "Todos" : f === "servico" ? "Serviços" : "Produtos"}
              </Button>
            ))}
          </div>
          <div className="max-h-[520px] overflow-y-auto">
            <div className="mb-1 flex justify-between border-b border-border px-3 py-2 text-xs uppercase text-muted-foreground"><span>Item</span><span>Valor unitário</span></div>
            {itens.map((i) => {
              const q = cart.find((c) => c.itemId === i.id)?.qtd;
              return (
                <Button key={i.id} variant="ghost" onClick={() => add(i.id)} aria-label={`Adicionar ${i.nome}`} className={`h-auto min-h-20 w-full justify-start gap-3 whitespace-normal rounded-none border-b border-border px-3 py-4 text-left hover:bg-muted ${q ? "bg-secondary" : ""}`}>
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-muted text-primary">{i.tipo === "servico" ? <Wrench /> : <Package />}</span>
                  <span className="min-w-0 flex-1"><span className="block text-sm font-semibold">{i.nome}</span><span className="mt-1 block text-xs font-normal text-muted-foreground">{i.tipo === "servico" ? "Serviço" : "Produto"} · {i.unidade}{i.faixas?.length ? " · preço por quantidade" : ""}</span></span>
                  <span className="shrink-0 text-right"><span className="block font-bold">{brl(i.preco)}</span>{q ? <span className="text-xs text-primary">{q} na venda</span> : <Plus className="ml-auto mt-1 h-4 w-4 text-muted-foreground" />}</span>
                </Button>
              );
            })}
            {itens.length === 0 && <p className="col-span-full p-6 text-center text-sm text-muted-foreground">Nada encontrado.</p>}
          </div>
        </div>

        <div className={`${card} flex flex-col`}>
          <h3 className="mb-4 flex items-center gap-2 border-b border-border pb-4 text-lg font-semibold"><ShoppingCart className="h-5 w-5 text-primary" />Venda atual <span className="ml-auto text-xs text-muted-foreground">{cart.length} itens</span></h3>
          <div className="flex-1 space-y-2">
            {cart.length === 0 && <p className="py-6 text-center text-sm text-muted-foreground">Toque nos serviços e produtos para adicionar.</p>}
            {cart.map((c) => (
              <div key={c.itemId} className="rounded-md border border-border p-2">
                <div className="flex justify-between gap-2 text-sm font-medium"><span>{c.nome}</span><button onClick={() => setQtd(c.itemId, 0)} className="text-destructive"><Trash2 className="h-4 w-4" /></button></div>
                <div className="mt-1 flex items-center gap-2">
                  <button className="rounded bg-muted p-1" onClick={() => setQtd(c.itemId, c.qtd - 1)}><Minus className="h-3 w-3" /></button>
                  <input type="number" className="w-16 rounded border border-input bg-card px-1 text-center text-sm" value={c.qtd} onChange={(e) => setQtd(c.itemId, +e.target.value)} />
                  <button className="rounded bg-muted p-1" onClick={() => setQtd(c.itemId, c.qtd + 1)}><Plus className="h-3 w-3" /></button>
                  <span className="text-xs text-muted-foreground">×</span>
                  <input type="number" step="0.01" title="Valor unitário (pode editar)" className="w-20 rounded border border-input bg-card px-1 text-right text-sm" value={c.preco}
                    onChange={(e) => setCart((l) => l.map((x) => (x.itemId === c.itemId ? { ...x, preco: +e.target.value } : x)))} />
                  <b className="ml-auto text-sm">{brl(c.qtd * c.preco)}</b>
                </div>
              </div>
            ))}
          </div>
          <div className="mt-3 space-y-2 border-t border-border pt-3">
            <select className={inp} value={clienteId} onChange={(e) => setClienteId(e.target.value)}>
              <option value="">Consumidor final</option>
              {s.clientes.map((c) => <option key={c.id} value={c.id}>{c.nome}</option>)}
            </select>
            <div className="grid grid-cols-2 gap-2">
              <select className={inp} value={forma} onChange={(e) => setForma(e.target.value)}>{FORMAS.map((f) => <option key={f}>{f}</option>)}</select>
              <input type="number" step="0.01" className={inp} placeholder="Desconto R$" value={desconto || ""} onChange={(e) => setDesconto(+e.target.value)} />
              {forma === "Dinheiro" && <input type="number" step="0.01" className={inp} placeholder="Valor recebido R$" value={recebido || ""} onChange={(e) => setRecebido(+e.target.value)} />}
              <label className="col-span-2 text-xs text-muted-foreground">Agendar entrega (deixe vazio se entregou na hora)
                <input type="date" className={inp} value={entrega} onChange={(e) => setEntrega(e.target.value)} />
              </label>
            </div>
            <div className="rounded-lg bg-secondary p-3">
              <div className="flex justify-between text-sm"><span>Total</span><span className="text-3xl font-black">{brl(total)}</span></div>
              {troco > 0 && <div className="flex justify-between text-sm font-bold"><span>Troco</span><span>{brl(troco)}</span></div>}
            </div>
            <Button className="h-12 w-full text-base font-semibold" disabled={!cart.length} onClick={finalizar}><Printer className="h-5 w-5" />Finalizar e emitir cupom</Button>
          </div>
        </div>
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-3">
        <Grafico s={s} />
        <Agendados s={s} abrir={abrir} />
        <Ultimas s={s} ver={setCupom} />
      </div>

      {cupom && <Cupom s={s} p={cupom} fechar={() => setCupom(null)} />}
    </>
  );
}

function CalendarLabel() {
  return <span>{new Date().toLocaleDateString("pt-BR", { day: "2-digit", month: "long", year: "numeric" })}</span>;
}

function Grafico({ s }: { s: Store }) {
  const dias = useMemo(() => Array.from({ length: 7 }, (_, k) => {
    const d = new Date(Date.now() - (6 - k) * 864e5).toISOString().slice(0, 10);
    const v = s.pedidos.filter((p) => p.status !== "orcamento" && p.criadoEm.slice(0, 10) === d).reduce((a, p) => a + totalPedido(p), 0);
    return { d, v };
  }), [s.pedidos]);
  const max = Math.max(1, ...dias.map((x) => x.v));
  const semana = dias.reduce((a, x) => a + x.v, 0);
  return (
    <div className={card}>
      <h3 className="font-bold">Vendas dos últimos 7 dias</h3>
      <div className="mb-3 text-2xl font-black">{brl(semana)}</div>
      <div className="flex h-40 items-end gap-2">
        {dias.map((x) => (
          <div key={x.d} className="flex h-full flex-1 flex-col items-center justify-end gap-1">
            <span className="text-[10px] text-muted-foreground">{x.v ? Math.round(x.v) : ""}</span>
            <div className="w-full rounded-t bg-primary" style={{ height: `${(x.v / max) * 110}px`, minHeight: 2 }} />
            <span className="text-xs">{new Date(x.d + "T12:00").toLocaleDateString("pt-BR", { weekday: "short" }).slice(0, 3)}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function Agendados({ s, abrir }: { s: Store; abrir: (p: Pedido) => void }) {
  const hoje = hojeISO();
  const lista = s.pedidos.filter((p) => p.entrega && p.status !== "entregue" && p.status !== "orcamento").sort((a, b) => a.entrega.localeCompare(b.entrega)).slice(0, 8);
  return (
    <div className={card}>
      <h3 className="mb-2 font-bold">Serviços agendados</h3>
      {lista.length === 0 && <p className="text-sm text-muted-foreground">Nenhum serviço agendado.</p>}
      {lista.map((p) => (
        <button key={p.id} onClick={() => abrir(p)} className="flex w-full justify-between gap-2 border-b border-border py-2 text-left text-sm last:border-0 hover:bg-muted">
          <span className="truncate"><b>#{p.numero}</b> {p.itens[0]?.nome}{p.itens.length > 1 ? ` +${p.itens.length - 1}` : ""}</span>
          <span className={`shrink-0 text-right ${p.entrega < hoje ? "font-bold text-destructive" : p.entrega === hoje ? "font-bold" : ""}`}>
            {p.entrega === hoje ? "Hoje" : dataBR(p.entrega)}<div className="text-xs font-normal text-muted-foreground">{STATUS.find((x) => x.id === p.status)?.label}</div>
          </span>
        </button>
      ))}
    </div>
  );
}

function Ultimas({ s, ver }: { s: Store; ver: (p: Pedido) => void }) {
  const lista = [...s.pedidos].filter((p) => p.status !== "orcamento").sort((a, b) => b.criadoEm.localeCompare(a.criadoEm)).slice(0, 8);
  return (
    <div className={card}>
      <h3 className="mb-2 font-bold">Últimos pedidos</h3>
      {lista.length === 0 && <p className="text-sm text-muted-foreground">Nenhuma venda ainda.</p>}
      {lista.map((p) => (
        <button key={p.id} onClick={() => ver(p)} className="flex w-full justify-between border-b border-border py-2 text-left text-sm last:border-0 hover:bg-muted">
          <span><b>#{p.numero}</b> {s.clientes.find((c) => c.id === p.clienteId)?.nome || "Consumidor final"}</span>
          <span className="flex items-center gap-1 font-semibold">{brl(totalPedido(p))} <Printer className="h-3 w-3 text-muted-foreground" /></span>
        </button>
      ))}
    </div>
  );
}

export function Cupom({ s, p, fechar }: { s: Store; p: Pedido; fechar: () => void }) {
  const c = s.clientes.find((x) => x.id === p.clienteId);
  const total = totalPedido(p);
  const recebido = p.recebido ?? total;
  const d = new Date(p.criadoEm);
  const n2 = (v: number) => v.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  const linha = "my-2 border-t border-receipt-ink";
  if (typeof document === "undefined") return null;
  return createPortal(
    <div className="thermal-receipt-overlay fixed inset-0 z-50 overflow-y-auto bg-foreground/40 p-4">
      <div className="thermal-receipt-shell mx-auto w-[58mm] max-w-full">
        <div className="thermal-receipt-actions mb-3 flex justify-end gap-2">
          <Button onClick={() => window.print()}><Printer />Imprimir</Button>
          <Button variant="outline" onClick={fechar}><X />Fechar</Button>
        </div>
        <div id="thermal-receipt" className="thermal-receipt bg-receipt-paper px-[3mm] py-[4mm] font-mono text-[10px] leading-tight text-receipt-ink shadow-xl">
          <div className="text-center">
            <div className="break-words text-sm font-black uppercase">{s.loja.nome}</div>
            {s.loja.endereco && <div>{s.loja.endereco}</div>}
            {s.loja.telefone && <div>{s.loja.telefone}</div>}
          </div>
          {s.loja.doc && <div className="mt-1">CNPJ/CPF: {s.loja.doc}</div>}
          <div className={linha} />
          <div>CLIENTE: {(c?.nome || "Consumidor final").toUpperCase()}</div>
          <div className="mt-1 flex items-end justify-between gap-2">
            <span>{d.toLocaleDateString("pt-BR")} {d.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}</span>
            <span className="shrink-0 text-right"><span className="block text-[7px] font-bold">COMPROVANTE DE VENDA</span><span className="text-xs font-black">Nº {String(p.numero).padStart(6, "0")}</span></span>
          </div>
          <div className={linha} />
          <div className="flex justify-between font-bold"><span>DESCRIÇÃO</span><span>R$ VALOR</span></div>
          <div className="flex justify-between text-[10px]"><span>QTD x UNIT</span></div>
          <div className="mt-1 space-y-1">
            {p.itens.map((i, k) => (
              <div key={k}>
                <div className="break-words font-bold uppercase">{i.nome}</div>
                <div className="flex justify-between"><span className="pl-4">{i.qtd} x {n2(i.preco)}</span><span>{n2(i.qtd * i.preco)}</span></div>
              </div>
            ))}
          </div>
          <div className={linha} />
          {!!p.desconto && <div className="flex justify-between"><span>Desconto R$</span><span>-{n2(p.desconto)}</span></div>}
          <div className="flex justify-between text-xs font-black"><span>Total da Nota R$</span><span>{n2(total)}</span></div>
          <div className="flex justify-between text-xs"><span>Valor Recebido R$</span><span>{n2(recebido)}</span></div>
          {recebido > total && <div className="flex justify-between text-xs"><span>Troco R$</span><span>{n2(recebido - total)}</span></div>}
          <div className="mt-2 font-bold">FORMA DE PGTO.: {(p.forma || "À vista").toUpperCase()}</div>
          {p.entrega && <div className="mt-1 font-bold">PREVISÃO DE ENTREGA: {dataBR(p.entrega)}</div>}
          <div className={linha} />
          <p className="mt-3 text-center">Recebi o(s) produto(s)/serviço(s) acima descrito(s), concordando com os prazos e condições.</p>
          <div className="mt-8 border-t border-dashed border-receipt-ink pt-1 text-center">ASSINATURA DO CLIENTE</div>
          <div className={linha} />
          <div className="text-center font-bold">DOCUMENTO SEM VALOR FISCAL</div>
          <div className="text-center font-bold">* OBRIGADO E VOLTE SEMPRE *</div>
        </div>
      </div>
    </div>,
    document.body,
  );
}
