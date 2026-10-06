const express = require("express");
const db = require("../db");
const { apiResponse } = require("../utils/apiResponse");

const router = express.Router();

// GET /api/categorias -> lista todas las categorias
router.get("/", (req, res) => {
  try {
    const categorias = db.prepare("SELECT * FROM categorias").all();
    res.status(200).json(apiResponse(200, categorias));
  } catch (error) {
    res.status(500).json(apiResponse(500, { message: error.message }));
  }
});

// POST /api/categorias -> crea una categoria
router.post("/", (req, res) => {
  try {
    const { nombre, descripcion } = req.body;

    if (!nombre) {
      return res
        .status(400)
        .json(apiResponse(400, { message: "El campo nombre es requerido" }));
    }

    const result = db
      .prepare("INSERT INTO categorias (nombre, descripcion) VALUES (?, ?)")
      .run(nombre, descripcion ?? null);

    const nuevaCategoria = db
      .prepare("SELECT * FROM categorias WHERE id = ?")
      .get(result.lastInsertRowid);

    res.status(201).json(apiResponse(201, nuevaCategoria));
  } catch (error) {
    res.status(500).json(apiResponse(500, { message: error.message }));
  }
});

// DELETE /api/categorias/:id -> elimina una categoria por id
router.delete("/:id", (req, res) => {
  try {
    const { id } = req.params;

    const categoria = db
      .prepare("SELECT * FROM categorias WHERE id = ?")
      .get(id);

    if (!categoria) {
      return res
        .status(404)
        .json(apiResponse(404, { message: "Categoria no encontrada" }));
    }

    db.prepare("DELETE FROM categorias WHERE id = ?").run(id);

    res
      .status(200)
      .json(apiResponse(200, { message: "Categoria eliminada correctamente" }));
  } catch (error) {
    res.status(500).json(apiResponse(500, { message: error.message }));
  }
});

module.exports = router;
