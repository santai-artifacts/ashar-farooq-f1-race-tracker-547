import { Hono } from "hono";
import Database from "bun:sqlite";
import { mkdirSync } from "node:fs";
import { dirname } from "node:path";

// ---------------------------------------------------------------------------
// Database setup
// ---------------------------------------------------------------------------
const dbPath = process.env.DATABASE_URL || "./data/app.db";
mkdirSync(dirname(dbPath), { recursive: true }); // bun:sqlite creates the file, not the dir
const db = new Database(dbPath);
db.exec("PRAGMA journal_mode = WAL;");

db.exec(`
  CREATE TABLE IF NOT EXISTS circuits (
    id           INTEGER PRIMARY KEY,
    round        INTEGER NOT NULL,
    gp_name      TEXT NOT NULL,
    circuit      TEXT NOT NULL,
    city         TEXT NOT NULL,
    country      TEXT NOT NULL,
    flag         TEXT NOT NULL,
    race_date    TEXT NOT NULL,   -- ISO date of the Grand Prix (race day)
    laps         INTEGER NOT NULL,
    length_km    REAL NOT NULL,
    lap_record   TEXT NOT NULL,
    first_gp     INTEGER NOT NULL,
    favorite     INTEGER NOT NULL DEFAULT 0
  );

  CREATE TABLE IF NOT EXISTS drivers (
    id          INTEGER PRIMARY KEY,
    name        TEXT NOT NULL,
    number      INTEGER NOT NULL,
    code        TEXT NOT NULL,
    team        TEXT NOT NULL,
    color       TEXT NOT NULL,
    country     TEXT NOT NULL,
    flag        TEXT NOT NULL,
    points      INTEGER NOT NULL DEFAULT 0,
    podiums     INTEGER NOT NULL DEFAULT 0,
    championships INTEGER NOT NULL DEFAULT 0,
    favorite    INTEGER NOT NULL DEFAULT 0
  );
`);

// ---------------------------------------------------------------------------
// Seed data — 2026 FIA Formula 1 World Championship (illustrative dataset)
// ---------------------------------------------------------------------------
const seedCircuits = [
  [1, "Australian Grand Prix", "Albert Park Circuit", "Melbourne", "Australia", "🇦🇺", "2026-03-08", 58, 5.278, "1:19.813 (Leclerc, 2024)", 1996],
  [2, "Chinese Grand Prix", "Shanghai International Circuit", "Shanghai", "China", "🇨🇳", "2026-03-15", 56, 5.451, "1:32.238 (Hamilton, 2004)", 2004],
  [3, "Japanese Grand Prix", "Suzuka Circuit", "Suzuka", "Japan", "🇯🇵", "2026-03-29", 53, 5.807, "1:30.983 (Hamilton, 2019)", 1987],
  [4, "Bahrain Grand Prix", "Bahrain International Circuit", "Sakhir", "Bahrain", "🇧🇭", "2026-04-12", 57, 5.412, "1:31.447 (de la Rosa, 2005)", 2004],
  [5, "Saudi Arabian Grand Prix", "Jeddah Corniche Circuit", "Jeddah", "Saudi Arabia", "🇸🇦", "2026-04-19", 50, 6.174, "1:30.734 (Hamilton, 2021)", 2021],
  [6, "Miami Grand Prix", "Miami International Autodrome", "Miami", "United States", "🇺🇸", "2026-05-03", 57, 5.412, "1:29.708 (Verstappen, 2023)", 2022],
  [7, "Canadian Grand Prix", "Circuit Gilles Villeneuve", "Montreal", "Canada", "🇨🇦", "2026-05-24", 70, 4.361, "1:13.078 (Bottas, 2019)", 1978],
  [8, "Monaco Grand Prix", "Circuit de Monaco", "Monte Carlo", "Monaco", "🇲🇨", "2026-06-07", 78, 3.337, "1:12.909 (Hamilton, 2021)", 1950],
  [9, "Spanish Grand Prix", "Circuit de Barcelona-Catalunya", "Barcelona", "Spain", "🇪🇸", "2026-06-14", 66, 4.657, "1:16.330 (Verstappen, 2023)", 1991],
  [10, "Austrian Grand Prix", "Red Bull Ring", "Spielberg", "Austria", "🇦🇹", "2026-06-28", 71, 4.318, "1:05.619 (Sainz, 2020)", 1970],
  [11, "British Grand Prix", "Silverstone Circuit", "Silverstone", "United Kingdom", "🇬🇧", "2026-07-05", 52, 5.891, "1:27.097 (Verstappen, 2020)", 1950],
  [12, "Belgian Grand Prix", "Circuit de Spa-Francorchamps", "Spa", "Belgium", "🇧🇪", "2026-07-19", 44, 7.004, "1:46.286 (Hamilton, 2020)", 1950],
  [13, "Hungarian Grand Prix", "Hungaroring", "Budapest", "Hungary", "🇭🇺", "2026-07-26", 70, 4.381, "1:16.627 (Hamilton, 2020)", 1986],
  [14, "Dutch Grand Prix", "Circuit Zandvoort", "Zandvoort", "Netherlands", "🇳🇱", "2026-08-23", 72, 4.259, "1:11.097 (Hamilton, 2021)", 1952],
  [15, "Italian Grand Prix", "Autodromo Nazionale Monza", "Monza", "Italy", "🇮🇹", "2026-09-06", 53, 5.793, "1:21.046 (Barrichello, 2004)", 1950],
  [16, "Madrid Grand Prix", "Madring (IFEMA Madrid)", "Madrid", "Spain", "🇪🇸", "2026-09-13", 57, 5.474, "New for 2026", 2026],
  [17, "Azerbaijan Grand Prix", "Baku City Circuit", "Baku", "Azerbaijan", "🇦🇿", "2026-09-27", 51, 6.003, "1:43.009 (Leclerc, 2019)", 2016],
  [18, "Singapore Grand Prix", "Marina Bay Street Circuit", "Singapore", "Singapore", "🇸🇬", "2026-10-11", 62, 4.940, "1:34.486 (Hamilton, 2023)", 2008],
  [19, "United States Grand Prix", "Circuit of the Americas", "Austin", "United States", "🇺🇸", "2026-10-25", 56, 5.513, "1:36.169 (Leclerc, 2019)", 2012],
  [20, "Mexico City Grand Prix", "Autódromo Hermanos Rodríguez", "Mexico City", "Mexico", "🇲🇽", "2026-11-01", 71, 4.304, "1:17.774 (Bottas, 2021)", 1963],
  [21, "São Paulo Grand Prix", "Autódromo José Carlos Pace", "São Paulo", "Brazil", "🇧🇷", "2026-11-08", 71, 4.309, "1:10.540 (Bottas, 2018)", 1973],
  [22, "Las Vegas Grand Prix", "Las Vegas Strip Circuit", "Las Vegas", "United States", "🇺🇸", "2026-11-21", 50, 6.201, "1:34.876 (Piastri, 2024)", 2023],
  [23, "Qatar Grand Prix", "Lusail International Circuit", "Lusail", "Qatar", "🇶🇦", "2026-11-29", 57, 5.419, "1:22.384 (Verstappen, 2024)", 2021],
  [24, "Abu Dhabi Grand Prix", "Yas Marina Circuit", "Abu Dhabi", "United Arab Emirates", "🇦🇪", "2026-12-06", 58, 5.281, "1:25.637 (Verstappen, 2021)", 2009],
];

const seedDrivers = [
  ["Max Verstappen", 1, "VER", "Red Bull Racing", "#3671C6", "Netherlands", "🇳🇱", 0, 112, 4],
  ["Isack Hadjar", 6, "HAD", "Red Bull Racing", "#3671C6", "France", "🇫🇷", 0, 1, 0],
  ["Charles Leclerc", 16, "LEC", "Ferrari", "#E8002D", "Monaco", "🇲🇨", 0, 43, 0],
  ["Lewis Hamilton", 44, "HAM", "Ferrari", "#E8002D", "United Kingdom", "🇬🇧", 0, 202, 7],
  ["George Russell", 63, "RUS", "Mercedes", "#27F4D2", "United Kingdom", "🇬🇧", 0, 18, 0],
  ["Kimi Antonelli", 12, "ANT", "Mercedes", "#27F4D2", "Italy", "🇮🇹", 0, 2, 0],
  ["Lando Norris", 4, "NOR", "McLaren", "#FF8000", "United Kingdom", "🇬🇧", 0, 39, 0],
  ["Oscar Piastri", 81, "PIA", "McLaren", "#FF8000", "Australia", "🇦🇺", 0, 24, 0],
  ["Fernando Alonso", 14, "ALO", "Aston Martin", "#229971", "Spain", "🇪🇸", 0, 106, 2],
  ["Lance Stroll", 18, "STR", "Aston Martin", "#229971", "Canada", "🇨🇦", 0, 3, 0],
  ["Pierre Gasly", 10, "GAS", "Alpine", "#0093CC", "France", "🇫🇷", 0, 4, 0],
  ["Franco Colapinto", 43, "COL", "Alpine", "#0093CC", "Argentina", "🇦🇷", 0, 0, 0],
  ["Alexander Albon", 23, "ALB", "Williams", "#64C4FF", "Thailand", "🇹🇭", 0, 2, 0],
  ["Carlos Sainz", 55, "SAI", "Williams", "#64C4FF", "Spain", "🇪🇸", 0, 27, 0],
  ["Liam Lawson", 30, "LAW", "Racing Bulls", "#6692FF", "New Zealand", "🇳🇿", 0, 0, 0],
  ["Arvid Lindblad", 37, "LIN", "Racing Bulls", "#6692FF", "United Kingdom", "🇬🇧", 0, 0, 0],
  ["Nico Hülkenberg", 27, "HUL", "Audi", "#00E701", "Germany", "🇩🇪", 0, 1, 0],
  ["Gabriel Bortoleto", 5, "BOR", "Audi", "#00E701", "Brazil", "🇧🇷", 0, 0, 0],
  ["Esteban Ocon", 31, "OCO", "Haas", "#B6BABD", "France", "🇫🇷", 0, 3, 0],
  ["Oliver Bearman", 87, "BEA", "Haas", "#B6BABD", "United Kingdom", "🇬🇧", 0, 0, 0],
  ["Sergio Pérez", 11, "PER", "Cadillac", "#C7A15A", "Mexico", "🇲🇽", 0, 39, 0],
  ["Valtteri Bottas", 77, "BOT", "Cadillac", "#C7A15A", "Finland", "🇫🇮", 0, 67, 0],
];

const circuitCount = db.query("SELECT COUNT(*) AS n FROM circuits").get() as { n: number };
if (circuitCount.n === 0) {
  const ins = db.prepare(
    `INSERT INTO circuits (id, round, gp_name, circuit, city, country, flag, race_date, laps, length_km, lap_record, first_gp)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
  );
  const tx = db.transaction((rows: any[]) => {
    for (const r of rows) {
      ins.run(r[0], r[0], r[1], r[2], r[3], r[4], r[5], r[6], r[7], r[8], r[9], r[10]);
    }
  });
  tx(seedCircuits);
}

const driverCount = db.query("SELECT COUNT(*) AS n FROM drivers").get() as { n: number };
if (driverCount.n === 0) {
  const ins = db.prepare(
    `INSERT INTO drivers (name, number, code, team, color, country, flag, points, podiums, championships)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
  );
  const tx = db.transaction((rows: any[]) => {
    for (const r of rows) ins.run(...r);
  });
  tx(seedDrivers);
}

// ---------------------------------------------------------------------------
// API
// ---------------------------------------------------------------------------
const app = new Hono();

app.get("/api/circuits", (c) => {
  const rows = db.query("SELECT * FROM circuits ORDER BY round ASC").all();
  return c.json(rows);
});

app.get("/api/drivers", (c) => {
  const rows = db.query("SELECT * FROM drivers ORDER BY points DESC, name ASC").all();
  return c.json(rows);
});

app.post("/api/circuits/:id/favorite", (c) => {
  const id = Number(c.req.param("id"));
  const row = db.query("SELECT favorite FROM circuits WHERE id = ?").get(id) as { favorite: number } | null;
  if (!row) return c.json({ error: "not found" }, 404);
  const next = row.favorite ? 0 : 1;
  db.query("UPDATE circuits SET favorite = ? WHERE id = ?").run(next, id);
  return c.json({ id, favorite: next });
});

app.post("/api/drivers/:id/favorite", (c) => {
  const id = Number(c.req.param("id"));
  const row = db.query("SELECT favorite FROM drivers WHERE id = ?").get(id) as { favorite: number } | null;
  if (!row) return c.json({ error: "not found" }, 404);
  const next = row.favorite ? 0 : 1;
  db.query("UPDATE drivers SET favorite = ? WHERE id = ?").run(next, id);
  return c.json({ id, favorite: next });
});

// ---------------------------------------------------------------------------
// Static files
// ---------------------------------------------------------------------------
const publicDir = `${import.meta.dir}/public`;
app.get("/*", async (c) => {
  const url = new URL(c.req.url);
  let path = url.pathname === "/" ? "/index.html" : url.pathname;
  const file = Bun.file(`${publicDir}${path}`);
  if (await file.exists()) return new Response(file);
  // SPA-ish fallback
  return new Response(Bun.file(`${publicDir}/index.html`));
});

console.log(`F1 Race Tracker running on port ${process.env.PORT || 3000}`);
export default { port: process.env.PORT || 3000, fetch: app.fetch };
