// Som: arquivos MP3 em voz neural (audio/*.mp3, índice em audios.js) para cada palavra e frase;
// se faltar o arquivo ou ele não tocar, usa a voz chinesa do próprio navegador (Web Speech API).
import { AUDIOS } from './audios.js?v=2';

const PREFERIDAS = [/xiaoxiao/i, /yunxi/i, /google.*(普通话|mandarin|中文)/i, /huihui/i, /yaoyao/i, /kangkang/i, /ting-?ting/i, /li-?mu/i];
let voz = null;
let pronta = null;
let tocador = null;

const ehChines = (v) => /^(zh|cmn)[-_](cn|hans)/i.test(v.lang) || /^zh$/i.test(v.lang);
// mesma chave do script que gera o índice: o texto sem pontuação nem espaços
export const chaveAudio = (texto) => String(texto || '').replace(/[\s，。？！、,.?!；;：:“”"'·]/g, '');
export const temGravacao = (texto) => !!AUDIOS[chaveAudio(texto)];

function escolher() {
  const todas = window.speechSynthesis ? speechSynthesis.getVoices() : [];
  const zh = todas.filter(ehChines);
  for (const re of PREFERIDAS) {
    const v = zh.find((x) => re.test(x.name));
    if (v) return v;
  }
  return zh[0] || null;
}

// Espera as vozes carregarem (o Chrome entrega a lista depois). Resolve com true/false.
export function prepararVoz() {
  if (pronta) return pronta;
  pronta = new Promise((ok) => {
    if (!window.speechSynthesis) return ok(false);
    voz = escolher();
    if (voz) return ok(true);
    const fim = () => { voz = escolher(); ok(!!voz); };
    speechSynthesis.addEventListener('voiceschanged', fim, { once: true });
    setTimeout(fim, 2500);
  });
  return pronta;
}

export const temVoz = () => !!voz;
// Dá para ouvir este texto? (gravação ou voz do navegador)
export const podeOuvir = (texto) => temGravacao(texto) || temVoz();

function falarSintetizado(texto, devagar) {
  return new Promise((ok) => {
    if (!voz || !texto) return ok(false);
    speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(texto);
    u.voice = voz;
    u.lang = voz.lang;
    u.rate = devagar ? 0.55 : 0.9;
    u.onend = () => ok(true);
    u.onerror = () => ok(false);
    speechSynthesis.speak(u);
  });
}

export function falar(texto, { devagar = false } = {}) {
  const arq = AUDIOS[chaveAudio(texto)];
  if (!arq) return falarSintetizado(texto, devagar);
  return new Promise((ok) => {
    if (window.speechSynthesis) speechSynthesis.cancel();
    if (tocador) { tocador.pause(); tocador.onended = tocador.onerror = null; }
    tocador = new Audio(`audio/${arq}`);
    tocador.preservesPitch = true;
    tocador.playbackRate = devagar ? 0.7 : 1;
    tocador.onended = () => ok(true);
    tocador.onerror = () => falarSintetizado(texto, devagar).then(ok);
    tocador.play().catch(() => falarSintetizado(texto, devagar).then(ok));
  });
}

// Português (para o tradutor): qualquer voz pt.
export function falarPt(texto) {
  if (!window.speechSynthesis || !texto) return;
  const v = speechSynthesis.getVoices().find((x) => /^pt[-_]br/i.test(x.lang)) || speechSynthesis.getVoices().find((x) => /^pt/i.test(x.lang));
  speechSynthesis.cancel();
  const u = new SpeechSynthesisUtterance(texto);
  if (v) u.voice = v;
  u.lang = v ? v.lang : 'pt-BR';
  speechSynthesis.speak(u);
}
