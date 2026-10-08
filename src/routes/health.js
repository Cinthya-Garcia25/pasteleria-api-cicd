const express = require("express");
const { apiResponse } = require("../utils/apiResponse");

const router = express.Router();


router.get("/", (req, res) => {
  
  res.status(200).json({
    ...apiResponse(200),
    status: "ok",
    mensaje: "API de pastelería funcionando correctamente",
  });
});

module.exports = router;
