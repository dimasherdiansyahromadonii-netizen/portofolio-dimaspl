-- Jalankan file ini sekali di MySQL (phpMyAdmin > Import, atau: mysql -u root -p < schema.sql)

CREATE DATABASE IF NOT EXISTS portofolio
  CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE portofolio;

CREATE TABLE IF NOT EXISTS profile (
  id     TINYINT      PRIMARY KEY,            -- selalu 1 (hanya satu profil)
  name   VARCHAR(50)  NOT NULL,
  role   VARCHAR(70)  NOT NULL DEFAULT '',
  bio    VARCHAR(320) NOT NULL DEFAULT '',
  email  VARCHAR(100) NOT NULL
);

CREATE TABLE IF NOT EXISTS projects (
  id          INT AUTO_INCREMENT PRIMARY KEY,
  title       VARCHAR(60)  NOT NULL,
  description VARCHAR(160) NOT NULL,
  tags        VARCHAR(255) NOT NULL DEFAULT '',   -- dipisah koma: "HTML,CSS,JS"
  url         VARCHAR(255) NOT NULL DEFAULT '',
  created_at  TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS courses (
  id         INT AUTO_INCREMENT PRIMARY KEY,
  name       VARCHAR(50) NOT NULL,
  day_index  TINYINT     NOT NULL,                -- 0 = Senin ... 5 = Sabtu
  start_time CHAR(5)     NOT NULL,                -- "08:00"
  end_time   CHAR(5)     NOT NULL,
  room       VARCHAR(20) NOT NULL DEFAULT ''
);

CREATE TABLE IF NOT EXISTS tasks (
  id              INT AUTO_INCREMENT PRIMARY KEY,
  title           VARCHAR(80)  NOT NULL,
  course          VARCHAR(50)  NOT NULL DEFAULT '',
  due_date        DATE         NOT NULL,
  is_done         TINYINT(1)   NOT NULL DEFAULT 0,
  attachment_name VARCHAR(255) NULL,              -- nama asli file
  attachment_type VARCHAR(100) NULL,              -- mime type
  attachment_path VARCHAR(255) NULL               -- lokasi file di folder uploads/
);

-- Data awal
INSERT INTO profile (id, name, role, bio, email) VALUES
  (1, 'Dimas Herdiansyah Romadoni', 'Mahasiswa Teknik Informatika',
   'Saya mahasiswa yang suka membangun aplikasi web sederhana yang berguna. Klik Edit profil untuk mengganti teks ini.',
   'dimasherdiansyahromadonii@gmail.com')
ON DUPLICATE KEY UPDATE id = id;

INSERT INTO projects (title, description, tags) VALUES
  ('Aplikasi Catatan Kuliah', 'Aplikasi web untuk mencatat materi per mata kuliah.', 'HTML,CSS,JavaScript'),
  ('Sistem Informasi Perpustakaan', 'Tugas besar basis data: peminjaman dan denda otomatis.', 'MySQL,PHP');

INSERT INTO courses (name, day_index, start_time, end_time, room) VALUES
  ('Pemrograman Web', 0, '08:00', '09:40', 'Lab 2'),
  ('Basis Data',      2, '10:00', '11:40', 'R. 301'),
  ('Struktur Data',   3, '13:00', '14:40', 'R. 204');

INSERT INTO tasks (title, course, due_date) VALUES
  ('Buat halaman portofolio', 'Pemrograman Web', DATE_ADD(CURDATE(), INTERVAL 3 DAY)),
  ('Latihan query JOIN',      'Basis Data',      DATE_ADD(CURDATE(), INTERVAL 6 DAY));
