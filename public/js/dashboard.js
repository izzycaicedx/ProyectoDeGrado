const API = '/api';
const token = localStorage.getItem('token');
if (!token) { location.href = '/login.html'; }

// Deben ser IDÉNTICOS a los que permite el CHECK de la tabla pqrs
const ESTADOS = ['Recibido', 'En clasificacion', 'En tramite', 'Vencido', 'Cerrado'];
let pqrs = [];
let responsables = [];
let categorias = [];
let asignadas = {};
let pqrsActiva = null;

function esc(s) {
  return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
    return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
  });
}

function mostrarError(texto) {
  const m = document.getElementById('msg');
  m.textContent = texto;
  m.classList.remove('oculto');
  setTimeout(function () { m.classList.add('oculto'); }, 8000);
}

async function api(ruta, opciones) {
  opciones = opciones || {};
  const resp = await fetch(API + ruta, {
    method: opciones.method || 'GET',
    headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + token },
    body: opciones.body
  });
  const json = await resp.json().catch(function () { return {}; });
  if (resp.status === 401 || resp.status === 403) {
    localStorage.removeItem('token');
    location.href = '/login.html';
    throw new Error('sesion');
  }
  if (!resp.ok || json.exito === false) {
    const detalle = typeof json.datos === 'string' ? ' → ' + json.datos : '';
    throw new Error((json.mensaje || 'Error en el servidor') + detalle);
  }
  return json.datos;
}

function fechaCorta(iso) {
  if (!iso) return '-';
  return new Date(iso).toLocaleDateString('es-CO', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

function nombreResponsable(id) {
  const r = responsables.find(function (x) { return x.id === id; });
  return r ? r.nombre : '';
}

function nombreCategoria(id) {
  const c = categorias.find(function (x) { return x.id === id; });
  return c ? c.nombre : '';
}

function contar(estado) {
  return pqrs.filter(function (p) { return p.estado === estado; }).length;
}

function obtenerRango(periodo, mes) {
  const hoy = new Date();
  hoy.setHours(0, 0, 0, 0);
  let desde = null;
  let hasta = new Date(hoy);
  hasta.setDate(hasta.getDate() + 1);
  if (mes) {
    const partes = mes.split('-').map(Number);
    desde = new Date(partes[0], partes[1] - 1, 1);
    hasta = new Date(partes[0], partes[1], 1);
  } else if (periodo === 'mes') desde = new Date(hoy.getFullYear(), hoy.getMonth(), 1);
  else if (periodo === 'semana') {
    desde = new Date(hoy);
    desde.setDate(hoy.getDate() - ((hoy.getDay() + 6) % 7));
  } else if (periodo === 'tres') {
    desde = new Date(hoy);
    desde.setDate(hoy.getDate() - 2);
  } else if (periodo === 'noventa') {
    desde = new Date(hoy);
    desde.setDate(hoy.getDate() - 89);
  } else if (periodo === 'anio') desde = new Date(hoy.getFullYear(), 0, 1);
  return { desde: desde, hasta: hasta };
}

function fechaEnPeriodo(p) {
  const rango = obtenerRango(document.getElementById('fPeriodo').value, document.getElementById('fMes').value);
  if (!rango.desde) return true;
  const fecha = new Date(p.fecha_registro);
  if (isNaN(fecha.getTime())) return false;
  fecha.setHours(0, 0, 0, 0);
  return fecha >= rango.desde && fecha < rango.hasta;
}

function pqrsDelPeriodo() {
  return pqrs.filter(fechaEnPeriodo);
}

function pintarTarjetas() {
  const lista = pqrsDelPeriodo();
  document.getElementById('cTotal').textContent = lista.length;
  document.getElementById('cSin').textContent = lista.filter(function (p) { return !p.asignado_a && p.estado !== 'Cerrado'; }).length;
  document.getElementById('cClasif').textContent = lista.filter(function (p) { return p.estado === 'En clasificacion'; }).length;
  document.getElementById('cTramite').textContent = lista.filter(function (p) { return p.estado === 'En tramite'; }).length;
  document.getElementById('cVencido').textContent = lista.filter(function (p) { return p.estado === 'Vencido'; }).length;
  document.getElementById('cCerrado').textContent = lista.filter(function (p) { return p.estado === 'Cerrado'; }).length;
}

function celdaVence(p) {
  if (!p.fecha_limite) return '<td>-</td>';
  const partes = p.fecha_limite.split('-').map(Number);
  const texto = String(partes[2]).padStart(2, '0') + '/' + String(partes[1]).padStart(2, '0') + '/' + partes[0];
  if (p.estado === 'Cerrado') return '<td>' + texto + '</td>';

  const hoy = new Date();
  hoy.setHours(0, 0, 0, 0);
  const limite = new Date(partes[0], partes[1] - 1, partes[2]);
  const dias = Math.round((limite - hoy) / 86400000);

  if (dias < 0) {
    return '<td class="venc">' + texto + '<br><small>Vencido hace ' + (-dias) + ' día(s)</small></td>';
  }
  if (dias <= 3) {
    return '<td class="por-venc">' + texto + '<br><small>Vence en ' + dias + ' día(s)</small></td>';
  }
  return '<td>' + texto + '</td>';
}

function pintarTabla() {
  const texto = document.getElementById('buscar').value.trim().toLowerCase();
  const fEstado = document.getElementById('fEstado').value;
  const fSede = document.getElementById('fSede').value;
  const fCat = document.getElementById('fCategoria').value;

  const lista = pqrs.filter(function (p) {
    if (!fechaEnPeriodo(p)) return false;
    if (fEstado && p.estado !== fEstado) return false;
    if (fSede && p.sede !== fSede) return false;
    if (fCat === 'sin' && asignadas[p.id]) return false;
    if (fCat && fCat !== 'sin' && String(asignadas[p.id]) !== fCat) return false;
    if (texto) {
      const base = (p.radicado + ' ' + p.nombre_solicitante + ' ' + p.numero_documento).toLowerCase();
      if (base.indexOf(texto) === -1) return false;
    }
    return true;
  });

  document.getElementById('vacio').classList.toggle('oculto', lista.length > 0);

  document.getElementById('filas').innerHTML = lista.map(function (p) {
    const opcResp = '<option value="">Sin asignar</option>' + responsables.map(function (r) {
      return '<option value="' + r.id + '"' + (r.id === p.asignado_a ? ' selected' : '') + '>' + esc(r.nombre) + '</option>';
    }).join('');
    const opcCat = '<option value="">Sin categoría</option>' + categorias.map(function (c) {
      return '<option value="' + c.id + '"' + (c.id === asignadas[p.id] ? ' selected' : '') + '>' + esc(c.nombre) + '</option>';
    }).join('');
    const opcEstado = ESTADOS.map(function (e) {
      return '<option value="' + e + '"' + (e === p.estado ? ' selected' : '') + '>' + e + '</option>';
    }).join('');
    return '<tr>' +
      '<td><button class="radicado-link" data-id="' + p.id + '" data-campo="ver" type="button">' + esc(p.radicado) + '</button></td>' +
      '<td>' + esc(p.tipo) + '</td>' +
      '<td>' + esc(p.nombre_solicitante) + '</td>' +
      '<td>' + esc(p.sede) + '</td>' +
      '<td>' + fechaCorta(p.fecha_registro) + '</td>' +
      celdaVence(p) +
      '<td><select data-id="' + p.id + '" data-campo="asignar">' + opcResp + '</select></td>' +
      '<td><select data-id="' + p.id + '" data-campo="categoria">' + opcCat + '</select></td>' +
      '<td><select data-id="' + p.id + '" data-campo="estado">' + opcEstado + '</select></td>' +
      '<td><button class="ver" data-id="' + p.id + '" data-campo="ver">Ver</button></td>' +
      '</tr>';
  }).join('');
}

function pintarTodo() { pintarTarjetas(); pintarTabla(); }

function reemplazar(actualizado) {
  const i = pqrs.findIndex(function (p) { return p.id === actualizado.id; });
  if (i !== -1) pqrs[i] = actualizado;
}

async function cambiar(id, campo, valor) {
  try {
    if (campo === 'categoria') {
      const r = await api('/pqrs/' + id + '/categoria', {
        method: 'PUT',
        body: JSON.stringify({ categoria_id: valor ? Number(valor) : null })
      });
      if (r.categoria_id) { asignadas[id] = r.categoria_id; } else { delete asignadas[id]; }
    } else {
      let actualizado;
      if (campo === 'asignar') {
        actualizado = await api('/pqrs/' + id + '/asignar', {
          method: 'PUT',
          body: JSON.stringify({ asignado_a: valor ? Number(valor) : null })
        });
      } else {
        actualizado = await api('/pqrs/' + id, {
          method: 'PUT',
          body: JSON.stringify({ estado: valor })
        });
      }
      reemplazar(actualizado);
    }
  } catch (e) {
    if (e.message !== 'sesion') mostrarError(e.message);
  }
  pintarTodo();
}

function generarPlantillaRespuesta(p) {
  const hoy = new Date().toLocaleDateString('es-CO', { day: '2-digit', month: 'long', year: 'numeric' });
  return [
    'AIREC GRUPO MÉDICO',
    'RESPUESTA A PETICIÓN, QUEJA, RECLAMO O SUGERENCIA',
    '',
    'Fecha de respuesta: ' + hoy,
    'Radicado: ' + (p.radicado || ''),
    'Señor(a): ' + (p.nombre_solicitante || ''),
    'Correo de contacto: ' + (p.correo_electronico || ''),
    'Asunto: Respuesta a su ' + (p.tipo || 'solicitud') + ' - ' + (p.radicado || ''),
    '',
    'Cordial saludo,',
    '',
    'En atención a la solicitud registrada ante AIREC Grupo Médico con el número de radicado ' + (p.radicado || '') + ', relacionada con el siguiente asunto:',
    '',
    '“' + (p.descripcion || '').trim() + '”',
    '',
    'Una vez revisada la información y realizadas las validaciones correspondientes, nos permitimos informarle lo siguiente:',
    '',
    '[Describa aquí el análisis realizado y la respuesta concreta a cada uno de los puntos planteados.]',
    '',
    '[Indique las acciones adelantadas, las medidas adoptadas o las razones que sustentan la decisión.]',
    '',
    'Agradecemos que se haya comunicado con nosotros. Sus observaciones contribuyen al mejoramiento continuo de nuestros servicios y a la calidad de la atención.',
    '',
    'Atentamente,',
    '',
    '[Nombre de quien responde]',
    '[Cargo / Área responsable]',
    'AIREC GRUPO MÉDICO',
    '',
    'Este documento corresponde a la respuesta institucional asociada al radicado ' + (p.radicado || '') + '.'
  ].join('\\n');
}

async function cargarHistorialRespuestas(id) {
  const contenedor = document.getElementById('historialRespuestas');
  if (!contenedor) return;
  contenedor.innerHTML = '<p class="historial-cargando">Consultando respuestas...</p>';
  try {
    const respuestas = await api('/pqrs/' + id + '/respuestas');
    if (!respuestas || respuestas.length === 0) {
      contenedor.innerHTML = '<div class="historial-vacio">Todavía no hay respuestas registradas para esta PQRS.</div>';
      return;
    }
    contenedor.innerHTML = '<h4>Historial de respuestas</h4>' + respuestas.map(function (r) {
      return '<article class="respuesta-item">' +
        '<div class="respuesta-meta"><strong>Usuario #' + esc(r.usuario_id) + '</strong><time>' + esc(new Date(r.fecha_respuesta).toLocaleString('es-CO')) + '</time></div>' +
        '<p>' + esc(r.contenido) + '</p>' +
      '</article>';
    }).join('');
  } catch (error) {
    contenedor.innerHTML = '<p class="historial-error">' + esc(error.message === 'sesion' ? 'La sesión terminó. Inicia sesión nuevamente.' : error.message) + '</p>';
  }
}

function verDetalle(id) {
  const p = pqrs.find(function (x) { return x.id === id; });
  if (!p) return;
  pqrsActiva = p;
  function fila(a, b) { return '<div class="fila"><span>' + a + '</span><span>' + esc(b || '-') + '</span></div>'; }
  let html = '<h2>' + esc(p.radicado) + '</h2>' +
    fila('Tipo', p.tipo) + fila('Estado', p.estado) + fila('Sede', p.sede) +
    fila('Categoría', nombreCategoria(asignadas[p.id]) || 'Sin categoría') +
    fila('Medio', p.medio) + fila('Fecha del evento', p.fecha_evento) +
    fila('Fecha límite', p.fecha_limite) +
    fila('Responsable', nombreResponsable(p.asignado_a) || 'Sin asignar') +
    fila('Solicitante', p.nombre_solicitante) +
    fila('Documento', p.tipo_documento + ' ' + p.numero_documento) +
    fila('Celular', p.celular) + fila('Teléfono fijo', p.telefono_fijo) +
    fila('Correo', p.correo_electronico) +
    fila('¿Es el paciente?', p.es_mismo_paciente ? 'Sí' : 'No');
  if (!p.es_mismo_paciente) {
    html += fila('Acompañante', p.nombre_acompanante) +
      fila('Parentesco', p.parentesco_acompanante) +
      fila('Teléfono acompañante', p.telefono_acompanante);
  }
  html += '<div class="desc">' + esc(p.descripcion) + '</div>' +
    '<section class="respuesta-panel">' +
      '<div class="respuesta-titulo"><h3>Respuesta de la PQRS</h3><p>Registra la contestación y conserva su historial.</p></div>' +
      '<div class="respuesta-destino"><span>Destinatario</span><strong>' + esc(p.nombre_solicitante) + '</strong><small>' + esc(p.correo_electronico) + '</small><em>La respuesta se guarda en el expediente. El envío por correo aún no está habilitado.</em></div>' +
      '<button class="accion-respuesta" id="mostrarFormularioRespuesta" type="button">Preparar respuesta institucional</button>' +
      '<form id="formRespuesta" class="form-respuesta oculto">' +
        '<div class="plantilla-cabecera"><div><strong>Formato institucional AIREC</strong><small>Plantilla editable con datos de la PQRS</small></div><button class="usar-plantilla" id="usarPlantilla" type="button">Cargar plantilla</button></div>' +
        '<label for="contenidoRespuesta">Respuesta formal</label>' +
        '<textarea id="contenidoRespuesta" rows="16" maxlength="10000" required placeholder="Carga la plantilla institucional o redacta la respuesta..."></textarea>' +
        '<small class="ayuda-respuesta">Revisa el texto, completa los campos entre corchetes y verifica que la respuesta atienda todos los puntos de la solicitud antes de guardarla.</small>' +
        '<div class="acciones-formulario"><button class="guardar-respuesta" type="submit">Guardar respuesta</button><button class="cancelar-respuesta" id="cancelarRespuesta" type="button">Cancelar</button></div>' +
        '<p id="mensajeRespuesta" class="mensaje-respuesta" role="status"></p>' +
      '</form>' +
      '<div id="historialRespuestas" class="historial-respuestas"><p class="historial-cargando">Cargando historial...</p></div>' +
    '</section>' +
    '<button class="cerrar" id="cerrarModal" type="button">Cerrar</button>';
  document.getElementById('detalle').innerHTML = html;
  document.getElementById('detalle').setAttribute('data-pqrs-id', id);
  document.getElementById('modal').classList.remove('oculto');
  cargarHistorialRespuestas(id);
}

document.getElementById('filas').addEventListener('change', function (e) {
  const campo = e.target.getAttribute('data-campo');
  if (campo === 'asignar' || campo === 'estado' || campo === 'categoria') {
    cambiar(Number(e.target.getAttribute('data-id')), campo, e.target.value);
  }
});

document.getElementById('filas').addEventListener('click', function (e) {
  if (e.target.getAttribute('data-campo') === 'ver') {
    verDetalle(Number(e.target.getAttribute('data-id')));
  }
});

document.getElementById('modal').addEventListener('click', function (e) {
  if (e.target.id === 'modal' || e.target.id === 'cerrarModal') {
    document.getElementById('modal').classList.add('oculto');
    return;
  }
  if (e.target.id === 'mostrarFormularioRespuesta') {
    document.getElementById('formRespuesta').classList.remove('oculto');
    document.getElementById('contenidoRespuesta').focus();
  }
  if (e.target.id === 'usarPlantilla') {
    e.preventDefault();
    if (pqrsActiva) {
      document.getElementById('contenidoRespuesta').value = generarPlantillaRespuesta(pqrsActiva);
      document.getElementById('mensajeRespuesta').textContent = 'Plantilla cargada. Completa los campos entre corchetes antes de guardar.';
    }
  }
  if (e.target.id === 'cancelarRespuesta') {
    document.getElementById('formRespuesta').classList.add('oculto');
    document.getElementById('contenidoRespuesta').value = '';
  }
});

document.getElementById('detalle').addEventListener('submit', async function (e) {
  if (e.target.id !== 'formRespuesta') return;
  e.preventDefault();
  const id = Number(document.getElementById('detalle').getAttribute('data-pqrs-id'));
  const campo = document.getElementById('contenidoRespuesta');
  const mensaje = document.getElementById('mensajeRespuesta');
  const boton = e.target.querySelector('button[type="submit"]');
  const contenido = campo.value.trim();
  if (!contenido) {
    mensaje.textContent = 'Escribe el contenido de la respuesta antes de guardarla.';
    return;
  }
  if (/\\[[^\\]]+\\]/.test(contenido)) {
    mensaje.textContent = 'Completa o elimina todos los campos indicados entre corchetes antes de guardar.';
    return;
  }
  boton.disabled = true;
  boton.textContent = 'Guardando...';
  mensaje.textContent = '';
  try {
    await api('/pqrs/' + id + '/respuestas', {
      method: 'POST',
      body: JSON.stringify({ contenido: contenido })
    });
    campo.value = '';
    e.target.classList.add('oculto');
    mensaje.textContent = 'La respuesta se guardó correctamente.';
    await cargarHistorialRespuestas(id);
  } catch (error) {
    if (error.message !== 'sesion') mensaje.textContent = error.message;
  } finally {
    boton.disabled = false;
    boton.textContent = 'Guardar respuesta';
  }
});

document.getElementById('buscar').addEventListener('input', pintarTabla);
document.getElementById('fEstado').addEventListener('change', pintarTabla);
document.getElementById('fSede').addEventListener('change', pintarTabla);
document.getElementById('fCategoria').addEventListener('change', pintarTabla);
document.getElementById('fPeriodo').addEventListener('change', function () { document.getElementById('fMes').value = ''; pintarTodo(); });
document.getElementById('fMes').addEventListener('change', pintarTodo);
document.getElementById('salir').addEventListener('click', function () {
  localStorage.removeItem('token');
  location.href = '/login.html';
});

document.getElementById('fEstado').innerHTML += ESTADOS.map(function (e) {
  return '<option value="' + e + '">' + e + '</option>';
}).join('');

async function iniciar() {
  try {
    const r = await Promise.all([
      api('/pqrs'),
      api('/responsables'),
      api('/categorias'),
      api('/categorias/asignadas')
    ]);
    pqrs = r[0];
    responsables = r[1];
    categorias = r[2];
    asignadas = {};
    r[3].forEach(function (a) { asignadas[a.pqrs_id] = a.categoria_id; });

    document.getElementById('fCategoria').innerHTML +=
      '<option value="sin">Sin categoría</option>' +
      categorias.map(function (c) {
        return '<option value="' + c.id + '">' + esc(c.nombre) + '</option>';
      }).join('');

    pintarTodo();
  } catch (e) {
    if (e.message !== 'sesion') mostrarError(e.message);
  }
}
iniciar();