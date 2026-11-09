const API = '/api';
const token = localStorage.getItem('token');
if (!token) { location.href = '/login.html'; }

// Deben ser IDÉNTICOS a los que permite el CHECK de la tabla pqrs
const ESTADOS = ['Recibido', 'En clasificacion', 'En tramite', 'Vencido', 'Cerrado'];
let pqrs = [];
let responsables = [];

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

function contar(estado) {
  return pqrs.filter(function (p) { return p.estado === estado; }).length;
}

function pintarTarjetas() {
  document.getElementById('cTotal').textContent = pqrs.length;
  document.getElementById('cSin').textContent = pqrs.filter(function (p) { return !p.asignado_a && p.estado !== 'Cerrado'; }).length;
  document.getElementById('cClasif').textContent = contar('En clasificacion');
  document.getElementById('cTramite').textContent = contar('En tramite');
  document.getElementById('cVencido').textContent = contar('Vencido');
  document.getElementById('cCerrado').textContent = contar('Cerrado');
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

  const lista = pqrs.filter(function (p) {
    if (fEstado && p.estado !== fEstado) return false;
    if (fSede && p.sede !== fSede) return false;
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
    const opcEstado = ESTADOS.map(function (e) {
      return '<option value="' + e + '"' + (e === p.estado ? ' selected' : '') + '>' + e + '</option>';
    }).join('');
    return '<tr>' +
      '<td><b>' + esc(p.radicado) + '</b></td>' +
      '<td>' + esc(p.tipo) + '</td>' +
      '<td>' + esc(p.nombre_solicitante) + '</td>' +
      '<td>' + esc(p.sede) + '</td>' +
      '<td>' + fechaCorta(p.fecha_registro) + '</td>' +
      celdaVence(p) +
      '<td><select data-id="' + p.id + '" data-campo="asignar">' + opcResp + '</select></td>' +
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
  } catch (e) {
    if (e.message !== 'sesion') mostrarError(e.message);
  }
  pintarTodo();
}

function verDetalle(id) {
  const p = pqrs.find(function (x) { return x.id === id; });
  if (!p) return;
  function fila(a, b) { return '<div class="fila"><span>' + a + '</span><span>' + esc(b || '-') + '</span></div>'; }
  let html = '<h2>' + esc(p.radicado) + '</h2>' +
    fila('Tipo', p.tipo) + fila('Estado', p.estado) + fila('Sede', p.sede) +
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
    '<button class="cerrar" id="cerrarModal">Cerrar</button>';
  document.getElementById('detalle').innerHTML = html;
  document.getElementById('modal').classList.remove('oculto');
}

document.getElementById('filas').addEventListener('change', function (e) {
  const campo = e.target.getAttribute('data-campo');
  if (campo === 'asignar' || campo === 'estado') {
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
  }
});

document.getElementById('buscar').addEventListener('input', pintarTabla);
document.getElementById('fEstado').addEventListener('change', pintarTabla);
document.getElementById('fSede').addEventListener('change', pintarTabla);
document.getElementById('salir').addEventListener('click', function () {
    localStorage.removeItem('token');
  location.href = '/login.html';
});

document.getElementById('fEstado').innerHTML += ESTADOS.map(function (e) {
  return '<option value="' + e + '">' + e + '</option>';
}).join('');

async function iniciar() {
  try {
    const resultados = await Promise.all([api('/pqrs'), api('/responsables')]);
    pqrs = resultados[0];
    responsables = resultados[1];
    pintarTodo();
  } catch (e) {
    if (e.message !== 'sesion') mostrarError(e.message);
  }
}
iniciar();