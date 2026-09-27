const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const Usuario = require('../models/Usuario');

async function registrar(req, res) {
  try {
    const { nombre, documento, email, password, rol_id } = req.body;

    if (!nombre || !documento || !email || !password || !rol_id) {
      return res.status(400).json({
        exito: false,
        mensaje: 'Todos los campos son obligatorios.',
      });
    }

    const passwordEncriptada = await bcrypt.hash(password, 10);

    const nuevoUsuario = await Usuario.create({
      nombre,
      documento,
      email,
      password: passwordEncriptada,
      rol_id,
    });

    return res.status(201).json({
      exito: true,
      mensaje: 'Usuario registrado correctamente.',
      datos: { id: nuevoUsuario.id, nombre: nuevoUsuario.nombre, email: nuevoUsuario.email },
    });
  } catch (error) {
    return res.status(500).json({
      exito: false,
      mensaje: 'Error al registrar el usuario.',
      detalle: error.message,
    });
  }
}

async function login(req, res) {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        exito: false,
        mensaje: 'Email y contraseña son obligatorios.',
      });
    }

    const usuario = await Usuario.findOne({ where: { email } });
    if (!usuario) {
      return res.status(401).json({
        exito: false,
        mensaje: 'Credenciales incorrectas.',
      });
    }

    const passwordValida = await bcrypt.compare(password, usuario.password);
    if (!passwordValida) {
      return res.status(401).json({
        exito: false,
        mensaje: 'Credenciales incorrectas.',
      });
    }

    const token = jwt.sign(
      { id: usuario.id, rol_id: usuario.rol_id },
      process.env.JWT_SECRET,
      { expiresIn: '8h' }
    );

    return res.json({
      exito: true,
      mensaje: 'Inicio de sesión exitoso.',
      datos: {
        token,
        usuario: { id: usuario.id, nombre: usuario.nombre, rol_id: usuario.rol_id },
      },
    });
  } catch (error) {
    return res.status(500).json({
      exito: false,
      mensaje: 'Error al iniciar sesión.',
      detalle: error.message,
    });
  }
}

module.exports = { registrar, login };