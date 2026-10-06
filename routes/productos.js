const express = require("express");
const fs = require("fs");
const path = require("path");
const db = require("../db");
const { DB_PATH } = require("../dbConfig");
const { apiResponse } = require("../utils/apiResponse");

const router = express.Router();

// GET /api/productos -> lista todos los productos
router.get("/", (req, res) => {
  try {
    const productos = db.prepare("SELECT * FROM productos").all();
    res.status(200).json(apiResponse(200, productos));
  } catch (error) {
    res.status(500).json(apiResponse(500, { message: error.message }));
  }
});

// GET /api/productos/categoria/:categoriaId -> productos de una categoria
router.get("/categoria/:categoriaId", (req, res) => {
  try {
    const { categoriaId } = req.params;

    const categoria = db
      .prepare("SELECT * FROM categorias WHERE id = ?")
      .get(categoriaId);

    if (!categoria) {
      return res
        .status(404)
        .json(apiResponse(404, { message: "Categoria no encontrada" }));
    }

    const productos = db
      .prepare("SELECT * FROM productos WHERE categoria_id = ?")
      .all(categoriaId);

    res.status(200).json(apiResponse(200, productos));
  } catch (error) {
    res.status(500).json(apiResponse(500, { message: error.message }));
  }
});

// POST /api/productos/backup -> respalda el archivo database.db
router.post("/backup", (req, res) => {
  try {
    const backupsDir = path.join(__dirname, "..", "backups");

    if (!fs.existsSync(backupsDir)) {
      fs.mkdirSync(backupsDir, { recursive: true });
    }

    const now = new Date();
    const pad = (n) => String(n).padStart(2, "0");
    const timestamp = `${now.getFullYear()}${pad(now.getMonth() + 1)}${pad(
      now.getDate()
    )}_${pad(now.getHours())}${pad(now.getMinutes())}${pad(now.getSeconds())}`;

    const backupFileName = `database_backup_${timestamp}.db`;
    const backupPath = path.join(backupsDir, backupFileName);

    fs.copyFileSync(DB_PATH, backupPath);

    res.status(200).json(apiResponse(200, backupFileName));
  } catch (error) {
    res.status(500).json(apiResponse(500, { message: error.message }));
  }
});

// DELETE /api/productos/vaciar -> elimina todos los productos y categorias
router.delete("/vaciar", (req, res) => {
  try {
    db.prepare("DELETE FROM productos").run();
    db.prepare("DELETE FROM categorias").run();

    res
      .status(200)
      .json(
        apiResponse(200, {
          message: "Se eliminaron todos los productos y categorias",
        })
      );
  } catch (error) {
    res.status(500).json(apiResponse(500, { message: error.message }));
  }
});

// GET /api/productos/:id -> obtiene un producto por id
router.get("/:id", (req, res) => {
  try {
    const { id } = req.params;

    const producto = db
      .prepare("SELECT * FROM productos WHERE id = ?")
      .get(id);

    if (!producto) {
      return res
        .status(404)
        .json(apiResponse(404, { message: "Producto no encontrado" }));
    }

    res.status(200).json(apiResponse(200, producto));
  } catch (error) {
    res.status(500).json(apiResponse(500, { message: error.message }));
  }
});

// POST /api/productos -> crea un producto
router.post("/", (req, res) => {
  try {
    const { nombre, descripcion, precio, stock, categoriaId } = req.body;

    if (!nombre || precio === undefined || precio === null) {
      return res
        .status(400)
        .json(
          apiResponse(400, {
            message: "Los campos nombre y precio son requeridos",
          })
        );
    }

    if (categoriaId) {
      const categoria = db
        .prepare("SELECT * FROM categorias WHERE id = ?")
        .get(categoriaId);

      if (!categoria) {
        return res
          .status(404)
          .json(apiResponse(404, { message: "Categoria no encontrada" }));
      }
    }

    const result = db
      .prepare(
        "INSERT INTO productos (nombre, descripcion, precio, stock, categoria_id) VALUES (?, ?, ?, ?, ?)"
      )
      .run(
        nombre,
        descripcion ?? null,
        precio,
        stock ?? 0,
        categoriaId ?? null
      );

    const nuevoProducto = db
      .prepare("SELECT * FROM productos WHERE id = ?")
      .get(result.lastInsertRowid);

    res.status(201).json(apiResponse(201, nuevoProducto));
  } catch (error) {
    res.status(500).json(apiResponse(500, { message: error.message }));
  }
});

// PUT /api/productos/:id -> actualiza los campos enviados de un producto
router.put("/:id", (req, res) => {
  try {
    const { id } = req.params;
    const body = req.body ?? {};

    const producto = db
      .prepare("SELECT * FROM productos WHERE id = ?")
      .get(id);

    if (!producto) {
      return res
        .status(404)
        .json(apiResponse(404, { message: "Producto no encontrado" }));
    }

    // campo del body -> columna en la tabla
    const camposPermitidos = {
      nombre: "nombre",
      descripcion: "descripcion",
      precio: "precio",
      stock: "stock",
      categoriaId: "categoria_id",
    };

    const campos = Object.keys(camposPermitidos).filter((campo) =>
      Object.hasOwn(body, campo)
    );

    if (campos.length === 0) {
      return res
        .status(400)
        .json(apiResponse(400, { message: "No hay datos para actualizar" }));
    }

    if (
      (campos.includes("nombre") && !body.nombre) ||
      (campos.includes("precio") && body.precio === null)
    ) {
      return res
        .status(400)
        .json(
          apiResponse(400, {
            message: "Los campos nombre y precio no pueden estar vacios",
          })
        );
    }

    if (body.categoriaId !== undefined && body.categoriaId !== null) {
      const categoria = db
        .prepare("SELECT * FROM categorias WHERE id = ?")
        .get(body.categoriaId);

      if (!categoria) {
        return res
          .status(404)
          .json(apiResponse(404, { message: "Categoria no encontrada" }));
      }
    }

    const setClause = campos
      .map((campo) => `${camposPermitidos[campo]} = ?`)
      .join(", ");
    const valores = campos.map((campo) => body[campo]);

    db.prepare(`UPDATE productos SET ${setClause} WHERE id = ?`).run(
      ...valores,
      id
    );

    const productoActualizado = db
      .prepare("SELECT * FROM productos WHERE id = ?")
      .get(id);

    res.status(200).json(apiResponse(200, productoActualizado));
  } catch (error) {
    res.status(500).json(apiResponse(500, { message: error.message }));
  }
});

// DELETE /api/productos/:id -> elimina un producto por id
router.delete("/:id", (req, res) => {
  try {
    const { id } = req.params;

    const producto = db
      .prepare("SELECT * FROM productos WHERE id = ?")
      .get(id);

    if (!producto) {
      return res
        .status(404)
        .json(apiResponse(404, { message: "Producto no encontrado" }));
    }

    db.prepare("DELETE FROM productos WHERE id = ?").run(id);

    res
      .status(200)
      .json(apiResponse(200, { message: "Producto eliminado correctamente" }));
  } catch (error) {
    res.status(500).json(apiResponse(500, { message: error.message }));
  }
});

module.exports = router;
