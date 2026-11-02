"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var express_1 = require("express"); // Este es el encargado de crear el servidor
var body_parser_1 = require("body-parser"); // tiene que ver con peticiones https
var app = (0, express_1.default)(); // instancia el server
app.set('trust proxy', true);
app.use(body_parser_1.default.urlencoded({ extended: false }));
app.use(body_parser_1.default.json({ limit: "10mb" }));
// Configurar cabeceras y cors
app.use(function (req, res, next) {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Headers', 'Authorization, X-API-KEY, Origin, X-Requested-With, Content-Type, Accept, Access-Control-Allow-Request-Method');
    res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, DELETE');
    res.header('Allow', 'GET, POST, OPTIONS, PUT, DELETE');
    next();
});
// importar rutas
var appRoutes = require('./src/routes/app.router');
var usuarioRoutes = require('./src/routes/usuario.router');
var loginRoutes = require('./src/routes/login.router');
var cajaRoutes = require('./src/routes/caja.router');
var presentacionRoutes = require('./src/routes/presentacion.router');
var articuloRoutes = require('./src/routes/articulo.router');
var proveedorRoutes = require('./src/routes/proveedor.router');
var tipoOperacionRoutes = require('./src/routes/tipoOperacion.router');
var unidadArticuloRoutes = require('./src/routes/unidadArticulo.router');
var tipoArticuloRoutes = require('./src/routes/tipoArticulo.router');
var facturaProveedorRoutes = require('./src/routes/facturaProveedor.router');
var inventarioRoutes = require('./src/routes/inventario.router');
var clienteRoutes = require('./src/routes/cliente.router');
var itemsInventarioRoutes = require('./src/routes/itemsInventario.router');
var seguimientoArticuloRoutes = require('./src/routes/seguimientoArticulo.router');
var ventaRoutes = require('./src/routes/venta.router');
var comisionRoutes = require('./src/routes/comision.router');
var devolucionRoutes = require('./src/routes/devolucion.router');
//rutas
app.use('/', appRoutes);
app.use('/usuario', usuarioRoutes);
app.use('/login', loginRoutes);
app.use('/caja', cajaRoutes);
app.use('/presentacion', presentacionRoutes);
app.use('/articulo', articuloRoutes);
app.use('/proveedor', proveedorRoutes);
app.use('/tipoOperacion', tipoOperacionRoutes);
app.use('/unidadArticulo', unidadArticuloRoutes);
app.use('/tipoArticulo', tipoArticuloRoutes);
app.use('/facturaProveedor', facturaProveedorRoutes);
app.use('/inventario', inventarioRoutes);
app.use('/cliente', clienteRoutes);
app.use('/itemsInventario', itemsInventarioRoutes);
app.use('/seguimientoArticulo', seguimientoArticuloRoutes);
app.use('/venta', ventaRoutes);
app.use('/comision', comisionRoutes);
app.use('/devolucion', devolucionRoutes);
/* start server */
var port = 9010;
app.listen(port, function () {
    console.log("Server listening on localhost:" + port);
});
