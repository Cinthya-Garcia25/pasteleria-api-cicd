const express = require("express");
const { apiResponse } = require("../utils/apiResponse");

const router = express.Router();

// GET /api/health -> confirma que la API esta corriendo
router.get("/", (req, res) => {
  // sin data, apiResponse solo aporta statusCode (data undefined no se serializa)
  res.status(200).json({
    ...apiResponse(200),
    status: "ok",
    mensaje: "API de pastelería funcionando correctamente",
  });
});

module.exports = router;
