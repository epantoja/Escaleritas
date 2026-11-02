var { Model, DataTypes } = require("sequelize");
var basededatos = require('../config/database');
var configuracion = require('../config/config');

class Login extends Model {}
    Login.init(
    {
        codUsuario: {
            type: DataTypes.STRING,
            allowNull: false,
            validate: {
                notNull: {
                    msg: "El campo código de usuario es requerido"
                },
                len: {
                    args: [3,20],
                    msg: "El código de usuario debe tener entre 3 y 20 caracteres"
                },
                notEmpty: {
                    msg: "El campo usuario no puede ser vacio"
                }
            }
        },
        clave: {
            type: DataTypes.STRING,
            allowNull: false,
            validate: {
                notNull: {
                    msg: "El campo clave es requerido"
                },
                notEmpty: {
                    msg: "El campo clave no puede ser vacio"
                }
            }
        },
    },
    {
        defaultScope: {
            where: {
                estado: 1
            }
        },
        schema: configuracion.esquema,
        sequelize: basededatos,
        modelName: "usuario",
        freezeTableName: true,
        timestamps: false
    }
);

module.exports = Login;