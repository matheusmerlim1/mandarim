# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Stack

Phaser 4 (escolha do dono em 16/11/2026), página estática no GitHub Pages (repo público `mandarim`),
Phaser carregado de CDN com versão fixa. Sem build e sem servidor. Progresso salvo no navegador.

## Users

Falantes de português do Brasil aprendendo mandarim, do zero até o intermediário (HSK 1 a HSK 3),
estudando sozinhos em sessões curtas no computador ou no celular.

## Product Purpose

Ensinar mandarim no formato de trilha com etapas, como o Duolingo: lições curtas com sons, imagens,
caracteres, pinyin e frases, exercícios que dão retorno na hora, vidas, XP e sequência de dias.
Inclui um tradutor de texto português ⇄ chinês com pinyin e áudio. Sucesso = a pessoa volta todo dia
e avança na trilha.

## Positioning

Feito para quem fala português (explicações, armadilhas de pronúncia e comparações pensadas para o
brasileiro), com os quatro tons tratados como conteúdo próprio, e de graça, sem conta e sem anúncio.

## Capabilities and Constraints

- Som: voz chinesa do próprio navegador (Web Speech API, zh-CN). Alguns sistemas não têm voz chinesa:
  avisar e seguir com pinyin.
- Tradução: API gratuita sem chave (MyMemory). Limite diário por IP; falha precisa de mensagem clara.
- Pinyin do texto traduzido: biblioteca pinyin-pro via CDN.
- Imagens: Twemoji (CC-BY 4.0, via jsDelivr), reimpressos no navegador em duas tintas (preto e vermelho) sobre uma prancha de papel, para caberem no mundo do dicionário impresso. Crédito no rodapé.
- Conteúdo das lições é estático no repositório; nada de dados pessoais.

## Brand Commitments

Botão "Portfólio" padrão de todos os projetos do dono (bloco colado igual em todas as páginas).

## Evidence on Hand

Nenhum depoimento, número de usuários ou certificação. Não inventar.

## Product Principles

1. Lição curta: cada etapa cabe em 3 a 5 minutos.
2. Ouvir antes de ler: todo hanzi tem som e pinyin à mão.
3. Errar ensina: o erro mostra a resposta certa e volta no fim da lição.
4. Português primeiro: explicações em português simples, sem jargão de linguística.

## Accessibility & Inclusion

WCAG 2.2 AA (padrão WAVE, 0 erros e 0 alertas em 1280/390 nos temas claro e escuro), como todas as
páginas do dono. O jogo tem de funcionar só pelo teclado e anunciar perguntas e respostas a leitores
de tela.
