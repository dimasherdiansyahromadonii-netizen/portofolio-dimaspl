/* Backend: Express + MySQL (mysql2) + upload file (multer) */
require("dotenv").config();
const express = require("express");
const mysql = require("mysql2/promise");
const multer = require("multer");
const path = require("path");
const fs = require("fs");

const PORT = process.env.PORT || 3000;
const UPLOAD_DIR = path.join(__dirname, "uploads");
fs.mkdirSync(UPLOAD_DIR, { recursive: true });

const pool = mysql.createPool({
  host: process.env.DB_HOST || "localhost",
  port: Number(process.env.DB_PORT) || 3306,
  user: process.env.DB_USER || "root",
  password: process.env.DB_PASSWORD || "",
  database: process.env.DB_NAME || "portofolio",
  dateStrings: true, // kolom DATE dikirim sebagai "2026-11-10", bukan objek Date
  waitForConnections: true,
  connectionLimit: 10,
});

/* ---------- Upload file ---------- */
const upload = multer({
  storage: multer.diskStorage({
    destination: UPLOAD_DIR,
    filename: (req, file, cb) =>
      cb(
        null,
        Date.now() + "-" + Math.round(Math.random() * 1e9) + path.extname(file.originalname),
      ),
  }),
  limits: { fileSize: 20 * 1024 * 1024 }, // 20 MB
});

const removeFile = (webPath) => {
  if (!webPath) return;
  fs.unlink(path.join(UPLOAD_DIR, path.basename(webPath)), () => {});
};

/* ---------- Util ---------- */
const app = express();
app.use(express.json());

const wrap = (fn) => (req, res, next) => fn(req, res, next).catch(next);
class HttpError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}
const str = (v, max) => String(v ?? "").trim().slice(0, max);
const TIME_RE = /^([01]?\d|2[0-3]):[0-5]\d$/;
const pad = (t) => (t.length === 4 ? "0" + t : t); // "8:00" -> "08:00"

/* ---------- PROFIL ---------- */
const mapProfile = (r) => ({ name: r.name, role: r.role, bio: r.bio, email: r.email });

app.get("/api/profile", wrap(async (req, res) => {
  const [rows] = await pool.query("SELECT * FROM profile WHERE id = 1");
  res.json(mapProfile(rows[0] || { name: "Nama Kamu", role: "", bio: "", email: "nama@email.com" }));
}));

app.put("/api/profile", wrap(async (req, res) => {
  const name = str(req.body.name, 50) || "Nama Kamu";
  const role = str(req.body.role, 70);
  const bio = str(req.body.bio, 320);
  const email = str(req.body.email, 100) || "nama@email.com";
  await pool.query(
    `INSERT INTO profile (id, name, role, bio, email) VALUES (1, ?, ?, ?, ?)
     ON DUPLICATE KEY UPDATE name = VALUES(name), role = VALUES(role), bio = VALUES(bio), email = VALUES(email)`,
    [name, role, bio, email],
  );
  res.json({ name, role, bio, email });
}));

/* ---------- PROYEK ---------- */
const mapProject = (r) => ({
  id: r.id,
  title: r.title,
  desc: r.description,
  tags: r.tags ? r.tags.split(",").filter(Boolean) : [],
  url: r.url,
});
function readProject(body) {
  const title = str(body.title, 60);
  const desc = str(body.desc, 160);
  if (!title || !desc) throw new HttpError(400, "Judul dan deskripsi wajib diisi.");
  const tags = (Array.isArray(body.tags) ? body.tags : [])
    .map((t) => str(t, 30).replace(/,/g, ""))
    .filter(Boolean)
    .join(",")
    .slice(0, 255);
  return [title, desc, tags, str(body.url, 255)];
}

app.get("/api/projects", wrap(async (req, res) => {
  const [rows] = await pool.query("SELECT * FROM projects ORDER BY id");
  res.json(rows.map(mapProject));
}));
app.post("/api/projects", wrap(async (req, res) => {
  const [r] = await pool.query(
    "INSERT INTO projects (title, description, tags, url) VALUES (?, ?, ?, ?)",
    readProject(req.body),
  );
  res.status(201).json({ id: r.insertId });
}));
app.put("/api/projects/:id", wrap(async (req, res) => {
  const [r] = await pool.query(
    "UPDATE projects SET title = ?, description = ?, tags = ?, url = ? WHERE id = ?",
    [...readProject(req.body), req.params.id],
  );
  if (!r.affectedRows) throw new HttpError(404, "Proyek tidak ditemukan.");
  res.json({ ok: true });
}));
app.delete("/api/projects/:id", wrap(async (req, res) => {
  await pool.query("DELETE FROM projects WHERE id = ?", [req.params.id]);
  res.json({ ok: true });
}));

/* ---------- JADWAL ---------- */
const mapCourse = (r) => ({
  id: r.id,
  name: r.name,
  day: r.day_index,
  start: r.start_time,
  end: r.end_time,
  room: r.room,
});
function readCourse(body) {
  const name = str(body.name, 50);
  const day = Number(body.day);
  const start = pad(str(body.start, 5));
  const end = pad(str(body.end, 5));
  if (!name) throw new HttpError(400, "Nama mata kuliah wajib diisi.");
  if (!Number.isInteger(day) || day < 0 || day > 5) throw new HttpError(400, "Hari tidak valid.");
  if (!TIME_RE.test(start) || !TIME_RE.test(end)) throw new HttpError(400, "Format jam harus 13:00.");
  if (end <= start) throw new HttpError(400, "Jam selesai harus setelah jam mulai.");
  return [name, day, start, end, str(body.room, 20)];
}

app.get("/api/courses", wrap(async (req, res) => {
  const [rows] = await pool.query("SELECT * FROM courses ORDER BY day_index, start_time");
  res.json(rows.map(mapCourse));
}));
app.post("/api/courses", wrap(async (req, res) => {
  const [r] = await pool.query(
    "INSERT INTO courses (name, day_index, start_time, end_time, room) VALUES (?, ?, ?, ?, ?)",
    readCourse(req.body),
  );
  res.status(201).json({ id: r.insertId });
}));
app.put("/api/courses/:id", wrap(async (req, res) => {
  const [r] = await pool.query(
    "UPDATE courses SET name = ?, day_index = ?, start_time = ?, end_time = ?, room = ? WHERE id = ?",
    [...readCourse(req.body), req.params.id],
  );
  if (!r.affectedRows) throw new HttpError(404, "Jadwal tidak ditemukan.");
  res.json({ ok: true });
}));
app.delete("/api/courses/:id", wrap(async (req, res) => {
  await pool.query("DELETE FROM courses WHERE id = ?", [req.params.id]);
  res.json({ ok: true });
}));

/* ---------- TUGAS (dengan upload file) ---------- */
const mapTask = (r) => ({
  id: r.id,
  title: r.title,
  course: r.course,
  due: r.due_date,
  done: !!r.is_done,
  attachment: r.attachment_path
    ? { name: r.attachment_name, type: r.attachment_type, url: r.attachment_path }
    : null,
});
const isTrue = (v) => v === true || v === "1" || v === "true" || v === "on";
function readTask(body) {
  const title = str(body.title, 80);
  const due = str(body.due, 10);
  if (!title) throw new HttpError(400, "Judul tugas wajib diisi.");
  if (!/^\d{4}-\d{2}-\d{2}$/.test(due)) throw new HttpError(400, "Tenggat tidak valid.");
  return { title, course: str(body.course, 50), due, done: isTrue(body.done) ? 1 : 0 };
}

app.get("/api/tasks", wrap(async (req, res) => {
  const [rows] = await pool.query("SELECT * FROM tasks ORDER BY id");
  res.json(rows.map(mapTask));
}));

app.post("/api/tasks", upload.single("attachment"), wrap(async (req, res) => {
  let t;
  try {
    t = readTask(req.body);
  } catch (e) {
    if (req.file) removeFile(req.file.filename);
    throw e;
  }
  const f = req.file;
  const [r] = await pool.query(
    `INSERT INTO tasks (title, course, due_date, is_done, attachment_name, attachment_type, attachment_path)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [
      t.title, t.course, t.due, t.done,
      f ? Buffer.from(f.originalname, "latin1").toString("utf8") : null,
      f ? f.mimetype : null,
      f ? "/uploads/" + f.filename : null,
    ],
  );
  res.status(201).json({ id: r.insertId });
}));

app.put("/api/tasks/:id", upload.single("attachment"), wrap(async (req, res) => {
  const f = req.file;
  try {
    const t = readTask(req.body);
    const [rows] = await pool.query("SELECT attachment_path FROM tasks WHERE id = ?", [req.params.id]);
    if (!rows.length) throw new HttpError(404, "Tugas tidak ditemukan.");
    if (f) {
      await pool.query(
        `UPDATE tasks SET title=?, course=?, due_date=?, is_done=?,
         attachment_name=?, attachment_type=?, attachment_path=? WHERE id=?`,
        [
          t.title, t.course, t.due, t.done,
          Buffer.from(f.originalname, "latin1").toString("utf8"),
          f.mimetype, "/uploads/" + f.filename, req.params.id,
        ],
      );
      removeFile(rows[0].attachment_path); // hapus file lama
    } else {
      await pool.query(
        "UPDATE tasks SET title=?, course=?, due_date=?, is_done=? WHERE id=?",
        [t.title, t.course, t.due, t.done, req.params.id],
      );
    }
    res.json({ ok: true });
  } catch (e) {
    if (f) removeFile(f.filename);
    throw e;
  }
}));

app.patch("/api/tasks/:id/done", wrap(async (req, res) => {
  await pool.query("UPDATE tasks SET is_done = ? WHERE id = ?", [
    isTrue(req.body.done) ? 1 : 0,
    req.params.id,
  ]);
  res.json({ ok: true });
}));

app.delete("/api/tasks/:id", wrap(async (req, res) => {
  const [rows] = await pool.query("SELECT attachment_path FROM tasks WHERE id = ?", [req.params.id]);
  await pool.query("DELETE FROM tasks WHERE id = ?", [req.params.id]);
  if (rows.length) removeFile(rows[0].attachment_path);
  res.json({ ok: true });
}));

/* ---------- File statis ---------- */
// File upload: gambar tampil langsung, jenis lain dipaksa unduh (mencegah HTML upload dijalankan)
const IMAGE_EXT = [".jpg", ".jpeg", ".png", ".gif", ".webp"];
app.use(
  "/uploads",
  express.static(UPLOAD_DIR, {
    setHeaders: (res, file) => {
      res.setHeader("X-Content-Type-Options", "nosniff");
      if (!IMAGE_EXT.includes(path.extname(file).toLowerCase()))
        res.setHeader("Content-Disposition", "attachment");
    },
  }),
);
app.use(express.static(path.join(__dirname, "public")));

/* ---------- Error handler ---------- */
app.use((err, req, res, next) => {
  if (err instanceof multer.MulterError)
    return res.status(400).json({ error: err.code === "LIMIT_FILE_SIZE" ? "Ukuran file maksimal 20 MB." : err.message });
  if (err instanceof HttpError) return res.status(err.status).json({ error: err.message });
  console.error(err);
  res.status(500).json({ error: "Terjadi kesalahan pada server/database." });
});

app.listen(PORT, () => console.log(`Server jalan di http://localhost:${PORT}`));
