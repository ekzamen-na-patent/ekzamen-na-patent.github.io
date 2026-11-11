// Интерактив страниц с тестами: выбор ответа, проверка слова, перевод, озвучка аудирования.
(() => {
  'use strict';
  const KEY = 'pe-site-tr';
  const body = document.body;
  const norm = s => String(s || '').toLowerCase().replace(/ё/g, 'е').replace(/[^a-zа-я0-9\s-]/g, ' ').replace(/\s+/g, ' ').trim();
  let right = 0, done = 0;
  const total = document.querySelectorAll('.qi').length;
  const scoreEl = document.getElementById('score');
  const L = { ok: body.dataset.ok || 'Правильно!', bad: body.dataset.bad || 'Неправильно', ans: body.dataset.ans || 'Правильный ответ' };

  function setTr(v) {
    body.dataset.tr = v;
    document.querySelectorAll('[data-settr]').forEach(b => b.classList.toggle('on', b.dataset.settr === v));
    try { localStorage.setItem(KEY, v); } catch (e) { /* storage off */ }
  }
  let saved = ''; try { saved = localStorage.getItem(KEY) || ''; } catch (e) { /* */ }
  setTr(saved);

  function result(qi, ok, rightText) {
    qi.dataset.done = '1'; done++; if (ok) right++;
    const ex = qi.querySelector('.ex');
    ex.classList.add(ok ? 'ok' : 'bad');
    ex.insertAdjacentHTML('afterbegin', `<div class="h">${ok ? '✓ ' + L.ok : '✗ ' + L.bad}</div>${ok ? '' : `<p>${L.ans}: <b></b></p>`}`);
    if (!ok) ex.querySelector('b').textContent = rightText;
    ex.hidden = false;
    if (scoreEl) scoreEl.textContent = `${right} / ${done}` + (done === total ? ' ✓' : '');
  }

  document.addEventListener('click', e => {
    const t = e.target.closest('[data-settr]');
    if (t) { setTr(t.dataset.settr); return; }

    const o = e.target.closest('.o');
    if (o) {
      const qi = o.closest('.qi'); if (qi.dataset.done) return;
      const okBtn = qi.querySelector('.o[data-ok]');
      qi.querySelectorAll('.o').forEach(b => b.classList.add(b === okBtn ? 'ok' : b === o ? 'bad' : 'dim'));
      result(qi, o === okBtn, okBtn.dataset.label || okBtn.firstChild.textContent);
      return;
    }

    const c = e.target.closest('.chk');
    if (c) {
      const qi = c.closest('.qi'); if (qi.dataset.done) return;
      const inp = qi.querySelector('.inp'); if (!inp.value.trim()) { inp.focus(); return; }
      const ans = JSON.parse(inp.dataset.ans);
      inp.disabled = true; c.disabled = true;
      result(qi, ans.some(a => norm(a) === norm(inp.value)), ans[0]);
      return;
    }

    const s = e.target.closest('.show');
    if (s) { const sc = s.parentNode.querySelector('.script'); sc.hidden = !sc.hidden; return; }

    const p = e.target.closest('.play');
    if (p) { speak(p); }
  });
  document.addEventListener('keydown', e => {
    if (e.key === 'Enter' && e.target.classList.contains('inp')) e.target.closest('.qi').querySelector('.chk').click();
  });

  // Озвучка: голос браузера (на Android — Google, на iPhone — Milena, на Windows — Irina).
  let playing = null;
  function stop() { if ('speechSynthesis' in window) speechSynthesis.cancel(); if (playing) { playing.classList.remove('on'); playing.textContent = '▶'; } playing = null; }
  function speak(btn) {
    if (playing === btn) { stop(); return; }
    stop();
    if (!('speechSynthesis' in window)) { btn.closest('.q').querySelector('.script').hidden = false; return; }
    const lines = JSON.parse(btn.dataset.lines), dialog = btn.dataset.dialog === '1';
    const voice = speechSynthesis.getVoices().find(v => /^ru/i.test(v.lang));
    if (!voice) btn.closest('.q').querySelector('.novoice').hidden = false;
    playing = btn; btn.classList.add('on'); btn.textContent = '■';
    let i = 0;
    const next = () => {
      if (playing !== btn) return;
      if (i >= lines.length) { stop(); return; }
      const u = new SpeechSynthesisUtterance(lines[i].replace(/^[\s–—-]+/, ''));
      u.lang = 'ru-RU'; if (voice) u.voice = voice; u.rate = 0.9; u.pitch = dialog ? (i % 2 ? 0.8 : 1.12) : 1;
      i++; u.onend = () => setTimeout(next, 500); u.onerror = stop;
      speechSynthesis.speak(u);
    };
    next();
  }
  if ('speechSynthesis' in window) speechSynthesis.getVoices();
})();
