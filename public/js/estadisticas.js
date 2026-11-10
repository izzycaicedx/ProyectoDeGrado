const API = '/api';
const token = localStorage.getItem('token');
if (!token) { location.href = '/login.html'; }

const COLORES = ['#2E3192', '#E6177D', '#2e9e5b', '#f59e0b', '#0ea5e9', '#8b5cf6', '#888888'];
const MESES = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];

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
  if (!filas.length) {
    canvas.parentElement.innerHTML = '<p class="vacio">Sin datos todavía.</p>';
    return;
  }

  const etiquetas = filas.map(function (f) { return esMes ? mesLegible(f.etiqueta) : f.etiqueta; });
  const valores = filas.map(function (f) { return f.total; });
  const circular = tipo === 'doughnut';
  const linea = tipo === 'line';

  new Chart(canvas, {
    type: tipo === 'barH' ? 'bar' : tipo,
    data: {
      labels: etiquetas,
      datasets: [{
        label: 'PQRS',
        data: valores,
        backgroundColor: linea ? 'rgba(46, 49, 146, 0.15)' : colores(valores.length),
        borderColor: linea ? '#2E3192' : undefined,
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
    const d = await api('/estadisticas');

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

document.getElementById('salir').addEventListener('click', function () {
  localStorage.removeItem('token');
  location.href = '/login.html';
});

iniciar();