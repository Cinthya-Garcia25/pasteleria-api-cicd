const Database = require("better-sqlite3");
const { DB_PATH, createTables } = require("./dbConfig");

const db = new Database(DB_PATH);

db.pragma("foreign_keys = ON");

createTables(db);

function seedData() {
  const { count: categoriasCount } = db
    .prepare("SELECT COUNT(*) AS count FROM categorias")
    .get();

  if (categoriasCount === 0) {
    const insertCategoria = db.prepare(
      "INSERT INTO categorias (nombre, descripcion) VALUES (?, ?)"
    );

    const categorias = [
      ["Pasteles", "Pasteles de diferentes sabores para toda ocasion"],
      ["Panques", "Panques caseros horneados diariamente"],
      ["Galletas", "Galletas artesanales de distintos sabores"],
    ];

    const categoriaIds = categorias.map(
      ([nombre, descripcion]) => insertCategoria.run(nombre, descripcion).lastInsertRowid
    );

    const { count: productosCount } = db
      .prepare("SELECT COUNT(*) AS count FROM productos")
      .get();

    if (productosCount === 0) {
      const insertProducto = db.prepare(
        "INSERT INTO productos (nombre, descripcion, precio, stock, categoria_id) VALUES (?, ?, ?, ?, ?)"
      );

      const productos = [
        [
          "Pastel de chocolate",
          "Pastel de chocolate con relleno de ganache",
          350.0,
          10,
          categoriaIds[0],
        ],
        [
          "Pastel de fresa",
          "Pastel de vainilla con fresas naturales",
          380.0,
          8,
          categoriaIds[0],
        ],
        [
          "Panque de vainilla",
          "Panque esponjoso de vainilla",
          120.0,
          15,
          categoriaIds[1],
        ],
        [
          "Panque de nuez",
          "Panque con trozos de nuez",
          140.0,
          12,
          categoriaIds[1],
        ],
        [
          "Galletas de avena",
          "Galletas de avena con pasas",
          80.0,
          20,
          categoriaIds[2],
        ],
      ];

      for (const producto of productos) {
        insertProducto.run(...producto);
      }
    }
  }
}

// en pruebas los datos semilla los inserta tests/setup.js
if (process.env.NODE_ENV !== "test") {
  seedData();
}

module.exports = db;
