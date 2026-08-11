// Definição central do Programa DNA ReproBull.
// Qualquer tela que mostre nível, progresso ou prêmio deve importar daqui —
// nunca duplicar esses números em outro lugar do código.

export type DnaTier = {
  level: number;
  name: string;
  threshold: number; // vendas brutas acumuladas necessárias (R$)
  description: string;
  prize: string;
};

export const DNA_TIERS: DnaTier[] = [
  {
    level: 1,
    name: "Parceiro",
    threshold: 10000,
    description: "Inicia a jornada, aprende e conquista os primeiros resultados.",
    prize: "—",
  },
  {
    level: 2,
    name: "Consultor",
    threshold: 35000,
    description: "Entende a necessidade do cliente e vende soluções, não apenas cursos.",
    prize: "Placa + curso de Transferência de Embriões",
  },
  {
    level: 3,
    name: "Especialista",
    threshold: 70000,
    description: "Domina os produtos ReproBull e gera confiança nos clientes.",
    prize: "Vaga do Dominando (R$3.500)",
  },
  {
    level: 4,
    name: "Elite",
    threshold: 100000,
    description: "Alta performance em vendas, relacionamento e consistência de resultados.",
    prize: "Vaga do Power Vet (requer já ter feito o Power Vet)",
  },
  {
    level: 5,
    name: "Alta Performance",
    threshold: 150000,
    description: "Representa a marca ReproBull dentro e fora da empresa, inspira novos vendedores.",
    prize: "Bônus especial (a definir)",
  },
  {
    level: 6,
    name: "Lenda",
    threshold: 250000,
    description: "Profissional consolidado, reconhecido pelo impacto que gera no mercado.",
    prize: "iPhone",
  },
  {
    level: 7,
    name: "Mentor Supremo",
    threshold: 500000,
    description:
      "Requer também: ser palestrante da Imersão Muito Mais que Vet, desenvolver um infoproduto validado pela ReproBull, e mentorar novos integrantes do programa.",
    prize: "Reconhecimento como Mentor Supremo",
  },
  {
    level: 8,
    name: "Sócio ReproBull",
    threshold: 1000000,
    description: "Vira sócio com participação percentual nos cursos que ele mesmo passa a ministrar.",
    prize: "Participação percentual (a definir)",
  },
];

/** Retorna o DNA correspondente ao total de vendas brutas acumuladas.
 * Se o total for menor que o primeiro degrau, retorna null (ainda sem DNA ativo). */
export function getCurrentTier(totalSales: number): DnaTier | null {
  let current: DnaTier | null = null;
  for (const tier of DNA_TIERS) {
    if (totalSales >= tier.threshold) {
      current = tier;
    }
  }
  return current;
}

/** Retorna o próximo DNA a ser conquistado, ou null se já está no topo. */
export function getNextTier(totalSales: number): DnaTier | null {
  return DNA_TIERS.find((t) => totalSales < t.threshold) ?? null;
}

/** Progresso (0 a 1) dentro do degrau atual, para barras de progresso. */
export function getProgressToNextTier(totalSales: number): number {
  const next = getNextTier(totalSales);
  if (!next) return 1;
  const currentIndex = DNA_TIERS.findIndex((t) => t.level === next.level) - 1;
  const floor = currentIndex >= 0 ? DNA_TIERS[currentIndex].threshold : 0;
  const span = next.threshold - floor;
  const progressed = totalSales - floor;
  return Math.max(0, Math.min(1, progressed / span));
}
