const path = require("path");

// con NODE_ENV=test se usa un archivo aparte para no tocar la base de desarrollo
const DB_PATH = path.join(
  __dirname,
  "..",
  process.env.NODE_ENV === "test" ? "test-database.db" : "database.db"
);

function createTables(db) {
  db.exec(`
    CREATE TABLE IF NOT EXISTS categorias (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      nombre TEXT NOT NULL,
      descripcion TEXT
    )
  `);

  db.exec(`
    CREATE TABLE IF NOT EXISTS productos (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      nombre TEXT NOT NULL,
      descripcion TEXT,
      precio REAL NOT NULL,
      stock INTEGER DEFAULT 0,
      categoria_id INTEGER,
      FOREIGN KEY (categoria_id) REFERENCES categorias(id)
    )
  `);
}

module.exports = { DB_PATH, createTables };
