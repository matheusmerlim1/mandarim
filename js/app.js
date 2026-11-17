import { UNIDADES, NIVEIS, GUIA } from './dados.js?v=3';
import * as R from './regras.js?v=3';
import { prepararVoz, podeOuvir, falar, falarPt } from './voz.js?v=3';
import { traduzir, pinyinPorCaractere, pinyinFrase as pinyinTexto, temChines } from './tradutor.js?v=3';
import { criarJogo, CenaTrilha, CenaLicao } from './cenas.js?v=3';

const $ = (s, el = document) => el.querySelector(s);
const CHAVE = 'mandarim.v1';
const NUM_HZ = ['一', '二', '三', '四', '五', '六', '七', '八', '九', '十', '十一', '十二', '十三', '十四', '十五'];
const TIPO_NOME = { palavras: 'Palavras novas', frases: 'Frases', revisao: 'Revisão', tons: 'Treino de tons' };
const TOM_NOME = { 1: '1º tom — alto e reto', 2: '2º tom — sobe', 3: '3º tom — desce e sobe', 4: '4º tom — cai', 5: 'Neutro — curto e leve' };
const TOM_CURVA = { 1: 'M4 6 H50', 2: 'M4 18 L50 4', 3: 'M4 12 Q20 26 30 22 T50 6', 4: 'M4 4 L50 22', 5: 'M22 14 H32' };

const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
// Caracteres e pinyin pintados com a cor do tom (classes t1…t5).
const hzc = (h, p) => {
  const tons = p ? R.tonsPorCaractere(h, p) : null;
  if (!tons) return esc(h);
  return [...h].map((c, i) => (tons[i] ? `<span class="t${tons[i]}">${esc(c)}</span>` : esc(c))).join('');
};
const pyc = (p) => {
  const s = String(p).normalize('NFC');
  let out = '';
  let pos = 0;
  for (const sil of R.silabas(s)) {
    const i = s.indexOf(sil, pos);
    out += esc(s.slice(pos, i)) + `<span class="t${R.tomDaSilaba(sil)}">${esc(sil)}</span>`;
    pos = i + sil.length;
  }
  return out + esc(s.slice(pos));
};
const hz = (s, p) => `<span lang="zh-CN">${hzc(s, p)}</span>`;
const hzFrase = (f) => `<span lang="zh-CN">${f.t.map(([h, py]) => hzc(h, py)).join('')}${esc(f.fim || '')}</span>`;
// Cor de cada unidade (abas e verbetes), como os cortes coloridos de um dicionário.
const CORES_UNIDADE = ['#a3262a', '#b0531a', '#86680f', '#2f7a45', '#14707a', '#1f5c9e', '#5a3f9e', '#8e2f73'];
const corUnidade = (ui) => CORES_UNIDADE[ui % CORES_UNIDADE.length];
const imgUrl = (c) => `https://cdn.jsdelivr.net/gh/jdecked/twemoji@15.1.0/assets/svg/${c}.svg`;

// ---------- progresso salvo ----------
function carregar() {
  try { return R.atualizarRelogio(R.lerProgresso(localStorage.getItem(CHAVE))); } catch { return R.progressoNovo(); }
}
function salvar() {
  try { localStorage.setItem(CHAVE, JSON.stringify(prog)); } catch { /* sem armazenamento: segue na memória */ }
}

let prog = carregar();
const trilha = R.montarTrilha(UNIDADES);
let jogoTrilha = null;
let jogoLicao = null;

// ---------- placar ----------
function placar() {
  $('#p-seq').textContent = prog.sequencia;
  $('#p-xp').textContent = `${Math.min(prog.xpHoje, 999)}/${R.META_DIARIA}`;
  $('#p-vidas').textContent = prog.vidas;
  $('#l-vidas').textContent = prog.vidas;
  atualizarTimer();
}

// Relógio das vidas: cabeçalho, faixa da trilha, barra da lição e página Vidas.
function atualizarTimer() {
  const cheias = prog.vidas >= R.VIDAS_MAX;
  const prox = R.formatarTempo(R.segundosParaVida(prog));
  $('#p-timer').textContent = cheias ? '' : prox;
  $('#l-timer').textContent = cheias ? '' : `+1 em ${prox}`;
  const faixa = $('#faixa-vidas');
  faixa.hidden = cheias;
  if (!cheias) {
    faixa.innerHTML = `<span>Vidas: ${prog.vidas} de ${R.VIDAS_MAX}. A próxima volta em <strong>${prox}</strong>.</span> <a href="#vidas">Ganhar vidas agora</a>`;
  }
  if (!$('#vista-vidas').hidden) desenharVidas();
}

let avisoVidas = '';
function desenharVidas() {
  $('#vidas-coracoes').innerHTML = Array.from({ length: R.VIDAS_MAX }, (_, k) =>
    `<svg class="${k < prog.vidas ? 'cheio' : 'vazio'}"><use href="#i-coracao"/></svg>`).join('');
  const cheias = prog.vidas >= R.VIDAS_MAX;
  const todas = R.segundosParaTodas(prog);
  $('#vidas-estado').innerHTML = (avisoVidas ? `<strong>${esc(avisoVidas)}</strong> ` : '') + (cheias
    ? `Suas ${R.VIDAS_MAX} vidas estão cheias. Os treinos abaixo continuam valendo pontos.`
    : `Você tem ${prog.vidas} de ${R.VIDAS_MAX} vidas. A próxima volta em <strong>${R.formatarTempo(R.segundosParaVida(prog))}</strong>${
      prog.vidas < R.VIDAS_MAX - 1 ? `; todas em <strong>${R.formatarTempo(todas)}</strong>` : ''}. Uma vida volta a cada ${R.MINUTOS_POR_VIDA} minutos.`);
  const hoje = R.diaDe(Date.now());
  $('#vidas-meta').textContent = prog.bonusMeta === hoje
    ? 'Você já ganhou a vida da meta hoje. Amanhã tem outra.'
    : `Chegue a ${R.META_DIARIA} pontos hoje e ganhe uma vida (uma vez por dia). Faltam ${Math.max(0, R.META_DIARIA - prog.xpHoje)} pontos.`;
}

// ---------- trilha ----------
function rotuloLicao(l) {
  const u = UNIDADES[l.unidade];
  const n = trilha.filter((x) => x.unidade === l.unidade).indexOf(l) + 1;
  return { u, n };
}

function subtitulo(l) {
  const u = UNIDADES[l.unidade];
  if (l.tipo === 'palavras') return `${l.palavras.length} palavras novas`;
  if (l.tipo === 'frases') return `${u.frases.length} frases para montar`;
  if (l.tipo === 'tons') return 'mā · má · mǎ · mà';
  return `Todas as palavras de ${u.titulo.toLowerCase()}`;
}

function desenharTrilha() {
  const caixa = $('#trilha');
  const largura = caixa.clientWidth || 600;
  const amp = Math.min(120, largura * 0.2);
  let html = '';
  let nivelAntes = null;
  let k = 0;
  UNIDADES.forEach((u, ui) => {
    const nivel = NIVEIS.find((n) => n.id === u.nivel);
    if (nivel.id !== nivelAntes) nivelAntes = nivel.id;
    html += `<section class="unidade" id="u-${u.id}" aria-labelledby="h-${u.id}" style="--u:${corUnidade(ui)}">
      <header class="verbete">
        <span class="verbete-hz" lang="zh-CN">${esc(u.hanzi)}</span>
        <h2 id="h-${u.id}">${esc(u.titulo)}</h2>
        <p class="verbete-py"><span lang="zh-Latn-pinyin">${pyc(u.pinyin)}</span><b>${nivel.hsk}</b></p>
        <p class="verbete-dica">${esc(u.dica)}</p>
      </header><ol class="licoes">`;
    trilha.forEach((l, i) => {
      if (l.unidade !== ui) return;
      const est = R.estadoLicao(trilha, prog, i);
      const x = Math.round(Math.sin(k * 0.95) * amp);
      k++;
      const n = trilha.filter((y) => y.unidade === ui).indexOf(l) + 1;
      const estTxt = { feita: 'concluída', atual: 'próxima lição', trancada: 'bloqueada' }[est];
      const titulo = l.tipo === 'palavras' ? l.titulo : TIPO_NOME[l.tipo];
      html += `<li><div class="passo${x > 0 ? ' lado-esq' : ''}" style="--x:${x}px">
        <button class="no no-${est}" type="button" data-i="${i}" ${est === 'trancada' ? 'disabled' : ''}
          aria-label="${esc(`Lição ${n}: ${titulo}, ${estTxt}`)}">
          <span lang="zh-CN" aria-hidden="true">${esc(l.glifo)}</span>
          ${est === 'trancada' ? '<svg class="cadeado" aria-hidden="true"><use href="#i-cadeado"/></svg>' : ''}
        </button>
        <span class="rotulo" aria-hidden="true"><strong>${esc(titulo)}</strong>
          <span${est === 'atual' ? ' class="comecar"' : ''}>${est === 'atual' ? 'Começar agora' : `${subtitulo(l)}${est === 'feita' ? ' · praticar de novo' : ''}`}</span></span>
      </div></li>`;
    });
    html += '</ol></section>';
  });
  html += '<p class="fim-trilha">Fim do HSK 3 neste dicionário — mais unidades em breve.</p>';
  caixa.innerHTML = html;

  $('#dedeiras').innerHTML = UNIDADES.map((u, ui) =>
    `<a href="#u-${u.id}" data-u="${u.id}" style="--u:${corUnidade(ui)}"><span lang="zh-CN">${NUM_HZ[ui]}</span><span class="sr"> — unidade ${ui + 1}: ${esc(u.titulo)}</span></a>`).join('');

  const atual = R.indiceAtual(trilha, prog);
  const b = $('#b-continuar');
  if (atual >= trilha.length) {
    b.textContent = 'Revisar';
    $('#continuar-rotulo').textContent = 'Você terminou a trilha. Pratique qualquer lição.';
  } else {
    const { u, n } = rotuloLicao(trilha[atual]);
    b.textContent = Object.keys(prog.feitas).length ? 'Continuar' : 'Começar';
    $('#continuar-rotulo').textContent = `${u.titulo} — lição ${n}`;
  }
  placar();
  enviarNos();
  observarUnidades();
}

function enviarNos() {
  if (!jogoTrilha?.cenaPronta) return;
  const nos = [...document.querySelectorAll('#trilha .no')].map((b) => {
    const r = b.getBoundingClientRect();
    const i = Number(b.dataset.i);
    return {
      x: r.left + r.width / 2 + window.scrollX, y: r.top + r.height / 2 + window.scrollY, lado: r.width,
      estado: R.estadoLicao(trilha, prog, i), unidade: trilha[i].unidade, cor: corUnidade(trilha[i].unidade), perfeita: !!prog.feitas[trilha[i].id]?.perfeita,
    };
  });
  jogoTrilha.events.emit('nos', nos);
}

let observador = null;
function observarUnidades() {
  observador?.disconnect();
  observador = new IntersectionObserver((itens) => {
    for (const it of itens) {
      if (!it.isIntersecting) continue;
      document.querySelectorAll('#dedeiras a').forEach((a) => a.removeAttribute('aria-current'));
      $(`#dedeiras a[data-u="${it.target.id.slice(2)}"]`)?.setAttribute('aria-current', 'true');
    }
  }, { rootMargin: '-35% 0px -60% 0px' });
  document.querySelectorAll('.unidade').forEach((s) => observador.observe(s));
}

function iniciarJogoTrilha() {
  if (jogoTrilha || !window.Phaser) return;
  jogoTrilha = criarJogo($('#palco-trilha'), CenaTrilha);
  jogoTrilha.events.once('cena-pronta', enviarNos);
}

// ---------- vistas ----------
const VISTAS = ['trilha', 'frases', 'tradutor', 'vidas', 'licao', 'fim'];
function mostrarVista(nome, { focar = true } = {}) {
  VISTAS.forEach((v) => { $(`#vista-${v}`).hidden = v !== nome; });
  document.body.classList.toggle('em-licao', nome === 'licao');
  document.querySelectorAll('.abas a').forEach((a) => {
    if (a.dataset.aba === nome) a.setAttribute('aria-current', 'page'); else a.removeAttribute('aria-current');
  });
  if (jogoTrilha) { if (nome === 'trilha') jogoTrilha.loop.wake(); else jogoTrilha.loop.sleep(); }
  if (nome === 'trilha') requestAnimationFrame(enviarNos);
  if (nome === 'vidas') desenharVidas();
  if (nome === 'frases' || nome === 'tradutor' || nome === 'vidas' || nome === 'fim') window.scrollTo(0, 0);
  if (focar && (nome === 'frases' || nome === 'tradutor' || nome === 'vidas')) $(`#vista-${nome} h1`).focus?.();
}

function rota() {
  const h = location.hash.slice(1);
  if (h === 'vidas') {
    if (!$('#vista-licao').hidden) return;
    L = null;
    return mostrarVista('vidas');
  }
  avisoVidas = '';
  if (h === 'frases' || h === 'tradutor') return mostrarVista(h);
  if (!$('#vista-licao').hidden || !$('#vista-fim').hidden) return;
  mostrarVista('trilha', { focar: false });
  if (h.startsWith('u-')) document.getElementById(h)?.scrollIntoView();
}

// ---------- lição ----------
let L = null; // estado da lição em andamento

function iniciarLicao(i) {
  const licao = trilha[i];
  const treino = !!prog.feitas[licao.id];
  prog = R.atualizarRelogio(prog);
  if (prog.vidas <= 0 && !treino) {
    avisoVidas = 'Suas vidas acabaram.';
    location.hash = '#vidas';
    return;
  }
  const fila = R.gerarExercicios(licao, UNIDADES, { semente: Date.now(), temVoz: podeOuvir });
  comecar({ i, licao, treino, fila });
}

function iniciarTreinoVida(modo) {
  const t = R.gerarTreinoVida(modo, UNIDADES, trilha, prog, { semente: Date.now(), temVoz: podeOuvir });
  comecar({ i: null, licao: t.licao, treino: true, fila: t.exercicios, vidaTreino: { minimo: t.minimo } });
}

function comecar({ i, licao, treino, fila, vidaTreino = null }) {
  const total = fila.filter((e) => e.tipo !== 'novo').length;
  L = { i, licao, treino, vidaTreino, fila, pos: 0, erros: 0, errosPrimeira: 0, totalInicial: fila.length, total, resposta: null, conferido: false, refeitos: new Set() };
  mostrarVista('licao');
  window.scrollTo(0, 0);
  if (!jogoLicao && window.Phaser) {
    jogoLicao = criarJogo($('#palco-licao'), CenaLicao);
    jogoLicao.events.once('cena-pronta', mostrarExercicio);
  } else {
    mostrarExercicio();
  }
}

function botaoSom(texto, rotulo = 'Ouvir', grande = false) {
  if (!podeOuvir(texto)) return '';
  return `<button type="button" class="botao-som${grande ? ' grande' : ''}" data-falar="${esc(texto)}"><svg aria-hidden="true"><use href="#i-som"/></svg>${rotulo}</button>
    <button type="button" class="botao-som" data-falar="${esc(texto)}" data-devagar="1"><svg aria-hidden="true"><use href="#i-tartaruga"/></svg>Devagar</button>`;
}

const mostraPinyinNasOpcoes = () => UNIDADES[L.licao.unidade].nivel === 'hsk1';

function mostrarExercicio() {
  const ex = L.fila[L.pos];
  L.resposta = null;
  L.conferido = false;
  const feitos = L.fila.slice(0, L.pos).filter((e) => e.tipo !== 'novo').length;
  const pct = Math.round((Math.min(feitos, L.total) / Math.max(1, L.total)) * 100);
  $('#regua-tinta').style.width = pct + '%';
  $('.regua').setAttribute('aria-valuenow', pct);
  const rod = $('#rodape-licao');
  rod.className = 'rodape-licao';
  $('#retorno').innerHTML = '';
  const bv = $('#b-verificar');
  bv.textContent = 'Verificar';
  bv.disabled = true;

  const area = $('#area');
  const palco = $('#palco-licao');
  const p = ex.palavra;
  let titulo = '';
  let html = '';
  let rotuloPalco = '';
  let falarAoAbrir = null;

  switch (ex.tipo) {
    case 'novo':
      titulo = `Palavra nova: ${hz(p.h, p.p)}`;
      rotuloPalco = `Ilustração de “${p.pt}” e o caractere ${p.h} na grade de caligrafia`;
      html = `<div class="cartao-novo">
        <span class="py" lang="zh-Latn-pinyin">${pyc(p.p)}</span>
        <span class="pt">${esc(p.pt)}</span>
        ${[...p.h].length === 1 && p.p.indexOf(' ') < 0 ? `<span class="tons">${TOM_NOME[R.tomDaSilaba(p.p)]}</span>` : ''}
      </div><div class="linha-som">${botaoSom(p.h)}</div>`;
      bv.textContent = 'Continuar';
      bv.disabled = false;
      L.conferido = true;
      falarAoAbrir = p.h;
      break;
    case 'escolha':
      if (ex.modo === 'hanziPt') {
        titulo = `O que significa <span class="sr">${hz(p.h)}</span><span aria-hidden="true">isto</span>?`;
        rotuloPalco = `O caractere ${p.h} na grade de caligrafia`;
        html = `<div class="linha-som">${botaoSom(p.h)}</div>` + opcoesHtml(ex.opcoes.map((o) => `<span>${esc(o.pt)}</span>`));
        falarAoAbrir = p.h;
      } else {
        titulo = `Como se escreve <span class="pt-alvo">“${esc(p.pt)}”</span>?`;
        rotuloPalco = `Ilustração de “${p.pt}”`;
        const py = mostraPinyinNasOpcoes();
        html = opcoesHtml(ex.opcoes.map((o) => `<span><span class="hz" lang="zh-CN">${hzc(o.h, o.p)}</span>${py ? `<span class="py-mini">${pyc(o.p)}</span>` : ''}</span>`), ex.opcoes.map((o) => o.h));
      }
      break;
    case 'ouvir':
      titulo = 'Ouça e escolha o que foi dito';
      rotuloPalco = 'Alto-falante';
      html = `<div class="linha-som">${botaoSom(p.h, 'Ouvir de novo', true)}</div>` + opcoesHtml(ex.opcoes.map((o) => `<span class="hz" lang="zh-CN">${hzc(o.h, o.p)}</span>`), ex.opcoes.map((o) => o.h));
      falarAoAbrir = p.h;
      break;
    case 'pinyin':
      titulo = `Escreva o pinyin de ${hz(p.h)} <span class="pt-alvo">(${esc(p.pt)})</span>`;
      rotuloPalco = `Ilustração de “${p.pt}” e o caractere ${p.h}`;
      html = `<div class="linha-som">${botaoSom(p.h)}</div><label class="sr" for="campo-py">Pinyin</label>
        <input id="campo-py" class="campo-pinyin" type="text" autocomplete="off" autocapitalize="off" spellcheck="false" lang="zh-Latn-pinyin" aria-describedby="dica-py">
        <p id="dica-py" class="dica-campo">Tons com acento (nǐ hǎo) ou com número (ni3 hao3). Sem tom também vale, com aviso.</p>
        <div class="teclas-tom" aria-label="Inserir vogal com tom">${['ā', 'á', 'ǎ', 'à', 'ē', 'é', 'ě', 'è', 'ī', 'í', 'ǐ', 'ì', 'ō', 'ó', 'ǒ', 'ò', 'ū', 'ú', 'ǔ', 'ù', 'ǚ', 'ǜ'].map((v) => `<button type="button" data-inserir="${v}" aria-label="Inserir ${v}">${v}</button>`).join('')}</div>`;
      break;
    case 'tom': {
      titulo = `Qual é o tom de ${hz(p.h)}?`;
      rotuloPalco = `O caractere ${p.h} e uma pauta de alturas da voz`;
      html = `<div class="linha-som">${botaoSom(p.h)}</div><div class="opcoes opcoes-tons">` + [1, 2, 3, 4, 5].map((n, k) =>
        `<button type="button" class="opcao" data-op="${k}" aria-pressed="false">
          <span class="n" aria-hidden="true">${k + 1}</span>
          <svg class="curva" viewBox="0 0 54 26" aria-hidden="true"><path d="${TOM_CURVA[n]}"/></svg>
          <span lang="zh-Latn-pinyin">${esc(R.aplicarTom(p.p, n))}</span>
          <span class="py-mini">${TOM_NOME[n]}</span></button>`).join('') + '</div>';
      ex.valores = [1, 2, 3, 4, 5];
      falarAoAbrir = p.h;
      break;
    }
    case 'pares': {
      titulo = 'Ligue cada caractere ao seu significado';
      rotuloPalco = 'Quatro selos vazios, um para cada par';
      const esq = R.criarSorteio(Date.now()).embaralhar(ex.palavras);
      const dir = R.criarSorteio(Date.now() + 1).embaralhar(ex.palavras);
      html = `<div class="pares"><div class="coluna" role="group" aria-label="Caracteres">${esq.map((w) =>
        `<button type="button" class="opcao" data-par="${esc(w.h)}" data-lado="hz" aria-pressed="false"><span class="hz" lang="zh-CN">${hzc(w.h, w.p)}</span></button>`).join('')}</div>
        <div class="coluna" role="group" aria-label="Significados">${dir.map((w) =>
        `<button type="button" class="opcao" data-par="${esc(w.h)}" data-lado="pt" aria-pressed="false">${esc(w.pt)}</button>`).join('')}</div></div>`;
      L.pares = { sel: null, feitos: 0 };
      break;
    }
    case 'montar': {
      const f = ex.frase;
      titulo = ex.ouvindo ? 'Ouça e monte a frase' : `Monte em chinês: <span class="pt-alvo">“${esc(f.pt)}”</span>`;
      rotuloPalco = `Grade vazia com ${[...f.t.map((t) => t[0]).join('')].length} quadros para a frase`;
      html = (ex.ouvindo ? `<div class="linha-som">${botaoSom(R.textoFrase(f), 'Ouvir de novo', true)}</div>` : '') +
        `<div class="montagem" id="montagem" aria-label="Sua resposta" role="group"></div>
        <p class="dica-montar">Toque nas peças na ordem certa. Toque de novo numa peça escolhida para tirá-la.</p>
        <div class="banco" role="group" aria-label="Peças">${ex.pecas.map((pc) =>
        `<button type="button" class="peca" data-k="${pc.k}"><span class="hz" lang="zh-CN">${hzc(pc.h, pc.p)}</span><span class="py-mini">${pyc(pc.p)}</span></button>`).join('')}</div>`;
      L.montagem = [];
      if (ex.ouvindo) falarAoAbrir = R.textoFrase(f);
      break;
    }
    case 'traduzir': {
      const f = ex.frase;
      titulo = `O que quer dizer <span class="sr">${hz(R.textoFrase(f))}</span><span aria-hidden="true">esta frase</span>?`;
      rotuloPalco = `A frase ${R.textoFrase(f)} na grade de caligrafia`;
      html = `<div class="linha-som">${botaoSom(R.textoFrase(f))}</div>` + opcoesHtml(ex.opcoes.map((o) => `<span>${esc(o.pt)}</span>`));
      falarAoAbrir = R.textoFrase(f);
      break;
    }
    default:
      break;
  }

  $('#enunciado').innerHTML = titulo;
  area.innerHTML = html;
  palco.setAttribute('aria-label', rotuloPalco);
  jogoLicao?.events.emit('mostrar', ex);
  $('#enunciado').focus({ preventScroll: true });
  if (falarAoAbrir) setTimeout(() => { falar(falarAoAbrir); jogoLicao?.events.emit('som'); }, 350);
  if (ex.tipo === 'pinyin') setTimeout(() => $('#campo-py')?.focus(), 50);
}

function opcoesHtml(conteudos, falas = []) {
  return `<div class="opcoes" role="group" aria-label="Opções">${conteudos.map((c, k) =>
    `<button type="button" class="opcao" data-op="${k}" aria-pressed="false"${falas[k] ? ` data-som="${esc(falas[k])}"` : ''}><span class="n" aria-hidden="true">${k + 1}</span>${c}</button>`).join('')}</div>`;
}

function escolherOpcao(k) {
  if (L.conferido) return;
  const botoes = [...document.querySelectorAll('#area .opcoes .opcao')];
  if (!botoes[k]) return;
  botoes.forEach((b, j) => b.setAttribute('aria-pressed', String(j === k)));
  L.resposta = k;
  $('#b-verificar').disabled = false;
  const som = botoes[k].dataset.som;
  if (som) falar(som);
}

function respostaAtual(ex) {
  if (ex.tipo === 'pinyin') return $('#campo-py')?.value || '';
  if (ex.tipo === 'tom') return ex.valores[L.resposta];
  if (ex.tipo === 'montar') return L.montagem.map((k) => ex.pecas.find((p) => p.k === k).h);
  return L.resposta;
}

function respostaCertaHtml(ex) {
  const p = ex.palavra;
  switch (ex.tipo) {
    case 'escolha':
    case 'ouvir':
    case 'pinyin':
      return `${hz(p.h, p.p)} · <span lang="zh-Latn-pinyin">${pyc(p.p)}</span> · ${esc(p.pt)}`;
    case 'tom':
      return `${hz(p.h, p.p)} · <span lang="zh-Latn-pinyin">${pyc(p.p)}</span> — ${TOM_NOME[ex.resposta]}${p.pt ? ` · ${esc(p.pt)}` : ''}`;
    case 'montar':
    case 'traduzir':
      return `${hzFrase(ex.frase)} · <span lang="zh-Latn-pinyin">${pyc(R.pinyinFrase(ex.frase))}</span> · ${esc(ex.frase.pt)}`;
    default:
      return '';
  }
}

function verificar() {
  const ex = L.fila[L.pos];
  if (L.conferido) return continuar();
  const r = R.conferir(ex, respostaAtual(ex));
  L.conferido = true;
  const rod = $('#rodape-licao');
  const bv = $('#b-verificar');
  document.querySelectorAll('#area .opcao, #area .peca, #area input, #area .teclas-tom button').forEach((b) => { b.disabled = true; });
  if (['escolha', 'ouvir', 'traduzir', 'tom'].includes(ex.tipo)) {
    const botoes = [...document.querySelectorAll('#area .opcoes .opcao')];
    const certo = ex.tipo === 'tom' ? ex.valores.indexOf(ex.resposta)
      : ex.tipo === 'traduzir' ? ex.opcoes.indexOf(ex.frase) : ex.opcoes.indexOf(ex.palavra);
    botoes[certo]?.classList.add('certa');
    if (!r.ok) botoes[L.resposta]?.classList.add('errada');
  }
  if (r.ok) {
    rod.classList.add('ok');
    $('#retorno').innerHTML = `<strong>${r.aviso ? 'Quase perfeito!' : ['Correto!', 'Muito bem!', 'Isso mesmo!', '很好！ Muito bom!'][Math.floor(Math.random() * 4)]}</strong>
      <p>${r.aviso ? esc(r.aviso) + ' ' : ''}${respostaCertaHtml(ex)}</p>`;
    jogoLicao?.events.emit('acerto');
  } else {
    L.erros++;
    if (L.pos < L.totalInicial) L.errosPrimeira++;
    rod.classList.add('erro');
    $('#retorno').innerHTML = `<strong>Resposta certa:</strong><p>${respostaCertaHtml(ex)}</p>`;
    jogoLicao?.events.emit('erro');
    if (!L.treino) { prog = R.perderVida(prog); salvar(); placar(); }
    if (!L.refeitos.has(L.pos)) { L.refeitos.add(L.fila.length); L.fila.push({ ...ex }); L.total++; }
  }
  const fala = ex.palavra?.h || (ex.frase ? R.textoFrase(ex.frase) : null);
  if (fala && ex.tipo !== 'ouvir') falar(fala);
  bv.textContent = 'Continuar';
  bv.disabled = false;
  bv.focus({ preventScroll: true });
  mostrarAcimaDoRodape(document.querySelector('#area .opcao.certa, #area .opcao[aria-pressed="true"], #montagem, #campo-py'));
}

// Garante que a resposta fique visível acima da barra fixa de retorno.
function mostrarAcimaDoRodape(el) {
  if (!el) return;
  requestAnimationFrame(() => {
    const topoRodape = $('#rodape-licao').getBoundingClientRect().top;
    const r = el.getBoundingClientRect();
    if (r.bottom > topoRodape - 12) window.scrollBy({ top: r.bottom - topoRodape + 24, behavior: 'smooth' });
  });
}

function continuar() {
  if (!L.treino && prog.vidas <= 0) return terminar(false);
  L.pos++;
  if (L.pos >= L.fila.length) return terminar(true);
  mostrarExercicio();
}

function terminar(ok) {
  const primeiraVez = !L.treino;
  $('#b-fim-vidas').hidden = true;
  if (ok && L.vidaTreino) {
    const total = L.fila.slice(0, L.totalInicial).filter((e) => e.tipo !== 'novo').length;
    const acertos = total - L.errosPrimeira;
    const r = R.concluirTreinoVida(prog, { acertos, total, minimo: L.vidaTreino.minimo });
    prog = r.progresso;
    salvar();
    $('#fim-titulo').textContent = r.ganhouVida ? 'Você ganhou uma vida!' : r.passou ? 'Treino concluído' : 'Quase lá';
    $('.fim-selo').textContent = r.ganhouVida ? '命' : '好';
    $('.fim-selo').classList.remove('duplo');
    $('#fim-texto').textContent = (r.ganhouVida
      ? `Acertou ${acertos} de ${total} de primeira. Agora você tem ${prog.vidas} vidas.`
      : r.passou ? `Acertou ${acertos} de ${total}. Suas vidas já estavam cheias, então valeu pontos.`
        : `Acertou ${acertos} de ${total} de primeira; precisa de ${L.vidaTreino.minimo} para ganhar a vida. Tente de novo.`)
      + (r.vidaMeta ? ' A meta do dia também deu uma vida.' : '');
    $('#fim-xp').textContent = `+${r.ganho}`;
    $('#b-fim-vidas').hidden = r.ganhouVida;
    $('#b-fim-vidas').textContent = 'Tentar outro treino';
    $('#fim-acertos').textContent = Math.round((acertos / Math.max(1, total)) * 100) + '%';
    $('#fim-seq').textContent = `${prog.sequencia} ${prog.sequencia === 1 ? 'dia' : 'dias'}`;
    L.final = { ok, carimbar: null, vidas: true };
    placar();
    mostrarVista('fim');
    $('#fim-titulo').focus();
    return;
  }
  if (ok) {
    const { progresso, ganho, vidaMeta } = R.concluirLicao(prog, L.licao.id, { erros: L.erros, treino: L.treino });
    prog = progresso;
    salvar();
    $('#fim-titulo').textContent = L.erros === 0 ? 'Lição perfeita!' : 'Lição concluída';
    $('.fim-selo').textContent = L.erros === 0 ? '优' : '好';
    $('.fim-selo').classList.remove('duplo');
    $('#fim-texto').textContent = L.treino
      ? 'Treino feito: você ganhou uma vida de volta.'
      : vidaMeta ? 'Meta do dia cumprida: você ganhou uma vida extra!'
        : prog.xpHoje >= R.META_DIARIA ? 'Meta do dia cumprida. Volte amanhã para manter a sequência.' : `Faltam ${R.META_DIARIA - prog.xpHoje} pontos para a meta de hoje (ela vale uma vida).`;
    $('#fim-xp').textContent = `+${ganho}`;
  } else {
    $('#fim-titulo').textContent = 'Acabaram as vidas';
    $('.fim-selo').textContent = '加油';
    $('.fim-selo').classList.add('duplo');
    $('#fim-texto').textContent = `A próxima vida volta em ${R.formatarTempo(R.segundosParaVida(prog))}. Ou ganhe uma agora com um treino rápido. 加油 (jiāyóu) = força!`;
    $('#fim-xp').textContent = '+0';
    $('#b-fim-vidas').hidden = false;
    $('#b-fim-vidas').textContent = 'Ganhar vidas';
  }
  const pct = Math.round((Math.max(0, L.total - L.erros) / Math.max(1, L.total)) * 100);
  $('#fim-acertos').textContent = pct + '%';
  $('#fim-seq').textContent = `${prog.sequencia} ${prog.sequencia === 1 ? 'dia' : 'dias'}`;
  L.final = { ok, carimbar: ok && primeiraVez ? L.i : null };
  placar();
  mostrarVista('fim');
  $('#fim-titulo').focus();
}

function voltarTrilha() {
  const carimbar = L?.final?.carimbar;
  L = null;
  location.hash = '#trilha';
  mostrarVista('trilha', { focar: false });
  desenharTrilha();
  if (carimbar != null) {
    const no = $(`#trilha .no[data-i="${carimbar}"]`);
    no?.scrollIntoView({ block: 'center' });
    setTimeout(() => {
      enviarNos();
      jogoTrilha?.events.emit('carimbar', carimbar);
      $(`#trilha .no[data-i="${carimbar + 1}"]`)?.focus({ preventScroll: true });
    }, 120);
  } else {
    $('#b-continuar').focus({ preventScroll: true });
  }
}

// ---------- montar frase / pares ----------
function cliqueMontar(btn) {
  const ex = L.fila[L.pos];
  const k = Number(btn.dataset.k);
  if (btn.closest('#montagem')) {
    L.montagem = L.montagem.filter((x) => x !== k);
    btn.remove();
    const orig = $(`.banco .peca[data-k="${k}"]`);
    orig.disabled = false;
    orig.focus();
  } else {
    L.montagem.push(k);
    btn.disabled = true;
    const pc = ex.pecas.find((p) => p.k === k);
    $('#montagem').insertAdjacentHTML('beforeend', `<button type="button" class="peca" data-k="${k}" aria-label="Tirar ${esc(pc.h)}"><span class="hz" lang="zh-CN">${hzc(pc.h, pc.p)}</span><span class="py-mini">${pyc(pc.p)}</span></button>`);
    falar(pc.h);
    const prox = $('.banco .peca:not(:disabled)');
    (prox || $('#b-verificar')).focus();
  }
  $('#b-verificar').disabled = L.montagem.length === 0;
  const escolhidas = L.montagem.map((x) => ex.pecas.find((p) => p.k === x));
  jogoLicao?.events.emit('montagem', escolhidas.map((p) => p.h).join(''),
    escolhidas.flatMap((p) => R.tonsPorCaractere(p.h, p.p) || [...p.h].map(() => null)));
}

function cliquePar(btn) {
  if (L.conferido) return;
  const sel = L.pares.sel;
  if (!sel || sel.dataset.lado === btn.dataset.lado) {
    if (sel) sel.setAttribute('aria-pressed', 'false');
    btn.setAttribute('aria-pressed', 'true');
    L.pares.sel = btn;
    if (btn.dataset.lado === 'hz') falar(btn.dataset.par);
    return;
  }
  if (sel.dataset.par === btn.dataset.par) {
    [sel, btn].forEach((b) => { b.classList.add('casada'); b.disabled = true; b.setAttribute('aria-pressed', 'false'); });
    L.pares.feitos++;
    jogoLicao?.events.emit('par', L.pares.feitos);
    $('#retorno').textContent = `Par certo: ${sel.dataset.par}.`;
    if (L.pares.feitos >= document.querySelectorAll('#area .pares .coluna:first-child .opcao').length) {
      L.conferido = true;
      $('#rodape-licao').classList.add('ok');
      $('#retorno').innerHTML = '<strong>Todos os pares certos!</strong>';
      const bv = $('#b-verificar');
      bv.textContent = 'Continuar';
      bv.disabled = false;
      bv.focus();
    } else {
      $('#area .pares .opcao:not(:disabled)')?.focus();
    }
  } else {
    L.erros++;
    [sel, btn].forEach((b) => { b.classList.add('errada'); b.setAttribute('aria-pressed', 'false'); });
    $('#retorno').textContent = 'Esse par não combina. Tente de novo.';
    setTimeout(() => [sel, btn].forEach((b) => b.classList.remove('errada')), 600);
  }
  L.pares.sel = null;
}

// ---------- frases ----------
let filtro = 'Todas';
function desenharFrases() {
  const cats = ['Todas', ...new Set(GUIA.map((g) => g[0]))];
  $('#filtros').innerHTML = cats.map((c) => `<button type="button" data-cat="${esc(c)}" aria-pressed="${c === filtro}">${esc(c)}</button>`).join('');
  $('#lista-frases').innerHTML = GUIA.filter((g) => filtro === 'Todas' || g[0] === filtro).map(([cat, h, p, pt]) => `<li>
    <span class="hz" lang="zh-CN">${hzc(h, p)}</span>
    <span class="py" lang="zh-Latn-pinyin">${pyc(p)}</span>
    <span class="pt">${esc(pt)}</span>
    <span class="cat">${esc(cat)}</span>
    ${podeOuvir(h) ? `<span class="sons"><button type="button" class="botao-icone" data-falar="${esc(h)}" aria-label="Ouvir: ${esc(pt)}"><svg aria-hidden="true"><use href="#i-som"/></svg></button>
    <button type="button" class="botao-icone" data-falar="${esc(h)}" data-devagar="1" aria-label="Ouvir devagar: ${esc(pt)}"><svg aria-hidden="true"><use href="#i-tartaruga"/></svg></button></span>` : ''}
  </li>`).join('');
}

// ---------- tradutor ----------
let direcao = 'pt';
function atualizarDirecao() {
  $('#trad-de').textContent = direcao === 'pt' ? 'Português' : 'Chinês';
  $('#trad-para').textContent = direcao === 'pt' ? 'Chinês' : 'Português';
  $('#trad-texto').placeholder = direcao === 'pt' ? 'Escreva em português. Ex.: Onde fica a estação de metrô?' : '用中文写。Ex.: 你好，我叫小明。';
  $('#trad-texto').lang = direcao === 'pt' ? 'pt-BR' : 'zh-CN';
}

const PONTUACAO = { '，': ',', '。': '.', '？': '?', '！': '!', '：': ':', '；': ';', '、': ',' };
function limparPinyin(s) {
  return s.replace(/[，。？！：；、]/g, (c) => PONTUACAO[c]).replace(/\s+([,.?!:;])/g, '$1').replace(/\s{2,}/g, ' ').trim();
}

function rubyHtml(texto) {
  return `<ul class="ruby-linha" aria-hidden="true">${pinyinPorCaractere(texto).filter((x) => x.hz.trim()).map((x) =>
    `<li${x.py ? ` class="t${R.tomDaSilaba(x.py)}"` : ''}><span class="py-mini">${esc(x.py || ' ')}</span><span class="hz">${esc(x.hz)}</span></li>`).join('')}</ul>`;
}

async function enviarTraducao(e) {
  e.preventDefault();
  const texto = $('#trad-texto').value.trim();
  const saida = $('#trad-saida');
  if (!texto) { saida.innerHTML = '<p class="erro-msg">Escreva um texto para traduzir.</p>'; $('#trad-texto').focus(); return; }
  let nota = '';
  if (direcao === 'pt' && temChines(texto) && !/[a-zà-ú]{3}/i.test(texto)) { direcao = 'zh'; atualizarDirecao(); nota = 'O texto estava em chinês: invertemos para chinês → português.'; }
  const de = direcao === 'pt' ? 'pt-BR' : 'zh-CN';
  const para = direcao === 'pt' ? 'zh-CN' : 'pt-BR';
  saida.innerHTML = '<p>Traduzindo…</p>';
  try {
    const t = await traduzir(texto, de, para);
    const zh = direcao === 'pt' ? t : texto;
    const pt = direcao === 'pt' ? texto : t;
    saida.innerHTML = `<div class="trad-resultado">
      ${nota ? `<p class="nota">${esc(nota)}</p>` : ''}
      ${direcao === 'pt'
        ? `<p class="hz-grande" lang="zh-CN">${esc(zh)}</p>`
        : `<p class="pt-grande">${esc(pt)}</p><p class="hz-grande" lang="zh-CN">${esc(zh)}</p>`}
      <p class="py-linha" lang="zh-Latn-pinyin">${pyc(limparPinyin(pinyinTexto(zh)))}</p>
      ${rubyHtml(zh)}
      <div class="trad-botoes">${botaoSom(zh, 'Ouvir em chinês')}
        ${direcao === 'zh' ? '<button type="button" class="botao-som" data-falar-pt="1"><svg aria-hidden="true"><use href="#i-som"/></svg>Ouvir em português</button>' : ''}
        <button type="button" class="botao-som" data-copiar="${esc(t)}"><svg aria-hidden="true"><use href="#i-copiar"/></svg>Copiar tradução</button></div>
    </div>`;
    saida.dataset.pt = pt;
  } catch (err) {
    saida.innerHTML = `<p class="erro-msg">${esc(err.message)}</p>`;
  }
}

// ---------- eventos ----------
document.addEventListener('click', (e) => {
  const t = e.target.closest('button, a');
  if (!t) return;
  if (t.dataset.falar) { falar(t.dataset.falar, { devagar: !!t.dataset.devagar }); jogoLicao?.events.emit('som'); return; }
  if (t.dataset.falarPt) return falarPt($('#trad-saida').dataset.pt);
  if (t.dataset.copiar) {
    navigator.clipboard?.writeText(t.dataset.copiar).then(() => { t.lastChild.textContent = 'Copiado'; setTimeout(() => { t.lastChild.textContent = 'Copiar tradução'; }, 1600); });
    return;
  }
  if (t.dataset.inserir) {
    const c = $('#campo-py');
    const [a, b] = [c.selectionStart ?? c.value.length, c.selectionEnd ?? c.value.length];
    c.value = c.value.slice(0, a) + t.dataset.inserir + c.value.slice(b);
    c.focus();
    c.setSelectionRange(a + 1, a + 1);
    $('#b-verificar').disabled = !c.value.trim();
    return;
  }
  if (t.classList.contains('no')) return iniciarLicao(Number(t.dataset.i));
  if (t.dataset.treinoVida) return iniciarTreinoVida(t.dataset.treinoVida);
  if (t.dataset.cat) { filtro = t.dataset.cat; desenharFrases(); $(`#filtros [data-cat="${CSS.escape(filtro)}"]`).focus(); return; }
  if (t.closest('#area')) {
    if (t.classList.contains('peca')) return cliqueMontar(t);
    if (t.dataset.par) return cliquePar(t);
    if (t.dataset.op != null) return escolherOpcao(Number(t.dataset.op));
  }
});

$('#b-verificar').addEventListener('click', verificar);
$('#b-sair').addEventListener('click', () => { if (L) L.final = null; voltarTrilha(); });
$('#b-fim').addEventListener('click', () => {
  if (L?.final?.vidas) { L = null; location.hash = '#vidas'; if ($('#vista-vidas').hidden) mostrarVista('vidas'); return; }
  voltarTrilha();
});
$('#b-fim-vidas').addEventListener('click', () => { L = null; });
$('#b-continuar').addEventListener('click', () => {
  const i = R.indiceAtual(trilha, prog);
  iniciarLicao(i >= trilha.length ? Math.floor(Math.random() * trilha.length) : i);
});
$('#area').addEventListener('input', (e) => {
  if (e.target.id === 'campo-py') $('#b-verificar').disabled = !e.target.value.trim();
});
$('#f-trad').addEventListener('submit', enviarTraducao);
$('#trad-texto').addEventListener('input', (e) => { $('#trad-conta').textContent = `${e.target.value.length}/450`; });
$('#b-inverter').addEventListener('click', () => { direcao = direcao === 'pt' ? 'zh' : 'pt'; atualizarDirecao(); });

document.addEventListener('keydown', (e) => {
  if ($('#vista-licao').hidden || !L || e.ctrlKey || e.metaKey || e.altKey) return;
  const noCampo = e.target.matches('input, textarea');
  if (e.key === 'Enter' && (noCampo || !e.target.closest('button'))) {
    e.preventDefault();
    if (!$('#b-verificar').disabled) verificar();
    return;
  }
  if (noCampo) return;
  const n = Number(e.key);
  if (n >= 1 && n <= 9) {
    const ex = L.fila[L.pos];
    if (['escolha', 'ouvir', 'traduzir', 'tom'].includes(ex.tipo)) { e.preventDefault(); escolherOpcao(n - 1); }
  }
});

window.addEventListener('hashchange', rota);
let tRes = null;
window.addEventListener('resize', () => {
  clearTimeout(tRes);
  tRes = setTimeout(() => { if (!$('#vista-trilha').hidden) desenharTrilha(); }, 150);
});
window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => {
  jogoTrilha?.events.emit('tema');
  jogoLicao?.events.emit('tema');
});
// relógio das vidas: a cada segundo; quando uma vida volta, salva
setInterval(() => {
  const antes = prog.vidas;
  prog = R.atualizarRelogio(prog);
  if (prog.vidas !== antes) { salvar(); placar(); } else atualizarTimer();
}, 1000);

// ---------- início ----------
desenharTrilha();
desenharFrases();
atualizarDirecao();
rota();
iniciarJogoTrilha();
// Quem já começou abre o dicionário no verbete atual.
if (!location.hash && Object.keys(prog.feitas).length) {
  try { history.scrollRestoration = 'manual'; } catch { /* navegador antigo */ }
  const irAoAtual = () => $('#trilha .no-atual')?.scrollIntoView({ block: 'center' });
  requestAnimationFrame(irAoAtual);
  // as fontes mudam a altura das unidades: reposiciona quando terminarem de carregar
  document.fonts?.ready.then(() => { if (window.scrollY < 200) irAoAtual(); setTimeout(enviarNos, 50); });
}
document.fonts?.ready.then(() => { if (!$('#vista-trilha').hidden) enviarNos(); });
// Palavras e frases do curso tocam pelos arquivos de áudio; a voz do navegador só é
// necessária no tradutor (texto livre).
prepararVoz().then(() => desenharFrases());

// Gancho para os testes de navegador (só leitura).
window.mandarim = { licao: () => L, progresso: () => prog };
