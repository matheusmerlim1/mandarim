/* global Phaser */
// Cenas Phaser. Os controles ficam no HTML; o canvas desenha o que é do dicionário:
// o fio da trilha, a grade 田字格, o carimbo do acerto e o risco de lápis do erro.
// Cada caractere é pintado com a cor do seu tom; o fio feito leva a cor da unidade.

import { tonsPorCaractere } from './regras.js?v=4';

const DPR = () => Math.min(window.devicePixelRatio || 1, 2);
const FONTE_HZ = '"Noto Serif SC", "Songti SC", "SimSun", serif';
const FONTE_PY = '"Source Serif 4", Georgia, serif';
const PAPEL_PRANCHA = 0xf7f6f1;
const reduzir = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;

export function cores() {
  const cs = getComputedStyle(document.documentElement);
  const c = (n) => Phaser.Display.Color.HexStringToColor(cs.getPropertyValue(n).trim() || '#000').color;
  const s = (n) => cs.getPropertyValue(n).trim();
  return {
    tinta: c('--tinta'), tinta2: c('--tinta-2'), fio: c('--fio'), fioForte: c('--fio-forte'),
    carimbo: c('--carimbo'), lapis: c('--lapis'), folha: c('--folha'), papel: c('--papel'),
    css: { tinta: s('--tinta'), tinta2: s('--tinta-2'), carimbo: s('--carimbo'), folha: s('--folha') },
    tom: [null, s('--t1'), s('--t2'), s('--t3'), s('--t4'), s('--t5')],
  };
}

export function garantirFonte(texto) {
  if (!document.fonts || !texto) return Promise.resolve();
  return Promise.race([
    Promise.all([
      document.fonts.load(`700 64px "Noto Serif SC"`, texto),
      document.fonts.load(`400 32px "Source Serif 4"`, 'āáǎà'),
    ]),
    new Promise((ok) => setTimeout(ok, 2500)),
  ]).catch(() => {});
}

export function criarJogo(parent, Cena) {
  const dpr = DPR();
  const w = Math.max(1, parent.clientWidth);
  const h = Math.max(1, parent.clientHeight);
  const game = new Phaser.Game({
    type: Phaser.AUTO,
    parent,
    transparent: true,
    width: Math.round(w * dpr),
    height: Math.round(h * dpr),
    scale: { mode: Phaser.Scale.NONE, zoom: 1 / dpr },
    input: { keyboard: false, mouse: false, touch: false, gamepad: false },
    audio: { noAudio: true },
    banner: false,
    scene: [Cena],
  });
  game.dpr = dpr;
  const ajustar = () => {
    const ww = Math.max(1, parent.clientWidth);
    const hh = Math.max(1, parent.clientHeight);
    game.scale.resize(Math.round(ww * dpr), Math.round(hh * dpr));
    game.events.emit('redimensionar', ww, hh);
  };
  new ResizeObserver(ajustar).observe(parent);
  return game;
}

function prepararCamera(cena) {
  const dpr = cena.game.dpr;
  const cam = cena.cameras.main;
  cam.setOrigin(0, 0).setZoom(dpr);
  cena.game.events.on('redimensionar', (w, h) => cam.setSize(w * dpr, h * dpr));
  return cam;
}

// Linha tracejada sobre uma lista de pontos.
function tracejar(g, pts, traco = 7, vao = 6) {
  let resta = traco;
  let desenhando = true;
  for (let i = 1; i < pts.length; i++) {
    let a = pts[i - 1];
    const b = pts[i];
    let seg = Phaser.Math.Distance.Between(a.x, a.y, b.x, b.y);
    while (seg > 0) {
      const passo = Math.min(resta, seg);
      const t = passo / seg;
      const p = { x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t };
      if (desenhando) g.lineBetween(a.x, a.y, p.x, p.y);
      a = p;
      seg -= passo;
      resta -= passo;
      if (resta <= 0) { desenhando = !desenhando; resta = desenhando ? traco : vao; }
    }
  }
}

function curva(a, b) {
  const meioY = (a.y + b.y) / 2;
  return new Phaser.Curves.CubicBezier(
    new Phaser.Math.Vector2(a.x, a.y),
    new Phaser.Math.Vector2(a.x, meioY),
    new Phaser.Math.Vector2(b.x, meioY),
    new Phaser.Math.Vector2(b.x, b.y),
  );
}

// Grade 田字格: quadrado cheio e cruz tracejada.
function grade(g, x, y, lado, cor, corFio) {
  g.lineStyle(2, cor, 1).strokeRect(x, y, lado, lado);
  g.lineStyle(1, corFio, 1);
  tracejar(g, [{ x: x + lado / 2, y }, { x: x + lado / 2, y: y + lado }], 5, 5);
  tracejar(g, [{ x, y: y + lado / 2 }, { x: x + lado, y: y + lado / 2 }], 5, 5);
}

/* ============================== TRILHA ============================== */
export class CenaTrilha extends Phaser.Scene {
  constructor() { super('trilha'); }

  create() {
    this.cam = prepararCamera(this);
    this.c = cores();
    this.nos = [];
    this.fundo = this.add.graphics();
    this.tinta = this.add.graphics();
    this.marcas = this.add.container(0, 0);
    this.pulso = this.add.graphics();
    this.animando = null;
    this.game.events.on('nos', (nos) => { this.nos = nos; this.desenhar(); });
    this.game.events.on('tema', () => { this.c = cores(); this.desenhar(); });
    this.game.events.on('carimbar', (i) => this.carimbar(i));
    this.game.cenaPronta = true;
    this.game.events.emit('cena-pronta');
    this.tweens.addCounter({
      from: 0, to: 1, duration: 1800, repeat: -1,
      onUpdate: (tw) => this.desenharPulso(tw.getValue()),
    });
  }

  update() {
    this.cam.setScroll(window.scrollX, window.scrollY);
  }

  ligacoes() {
    const r = [];
    for (let i = 1; i < this.nos.length; i++) {
      const a = this.nos[i - 1];
      const b = this.nos[i];
      if (a.unidade === b.unidade) r.push([a, b, i]);
    }
    return r;
  }

  desenhar(ateAnimado = null) {
    const { c } = this;
    this.fundo.clear();
    this.tinta.clear();
    this.marcas.removeAll(true);
    for (const [a, b, i] of this.ligacoes()) {
      const pts = curva(a, b).getPoints(40);
      const feito = a.estado === 'feita' && (b.estado !== 'trancada' || ateAnimado === i);
      if (feito && ateAnimado !== i) {
        this.tinta.lineStyle(3, a.cor ? Phaser.Display.Color.HexStringToColor(a.cor).color : c.tinta, 1);
        this.tinta.strokePoints(pts);
      } else {
        this.fundo.lineStyle(1.5, c.fioForte, 1);
        tracejar(this.fundo, pts);
      }
    }
    const atual = this.nos.find((n) => n.estado === 'atual');
    if (atual) {
      const lado = atual.lado + 34;
      grade(this.fundo, atual.x - lado / 2, atual.y - lado / 2, lado, c.carimbo, c.carimbo);
    }
    for (const n of this.nos) {
      if (n.estado === 'feita' && n.perfeita) this.selo(n.x + n.lado / 2 + 10, n.y - n.lado / 2 - 6, '优', 22, 0.12, this.c.tinta);
    }
  }

  selo(x, y, letra, lado, giro = 0, cor = this.c.carimbo) {
    const g = this.add.graphics();
    g.fillStyle(cor, 1).fillRoundedRect(-lado / 2, -lado / 2, lado, lado, 3);
    const t = this.add.text(0, 0, letra, {
      fontFamily: FONTE_HZ, fontSize: `${Math.round(lado * 0.68)}px`, fontStyle: '700', color: this.c.css.folha,
    }).setOrigin(0.5).setResolution(this.game.dpr * 2);
    const ct = this.add.container(x, y, [g, t]).setRotation(giro);
    this.marcas.add(ct);
    return ct;
  }

  desenharPulso(v) {
    this.pulso.clear();
    const atual = this.nos.find((n) => n.estado === 'atual');
    if (!atual || reduzir()) return;
    const lado = atual.lado + 34 + v * 26;
    this.pulso.lineStyle(2, this.c.carimbo, (1 - v) * 0.55);
    this.pulso.strokeRect(atual.x - lado / 2, atual.y - lado / 2, lado, lado);
  }

  // Assinatura: o verbete recém-feito recebe o carimbo e a tinta corre pelo fio até o próximo.
  carimbar(i) {
    const n = this.nos[i];
    if (!n) return;
    const prox = this.nos[i + 1];
    const ligado = prox && prox.unidade === n.unidade;
    this.desenhar(ligado ? i + 1 : null);
    const s = this.selo(n.x, n.y, '好', n.lado * 0.9, -0.14);
    if (reduzir()) { this.time.delayedCall(600, () => this.desenhar()); return; }
    s.setScale(2.2).setAlpha(0);
    this.tweens.add({
      targets: s, scale: 1, alpha: 0.92, duration: 380, ease: 'Expo.easeOut',
      onComplete: () => {
        this.tweens.add({ targets: s, alpha: 0, delay: 650, duration: 420, onComplete: () => s.destroy() });
        if (!ligado) { this.time.delayedCall(700, () => this.desenhar()); return; }
        const pts = curva(n, prox).getPoints(60);
        const g = this.add.graphics();
        this.tweens.addCounter({
          from: 1, to: pts.length, duration: 700, ease: 'Cubic.easeInOut',
          onUpdate: (tw) => {
            g.clear().lineStyle(3, this.c.tinta, 1);
            g.strokePoints(pts.slice(0, Math.max(2, Math.round(tw.getValue()))));
          },
          onComplete: () => { g.destroy(); this.desenhar(); },
        });
      },
    });
  }
}

/* ============================== LIÇÃO ============================== */
export class CenaLicao extends Phaser.Scene {
  constructor() { super('licao'); }

  create() {
    this.cam = prepararCamera(this);
    this.c = cores();
    this.camada = this.add.container(0, 0);
    this.efeitos = this.add.container(0, 0);
    this.ex = null;
    this.celulas = [];
    this.game.events.on('mostrar', (ex) => this.mostrar(ex));
    this.game.events.on('acerto', () => this.acerto());
    this.game.events.on('erro', (certo) => this.erro(certo));
    this.game.events.on('montagem', (hz, tons) => this.preencher(hz, tons));
    this.game.events.on('par', (n) => this.par(n));
    this.game.events.on('som', () => this.ondas());
    this.game.events.on('tema', () => { this.c = cores(); if (this.ex) this.mostrar(this.ex); });
    this.game.events.on('redimensionar', () => { if (this.ex) this.mostrar(this.ex, false); });
    this.game.cenaPronta = true;
    this.game.events.emit('cena-pronta');
  }

  get L() { return this.scale.width / this.game.dpr; }
  get A() { return this.scale.height / this.game.dpr; }

  limpar() {
    this.tweens.killAll();
    this.camada.removeAll(true);
    this.efeitos.removeAll(true);
    this.celulas = [];
    this.alvo = null;
    this.pauta = null;
    this.centroSom = null;
    this.selos = null;
  }

  texto(x, y, s, tam, cor, fam = FONTE_HZ, peso = '700') {
    return this.add.text(x, y, s, { fontFamily: fam, fontSize: `${Math.round(tam)}px`, fontStyle: peso, color: cor })
      .setOrigin(0.5).setResolution(this.game.dpr * 1.5);
  }

  // Fileira de grades com caracteres (ou vazias). Retorna a caixa ocupada.
  fileira(chars, cx, cy, ladoMax, vazias = false, tons = null) {
    const n = chars.length;
    const gap = 6;
    const lado = Math.min(ladoMax, (this.L - 32 - gap * (n - 1)) / n);
    const total = n * lado + (n - 1) * gap;
    let x = cx - total / 2;
    const g = this.add.graphics();
    this.camada.add(g);
    chars.forEach((ch, i) => {
      grade(g, x, cy - lado / 2, lado, this.c.tinta, this.c.fioForte);
      const cel = { x: x + lado / 2, y: cy, lado, txt: null };
      if (!vazias) {
        cel.txt = this.texto(cel.x, cy + lado * 0.02, ch, lado * 0.74, this.corTom(tons?.[i]));
        this.camada.add(cel.txt);
      }
      this.celulas.push(cel);
      x += lado + gap;
    });
    this.alvo = { x: cx - total / 2, y: cy - lado / 2, w: total, h: lado };
    return this.alvo;
  }

  corTom(t) { return t ? this.c.tom[t] : this.c.css.tinta; }

  // Pinta os caracteres já desenhados com a cor do tom (depois de responder).
  colorir(tons) {
    if (!tons) return;
    this.celulas.forEach((cel, i) => { if (cel.txt && tons[i]) cel.txt.setColor(this.corTom(tons[i])); });
  }

  // Ilustração colorida (Twemoji) sobre uma prancha de papel com fio fino.
  imagem(codigo, x, y, lado) {
    if (!codigo) return;
    const bruta = 'tw0-' + codigo;
    const chave = bruta;
    const ex = this.ex;
    const por = () => {
      if (this.ex !== ex) return;
      const pr = this.add.graphics();
      const m = lado * 0.12;
      pr.fillStyle(PAPEL_PRANCHA, 1).fillRect(x - lado / 2 - m, y - lado / 2 - m, lado + 2 * m, lado + 2 * m);
      pr.lineStyle(1, this.c.fioForte, 1).strokeRect(x - lado / 2 - m, y - lado / 2 - m, lado + 2 * m, lado + 2 * m);
      const im = this.add.image(x, y, chave).setDisplaySize(lado, lado);
      this.camada.add([pr, im]);
      if (!reduzir()) { pr.setAlpha(0); im.setAlpha(0); this.tweens.add({ targets: [pr, im], alpha: 1, duration: 220 }); }
    };
    if (this.textures.exists(chave) || this.textures.exists(bruta)) return por();
    this.load.svg(bruta, `https://cdn.jsdelivr.net/gh/jdecked/twemoji@15.1.0/assets/svg/${codigo}.svg`, { width: 256, height: 256 });
    this.load.once('complete', () => { if (this.textures.exists(bruta)) por(); });
    this.load.start();
  }


  async mostrar(ex, animar = true) {
    this.ex = ex;
    const textos = ex.palavra?.h || ex.frase?.t.map((t) => t[0]).join('') || (ex.palavras || []).map((p) => p.h).join('') || '';
    await garantirFonte(textos + '对好');
    if (this.ex !== ex) return;
    this.limpar();
    const L = this.L;
    const A = this.A;
    const cy = A / 2;
    const ladoMax = Math.min(A - 24, 170);
    const p = ex.palavra;
    const tonsPal = p ? tonsPorCaractere(p.h, p.p) : null;
    const tonsFrase = ex.frase ? ex.frase.t.flatMap(([h, py]) => tonsPorCaractere(h, py) || [...h].map(() => null)) : null;
    // No exercício de tom e no de pinyin a cor entregaria a resposta: só aparece depois de responder.
    this.tonsRevelar = (ex.tipo === 'tom' || ex.tipo === 'pinyin') ? tonsPal : null;
    this.tonsMontar = ex.tipo === 'montar' ? tonsFrase : null;
    const comImagem = (chars, img, tons) => {
      const n = [...chars].length;
      let lado = Math.min(ladoMax, (L * 0.62) / n);
      let imgLado = Math.min(lado * 0.9, 130);
      // a prancha tem margem de 12% em volta: tudo cabe na largura com 16px de folga
      const caber = Math.min(1, (L - 32) / (n * lado + (n - 1) * 6 + 28 + imgLado * 1.24));
      lado *= caber;
      imgLado *= caber;
      const larg = n * lado + (n - 1) * 6;
      const total = larg + 28 + imgLado;
      const x0 = L / 2 - total / 2;
      this.imagem(img, x0 + imgLado / 2, cy, imgLado);
      this.fileira([...chars], x0 + imgLado + 28 + larg / 2, cy, lado, false, tons);
    };
    switch (ex.tipo) {
      case 'novo':
        comImagem(p.h, p.img, tonsPal);
        break;
      case 'pinyin':
        comImagem(p.h, p.img, null);
        break;
      case 'escolha':
        if (ex.modo === 'ptHanzi') this.imagem(p.img, L / 2, cy, Math.min(A - 40, 150));
        else this.fileira([...p.h], L / 2, cy, ladoMax, false, tonsPal);
        break;
      case 'tom':
        this.tom(p);
        break;
      case 'ouvir':
        this.alto(L / 2, cy);
        break;
      case 'traduzir': {
        const chars = [...ex.frase.t.map((t) => t[0]).join('')];
        this.fileira(chars, L / 2, cy, 84, false, tonsFrase);
        break;
      }
      case 'montar': {
        const chars = [...ex.frase.t.map((t) => t[0]).join('')];
        this.fileira(chars, L / 2, cy, 84, true);
        break;
      }
      case 'pares': {
        const g = this.add.graphics();
        this.camada.add(g);
        const lado = Math.min(64, (L - 80) / 4);
        this.selos = [0, 1, 2, 3].map((k) => {
          const x = L / 2 + (k - 1.5) * (lado + 18);
          g.lineStyle(1.5, this.c.fioForte, 1);
          tracejar(g, [{ x: x - lado / 2, y: cy - lado / 2 }, { x: x + lado / 2, y: cy - lado / 2 }, { x: x + lado / 2, y: cy + lado / 2 }, { x: x - lado / 2, y: cy + lado / 2 }, { x: x - lado / 2, y: cy - lado / 2 }], 5, 5);
          return { x, y: cy, lado };
        });
        this.alvo = { x: L / 2 - 2 * (lado + 18), y: cy - lado / 2, w: 4 * (lado + 18), h: lado };
        break;
      }
      default:
        break;
    }
    if (animar && !reduzir()) {
      this.camada.setAlpha(0).setY(8);
      this.tweens.add({ targets: this.camada, alpha: 1, y: 0, duration: 320, ease: 'Expo.easeOut' });
    } else {
      this.camada.setAlpha(1).setY(0);
    }
  }

  // Pauta de 5 alturas (letras de tom de Chao) + grade com o caractere.
  tom(p) {
    const L = this.L;
    const A = this.A;
    const lado = Math.min(A - 40, 150);
    const pautaL = Math.min(170, L * 0.38);
    const total = lado + 36 + pautaL;
    const x0 = L / 2 - total / 2;
    this.fileira([p.h], x0 + lado / 2, A / 2, lado);
    const px = x0 + lado + 36;
    const top = A / 2 - lado / 2;
    const g = this.add.graphics();
    this.camada.add(g);
    g.lineStyle(1, this.c.fio, 1);
    for (let k = 0; k < 5; k++) g.lineBetween(px, top + (k * lado) / 4, px + pautaL, top + (k * lado) / 4);
    g.lineStyle(2, this.c.tinta, 1).lineBetween(px + pautaL, top, px + pautaL, top + lado);
    this.pauta = { x: px, y: top, w: pautaL, h: lado };
    this.alvo = { x: x0, y: top, w: total, h: lado };
  }

  contorno(tomN) {
    if (!this.pauta) return;
    const { x, y, w, h } = this.pauta;
    const nivel = (n) => y + ((5 - n) * h) / 4;
    const formas = { 1: [5, 5], 2: [3, 5], 3: [2, 1, 4], 4: [5, 1], 5: [3, 3] };
    const f = formas[tomN] || formas[5];
    const pts = f.map((n, k) => ({ x: x + 8 + ((w - 24) * k) / (f.length - 1), y: nivel(n) }));
    const curvaTom = new Phaser.Curves.Spline(pts.map((q) => new Phaser.Math.Vector2(q.x, q.y)));
    const todos = curvaTom.getPoints(40);
    const g = this.add.graphics();
    this.efeitos.add(g);
    const desenha = (k) => { g.clear().lineStyle(tomN === 5 ? 3 : 5, Phaser.Display.Color.HexStringToColor(this.c.tom[tomN] || this.c.css.carimbo).color, 1); g.strokePoints(todos.slice(0, Math.max(2, k))); };
    if (reduzir()) return desenha(todos.length);
    this.tweens.addCounter({ from: 2, to: todos.length, duration: 520, ease: 'Sine.easeInOut', onUpdate: (tw) => desenha(Math.round(tw.getValue())) });
  }

  alto(x, y) {
    const g = this.add.graphics();
    this.camada.add(g);
    g.fillStyle(this.c.tinta, 1);
    g.fillRect(x - 46, y - 14, 18, 28);
    g.fillTriangle(x - 28, y - 14, x - 6, y - 34, x - 6, y + 34);
    g.fillTriangle(x - 28, y - 14, x - 28, y + 14, x - 6, y + 34);
    g.lineStyle(3, this.c.tinta, 1);
    [22, 40, 58].forEach((r) => {
      g.beginPath();
      g.arc(x - 6, y, r, -0.7, 0.7);
      g.strokePath();
    });
    this.centroSom = { x: x - 6, y };
  }

  ondas() {
    if (!this.centroSom || reduzir()) return;
    for (let k = 0; k < 3; k++) {
      const g = this.add.graphics();
      this.efeitos.add(g);
      this.tweens.addCounter({
        from: 30, to: 110, delay: k * 160, duration: 700, ease: 'Sine.easeOut',
        onUpdate: (tw) => {
          const r = tw.getValue();
          g.clear().lineStyle(2, this.c.carimbo, 1 - (r - 30) / 80);
          g.beginPath(); g.arc(this.centroSom.x, this.centroSom.y, r, -0.7, 0.7); g.strokePath();
        },
        onComplete: () => g.destroy(),
      });
    }
  }

  preencher(hz, tons = null) {
    this.tonsMontagem = tons;
    const chars = [...hz];
    this.celulas.forEach((cel, k) => {
      const ch = chars[k];
      if (cel.txt && cel.txt.text === ch) return;
      if (cel.txt) { cel.txt.destroy(); cel.txt = null; }
      if (!ch) return;
      cel.txt = this.texto(cel.x, cel.y + cel.lado * 0.02, ch, cel.lado * 0.74, this.corTom(this.tonsMontagem?.[k]));
      this.camada.add(cel.txt);
      if (!reduzir()) { cel.txt.setScale(1.25).setAlpha(0); this.tweens.add({ targets: cel.txt, scale: 1, alpha: 1, duration: 200, ease: 'Quad.easeOut' }); }
    });
  }

  par(n) {
    const s = this.selos?.[n - 1];
    if (!s) return;
    this.carimbo(s.x, s.y, s.lado * 0.9, '对', -0.1);
  }

  carimbo(x, y, lado, letra, giro) {
    const g = this.add.graphics();
    g.lineStyle(Math.max(3, lado * 0.06), this.c.carimbo, 1).strokeRoundedRect(-lado / 2, -lado / 2, lado, lado, lado * 0.1);
    const t = this.texto(0, lado * 0.02, letra, lado * 0.66, this.c.css.carimbo, FONTE_HZ, '900');
    const ct = this.add.container(x, y, [g, t]).setRotation(giro);
    this.efeitos.add(ct);
    if (reduzir()) return ct;
    ct.setScale(2.1).setAlpha(0);
    this.tweens.add({ targets: ct, scale: 1, alpha: 1, duration: 340, ease: 'Expo.easeOut' });
    for (let k = 0; k < 7; k++) {
      const a = (Math.PI * 2 * k) / 7 + Math.random() * 0.5;
      const pingo = this.add.circle(x, y, 2 + Math.random() * 2.5, this.c.carimbo);
      this.efeitos.add(pingo);
      this.tweens.add({
        targets: pingo, x: x + Math.cos(a) * lado * 0.95, y: y + Math.sin(a) * lado * 0.95, alpha: 0,
        delay: 220, duration: 420, ease: 'Quad.easeOut',
      });
    }
    return ct;
  }

  acerto() {
    this.colorir(this.tonsRevelar);
    if (this.ex?.tipo === 'tom') this.contorno(this.ex.resposta);
    // O carimbo vai na maior margem livre, sem cobrir hanzi, imagem ou contorno do tom.
    const a = this.alvo || { x: this.L / 2 - 50, y: this.A / 2 - 50, w: 100, h: 100 };
    const base = Math.min(84, this.A * 0.42);
    const folga = 10;
    const margens = [
      { lado: 'dir', livre: this.L - (a.x + a.w) - folga * 2 },
      { lado: 'cima', livre: a.y - folga },
      { lado: 'esq', livre: a.x - folga * 2 },
    ].sort((m, n) => n.livre - m.livre);
    const m = margens[0];
    const lado = Math.max(30, Math.min(base, m.livre * 0.84));
    let x;
    let y;
    if (m.lado === 'dir') { x = a.x + a.w + folga + lado * 0.58; y = a.y + Math.min(a.h, lado) * 0.55; }
    else if (m.lado === 'esq') { x = a.x - folga - lado * 0.58; y = a.y + Math.min(a.h, lado) * 0.55; }
    else { x = a.x + a.w - lado * 0.55; y = a.y - folga / 2 - lado * 0.5; }
    this.carimbo(x, Math.max(lado * 0.6, y), lado, '对', -0.16);
  }

  erro() {
    this.colorir(this.tonsRevelar);
    if (this.ex?.tipo === 'tom') this.contorno(this.ex.resposta);
    const a = this.alvo;
    if (!a) return;
    const g = this.add.graphics();
    this.efeitos.add(g);
    const pts = [];
    const voltas = 5;
    for (let k = 0; k <= voltas * 2; k++) {
      pts.push({ x: a.x + (a.w * k) / (voltas * 2), y: a.y + a.h * (k % 2 ? 0.28 : 0.72) + (Math.random() - 0.5) * 8 });
    }
    const desenha = (n) => { g.clear().lineStyle(3, this.c.lapis, 0.85); g.strokePoints(pts.slice(0, Math.max(2, n))); };
    if (reduzir()) return desenha(pts.length);
    this.tweens.addCounter({ from: 2, to: pts.length, duration: 380, ease: 'Linear', onUpdate: (tw) => desenha(Math.round(tw.getValue())) });
  }
}
