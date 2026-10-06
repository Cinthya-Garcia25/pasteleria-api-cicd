const net = require("net");

const HOST = process.env.TCP_HOST || "localhost";
const PORT = Number(process.env.TCP_PORT) || 6061;

const NUEVO_PRODUCTO = {
  nombre: "Cupcake de mango2",
  descripcion: "Cupcake con betún de mango y relleno de crema de mango",
  precio: 35,
  stock: 20,
  categoriaId: 1,
};

function extraerData(respuesta) {
  const inicio = respuesta.indexOf("data:") + "data:".length;
  const json = respuesta.slice(inicio, -1);
  return JSON.parse(json);
}

function enviarComando(socket, comando) {
  return new Promise((resolve, reject) => {
    console.log(`>> Enviando: ${comando}`);

    socket.once("data", (chunk) => {
      const respuesta = chunk.toString().trim();
      console.log(`<< Respuesta: ${respuesta}\n`);
      resolve(respuesta);
    });

    socket.write(comando + "\n", (error) => {
      if (error) reject(error);
    });
  });
}

const socket = net.connect({ host: HOST, port: PORT }, async () => {
  try {
    const insertCmd = `{insert:${JSON.stringify(NUEVO_PRODUCTO)}}`;
    const insertResp = await enviarComando(socket, insertCmd);
    const producto = extraerData(insertResp);

    const getCmd = `{get:${producto.id}}`;
    await enviarComando(socket, getCmd);

    socket.end();
  } catch (error) {
    console.error(`Error durante la demostración: ${error.message}`);
    socket.end();
  }
});

socket.on("error", (error) => {
  console.error(`No se pudo conectar al servidor: ${error.message}`);
});
