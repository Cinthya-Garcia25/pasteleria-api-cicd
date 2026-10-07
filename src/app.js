const express = require("express");
const cors = require("cors");

require("./db");

const categoriasRoutes = require("./routes/categorias");
const productosRoutes = require("./routes/productos");
const healthRoutes = require("./routes/health");

const app = express();

app.use(express.json());
app.use(cors());

app.use("/api/categorias", categoriasRoutes);
app.use("/api/productos", productosRoutes);
app.use("/api/health", healthRoutes);

module.exports = app;
