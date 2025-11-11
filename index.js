const express = require('express')
const path = require('path')
const crypto = require('crypto')
const Database = require('better-sqlite3')

const app = express()
const port = 3000

// Middleware
app.use(express.json())
app.use(express.static(path.join(__dirname, 'public')))

// 📌 Koneksi DB & buat tabel jika belum ada
const db = new Database('./apikeys.db')
db.prepare(`
  CREATE TABLE IF NOT EXISTS apikeys (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    key TEXT NOT NULL UNIQUE,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )
`).run()

// 🔐 Fungsi generate API Key
function generateApiKey() {
  const key = crypto.randomBytes(24).toString('hex')
  return `sk-sm-v1-${key}`
}

// ✅ Endpoint: Create API Key & simpan ke DB
app.post('/create', (req, res) => {
  const apiKey = generateApiKey()
  db.prepare(`INSERT INTO apikeys(key) VALUES (?)`).run(apiKey)
  res.json({ apiKey })
})

// ✅ Endpoint: Cek validitas API Key
app.post('/cekapi', (req, res) => {
  const { apiKey } = req.body

  if (!apiKey) {
    return res.status(400).json({ message: 'API Key tidak boleh kosong!' })
  }

  const result = db
    .prepare(`SELECT * FROM apikeys WHERE key = ?`)
    .get(apiKey)

  if (!result) {
    return res.status(401).json({ message: '❌ API Key TIDAK VALID' })
  }

  res.json({
    message: '✅ API Key VALID',
    created_at: result.created_at
  })
})

// ✅ Endpoint: List semua API Key yang valid
app.get('/listapikey', (req, res) => {
  const rows = db.prepare(`SELECT id, key, created_at FROM apikeys ORDER BY created_at DESC`).all()
  res.json({
    count: rows.length,
    apikeys: rows
  })
})
