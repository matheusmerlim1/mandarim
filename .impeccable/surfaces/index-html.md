---
version: 1
slug: "index-html"
primary_target: "index.html"
related_targets: []
---

# Surface: index.html (app de lições)

Scope: página única do app (trilha, lição, frases, tradutor). Mode: Operate (completar lições diárias).
Audience: brasileiros do zero ao HSK 3, sessões de 3–5 min, computador e celular.
Constraints: Phaser 4.2.1 para trilha e palco da lição; controles em HTML (teclado, leitor de tela); WCAG 2.2 AA nos dois temas.

## Direction contract

THESIS: o app é um dicionário Xinhua de bolso que vira trilha: cada lição é um verbete, cada unidade uma aba de dedo na borda. Recusa o mapa de bolinhas coloridas sobre fundo branco do gênero.

OWN-WORLD: capa de vinil vermelho-sangue de dicionário com título em dourado de folha (cabeçalho, abas, barra da lição); miolo em papel-bíblia frio e acinzentado, tinta preta, fios de régua de 1px, grade 田字格 tracejada em vermelho para o hanzi. Hanzi em Song (Noto Serif SC), pinyin em serifa com diacríticos, UI em sans de trabalho. Uma cor reservada (o vermelho-carimbo) marca só a etapa ativa — doação do mapa de orientação: o traço roxo do percurso ativo. Acerto = carimbo de selo vermelho; erro = risco de lápis.

STORY: a pessoa abre o dicionário, vê onde parou (verbete carimbado em vermelho), ouve e lê cada palavra antes de ser testada, erra sem medo e fecha o livro com XP e sequência.

FIRST VIEWPORT: capa vermelha em faixa no topo (marca 汉语 em dourado, sequência, XP, vidas); abaixo, a página do dicionário ocupando a largura útil com as abas de unidade na borda direita e a coluna de verbetes em zigue-zague ligada por um fio; o verbete atual em vermelho com o botão "Começar" ao lado. Ação primária = o verbete atual.

FORM: dicionário Xinhua (3º da lista ordenada) · seed:79d1b80c27e24811

FINISH: unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, DESIGN.md, and every shipping raster carrying its provenance
