// ---------------------------------------------------------------------------
// Paddock — F1 Race Tracker (client)
// ---------------------------------------------------------------------------
const state = {
  view: "races",
  search: "",
  teamFilter: null,
  circuits: [],
  drivers: [],
};

const $ = (sel) => document.querySelector(sel);
const content = $("#content");
const today = new Date();

// --- Data loading ----------------------------------------------------------
async function loadData() {
  const [c, d] = await Promise.all([
    fetch("/api/circuits").then((r) => r.json()),
    fetch("/api/drivers").then((r) => r.json()),
  ]);
  state.circuits = c;
  state.drivers = d;
  renderNextRace();
  renderFilterChips();
  updateFavCount();
  render();
}

// --- Favorites -------------------------------------------------------------
async function toggleFavorite(kind, id, btn) {
  const url = `/api/${kind === "circuit" ? "circuits" : "drivers"}/${id}/favorite`;
  // optimistic UI
  const list = kind === "circuit" ? state.circuits : state.drivers;
  const item = list.find((x) => x.id === id);
  if (item) item.favorite = item.favorite ? 0 : 1;
  if (btn) {
    btn.classList.toggle("on", !!item.favorite);
    btn.classList.remove("pop"); void btn.offsetWidth; btn.classList.add("pop");
  }
  updateFavCount();
  try {
    const res = await fetch(url, { method: "POST" });
    const data = await res.json();
    if (item) item.favorite = data.favorite;
  } catch (e) {
    if (item) item.favorite = item.favorite ? 0 : 1; // revert on failure
  }
  updateFavCount();
  if (state.view === "favorites") render();
}

function updateFavCount() {
  const n =
    state.circuits.filter((c) => c.favorite).length +
    state.drivers.filter((d) => d.favorite).length;
  $("#favCount").textContent = n;
}

// --- Next race + countdown -------------------------------------------------
let countdownTimer = null;
function nextUpcomingRace() {
  return state.circuits.find((c) => new Date(c.race_date + "T13:00:00Z") >= today);
}
function renderNextRace() {
  const el = $("#nextRace");
  const race = nextUpcomingRace();
  if (!race) {
    el.innerHTML = `<div class="label">Season</div><div class="nr-name">🏆 Season complete</div>`;
    return;
  }
  el.innerHTML = `
    <div class="label">Next Grand Prix · Round ${race.round}</div>
    <div class="nr-name">${race.flag} ${race.gp_name.replace(" Grand Prix", " GP")}</div>
    <div class="countdown" id="cd"></div>`;
  tickCountdown(race);
  if (countdownTimer) clearInterval(countdownTimer);
  countdownTimer = setInterval(() => tickCountdown(race), 1000);
}
function tickCountdown(race) {
  const cd = $("#cd");
  if (!cd) return;
  const diff = new Date(race.race_date + "T13:00:00Z") - new Date();
  if (diff <= 0) { renderNextRace(); return; }
  const d = Math.floor(diff / 86400000);
  const h = Math.floor((diff % 86400000) / 3600000);
  const m = Math.floor((diff % 3600000) / 60000);
  const s = Math.floor((diff % 60000) / 1000);
  const unit = (num, lbl) => `<div class="cd-unit"><div class="cd-num">${String(num).padStart(2,"0")}</div><div class="cd-lbl">${lbl}</div></div>`;
  cd.innerHTML = unit(d, "days") + unit(h, "hrs") + unit(m, "min") + unit(s, "sec");
}

// --- Filters ---------------------------------------------------------------
function renderFilterChips() {
  const wrap = $("#filterChips");
  if (state.view !== "drivers") { wrap.innerHTML = ""; return; }
  const teams = [...new Set(state.drivers.map((d) => d.team))];
  wrap.innerHTML =
    `<button class="chip ${!state.teamFilter ? "active" : ""}" data-team="">All teams</button>` +
    teams.map((t) => `<button class="chip ${state.teamFilter === t ? "active" : ""}" data-team="${t}">${t}</button>`).join("");
  wrap.querySelectorAll(".chip").forEach((chip) => {
    chip.addEventListener("click", () => {
      state.teamFilter = chip.dataset.team || null;
      renderFilterChips();
      render();
    });
  });
}

// --- Rendering -------------------------------------------------------------
const starSVG = `<svg viewBox="0 0 24 24"><path class="star-fill" d="M12 2.5l2.9 6.1 6.6.9-4.8 4.6 1.2 6.6L12 18.1 6.1 21.3l1.2-6.6L2.5 9.5l6.6-.9L12 2.5z"/></svg>`;

function raceStatus(c) {
  const raceDay = new Date(c.race_date + "T23:59:00Z");
  if (raceDay < today) return { cls: "status-done", txt: "Completed" };
  const next = nextUpcomingRace();
  if (next && next.id === c.id) return { cls: "status-next", txt: "Up Next" };
  return { cls: "status-upcoming", txt: "Upcoming" };
}

function raceCard(c, i) {
  const dt = new Date(c.race_date + "T12:00:00Z");
  const day = dt.toLocaleDateString("en-US", { month: "short", day: "numeric", timeZone: "UTC" });
  const st = raceStatus(c);
  return `
    <article class="card race-card" style="animation-delay:${i * 25}ms">
      <button class="fav-btn ${c.favorite ? "on" : ""}" data-kind="circuit" data-id="${c.id}" aria-label="Favorite ${c.gp_name}" title="Favorite">${starSVG}</button>
      <div class="round">ROUND ${c.round}</div>
      <h3>${c.flag} ${c.gp_name}</h3>
      <div class="circuit-name">${c.circuit} · ${c.city}</div>
      <div class="date-row">
        <span class="date-big">${day}</span>
        <span class="date-year">2026</span>
      </div>
      <span class="status-badge ${st.cls}">${st.txt}</span>
      <div class="race-stats">
        <div class="stat"><div class="v">${c.laps}</div><div class="k">Laps</div></div>
        <div class="stat"><div class="v">${c.length_km.toFixed(3)}</div><div class="k">km / lap</div></div>
        <div class="stat"><div class="v">${c.first_gp}</div><div class="k">First GP</div></div>
      </div>
    </article>`;
}

function driverCard(d, i) {
  return `
    <article class="card driver-card" style="animation-delay:${i * 25}ms">
      <div class="accent" style="background:${d.color}"></div>
      <div class="dc-body">
        <button class="fav-btn ${d.favorite ? "on" : ""}" data-kind="driver" data-id="${d.id}" aria-label="Favorite ${d.name}" title="Favorite">${starSVG}</button>
        <div class="dc-top">
          <div class="dc-num" style="color:${d.color}">${d.number}</div>
        </div>
        <h3>${d.flag} ${d.name}</h3>
        <div class="team-row"><span class="team-dot" style="background:${d.color}"></span>${d.team} · ${d.code}</div>
        <div class="driver-stats">
          <div class="stat"><div class="v">${d.championships}</div><div class="k">Titles</div></div>
          <div class="stat"><div class="v">${d.podiums}</div><div class="k">Podiums</div></div>
          <div class="stat"><div class="v">${d.country}</div><div class="k">From</div></div>
        </div>
      </div>
    </article>`;
}

function matchesSearch(text) {
  return text.toLowerCase().includes(state.search.toLowerCase());
}

function emptyState(emoji, title, msg) {
  return `<div class="empty"><span class="emoji">${emoji}</span><h3>${title}</h3><p>${msg}</p></div>`;
}

function render() {
  renderFilterChips();
  let html = "";

  if (state.view === "races") {
    const items = state.circuits.filter((c) =>
      matchesSearch(`${c.gp_name} ${c.circuit} ${c.city} ${c.country}`)
    );
    html = items.length
      ? `<div class="card-grid">${items.map(raceCard).join("")}</div>`
      : emptyState("🔍", "No races found", "Try a different search term.");
  }

  else if (state.view === "drivers") {
    let items = state.drivers.filter((d) =>
      matchesSearch(`${d.name} ${d.team} ${d.code} ${d.country}`)
    );
    if (state.teamFilter) items = items.filter((d) => d.team === state.teamFilter);
    html = items.length
      ? `<div class="card-grid">${items.map(driverCard).join("")}</div>`
      : emptyState("🔍", "No drivers found", "Try a different search or team filter.");
  }

  else if (state.view === "favorites") {
    const favC = state.circuits.filter((c) => c.favorite && matchesSearch(`${c.gp_name} ${c.circuit} ${c.city}`));
    const favD = state.drivers.filter((d) => d.favorite && matchesSearch(`${d.name} ${d.team}`));
    if (!favC.length && !favD.length) {
      html = emptyState("⭐", "No favorites yet", "Tap the star on any race or driver to pin it here.");
    } else {
      if (favD.length) html += `<div class="section-heading">Favorite Drivers · ${favD.length}</div><div class="card-grid">${favD.map(driverCard).join("")}</div>`;
      if (favC.length) html += `<div class="section-heading">Favorite Circuits · ${favC.length}</div><div class="card-grid">${favC.map(raceCard).join("")}</div>`;
    }
  }

  content.innerHTML = html;

  content.querySelectorAll(".fav-btn").forEach((btn) => {
    btn.addEventListener("click", () =>
      toggleFavorite(btn.dataset.kind, Number(btn.dataset.id), btn)
    );
  });
}

// --- Events ----------------------------------------------------------------
document.querySelectorAll(".tab").forEach((tab) => {
  tab.addEventListener("click", () => {
    document.querySelectorAll(".tab").forEach((t) => t.classList.remove("active"));
    tab.classList.add("active");
    state.view = tab.dataset.view;
    render();
  });
});

$("#search").addEventListener("input", (e) => {
  state.search = e.target.value;
  render();
});

loadData();
