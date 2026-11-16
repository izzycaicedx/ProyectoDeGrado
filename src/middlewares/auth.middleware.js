const jwt = require('jsonwebtoken');
const Usuario = require('../models/Usuario');

async function verificarToken(req, res, next) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({
      exito: false,
      mensaje: 'Acceso denegado. No se proporcionó un token.',
    });
  }

  try {
    const token = authHeader.split(' ')[1];
    const datosToken = jwt.verify(token, process.env.JWT_SECRET);
    const usuarioActual = await Usuario.findByPk(datosToken.id, {
      attributes: ['id', 'rol_id']
    });

    if (!usuarioActual) {
      return res.status(401).json({
        exito: false,
        mensaje: 'La cuenta asociada a esta sesión ya no existe.',
      });
    }

    // El rol vigente en PostgreSQL prevalece sobre el rol incluido en el JWT.
    // Así, un cambio de rol surte efecto sin esperar a que expire el token.
    req.usuario = {
      id: usuarioActual.id,
      rol_id: Number(usuarioActual.rol_id)
    };
    return next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError') {
      return res.status(401).json({
        exito: false,
        mensaje: 'Token inválido o expirado.',
      });
    }

    return res.status(500).json({
      exito: false,
      mensaje: 'No fue posible verificar los permisos de la cuenta.',
    });
  }
}

function verificarRol(...rolesPermitidos) {
  return (req, res, next) => {
    if (!req.usuario) {
      return res.status(401).json({
        exito: false,
        mensaje: 'Debe iniciar sesión primero.',
      });
    }

    if (!rolesPermitidos.includes(Number(req.usuario.rol_id))) {
      return res.status(403).json({
        exito: false,
        mensaje: 'No tiene permisos para realizar esta acción.',
      });
    }

    return next();
  };
}

module.exports = { verificarToken, verificarRol };
