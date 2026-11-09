const API_URL = 'http://localhost:3000/api/pqrs';
const MEDIO_FIJO = 'Pagina web';

const form = document.getElementById('pqrsForm');
const errorMsg = document.getElementById('errorMsg');
const successMsg = document.getElementById('successMsg');
const radicadoTexto = document.getElementById('radicadoTexto');
const submitBtn = document.getElementById('submitBtn');
const nuevoBtn = document.getElementById('nuevoBtn');

const pillButtons = document.querySelectorAll('.pill-option');
const esMismoPacienteInput = document.getElementById('es_mismo_paciente');
const acompananteBlock = document.getElementById('acompananteBlock');
const nombreAcompanante = document.getElementById('nombre_acompanante');

pillButtons.forEach((btn) => {
  btn.addEventListener('click', () => {
    pillButtons.forEach((b) => b.classList.remove('selected'));
    btn.classList.add('selected');

    const esPaciente = btn.dataset.value === 'true';
    esMismoPacienteInput.value = btn.dataset.value;

    if (esPaciente) {
      acompananteBlock.hidden = true;
      nombreAcompanante.required = false;
    } else {
      acompananteBlock.hidden = false;
      nombreAcompanante.required = true;
    }
  });
});

form.addEventListener('submit', async (e) => {
  e.preventDefault();
  hideError();

  if (esMismoPacienteInput.value === '') {
    showError('Por favor indique si la persona que interpone es el paciente.');
    return;
  }

  const esMismoPaciente = esMismoPacienteInput.value === 'true';

  const payload = {
    sede: form.sede.value,
    fecha_evento: form.fecha_evento.value,
    medio: MEDIO_FIJO,
    tipo: form.tipo.value,
    tipo_documento: form.tipo_documento.value,
    numero_documento: form.numero_documento.value.trim(),
    nombre_solicitante: form.nombre_solicitante.value.trim(),
    celular: form.celular.value.trim(),
    telefono_fijo: form.telefono_fijo.value.trim() || null,
    correo_electronico: form.correo_electronico.value.trim(),
    es_mismo_paciente: esMismoPaciente,
    descripcion: form.descripcion.value.trim()
  };

  if (!esMismoPaciente) {
    payload.nombre_acompanante = form.nombre_acompanante.value.trim();
    payload.parentesco_acompanante = form.parentesco_acompanante.value || null;
    payload.telefono_acompanante = form.telefono_acompanante.value.trim() || null;
  }

  submitBtn.disabled = true;
  submitBtn.textContent = 'Enviando...';

  try {
    const res = await fetch(API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    const data = await res.json();

    if (!res.ok || !data.exito) {
      showError(data.mensaje || 'No fue posible radicar el PQRS. Intente nuevamente.');
      return;
    }

    form.hidden = true;
    successMsg.hidden = false;
    radicadoTexto.textContent = data.datos.radicado;

  } catch (err) {
    showError('No fue posible conectarse con el servidor. Verifique su conexión e intente nuevamente.');
  } finally {
    submitBtn.disabled = false;
    submitBtn.textContent = 'Radicar PQRS';
  }
});

nuevoBtn.addEventListener('click', () => {
  form.reset();
  pillButtons.forEach((b) => b.classList.remove('selected'));
  esMismoPacienteInput.value = '';
  acompananteBlock.hidden = true;
  form.hidden = false;
  successMsg.hidden = true;
});

function showError(msg) {
  errorMsg.textContent = msg;
  errorMsg.hidden = false;
  errorMsg.scrollIntoView({ behavior: 'smooth', block: 'center' });
}

function hideError() {
  errorMsg.hidden = true;
}