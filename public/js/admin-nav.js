/* La visibilidad del enlace es orientativa; el backend siempre valida el rol vigente. */
(function () {
  const token = localStorage.getItem('token');
  const roleId = Number(localStorage.getItem('rol_id'));
  const link = document.querySelector('[data-admin-link]');

  if (!token) {
    location.href = '/login.html';
    return;
  }

  if (link && roleId === 3) {
    link.classList.remove('oculto');
  }
})();
