// Interface web do SofaPredict AI.
// Busca as opções em /api/opcoes, valida o confronto e mostra a previsão de /api/prever.

const BANDEIRAS = {
  "Brazil": "br", "Argentina": "ar", "France": "fr", "Germany": "de", "England": "gb-eng",
  "Spain": "es", "Italy": "it", "Uruguay": "uy", "Portugal": "pt", "Netherlands": "nl",
  "Belgium": "be", "Croatia": "hr", "Colombia": "co", "Chile": "cl", "Mexico": "mx",
  "United States": "us", "USA": "us", "Japan": "jp", "South Korea": "kr", "Korea Republic": "kr",
  "North Korea": "kp", "Morocco": "ma", "Senegal": "sn", "Nigeria": "ng", "Egypt": "eg",
  "Switzerland": "ch", "Denmark": "dk", "Sweden": "se", "Poland": "pl", "Austria": "at",
  "Scotland": "gb-sct", "Wales": "gb-wls", "Northern Ireland": "gb-nir", "Paraguay": "py",
  "Peru": "pe", "Ecuador": "ec", "Venezuela": "ve", "Bolivia": "bo", "Canada": "ca",
  "Australia": "au", "Saudi Arabia": "sa", "Iran": "ir", "Algeria": "dz", "Ghana": "gh",
  "Cameroon": "cm", "Ivory Coast": "ci", "Turkey": "tr", "Ukraine": "ua", "Czech Republic": "cz",
  "Czechia": "cz", "Norway": "no", "Greece": "gr", "Russia": "ru", "Hungary": "hu",
  "Serbia": "rs", "Romania": "ro", "Republic of Ireland": "ie", "Ireland": "ie", "Finland": "fi",
  "Slovakia": "sk", "South Africa": "za", "Qatar": "qa", "China PR": "cn", "China": "cn",
  "Costa Rica": "cr", "Panama": "pa", "Jamaica": "jm", "Honduras": "hn", "New Zealand": "nz",
  "Tunisia": "tn", "Mali": "ml", "Iceland": "is", "Slovenia": "si", "Albania": "al",
  "Georgia": "ge", "Bosnia and Herzegovina": "ba", "North Macedonia": "mk", "Bulgaria": "bg",
  "Israel": "il", "Uzbekistan": "uz", "Iraq": "iq", "United Arab Emirates": "ae", "Jordan": "jo",
  "Oman": "om", "Bahrain": "bh", "Kuwait": "kw", "Syria": "sy", "Lebanon": "lb", "India": "in",
  "Thailand": "th", "Vietnam": "vn", "Indonesia": "id", "Malaysia": "my", "Philippines": "ph",
  "El Salvador": "sv", "Guatemala": "gt", "Haiti": "ht", "Trinidad and Tobago": "tt",
  "Cuba": "cu", "Curaçao": "cw", "Suriname": "sr", "DR Congo": "cd", "Congo": "cg",
  "Burkina Faso": "bf", "Guinea": "gn", "Cape Verde": "cv", "Angola": "ao", "Zambia": "zm",
  "Uganda": "ug", "Gabon": "ga", "Benin": "bj", "Kenya": "ke", "Zimbabwe": "zw",
  "Luxembourg": "lu", "Cyprus": "cy", "Malta": "mt", "Estonia": "ee", "Latvia": "lv",
  "Lithuania": "lt", "Belarus": "by", "Kazakhstan": "kz", "Armenia": "am", "Azerbaijan": "az",
  "Moldova": "md", "Montenegro": "me", "Kosovo": "xk", "Faroe Islands": "fo", "Andorra": "ad",
  "San Marino": "sm", "Liechtenstein": "li", "Gibraltar": "gi"
};

const CLASSICOS = [
  { mandante: "Brazil", visitante: "Argentina", torneio: "Copa América", campo_neutro: "Nao", rotulo: "Brasil × Argentina" },
  { mandante: "Germany", visitante: "Netherlands", torneio: "UEFA Euro", campo_neutro: "Sim", rotulo: "Alemanha × Holanda" },
  { mandante: "England", visitante: "Scotland", torneio: "Friendly", campo_neutro: "Nao", rotulo: "Inglaterra × Escócia" },
  { mandante: "France", visitante: "Argentina", torneio: "FIFA World Cup", campo_neutro: "Sim", rotulo: "França × Argentina" },
  { mandante: "United States", visitante: "Mexico", torneio: "Gold Cup", campo_neutro: "Nao", rotulo: "EUA × México" },
  { mandante: "Japan", visitante: "South Korea", torneio: "AFC Asian Cup", campo_neutro: "Sim", rotulo: "Japão × Coreia do Sul" }
];

const CHAVE_HISTORICO = "sofapredict.historico";
const estado = { selecoes: new Set(), torneios: [], ranking: {}, torneiosRestritos: {} };

const $ = (id) => document.getElementById(id);
const esperar = (ms) => new Promise((r) => setTimeout(r, ms));

function esc(texto) {
  return String(texto ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
}

function formaHtml(seq) {
  if (!seq || !seq.length) return "";
  return `<span class="forma">${seq.map((s) => `<span class="${esc(s)}" title="${s === "V" ? "Vitória" : s === "E" ? "Empate" : "Derrota"}">${esc(s)}</span>`).join("")}</span>`;
}

function iniciais(nome) {
  const partes = String(nome || "?").split(/\s+/).filter(Boolean);
  return (partes.length > 1 ? partes[0][0] + partes[1][0] : (partes[0] || "?").slice(0, 3)).toUpperCase();
}

// ---------- Leitura do formulário ----------

function lerConfronto() {
  return {
    mandante: $("mandante").value.trim(),
    visitante: $("visitante").value.trim(),
    torneio: $("torneio").value.trim(),
    campo_neutro: document.querySelector('input[name="campo_neutro"]:checked').value
  };
}

function preencherConfronto(c) {
  $("mandante").value = c.mandante;
  $("visitante").value = c.visitante;
  $("torneio").value = c.torneio;
  document.querySelector(`input[name="campo_neutro"][value="${c.campo_neutro}"]`).checked = true;
  atualizarTime("mandante");
  atualizarTime("visitante");
  validar();
}

// ---------- Seleções: bandeira, ranking e forma ----------

function atualizarTime(lado) {
  const nome = $(lado).value.trim();
  const img = $(`flag-${lado}`);
  const sigla = $(`sigla-${lado}`);
  const codigo = BANDEIRAS[nome];
  sigla.textContent = nome ? iniciais(nome) : "?";

  if (codigo) {
    img.onerror = () => { img.classList.add("hidden"); sigla.classList.remove("hidden"); };
    img.src = `https://flagcdn.com/w160/${codigo}.png`;
    img.alt = `Bandeira: ${nome}`;
    img.classList.remove("hidden");
    sigla.classList.add("hidden");
  } else {
    img.classList.add("hidden");
    sigla.classList.remove("hidden");
  }

  const info = estado.ranking[nome];
  const meta = $(`meta-${lado}`);
  if (info) {
    const conf = info.confederacao !== "Outra" ? ` · ${esc(info.confederacao)}` : "";
    meta.innerHTML = `<span><strong class="text-slate-200">#${info.posicao}</strong> no Elo · ${Math.round(info.elo)}${conf}</span>${formaHtml(info.forma)}`;
  } else {
    meta.innerHTML = nome && !estado.selecoes.has(nome) ? `<span class="text-rose-300">Seleção não encontrada</span>` : "";
  }
}

// ---------- Validação ----------

function confederacao(nome) {
  return estado.ranking[nome]?.confederacao || "Outra";
}

function sugerirTorneios(m, v) {
  const cm = confederacao(m), cv = confederacao(v);
  const lista = [];
  if (cm === cv && cm !== "Outra") {
    const continental = { CONMEBOL: "Copa América", UEFA: "UEFA Euro", CAF: "African Cup of Nations", AFC: "AFC Asian Cup", CONCACAF: "Gold Cup" }[cm];
    if (continental) lista.push(continental);
  } else if (["CONMEBOL", "CONCACAF"].includes(cm) && ["CONMEBOL", "CONCACAF"].includes(cv)) {
    lista.push("Copa América");
  }
  lista.push("FIFA World Cup", "Friendly");
  return lista.filter((t) => estado.torneios.includes(t));
}

function mostrarSugestoes() {
  const { mandante, visitante, torneio } = lerConfronto();
  const caixa = $("sugestoes-torneio");
  caixa.innerHTML = "";
  sugerirTorneios(mandante, visitante).forEach((t) => {
    if (t === torneio) return;
    const b = document.createElement("button");
    b.type = "button";
    b.className = "btn-chip";
    b.textContent = t;
    b.onclick = () => { $("torneio").value = t; validar(); };
    caixa.appendChild(b);
  });
}

function validar() {
  const { mandante, visitante, torneio } = lerConfronto();
  const erros = [];
  ["mandante", "visitante", "torneio"].forEach((id) => $(id).classList.remove("invalido"));

  if (!mandante) erros.push(["mandante", "Escolha a seleção mandante."]);
  else if (!estado.selecoes.has(mandante)) erros.push(["mandante", `"${mandante}" não está na base. Escolha uma seleção da lista.`]);
  if (!visitante) erros.push(["visitante", "Escolha a seleção visitante."]);
  else if (!estado.selecoes.has(visitante)) erros.push(["visitante", `"${visitante}" não está na base. Escolha uma seleção da lista.`]);
  if (mandante && visitante && mandante.toLowerCase() === visitante.toLowerCase()) {
    erros.push(["visitante", "Mandante e visitante precisam ser seleções diferentes."]);
  }
  if (!torneio) erros.push(["torneio", "Informe a competição."]);
  else if (!estado.torneios.includes(torneio)) erros.push(["torneio", `"${torneio}" não está na base. Escolha uma competição da lista.`]);

  const permitidas = estado.torneiosRestritos[torneio];
  if (permitidas && !erros.length) {
    const fora = [mandante, visitante].filter((t) => {
      const c = confederacao(t);
      return c !== "Outra" && !permitidas.includes(c);
    });
    if (fora.length) {
      erros.push(["torneio", `${fora.map((t) => `${t} (${confederacao(t)})`).join(" e ")} não disputa ${torneio}, torneio restrito à ${permitidas.join(" / ")}.`]);
    }
  }

  mostrarSugestoes();
  if (erros.length) {
    erros.forEach(([id]) => $(id).classList.add("invalido"));
    mostrarAlerta(erros.map((e) => e[1]).join(" "), erros.some((e) => e[0] === "torneio"));
    return false;
  }
  esconderAlerta();
  return true;
}

function mostrarAlerta(msg, oferecerTorneios = false) {
  $("alerta-msg").textContent = msg;
  const acoes = $("alerta-acoes");
  acoes.innerHTML = "";
  if (oferecerTorneios) {
    const { mandante, visitante } = lerConfronto();
    sugerirTorneios(mandante, visitante).slice(0, 2).forEach((t) => {
      const b = document.createElement("button");
      b.type = "button";
      b.className = "btn-chip";
      b.textContent = `Usar ${t}`;
      b.onclick = () => { $("torneio").value = t; validar(); };
      acoes.appendChild(b);
    });
  }
  $("alerta").classList.remove("hidden");
}

function esconderAlerta() {
  $("alerta").classList.add("hidden");
}

// ---------- Status do painel ----------

function status(tipo, titulo, detalhe) {
  const cores = { espera: "bg-slate-500", carregando: "bg-sky-400 animate-pulse", ok: "bg-emerald-400", erro: "bg-rose-400", aviso: "bg-amber-400" };
  $("status-ponto").className = `w-2.5 h-2.5 rounded-full ${cores[tipo]}`;
  $("status-titulo").textContent = titulo;
  $("status-detalhe").textContent = detalhe;
}

function mostrarCarregando() {
  $("resultado").innerHTML = `
    <div class="esqueleto h-48"></div>
    <div class="grid grid-cols-2 gap-4"><div class="esqueleto h-28"></div><div class="esqueleto h-28"></div></div>
    <div class="esqueleto h-40"></div>`;
}

// ---------- Análise ----------

async function analisar(evento) {
  evento?.preventDefault();
  if (!validar()) return;

  const confronto = lerConfronto();
  const btn = $("btn-prever");
  btn.disabled = true;
  $("btn-prever-texto").textContent = "Analisando…";
  status("carregando", "Analisando confronto", "Consultando o modelo");
  mostrarCarregando();
  const inicio = performance.now();

  try {
    const [resp] = await Promise.all([
      fetch("/api/prever", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(confronto) }),
      esperar(450) // tempo mínimo para o esqueleto não "piscar"
    ]);
    const dados = await resp.json();

    if (resp.status === 422 || dados.status === "invalido") {
      const msg = dados.erros?.join(" ") || dados.mensagem || "Entrada inválida.";
      status("erro", "Confronto recusado", "Validação do servidor");
      mostrarAlerta(msg, true);
      $("resultado").innerHTML = blocoMensagem("rose", "Confronto incompatível", msg);
      return;
    }
    if (!resp.ok || dados.status === "falha") {
      status("erro", "Falha no processamento", "Erro do servidor");
      $("resultado").innerHTML = blocoMensagem("rose", "Não foi possível gerar a previsão", dados.mensagem || "Erro inesperado no modelo.");
      return;
    }

    const ms = Math.round(performance.now() - inicio);
    if (dados.eh_inconclusivo) status("aviso", "Resultado inconclusivo", `${ms} ms`);
    else status("ok", "Diagnóstico concluído", `${ms} ms`);
    renderizarResultado(dados);
    salvarNoHistorico(confronto, dados);
  } catch (err) {
    status("erro", "Sem conexão", "Servidor indisponível");
    $("resultado").innerHTML = blocoMensagem("rose", "Falha na conexão", "Não foi possível falar com o servidor. Verifique se o app_web.py está rodando.");
  } finally {
    btn.disabled = false;
    $("btn-prever-texto").textContent = "Analisar confronto";
  }
}

function blocoMensagem(cor, titulo, texto) {
  return `
    <div class="entrada rounded-2xl border border-${cor}-500/40 bg-${cor}-950/40 p-4">
      <p class="font-bold text-${cor}-300 mb-1">${esc(titulo)}</p>
      <p class="text-sm text-${cor}-100/90 leading-relaxed">${esc(texto)}</p>
    </div>`;
}

function renderizarResultado(d) {
  const p = d.partida;
  const pr = d.probabilidades;
  const mc = d.metricas_confronto;
  const h = d.historico;
  let atraso = 0;
  const proximo = () => `style="animation-delay:${(atraso += 70)}ms"`;

  const desfechos = [
    { classe: "vitoria_mandante", rotulo: `Vitória ${p.mandante}`, pct: pr.vitoria_mandante, cor: "text-emerald-400", fundo: "bg-emerald-400" },
    { classe: "empate", rotulo: "Empate", pct: pr.empate, cor: "text-amber-400", fundo: "bg-amber-400" },
    { classe: "vitoria_visitante", rotulo: `Vitória ${p.visitante}`, pct: pr.vitoria_visitante, cor: "text-sky-400", fundo: "bg-sky-400" }
  ];
  const previsto = desfechos.find((x) => x.classe === d.resultado_classe) || desfechos[0];

  const html = [];

  // Veredito
  html.push(`
    <article class="entrada subcard p-4 sm:p-5 space-y-4" ${proximo()}>
      <div class="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p class="rotulo !mb-1">Veredito da IA</p>
          <h3 class="text-2xl sm:text-3xl font-extrabold tracking-tight ${previsto.cor}">${esc(d.resultado_formatado)}</h3>
          <p class="text-sm text-slate-400 mt-1">${esc(p.mandante)} × ${esc(p.visitante)} · ${esc(p.torneio)} · ${p.campo_neutro === "Sim" ? "campo neutro" : `em casa (${esc(p.mandante)})`}</p>
        </div>
        <div class="text-right">
          <p class="text-3xl font-extrabold font-mono ${previsto.cor}">${d.prob_maior}%</p>
          <p class="text-[11px] text-slate-500">probabilidade do desfecho</p>
        </div>
      </div>

      <div class="barra" role="img" aria-label="Distribuição de probabilidades">
        ${desfechos.map((x) => `<div class="${x.fundo}" data-largura="${x.pct}"></div>`).join("")}
      </div>

      <div class="grid grid-cols-3 gap-2 sm:gap-3">
        ${desfechos.map((x) => `
          <div class="desfecho ${x.cor} ${x === previsto ? "previsto" : ""}">
            <p class="text-[11px] sm:text-xs text-slate-400 truncate" title="${esc(x.rotulo)}">${esc(x.rotulo)}</p>
            <p class="text-lg sm:text-xl font-extrabold font-mono">${x.pct}%</p>
            <p class="text-[10px] text-slate-500 font-mono">odd justa ${x.pct > 0 ? (100 / x.pct).toFixed(2) : "—"}</p>
          </div>`).join("")}
      </div>
    </article>`);

  if (d.eh_inconclusivo) {
    html.push(`
      <div class="entrada rounded-2xl border border-amber-500/40 bg-amber-950/30 p-4 text-sm text-amber-100" ${proximo()}>
        <p class="font-bold text-amber-300 mb-1">Atenção: resultado inconclusivo</p>
        <p class="leading-relaxed">${esc(d.motivo_inconclusivo)}</p>
      </div>`);
  }

  // Placar e zebra
  if (d.projecao_gols && d.termometro_zebra) {
    const corZebra = { amber: "text-amber-400", emerald: "text-emerald-400", sky: "text-sky-400" }[d.termometro_zebra.cor] || "text-amber-400";
    html.push(`
      <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <article class="entrada subcard p-4" ${proximo()}>
          <p class="rotulo">Placar mais provável</p>
          <p class="text-3xl font-extrabold font-mono text-white">${esc(d.projecao_gols.placar)}</p>
          <p class="text-sm text-slate-400 mt-1">${esc(d.projecao_gols.faixa_gols)}</p>
          <p class="text-[11px] text-slate-500 mt-2">Estimativa por distribuição de Poisson</p>
        </article>
        <article class="entrada subcard p-4" ${proximo()}>
          <p class="rotulo">Risco de zebra</p>
          <p class="text-lg font-bold ${corZebra}">${esc(d.termometro_zebra.nivel)}</p>
          <p class="text-sm text-slate-400 mt-1 leading-snug">${esc(d.termometro_zebra.detalhe)}</p>
        </article>
      </div>`);
  }

  // Comparativo de força
  if (mc) {
    const maxElo = Math.max(mc.elo_mandante, mc.elo_visitante, 1);
    const minEscala = 1000;
    const largura = (elo) => Math.max(8, ((elo - minEscala) / (maxElo - minEscala)) * 100);
    const rm = estado.ranking[p.mandante], rv = estado.ranking[p.visitante];
    const linha = (nome, elo, forma, rank, cor) => `
      <div class="space-y-1.5">
        <div class="flex items-center justify-between gap-2 text-sm">
          <span class="font-semibold text-slate-200 truncate">${esc(nome)} ${rank ? `<span class="text-[11px] text-slate-500 font-normal">#${rank.posicao}</span>` : ""}</span>
          <span class="font-mono font-bold ${cor.texto}">${Number(elo).toFixed(0)} Elo</span>
        </div>
        <div class="barra-comparativa"><div class="${cor.fundo}" data-largura="${largura(elo)}"></div></div>
        <div class="flex items-center justify-between text-[11px] text-slate-400">
          <span>Últimos 5 jogos · ${forma.pontos}/15 pts</span>${formaHtml(forma.sequencia)}
        </div>
      </div>`;
    const vantagem = mc.diff_elo === 0 ? "Equilíbrio total" : `${Math.abs(mc.diff_elo).toFixed(1)} pts a favor de ${mc.diff_elo > 0 ? p.mandante : p.visitante}`;
    html.push(`
      <article class="entrada subcard p-4 space-y-4" ${proximo()}>
        <div class="flex items-center justify-between">
          <p class="rotulo !mb-0">Força e momento</p>
          <span class="text-[11px] text-slate-500">Rating Elo atual</span>
        </div>
        ${linha(p.mandante, mc.elo_mandante, mc.forma_mandante, rm, { texto: "text-emerald-400", fundo: "bg-emerald-400" })}
        ${linha(p.visitante, mc.elo_visitante, mc.forma_visitante, rv, { texto: "text-sky-400", fundo: "bg-sky-400" })}
        <div class="flex items-center justify-between text-sm border-t border-white/5 pt-3">
          <span class="text-slate-400">Diferença com mando</span>
          <span class="font-mono font-semibold text-slate-200">${esc(vantagem)}</span>
        </div>
      </article>`);
  }

  // Retrospecto
  if (h.total > 0) {
    html.push(`
      <article class="entrada subcard p-4 space-y-3" ${proximo()}>
        <div class="flex items-center justify-between">
          <p class="rotulo !mb-0">Retrospecto direto</p>
          <span class="text-[11px] font-mono text-sky-400">${h.total} jogos</span>
        </div>
        <div class="barra">
          <div class="bg-emerald-400" data-largura="${h.pct_mandante}"></div>
          <div class="bg-amber-400" data-largura="${h.pct_empate}"></div>
          <div class="bg-sky-400" data-largura="${h.pct_visitante}"></div>
        </div>
        <div class="grid grid-cols-3 text-center text-sm">
          <div><p class="font-mono font-bold text-emerald-400">${h.vitorias_mandante}</p><p class="text-[11px] text-slate-400 truncate">${esc(p.mandante)}</p></div>
          <div><p class="font-mono font-bold text-amber-400">${h.empates}</p><p class="text-[11px] text-slate-400">Empates</p></div>
          <div><p class="font-mono font-bold text-sky-400">${h.vitorias_visitante}</p><p class="text-[11px] text-slate-400 truncate">${esc(p.visitante)}</p></div>
        </div>
        ${d.ultimo_confronto ? `
          <p class="text-[12px] text-slate-400 border-t border-white/5 pt-3">
            Último jogo: <span class="text-slate-200">${esc(d.ultimo_confronto.data)} · ${esc(d.ultimo_confronto.mandante)} × ${esc(d.ultimo_confronto.visitante)}</span>
            (${esc(d.ultimo_confronto.torneio)}) — ${esc(d.ultimo_confronto.desfecho)}
          </p>` : ""}
      </article>`);
  } else {
    html.push(`
      <article class="entrada subcard p-4 text-sm text-slate-400" ${proximo()}>
        <p class="rotulo">Retrospecto direto</p>
        Não há confrontos anteriores entre <strong class="text-slate-200">${esc(p.mandante)}</strong> e <strong class="text-slate-200">${esc(p.visitante)}</strong> na base.
      </article>`);
  }

  // Fatores e parecer
  html.push(`
    <article class="entrada subcard p-4 space-y-3" ${proximo()}>
      <p class="rotulo !mb-0">Fatores considerados</p>
      <ul class="space-y-2 text-sm text-slate-300">
        ${d.fatores.map((f) => `<li class="flex gap-2"><span class="text-sky-400 mt-0.5">▸</span><span class="leading-snug">${esc(f)}</span></li>`).join("")}
      </ul>
    </article>`);

  if (d.sintese_ia) {
    html.push(`
      <article class="entrada rounded-2xl border border-sky-500/30 bg-gradient-to-b from-sky-950/40 to-slate-950/60 p-4 space-y-2" ${proximo()}>
        <p class="rotulo !text-sky-300 !mb-0">Parecer da IA</p>
        <p class="text-sm text-slate-200 leading-relaxed">${esc(d.sintese_ia)}</p>
      </article>`);
  }

  if (d.nota_metodologica) {
    html.push(`<p class="entrada text-[11px] text-slate-500 leading-relaxed px-1" ${proximo()}>${esc(d.nota_metodologica)}</p>`);
  }

  const area = $("resultado");
  area.innerHTML = html.join("");
  area.scrollTop = 0;
  requestAnimationFrame(() => requestAnimationFrame(() => {
    area.querySelectorAll("[data-largura]").forEach((el) => { el.style.width = `${el.dataset.largura}%`; });
  }));
}

// ---------- Histórico local ----------

function lerHistorico() {
  try { return JSON.parse(localStorage.getItem(CHAVE_HISTORICO)) || []; } catch { return []; }
}

function salvarNoHistorico(confronto, dados) {
  const item = { ...confronto, resultado: dados.resultado_formatado, pct: dados.prob_maior, classe: dados.resultado_classe };
  const lista = [item, ...lerHistorico().filter((x) =>
    !(x.mandante === item.mandante && x.visitante === item.visitante && x.torneio === item.torneio && x.campo_neutro === item.campo_neutro))
  ].slice(0, 6);
  try { localStorage.setItem(CHAVE_HISTORICO, JSON.stringify(lista)); } catch { /* armazenamento indisponível */ }
  desenharHistorico();
}

function desenharHistorico() {
  const lista = lerHistorico();
  const ul = $("historico");
  $("btn-limpar-historico").classList.toggle("hidden", !lista.length);
  if (!lista.length) {
    ul.innerHTML = `<li class="text-slate-500 text-[13px]">As análises que você fizer aparecem aqui.</li>`;
    return;
  }
  const cor = { vitoria_mandante: "text-emerald-400", empate: "text-amber-400", vitoria_visitante: "text-sky-400" };
  ul.innerHTML = "";
  lista.forEach((x) => {
    const li = document.createElement("li");
    li.innerHTML = `
      <button type="button" class="w-full flex items-center justify-between gap-3 px-3 py-2 rounded-xl bg-slate-950/50 border border-white/5 hover:border-sky-500/40 text-left transition">
        <span class="min-w-0">
          <span class="block font-semibold text-slate-200 truncate">${esc(x.mandante)} × ${esc(x.visitante)}</span>
          <span class="block text-[11px] text-slate-500 truncate">${esc(x.torneio)}${x.campo_neutro === "Sim" ? " · neutro" : ""}</span>
        </span>
        <span class="text-right shrink-0">
          <span class="block text-[12px] font-semibold ${cor[x.classe] || "text-slate-300"}">${esc(x.resultado)}</span>
          <span class="block text-[11px] font-mono text-slate-500">${x.pct}%</span>
        </span>
      </button>`;
    li.querySelector("button").onclick = () => { preencherConfronto(x); analisar(); };
    ul.appendChild(li);
  });
}

// ---------- Inicialização ----------

async function iniciar() {
  try {
    const resp = await fetch("/api/opcoes");
    const dados = await resp.json();
    estado.selecoes = new Set(dados.selecoes || []);
    estado.torneios = dados.torneios || [];
    estado.ranking = dados.ranking || {};
    estado.torneiosRestritos = dados.torneios_restritos || {};

    $("lista-selecoes").innerHTML = [...estado.selecoes].map((s) => `<option value="${esc(s)}">`).join("");
    $("lista-torneios").innerHTML = estado.torneios.map((t) => `<option value="${esc(t)}">`).join("");

    const m = dados.modelo || {};
    $("info-modelo-nome").textContent = m.nome || `Modelo v${dados.versao_modelo}`;
    if (m.f1_macro_teste != null) $("info-modelo-f1").textContent = `F1 ${m.f1_macro_teste.toFixed(3)}`;
    if (m.acuracia_teste != null) $("info-modelo-acc").textContent = `Acurácia ${(m.acuracia_teste * 100).toFixed(1)}%`;

    const caixa = $("classicos");
    CLASSICOS.filter((c) => estado.selecoes.has(c.mandante) && estado.selecoes.has(c.visitante)).forEach((c) => {
      const b = document.createElement("button");
      b.type = "button";
      b.className = "btn-chip";
      b.textContent = c.rotulo;
      b.title = `${c.torneio}${c.campo_neutro === "Sim" ? " · campo neutro" : ""}`;
      b.onclick = () => { preencherConfronto(c); analisar(); };
      caixa.appendChild(b);
    });

    preencherConfronto(CLASSICOS[0]);
  } catch (err) {
    mostrarAlerta("Não foi possível carregar as seleções do servidor. Verifique se o app_web.py está rodando.");
  }
  desenharHistorico();
}

document.addEventListener("DOMContentLoaded", () => {
  $("form-confronto").addEventListener("submit", analisar);
  ["mandante", "visitante"].forEach((lado) => {
    $(lado).addEventListener("input", () => { atualizarTime(lado); if ($("alerta").classList.contains("hidden")) mostrarSugestoes(); else validar(); });
    $(lado).addEventListener("change", validar);
    $(lado).addEventListener("focus", (e) => e.target.select());
  });
  $("torneio").addEventListener("change", validar);
  $("torneio").addEventListener("focus", (e) => e.target.select());
  $("btn-inverter").addEventListener("click", () => {
    const c = lerConfronto();
    preencherConfronto({ ...c, mandante: c.visitante, visitante: c.mandante });
  });
  $("btn-limpar-historico").addEventListener("click", () => {
    try { localStorage.removeItem(CHAVE_HISTORICO); } catch { /* ignora */ }
    desenharHistorico();
  });
  iniciar();
});
