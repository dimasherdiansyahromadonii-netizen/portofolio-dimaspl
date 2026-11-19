/* Portofolio + Jadwal + Tugas — CRUD dengan JavaScript + API Express + database MySQL */
const DAYS = ["Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"];
const $ = (s) => document.querySelector(s);
const iso = (d) => d.toISOString().slice(0, 10);
const today = new Date();
const offs = (n) => {
  const d = new Date();
  d.setDate(d.getDate() + n);
  return iso(d);
};
const todayIdx = (today.getDay() + 6) % 7; // 0 = Senin
let filter = "all";

function el(tag, cls, txt) {
  const e = document.createElement(tag);
  if (cls) e.className = cls;
  if (txt != null) e.textContent = txt;
  return e;
}
function btn(label, cls, fn) {
  const b = el("button", cls, label);
  b.type = "button";
  b.onclick = fn;
  return b;
}

/* ---------- Data (dibaca dari MySQL lewat API server.js) ---------- */
let S = {
  profile: { name: "", role: "", bio: "", email: "" },
  projects: [],
  courses: [],
  tasks: [],
};

// Kirim permintaan ke server. Jika data memuat File -> multipart, selain itu JSON.
async function api(method, url, data) {
  const opt = { method, headers: {} };
  if (data) {
    if (data.attachment instanceof File) {
      const fd = new FormData();
      Object.entries(data).forEach(([k, v]) => {
        if (v == null) return;
        fd.append(k, typeof v === "boolean" ? (v ? "1" : "0") : v);
      });
      opt.body = fd;
    } else {
      const { attachment, ...rest } = data; // tanpa file baru: lampiran lama dibiarkan
      opt.headers["Content-Type"] = "application/json";
      opt.body = JSON.stringify(rest);
    }
  }
  const res = await fetch(url, opt);
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || "Permintaan ke server gagal.");
  }
  return res.json();
}

async function loadAll() {
  try {
    const [profile, projects, courses, tasks] = await Promise.all([
      api("GET", "/api/profile"),
      api("GET", "/api/projects"),
      api("GET", "/api/courses"),
      api("GET", "/api/tasks"),
    ]);
    S = { profile, projects, courses, tasks };
  } catch (e) {
    alert(
      "Tidak bisa terhubung ke server/database. Pastikan 'npm start' sudah berjalan dan MySQL aktif.",
    );
  }
}

async function removeItem(listKey, id) {
  try {
    await api("DELETE", "/api/" + listKey + "/" + id);
    S[listKey] = S[listKey].filter((x) => x.id !== id);
    return true;
  } catch (e) {
    alert(e.message);
    return false;
  }
}

/* ---------- Helper form: Create + Update ---------- */
function crudForm(formSel, listKey, readForm, onChange, validate) {
  const form = $(formSel);
  const submit = form.querySelector('[type="submit"]');
  const cancel = form.querySelector(".cancel");
  const hint = form.querySelector(".hint");
  const label = submit.textContent;
  let editId = null;

  function exit() {
    editId = null;
    form.reset();
    submit.textContent = label;
    cancel.hidden = true;
    hint.hidden = true;
    form.classList.remove("editing");
  }
  form.onsubmit = async (e) => {
    e.preventDefault();
    const data = await readForm(new FormData(form));
    if (!data) return;
    if (validate && !validate(data)) return;
    try {
      if (editId !== null) await api("PUT", "/api/" + listKey + "/" + editId, data); // UPDATE
      else await api("POST", "/api/" + listKey, data); // CREATE
      S[listKey] = await api("GET", "/api/" + listKey);
    } catch (err) {
      alert(err.message);
      return;
    }
    exit();
    onChange();
  };
  cancel.onclick = exit;
  return function startEdit(item) {
    // dipanggil tombol Edit
    editId = item.id;
    [...form.elements].forEach((f) => {
      if (!f.name || f.type === "file") return; // input file tidak boleh diisi lewat JS
      if (f.type === "checkbox") f.checked = !!item[f.name];
      else f.value = f.name === "tags" ? item.tags.join(", ") : (item[f.name] ?? "");
    });
    submit.textContent = "Simpan perubahan";
    cancel.hidden = false;
    hint.hidden = false;
    form.classList.add("editing");
    form.scrollIntoView({ block: "center" });
    form.querySelector("input").focus();
  };
}

/* ---------- Read: tampilan ---------- */
function renderProfile() {
  const p = S.profile;
  $("#pName").textContent = p.name;
  $("#pRole").textContent = p.role;
  $("#pBio").textContent = p.bio;
  $("#pMail").href = "mailto:" + p.email;
  document.title = p.name + " – Portofolio";
}

function renderEducation() {
  const box = $("#education");
  const items = [
    {
      year: "2024 - Sekarang",
      title: "UNIVERSITAS MUHAMMADIYAH CIREBON",
      text: "Mahasiswa aktif yang fokus pada pengembangan web, UI/UX, dan aplikasi berbasis browser.",
    },
    {
      year: "2021 - 2024",
      title: "SMK MUHAMMADIYAH LEMAHABANG",
      text: "Lulus dengan dasar pemrograman, IT, dan kemampuan komunikasi yang kuat.",
    },
    {
      year: "2018- 2021",
      title: "SMPN 2 LEMAHABANG CIREBON",
      text: "Memperoleh dasar akademik dan minat terhadap teknologi serta kreativitas.",
    },
  ];
  box.replaceChildren();
  items.forEach((item) => {
    const card = el("div", "timeline-item");
    const content = el("div", "content");
    content.append(
      el("div", "year", item.year),
      el("h3", null, item.title),
      el("p", null, item.text),
    );
    card.append(content);
    box.append(card);
  });
}

function renderContact() {
  const box = $("#contact");
  const items = [
    {
      title: "Instagram",
      value: "@dimas_hrdnsyah",
      href: "https://instagram.com/dimas_hrdnsyah",
      icon: "◎",
    },
    {
      title: "Email",
      value: S.profile.email || "dimasherdiansyahromadonii@gmail.com",
      href:
        "mailto:" + (S.profile.email || "dimasherdiansyahromadonii@gmail.com"),
      icon: "@",
    },
    {
      title: "GitHub",
      value: "github.com/dimas",
      href: "https://dimasherdiansyahromadonii-netizen.github.io/",
      icon: "◌",
    },
    {
      title: "LinkedIn",
      value:
        "https://www.linkedin.com/in/dimas-herdiansyah-romadoni-2735703b8?",
      href: "https://www.linkedin.com/in/dimas-herdiansyah-romadoni-2735703b8?",
      icon: "in",
    },
  ];
  box.replaceChildren();
  items.forEach((item) => {
    const card = el("div", "contact-card");
    const header = el("div", "contact-header");
    const icon = el("span", "contact-icon", item.icon);
    const title = el("h3", null, item.title);
    header.append(icon, title);
    card.append(header, el("p", null, item.value));
    const link = document.createElement("a");
    link.href = item.href;
    link.target = "_blank";
    link.rel = "noopener noreferrer";
    link.textContent = "Buka";
    card.append(link);
    box.append(card);
  });
}

function renderProjects() {
  const box = $("#projects");
  box.replaceChildren();
  if (!S.projects.length) {
    box.append(
      el("p", "empty", "Belum ada proyek. Tambahkan lewat formulir di atas."),
    );
    return;
  }
  S.projects.forEach((p) => {
    const c = el("article", "proj");
    c.append(el("h3", null, p.title), el("p", null, p.desc));
    const tg = el("div", "tags");
    p.tags.forEach((t) => tg.append(el("span", "tag", t)));
    c.append(tg);
    const r = el("div", "row");
    if (p.url) {
      const a = el("a", null, "Buka proyek");
      a.href = p.url;
      a.target = "_blank";
      a.rel = "noopener";
      r.append(a);
    } else r.append(el("span"));
    const acts = el("div", "acts");
    acts.append(
      btn("Edit", "ghost warn", () => editProject(p)),
      btn("Hapus", "ghost", async () => {
        if (confirm("Hapus proyek ini?") && (await removeItem("projects", p.id)))
          renderProjects();
      }),
    );
    r.append(acts);
    c.append(r);
    box.append(c);
  });
}

function renderDays() {
  const box = $("#days");
  box.replaceChildren();
  DAYS.forEach((n, i) => {
    const d = el("div", "day" + (i === todayIdx ? " now" : ""));
    d.append(el("h3", null, n));
    const list = S.courses
      .filter((c) => c.day === i)
      .sort((a, b) => a.start.localeCompare(b.start));
    if (!list.length) d.append(el("div", "empty", "Tidak ada kelas"));
    list.forEach((c) => {
      const x = el("div", "cls");
      x.append(
        el("b", null, c.name),
        el(
          "small",
          null,
          c.start + "–" + c.end + (c.room ? " · " + c.room : ""),
        ),
      );
      const acts = el("div", "acts");
      acts.append(
        btn("Edit", "ghost warn", () => editCourse(c)),
        btn("Hapus", "ghost", async () => {
          if (confirm("Hapus jadwal ini?") && (await removeItem("courses", c.id)))
            renderAll();
        }),
      );
      x.append(acts);
      d.append(x);
    });
    box.append(d);
  });
  const dl = $("#courseList");
  dl.replaceChildren();
  [...new Set(S.courses.map((c) => c.name))].forEach((n) => {
    const o = document.createElement("option");
    o.value = n;
    dl.append(o);
  });
}

function dueInfo(t) {
  const days = Math.round(
    (new Date(t.due + "T00:00:00") - new Date(iso(today) + "T00:00:00")) /
      864e5,
  );
  if (t.done) return ["Selesai", "ok"];
  if (days < 0) return ["Lewat " + -days + " hari", "late"];
  if (days === 0) return ["Hari ini", "late"];
  if (days === 1) return ["Besok", ""];
  return [days + " hari lagi", ""];
}

function renderTasks() {
  const box = $("#tasks");
  box.replaceChildren();
  $("#taskCount").textContent =
    S.tasks.filter((t) => !t.done).length +
    " belum selesai dari " +
    S.tasks.length;
  let list = [...S.tasks].sort(
    (a, b) => (a.done ? 1 : 0) - (b.done ? 1 : 0) || a.due.localeCompare(b.due),
  );
  if (filter === "open") list = list.filter((t) => !t.done);
  if (filter === "done") list = list.filter((t) => t.done);
  if (!list.length) {
    box.append(el("p", "empty", "Tidak ada tugas di daftar ini."));
    return;
  }
  list.forEach((t) => {
    const r = el("div", "task" + (t.done ? " done" : ""));
    const cb = document.createElement("input");
    cb.type = "checkbox";
    cb.checked = t.done;
    cb.setAttribute("aria-label", "Tandai selesai: " + t.title);
    cb.onchange = async () => {
      try {
        await api("PATCH", "/api/tasks/" + t.id + "/done", { done: cb.checked });
        t.done = cb.checked; // update status
      } catch (e) {
        alert(e.message);
        cb.checked = t.done;
        return;
      }
      renderTasks();
      renderToday();
    };
    const m = el("div", "t");
    const title = el("b", null, t.title);
    const status = el(
      "span",
      "task-status" + (t.done ? "" : " pending"),
      t.done ? "✓ Sudah dikumpulkan" : "⏳ Belum dikumpulkan",
    );
    m.append(
      title,
      el(
        "small",
        null,
        (t.course || "Tanpa mata kuliah") + " · tenggat " + t.due,
      ),
      status,
    );
    if (t.attachment) {
      const attach = el("div", "task-attachment");
      if (t.attachment.type && t.attachment.type.startsWith("image/")) {
        const img = document.createElement("img");
        img.src = t.attachment.url;
        img.alt = t.attachment.name || "Lampiran tugas";
        attach.append(img);
      }
      const a = document.createElement("a");
      a.href = t.attachment.url;
      a.target = "_blank";
      a.rel = "noopener noreferrer";
      a.textContent = "📎 " + (t.attachment.name || "Buka lampiran");
      attach.append(a);
      m.append(attach);
    }
    const [txt, cls] = dueInfo(t);
    const acts = el("div", "acts");
    acts.append(
      btn("Edit", "ghost warn", () => editTask(t)),
      btn("Hapus", "ghost", async () => {
        if (confirm("Hapus tugas ini?") && (await removeItem("tasks", t.id))) {
          renderTasks();
          renderToday();
        }
      }),
    );
    r.append(cb, m, el("span", "due " + cls, txt), acts);
    box.append(r);
  });
}

function renderToday() {
  $("#todayLabel").textContent = DAYS[todayIdx] || "Minggu";
  const now =
    String(today.getHours()).padStart(2, "0") +
    ":" +
    String(today.getMinutes()).padStart(2, "0");
  const cl = S.courses
    .filter((c) => c.day === todayIdx && c.end > now)
    .sort((a, b) => a.start.localeCompare(b.start))[0];
  if (cl) {
    $("#nextClass").textContent = cl.name;
    $("#nextClassSub").textContent =
      cl.start + "–" + cl.end + (cl.room ? " di " + cl.room : "");
  } else {
    $("#nextClass").textContent = "Tidak ada kelas lagi";
    $("#nextClassSub").textContent = "Waktunya mengerjakan tugas.";
  }
  const ul = $("#soon");
  ul.replaceChildren();
  const next = S.tasks
    .filter((t) => !t.done)
    .sort((a, b) => a.due.localeCompare(b.due))
    .slice(0, 3);
  if (!next.length) {
    ul.append(el("li", null, "Semua tugas selesai."));
    return;
  }
  next.forEach((t) => {
    const li = el("li");
    li.append(el("span", null, t.title), el("span", null, dueInfo(t)[0]));
    ul.append(li);
  });
}

function renderAll() {
  renderProfile();
  renderEducation();
  renderContact();
  renderProjects();
  renderDays();
  renderTasks();
  renderToday();
}

/* ---------- Form: Create & Update ---------- */
const editProject = crudForm(
  "#projForm",
  "projects",
  (f) => ({
    title: f.get("title"),
    desc: f.get("desc"),
    tags: f
      .get("tags")
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean),
    url: f.get("url") || "",
  }),
  renderProjects,
);

function normalizeTime(value) {
  if (typeof value !== "string") return value;
  const s = value.trim();
  if (!s) return s;
  return s.includes(".") ? s.replace(/\./g, ":") : s;
}

const editCourse = crudForm(
  "#courseForm",
  "courses",
  (f) => {
    const start = normalizeTime(f.get("start"));
    const end = normalizeTime(f.get("end"));
    return {
      name: f.get("name"),
      day: +f.get("day"),
      start,
      end,
      room: f.get("room"),
    };
  },
  renderAll,
  (d) =>
    d.end > d.start ||
    (alert(
      "Jam selesai harus setelah jam mulai. Gunakan format 13:00 atau 13.00.",
    ),
    false),
);

const editTask = crudForm(
  "#taskForm",
  "tasks",
  (f) => {
    const file = f.get("attachment");
    if (file && file.size > 20 * 1024 * 1024) {
      alert("Ukuran file terlalu besar. Maksimal 20 MB.");
      return null;
    }
    return {
      title: f.get("title"),
      course: f.get("course"),
      due: f.get("due"),
      attachment: file && file.size ? file : null,
      done: !!f.get("done"),
    };
  },
  () => {
    renderTasks();
    renderToday();
  },
);

DAYS.forEach((d, i) => {
  const o = document.createElement("option");
  o.value = i;
  o.textContent = d;
  $("#daySel").append(o);
});
$("#daySel").value = Math.min(todayIdx, 5);

/* ---------- Filter, profil, tema ---------- */
document.querySelectorAll(".filters button").forEach(
  (b) =>
    (b.onclick = () => {
      filter = b.dataset.f;
      document
        .querySelectorAll(".filters button")
        .forEach((x) => x.setAttribute("aria-pressed", x === b));
      renderTasks();
    }),
);

const dlg = $("#dlg");
const navTabs = document.querySelectorAll(".nav-tab");
const tabPanels = document.querySelectorAll(".tab-panel");

function activateTab(name) {
  const profilePanel = document.getElementById("profil");
  const validPanel = Array.from(tabPanels).some(
    (panel) => panel.dataset.panel === name,
  );
  if (!validPanel) return;

  navTabs.forEach((btn) => {
    const active = btn.dataset.tab === name;
    btn.classList.toggle("active", active);
    btn.setAttribute("aria-selected", String(active));
  });

  tabPanels.forEach((panel) => {
    const active = panel.dataset.panel === name;
    panel.classList.toggle("active", active);
  });

  if (profilePanel) {
    profilePanel.style.display = name === "profil" ? "grid" : "none";
  }
}

navTabs.forEach((btn) => {
  btn.addEventListener("click", () => activateTab(btn.dataset.tab));
});

const projectShortcut = $("#projectShortcut");
if (projectShortcut) {
  projectShortcut.addEventListener("click", (event) => {
    event.preventDefault();
    activateTab("proyek");
    history.replaceState(null, "", "#proyek");
    window.scrollTo({ top: 0, behavior: "smooth" });
  });
}

window.addEventListener("hashchange", () => {
  const name = window.location.hash.slice(1);
  if (name) activateTab(name);
});

$("#editProfile").onclick = () => {
  const p = S.profile;
  $("#fName").value = p.name;
  $("#fRole").value = p.role;
  $("#fBio").value = p.bio;
  $("#fMail").value = p.email;
  dlg.showModal();
};
$("#saveProf").onclick = async () => {
  try {
    S.profile = await api("PUT", "/api/profile", {
      name: $("#fName").value || "Nama Kamu",
      role: $("#fRole").value,
      bio: $("#fBio").value,
      email: $("#fMail").value || "nama@email.com",
    });
  } catch (e) {
    alert(e.message);
  }
  renderProfile();
  renderContact();
};
activateTab(window.location.hash.slice(1) || "profil");
loadAll().then(renderAll);
