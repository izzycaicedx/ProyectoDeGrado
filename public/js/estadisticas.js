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
  } else if (periodo === 'mes') desde = new Date(hoy.getFullYear(), hoy.getMonth(), 1);
  else if (periodo === 'semana') { desde = new Date(hoy); desde.setDate(hoy.getDate() - ((hoy.getDay() + 6) % 7)); }
  else if (periodo === 'tres') { desde = new Date(hoy); desde.setDate(hoy.getDate() - 2); }
  else if (periodo === 'noventa') { desde = new Date(hoy); desde.setDate(hoy.getDate() - 89); }
  else if (periodo === 'anio') desde = new Date(hoy.getFullYear(), 0, 1);
  if (!desde) return '';
  return '?desde=' + fechaISO(desde) + '&hasta=' + fechaISO(hasta);
}

function colores(n) {
  const r = [];
  for (let i = 0; i < n; i++) { r.push(COLORES[i % COLORES.length]); }
  return r;
}

function mesLegible(ym) {
  const partes = ym.split('-');
  return MESES[Number(partes[1]) - 1] + ' ' + partes[0];
}

function mostrarError(texto) {
  const m = document.getElementById('msg');
  m.textContent = texto;
  m.classList.remove('oculto');
}

async function api(ruta) {
  const resp = await fetch(API + ruta, {
    headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + token }
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

// tipo: 'doughnut', 'bar', 'barH' (barras horizontales) o 'line'
function dibujar(idCanvas, tipo, filas, esMes) {
  const canvas = document.getElementById(idCanvas);
  const contenedor = canvas.parentElement;
  if (graficas[idCanvas]) { graficas[idCanvas].destroy(); delete graficas[idCanvas]; }
  const aviso = contenedor.querySelector('.vacio');
  if (!filas.length) {
    canvas.style.display = 'none';
    if (!aviso) contenedor.insertAdjacentHTML('beforeend', '<p class="vacio">No hay solicitudes en este periodo.</p>');
    return;
  }
  canvas.style.display = 'block';
  if (aviso) aviso.remove();

  const etiquetas = filas.map(function (f) { return esMes ? mesLegible(f.etiqueta) : f.etiqueta; });
  const valores = filas.map(function (f) { return f.total; });
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
    const d = await api('/estadisticas' + rangoSeleccionado());

    document.getElementById('eTotal').textContent = d.resumen.total;
    document.getElementById('eSin').textContent = d.resumen.sin_asignar;
    document.getElementById('eVencidos').textContent = d.resumen.vencidos;
    document.getElementById('eCerrados').textContent = d.resumen.cerrados;

    dibujar('gTipo', 'doughnut', d.porTipo, false);
    dibujar('gEstado', 'bar', d.porEstado, false);
    dibujar('gCategoria', 'barH', d.porCategoria, false);
    dibujar('gSede', 'bar', d.porSede, false);
    dibujar('gMes', 'line', d.porMes, true);
  } catch (e) {
    if (e.message !== 'sesion') mostrarError(e.message);
  }
}

document.getElementById('fPeriodoStats').addEventListener('change', function () { document.getElementById('fMesStats').value = ''; iniciar(); });
document.getElementById('fMesStats').addEventListener('change', iniciar);

document.getElementById('salir').addEventListener('click', function () {
  localStorage.removeItem('token');
  location.href = '/login.html';
});

iniciar();