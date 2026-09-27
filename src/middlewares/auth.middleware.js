const jwt = require('jsonwebtoken');

function verificarToken(req, res, next) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({
      exito: false,
      mensaje: 'Acceso denegado. No se proporcionó un token.',
    });
  }

  const token = authHeader.split(' ')[1];

  try {
    const datosUsuario = jwt.verify(token, process.env.JWT_SECRET);
    req.usuario = datosUsuario;
    next();
  } catch (error) {
    return res.status(401).json({
      exito: false,
      mensaje: 'Token inválido o expirado.',
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

    if (!rolesPermitidos.includes(req.usuario.rol_id)) {
      return res.status(403).json({
        exito: false,
        mensaje: 'No tiene permisos para realizar esta acción.',
      });
    }

    next();
  };
}

module.exports = { verificarToken, verificarRol };