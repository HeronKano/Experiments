# Brasil em Disputa — protótipo v0.1

Protótipo experimental, gratuito e estático para avaliar um board game político-histórico assimétrico para **quatro jogadores**, baseado nas ideias de seu autor. Roda em GitHub Pages, sem backend, contas ou serviços pagos.

**Jogar:** https://heronkano.github.io/Experiments/

## O que veio do autor

- Quatro papéis contínuos que se transformam entre quatro eras: Coroa, Igreja (mais tarde Intelectuais), Sertanistas e Produtores.
- Ações e obrigações por facção e por era; as decisões deixam marcas nas regiões para as eras seguintes.
- Exemplos originais: esgotamento permanente de jazidas por extração intensiva; coerção e escravização elevando resistência e risco de revolta.
- Objetivos de era acumulam pontos a serem usados nos debates finais.
- Exército como instituição independente não jogável a partir da Era III, testada pela Guerra do Paraguai, capaz de interferir nos debates e até causar derrota.
- Endgame com dez debates de 2–4 posições; propor pauta custa ação e influência; demais jogadores fazem contribuições irreversíveis; vence a posição com maior apoio; ela altera o rumo político e gera tokens de Ideia Absorvida. A intenção é uma facção ganhar ao conquistar quatro dos dez debates.

## Regras inventadas APENAS para conseguir testar

- 3 rodadas por era, 6 regiões esquemáticas, recursos iniciais iguais, bônus e custos exibidos em cada ação.
- Dinheiro ×1, Influência ×2, Mandatos ×3 no valor da aposta.
- Exército: Força/Prestígio/Autonomia; teste determinístico na Guerra do Paraguai; intervenção quando Autonomia ≥6 e Legitimidade ≤2.
- Modo solo com três bots heurísticos e modo local com quatro participantes no mesmo dispositivo.
- Sistema provisório de resolução por maior soma por posição, empate como impasse. Ao fim de dez debates, mostramos polos mais votados, incluindo empates; a regra de vitória final ainda precisa ser resolvida pelo autor.
- **Os efeitos e valores numéricos NÃO representam fatos históricos.** Transições entre papéis são abstrações lúdicas, não continuidades institucionais literais.

## Pontos de feedback essenciais

1. Quais são os **limites cronológicos**? A imagem original dos quatro desfechos situa as grandes disputas em 1822–1824, mas o novo pedido acrescenta Guerra do Paraguai e Exército. Este protótipo coloca o endgame após o século XIX.
2. Como lidar com a coexistência de **quatro facções e dez debates** (dois jogadores alcançando quatro vitórias / ninguém atingindo quatro)?
3. Quem ganha um token de Ideia Absorvida: o **polo da posição** ou cada facção que contribuiu? Qual é o bônus permanente?
4. A **Igreja vira Intelectuais** por abstração? Como preservar consistência historiográfica e assimetria?
5. As posições em debates devem seguir quatro polos predefinidos ou dimensões políticas independentes?
6. Como integrar de forma substantiva resistência e agência de povos indígenas, escravizados e outros grupos não jogáveis?

O botão **Feedback** abre uma proposta de issue com relato preenchido no GitHub. O botão **Exportar partida (JSON)** fornece um registro de acontecimentos e estado para reproduzir testes.

## Verificação histórica consultada (não fundamenta valores numéricos do jogo)

- Senado Federal, Anais das Constituintes: https://www25.senado.leg.br/web/atividade/anais/constituintes
- Memória SPU, artigo sobre sesmarias: https://memoria-spu.gestao.gov.br/publicacoes/sesmarias-e-posse-de-terras-politica-fundiaria-para-assegurar-a-colonizacao-brasileira-2/
- Exército Brasileiro, Guerra da Tríplice Aliança (1864–1870): https://eblog.eb.mil.br/en/w/tuiuti-os-160-anos-da-batalha-dos-patronos-

## Implementação

Arquivos de raiz: index.html, style.css, game.js. Sem dependências JS externas. Salvamento local no navegador em localStorage.

O projeto anterior (Eryndor, simulação econômica) permanece no **histórico Git** anterior à substituição. A rota antiga \`/grand-strategy/\` redireciona para a página atual.

**Status:** playtest de protótipo conceitual. Ainda não é um jogo historicamente validado nem balanceado.
