/* jshint esversion: 6 */

const AVCOLORS = [
  { bg: "rgba(79,142,247,0.15)",  color: "#4f8ef7" },
  { bg: "rgba(34,199,122,0.15)",  color: "#22c77a" },
  { bg: "rgba(245,166,35,0.15)", color: "#f5a623" },
  { bg: "rgba(196,88,247,0.15)", color: "#c458f7" },
  { bg: "rgba(244,86,78,0.15)",  color: "#f4564e" },
  { bg: "rgba(32,201,209,0.15)", color: "#20c9d1" },
];

let activeId = null;

let collabs = (function () {
  try {
    const s = localStorage.getItem("pdi_collabs");
    return s ? JSON.parse(s) : [];
  } catch (e) {
    return [];
  }
}());

/* =========================================
   PERSISTÊNCIA
   ========================================= */

function saveData() {
  try {
    localStorage.setItem("pdi_collabs", JSON.stringify(collabs));
  } catch (e) { /* sem ação */ }
}

/* =========================================
   UTILITÁRIOS
   ========================================= */

function scoreClass(s) { return s >= 80 ? "score-hi" : s >= 65 ? "score-mid" : "score-lo"; }
function scoreLabel(s) { return s >= 80 ? "Alto" : s >= 65 ? "Médio" : "Atenção"; }
function scoreColor(s) { return s >= 80 ? "#22c77a" : s >= 65 ? "#f5a623" : "#f4564e"; }

function today() {
  const n = new Date();
  return String(n.getDate()).padStart(2, "0") + "/" +
    String(n.getMonth() + 1).padStart(2, "0") + "/" +
    n.getFullYear();
}

/* =========================================
   LISTA DE COLABORADORES
   ========================================= */

function renderList(filter) {
  filter = filter || "";
  const list = document.getElementById("collab-list");
  list.innerHTML = "";
  collabs
    .filter(function (c) {
      return c.name.toLowerCase().includes(filter.toLowerCase()) ||
        c.role.toLowerCase().includes(filter.toLowerCase());
    })
    .forEach(function (c) {
      const cl  = AVCOLORS[c.colorIdx % AVCOLORS.length];
      const div = document.createElement("div");
      div.className = "collab-item" + (activeId === c.id ? " active" : "");
      div.onclick   = function () { openDetail(c.id); };
      div.innerHTML =
        "<div class=\"c-avatar\" style=\"background:" + cl.bg + ";color:" + cl.color + "\">" + c.initials + "</div>" +
        "<div class=\"c-info\"><div class=\"c-name\">" + c.name + "</div><div class=\"c-role\">" + c.role + "</div></div>" +
        "<span class=\"c-score-pill " + scoreClass(c.score) + "\">" + c.score + "%</span>" +
        "<button class=\"c-delete-btn\" onclick=\"event.stopPropagation();confirmDelete(" + c.id + ")\">" +
        "<svg width=\"13\" height=\"13\" viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"2.5\">" +
        "<polyline points=\"3 6 5 6 21 6\"/><path d=\"M19 6l-1 14H6L5 6\"/><path d=\"M10 11v6\"/><path d=\"M14 11v6\"/><path d=\"M9 6V4h6v2\"/>" +
        "</svg></button>";
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
  const c     = collabs.find(function (x) { return x.id === id; });
  const main  = document.getElementById("main-panel");
  const cls   = isNew ? "panel-content slide-in" : "panel-content";
  main.innerHTML = "<div class=\"" + cls + "\" id=\"pc-" + id + "\">" + buildPanel(c) + "</div>";
  renderList(document.getElementById("search-input").value);
  saveData();
}

function buildPanel(c) {
  const cl = AVCOLORS[c.colorIdx % AVCOLORS.length];
  return buildHeader(c, cl) +
    buildMetrics(c) +
    "<div class=\"sections-grid\">" +
      buildStrongCard(c) +
      buildGoalCard(c) +
      buildStepsCard(c) +
    "</div>" +
    "<div class=\"sections-grid\">" +
      buildDiffCard(c) +
      buildImprovCard(c) +
    "</div>" +
    "<div class=\"sections-grid\">" +
      buildBehaviorCard(c) +
      buildBurnoutCard(c) +
    "</div>" +
    buildSystemCard(c) +
    buildObsCard(c);
}

function buildHeader(c, cl) {
  const admStr = c.admissionDate || "—";
  let tenureStr = "";
  if (c.admissionDate) {
    const parts  = c.admissionDate.split("/");
    const adm    = new Date(Number(parts[2]), Number(parts[1]) - 1, Number(parts[0]));
    const now    = new Date();
    const months = (now.getFullYear() - adm.getFullYear()) * 12 + (now.getMonth() - adm.getMonth());
    const yrs    = Math.floor(months / 12);
    const mos    = months % 12;
    tenureStr    = yrs > 0 ? yrs + "a " + mos + "m" : mos + " meses";
  }
  const tenureHtml = tenureStr ? " <span class=\"adm-tenure\">(" + tenureStr + ")</span>" : "";
  return "<div class=\"panel-header\">" +
    "<div class=\"panel-avatar\" style=\"background:" + cl.bg + ";color:" + cl.color + "\">" + c.initials + "</div>" +
    "<div>" +
      "<div class=\"panel-name\">" + c.name + "</div>" +
      "<div class=\"panel-role-txt\">" + c.role + "</div>" +
      "<div class=\"panel-admission\"><span class=\"adm-chip\">📅 Admissão: <strong>" + admStr + "</strong>" + tenureHtml + "</span></div>" +
    "</div>" +
    "<div class=\"header-stats\">" +
      "<div class=\"score-display\">" +
        "<div class=\"score-number\" style=\"color:" + scoreColor(c.score) + "\">" + c.score + "%</div>" +
        "<div class=\"score-label\">" + scoreLabel(c.score) + "</div>" +
      "</div>" +
      "<div class=\"metas-display\">" +
        "<div class=\"metas-number\">" + (c.metasBatidas || 0) + "</div>" +
        "<div class=\"metas-label\">metas batidas</div>" +
      "</div>" +
    "</div>" +
    "<button class=\"edit-panel-btn\" onclick=\"openEditModal(" + c.id + ")\">✏️ Editar</button>" +
    "<button class=\"delete-panel-btn\" onclick=\"confirmDelete(" + c.id + ")\">" +
      "<svg width=\"15\" height=\"15\" viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"2.5\">" +
      "<polyline points=\"3 6 5 6 21 6\"/><path d=\"M19 6l-1 14H6L5 6\"/><path d=\"M10 11v6\"/><path d=\"M14 11v6\"/><path d=\"M9 6V4h6v2\"/>" +
      "</svg> Excluir" +
    "</button>" +
  "</div>";
}

function buildMetrics(c) {
  const q = c.metrics.quality !== undefined ? c.metrics.quality : "—";
  return "<div class=\"metrics-row\">" +
    "<div class=\"metric-box\"><div class=\"metric-lbl\">🏆 Máx. Atendimentos</div>" +
    "<input class=\"metric-input\" value=\"" + c.metrics.maxAtt + "\" onchange=\"saveMetric(" + c.id + ",'maxAtt',this.value)\" />" +
    "<div class=\"metric-sub\">recorde pessoal</div></div>" +

    "<div class=\"metric-box\"><div class=\"metric-lbl\">⏱ TMA</div>" +
    "<input class=\"metric-input\" value=\"" + c.metrics.tma + "\" onchange=\"saveMetric(" + c.id + ",'tma',this.value)\" />" +
    "<div class=\"metric-sub\">tempo médio atend.</div></div>" +

    "<div class=\"metric-box\"><div class=\"metric-lbl\">⏳ TME</div>" +
    "<input class=\"metric-input\" value=\"" + c.metrics.tme + "\" onchange=\"saveMetric(" + c.id + ",'tme',this.value)\" />" +
    "<div class=\"metric-sub\">tempo médio espera</div></div>" +

    "<div class=\"metric-box\"><div class=\"metric-lbl\">📊 Média / Dia</div>" +
    "<input class=\"metric-input\" value=\"" + c.metrics.avgDay + "\" onchange=\"saveMetric(" + c.id + ",'avgDay',this.value)\" />" +
    "<div class=\"metric-sub\">atendimentos/dia</div></div>" +

    "<div class=\"metric-box\"><div class=\"metric-lbl\">Qualidade</div>" +
    "<input class=\"metric-input\" value=\"" + q + "\" onchange=\"saveMetric(" + c.id + ",'quality',this.value)\" /></div>" +
  "</div>";
}

function buildStrongCard(c) {
  const pills = c.strong.map(function (s) { return "<span class=\"strong-pill\">" + s + "</span>"; }).join("");
  return "<div class=\"section-card\">" +
    "<div class=\"section-title\">⭐ Pontos Fortes</div>" +
    "<div class=\"strong-pills\">" + (pills || "<span style=\"font-size:12px;color:var(--text3)\">Nenhum cadastrado ainda.</span>") + "</div>" +
  "</div>";
}

function buildGoalCard(c) {
  return "<div class=\"section-card\">" +
    "<div class=\"section-title\">🎯 Onde quer chegar</div>" +
    "<div class=\"goal-banner\">" + c.goal + "</div>" +
  "</div>";
}

function buildStepsCard(c) {
  const rows = c.steps.map(function (s, i) {
    const done = c.stepsChecked[i] ? "done" : "";
    return "<div class=\"check-row\">" +
      "<div class=\"check-box " + done + "\" onclick=\"toggleCheck(" + c.id + "," + i + ")\">" +
        "<svg viewBox=\"0 0 12 12\"><polyline points=\"1.5,6 4.5,9 10.5,3\"/></svg>" +
      "</div>" +
      "<span class=\"check-lbl " + done + "\">" + s + "</span>" +
      "<span style=\"cursor:pointer;color:var(--text3);font-size:16px;line-height:1;padding:0 4px\" onclick=\"removeStep(" + c.id + "," + i + ")\">×</span>" +
    "</div>";
  }).join("");
  return "<div class=\"section-card full\">" +
    "<div class=\"section-title\">✅ Passos para alcançar o objetivo</div>" +
    "<div class=\"check-list\">" + rows + "</div>" +
    "<div class=\"add-step-row\">" +
      "<input class=\"mini-input\" id=\"step-inp-" + c.id + "\" placeholder=\"Adicionar novo passo...\" onkeydown=\"if(event.key==='Enter') addStep(" + c.id + ")\" />" +
      "<button class=\"mini-btn\" onclick=\"addStep(" + c.id + ")\">+</button>" +
    "</div>" +
  "</div>";
}

function buildDiffCard(c) {
  const tags = Object.keys(c.difficulties).map(function (k) {
    const v = c.difficulties[k];
    return "<span class=\"tag " + (v ? "t-bad" : "") + "\" onclick=\"toggleTag(" + c.id + ",'difficulties','" + k + "')\">" +
      (v ? "● " : "") + k +
      "<span class=\"tag-remove\" onclick=\"event.stopPropagation();removeTag(" + c.id + ",'difficulties','" + k + "')\">×</span>" +
    "</span>";
  }).join("");
  return "<div class=\"section-card\">" +
    "<div class=\"section-title\">⚠️ Dificuldades localizadas</div>" +
    "<div class=\"tags-wrap\">" + tags + "</div>" +
    "<div class=\"tag-add-row\">" +
      "<input class=\"tag-input\" id=\"diff-inp-" + c.id + "\" placeholder=\"Nova dificuldade...\" onkeydown=\"if(event.key==='Enter') addTag(" + c.id + ",'difficulties','diff-inp-" + c.id + "')\" />" +
      "<button class=\"tag-add-btn\" onclick=\"addTag(" + c.id + ",'difficulties','diff-inp-" + c.id + "')\">+</button>" +
    "</div>" +
  "</div>";
}

function buildImprovCard(c) {
  const tags = Object.keys(c.improvements).map(function (k) {
    const v = c.improvements[k];
    return "<span class=\"tag " + (v ? "t-good" : "") + "\" onclick=\"toggleTag(" + c.id + ",'improvements','" + k + "')\">" +
      (v ? "● " : "") + k +
      "<span class=\"tag-remove\" onclick=\"event.stopPropagation();removeTag(" + c.id + ",'improvements','" + k + "')\">×</span>" +
    "</span>";
  }).join("");
  return "<div class=\"section-card\">" +
    "<div class=\"section-title\">📈 Pontos de melhoria</div>" +
    "<div class=\"tags-wrap\">" + tags + "</div>" +
    "<div class=\"tag-add-row\">" +
      "<input class=\"tag-input\" id=\"impr-inp-" + c.id + "\" placeholder=\"Novo ponto de melhoria...\" onkeydown=\"if(event.key==='Enter') addTag(" + c.id + ",'improvements','impr-inp-" + c.id + "')\" />" +
      "<button class=\"tag-add-btn\" onclick=\"addTag(" + c.id + ",'improvements','impr-inp-" + c.id + "')\">+</button>" +
    "</div>" +
  "</div>";
}

function buildBehaviorCard(c) {
  const rows = Object.keys(c.behaviors).map(function (k) {
    const v = c.behaviors[k];
    return "<div class=\"behavior-row " + (v ? "flagged" : "") + "\" onclick=\"toggleBehavior(" + c.id + ",'" + k + "')\">" +
      "<div class=\"behavior-dot\"></div>" + k +
      "<span class=\"behavior-remove\" onclick=\"event.stopPropagation();removeBehavior(" + c.id + ",'" + k + "')\">×</span>" +
    "</div>";
  }).join("");
  return "<div class=\"section-card\">" +
    "<div class=\"section-title\">🚨 Comportamento Operacional</div>" +
    "<div class=\"behavior-list\">" + rows + "</div>" +
    "<div class=\"tag-add-row\">" +
      "<input class=\"tag-input\" id=\"beh-inp-" + c.id + "\" placeholder=\"Novo comportamento...\" onkeydown=\"if(event.key==='Enter') addBehavior(" + c.id + ",'beh-inp-" + c.id + "')\" />" +
      "<button class=\"tag-add-btn\" onclick=\"addBehavior(" + c.id + ",'beh-inp-" + c.id + "')\">+</button>" +
    "</div>" +
  "</div>";
}

function buildBurnoutCard(c) {
  const rows = Object.keys(c.burnout).map(function (k) {
    const lvl  = c.burnout[k];
    const dots = [1, 2, 3].map(function (i) {
      return "<div class=\"b-dot l" + i + (i <= lvl ? " on" : "") + "\" onclick=\"setBurnout(" + c.id + ",'" + k + "'," + i + ")\"></div>";
    }).join("");
    return "<div class=\"burnout-row\">" +
      "<span class=\"burnout-lbl\">" + k + "</span>" +
      "<div class=\"burnout-dots\">" + dots + "</div>" +
      "<span class=\"behavior-remove\" onclick=\"removeBurnout(" + c.id + ",'" + k + "')\">×</span>" +
    "</div>";
  }).join("");
  return "<div class=\"section-card\">" +
    "<div class=\"section-title\">📊 Análise de Produtividade</div>" +
    "<div class=\"burnout-table\">" + rows + "</div>" +
    "<div class=\"burnout-legend\" style=\"margin-top:10px\">" +
      "<span class=\"b-leg\"><span class=\"b-leg-dot\" style=\"background:#f4564e\"></span>Baixo</span>" +
      "<span class=\"b-leg\"><span class=\"b-leg-dot\" style=\"background:#f5a623\"></span>Médio</span>" +
      "<span class=\"b-leg\"><span class=\"b-leg-dot\" style=\"background:#22c77a\"></span>Alto</span>" +
    "</div>" +
    "<div class=\"tag-add-row\" style=\"margin-top:12px\">" +
      "<input class=\"tag-input\" id=\"burn-inp-" + c.id + "\" placeholder=\"Novo indicador...\" onkeydown=\"if(event.key==='Enter') addBurnout(" + c.id + ",'burn-inp-" + c.id + "')\" />" +
      "<button class=\"tag-add-btn\" onclick=\"addBurnout(" + c.id + ",'burn-inp-" + c.id + "')\">+</button>" +
    "</div>" +
  "</div>";
}

function buildSystemCard(c) {
  return "<div class=\"section-card\" style=\"margin-bottom:16px\">" +
    "<div class=\"section-title\">⚙️ Melhorias Sistêmicas</div>" +
    "<textarea class=\"big-textarea\" placeholder=\"Melhorias de processo, sistema ou estrutura...\" onchange=\"saveField(" + c.id + ",'systemImprove',this.value)\">" + c.systemImprove + "</textarea>" +
  "</div>";
}

function buildObsCard(c) {
  const entries = c.observations.slice().reverse().map(function (o) {
    const deltaClass = o.delta === "up" ? "d-up" : o.delta === "down" ? "d-down" : "d-same";
    const deltaLabel = o.delta === "up" ? "↑ Melhora" : o.delta === "down" ? "↓ Piora" : "→ Estável";
    return "<div class=\"obs-entry\">" +
      "<div class=\"obs-meta\"><span class=\"obs-date\">" + o.date + "</span><span class=\"obs-delta " + deltaClass + "\">" + deltaLabel + "</span></div>" +
      "<div class=\"obs-text-body\">" + o.text + "</div>" +
    "</div>";
  }).join("");
  return "<div class=\"section-card\" style=\"margin-bottom:32px\">" +
    "<div class=\"section-title\">💬 Observações & Feedback</div>" +
    "<div class=\"obs-list\">" + (entries || "<p style=\"font-size:12px;color:var(--text3)\">Nenhuma observação ainda.</p>") + "</div>" +
    "<hr class=\"divider\" />" +
    "<textarea class=\"big-textarea\" id=\"obs-txt-" + c.id + "\" placeholder=\"Nova observação de feedback...\"></textarea>" +
    "<div class=\"obs-controls\">" +
      "<select class=\"delta-select\" id=\"obs-delta-" + c.id + "\">" +
        "<option value=\"up\">↑ Melhora</option>" +
        "<option value=\"same\">→ Estável</option>" +
        "<option value=\"down\">↓ Piora</option>" +
      "</select>" +
      "<button class=\"save-btn\" style=\"margin-left:auto\" onclick=\"saveObs(" + c.id + ")\">💾 Salvar Observação</button>" +
    "</div>" +
  "</div>";
}

/* =========================================
   AÇÕES — MÉTRICAS / CAMPOS
   ========================================= */

function saveMetric(id, field, val) {
  collabs.find(function (x) { return x.id === id; }).metrics[field] = val;
  saveData();
}

function saveField(id, field, val) {
  collabs.find(function (x) { return x.id === id; })[field] = val;
  saveData();
}

/* =========================================
   AÇÕES — CHECKLIST
   ========================================= */

function toggleCheck(id, i) {
  const c = collabs.find(function (x) { return x.id === id; });
  c.stepsChecked[i] = !c.stepsChecked[i];
  const done  = c.stepsChecked.filter(Boolean).length;
  const total = c.stepsChecked.length;
  c.score = total === 0 ? 0 : Math.round((done / total) * 100);
  openDetail(id);
}

function addStep(id) {
  const inp = document.getElementById("step-inp-" + id);
  if (!inp || !inp.value.trim()) { return; }
  const c = collabs.find(function (x) { return x.id === id; });
  c.steps.push(inp.value.trim());
  c.stepsChecked.push(false);
  openDetail(id);
}

function removeStep(id, i) {
  const c = collabs.find(function (x) { return x.id === id; });
  c.steps.splice(i, 1);
  c.stepsChecked.splice(i, 1);
  openDetail(id);
}

/* =========================================
   AÇÕES — TAGS / COMPORTAMENTO / PRODUTIVIDADE
   ========================================= */

function toggleTag(id, field, key) {
  const c = collabs.find(function (x) { return x.id === id; });
  c[field][key] = !c[field][key];
  openDetail(id);
}

function removeTag(id, field, key) {
  const c = collabs.find(function (x) { return x.id === id; });
  delete c[field][key];
  openDetail(id);
}

function addTag(id, field, inputId) {
  const inp = document.getElementById(inputId);
  if (!inp || !inp.value.trim()) { return; }
  const c   = collabs.find(function (x) { return x.id === id; });
  const key = inp.value.trim();
  if (!Object.prototype.hasOwnProperty.call(c[field], key)) { c[field][key] = false; }
  openDetail(id);
}

function toggleBehavior(id, key) {
  const c = collabs.find(function (x) { return x.id === id; });
  c.behaviors[key] = !c.behaviors[key];
  openDetail(id);
}

function removeBehavior(id, key) {
  const c = collabs.find(function (x) { return x.id === id; });
  delete c.behaviors[key];
  openDetail(id);
}

function addBehavior(id, inputId) {
  const inp = document.getElementById(inputId);
  if (!inp || !inp.value.trim()) { return; }
  const c   = collabs.find(function (x) { return x.id === id; });
  const key = inp.value.trim();
  if (!Object.prototype.hasOwnProperty.call(c.behaviors, key)) { c.behaviors[key] = false; }
  openDetail(id);
}

function setBurnout(id, key, val) {
  const c = collabs.find(function (x) { return x.id === id; });
  c.burnout[key] = c.burnout[key] === val ? val - 1 : val;
  openDetail(id);
}

function removeBurnout(id, key) {
  const c = collabs.find(function (x) { return x.id === id; });
  delete c.burnout[key];
  openDetail(id);
}

function addBurnout(id, inputId) {
  const inp = document.getElementById(inputId);
  if (!inp || !inp.value.trim()) { return; }
  const c   = collabs.find(function (x) { return x.id === id; });
  const key = inp.value.trim();
  if (!Object.prototype.hasOwnProperty.call(c.burnout, key)) { c.burnout[key] = 0; }
  openDetail(id);
}

/* =========================================
   AÇÕES — OBSERVAÇÕES
   ========================================= */

function saveObs(id) {
  const c   = collabs.find(function (x) { return x.id === id; });
  const txt = document.getElementById("obs-txt-" + id).value.trim();
  if (!txt) { return; }
  const delta = document.getElementById("obs-delta-" + id).value;
  c.observations.push({ date: today(), text: txt, delta: delta });
  openDetail(id);
}

/* =========================================
   EXCLUIR COLABORADOR
   ========================================= */

function confirmDelete(id) {
  const c = collabs.find(function (x) { return x.id === id; });
  document.getElementById("delete-modal-name").textContent = c.name;
  document.getElementById("delete-modal-overlay").className = "modal-overlay open";
  document.getElementById("confirm-delete-btn").onclick = function () { deleteCollab(id); };
}

function closeDeleteModal() {
  document.getElementById("delete-modal-overlay").className = "modal-overlay";
}

function deleteCollab(id) {
  collabs = collabs.filter(function (x) { return x.id !== id; });
  closeDeleteModal();
  if (activeId === id) {
    activeId = null;
    document.getElementById("main-panel").innerHTML =
      "<div class=\"empty-state\">" +
        "<div class=\"empty-icon\">👥</div>" +
        "<h3>Selecione um colaborador</h3>" +
        "<p>Clique em um nome na lista ao lado para ver o perfil completo de performance e PDI.</p>" +
      "</div>";
  }
  renderList(document.getElementById("search-input").value);
  saveData();
}

/* =========================================
   MODAL — NOVO COLABORADOR
   ========================================= */

function openModal()  { document.getElementById("modal-overlay").className = "modal-overlay open"; }
function closeModal() { document.getElementById("modal-overlay").className = "modal-overlay"; }

function addCollab() {
  const name    = document.getElementById("inp-name").value.trim();
  if (!name) { return; }
  const role    = document.getElementById("inp-role").value.trim();
  const goal    = document.getElementById("inp-goal").value.trim();
  const strong  = document.getElementById("inp-strong").value.trim();
  const admDate = document.getElementById("inp-admission").value;
  const metas   = parseInt(document.getElementById("inp-metas").value, 10) || 0;
  let admFormatted = "";
  if (admDate) {
    const parts = admDate.split("-");
    admFormatted = parts[2] + "/" + parts[1] + "/" + parts[0];
  }
  collabs.push({
    id: Date.now(),
    name: name,
    role: role || "Colaborador",
    initials: name.split(" ").slice(0, 2).map(function (n) { return n[0]; }).join("").toUpperCase(),
    colorIdx: collabs.length,
    goal: goal || "A definir",
    score: 0,
    admissionDate: admFormatted,
    metasBatidas: metas,
    metrics: { maxAtt: "0", tma: "—", tme: "—", avgDay: "0" },
    strong: strong ? strong.split(",").map(function (s) { return s.trim(); }).filter(Boolean) : [],
    difficulties: {
      "Não compreender o processo": false,
      "Dificuldade em finalizar": false,
      "Agilidade": false,
      "Complexidade": false,
      "Falta de treinamento": false
    },
    improvements: {
      "Finalizações": false,
      "Tempo de resposta": false,
      "Avaliações": false,
      "Forma de atender": false,
      "Qualidade de atendimento": false
    },
    steps: [],
    stepsChecked: [],
    systemImprove: "",
    behaviors: {
      "Atrasos": false,
      "Procedimento incorreto": false,
      "Desmotivação aparente": false
    },
    burnout: { "Foco": 0, "Entrega no prazo": 0, "Volume de tarefas": 0 },
    observations: []
  });
  closeModal();
  ["inp-name", "inp-role", "inp-goal", "inp-strong", "inp-admission", "inp-metas"].forEach(function (elId) {
    document.getElementById(elId).value = "";
  });
  renderList();
  saveData();
}

/* =========================================
   EDITAR COLABORADOR
   ========================================= */

function openEditModal(id) {
  const c = collabs.find(function (x) { return x.id === id; });
  document.getElementById("edit-inp-name").value   = c.name;
  document.getElementById("edit-inp-role").value   = c.role;
  document.getElementById("edit-inp-goal").value   = c.goal;
  document.getElementById("edit-inp-strong").value = (c.strong || []).join(", ");
  document.getElementById("edit-inp-metas").value  = c.metasBatidas || 0;
  if (c.admissionDate) {
    const parts = c.admissionDate.split("/");
    document.getElementById("edit-inp-admission").value = parts[2] + "-" + parts[1] + "-" + parts[0];
  } else {
    document.getElementById("edit-inp-admission").value = "";
  }
  document.getElementById("edit-save-btn").onclick = function () { saveEdit(id); };
  document.getElementById("edit-modal-overlay").className = "modal-overlay open";
}

function closeEditModal() {
  document.getElementById("edit-modal-overlay").className = "modal-overlay";
}

function saveEdit(id) {
  const c    = collabs.find(function (x) { return x.id === id; });
  const name = document.getElementById("edit-inp-name").value.trim();
  if (!name) { return; }
  const admDate = document.getElementById("edit-inp-admission").value;
  if (admDate) {
    const parts = admDate.split("-");
    c.admissionDate = parts[2] + "/" + parts[1] + "/" + parts[0];
  }
  c.name         = name;
  c.role         = document.getElementById("edit-inp-role").value.trim() || c.role;
  c.goal         = document.getElementById("edit-inp-goal").value.trim() || c.goal;
  c.strong       = document.getElementById("edit-inp-strong").value.split(",").map(function (s) { return s.trim(); }).filter(Boolean);
  c.metasBatidas = parseInt(document.getElementById("edit-inp-metas").value, 10) || 0;
  c.initials     = name.split(" ").slice(0, 2).map(function (n) { return n[0]; }).join("").toUpperCase();
  closeEditModal();
  saveData();
  openDetail(id);
}

/* =========================================
   INICIALIZAÇÃO
   ========================================= */

document.getElementById("modal-overlay").addEventListener("click", function (e) {
  if (e.target === this) { closeModal(); }
});
document.getElementById("delete-modal-overlay").addEventListener("click", function (e) {
  if (e.target === this) { closeDeleteModal(); }
});
document.getElementById("edit-modal-overlay").addEventListener("click", function (e) {
  if (e.target === this) { closeEditModal(); }
});

renderList();
