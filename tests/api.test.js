
process.env.NODE_ENV = "test";

const fs = require("fs");
const path = require("path");
const request = require("supertest");
const app = require("../src/app");

const CATEGORIA_PASTELES_ID = 1;
const PRODUCTO_CHOCOLATE_ID = 1;
const PRODUCTO_GALLETAS_ID = 2;
const ID_INEXISTENTE = 99999;

describe("GET /api/health", () => {
  it("debe responder 200 con el estado de la API", async () => {
    const res = await request(app).get("/api/health");

    expect(res.status).toBe(200);
    expect(res.body).toEqual({
      statusCode: 200,
      status: "ok",
      mensaje: "API de pastelería funcionando correctamente",
    });
  });
});

describe("GET /api/categorias", () => {
  it("debe responder 200 con el arreglo de categorias", async () => {
    const res = await request(app).get("/api/categorias");

    expect(res.status).toBe(200);
    expect(res.body.statusCode).toBe(200);
    expect(Array.isArray(res.body.data)).toBe(true);
    expect(res.body.data.length).toBeGreaterThanOrEqual(2);
    expect(res.body.data).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ id: CATEGORIA_PASTELES_ID, nombre: "Pasteles" }),
      ])
    );
  });
});

describe("POST /api/categorias", () => {
  it("debe crear una categoria y responder 201", async () => {
    const res = await request(app)
      .post("/api/categorias")
      .send({ nombre: "Panques", descripcion: "Panques caseros" });

    expect(res.status).toBe(201);
    expect(res.body.data).toMatchObject({
      id: expect.any(Number),
      nombre: "Panques",
      descripcion: "Panques caseros",
    });
  });

  it("debe responder 400 si el body no trae nombre", async () => {
    const res = await request(app)
      .post("/api/categorias")
      .send({ descripcion: "Sin nombre" });

    expect(res.status).toBe(400);
    expect(res.body.data.message).toBe("El campo nombre es requerido");
  });
});

describe("DELETE /api/categorias/:id", () => {
  let categoriaId;

  beforeAll(async () => {
    const res = await request(app)
      .post("/api/categorias")
      .send({ nombre: "Categoria temporal" });
    categoriaId = res.body.data.id;
  });

  it("debe eliminar una categoria sin productos asociados", async () => {
    const res = await request(app).delete(`/api/categorias/${categoriaId}`);

    expect(res.status).toBe(200);
    expect(res.body.data.message).toBe("Categoria eliminada correctamente");

    const lista = await request(app).get("/api/categorias");
    expect(lista.body.data.map((c) => c.id)).not.toContain(categoriaId);
  });

  it("debe responder 404 si la categoria no existe", async () => {
    const res = await request(app).delete(`/api/categorias/${ID_INEXISTENTE}`);

    expect(res.status).toBe(404);
    expect(res.body.data.message).toBe("Categoria no encontrada");
  });
});

describe("GET /api/productos", () => {
  it("debe responder 200 con el arreglo de productos", async () => {
    const res = await request(app).get("/api/productos");

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.data)).toBe(true);
    expect(res.body.data.length).toBeGreaterThanOrEqual(2);
    res.body.data.forEach((producto) => {
      expect(producto.disponible).toBe(producto.stock > 0);
    });
  });
});

describe("GET /api/productos/categoria/:categoriaId", () => {
  it("debe devolver solo los productos de la categoria indicada", async () => {
    const res = await request(app).get(
      `/api/productos/categoria/${CATEGORIA_PASTELES_ID}`
    );

    expect(res.status).toBe(200);
    expect(res.body.data.length).toBeGreaterThan(0);
    res.body.data.forEach((producto) => {
      expect(producto.categoria_id).toBe(CATEGORIA_PASTELES_ID);
    });
  });

  it("debe responder 404 si la categoria no existe", async () => {
    const res = await request(app).get(
      `/api/productos/categoria/${ID_INEXISTENTE}`
    );

    expect(res.status).toBe(404);
    expect(res.body.data.message).toBe("Categoria no encontrada");
  });
});

describe("GET /api/productos/:id", () => {
  it("debe devolver el producto si existe", async () => {
    const res = await request(app).get(`/api/productos/${PRODUCTO_CHOCOLATE_ID}`);

    expect(res.status).toBe(200);
    expect(res.body.data).toMatchObject({
      id: PRODUCTO_CHOCOLATE_ID,
      nombre: "Pastel de chocolate",
      precio: 350,
      stock: 10,
    });
    expect(res.body.data).toHaveProperty("disponible");
    expect(res.body.data.disponible).toBe(true);
  });

  it("debe marcar disponible en false si el stock es 0", async () => {
    const creado = await request(app)
      .post("/api/productos")
      .send({ nombre: "Producto agotado", precio: 20, stock: 0 });

    const res = await request(app).get(`/api/productos/${creado.body.data.id}`);

    expect(res.status).toBe(200);
    expect(res.body.data.disponible).toBe(false);
  });

  it("debe responder 404 si el producto no existe", async () => {
    const res = await request(app).get(`/api/productos/${ID_INEXISTENTE}`);

    expect(res.status).toBe(404);
    expect(res.body.data.message).toBe("Producto no encontrado");
  });
});

describe("POST /api/productos", () => {
  it("debe crear un producto valido y responder 201", async () => {
    const nuevo = {
      nombre: "Pastel de fresa",
      descripcion: "Con fresas naturales",
      precio: 380,
      stock: 5,
      categoriaId: CATEGORIA_PASTELES_ID,
    };

    const res = await request(app).post("/api/productos").send(nuevo);

    expect(res.status).toBe(201);
    expect(res.body.data).toMatchObject({
      id: expect.any(Number),
      nombre: nuevo.nombre,
      precio: nuevo.precio,
      stock: nuevo.stock,
      categoria_id: CATEGORIA_PASTELES_ID,
    });
  });

  it("debe responder 400 si falta el nombre", async () => {
    const res = await request(app).post("/api/productos").send({ precio: 100 });

    expect(res.status).toBe(400);
    expect(res.body.data.message).toBe(
      "Los campos nombre y precio son requeridos"
    );
  });

  it("debe responder 400 si falta el precio", async () => {
    const res = await request(app)
      .post("/api/productos")
      .send({ nombre: "Producto sin precio" });

    expect(res.status).toBe(400);
    expect(res.body.data.message).toBe(
      "Los campos nombre y precio son requeridos"
    );
  });

  it("debe responder 404 si la categoria no existe", async () => {
    const res = await request(app).post("/api/productos").send({
      nombre: "Producto huerfano",
      precio: 50,
      categoriaId: ID_INEXISTENTE,
    });

    expect(res.status).toBe(404);
    expect(res.body.data.message).toBe("Categoria no encontrada");
  });
});

describe("PUT /api/productos/:id", () => {
  it("debe actualizar solo los campos enviados", async () => {
    const res = await request(app)
      .put(`/api/productos/${PRODUCTO_GALLETAS_ID}`)
      .send({ precio: 95, stock: 30 });

    expect(res.status).toBe(200);
    expect(res.body.data).toMatchObject({
      id: PRODUCTO_GALLETAS_ID,
      nombre: "Galletas de avena",
      precio: 95,
      stock: 30,
    });
  });

  it("debe responder 404 si el producto no existe", async () => {
    const res = await request(app)
      .put(`/api/productos/${ID_INEXISTENTE}`)
      .send({ precio: 10 });

    expect(res.status).toBe(404);
    expect(res.body.data.message).toBe("Producto no encontrado");
  });

  it("debe responder 400 si el body viene vacio", async () => {
    const res = await request(app)
      .put(`/api/productos/${PRODUCTO_GALLETAS_ID}`)
      .send({});

    expect(res.status).toBe(400);
    expect(res.body.data.message).toBe("No hay datos para actualizar");
  });

  it("debe responder 404 si la categoria no existe", async () => {
    const res = await request(app)
      .put(`/api/productos/${PRODUCTO_GALLETAS_ID}`)
      .send({ categoriaId: ID_INEXISTENTE });

    expect(res.status).toBe(404);
    expect(res.body.data.message).toBe("Categoria no encontrada");
  });
});

describe("DELETE /api/productos/:id", () => {
  let productoId;

  beforeAll(async () => {
    const res = await request(app)
      .post("/api/productos")
      .send({ nombre: "Producto temporal", precio: 10 });
    productoId = res.body.data.id;
  });

  it("debe eliminar un producto existente", async () => {
    const res = await request(app).delete(`/api/productos/${productoId}`);

    expect(res.status).toBe(200);
    expect(res.body.data.message).toBe("Producto eliminado correctamente");

    const consulta = await request(app).get(`/api/productos/${productoId}`);
    expect(consulta.status).toBe(404);
  });

  it("debe responder 404 si el producto no existe", async () => {
    const res = await request(app).delete(`/api/productos/${ID_INEXISTENTE}`);

    expect(res.status).toBe(404);
    expect(res.body.data.message).toBe("Producto no encontrado");
  });
});

describe("POST /api/productos/backup", () => {
  let backupPath;

  afterAll(() => {
    if (backupPath && fs.existsSync(backupPath)) {
      fs.unlinkSync(backupPath);
    }
  });

  it("debe responder 200 y generar el archivo de respaldo", async () => {
    const res = await request(app).post("/api/productos/backup");

    expect(res.status).toBe(200);
    expect(res.body.data).toMatch(/^database_backup_\d{8}_\d{6}\.db$/);

    backupPath = path.join(__dirname, "..", "backups", res.body.data);
    expect(fs.existsSync(backupPath)).toBe(true);
  });
});

// se ejecuta al final porque borra todos los datos
describe("DELETE /api/productos/vaciar", () => {
  it("debe dejar las tablas de productos y categorias en 0 registros", async () => {
    const res = await request(app).delete("/api/productos/vaciar");

    expect(res.status).toBe(200);
    expect(res.body.data.message).toBe(
      "Se eliminaron todos los productos y categorias"
    );

    const productos = await request(app).get("/api/productos");
    const categorias = await request(app).get("/api/categorias");
    expect(productos.body.data).toHaveLength(0);
    expect(categorias.body.data).toHaveLength(0);
  });
});
