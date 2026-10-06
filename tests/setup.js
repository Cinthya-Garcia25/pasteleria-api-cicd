const fs = require("fs");
const Database = require("better-sqlite3");

// Jest corre este archivo una vez antes de todas las pruebas (globalSetup)
module.exports = async () => {
  process.env.NODE_ENV = "test";

  const { DB_PATH, createTables } = require("../src/dbConfig");

  if (fs.existsSync(DB_PATH)) {
    fs.unlinkSync(DB_PATH);
  }

  const db = new Database(DB_PATH);
  db.pragma("foreign_keys = ON");

  createTables(db);

  // datos semilla con IDs fijos para que las pruebas sean predecibles
  const insertCategoria = db.prepare(
    "INSERT INTO categorias (id, nombre, descripcion) VALUES (?, ?, ?)"
  );
  insertCategoria.run(1, "Pasteles", "Pasteles para toda ocasion");
  insertCategoria.run(2, "Galletas", "Galletas artesanales");

  const insertProducto = db.prepare(
    "INSERT INTO productos (id, nombre, descripcion, precio, stock, categoria_id) VALUES (?, ?, ?, ?, ?, ?)"
  );
  insertProducto.run(1, "Pastel de chocolate", "Con ganache", 350, 10, 1);
  insertProducto.run(2, "Galletas de avena", "Con pasas", 80, 20, 2);

  db.close();
};
