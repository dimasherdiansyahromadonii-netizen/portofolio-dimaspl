# Portofolio + Jadwal + Tugas (Express + MySQL)

## Struktur
```
portofolio-mysql/
├── server.js        <- backend (API + koneksi MySQL)
├── schema.sql       <- tabel + data awal
├── package.json
├── .env.example     <- salin jadi .env
├── uploads/         <- file tugas yang diunggah
└── public/          <- index.html, style.css, script.js
    └── asset/foto3.jpeg   <- LETAKKAN FOTO PROFIL ANDA DI SINI
```

## Cara menjalankan
1. Install Node.js (https://nodejs.org) dan MySQL (atau XAMPP, lalu Start "MySQL").
2. Buat database: import `schema.sql` lewat phpMyAdmin, atau
   `mysql -u root -p < schema.sql`
3. Salin `.env.example` menjadi `.env`, isi `DB_USER` dan `DB_PASSWORD` sesuai MySQL Anda.
4. Di folder proyek:
   ```
   npm install
   npm start
   ```
5. Buka http://localhost:3000

> Jangan buka index.html langsung (file://) -- harus lewat http://localhost:3000.
