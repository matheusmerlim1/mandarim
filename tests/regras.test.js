import test from 'node:test';
import assert from 'node:assert/strict';
import { UNIDADES, GUIA } from '../js/dados.js';
import * as R from '../js/regras.js';

test('pinyin: marcas, números e sem tom', () => {
  assert.equal(R.conferirPinyin('nǐ hǎo', 'nǐ hǎo'), 'certo');
  assert.equal(R.conferirPinyin('ni3 hao3', 'nǐ hǎo'), 'certo');
  assert.equal(R.conferirPinyin('ni3hao3', 'nǐ hǎo'), 'certo');
  assert.equal(R.conferirPinyin('ni hao', 'nǐ hǎo'), 'semTom');
  assert.equal(R.conferirPinyin('ni2 hao3', 'nǐ hǎo'), 'semTom');
  assert.equal(R.conferirPinyin('xie4xie5', 'xièxie'), 'certo');
  assert.equal(R.conferirPinyin('lv3you2', 'lǚyóu'), 'certo');
  assert.equal(R.conferirPinyin('lu:3you2', 'lǚyóu'), 'certo');
  assert.equal(R.conferirPinyin('NI HAO', 'nǐ hǎo'), 'semTom');
  assert.equal(R.conferirPinyin('zai jian', 'nǐ hǎo'), 'errado');
  assert.equal(R.conferirPinyin('', 'nǐ hǎo'), 'errado');
});

test('tom da sílaba', () => {
  assert.deepEqual(['mā', 'má', 'mǎ', 'mà', 'ma'].map(R.tomDaSilaba), [1, 2, 3, 4, 5]);
  assert.equal(R.tomDaSilaba('lǜ'), 4);
});

test('dados: pinyin com tom em toda palavra e frase', () => {
  for (const u of UNIDADES) {
    for (const [h, p, pt, img] of u.palavras) {
      assert.ok(h && p && pt && img, `${u.id}: ${h}`);
      assert.match(p, /^[a-zA-Zāáǎàēéěèīíǐìōóǒòūúǔùǖǘǚǜü' ]+$/, `${u.id}: ${p}`);
    }
    for (const f of u.frases) {
      assert.ok(f.t.length >= 2 && f.pt && f.fim, `${u.id}: ${f.pt}`);
      for (const [h, p] of f.t) assert.ok(h && p, f.pt);
    }
  }
  for (const linha of GUIA) assert.equal(linha.length, 4);
});

test('trilha: lições em ordem, ids únicos, só a primeira liberada', () => {
  const trilha = R.montarTrilha(UNIDADES);
  assert.equal(new Set(trilha.map((l) => l.id)).size, trilha.length);
  assert.ok(trilha.length >= 40, `${trilha.length} lições`);
  const prog = R.progressoNovo();
  assert.equal(R.estadoLicao(trilha, prog, 0), 'atual');
  assert.equal(R.estadoLicao(trilha, prog, 1), 'trancada');
  prog.feitas[trilha[0].id] = { vezes: 1 };
  assert.equal(R.estadoLicao(trilha, prog, 0), 'feita');
  assert.equal(R.estadoLicao(trilha, prog, 1), 'atual');
  // toda palavra aparece em alguma lição de palavras
  UNIDADES.forEach((u, ui) => {
    const cobertas = trilha.filter((l) => l.unidade === ui && l.tipo === 'palavras').flatMap((l) => l.palavras);
    assert.deepEqual(cobertas.sort((a, b) => a - b), u.palavras.map((_, i) => i));
  });
});

test('exercícios: toda lição gera exercícios válidos e a resposta certa confere', () => {
  const trilha = R.montarTrilha(UNIDADES);
  for (const temVoz of [true, false]) {
    for (const l of trilha) {
      const ex = R.gerarExercicios(l, UNIDADES, { semente: 42, temVoz });
      assert.ok(ex.length >= 5, `${l.id}: ${ex.length}`);
      for (const e of ex) {
        if (!temVoz) assert.ok(e.tipo !== 'ouvir' && !e.ouvindo, `${l.id} sem voz gerou ${e.tipo}`);
        if (e.opcoes) {
          const textos = e.opcoes.map((o) => o.pt + o.h);
          assert.equal(new Set(textos).size, textos.length, `${l.id}: opções repetidas`);
        }
        let resp;
        if (e.tipo === 'escolha' || e.tipo === 'ouvir') resp = e.opcoes.indexOf(e.palavra);
        if (e.tipo === 'traduzir') resp = e.opcoes.indexOf(e.frase);
        if (e.tipo === 'tom') resp = e.resposta;
        if (e.tipo === 'pinyin') resp = e.palavra.p;
        if (e.tipo === 'montar') resp = e.frase.t.map((t) => t[0]);
        assert.equal(R.conferir(e, resp).ok, true, `${l.id} ${e.tipo}`);
        if (e.tipo === 'escolha') assert.equal(R.conferir(e, (resp + 1) % e.opcoes.length).ok, false);
      }
    }
  }
});

test('mesma semente, mesma lição', () => {
  const l = R.montarTrilha(UNIDADES)[3];
  assert.deepEqual(R.gerarExercicios(l, UNIDADES, { semente: 7 }), R.gerarExercicios(l, UNIDADES, { semente: 7 }));
});

test('vidas voltam com o tempo e treino devolve vida', () => {
  const t0 = new Date(2026, 10, 16, 10, 0).getTime();
  let p = R.progressoNovo();
  p = R.perderVida(R.perderVida(p, t0), t0);
  assert.equal(p.vidas, 3);
  assert.equal(R.minutosParaVida(p, t0), 20);
  p = R.atualizarRelogio(p, t0 + 21 * 60000);
  assert.equal(p.vidas, 4);
  p = R.atualizarRelogio(p, t0 + 45 * 60000);
  assert.equal(p.vidas, 5);
  assert.equal(p.vidaDesde, null);
  p = R.perderVida(p, t0);
  const r = R.concluirLicao(p, 'x', { treino: true }, t0);
  assert.equal(r.progresso.vidas, 5);
  assert.equal(r.progresso.feitas.x, undefined);
});

test('XP e sequência de dias', () => {
  const dia = (d) => new Date(2026, 10, d, 12).getTime();
  let { progresso: p, ganho } = R.concluirLicao(R.progressoNovo(), 'a', { erros: 0 }, dia(10));
  assert.equal(ganho, 15);
  assert.equal(p.sequencia, 1);
  ({ progresso: p } = R.concluirLicao(p, 'b', { erros: 2 }, dia(10)));
  assert.equal(p.sequencia, 1);
  assert.equal(p.xpHoje, 25);
  ({ progresso: p } = R.concluirLicao(p, 'c', {}, dia(11)));
  assert.equal(p.sequencia, 2);
  assert.equal(p.xpHoje, 15);
  p = R.atualizarRelogio(p, dia(14));
  assert.equal(p.sequencia, 0);
  ({ progresso: p } = R.concluirLicao(p, 'd', {}, dia(14)));
  assert.equal(p.sequencia, 1);
  assert.equal(p.xp, 55);
});

test('progresso salvo estragado volta ao começo', () => {
  assert.deepEqual(R.lerProgresso('{lixo'), R.progressoNovo());
  assert.deepEqual(R.lerProgresso('{"versao":9}'), R.progressoNovo());
});

test('aplicar tom na sílaba', () => {
  assert.deepEqual([1, 2, 3, 4, 5].map((n) => R.aplicarTom('mā', n)), ['mā', 'má', 'mǎ', 'mà', 'ma']);
  assert.equal(R.aplicarTom('gou', 3), 'gǒu');
  assert.equal(R.aplicarTom('xiè', 1), 'xiē');
  assert.equal(R.aplicarTom('guì', 2), 'guí');
  assert.equal(R.aplicarTom('lǜ', 3), 'lǚ');
  assert.equal(R.aplicarTom('tāng', 4), 'tàng');
});
