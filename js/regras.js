// Regras do curso, sem Phaser e sem DOM: trilha, exercícios, correção, vidas, XP e sequência.
// Roda no navegador e no Node (node --test tests/).

export const VIDAS_MAX = 5;
export const MINUTOS_POR_VIDA = 20;
export const META_DIARIA = 30;
export const XP_LICAO = 10;
export const XP_PERFEITA = 5;

// ---------- sorteio com semente (mesma semente = mesma lição, bom para teste) ----------
export function criarSorteio(semente = Date.now()) {
  let a = semente >>> 0;
  const rnd = () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  rnd.int = (n) => Math.floor(rnd() * n);
  rnd.embaralhar = (lista) => {
    const c = lista.slice();
    for (let i = c.length - 1; i > 0; i--) {
      const j = rnd.int(i + 1);
      [c[i], c[j]] = [c[j], c[i]];
    }
    return c;
  };
  rnd.um = (lista) => lista[rnd.int(lista.length)];
  return rnd;
}

// ---------- pinyin ----------
const MARCAS = {
  ā: ['a', 1], á: ['a', 2], ǎ: ['a', 3], à: ['a', 4],
  ē: ['e', 1], é: ['e', 2], ě: ['e', 3], è: ['e', 4],
  ī: ['i', 1], í: ['i', 2], ǐ: ['i', 3], ì: ['i', 4],
  ō: ['o', 1], ó: ['o', 2], ǒ: ['o', 3], ò: ['o', 4],
  ū: ['u', 1], ú: ['u', 2], ǔ: ['u', 3], ù: ['u', 4],
  ǖ: ['v', 1], ǘ: ['v', 2], ǚ: ['v', 3], ǜ: ['v', 4], ü: ['v', 0],
};

// Separa pinyin em letras sem tom e a sequência de tons (neutro não entra).
// Aceita marcas (nǐ hǎo) ou números (ni3 hao3; 5 e 0 = neutro).
export function assinaturaPinyin(texto) {
  const s = String(texto || '').toLowerCase().normalize('NFC').replace(/u:/g, 'v');
  let letras = '';
  const tons = [];
  for (const ch of s) {
    if (MARCAS[ch]) {
      const [base, tom] = MARCAS[ch];
      letras += base;
      if (tom) tons.push(tom);
    } else if (/[1-4]/.test(ch)) {
      tons.push(Number(ch));
    } else if (/[a-z]/.test(ch)) {
      letras += ch;
    }
  }
  return { letras, tons: tons.join('') };
}

// 'certo' | 'semTom' (letras certas, tons faltando ou trocados) | 'errado'
export function conferirPinyin(resposta, certo) {
  const r = assinaturaPinyin(resposta);
  const c = assinaturaPinyin(certo);
  if (!r.letras) return 'errado';
  if (r.letras !== c.letras) return 'errado';
  return r.tons === c.tons ? 'certo' : 'semTom';
}

// Tom de uma sílaba marcada: 1–4, ou 5 para o neutro.
export function tomDaSilaba(silaba) {
  for (const ch of String(silaba).normalize('NFC')) {
    if (MARCAS[ch] && MARCAS[ch][1]) return MARCAS[ch][1];
  }
  return 5;
}

export function semTom(texto) {
  return String(texto).normalize('NFD').replace(/[\u0300\u0301\u0304\u030c]/g, '').normalize('NFC');
}

// ---------- trilha ----------
export function montarTrilha(unidades) {
  const trilha = [];
  unidades.forEach((u, ui) => {
    const n = u.palavras.length;
    const grupos = [];
    for (let i = 0; i < n; i += 4) grupos.push([...Array(Math.min(4, n - i)).keys()].map((k) => i + k));
    if (grupos.length > 1 && grupos[grupos.length - 1].length < 2) {
      grupos[grupos.length - 2].push(...grupos.pop());
    }
    grupos.forEach((idx, gi) => {
      trilha.push({
        id: `${u.id}-p${gi + 1}`, unidade: ui, tipo: 'palavras', palavras: idx,
        titulo: idx.map((i) => u.palavras[i][2]).slice(0, 3).join(', '),
        glifo: u.palavras[idx[0]][0].slice(0, 1),
      });
    });
    if (u.id === 'tons') {
      trilha.push({ id: 'tons-treino', unidade: ui, tipo: 'tons', palavras: [], titulo: 'Treino de tons', glifo: '调' });
    }
    if (u.frases.length) {
      trilha.push({
        id: `${u.id}-frases`, unidade: ui, tipo: 'frases', palavras: [],
        titulo: 'Frases', glifo: u.frases[0].t[0][0].slice(0, 1),
      });
    }
    if (u.id !== 'tons') {
      trilha.push({
        id: `${u.id}-revisao`, unidade: ui, tipo: 'revisao', palavras: [],
        titulo: 'Revisão da unidade', glifo: u.hanzi.slice(0, 1),
      });
    }
  });
  return trilha;
}

export function indiceAtual(trilha, progresso) {
  const i = trilha.findIndex((l) => !progresso.feitas[l.id]);
  return i === -1 ? trilha.length : i;
}

export function estadoLicao(trilha, progresso, i) {
  if (progresso.feitas[trilha[i].id]) return 'feita';
  return i === indiceAtual(trilha, progresso) ? 'atual' : 'trancada';
}

// ---------- exercícios ----------
export const TREINO_TONS = [
  ['八', 'bā', 'oito'], ['拔', 'bá', 'arrancar'], ['把', 'bǎ', 'segurar'], ['爸', 'bà', 'papai'],
  ['衣', 'yī', 'roupa'], ['姨', 'yí', 'tia'], ['椅', 'yǐ', 'cadeira'], ['意', 'yì', 'ideia'],
  ['汤', 'tāng', 'sopa'], ['糖', 'táng', 'açúcar'], ['躺', 'tǎng', 'deitar'], ['烫', 'tàng', 'escaldante'],
];

const palavra = (u, i, ui) => ({ h: u.palavras[i][0], p: u.palavras[i][1], pt: u.palavras[i][2], img: u.palavras[i][3], u: ui, i });

function todasPalavras(unidades) {
  const r = [];
  unidades.forEach((u, ui) => u.palavras.forEach((_, i) => r.push(palavra(u, i, ui))));
  return r;
}

// Escolhe distratores: primeiro da mesma unidade, depois do resto; sem repetir o texto mostrado.
function distratores(certa, mesmas, todas, campo, qtd, rnd) {
  const visto = new Set([certa[campo]]);
  const out = [];
  for (const lista of [rnd.embaralhar(mesmas), rnd.embaralhar(todas)]) {
    for (const p of lista) {
      if (out.length >= qtd) break;
      if (visto.has(p[campo])) continue;
      visto.add(p[campo]);
      out.push(p);
    }
  }
  return out;
}

function opcoes(certa, mesmas, todas, campo, rnd, qtd = 3) {
  return rnd.embaralhar([certa, ...distratores(certa, mesmas, todas, campo, qtd, rnd)]);
}

function exercicioPalavra(tipo, p, mesmas, todas, rnd) {
  switch (tipo) {
    case 'hanziPt': return { tipo: 'escolha', modo: 'hanziPt', palavra: p, opcoes: opcoes(p, mesmas, todas, 'pt', rnd) };
    case 'ptHanzi': return { tipo: 'escolha', modo: 'ptHanzi', palavra: p, opcoes: opcoes(p, mesmas, todas, 'h', rnd) };
    case 'ouvir': return { tipo: 'ouvir', palavra: p, opcoes: opcoes(p, mesmas, todas, 'h', rnd) };
    case 'pinyin': return { tipo: 'pinyin', palavra: p };
    case 'tom': return { tipo: 'tom', palavra: p, resposta: tomDaSilaba(p.p) };
    default: throw new Error('tipo desconhecido ' + tipo);
  }
}

const ehUmaSilaba = (p) => [...p.h].length === 1 && !/\s/.test(p.p);

export function gerarExercicios(licao, unidades, { semente, temVoz = true } = {}) {
  const rnd = criarSorteio(semente);
  // temVoz: true/false, ou função (texto) => dá para ouvir esse texto (gravação ou voz do navegador)
  const ouve = (texto) => (typeof temVoz === 'function' ? temVoz(texto) : !!temVoz);
  const u = unidades[licao.unidade];
  const todas = todasPalavras(unidades);
  const daUnidade = u.palavras.map((_, i) => palavra(u, i, licao.unidade));
  const ex = [];
  const tiposExtra = (p) => {
    const t = ['ptHanzi', 'pinyin', 'hanziPt'];
    if (ouve(p.h)) t.push('ouvir', 'ouvir');
    if (ehUmaSilaba(p)) t.push('tom');
    return t;
  };

  if (licao.tipo === 'palavras') {
    const ps = licao.palavras.map((i) => daUnidade[i]);
    ps.forEach((p) => {
      ex.push({ tipo: 'novo', palavra: p });
      ex.push(exercicioPalavra(ouve(p.h) ? 'ouvir' : 'hanziPt', p, daUnidade, todas, rnd));
    });
    if (ps.length >= 3) ex.push({ tipo: 'pares', palavras: rnd.embaralhar(ps).slice(0, 4) });
    rnd.embaralhar(ps).forEach((p) => ex.push(exercicioPalavra(rnd.um(tiposExtra(p)), p, daUnidade, todas, rnd)));
    rnd.embaralhar(ps).slice(0, 2).forEach((p) => ex.push(exercicioPalavra('ptHanzi', p, daUnidade, todas, rnd)));
  } else if (licao.tipo === 'tons') {
    const treino = [
      ...u.palavras.map((_, i) => daUnidade[i]),
      ...TREINO_TONS.map(([h, p, pt]) => ({ h, p, pt, img: null, u: licao.unidade, i: -1 })),
    ];
    rnd.embaralhar(treino).slice(0, 10).forEach((p) => ex.push({ tipo: 'tom', palavra: p, resposta: tomDaSilaba(p.p) }));
  } else if (licao.tipo === 'frases') {
    u.frases.forEach((f) => {
      ex.push({ tipo: 'traduzir', frase: f, opcoes: rnd.embaralhar([f, ...distratoresFrase(f, unidades, rnd)]) });
      ex.push(montar(f, todas, rnd, false));
    });
    const audiveis = u.frases.filter((f) => ouve(textoFrase(f)));
    if (audiveis.length) ex.push(montar(rnd.um(audiveis), todas, rnd, true));
  } else if (licao.tipo === 'revisao') {
    rnd.embaralhar(daUnidade).slice(0, 7).forEach((p) => ex.push(exercicioPalavra(rnd.um(tiposExtra(p)), p, daUnidade, todas, rnd)));
    ex.push({ tipo: 'pares', palavras: rnd.embaralhar(daUnidade).slice(0, 4) });
    rnd.embaralhar(u.frases).slice(0, 2).forEach((f) => ex.push(montar(f, todas, rnd, false)));
  }
  return ex;
}

function distratoresFrase(f, unidades, rnd) {
  const todas = unidades.flatMap((u) => u.frases).filter((x) => x.pt !== f.pt);
  return rnd.embaralhar(todas).slice(0, 2);
}

function montar(frase, todas, rnd, ouvindo) {
  const usadas = new Set(frase.t.map((t) => t[0]));
  const extras = rnd.embaralhar(todas).filter((p) => !usadas.has(p.h)).slice(0, 2).map((p) => [p.h, p.p]);
  const pecas = rnd.embaralhar([...frase.t, ...extras]).map(([h, p], k) => ({ k, h, p }));
  return { tipo: 'montar', frase, pecas, ouvindo };
}

export const textoFrase = (f) => f.t.map((t) => t[0]).join('') + (f.fim || '');
export const pinyinFrase = (f) => {
  const s = f.t.map((t) => t[1]).join(' ');
  return s.charAt(0).toUpperCase() + s.slice(1) + ({ '？': '?', '！': '!', '。': '.' }[f.fim] || '');
};

// Confere a resposta de um exercício. resposta: índice (escolha/ouvir/traduzir), número (tom),
// texto (pinyin) ou lista de hanzi (montar). Retorna { ok, aviso? }.
export function conferir(ex, resposta) {
  switch (ex.tipo) {
    case 'escolha':
    case 'ouvir':
      return { ok: ex.opcoes[resposta] === ex.palavra };
    case 'traduzir':
      return { ok: ex.opcoes[resposta] === ex.frase };
    case 'tom':
      return { ok: Number(resposta) === ex.resposta };
    case 'pinyin': {
      const r = conferirPinyin(resposta, ex.palavra.p);
      if (r === 'semTom') return { ok: true, aviso: 'Quase perfeito: confira os tons.' };
      return { ok: r === 'certo' };
    }
    case 'montar':
      return { ok: resposta.join('') === ex.frase.t.map((t) => t[0]).join('') };
    case 'pares':
    case 'novo':
      return { ok: true };
    default:
      return { ok: false };
  }
}

// ---------- progresso ----------
export function progressoNovo() {
  return { versao: 1, feitas: {}, xp: 0, xpHoje: 0, dia: null, sequencia: 0, ultimoDia: null, vidas: VIDAS_MAX, vidaDesde: null };
}

export const diaDe = (data) => {
  const d = new Date(data);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

function diasEntre(a, b) {
  const [ya, ma, da] = a.split('-').map(Number);
  const [yb, mb, db] = b.split('-').map(Number);
  return Math.round((Date.UTC(yb, mb - 1, db) - Date.UTC(ya, ma - 1, da)) / 86400000);
}

// Ajusta o que depende do relógio: vidas que voltaram, XP do dia, sequência quebrada.
export function atualizarRelogio(prog, agora = Date.now()) {
  const p = { ...prog, feitas: { ...prog.feitas } };
  const hoje = diaDe(agora);
  if (p.dia !== hoje) { p.dia = hoje; p.xpHoje = 0; }
  if (p.ultimoDia && diasEntre(p.ultimoDia, hoje) > 1) p.sequencia = 0;
  if (p.vidas < VIDAS_MAX && p.vidaDesde) {
    const ganhas = Math.floor((agora - p.vidaDesde) / (MINUTOS_POR_VIDA * 60000));
    if (ganhas > 0) {
      p.vidas = Math.min(VIDAS_MAX, p.vidas + ganhas);
      p.vidaDesde = p.vidas >= VIDAS_MAX ? null : p.vidaDesde + ganhas * MINUTOS_POR_VIDA * 60000;
    }
  }
  if (p.vidas >= VIDAS_MAX) p.vidaDesde = null;
  return p;
}

export function perderVida(prog, agora = Date.now()) {
  const p = { ...prog };
  p.vidas = Math.max(0, p.vidas - 1);
  if (!p.vidaDesde) p.vidaDesde = agora;
  return p;
}

export function minutosParaVida(prog, agora = Date.now()) {
  if (prog.vidas >= VIDAS_MAX || !prog.vidaDesde) return 0;
  return Math.max(1, Math.ceil((prog.vidaDesde + MINUTOS_POR_VIDA * 60000 - agora) / 60000));
}

// Fecha uma lição. Treino de revisão devolve uma vida.
const ganharVida = (p) => {
  p.vidas = Math.min(VIDAS_MAX, p.vidas + 1);
  if (p.vidas >= VIDAS_MAX) p.vidaDesde = null;
};

// Soma pontos, mantém a sequência de dias e dá a vida da meta do dia (uma vez por dia).
function registrarEstudo(p, ganho, agora) {
  p.xp += ganho;
  p.xpHoje += ganho;
  const hoje = diaDe(agora);
  if (p.ultimoDia !== hoje) {
    p.sequencia = p.ultimoDia && diasEntre(p.ultimoDia, hoje) === 1 ? p.sequencia + 1 : 1;
    p.ultimoDia = hoje;
  }
  if (p.xpHoje >= META_DIARIA && p.bonusMeta !== hoje) {
    p.bonusMeta = hoje;
    ganharVida(p);
    return true;
  }
  return false;
}

export function concluirLicao(prog, licaoId, { erros = 0, treino = false } = {}, agora = Date.now()) {
  const p = atualizarRelogio(prog, agora);
  const ganho = XP_LICAO + (erros === 0 ? XP_PERFEITA : 0);
  const vidaMeta = registrarEstudo(p, ganho, agora);
  if (!treino) {
    const antes = p.feitas[licaoId];
    p.feitas[licaoId] = { vezes: (antes?.vezes || 0) + 1, perfeita: erros === 0 || !!antes?.perfeita };
  } else {
    ganharVida(p);
  }
  return { progresso: p, ganho, vidaMeta };
}

// ---------- vidas: timer e maneiras de ganhar ----------
export const XP_TREINO_VIDA = 5;
export const TREINOS_VIDA = {
  relampago: { titulo: 'Treino relâmpago', perguntas: 5, minimo: 4 },
  tons: { titulo: 'Desafio dos tons', perguntas: 6, minimo: 5 },
};

// Segundos até a próxima vida e até completar todas (0 quando já estão cheias).
export function segundosParaVida(prog, agora = Date.now()) {
  if (prog.vidas >= VIDAS_MAX || !prog.vidaDesde) return 0;
  return Math.max(0, Math.ceil((prog.vidaDesde + MINUTOS_POR_VIDA * 60000 - agora) / 1000));
}
export function segundosParaTodas(prog, agora = Date.now()) {
  if (prog.vidas >= VIDAS_MAX) return 0;
  return segundosParaVida(prog, agora) + (VIDAS_MAX - prog.vidas - 1) * MINUTOS_POR_VIDA * 60;
}
export function formatarTempo(seg) {
  const s = Math.max(0, Math.round(seg));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const ss = String(s % 60).padStart(2, '0');
  return h ? `${h}:${String(m).padStart(2, '0')}:${ss}` : `${m}:${ss}`;
}

// Palavras já estudadas (das lições de palavras concluídas); sem nenhuma, as primeiras do curso.
export function palavrasEstudadas(unidades, trilha, prog) {
  const out = [];
  for (const l of trilha) {
    if (l.tipo !== 'palavras' || !prog.feitas[l.id]) continue;
    l.palavras.forEach((i) => out.push(palavra(unidades[l.unidade], i, l.unidade)));
  }
  if (out.length >= 4) return out;
  const base = trilha.filter((l) => l.tipo === 'palavras').slice(0, 2);
  return base.flatMap((l) => l.palavras.map((i) => palavra(unidades[l.unidade], i, l.unidade)));
}

// Monta um treino que vale vida: 'relampago' (palavras estudadas) ou 'tons'.
export function gerarTreinoVida(modo, unidades, trilha, prog, { semente, temVoz = true } = {}) {
  const rnd = criarSorteio(semente);
  const ouve = (texto) => (typeof temVoz === 'function' ? temVoz(texto) : !!temVoz);
  const cfg = TREINOS_VIDA[modo];
  const estudadas = palavrasEstudadas(unidades, trilha, prog);
  const todas = todasPalavras(unidades);
  const licao = { id: `vida-${modo}`, tipo: 'treino-vida', modo, unidade: estudadas[0]?.u ?? 0, titulo: cfg.titulo, palavras: [] };
  let ex;
  if (modo === 'tons') {
    const pool = [
      ...estudadas.filter(ehUmaSilaba),
      ...TREINO_TONS.map(([h, p, pt]) => ({ h, p, pt, img: null, u: 0, i: -1 })),
    ];
    const vistos = new Set();
    ex = rnd.embaralhar(pool).filter((p) => !vistos.has(p.h) && vistos.add(p.h)).slice(0, cfg.perguntas)
      .map((p) => ({ tipo: 'tom', palavra: p, resposta: tomDaSilaba(p.p) }));
  } else {
    const tipos = ['hanziPt', 'ptHanzi', 'ouvir', 'pinyin', 'ptHanzi'];
    ex = rnd.embaralhar(estudadas).slice(0, cfg.perguntas).map((p, k) => {
      let t = tipos[k % tipos.length];
      if (t === 'ouvir' && !ouve(p.h)) t = 'hanziPt';
      return exercicioPalavra(t, p, estudadas, todas, rnd);
    });
  }
  return { licao, exercicios: ex, minimo: Math.min(cfg.minimo, ex.length) };
}

// Fecha um treino que vale vida: com o mínimo de acertos de primeira, +1 vida.
export function concluirTreinoVida(prog, { acertos, total, minimo }, agora = Date.now()) {
  const p = atualizarRelogio(prog, agora);
  const passou = acertos >= minimo;
  const cheias = p.vidas >= VIDAS_MAX;
  const vidaMeta = registrarEstudo(p, XP_TREINO_VIDA, agora);
  if (passou && !cheias) ganharVida(p);
  return { progresso: p, ganho: XP_TREINO_VIDA, passou, ganhouVida: passou && !cheias, vidaMeta, total };
}

export function lerProgresso(texto) {
  try {
    const p = JSON.parse(texto);
    if (!p || p.versao !== 1 || typeof p.feitas !== 'object') return progressoNovo();
    return { ...progressoNovo(), ...p };
  } catch {
    return progressoNovo();
  }
}

// Põe o tom n (1–4; 5 = neutro) numa sílaba: a/e levam a marca; em "ou", o o; senão a última vogal.
const TABELA_TOM = { a: 'āáǎà', e: 'ēéěè', i: 'īíǐì', o: 'ōóǒò', u: 'ūúǔù', ü: 'ǖǘǚǜ' };
export function aplicarTom(silaba, n) {
  const s = semTom(silaba);
  if (n < 1 || n > 4) return s;
  let pos = s.search(/[ae]/i);
  if (pos === -1) pos = s.indexOf('ou');
  if (pos === -1) {
    for (let k = s.length - 1; k >= 0; k--) if (TABELA_TOM[s[k].toLowerCase()]) { pos = k; break; }
  }
  if (pos === -1) return s;
  const v = s[pos].toLowerCase();
  const marcada = TABELA_TOM[v][n - 1];
  return s.slice(0, pos) + (s[pos] === v ? marcada : marcada.toUpperCase()) + s.slice(pos + 1);
}

// Separa pinyin em sílabas (com o texto original de cada uma): "xièxie" → ["xiè", "xie"].
const VOG = 'aeiouüvāáǎàēéěèīíǐìōóǒòūúǔùǖǘǚǜ';
const RE_SILABA = new RegExp(
  `(?:zh|ch|sh|[bpmfdtnlgkhjqxrzcsyw])?[${VOG}]+(?:ng(?![${VOG}])|n(?![${VOG}g])|r(?![${VOG}]))?`, 'giu');
export function silabas(pinyin) {
  return String(pinyin).normalize('NFC').match(RE_SILABA) || [];
}
export const tonsDe = (pinyin) => silabas(pinyin).map(tomDaSilaba);

// Tom de cada caractere chinês do texto (pontuação e letras ficam null).
// O 儿 do erhua (nǎr) não tem sílaba própria: herda o tom da anterior.
// Retorna null se o pinyin não casar com os caracteres.
export function tonsPorCaractere(hanzi, pinyin) {
  const tons = tonsDe(pinyin);
  const chars = [...hanzi];
  const ehHz = (c) => /[\u3400-\u9fff]/.test(c);
  const total = chars.filter(ehHz).length;
  let erhua = total - tons.length;
  if (erhua < 0) return null;
  const out = [];
  let k = 0;
  for (let i = 0; i < chars.length; i++) {
    const c = chars[i];
    if (!ehHz(c)) { out.push(null); continue; }
    if (c === '儿' && erhua > 0 && k > 0) { out.push(tons[k - 1]); erhua--; continue; }
    if (k >= tons.length) return null;
    out.push(tons[k++]);
  }
  return erhua === 0 && k === tons.length ? out : null;
}
