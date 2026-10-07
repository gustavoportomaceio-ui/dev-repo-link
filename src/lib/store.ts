import { useEffect, useRef, useState } from "react";
import { carregarDados, salvarDado } from "./dados.functions";

export type Cliente = { id: string; nome: string; telefone: string; email: string; doc: string; endereco: string };
export type Item = { id: string; tipo: "produto" | "servico"; nome: string; preco: number; unidade: string; estoque: number; prazoDias: number; faixas?: Faixa[] };
export type Faixa = { de: number; ate: number; preco: number };
export type PedidoItem = { itemId: string; nome: string; qtd: number; preco: number };
export type Status = "orcamento" | "arte" | "aprovacao" | "impressao" | "pronto" | "entregue";
export type Pagamento = "pendente" | "sinal" | "pago";
export type Pedido = {
  id: string; numero: number; clienteId: string; itens: PedidoItem[]; desconto: number;
  status: Status; pagamento: Pagamento; entrega: string; pago: boolean; sinal: number; obs: string; criadoEm: string; forma?: string; recebido?: number;
};
export type Loja = { nome: string; telefone: string; endereco: string; doc: string };

export const STATUS: { id: Status; label: string }[] = [
  { id: "orcamento", label: "Orçamento" },
  { id: "arte", label: "Criação da arte" },
  { id: "aprovacao", label: "Aprovação do cliente" },
  { id: "impressao", label: "Impressão e acabamento" },
  { id: "pronto", label: "Pronto p/ retirar" },
  { id: "entregue", label: "Entregue" },
];

export const faixaDe = (it: Item | undefined, qtd: number) =>
  it?.faixas?.find((f) => qtd >= (f.de || 0) && (!f.ate || qtd <= f.ate));
export const precoPorQtd = (it: Item | undefined, qtd: number) => faixaDe(it, qtd)?.preco ?? it?.preco ?? 0;
export const uid = () => Math.random().toString(36).slice(2, 10);
export const brl = (n: number) => n.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
export const totalPedido = (p: Pedido) => Math.max(0, p.itens.reduce((s, i) => s + i.qtd * i.preco, 0) - (p.desconto || 0));
export const dataBR = (d: string) => (d ? new Date(d + "T12:00:00").toLocaleDateString("pt-BR") : "—");

// Dados ficam na nuvem; na primeira vez, o que estiver salvo neste computador é enviado.
let carga: Promise<Record<string, unknown>> | null = null;
const carregarTudo = () =>
  (carga ??= carregarDados().then((r) => JSON.parse(r.dados) as Record<string, unknown>));

function usePersist<T>(key: string, initial: T) {
  const [v, setV] = useState<T>(initial);
  const [ok, setOk] = useState(false);
  const ultimo = useRef<string>("");
  useEffect(() => {
    let vivo = true;
    carregarTudo().then((nuvem) => {
      if (!vivo) return;
      if (key in nuvem) {
        ultimo.current = JSON.stringify(nuvem[key]);
        setV(nuvem[key] as T);
      } else {
        try { const r = localStorage.getItem(key); if (r) setV(JSON.parse(r)); } catch {}
      }
      setOk(true);
    }).catch(() => setOk(false));
    return () => { vivo = false; };
  }, [key]);
  useEffect(() => {
    if (!ok) return;
    const json = JSON.stringify(v);
    if (json === ultimo.current) return;
    const t = setTimeout(() => {
      salvarDado({ data: { key, value: json } }).then(() => { ultimo.current = json; }).catch(() => {});
    }, 500);
    return () => clearTimeout(t);
  }, [key, v, ok]);
  return [v, setV] as const;
}

const itensIniciais: Item[] = [
  { id: uid(), tipo: "servico", nome: "Cartão de visita 4x4 (1000 un)", preco: 120, unidade: "milheiro", estoque: 0, prazoDias: 3 },
  { id: uid(), tipo: "servico", nome: "Banner lona 1x1m", preco: 60, unidade: "m²", estoque: 0, prazoDias: 2 },
  { id: uid(), tipo: "servico", nome: "Impressão colorida A4", preco: 2, unidade: "folha", estoque: 0, prazoDias: 0 },
  { id: uid(), tipo: "produto", nome: "Papel couché 300g A3", preco: 3.5, unidade: "folha", estoque: 500, prazoDias: 0 },
  { id: uid(), tipo: "produto", nome: "Caneca personalizada", preco: 35, unidade: "un", estoque: 24, prazoDias: 0 },
];

export function useLojaStore() {
  const [clientes, setClientes] = usePersist<Cliente[]>("gr_clientes", []);
  const [itens, setItens] = usePersist<Item[]>("gr_itens", itensIniciais);
  const [pedidos, setPedidos] = usePersist<Pedido[]>("gr_pedidos", []);
  const [loja, setLoja] = usePersist<Loja>("gr_loja", { nome: "Gráfica Amarelinha", telefone: "", endereco: "", doc: "" });
  const pedidosOk = pedidos.map((p) => {
    const st = p.status as string;
    const status = (st === "aprovado" ? "arte" : st === "producao" ? "impressao" : st) as Status;
    const pagamento: Pagamento = p.pagamento ?? (p.pago ? "pago" : p.sinal ? "sinal" : "pendente");
    return status === p.status && pagamento === p.pagamento ? p : { ...p, status, pagamento };
  });
  return { clientes, setClientes, itens, setItens, pedidos: pedidosOk, setPedidos, loja, setLoja };
}
export type Store = ReturnType<typeof useLojaStore>;
