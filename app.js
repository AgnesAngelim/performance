/* jshint esversion: 6 */

// =========================================
//   FIREBASE — inicialização via CDN (compat)
// =========================================

const firebaseConfig = {
  apiKey: "AIzaSyDzcLX5QbvJG5Ht7lNA42NK6fO1VtudLfg",
  authDomain: "performance-7be32.firebaseapp.com",
  projectId: "performance-7be32",
  storageBucket: "performance-7be32.firebasestorage.app",
  messagingSenderId: "150904137101",
  appId: "1:150904137101:web:d3d324a4671ca480eb09c4",
  measurementId: "G-2YX8NQ49DW"
};

firebase.initializeApp(firebaseConfig);
const db   = firebase.firestore();
const auth = firebase.auth();
const COLLECTION = "collaborators";

/* =========================================
   AUTENTICAÇÃO
   ========================================= */

// Monitora estado de login — só exibe o app se autenticado
auth.onAuthStateChanged(function (user) {
  if (user) {
    document.getElementById("login-screen").style.display  = "none";
    document.getElementById("app-wrapper").style.display   = "block";
    loadData();
  } else {
    document.getElementById("login-screen").style.display  = "flex";
    document.getElementById("app-wrapper").style.display   = "none";
  }
});

function doLogin() {
  const email = document.getElementById("login-email").value.trim();
  const pass  = document.getElementById("login-pass").value;
  const err   = document.getElementById("login-error");
  err.textContent = "";
  if (!email || !pass) { err.textContent = "Preencha e-mail e senha."; return; }

  auth.signInWithEmailAndPassword(email, pass)
    .catch(function (e) {
      if (e.code === "auth/user-not-found" || e.code === "auth/wrong-password" || e.code === "auth/invalid-credential") {
        err.textContent = "E-mail ou senha incorretos.";
      } else {
        err.textContent = "Erro: " + e.message;
      }
    });
}

function doLogout() {
  auth.signOut();
}

// Permite pressionar Enter nos campos de login
function loginKeydown(e) {
  if (e.key === "Enter") { doLogin(); }
}


/* =========================================
   CORES DOS AVATARES
   ========================================= */

const AVCOLORS = [
  { bg: "rgba(79,142,247,0.15)",  color: "#4f8ef7" },
  { bg: "rgba(34,199,122,0.15)",  color: "#22c77a" },
  { bg: "rgba(245,166,35,0.15)", color: "#f5a623" },
  { bg: "rgba(196,88,247,0.15)", color: "#c458f7" },
  { bg: "rgba(244,86,78,0.15)",  color: "#f4564e" },
  { bg: "rgba(32,201,209,0.15)", color: "#20c9d1" },
];

let activeId = null;
let collabs  = [];

/* =========================================
   PERSISTÊNCIA — FIRESTORE
   ========================================= */

// Carrega todos os colaboradores do Firestore ao iniciar
function loadData() {
  showLoadingState();
  db.collection(COLLECTION)
    .orderBy("createdAt", "asc")
    .get()
    .then(function (snapshot) {
      collabs = [];
      snapshot.forEach(function (doc) {
        const data = doc.data();
        data.id = doc.id; // usa o ID do Firestore
        collabs.push(data);
      });
      renderList();
      hideLoadingState();
    })
    .catch(function (err) {
      console.error("Erro ao carregar dados:", err);
      showToast("Erro ao carregar dados do servidor.");
      hideLoadingState();
    });
}

// Salva ou atualiza um colaborador no Firestore
function saveData(collab) {
  if (!collab) {
    // Se chamado sem argumento, salva o colaborador ativo (compatibilidade)
    if (activeId !== null) {
      const c = collabs.find(function (x) { return x.id === activeId; });
      if (c) { saveData(c); }
    }
    return;
  }
  const id   = collab.id;
  const data = Object.assign({}, collab);
  delete data.id; // o ID fica no documento, não no campo

  db.collection(COLLECTION)
    .doc(String(id))
    .set(data)
    .catch(function (err) {
      console.error("Erro ao salvar:", err);
      showToast("Erro ao salvar. Verifique a conexão.");
    });
}

// Remove um colaborador do Firestore
function deleteFromFirestore(id) {
  db.collection(COLLECTION)
    .doc(String(id))
    .delete()
    .catch(function (err) {
      console.error("Erro ao excluir:", err);
      showToast("Erro ao excluir colaborador.");
    });
}

/* =========================================
   ESTADOS DE CARREGAMENTO
   ========================================= */

function showLoadingState() {
  const list = document.getElementById("collab-list");
  if (list) {
    list.innerHTML = "<div style='padding:24px 16px;text-align:center;color:var(--text3);font-size:13px'>⏳ Carregando...</div>";
  }
}

function hideLoadingState() {
  // renderList() já sobrescreve o conteúdo
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
        "<button class=\"c-delete-btn\" onclick=\"event.stopPropagation();confirmDelete('" + c.id + "')\">" +
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
    buildFeedbackCard(c) +
    buildObsCard(c) +
    "<div class=\"save-report-bar\"><button class=\"save-report-btn-lg\" onclick=\"saveReport('" + c.id + "')\">💾 Salvar Relatório</button></div>";
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
    "<div class=\"header-btn-group\">" +
      "<div class=\"score-display\">" +
        "<div class=\"score-number\" style=\"color:" + scoreColor(c.score) + "\">" + c.score + "%</div>" +
        "<div class=\"score-label\">" + scoreLabel(c.score) + "</div>" +
      "</div>" +
      "<div class=\"metas-display\">" +
        "<div class=\"metas-number\">" + (c.metasBatidas || 0) + "</div>" +
        "<div class=\"metas-label\">metas batidas</div>" +
      "</div>" +
      "<button class=\"edit-panel-btn\" onclick=\"openEditModal('" + c.id + "')\">✏️ Editar</button>" +
      "<button class=\"delete-panel-btn\" onclick=\"confirmDelete('" + c.id + "')\">" +
        "<svg width=\"15\" height=\"15\" viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"2.5\">" +
        "<polyline points=\"3 6 5 6 21 6\"/><path d=\"M19 6l-1 14H6L5 6\"/><path d=\"M10 11v6\"/><path d=\"M14 11v6\"/><path d=\"M9 6V4h6v2\"/>" +
        "</svg> Excluir" +
      "</button>" +
      "<button class=\"history-btn\" onclick=\"openHistory('" + c.id + "')\">📋 Histórico</button>" +
    "</div>" +
  "</div>";
}

function buildMetrics(c) {
  const q = c.metrics.quality !== undefined ? c.metrics.quality : "—";
  return "<div class=\"metrics-row\">" +
    "<div class=\"metric-box\"><div class=\"metric-lbl\">🏆 Máx. Atendimentos</div>" +
    "<input class=\"metric-input\" value=\"" + c.metrics.maxAtt + "\" onchange=\"saveMetric('" + c.id + "','maxAtt',this.value)\" />" +
    "<div class=\"metric-sub\">recorde pessoal</div></div>" +

    "<div class=\"metric-box\"><div class=\"metric-lbl\">⏱ TMA</div>" +
    "<input class=\"metric-input\" value=\"" + c.metrics.tma + "\" onchange=\"saveMetric('" + c.id + "','tma',this.value)\" />" +
    "<div class=\"metric-sub\">tempo médio atend.</div></div>" +

    "<div class=\"metric-box\"><div class=\"metric-lbl\">⏳ TME</div>" +
    "<input class=\"metric-input\" value=\"" + c.metrics.tme + "\" onchange=\"saveMetric('" + c.id + "','tme',this.value)\" />" +
    "<div class=\"metric-sub\">tempo médio espera</div></div>" +

    "<div class=\"metric-box\"><div class=\"metric-lbl\">📊 Média / Dia</div>" +
    "<input class=\"metric-input\" value=\"" + c.metrics.avgDay + "\" onchange=\"saveMetric('" + c.id + "','avgDay',this.value)\" />" +
    "<div class=\"metric-sub\">atendimentos/dia</div></div>" +

    "<div class=\"metric-box\"><div class=\"metric-lbl\">Qualidade</div>" +
    "<input class=\"metric-input\" value=\"" + q + "\" onchange=\"saveMetric('" + c.id + "','quality',this.value)\" /></div>" +

    "<div class=\"metric-box\"><div class=\"metric-lbl\">🔝 Csat</div>"+
    "<input class=\"metric-input\" value=\"" + (c.metrics.csat || "—") + "\" onchange=\"saveMetric('" + c.id + "','csat',this.value)\" /></div>" +
    "</div>"
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
      "<div class=\"check-box " + done + "\" onclick=\"toggleCheck('" + c.id + "'," + i + ")\">" +
        "<svg viewBox=\"0 0 12 12\"><polyline points=\"1.5,6 4.5,9 10.5,3\"/></svg>" +
      "</div>" +
      "<span class=\"check-lbl " + done + "\">" + s + "</span>" +
      "<span style=\"cursor:pointer;color:var(--text3);font-size:16px;line-height:1;padding:0 4px\" onclick=\"removeStep('" + c.id + "'," + i + ")\">×</span>" +
    "</div>";
  }).join("");
  return "<div class=\"section-card full\">" +
    "<div class=\"section-title\">✅ Passos para alcançar o objetivo</div>" +
    "<div class=\"check-list\">" + rows + "</div>" +
    "<div class=\"add-step-row\">" +
      "<input class=\"mini-input\" id=\"step-inp-" + c.id + "\" placeholder=\"Adicionar novo passo...\" onkeydown=\"if(event.key==='Enter') addStep('" + c.id + "')\" />" +
      "<button class=\"mini-btn\" onclick=\"addStep('" + c.id + "')\">+</button>" +
    "</div>" +
  "</div>";
}

function buildDiffCard(c) {
  const tags = Object.keys(c.difficulties).map(function (k) {
    const v = c.difficulties[k];
    return "<span class=\"tag " + (v ? "t-bad" : "") + "\" onclick=\"toggleTag('" + c.id + "','difficulties','" + k + "')\">" +
      (v ? "● " : "") + k +
      "<span class=\"tag-remove\" onclick=\"event.stopPropagation();removeTag('" + c.id + "','difficulties','" + k + "')\">×</span>" +
    "</span>";
  }).join("");
  return "<div class=\"section-card\">" +
    "<div class=\"section-title\">⚠️ Dificuldades localizadas</div>" +
    "<div class=\"tags-wrap\">" + tags + "</div>" +
    "<div class=\"tag-add-row\">" +
      "<input class=\"tag-input\" id=\"diff-inp-" + c.id + "\" placeholder=\"Nova dificuldade...\" onkeydown=\"if(event.key==='Enter') addTag('" + c.id + "','difficulties','diff-inp-" + c.id + "')\" />" +
      "<button class=\"tag-add-btn\" onclick=\"addTag('" + c.id + "','difficulties','diff-inp-" + c.id + "')\">+</button>" +
    "</div>" +
  "</div>";
}

function buildImprovCard(c) {
  const tags = Object.keys(c.improvements).map(function (k) {
    const v = c.improvements[k];
    return "<span class=\"tag " + (v ? "t-good" : "") + "\" onclick=\"toggleTag('" + c.id + "','improvements','" + k + "')\">" +
      (v ? "● " : "") + k +
      "<span class=\"tag-remove\" onclick=\"event.stopPropagation();removeTag('" + c.id + "','improvements','" + k + "')\">×</span>" +
    "</span>";
  }).join("");
  return "<div class=\"section-card\">" +
    "<div class=\"section-title\">📈 Pontos de melhoria</div>" +
    "<div class=\"tags-wrap\">" + tags + "</div>" +
    "<div class=\"tag-add-row\">" +
      "<input class=\"tag-input\" id=\"impr-inp-" + c.id + "\" placeholder=\"Novo ponto de melhoria...\" onkeydown=\"if(event.key==='Enter') addTag('" + c.id + "','improvements','impr-inp-" + c.id + "')\" />" +
      "<button class=\"tag-add-btn\" onclick=\"addTag('" + c.id + "','improvements','impr-inp-" + c.id + "')\">+</button>" +
    "</div>" +
  "</div>";
}

function buildBehaviorCard(c) {
  const rows = Object.keys(c.behaviors).map(function (k) {
    const v = c.behaviors[k];
    return "<div class=\"behavior-row " + (v ? "flagged" : "") + "\" onclick=\"toggleBehavior('" + c.id + "','" + k + "')\">" +
      "<div class=\"behavior-dot\"></div>" + k +
      "<span class=\"behavior-remove\" onclick=\"event.stopPropagation();removeBehavior('" + c.id + "','" + k + "')\">×</span>" +
    "</div>";
  }).join("");
  return "<div class=\"section-card\">" +
    "<div class=\"section-title\">🚨 Comportamento Operacional</div>" +
    "<div class=\"behavior-list\">" + rows + "</div>" +
    "<div class=\"tag-add-row\">" +
      "<input class=\"tag-input\" id=\"beh-inp-" + c.id + "\" placeholder=\"Novo comportamento...\" onkeydown=\"if(event.key==='Enter') addBehavior('" + c.id + "','beh-inp-" + c.id + "')\" />" +
      "<button class=\"tag-add-btn\" onclick=\"addBehavior('" + c.id + "','beh-inp-" + c.id + "')\">+</button>" +
    "</div>" +
  "</div>";
}

function buildBurnoutCard(c) {
  const rows = Object.keys(c.burnout).map(function (k) {
    const lvl  = c.burnout[k];
    const dots = [1, 2, 3].map(function (i) {
      return "<div class=\"b-dot l" + i + (i <= lvl ? " on" : "") + "\" onclick=\"setBurnout('" + c.id + "','" + k + "'," + i + ")\"></div>";
    }).join("");
    return "<div class=\"burnout-row\">" +
      "<span class=\"burnout-lbl\">" + k + "</span>" +
      "<div class=\"burnout-dots\">" + dots + "</div>" +
      "<span class=\"behavior-remove\" onclick=\"removeBurnout('" + c.id + "','" + k + "')\">×</span>" +
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
      "<input class=\"tag-input\" id=\"burn-inp-" + c.id + "\" placeholder=\"Novo indicador...\" onkeydown=\"if(event.key==='Enter') addBurnout('" + c.id + "','burn-inp-" + c.id + "')\" />" +
      "<button class=\"tag-add-btn\" onclick=\"addBurnout('" + c.id + "','burn-inp-" + c.id + "')\">+</button>" +
    "</div>" +
  "</div>";
}

function buildSystemCard(c) {
  return "<div class=\"section-card\" style=\"margin-bottom:16px\">" +
    "<div class=\"section-title\">⚙️ Melhorias Sistêmicas</div>" +
    "<textarea class=\"big-textarea\" placeholder=\"Melhorias de processo, sistema ou estrutura...\" onchange=\"saveField('" + c.id + "','systemImprove',this.value)\">" + c.systemImprove + "</textarea>" +
  "</div>";
}

function buildFeedbackCard(c) {
  const items = (c.feedbacks || []).slice().reverse().map(function (o, ri) {
    const i = (c.feedbacks.length - 1) - ri;
    const deltaClass = o.delta === "up" ? "d-up" : o.delta === "down" ? "d-down" : "d-same";
    const deltaLabel = o.delta === "up" ? "↑ Melhora" : o.delta === "down" ? "↓ Piora" : "→ Estável";
    return "<div class=\"obs-entry\">" +
      "<div class=\"obs-meta\">" +
        "<span class=\"obs-date\">" + o.date + "</span>" +
        "<span class=\"obs-delta " + deltaClass + "\">" + deltaLabel + "</span>" +
        "<button class=\"obs-edit-btn\" onclick=\"editFeedback('" + c.id + "'," + i + ")\">✏️</button>" +
      "</div>" +
      "<div class=\"obs-text-body\" id=\"fb-body-" + c.id + "-" + i + "\">" + o.text + "</div>" +
      "<div class=\"obs-edit-row\" id=\"fb-edit-" + c.id + "-" + i + "\" style=\"display:none\">" +
        "<textarea class=\"big-textarea\" id=\"fb-edit-txt-" + c.id + "-" + i + "\">" + o.text + "</textarea>" +
        "<div class=\"obs-controls\">" +
          "<select class=\"delta-select\" id=\"fb-edit-delta-" + c.id + "-" + i + "\">" +
            "<option value=\"up\"" + (o.delta === "up" ? " selected" : "") + ">↑ Melhora</option>" +
            "<option value=\"same\"" + (o.delta === "same" ? " selected" : "") + ">→ Estável</option>" +
            "<option value=\"down\"" + (o.delta === "down" ? " selected" : "") + ">↓ Piora</option>" +
          "</select>" +
          "<button class=\"save-btn\" style=\"margin-left:8px\" onclick=\"saveFeedbackEdit('" + c.id + "'," + i + ")\">Salvar</button>" +
          "<button class=\"cancel-btn\" style=\"margin-left:6px\" onclick=\"cancelFeedbackEdit('" + c.id + "'," + i + ")\">Cancelar</button>" +
        "</div>" +
      "</div>" +
    "</div>";
  }).join("");
  return "<div class=\"section-card\" style=\"margin-bottom:16px\">" +
    "<div class=\"section-title\">💬 Feedback</div>" +
    "<div class=\"obs-list\">" + (items || "<p style=\"font-size:12px;color:var(--text3)\">Nenhum feedback ainda.</p>") + "</div>" +
    "<hr class=\"divider\" />" +
    "<textarea class=\"big-textarea\" id=\"fb-txt-" + c.id + "\" placeholder=\"Novo feedback...\"></textarea>" +
    "<div class=\"obs-controls\">" +
      "<select class=\"delta-select\" id=\"fb-delta-" + c.id + "\">" +
        "<option value=\"up\">↑ Melhora</option>" +
        "<option value=\"same\">→ Estável</option>" +
        "<option value=\"down\">↓ Piora</option>" +
      "</select>" +
      "<button class=\"save-btn\" style=\"margin-left:auto\" onclick=\"saveFeedback('" + c.id + "')\">💾 Salvar</button>" +
    "</div>" +
  "</div>";
}

function buildObsCard(c) {
  const items = (c.observations || []).slice().reverse().map(function (o, ri) {
    const i = (c.observations.length - 1) - ri;
    return "<div class=\"obs-entry\">" +
      "<div class=\"obs-meta\">" +
        "<span class=\"obs-date\">" + o.date + "</span>" +
        "<button class=\"obs-edit-btn\" onclick=\"editObs('" + c.id + "'," + i + ")\">✏️</button>" +
      "</div>" +
      "<div class=\"obs-text-body\" id=\"obs-body-" + c.id + "-" + i + "\">" + o.text + "</div>" +
      "<div class=\"obs-edit-row\" id=\"obs-edit-" + c.id + "-" + i + "\" style=\"display:none\">" +
        "<textarea class=\"big-textarea\" id=\"obs-edit-txt-" + c.id + "-" + i + "\">" + o.text + "</textarea>" +
        "<div class=\"obs-controls\">" +
          "<button class=\"save-btn\" onclick=\"saveObsEdit('" + c.id + "'," + i + ")\">Salvar</button>" +
          "<button class=\"cancel-btn\" style=\"margin-left:6px\" onclick=\"cancelObsEdit('" + c.id + "'," + i + ")\">Cancelar</button>" +
        "</div>" +
      "</div>" +
    "</div>";
  }).join("");
  return "<div class=\"section-card\" style=\"margin-bottom:32px\">" +
    "<div class=\"section-title\">📝 Observações</div>" +
    "<div class=\"obs-list\">" + (items || "<p style=\"font-size:12px;color:var(--text3)\">Nenhuma observação ainda.</p>") + "</div>" +
    "<hr class=\"divider\" />" +
    "<textarea class=\"big-textarea\" id=\"obs-txt-" + c.id + "\" placeholder=\"Nova observação...\"></textarea>" +
    "<div class=\"obs-controls\">" +
      "<button class=\"save-btn\" style=\"margin-left:auto\" onclick=\"saveObs('" + c.id + "')\">💾 Salvar</button>" +
    "</div>" +
  "</div>";
}

/* =========================================
   AÇÕES — MÉTRICAS / CAMPOS
   ========================================= */

function saveMetric(id, field, val) {
  const c = collabs.find(function (x) { return x.id === id; });
  c.metrics[field] = val;
  saveData(c);
}

function saveField(id, field, val) {
  const c = collabs.find(function (x) { return x.id === id; });
  c[field] = val;
  saveData(c);
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
  saveData(c);
  openDetail(id);
}

function addStep(id) {
  const inp = document.getElementById("step-inp-" + id);
  if (!inp || !inp.value.trim()) { return; }
  const c = collabs.find(function (x) { return x.id === id; });
  c.steps.push(inp.value.trim());
  c.stepsChecked.push(false);
  saveData(c);
  openDetail(id);
}

function removeStep(id, i) {
  const c = collabs.find(function (x) { return x.id === id; });
  c.steps.splice(i, 1);
  c.stepsChecked.splice(i, 1);
  saveData(c);
  openDetail(id);
}

/* =========================================
   AÇÕES — TAGS / COMPORTAMENTO / PRODUTIVIDADE
   ========================================= */

function toggleTag(id, field, key) {
  const c = collabs.find(function (x) { return x.id === id; });
  c[field][key] = !c[field][key];
  saveData(c);
  openDetail(id);
}

function removeTag(id, field, key) {
  const c = collabs.find(function (x) { return x.id === id; });
  delete c[field][key];
  saveData(c);
  openDetail(id);
}

function addTag(id, field, inputId) {
  const inp = document.getElementById(inputId);
  if (!inp || !inp.value.trim()) { return; }
  const c   = collabs.find(function (x) { return x.id === id; });
  const key = inp.value.trim();
  if (!Object.prototype.hasOwnProperty.call(c[field], key)) { c[field][key] = false; }
  saveData(c);
  openDetail(id);
}

function toggleBehavior(id, key) {
  const c = collabs.find(function (x) { return x.id === id; });
  c.behaviors[key] = !c.behaviors[key];
  saveData(c);
  openDetail(id);
}

function removeBehavior(id, key) {
  const c = collabs.find(function (x) { return x.id === id; });
  delete c.behaviors[key];
  saveData(c);
  openDetail(id);
}

function addBehavior(id, inputId) {
  const inp = document.getElementById(inputId);
  if (!inp || !inp.value.trim()) { return; }
  const c   = collabs.find(function (x) { return x.id === id; });
  const key = inp.value.trim();
  if (!Object.prototype.hasOwnProperty.call(c.behaviors, key)) { c.behaviors[key] = false; }
  saveData(c);
  openDetail(id);
}

function setBurnout(id, key, val) {
  const c = collabs.find(function (x) { return x.id === id; });
  c.burnout[key] = c.burnout[key] === val ? val - 1 : val;
  saveData(c);
  openDetail(id);
}

function removeBurnout(id, key) {
  const c = collabs.find(function (x) { return x.id === id; });
  delete c.burnout[key];
  saveData(c);
  openDetail(id);
}

function addBurnout(id, inputId) {
  const inp = document.getElementById(inputId);
  if (!inp || !inp.value.trim()) { return; }
  const c   = collabs.find(function (x) { return x.id === id; });
  const key = inp.value.trim();
  if (!Object.prototype.hasOwnProperty.call(c.burnout, key)) { c.burnout[key] = 0; }
  saveData(c);
  openDetail(id);
}

/* =========================================
   AÇÕES — FEEDBACK E OBSERVAÇÕES
   ========================================= */

function saveFeedback(id) {
  const c   = collabs.find(function (x) { return x.id === id; });
  const txt = document.getElementById("fb-txt-" + id).value.trim();
  if (!txt) { return; }
  if (!c.feedbacks) { c.feedbacks = []; }
  const delta = document.getElementById("fb-delta-" + id).value;
  c.feedbacks.push({ date: today(), text: txt, delta: delta });
  saveData(c);
  openDetail(id);
}

function editFeedback(id, i) {
  document.getElementById("fb-body-" + id + "-" + i).style.display = "none";
  document.getElementById("fb-edit-" + id + "-" + i).style.display = "block";
}

function cancelFeedbackEdit(id, i) {
  document.getElementById("fb-body-" + id + "-" + i).style.display = "block";
  document.getElementById("fb-edit-" + id + "-" + i).style.display = "none";
}

function saveFeedbackEdit(id, i) {
  const c   = collabs.find(function (x) { return x.id === id; });
  const txt = document.getElementById("fb-edit-txt-" + id + "-" + i).value.trim();
  if (!txt) { return; }
  c.feedbacks[i].text  = txt;
  c.feedbacks[i].delta = document.getElementById("fb-edit-delta-" + id + "-" + i).value;
  saveData(c);
  openDetail(id);
}

function saveObs(id) {
  const c   = collabs.find(function (x) { return x.id === id; });
  const txt = document.getElementById("obs-txt-" + id).value.trim();
  if (!txt) { return; }
  if (!c.observations) { c.observations = []; }
  c.observations.push({ date: today(), text: txt });
  saveData(c);
  openDetail(id);
}

function editObs(id, i) {
  document.getElementById("obs-body-" + id + "-" + i).style.display = "none";
  document.getElementById("obs-edit-" + id + "-" + i).style.display = "block";
}

function cancelObsEdit(id, i) {
  document.getElementById("obs-body-" + id + "-" + i).style.display = "block";
  document.getElementById("obs-edit-" + id + "-" + i).style.display = "none";
}

function saveObsEdit(id, i) {
  const c   = collabs.find(function (x) { return x.id === id; });
  const txt = document.getElementById("obs-edit-txt-" + id + "-" + i).value.trim();
  if (!txt) { return; }
  c.observations[i].text = txt;
  saveData(c);
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
  deleteFromFirestore(id);
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

  // Gera ID único baseado em timestamp
  const newId = String(Date.now());

  const newCollab = {
    id: newId,
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
    observations: [],
    feedbacks: [],
    reports: [],
    createdAt: Date.now()
  };

  collabs.push(newCollab);
  saveData(newCollab);

  closeModal();
  ["inp-name", "inp-role", "inp-goal", "inp-strong", "inp-admission", "inp-metas"].forEach(function (elId) {
    document.getElementById(elId).value = "";
  });
  renderList();
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
  saveData(c);
  closeEditModal();
  openDetail(id);
}

/* =========================================
   RELATÓRIOS / HISTÓRICO
   ========================================= */

function saveReport(id) {
  const c = collabs.find(function (x) { return x.id === id; });
  if (!c.reports) { c.reports = []; }
  const now = new Date();
  const ds  = String(now.getDate()).padStart(2,"0")+"/"+String(now.getMonth()+1).padStart(2,"0")+"/"+now.getFullYear();
  const ts  = String(now.getHours()).padStart(2,"0")+":"+String(now.getMinutes()).padStart(2,"0");
  c.reports.push({
    date: ds, time: ts, score: c.score,
    steps: JSON.parse(JSON.stringify(c.steps)),
    stepsChecked: JSON.parse(JSON.stringify(c.stepsChecked)),
    difficulties: JSON.parse(JSON.stringify(c.difficulties)),
    improvements: JSON.parse(JSON.stringify(c.improvements)),
    behaviors: JSON.parse(JSON.stringify(c.behaviors)),
    burnout: JSON.parse(JSON.stringify(c.burnout)),
    systemImprove: c.systemImprove || "",
    feedbacks: JSON.parse(JSON.stringify(c.feedbacks || [])),
    observations: JSON.parse(JSON.stringify(c.observations || []))
  });
  saveData(c);
  showToast("Relatório salvo!");
}

function showToast(msg) {
  const t = document.getElementById("toast-msg");
  if (!t) { return; }
  t.textContent = msg;
  t.className   = "toast show";
  setTimeout(function () { t.className = "toast"; }, 2800);
}

function openHistory(id) {
  const c    = collabs.find(function (x) { return x.id === id; });
  const main = document.getElementById("main-panel");
  if (!c.reports || !c.reports.length) { showToast("Nenhum relatório salvo ainda."); return; }
  const list = c.reports.slice().reverse().map(function (r, ri) {
    const i = c.reports.length - 1 - ri;
    return "<div class=\"report-item\" onclick=\"openReportDetail('" + id + "'," + i + ")\"><div class=\"report-item-date\">📋 " + r.date + " às " + r.time + "</div><div class=\"report-item-score\" style=\"color:" + scoreColor(r.score) + "\">" + r.score + "%</div></div>";
  }).join("");
  main.innerHTML = "<div class=\"panel-content slide-in\"><div class=\"history-header\"><button class=\"back-btn\" onclick=\"openDetail('" + id + "')\">← Voltar</button><div class=\"history-title\">📋 Histórico — " + c.name + "</div></div><div class=\"report-list\">" + list + "</div></div>";
}

function openReportDetail(id, i) {
  const c    = collabs.find(function (x) { return x.id === id; });
  const r    = c.reports[i];
  const main = document.getElementById("main-panel");
  function tl(obj, cls) { return Object.keys(obj).map(function (k) { return "<span class=\"tag " + (obj[k] ? cls : "") + "\">" + (obj[k] ? "● " : "") + k + "</span>"; }).join("") || "<span style=\"color:var(--text3);font-size:12px\">Nenhum</span>"; }
  function bl(obj) { return Object.keys(obj).map(function (k) { return "<div class=\"behavior-row " + (obj[k] ? "flagged" : "") + "\"><div class=\"behavior-dot\"></div>" + k + "</div>"; }).join("") || "<span style=\"color:var(--text3);font-size:12px\">Nenhum</span>"; }
  function bul(obj) { return Object.keys(obj).map(function (k) { const l = obj[k]; const d = [1,2,3].map(function (d) { return "<div class=\"b-dot l" + d + (d <= l ? " on" : "") + "\"></div>"; }).join(""); return "<div class=\"burnout-row\"><span class=\"burnout-lbl\">" + k + "</span><div class=\"burnout-dots\">" + d + "</div></div>"; }).join("") || "<span style=\"color:var(--text3);font-size:12px\">Nenhum</span>"; }
  function sl(s, ch) { if (!s || !s.length) { return "<span style=\"color:var(--text3);font-size:12px\">Nenhum passo</span>"; } return s.map(function (x, idx) { const done = ch[idx] ? "done" : ""; return "<div class=\"check-row\"><div class=\"check-box " + done + "\"><svg viewBox=\"0 0 12 12\"><polyline points=\"1.5,6 4.5,9 10.5,3\"/></svg></div><span class=\"check-lbl " + done + "\">" + x + "</span></div>"; }).join(""); }
  function ol(arr) { if (!arr || !arr.length) { return "<p style=\"font-size:12px;color:var(--text3)\">Nenhum</p>"; } return arr.map(function (o) { const dc = o.delta === "up" ? "d-up" : o.delta === "down" ? "d-down" : "d-same"; const dl = o.delta === "up" ? "↑ Melhora" : o.delta === "down" ? "↓ Piora" : "→ Estável"; return "<div class=\"obs-entry\"><div class=\"obs-meta\"><span class=\"obs-date\">" + o.date + "</span>" + (o.delta ? "<span class=\"obs-delta " + dc + "\">" + dl + "</span>" : "") + "</div><div class=\"obs-text-body\">" + o.text + "</div></div>"; }).join(""); }
  main.innerHTML = "<div class=\"panel-content slide-in\"><div class=\"history-header\"><button class=\"back-btn\" onclick=\"openHistory('" + id + "')\">← Voltar</button><div class=\"history-title\">📋 Relatório de " + r.date + " às " + r.time + "</div><div class=\"report-score\" style=\"color:" + scoreColor(r.score) + "\">" + r.score + "%</div></div><div class=\"sections-grid\"><div class=\"section-card full\"><div class=\"section-title\">✅ Passos</div><div class=\"check-list\">" + sl(r.steps, r.stepsChecked) + "</div></div></div><div class=\"sections-grid\"><div class=\"section-card\"><div class=\"section-title\">⚠️ Dificuldades</div><div class=\"tags-wrap\">" + tl(r.difficulties, "t-bad") + "</div></div><div class=\"section-card\"><div class=\"section-title\">📈 Pontos de melhoria</div><div class=\"tags-wrap\">" + tl(r.improvements, "t-good") + "</div></div></div><div class=\"sections-grid\"><div class=\"section-card\"><div class=\"section-title\">🚨 Comportamento</div><div class=\"behavior-list\">" + bl(r.behaviors) + "</div></div><div class=\"section-card\"><div class=\"section-title\">📊 Produtividade</div><div class=\"burnout-table\">" + bul(r.burnout) + "</div></div></div><div class=\"section-card\" style=\"margin-bottom:16px\"><div class=\"section-title\">⚙️ Melhorias Sistêmicas</div><p class=\"report-text\">" + (r.systemImprove || "—") + "</p></div><div class=\"section-card\" style=\"margin-bottom:16px\"><div class=\"section-title\">💬 Feedback</div>" + ol(r.feedbacks) + "</div><div class=\"section-card\" style=\"margin-bottom:32px\"><div class=\"section-title\">📝 Observações</div>" + ol(r.observations) + "</div></div>";
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
