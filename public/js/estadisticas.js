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
  const periodo = document.getElementById('fPeriodoStats').value;
  const hoy = new Date();
  hoy.setHours(0, 0, 0, 0);
  let desde = null;
  let hasta = new Date(hoy);
  hasta.setDate(hasta.getDate() + 1);

  if (mes) {
    const partes = mes.split('-').map(Number);
    desde = new Date(partes[0], partes[1] - 1, 1);
    hasta = new Date(partes[0], partes[1], 1);
  } else if (periodo === 'mes') {
    desde = new Date(hoy.getFullYear(), hoy.getMonth(), 1);
  } else if (periodo === 'semana') {
    desde = new Date(hoy);
    desde.setDate(hoy.getDate() - ((hoy.getDay() + 6) % 7));
  } else if (periodo === 'tres') {
    desde = new Date(hoy);
    desde.setDate(hoy.getDate() - 2);
  } else if (periodo === 'noventa') {
    desde = new Date(hoy);
    desde.setDate(hoy.getDate() - 89);
  } else if (periodo === 'anio') {
    desde = new Date(hoy.getFullYear(), 0, 1);
  }

  if (!desde) return '';
  return '?desde=' + fechaISO(desde) + '&hasta=' + fechaISO(hasta);
}

function colores(n) {
  const resultado = [];
  for (let i = 0; i < n; i++) resultado.push(COLORES[i % COLORES.length]);
  return resultado;
}

function mesLegible(ym) {
  const partes = ym.split('-');
  return MESES[Number(partes[1]) - 1] + ' ' + partes[0];
}

function mostrarError(texto) {
  const mensaje = document.getElementById('msg');
  mensaje.textContent = texto;
  mensaje.classList.remove('oculto');
}

async function api(ruta) {
  const respuesta = await fetch(API + ruta, {
    headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + token }
  });
  const json = await respuesta.json().catch(function () { return {}; });

  if (respuesta.status === 401 || respuesta.status === 403) {
    localStorage.removeItem('token');
    location.href = '/login.html';
    throw new Error('sesion');
  }
  if (!respuesta.ok || json.exito === false) {
    throw new Error(json.mensaje || 'Error en el servidor');
  }
  return json.datos;
}

function dibujar(idCanvas, tipo, filas, esMes) {
  const canvas = document.getElementById(idCanvas);
  const contenedor = canvas.parentElement;
  if (graficas[idCanvas]) {
    graficas[idCanvas].destroy();
    delete graficas[idCanvas];
  }

  let aviso = contenedor.querySelector('.vacio');
  if (!filas || !filas.length) {
    canvas.style.display = 'none';
    if (!aviso) {
      aviso = document.createElement('p');
      aviso.className = 'vacio';
      aviso.textContent = 'No hay solicitudes en este periodo.';
      contenedor.appendChild(aviso);
    }
    return;
  }

  canvas.style.display = 'block';
  if (aviso) aviso.remove();

  const etiquetas = filas.map(function (fila) {
    return esMes ? mesLegible(fila.etiqueta) : fila.etiqueta;
  });
  const valores = filas.map(function (fila) { return fila.total; });
  const circular = tipo === 'doughnut';
  const linea = tipo === 'line';

  graficas[idCanvas] = new Chart(canvas, {
    type: tipo === 'barH' ? 'bar' : tipo,
    data: {
      labels: etiquetas,
      datasets: [{
        label: 'PQRS',
        data: valores,
        backgroundColor: linea ? 'rgba(36, 75, 120, 0.14)' : colores(valores.length),
        borderColor: linea ? '#244b78' : undefined,
        fill: linea,
        tension: 0.3
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      indexAxis: tipo === 'barH' ? 'y' : 'x',
      plugins: { legend: { display: circular, position: 'bottom' } },
      scales: circular ? {} : {
        x: { beginAtZero: true, ticks: { precision: 0 } },
        y: { beginAtZero: true, ticks: { precision: 0 } }
      }
    }
  });
}

async function iniciar() {
  try {
    const datos = await api('/estadisticas' + rangoSeleccionado());
    document.getElementById('eTotal').textContent = datos.resumen.total;
    document.getElementById('eSin').textContent = datos.resumen.sin_asignar;
    document.getElementById('eVencidos').textContent = datos.resumen.vencidos;
    document.getElementById('eCerrados').textContent = datos.resumen.cerrados;

    dibujar('gTipo', 'doughnut', datos.porTipo, false);
    dibujar('gEstado', 'bar', datos.porEstado, false);
    dibujar('gCategoria', 'barH', datos.porCategoria, false);
    dibujar('gSede', 'bar', datos.porSede, false);
    dibujar('gMes', 'line', datos.porMes, true);
  } catch (error) {
    if (error.message !== 'sesion') mostrarError(error.message);
  }
}

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
  } catch (error) {
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
  const mensajeError = document.getElementById('auditError');
  boton.disabled = true;
  boton.textContent = 'Verificando...';
  mensajeError.textContent = '';

  try {
    const respuesta = await fetch(API + '/auditoria/consultar', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ' + token
      },
      body: JSON.stringify({
        password: document.getElementById('passwordAuditoria').value
      })
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
  } catch (error) {
    mensajeError.textContent = error.message;
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
