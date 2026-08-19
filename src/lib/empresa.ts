/**
 * Identificação legal da loja.
 *
 * ⚠️ TODOS OS VALORES ABAIXO SÃO FICTÍCIOS — troque antes de abrir a loja ao
 * público. Estão deliberadamente no formato "zerado" (00.000.000/0001-00,
 * "Avenida Exemplo") para que ninguém confunda com dado real e publique a
 * loja com informação errada: campo obviamente vazio salta aos olhos, dado
 * plausível e falso passa despercebido.
 *
 * O Decreto 7.962/2013 exige que CNPJ, endereço físico e canal de atendimento
 * apareçam de forma ostensiva em todo comércio eletrônico — por isso eles
 * entram no rodapé de todas as páginas, não só nos termos.
 */
export const EMPRESA = {
  nomeFantasia: 'Loja Strong Business School',
  razaoSocial: 'RAZÃO SOCIAL A DEFINIR LTDA.',
  cnpj: '00.000.000/0001-00',

  endereco: {
    logradouro: 'Avenida Exemplo, 1000 — Conjunto 100',
    bairro: 'Bairro Exemplo',
    cidade: 'São Paulo',
    uf: 'SP',
    cep: '00000-000',
  },

  contato: {
    email: 'loja@strong.com.br',
    telefone: '(11) 0000-0000',
    horario: 'dias úteis, das 9h às 18h',
  },

  /** Encarregado de dados (DPO) exigido pelo art. 41 da LGPD. */
  encarregado: {
    nome: 'ENCARREGADO A DEFINIR',
    email: 'privacidade@strong.com.br',
  },

  /** Comarca do foro eleito nos termos de uso. */
  foro: 'São Paulo/SP',

  /**
   * Data da última revisão dos documentos legais, exibida no topo das duas
   * páginas. Atualize junto com qualquer mudança de texto.
   */
  atualizadoEm: '19 de agosto de 2026',
} as const

/** Endereço completo em uma linha, para o rodapé e os termos. */
export function enderecoCompleto(): string {
  const { logradouro, bairro, cidade, uf, cep } = EMPRESA.endereco
  return `${logradouro} — ${bairro}, ${cidade}/${uf}, CEP ${cep}`
}
