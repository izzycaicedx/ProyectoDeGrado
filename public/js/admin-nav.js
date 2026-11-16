/* Muestra el acceso administrativo solo cuando el backend confirma el rol 3. */
(function () {
  const token = localStorage.getItem('token');
  const link = document.querySelector('[data-admin-link]');
  if (!token || !link) return;

  fetch('/api/usuarios', {
    headers: { Authorization: 'Bearer ' + token }
  }).then(function (response) {
    if (response.status === 401) {
      localStorage.removeItem('token');
      location.href = '/login.html';
      return;
    }
    if (response.ok) link.classList.remove('oculto');
  }).catch(function () {
    // Si la API no está disponible, el enlace permanece oculto.
  });
})();
