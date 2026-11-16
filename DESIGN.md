---
name: 汉语 Mandarim
description: Dicionário Xinhua de bolso que vira trilha de lições: capa de vinil vermelho com folha de ouro, miolo em papel-bíblia, tinta preta e um vermelho-carimbo reservado.
colors:
  capa: "#8a1a1c"
  capa-funda: "#6c1113"
  capa-brilho: "#a3282a"
  ouro: "#f2d58a"
  ouro-sombra: "#c9a659"
  papel: "#edece6"
  papel-fundo: "#e2e0d8"
  folha: "#f7f6f1"
  tinta: "#1c1b19"
  tinta-suave: "#55514a"
  fio: "#c4bfb3"
  fio-forte: "#7f7a70"
  carimbo: "#b8231a"
  carimbo-fundo: "#f6ddd7"
  carimbo-texto: "#8e1810"
  sobre-carimbo: "#fff8f0"
  lapis: "#34527a"
  lapis-fundo: "#dde4ee"
typography:
  hanzi-marca:
    fontFamily: "Noto Serif SC, Songti SC, SimSun, serif"
    fontSize: "1.6rem"
    fontWeight: 900
    lineHeight: 1
    letterSpacing: "0.08em"
  hanzi-verbete:
    fontFamily: "Noto Serif SC, Songti SC, SimSun, serif"
    fontSize: "clamp(2.4rem, 2rem + 2vw, 3.4rem)"
    fontWeight: 900
    lineHeight: 1
  headline:
    fontFamily: "Source Serif 4, Georgia, serif"
    fontSize: "clamp(1.6rem, 1.2rem + 1.6vw, 2.3rem)"
    fontWeight: 700
    lineHeight: 1.15
    letterSpacing: "-0.01em"
  title:
    fontFamily: "Source Serif 4, Georgia, serif"
    fontSize: "clamp(1.3rem, 1.1rem + 1vw, 1.75rem)"
    fontWeight: 700
    lineHeight: 1.25
  pinyin:
    fontFamily: "Source Serif 4, Georgia, serif"
    fontSize: "1.05rem"
    fontWeight: 400
    lineHeight: 1.3
  body:
    fontFamily: "Noto Sans, Segoe UI, system-ui, sans-serif"
    fontSize: "1rem"
    fontWeight: 400
    lineHeight: 1.55
  label:
    fontFamily: "Noto Sans, Segoe UI, system-ui, sans-serif"
    fontSize: "0.95rem"
    fontWeight: 600
    lineHeight: 1
rounded:
  xs: "3px"
  sm: "4px"
  md: "6px"
  stamp: "10px"
  pill: "999px"
spacing:
  xs: "8px"
  sm: "12px"
  md: "16px"
  lg: "32px"
  xl: "56px"
components:
  button-capa:
    backgroundColor: "{colors.capa}"
    textColor: "{colors.ouro}"
    rounded: "{rounded.sm}"
    padding: "0.6rem 1.4rem"
    height: "46px"
  button-capa-hover:
    backgroundColor: "{colors.capa-brilho}"
  button-linha:
    backgroundColor: "transparent"
    textColor: "{colors.tinta}"
    rounded: "{rounded.sm}"
    padding: "0.6rem 1.4rem"
    height: "46px"
  trail-node-done:
    backgroundColor: "{colors.tinta}"
    textColor: "{colors.folha}"
    rounded: "{rounded.md}"
    size: "76px"
  trail-node-active:
    backgroundColor: "{colors.carimbo}"
    textColor: "{colors.sobre-carimbo}"
    rounded: "{rounded.md}"
    size: "76px"
  trail-node-locked:
    backgroundColor: "{colors.papel}"
    textColor: "{colors.tinta-suave}"
    rounded: "{rounded.md}"
    size: "76px"
  option:
    backgroundColor: "{colors.folha}"
    textColor: "{colors.tinta}"
    rounded: "{rounded.sm}"
    padding: "0.7rem 1rem 0.7rem 0.8rem"
    height: "60px"
  option-correct:
    backgroundColor: "{colors.carimbo-fundo}"
    textColor: "{colors.tinta}"
  option-wrong:
    backgroundColor: "{colors.lapis-fundo}"
    textColor: "{colors.tinta}"
  thumb-tab:
    backgroundColor: "{colors.capa}"
    textColor: "{colors.ouro}"
    rounded: "{rounded.md}"
    width: "40px"
    height: "34px"
---

# Design System: 汉语 Mandarim

## Overview

**Creative North Star: "O Dicionário de Bolso"**

O app é um dicionário Xinhua que virou trilha. A capa é de vinil vermelho-sangue com título em folha de ouro e envolve o topo da tela; o miolo é papel-bíblia frio e acinzentado, com tinta preta e fios de régua de 1px. Cada lição é um verbete, cada unidade uma aba de dedo na borda direita. A interface recusa o mapa de bolinhas coloridas sobre fundo branco do gênero: aqui tudo é impresso, e o que é impresso é tinta sobre papel.

A cor é repartida em duas casas. O vermelho de capa (com o ouro) pertence só à estrutura do livro: cabeçalho, abas de dedo e botões de chamada. O vermelho-carimbo é outro vermelho, reservado ao que é vivo: a etapa ativa da trilha, o carimbo de acerto, o estado de resposta certa e o contorno do tom. Todo o resto, incluindo etapas concluídas, selos 优, grades das lições e ícones, é tinta.

O feedback fala a língua do estudo em papel. Acerto é um carimbo vermelho 对 posto na maior margem livre; erro é um risco de lápis azul-grafite (lápis), nunca vermelho e nunca uma sirene. As ilustrações são Twemoji reimpressos em tempo de execução em duas tintas, sobre uma prancha de papel com moldura de fio.

**Key Characteristics:**
- Capa vermelha e ouro fora, papel e tinta dentro; o vermelho-carimbo é a única cor viva do miolo.
- Hanzi em Song, pinyin em serifa com diacríticos, interface em sans de trabalho.
- Estados por tinta (preenchimento preto, contorno, fio), não por matiz.
- Acerto = carimbo; erro = risco de lápis.
- Tema escuro é o mesmo livro à luz de abajur: papel quase preto, tinta clara, carimbo salmão.

## Colors

Paleta de livro impresso: um vermelho de capa, um vermelho de carimbo, ouro de folha, papel e tinta, e um azul-grafite de lápis para o erro.

### Primary
- **Vinil Vermelho-Sangue** (#8a1a1c): capa do cabeçalho, abas de dedo e botões de chamada (`button-capa`). Hover em #a3282a (`capa-brilho`), borda inferior e sombra interna em #6c1113 (`capa-funda`). Nunca aparece no miolo.
- **Folha de Ouro** (#f2d58a): texto e filetes sobre a capa (marca, abas, rótulos dos botões de chamada). Com #c9a659 como filete duplo da marca e dos botões.

### Secondary
- **Vermelho-Carimbo** (#b8231a): reservado. Nó ativo da trilha e sua grade 田字格, carimbo de acerto 对, opção correta (contorno de 2px), contorno do tom, selo de fim. Texto sobre fundo de carimbo usa #8e1810 (`carimbo-texto`); fundo de feedback #f6ddd7; texto sobre carimbo cheio #fff8f0.

### Tertiary
- **Lápis Azul-Grafite** (#34527a): somente erro. Opção errada (contorno de 2px, fundo #dde4ee, texto riscado), rodapé de erro, caixa de mensagem de erro e o rabisco do palco.

### Neutral
- **Papel-Bíblia** (#edece6): fundo do app. Papel mais fundo (#e2e0d8) para hover e seleção.
- **Folha Branca** (#f7f6f1): superfície de cartões, opções, campos e pranchas de ilustração.
- **Tinta Preta** (#1c1b19): texto, nós concluídos, selos 优, grades das lições, ícones, foco.
- **Tinta Suave** (#55514a): texto secundário, pinyin, legendas.
- **Fio** (#c4bfb3) e **Fio Forte** (#7f7a70): réguas de 1px, bordas de controles e estados desabilitados.
- **Tema escuro** (bloco `prefers-color-scheme` e `[data-theme="dark"]`): capa #5c0f11, papel #141312, folha #1a1917, tinta #ecebe5, carimbo #ff6f5e, lápis #93b3dc. Mesmos papéis, valores recalibrados.
- **Cores de impressão do Phaser** (fixas, para as pranchas): tinta #1c1b19, papel de prancha #f7f6f1, vermelho impresso #b8231a.

### Named Rules
**The Two Reds Rule.** O vermelho de capa é estrutura, o vermelho-carimbo é estado. Um nunca faz o trabalho do outro: botão de chamada em carimbo ou nó ativo em vinil são erros.

**The Ink Carries It Rule.** Concluído, perfeito (优), lição, ícone: tudo em tinta. O vermelho-carimbo só entra onde há ação ou resposta viva agora.

**The Pencil Is Not Red Rule.** Erro nunca usa vermelho. É lápis azul-grafite, com contorno, fundo e texto riscado, para que acerto e erro se distingam sem depender de matiz.

## Typography

**Hanzi Font:** Noto Serif SC (com Songti SC, SimSun, serif)
**Pinyin e Títulos Latinos:** Source Serif 4 (com Georgia, serif)
**UI Font:** Noto Sans (com Segoe UI, system-ui, sans-serif)

**Character:** Song para o caractere, serifa de dicionário para a romanização e os títulos, sans de trabalho para os controles. Pinyin sempre em itálico, como entrada de verbete.

### Hierarchy
- **Marca** (Noto Serif SC 900, 1.6rem, 1, tracking .08em): 汉语 na capa, ao lado de MANDARIM em Source Serif 4 600 versalete com tracking .14em.
- **Hanzi do verbete** (900, clamp 2.4 a 3.4rem, 1): caractere-chave da unidade.
- **Headline** (Source Serif 4 700, clamp 1.6 a 2.3rem, 1.15): h1 de cada vista.
- **Title** (Source Serif 4 700, clamp 1.3 a 1.75rem, 1.25): enunciado da lição; o termo-alvo em português usa o texto de carimbo.
- **Pinyin** (Source Serif 4 itálico 400, 1.05rem, 1.3): entrada de verbete, opções, cartões; 1.4 a 1.6rem em campos e cartão de novidade.
- **Body** (Noto Sans 400, 1rem, 1.55): texto corrido; limites de 60 a 65ch.
- **Label** (Noto Sans 600 a 700, .92 a 1rem): abas, filtros, botões, placar com números tabulares.

### Named Rules
**The Dictionary Entry Rule.** Hanzi em Song, pinyin em itálico serifado, português em sans. Os três nunca trocam de família entre si.

## Layout

Página única com colunas de leitura estreitas: folha de 760px (820px para texto), barra da lição de 860px, capa até 1080px. Gutter fluido `clamp(16px, 4vw, 32px)`. A trilha é uma coluna central de verbetes em zigue-zague (deslocamento horizontal por variável `--x`), cada linha com 112px de altura mínima (100px no celular), ligada por um fio desenhado no canvas Phaser que fica fixo atrás do conteúdo. Abas de dedo fixas na borda direita; no celular a folha reserva 52px à direita para elas. Capa em 64px de altura (56px no celular, marca latina escondida). Em lição, a capa some e um rodapé fixo carrega o botão e o retorno. Opções em grade `auto-fit` com mínimo de 220px (130px para tons). Alvos de toque de 44px ou mais.

## Elevation & Depth

Papel plano: a profundidade vem de fios de 1px, de contornos internos e da camada de papel, não de sombra ambiente. Cartões elevados (cartão de novidade, tradutor) usam uma única sombra suave (`0 1px 2px` mais `0 6px 18px` em tinta a 8 a 12%). A capa projeta uma sombra curta para baixo. Réguas duplas (linha e linha fina abaixo) fecham cabeçalhos de folha.

### Named Rules
**The Paper Is Flat Rule.** Superfícies são planas em repouso; separação é fio de 1px ou prancha com moldura, e a única sombra difusa é a do cartão elevado.

## Shapes

Cantos quase retos, como quinas de livro: 3px (numeração), 4px (botões, opções, campos, cartões), 6px (nós e abas de dedo, que são arredondadas só do lado de fora), 10px apenas no selo de carimbo, círculo nos botões de ícone e pílula nos filtros. A moldura dupla de fio (borda mais contorno deslocado em 2px) marca a marca e os botões de chamada. A grade 田字格 tracejada enquadra o hanzi da etapa ativa e das lições.

## Components

### Buttons
- **Shape:** quase reto (4px), altura mínima 46px.
- **Chamada (`botao-capa`):** vinil vermelho com texto de ouro e moldura dupla de filete dourado; hover clareia para o brilho de capa; pressionado desce 1px; desabilitado vira papel fundo com fio.
- **Linha:** transparente, texto de tinta, contorno de fio forte; hover no papel mais fundo.
- **Ícone:** círculo de 44px, cinza de tinta suave que escurece no hover.

### Trilha (nós)
- **Concluído:** quadrado de 76px (64px no celular) preenchido de tinta, hanzi em folha.
- **Atual:** vermelho-carimbo cheio com a grade 田字格; único elemento da trilha em cor viva; rótulo "Começar" em texto de carimbo.
- **Trancado:** papel com fio e cadeado pequeno; sem hover.
- Rótulo de cada nó ao lado, alternando de lado conforme o zigue-zague.

### Abas de dedo
- Fixas à direita, 40x34px, capa vermelha com ouro e sombra interna de 3px; a unidade atual alarga para 52px. Cantos arredondados só no lado de fora.

### Opções de resposta
- Folha branca, fio forte de 1px, 4px de canto, mínimo de 60px, numeração em caixinha. Selecionada: contorno interno de tinta de 2px. Certa: contorno de carimbo e fundo de carimbo. Errada: contorno de lápis, fundo de lápis e texto riscado. Opções de tom mostram a curva do tom como traço.

### Peças de montar
- Peças de folha com fio e uma borda inferior de 2px; montagem sobre pauta de fio.

### Campos
- Campo de pinyin em itálico serifado 1.4rem, fundo de folha, fio forte; foco com contorno de tinta de 2px.

### Régua de progresso
- Barra de 14px com graduação de 10% em fio e preenchimento de tinta, que avança com ease-out exponencial.

### Rodapé de feedback
- Fixo na base. Neutro em papel; acerto em fundo e texto de carimbo; erro em fundo e texto de lápis. Detalhe da resposta sempre em tinta.

### Carimbo e risco (assinatura)
- Acerto: selo vermelho 对 colocado na maior margem livre do palco, entra em escala maior e assenta (Expo ease-out). Erro: rabisco de lápis azul-grafite. Fim de lição: selo de 112px a -6° com borda de 5px que carimba ao entrar. Em lição perfeita, a etapa ganha um selo 优 em tinta.

### Pranchas de ilustração
- Twemoji reimpresso em tempo de execução, em duas tintas (tom de tinta para papel mais acento vermelho). Se mais de 12% da figura for vermelha, imprime tudo em tinta. Cada figura fica sobre uma prancha de papel com moldura de fio de 1px.

### Movimento
- Curva principal: Expo ease-out (`cubic-bezier(.16, 1, .3, 1)` no CSS e `Expo.easeOut` no Phaser), 350 a 450ms. Gesto de assinatura: o carimbo assenta e a tinta corre pelo fio da trilha até o próximo nó. `prefers-reduced-motion` reduz as transições do CSS a 0,01ms e o Phaser pula as animações de entrada.

## Do's and Don'ts

### Do:
- **Do** manter o vermelho de capa (#8a1a1c) na estrutura do livro: cabeçalho, abas de dedo e botões de chamada.
- **Do** reservar o vermelho-carimbo (#b8231a) à etapa ativa, ao carimbo 对, ao estado de resposta certa e ao contorno do tom.
- **Do** mostrar acerto como carimbo vermelho na maior margem livre e erro como risco de lápis azul-grafite (#34527a).
- **Do** usar tinta para concluído, 优, grades das lições e ícones.
- **Do** imprimir ilustrações em duas tintas sobre prancha de papel com moldura de fio; com mais de 12% de vermelho, tudo em tinta.
- **Do** manter alvos de 44px e contraste AA nos dois temas; estados diferem por forma e contorno, não só por matiz.
- **Do** usar Expo ease-out e respeitar `prefers-reduced-motion`.

### Don't:
- **Don't** usar o vermelho de capa para estados vivos, nem o vermelho-carimbo para botões de chamada ou cabeçalho.
- **Don't** mostrar erro em vermelho.
- **Don't** usar o mapa de bolinhas coloridas sobre fundo branco do gênero, nem gradiente decorativo no miolo.
- **Don't** trocar as famílias do verbete: hanzi fora de Song, pinyin fora do itálico serifado.
- **Don't** pintar ilustrações em cores cheias de emoji; sempre duas tintas.
