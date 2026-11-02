
var express = require('express');

var app = express();

app.get('/', (req: any, res: any)=> {
    res.status(200).json({
        ok: true,
        mensaje: 'Peticion realizada correctamente'
    });
});


module.exports = app;