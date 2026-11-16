// Tradução pelo MyMemory (grátis, sem chave) e pinyin pela biblioteca pinyin-pro.

const URL_API = 'https://api.mymemory.translated.net/get';

function decodificar(s) {
  const t = document.createElement('textarea');
  t.innerHTML = s;
  return t.value;
}

export async function traduzir(texto, de, para) {
  const ctrl = new AbortController();
  const tempo = setTimeout(() => ctrl.abort(), 15000);
  let r;
  try {
    r = await fetch(`${URL_API}?q=${encodeURIComponent(texto)}&langpair=${de}|${para}`, { signal: ctrl.signal });
  } catch (e) {
    throw new Error(e.name === 'AbortError'
      ? 'O serviço de tradução demorou demais para responder. Tente de novo em instantes.'
      : 'Sem conexão com o serviço de tradução. Confira a internet e tente de novo.');
  } finally {
    clearTimeout(tempo);
  }
  const j = await r.json().catch(() => null);
  if (!j) throw new Error('O serviço de tradução respondeu algo inesperado. Tente de novo.');
  if (j.quotaFinished || j.responseStatus === 429) {
    throw new Error('O limite diário gratuito de traduções desta conexão acabou. Volte amanhã — as lições e as frases continuam funcionando.');
  }
  if (j.responseStatus !== 200 && j.responseStatus !== '200') {
    throw new Error('O serviço de tradução recusou o pedido (' + (j.responseDetails || j.responseStatus) + ').');
  }
  return decodificar(j.responseData.translatedText || '').trim();
}

// Lista de { hz, py, zh } para mostrar o pinyin em cima de cada caractere.
export function pinyinPorCaractere(texto) {
  const lib = window.pinyinPro;
  if (!lib) return [...texto].map((c) => ({ hz: c, py: '', zh: false }));
  return lib.pinyin(texto, { type: 'all' }).map((x) => ({ hz: x.origin, py: x.isZh ? x.pinyin : '', zh: x.isZh }));
}

export function pinyinFrase(texto) {
  const lib = window.pinyinPro;
  if (!lib) return '';
  return lib.pinyin(texto, { nonZh: 'consecutive' });
}

export const temChines = (s) => /[\u3400-\u9fff]/.test(s);
