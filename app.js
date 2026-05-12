/* =========================================
   DADOS & CONFIGURAÇÃO
   ========================================= */

const AVCOLORS = [
  { bg: 'rgba(79,142,247,0.15)',  color: '#4f8ef7' },
  { bg: 'rgba(34,199,122,0.15)',  color: '#22c77a' },
  { bg: 'rgba(245,166,35,0.15)', color: '#f5a623' },
  { bg: 'rgba(196,88,247,0.15)', color: '#c458f7' },
  { bg: 'rgba(244,86,78,0.15)',  color: '#f4564e' },
  { bg: 'rgba(32,201,209,0.15)', color: '#20c9d1' },
];

let activeId   = null;
let activeWeek = {};

let collabs = [
  {
    id: 1, name: 'Ana Paula Silva', role: 'Analista de Atendimento',
    initials: 'AP', colorIdx: 0, goal: 'Líder de equipe', score: 82,
    metrics: { maxAtt: '47', tma: '4m 12s', tme: '1m 55s', avgDay: '23' },
    admissionDate: '15/03/2023', metasBatidas: 8,
    strong: ['Comunicação', 'Empatia com o cliente'],
    difficulties: { 'Não compreender o processo': false, 'Dificuldade em finalizar': true, 'Agilidade': false, 'Complexidade': false, 'Falta de treinamento': false },
    improvements: { 'Finalizações': true, 'Tempo de resposta': false, 'Avaliações': false, 'Forma de atender': false, 'Qualidade de atendimento': true },
    steps: ['Treinamento em processos complexos','Acompanhamento semanal de métricas','Feedback mensal documentado'],
    stepsChecked: [true, false, false],
    systemImprove: 'Revisar fluxo de finalização de tickets e criar base de conhecimento interna.',
    behaviors: { 'Atrasos': false, 'Procedimento incorreto': true, 'Desmotivação aparente': false },
    burnout: { 'Foco': 2, 'Entrega no prazo': 1, 'Volume de tarefas': 1 },
    observations: [{ date: '08/05/2025', text: 'Apresentou melhora no tempo de resposta. Ainda finaliza tickets de forma incompleta.', delta: 'up' }],
    weeks: {},
  },
  {
    id: 2, name: 'Carlos Mendes', role: 'Atendente Sênior',
    initials: 'CM', colorIdx: 1, goal: 'Supervisor de Operações', score: 91,
    metrics: { maxAtt: '63', tma: '3m 40s', tme: '1m 20s', avgDay: '31' },
    admissionDate: '02/08/2021', metasBatidas: 21,
    strong: ['Agilidade', 'Conhecimento técnico'],
    difficulties: { 'Não compreender o processo': false, 'Dificuldade em finalizar': false, 'Agilidade': false, 'Complexidade': true, 'Falta de treinamento': false },
    improvements: { 'Finalizações': false, 'Tempo de resposta': false, 'Avaliações': true, 'Forma de atender': false, 'Qualidade de atendimento': false },
    steps: ['Shadowing com supervisor','Participar de reuniões estratégicas','Liderar uma reunião de equipe'],
    stepsChecked: [true, true, false],
    systemImprove: 'Acesso a relatórios gerenciais para treinar visão estratégica.',
    behaviors: { 'Atrasos': false, 'Procedimento incorreto': false, 'Desmotivação aparente': false },
    burnout: { 'Foco': 3, 'Entrega no prazo': 3, 'Volume de tarefas': 2 },
    observations: [{ date: '08/05/2025', text: 'Excelente desempenho. Candidato natural para progressão de carreira.', delta: 'up' }],
    weeks: {},
  },
  {
    id: 3, name: 'Fernanda Rocha', role: 'Atendente Jr.',
    initials: 'FR', colorIdx: 2, goal: 'Analista de Processos', score: 64,
    metrics: { maxAtt: '29', tma: '6m 30s', tme: '2m 45s', avgDay: '14' },
    admissionDate: '10/01/2024', metasBatidas: 2,
    strong: ['Organização', 'Atenção a detalhes'],
    difficulties: { 'Não compreender o processo': true, 'Dificuldade em finalizar': true, 'Agilidade': true, 'Complexidade': false, 'Falta de treinamento': true },
    improvements: { 'Finalizações': true, 'Tempo de resposta': true, 'Avaliações': false, 'Forma de atender': true, 'Qualidade de atendimento': false },
    steps: ['Treinamento completo de processos','Mentoria com colega sênior','Meta diária de atendimentos'],
    stepsChecked: [false, false, false],
    systemImprove: 'Criar roteiro passo a passo para atendimentos complexos.',
    behaviors: { 'Atrasos': true, 'Procedimento incorreto': true, 'Desmotivação aparente': false },
    burnout: { 'Foco': 1, 'Entrega no prazo': 1, 'Volume de tarefas': 1 },
    observations: [{ date: '08/05/2025', text: 'Necessita de suporte mais próximo. Mostra interesse mas tem gaps de conhecimento.', delta: 'same' }],
    weeks: {},
  },
];

/* =========================================
   UTILITÁRIOS
   ========================================= */

function scoreClass(s) { return s >= 80 ? 'score-hi' : s >= 65 ? 'score-mid' : 'score-lo'; }
function scoreLabel(s) { return s >= 80 ? 'Alto' : s >= 65 ? 'Médio' : 'Atenção'; }
function scoreColor(s) { return s >= 80 ? '#22c77a' : s >= 65 ? '#f5a623' : '#f4564e'; }
function today() {
  const n = new Date();
  return `${String(n.getDate()).padStart(2,'0')}/${String(n.getMonth()+1).padStart(2,'0')}/${n.getFullYear()}`;
}

/* =========================================
   SEMANAS
   ========================================= */

function currentWeekKey() {
  const now  = new Date();
  const day  = now.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  const mon  = new Date(now);
  mon.setDate(now.getDate() + diff);
  return `Semana ${String(mon.getDate()).padStart(2,'0')}/${String(mon.getMonth()+1).padStart(2,'0')}/${mon.getFullYear()}`;
}

function ensureWeek(c, key) {
  if (!c.weeks) c.weeks = {};
  if (!c.weeks[key]) {
    c.weeks[key] = {
      score:        c.score,
      difficulties: JSON.parse(JSON.stringify(c.difficulties)),
      improvements: JSON.parse(JSON.stringify(c.improvements)),
      behaviors:    JSON.parse(JSON.stringify(c.behaviors)),
      burnout:      JSON.parse(JSON.stringify(c.burnout)),
    };
  }
  return c.weeks[key];
}

function getActiveWeek(c) {
  if (!activeWeek[c.id]) activeWeek[c.id] = currentWeekKey();
  return { key: activeWeek[c.id], data: ensureWeek(c, activeWeek[c.id]) };
}

function isCurrentWeek(c) {
  return (activeWeek[c.id] || currentWeekKey()) === currentWeekKey();
}

function weekData(id) {
  const c = collabs.find(x => x.id === id);
  return getActiveWeek(c).data;
}

function switchWeek(id, key) {
  activeWeek[id] = key;
  openDetail(id);
}

function createNewWeek(id) {
  const c    = collabs.find(x => x.id === id);
  const key  = currentWeekKey();
  const keys = Object.keys(c.weeks || {}).sort();
  const last = keys.length ? c.weeks[keys[keys.length - 1]] : null;
  c.weeks[key] = last
    ? JSON.parse(JSON.stringify({ ...last, score: c.score }))
    : { score: c.score, difficulties: JSON.parse(JSON.stringify(c.difficulties)), improvements: JSON.parse(JSON.stringify(c.improvements)), behaviors: JSON.parse(JSON.stringify(c.behaviors)), burnout: JSON.parse(JSON.stringify(c.burnout)) };
  activeWeek[id] = key;
  openDetail(id);
}

/* =========================================
   LISTA DE COLABORADORES
   ========================================= */

function renderList(filter = '') {
  const list = document.getElementById('collab-list');
  list.innerHTML = '';
  collabs
    .filter(c => c.name.toLowerCase().includes(filter.toLowerCase()) || c.role.toLowerCase().includes(filter.toLowerCase()))
    .forEach(c => {
      const cl  = AVCOLORS[c.colorIdx % AVCOLORS.length];
      const div = document.createElement('div');
      div.className = 'collab-item' + (activeId === c.id ? ' active' : '');
      div.onclick   = () => openDetail(c.id);
      div.innerHTML = `
        <div class="c-avatar" style="background:${cl.bg};color:${cl.color}">${c.initials}</div>
        <div class="c-info"><div class="c-name">${c.name}</div><div class="c-role">${c.role}</div></div>
        <span class="c-score-pill ${scoreClass(c.score)}">${c.score}%</span>
        <button class="c-delete-btn" onclick="event.stopPropagation();confirmDelete(${c.id})">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
            <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4h6v2"/>
          </svg>
        </button>
      `;
      list.appendChild(div);
    });
}

function filterList(val) { renderList(val); }

/* =========================================
   PAINEL DE DETALHES
   ========================================= */

function openDetail(id) {
  const isNew = activeId !== id;
  activeId    = id;
  const c     = collabs.find(x => x.id === id);
  ensureWeek(c, currentWeekKey());
  if (isNew) activeWeek[id] = currentWeekKey();
  const main = document.getElementById('main-panel');
  const cls  = isNew ? 'panel-content slide-in' : 'panel-content';
  main.innerHTML = `<div class="${cls}" id="pc-${id}">${buildPanel(c)}</div>`;
  renderList(document.getElementById('search-input').value);
}

function buildPanel(c) {
  const cl       = AVCOLORS[c.colorIdx % AVCOLORS.length];
  const { key, data } = getActiveWeek(c);
  const readonly = !isCurrentWeek(c);
  return `
    ${buildHeader(c, cl)}
    ${buildWeekSelector(c, key)}
    ${readonly ? '<div class="week-readonly-banner">📅 Visualizando semana passada — edições desabilitadas</div>' : ''}
    ${buildMetrics(c)}
    <div class="sections-grid">
      ${buildStrongCard(c)}
      ${buildGoalCard(c)}
      ${buildStepsCard(c)}
    </div>
    <div class="sections-grid">
      ${buildDiffCard(c, data, readonly)}
      ${buildImprovCard(c, data, readonly)}
    </div>
    <div class="sections-grid">
      ${buildBehaviorCard(c, data, readonly)}
      ${buildBurnoutCard(c, data, readonly)}
    </div>
    ${buildSystemCard(c)}
    ${buildObsCard(c)}
  `;
}

function buildWeekSelector(c, currentKey) {
  const curWeek   = currentWeekKey();
  const weeks     = Object.keys(c.weeks || {}).sort().reverse();
  if (!weeks.includes(curWeek)) weeks.unshift(curWeek);
  const options   = weeks.map(w =>
    `<option value="${w}" ${w === currentKey ? 'selected' : ''}>${w}${w === curWeek ? ' (atual)' : ''}</option>`
  ).join('');
  const onCurrent = currentKey === curWeek;
  const btnLabel  = onCurrent ? '✓ Semana atual' : '+ Ir para semana atual';
  const btnStyle  = onCurrent ? 'opacity:0.5;cursor:default;' : '';
  const btnAction = onCurrent ? '' : `onclick="createNewWeek(${c.id})"`;
  return `
    <div class="week-selector-row">
      <span class="week-label">📆 Semana:</span>
      <select class="week-select" onchange="switchWeek(${c.id}, this.value)">${options}</select>
      <button class="new-week-btn" ${btnAction} style="${btnStyle}">${btnLabel}</button>
    </div>
  `;
}

function buildHeader(c, cl) {
  const admStr = c.admissionDate || '—';
  let tenureStr = '';
  if (c.admissionDate) {
    const [d, m, y] = c.admissionDate.split('/').map(Number);
    const adm    = new Date(y, m - 1, d);
    const now    = new Date();
    const months = (now.getFullYear() - adm.getFullYear()) * 12 + (now.getMonth() - adm.getMonth());
    const yrs    = Math.floor(months / 12);
    const mos    = months % 12;
    tenureStr    = yrs > 0 ? `${yrs}a ${mos}m` : `${mos} meses`;
  }
  return `
    <div class="panel-header">
      <div class="panel-avatar" style="background:${cl.bg};color:${cl.color}">${c.initials}</div>
      <div>
        <div class="panel-name">${c.name}</div>
        <div class="panel-role-txt">${c.role}</div>
        <div class="panel-admission">
          <span class="adm-chip">📅 Admissão: <strong>${admStr}</strong>${tenureStr ? ` <span class="adm-tenure">(${tenureStr})</span>` : ''}</span>
        </div>
      </div>
      <div class="header-stats">
        <div class="score-display">
          <div class="score-number" style="color:${scoreColor(c.score)}">${c.score}%</div>
          <div class="score-label">${scoreLabel(c.score)}</div>
        </div>
        <div class="metas-display">
          <div class="metas-number">${c.metasBatidas ?? 0}</div>
          <div class="metas-label">metas batidas</div>
        </div>
      </div>
      <button class="delete-panel-btn" onclick="confirmDelete(${c.id})">
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
          <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4h6v2"/>
        </svg>
        Excluir
      </button>
    </div>
  `;
}

function buildMetrics(c) {
  return `
    <div class="metrics-row">
      <div class="metric-box">
        <div class="metric-lbl">🏆 Máx. Atendimentos</div>
        <input class="metric-input" value="${c.metrics.maxAtt}" onchange="saveMetric(${c.id},'maxAtt',this.value)" />
        <div class="metric-sub">recorde pessoal</div>
      </div>
      <div class="metric-box">
        <div class="metric-lbl">⏱ TMA</div>
        <input class="metric-input" value="${c.metrics.tma}" onchange="saveMetric(${c.id},'tma',this.value)" />
        <div class="metric-sub">tempo médio atend.</div>
      </div>
      <div class="metric-box">
        <div class="metric-lbl">⏳ TME</div>
        <input class="metric-input" value="${c.metrics.tme}" onchange="saveMetric(${c.id},'tme',this.value)" />
        <div class="metric-sub">tempo médio espera</div>
      </div>
      <div class="metric-box">
        <div class="metric-lbl">📊 Média / Dia</div>
        <input class="metric-input" value="${c.metrics.avgDay}" onchange="saveMetric(${c.id},'avgDay',this.value)" />
        <div class="metric-sub">atendimentos/dia</div>
      </div>
      <div class="metric-box">
        <div class="metric-lbl">Qualidade</div>
        <input class="metric-input" value="${c.metrics.quality ?? '—'}" onchange="saveMetric(${c.id},'quality',this.value)" />
      </div>
    </div>
  `;
}

function buildStrongCard(c) {
  const pills = c.strong.map(s => `<span class="strong-pill">${s}</span>`).join('');
  return `
    <div class="section-card">
      <div class="section-title">⭐ Pontos Fortes</div>
      <div class="strong-pills">${pills || '<span style="font-size:12px;color:var(--text3)">Nenhum cadastrado ainda.</span>'}</div>
    </div>
  `;
}

function buildGoalCard(c) {
  return `
    <div class="section-card">
      <div class="section-title">🎯 Onde quer chegar</div>
      <div class="goal-banner">${c.goal}</div>
    </div>
  `;
}

function buildStepsCard(c) {
  const rows = c.steps.map((s, i) => `
    <div class="check-row">
      <div class="check-box ${c.stepsChecked[i] ? 'done' : ''}" onclick="toggleCheck(${c.id},${i})">
        <svg viewBox="0 0 12 12"><polyline points="1.5,6 4.5,9 10.5,3"/></svg>
      </div>
      <span class="check-lbl ${c.stepsChecked[i] ? 'done' : ''}">${s}</span>
      <span style="cursor:pointer;color:var(--text3);font-size:16px;line-height:1;padding:0 4px" onclick="removeStep(${c.id},${i})">×</span>
    </div>
  `).join('');
  return `
    <div class="section-card full">
      <div class="section-title">✅ Passos para alcançar o objetivo</div>
      <div class="check-list">${rows}</div>
      <div class="add-step-row">
        <input class="mini-input" id="step-inp-${c.id}" placeholder="Adicionar novo passo..." onkeydown="if(event.key==='Enter') addStep(${c.id})" />
        <button class="mini-btn" onclick="addStep(${c.id})">+</button>
      </div>
    </div>
  `;
}

function buildDiffCard(c, data, readonly) {
  const src  = data ? data.difficulties : c.difficulties;
  const tags = Object.entries(src).map(([k, v]) => `
    <span class="tag ${v ? 't-bad' : ''}" ${!readonly ? `onclick="toggleWeekTag(${c.id},'difficulties','${k}')"` : ''}>
      ${v ? '● ' : ''}${k}
      ${!readonly ? `<span class="tag-remove" onclick="event.stopPropagation();removeWeekTag(${c.id},'difficulties','${k}')">×</span>` : ''}
    </span>
  `).join('');
  return `
    <div class="section-card">
      <div class="section-title">⚠️ Dificuldades localizadas</div>
      <div class="tags-wrap">${tags}</div>
      ${!readonly ? `<div class="tag-add-row">
        <input class="tag-input" id="diff-inp-${c.id}" placeholder="Nova dificuldade..." onkeydown="if(event.key==='Enter')addWeekTag(${c.id},'difficulties','diff-inp-${c.id}')" />
        <button class="tag-add-btn" onclick="addWeekTag(${c.id},'difficulties','diff-inp-${c.id}')">+</button>
      </div>` : ''}
    </div>
  `;
}

function buildImprovCard(c, data, readonly) {
  const src  = data ? data.improvements : c.improvements;
  const tags = Object.entries(src).map(([k, v]) => `
    <span class="tag ${v ? 't-good' : ''}" ${!readonly ? `onclick="toggleWeekTag(${c.id},'improvements','${k}')"` : ''}>
      ${v ? '● ' : ''}${k}
      ${!readonly ? `<span class="tag-remove" onclick="event.stopPropagation();removeWeekTag(${c.id},'improvements','${k}')">×</span>` : ''}
    </span>
  `).join('');
  return `
    <div class="section-card">
      <div class="section-title">📈 Pontos de melhoria</div>
      <div class="tags-wrap">${tags}</div>
      ${!readonly ? `<div class="tag-add-row">
        <input class="tag-input" id="impr-inp-${c.id}" placeholder="Novo ponto de melhoria..." onkeydown="if(event.key==='Enter')addWeekTag(${c.id},'improvements','impr-inp-${c.id}')" />
        <button class="tag-add-btn" onclick="addWeekTag(${c.id},'improvements','impr-inp-${c.id}')">+</button>
      </div>` : ''}
    </div>
  `;
}

function buildBehaviorCard(c, data, readonly) {
  const src  = data ? data.behaviors : c.behaviors;
  const rows = Object.entries(src).map(([k, v]) => `
    <div class="behavior-row ${v ? 'flagged' : ''}" ${!readonly ? `onclick="toggleWeekBehavior(${c.id},'${k}')"` : ''}>
      <div class="behavior-dot"></div>${k}
      ${!readonly ? `<span class="behavior-remove" onclick="event.stopPropagation();removeWeekBehavior(${c.id},'${k}')">×</span>` : ''}
    </div>
  `).join('');
  return `
    <div class="section-card">
      <div class="section-title">🚨 Comportamento Operacional</div>
      <div class="behavior-list">${rows}</div>
      ${!readonly ? `<div class="tag-add-row">
        <input class="tag-input" id="beh-inp-${c.id}" placeholder="Novo comportamento..." onkeydown="if(event.key==='Enter')addWeekBehavior(${c.id},'beh-inp-${c.id}')" />
        <button class="tag-add-btn" onclick="addWeekBehavior(${c.id},'beh-inp-${c.id}')">+</button>
      </div>` : ''}
    </div>
  `;
}

function buildBurnoutCard(c, data, readonly) {
  const src  = data ? data.burnout : c.burnout;
  const rows = Object.entries(src).map(([k, lvl]) => {
    const dots = [1, 2, 3].map(i => {
      const cls = `b-dot l${i}${i <= lvl ? ' on' : ''}`;
      return `<div class="${cls}" ${!readonly ? `onclick="setWeekBurnout(${c.id},'${k}',${i})"` : ''}></div>`;
    }).join('');
    return `
      <div class="burnout-row">
        <span class="burnout-lbl">${k}</span>
        <div class="burnout-dots">${dots}</div>
        ${!readonly ? `<span class="behavior-remove" onclick="removeWeekBurnout(${c.id},'${k}')">×</span>` : ''}
      </div>
    `;
  }).join('');
  return `
    <div class="section-card">
      <div class="section-title">📊 Análise de Produtividade</div>
      <div class="burnout-table">${rows}</div>
      <div class="burnout-legend" style="margin-top:10px">
        <span class="b-leg"><span class="b-leg-dot" style="background:#f4564e"></span>Baixo</span>
        <span class="b-leg"><span class="b-leg-dot" style="background:#f5a623"></span>Médio</span>
        <span class="b-leg"><span class="b-leg-dot" style="background:#22c77a"></span>Alto</span>
      </div>
      ${!readonly ? `<div class="tag-add-row" style="margin-top:12px">
        <input class="tag-input" id="burn-inp-${c.id}" placeholder="Novo indicador de produtividade..." onkeydown="if(event.key==='Enter')addWeekBurnout(${c.id},'burn-inp-${c.id}')" />
        <button class="tag-add-btn" onclick="addWeekBurnout(${c.id},'burn-inp-${c.id}')">+</button>
      </div>` : ''}
    </div>
  `;
}

function buildSystemCard(c) {
  return `
    <div class="section-card" style="margin-bottom:16px">
      <div class="section-title">⚙️ Melhorias Sistêmicas</div>
      <textarea class="big-textarea" placeholder="Melhorias de processo, sistema ou estrutura..."
        onchange="saveField(${c.id},'systemImprove',this.value)">${c.systemImprove}</textarea>
    </div>
  `;
}

function buildObsCard(c) {
  const entries = c.observations.slice().reverse().map(o => `
    <div class="obs-entry">
      <div class="obs-meta">
        <span class="obs-date">${o.date}</span>
        <span class="obs-delta ${o.delta === 'up' ? 'd-up' : o.delta === 'down' ? 'd-down' : 'd-same'}">
          ${o.delta === 'up' ? '↑ Melhora' : o.delta === 'down' ? '↓ Piora' : '→ Estável'}
        </span>
      </div>
      <div class="obs-text-body">${o.text}</div>
    </div>
  `).join('');
  return `
    <div class="section-card" style="margin-bottom:32px">
      <div class="section-title">💬 Observações & Feedback</div>
      <div class="obs-list">${entries || '<p style="font-size:12px;color:var(--text3)">Nenhuma observação ainda.</p>'}</div>
      <hr class="divider" />
      <textarea class="big-textarea" id="obs-txt-${c.id}" placeholder="Nova observação de feedback..."></textarea>
      <div class="obs-controls">
        <select class="delta-select" id="obs-delta-${c.id}">
          <option value="up">↑ Melhora</option>
          <option value="same">→ Estável</option>
          <option value="down">↓ Piora</option>
        </select>
        <button class="save-btn" style="margin-left:auto" onclick="saveObs(${c.id})">💾 Salvar Observação</button>
      </div>
    </div>
  `;
}

/* =========================================
   AÇÕES — MÉTRICAS / CAMPOS
   ========================================= */

function saveMetric(id, field, val) { collabs.find(x => x.id === id).metrics[field] = val; }
function saveField(id, field, val)  { collabs.find(x => x.id === id)[field] = val; }

/* =========================================
   AÇÕES — CHECKLIST
   ========================================= */

function toggleCheck(id, i) {
  const c = collabs.find(x => x.id === id);
  c.stepsChecked[i] = !c.stepsChecked[i];
  const done  = c.stepsChecked.filter(Boolean).length;
  const total = c.stepsChecked.length;
  c.score = Math.min(100, Math.max(30, Math.round((done / Math.max(total, 1)) * 40 + 60)));
  if (isCurrentWeek(c)) getActiveWeek(c).data.score = c.score;
  openDetail(id);
}

function addStep(id) {
  const inp = document.getElementById(`step-inp-${id}`);
  if (!inp || !inp.value.trim()) return;
  const c = collabs.find(x => x.id === id);
  c.steps.push(inp.value.trim());
  c.stepsChecked.push(false);
  openDetail(id);
}

function removeStep(id, i) {
  const c = collabs.find(x => x.id === id);
  c.steps.splice(i, 1);
  c.stepsChecked.splice(i, 1);
  openDetail(id);
}

/* =========================================
   AÇÕES DE SEMANA
   ========================================= */

function toggleWeekTag(id, field, key)     { weekData(id)[field][key] = !weekData(id)[field][key]; openDetail(id); }
function removeWeekTag(id, field, key)     { delete weekData(id)[field][key]; openDetail(id); }
function toggleWeekBehavior(id, key)       { const d = weekData(id); d.behaviors[key] = !d.behaviors[key]; openDetail(id); }
function removeWeekBehavior(id, key)       { delete weekData(id).behaviors[key]; openDetail(id); }
function removeWeekBurnout(id, key)        { delete weekData(id).burnout[key]; openDetail(id); }

function addWeekTag(id, field, inputId) {
  const inp = document.getElementById(inputId);
  if (!inp || !inp.value.trim()) return;
  const d = weekData(id);
  if (!d[field].hasOwnProperty(inp.value.trim())) d[field][inp.value.trim()] = false;
  openDetail(id);
}

function addWeekBehavior(id, inputId) {
  const inp = document.getElementById(inputId);
  if (!inp || !inp.value.trim()) return;
  const d = weekData(id);
  if (!d.behaviors.hasOwnProperty(inp.value.trim())) d.behaviors[inp.value.trim()] = false;
  openDetail(id);
}

function setWeekBurnout(id, key, val) {
  const d = weekData(id);
  d.burnout[key] = d.burnout[key] === val ? val - 1 : val;
  openDetail(id);
}

function addWeekBurnout(id, inputId) {
  const inp = document.getElementById(inputId);
  if (!inp || !inp.value.trim()) return;
  const d = weekData(id);
  if (!d.burnout.hasOwnProperty(inp.value.trim())) d.burnout[inp.value.trim()] = 0;
  openDetail(id);
}

/* =========================================
   AÇÕES — OBSERVAÇÕES
   ========================================= */

function saveObs(id) {
  const c   = collabs.find(x => x.id === id);
  const txt = document.getElementById(`obs-txt-${id}`).value.trim();
  if (!txt) return;
  c.observations.push({ date: today(), text: txt, delta: document.getElementById(`obs-delta-${id}`).value });
  openDetail(id);
}

/* =========================================
   EXCLUIR COLABORADOR
   ========================================= */

function confirmDelete(id) {
  const c = collabs.find(x => x.id === id);
  document.getElementById('delete-modal-name').textContent = c.name;
  document.getElementById('delete-modal-overlay').className = 'modal-overlay open';
  document.getElementById('confirm-delete-btn').onclick = () => deleteCollab(id);
}

function closeDeleteModal() {
  document.getElementById('delete-modal-overlay').className = 'modal-overlay';
}

function deleteCollab(id) {
  collabs = collabs.filter(x => x.id !== id);
  closeDeleteModal();
  if (activeId === id) {
    activeId = null;
    document.getElementById('main-panel').innerHTML = `
      <div class="empty-state">
        <div class="empty-icon">👥</div>
        <h3>Selecione um colaborador</h3>
        <p>Clique em um nome na lista ao lado para ver o perfil completo de performance e PDI.</p>
      </div>
    `;
  }
  renderList(document.getElementById('search-input').value);
}

/* =========================================
   MODAL — NOVO COLABORADOR
   ========================================= */

function openModal()  { document.getElementById('modal-overlay').className = 'modal-overlay open'; }
function closeModal() { document.getElementById('modal-overlay').className = 'modal-overlay'; }

function addCollab() {
  const name    = document.getElementById('inp-name').value.trim();
  if (!name) return;
  const role    = document.getElementById('inp-role').value.trim();
  const goal    = document.getElementById('inp-goal').value.trim();
  const strong  = document.getElementById('inp-strong').value.trim();
  const admDate = document.getElementById('inp-admission').value;
  const metas   = parseInt(document.getElementById('inp-metas').value) || 0;
  let admFormatted = '';
  if (admDate) { const [y, m, d] = admDate.split('-'); admFormatted = `${d}/${m}/${y}`; }
  collabs.push({
    id: Date.now(), name, role: role || 'Colaborador',
    initials: name.split(' ').slice(0, 2).map(n => n[0]).join('').toUpperCase(),
    colorIdx: collabs.length, goal: goal || 'A definir', score: 50, admissionDate: admFormatted, metasBatidas: metas,
    metrics: { maxAtt: '0', tma: '—', tme: '—', avgDay: '0' },
    strong: strong ? strong.split(',').map(s => s.trim()).filter(Boolean) : [],
    difficulties: { 'Não compreender o processo': false, 'Dificuldade em finalizar': false, 'Agilidade': false, 'Complexidade': false, 'Falta de treinamento': false },
    improvements: { 'Finalizações': false, 'Tempo de resposta': false, 'Avaliações': false, 'Forma de atender': false, 'Qualidade de atendimento': false },
    steps: [], stepsChecked: [], systemImprove: '',
    behaviors: { 'Atrasos': false, 'Procedimento incorreto': false, 'Desmotivação aparente': false },
    burnout: { 'Foco': 0, 'Entrega no prazo': 0, 'Volume de tarefas': 0 },
    observations: [], weeks: {},
  });
  closeModal();
  ['inp-name','inp-role','inp-goal','inp-strong','inp-admission','inp-metas'].forEach(id => { document.getElementById(id).value = ''; });
  renderList();
}

/* =========================================
   INICIALIZAÇÃO
   ========================================= */

document.getElementById('modal-overlay').addEventListener('click', function(e) { if (e.target === this) closeModal(); });
document.getElementById('delete-modal-overlay').addEventListener('click', function(e) { if (e.target === this) closeDeleteModal(); });

renderList();