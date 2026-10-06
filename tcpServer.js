const net = require("net");
const db = require("./db");

function formatResponse(status, data) {
  return `{status:${status},data:${JSON.stringify(data)}}`;
}

function handleInsert(rawJson) {
  let payload;

  try {
    payload = JSON.parse(rawJson);
  } catch (error) {
    return formatResponse(400, { message: "JSON inválido" });
  }

  const { nombre, descripcion, precio, stock, categoriaId } = payload;

  if (!nombre || precio === undefined || precio === null) {
    return formatResponse(400, {
      message: "Los campos nombre y precio son requeridos",
    });
  }

  if (categoriaId) {
    const categoria = db
      .prepare("SELECT * FROM categorias WHERE id = ?")
      .get(categoriaId);

    if (!categoria) {
      return formatResponse(404, { message: "Categoria no encontrada" });
    }
  }

  const result = db
    .prepare(
      "INSERT INTO productos (nombre, descripcion, precio, stock, categoria_id) VALUES (?, ?, ?, ?, ?)"
    )
    .run(nombre, descripcion ?? null, precio, stock ?? 0, categoriaId ?? null);

  const nuevoProducto = db
    .prepare("SELECT * FROM productos WHERE id = ?")
    .get(result.lastInsertRowid);

  return formatResponse(200, nuevoProducto);
}

function handleGet(idPart) {
  const id = Number(idPart.trim());

  const producto = db.prepare("SELECT * FROM productos WHERE id = ?").get(id);

  if (!producto) {
    return formatResponse(404, { message: "Producto no encontrado" });
  }

  return formatResponse(200, producto);
}

function processCommand(command) {
  if (command.startsWith("{insert:") && command.endsWith("}")) {
    const rawJson = command.slice("{insert:".length, -1);
    return handleInsert(rawJson);
  }

  if (command.startsWith("{get:") && command.endsWith("}")) {
    const idPart = command.slice("{get:".length, -1);
    return handleGet(idPart);
  }

  return formatResponse(400, { message: "Comando no reconocido" });
}

function startTcpServer(port) {
  const server = net.createServer((socket) => {
    socket.setEncoding("utf8");

    socket.on("data", (chunk) => {
      const command = chunk.toString().trim();

      if (!command) return;

      socket.write(processCommand(command) + "\n");
    });
  });

  server.listen(port, () => {
    console.log(`Servidor TCP de productos corriendo en el puerto ${port}`);
  });

  return server;
}

module.exports = { startTcpServer };
