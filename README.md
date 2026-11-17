# 汉语 Mandarim

Página para aprender mandarim do zero ao HSK 3, no formato de trilha com etapas (como o Duolingo),
com cara de dicionário Xinhua de bolso: cada lição é um verbete, cada unidade uma aba na borda.

**Abrir:** https://matheusmerlim1.github.io/mandarim/

## O que tem

- **Trilha** com 13 unidades (tons, cumprimentos, números, família, comida, horas, lugares, compras,
  transporte, rotina, clima, sentimentos, viagem), 63 lições e 147 palavras com imagem.
- **Exercícios**: palavra nova (imagem, hanzi na grade 田字格, pinyin, som), escolha do significado,
  escolha do caractere, ouvir e escolher, escrever o pinyin (aceita `nǐ hǎo` ou `ni3 hao3`), achar o tom,
  ligar pares, montar frases, traduzir frases. Errou: mostra a resposta e o exercício volta no fim.
- **Vidas, pontos, meta diária e sequência de dias**, salvos só no navegador. Vida volta a cada 20 min;
  praticar uma lição já feita devolve uma vida.
- **Frases**: guia com 30 frases úteis (básico, restaurante, compras, transporte, emergência) com áudio.
- **Tradutor** português ⇄ chinês com pinyin em cima de cada caractere, áudio e botão de copiar.
- Teclado: `1`–`5` escolhem a opção, `Enter` verifica e continua.

## Como funciona

- HTML/CSS/JS sem build. **Phaser 4.2.1** desenha o fio da trilha, a grade de caligrafia, o carimbo
  对 do acerto e o risco de lápis do erro; os controles são HTML (teclado e leitor de tela).
- Som: cada palavra e frase do curso tem um MP3 em `audio/` (230 arquivos, voz neural
  `zh-CN-XiaoxiaoNeural` gerada com o [edge-tts](https://github.com/rany2/edge-tts); detalhes em
  `audio/CREDITOS.md`), então toca em qualquer aparelho. O tradutor (texto livre) usa a voz chinesa
  do navegador. Índice dos arquivos: `js/audios.js` (chave = texto sem pontuação).
- Cores: cada sílaba do pinyin e cada caractere na cor do seu tom (1º vermelho, 2º verde, 3º azul,
  4º roxo, neutro cinza); cada unidade com a sua cor nas abas e nos verbetes.
- Tradução: API gratuita do [MyMemory](https://mymemory.translated.net/) (limite diário por conexão).
  Pinyin: [pinyin-pro](https://github.com/zh-lib/pinyin-pro).
- Imagens: [Twemoji](https://github.com/jdecked/twemoji), CC-BY 4.0.

## Arquivos

| Arquivo | O que faz |
|---|---|
| `js/dados.js` | conteúdo: unidades, palavras, frases, guia de frases |
| `js/regras.js` | regras sem Phaser/DOM: trilha, exercícios, correção de pinyin, vidas, XP, sequência |
| `js/cenas.js` | cenas Phaser (trilha e palco da lição) |
| `js/app.js` | tela: trilha, lição, frases, tradutor |
| `js/voz.js`, `js/tradutor.js` | som e tradução |

## Testes

```
npm test
```

Acessibilidade (WCAG 2.2 AA): 0 erros e 0 alertas em 1280/390, claro/escuro, em todos os estados
(trilha, lição, erro, fim, frases, tradutor). Para medir, sirva a pasta por HTTP (os módulos JS não
carregam por `file://`), ex.: `python -m http.server 8727`, e rode o `audit.js` com a URL.
