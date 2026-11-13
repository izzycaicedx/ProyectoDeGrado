const API = '/api';
const token = localStorage.getItem('token');
if (!token) { location.href = '/login.html'; }

const COLORES = ['#244b78', '#d95b91', '#4e956b', '#c47a36', '#5b9bb5', '#8b83b8', '#8793a2'];
const MESES = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];
const graficas = {};

function fechaISO(fecha) {
  return fecha.getFullYear() + '-' + String(fecha.getMonth() + 1).padStart(2, '0') + '-' + String(fecha.getDate()).padStart(2, '0');
}

function rangoSeleccionado() {
  const mes = document.getElementById('fMesStats').value;
  const periodo = 
document.getElementById('fPeriodoStats').addEventListener('change', function () {
  document.getElementById('fMesStats').value = '';
  iniciar();
});
document.getElementById('fMesStats').addEventListener('change', iniciar);

const modalAuditoria = document.getElementById('modalAuditoria');
const formAuditoria = document.getElementById('formAuditoria');

function cerrarModalAuditoria() {
  modalAuditoria.classList.add('oculto');
  document.getElementById('passwordAuditoria').value = '';
  document.getElementById('auditError').textContent = '';
}

function detalleAuditoria(valor) {
  try {
    const datos = typeof valor === 'string' ? JSON.parse(valor) : valor;
    if (datos && datos.estado_anterior && datos.estado_nuevo) {
      return 'Estado: ' + datos.estado_anterior + ' → ' + datos.estado_nuevo;
    }
    return typeof valor === 'string' ? valor : JSON.stringify(valor || {});
  } catch (_) {
    return valor || 'Sin detalle';
  }
}

function pintarAuditoria(registros) {
  const cuerpo = document.getElementById('filasAuditoria');
  const vacio = document.getElementById('auditoriaVacia');
  cuerpo.replaceChildren();
  vacio.classList.toggle('oculto', registros.length > 0);

  registros.forEach(function (registro) {
    const fila = document.createElement('tr');
    const fecha = new Date(registro.fecha_registro);
    const valores = [
      Number.isNaN(fecha.getTime()) ? 'Fecha no disponible' : fecha.toLocaleString('es-CO'),
      registro.usuario_nombre || 'Usuario no disponible',
      registro.accion || 'Actividad',
      registro.radicado || 'PQRS no disponible',
      detalleAuditoria(registro.detalle)
    ];
    valores.forEach(function (valor) {
      const celda = document.createElement('td');
      celda.textContent = valor;
      fila.appendChild(celda);
    });
    cuerpo.appendChild(fila);
  });
}

document.getElementById('abrirAuditoria').addEventListener('click', function () {
  document.getElementById('auditPasswordView').classList.remove('oculto');
  document.getElementById('auditResultsView').classList.add('oculto');
  modalAuditoria.classList.remove('oculto');
  document.getElementById('passwordAuditoria').focus();
});

document.getElementById('cerrarAuditoria').addEventListener('click', cerrarModalAuditoria);
modalAuditoria.addEventListener('click', function (evento) {
  if (evento.target === modalAuditoria) cerrarModalAuditoria();
});

document.getElementById('volverAuditoria').addEventListener('click', function () {
  document.getElementById('auditResultsView').classList.add('oculto');
  document.getElementById('auditPasswordView').classList.remove('oculto');
  document.getElementById('passwordAuditoria').value = '';
  document.getElementById('passwordAuditoria').focus();
});

formAuditoria.addEventListener('submit', async function (evento) {
  evento.preventDefault();
  const boton = document.getElementById('consultarAuditoria');
  const error = document.getElementById('auditError');
  boton.disabled = true;
  boton.textContent = 'Verificando...';
  error.textContent = '';

  try {
    const respuesta = await fetch(API + '/auditoria/consultar', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + token },
      body: JSON.stringify({ password: document.getElementById('passwordAuditoria').value })
    });
    const json = await respuesta.json().catch(function () { return {}; });
    if (respuesta.status === 401 && json.mensaje === 'La contraseña no es correcta.') {
      throw new Error(json.mensaje);
    }
    if (respuesta.status === 401 || respuesta.status === 403) {
      localStorage.removeItem('token');
      location.href = '/login.html';
      return;
    }
    if (!respuesta.ok || json.exito === false) {
      throw new Error(json.mensaje || 'No fue posible consultar la auditoría.');
    }

    pintarAuditoria(json.datos || []);
    document.getElementById('auditPasswordView').classList.add('oculto');
    document.getElementById('auditResultsView').classList.remove('oculto');
  } catch (e) {
    error.textContent = e.message;
  } finally {
    boton.disabled = false;
    boton.textContent = 'Continuar';
  }
});

document.getElementById('salir').addEventListener('click', function () {
  localStorage.removeItem('token');
  location.href = '/login.html';
});

iniciar();
