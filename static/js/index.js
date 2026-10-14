function esc(s) {
  return String(s ?? '').replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
}
function fmt(s) {
  return esc(s)
    .replace(/\*\*(.+?)\*\*/g, '<b>$1</b>')
    .replace(/###(STOP|TRANSFER|OUT-OF-SCOPE)###/g, '<span class="stop-tok">###$1###</span>');
}

// Kendall tau heatmap: rust for negative, slate-blue for positive
document.querySelectorAll('.tau-table td[data-v]').forEach(td => {
  const v = parseFloat(td.dataset.v);
  const a = Math.abs(v);
  td.style.background = v >= 0 ? `rgba(22,56,79,${0.08 + 0.85 * a})` : `rgba(184,90,34,${0.15 + 0.6 * a})`;
  td.style.color = (v >= 0 && a > 0.45) ? '#fff' : '#16384f';
});

// Example traces
const tabs = document.getElementById('ex-tabs');
const view = document.getElementById('ex-view');

function renderExample(i) {
  const e = EXAMPLES[i];
  [...tabs.children].forEach((b, j) => b.classList.toggle('is-active', j === i));
  const msgs = e.messages.map(m => {
    if (m.role === 'tool') {
      return `<div class="msg tool"><div class="tool-res">↳ ${esc(m.text)}</div></div>`;
    }
    const who = m.role === 'user' ? 'Persona user' : 'Agent';
    let h = `<div class="msg ${m.role}"><div class="who">${who}</div>`;
    if (m.monologue) h += `<details class="mono"><summary>inner monologue</summary><div>${fmt(m.monologue)}</div></details>`;
    if (m.text) h += `<div class="bubble">${fmt(m.text)}</div>`;
    (m.tools || []).forEach(t => { h += `<div class="tool-call">→ ${esc(t)}</div>`; });
    return h + '</div>';
  }).join('');
  view.innerHTML = `
    <div class="ex-head">
      <h4>${esc(e.title)}</h4>
      <div class="ex-meta">
        <span class="tax">${esc(e.taxonomy)}</span>
        <span>${esc(e.bench)} · ${esc(e.domain)}</span>
        <span>agent: ${esc(e.agent)}</span>
        <span>${esc(e.category.replace(/_/g, ' '))}</span>
      </div>
    </div>
    <div class="ex-what"><b>What happened.</b> ${esc(e.what)}</div>
    ${e.why ? `<div class="ex-extra"><b>Why the persona matters.</b> ${esc(e.why)}</div>` : ''}
    ${e.baseline ? `<div class="ex-extra"><b>Default user.</b> ${esc(e.baseline)}</div>` : ''}
    <div class="chat">${msgs}</div>`;
}

EXAMPLES.forEach((e, i) => {
  const b = document.createElement('button');
  b.textContent = e.title;
  b.onclick = () => renderExample(i);
  tabs.appendChild(b);
});
renderExample(0);

// Personas
const grid = document.getElementById('persona-grid');
const label = s => s.replace(/_/g, ' ');
PERSONAS.forEach(p => {
  const pr = p.profile, cs = pr.communication_style || {}, ip = pr.interaction_policy || {};
  const pol = ['policy_friction_tolerance', 'verification_patience', 'gratification_delay_tolerance', 'authority_challenge']
    .filter(k => ip[k]).map(k => `<dt>${label(k)}</dt><dd>${esc(ip[k])}</dd>`).join('');
  const rules = (pr.state_transition_rules || []).map(r => `<li>${esc(r)}</li>`).join('');
  const utt = (cs.example_utterances || []).map(r => `<li>${esc(r)}</li>`).join('');
  const col = document.createElement('div');
  col.className = 'column is-half';
  col.innerHTML = `<div class="persona-card">
    <h4>${esc(p.name)}</h4>
    <div class="quote">“${esc((cs.example_utterances || [''])[0])}”</div>
    <dl>
      <dt>sentence style</dt><dd>${esc(cs.sentence_structure)}</dd>
      <dt>formality</dt><dd>${esc(cs.formality)}</dd>
      ${pol}
    </dl>
    <details><summary>Escalation trigger &amp; state-transition rules</summary>
      <p class="mt-2"><b>Escalates when:</b> ${esc(ip.escalation_trigger)}</p>
      <ul>${rules}</ul>
      <p class="mt-2"><b>Gives up:</b> ${esc(pr.termination_abandonment)}</p>
    </details>
    <details><summary>More example utterances</summary><ul>${utt}</ul></details>
  </div>`;
  grid.appendChild(col);
});
