**Categorías**

1. `GET http://<HOST>:8080/api/categorias`

2. `POST http://<HOST>:8080/api/categorias`
Body:
```json
{
  "nombre": "Pasteles",
  "descripcion": "Categoria de pasteles"
}
```

3. `DELETE http://<HOST>:8080/api/categorias/6`

**Productos**

4. `GET http://<HOST>:8080/api/productos`

5. `GET http://<HOST>:8080/api/productos/categoria/4`

6. `GET http://<HOST>:8080/api/productos/6`

7. `POST http://<HOST>:8080/api/productos`
Body:
```json
{
  "nombre": "Pastel de chocolate",
  "descripcion": "Pastel con cobertura de chocolate",
  "precio": 250,
  "stock": 10,
  "categoriaId": 4
}
```

8. `PUT http://<HOST>:8080/api/productos/6`
Body (todos los campos son opcionales; solo se actualizan los que se envían):
```json
{
  "nombre": "Pastel de chocolate amargo",
  "precio": 280,
  "stock": 5,
  "categoriaId": 4
}
```
Respuestas: `200` con el producto actualizado, `404` si el producto o la categoría no existen, `400` si el body no trae ningún campo para actualizar.

9. `DELETE http://<HOST>:8080/api/productos/7`

10. `POST http://<HOST>:8080/api/productos/backup`

11. `DELETE http://<HOST>:8080/api/productos/vaciar`

**Recuperar la base de datos (si se elimina o se vacía)**

La API no tiene un endpoint de "restaurar". Se hace manualmente en el servidor, usando el respaldo generado con el endpoint 10:

1. Conectarse al servidor (SSH o EC2 Instance Connect).
2. Revisar los respaldos disponibles:
```bash
docker exec -it webapp-container ls -la /app/backups
```
3. Copiar el respaldo elegido sobre la base de datos activa:
```bash
docker exec webapp-container cp /app/backups/<nombre_del_backup>.db /app/database.db
```
4. Reiniciar el contenedor:
```bash
docker restart webapp-container
```
5. Verificar que los datos volvieron:
```bash
curl http://localhost:8080/api/categorias
```

**Pruebas automatizadas**

```bash
npm test
```
Corre `tests/api.test.js` con Jest + Supertest contra la app en memoria (sin levantar puertos). Usan su propia base `test-database.db`, que `tests/setup.js` borra y vuelve a sembrar en cada corrida, así que `database.db` no se modifica.
