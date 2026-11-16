/* Administración de usuarios: todas las operaciones se validan también en el backend. */
(function () {
  const API = '/api/usuarios';
  const token = localStorage.getItem('token');
  const denied = document.getElementById('adminDenied');
  const content = document.getElementById('adminContent');
  const rows = document.getElementById('usersRows');
  const usersStatus = document.getElementById('usersStatus');
  const createForm = document.getElementById('createUserForm');
  const createButton = document.getElementById('createUserButton');
  const createMessage = document.getElementById('createUserMessage');

  function headers() {
    return { 'Content-Type': 'application/json', Authorization: 'Bearer ' + token };
  }

  async function request(url, options) {
    const response = await fetch(url, Object.assign({ headers: headers() }, options || {}));
    const result = await response.json().catch(function () { return {}; });
    if (response.status === 401) {
      localStorage.removeItem('token');
    localStorage.removeItem('rol_id');
      location.href = '/login.html';
      throw new Error('La sesión terminó. Inicia sesión nuevamente.');
    }
    if (response.status === 403) {
      denied.classList.remove('oculto');
      content.classList.add('oculto');
      throw new Error('Acceso reservado al rol 3.');
    }
    if (!response.ok || result.exito === false) {
      throw new Error(result.mensaje || 'No fue posible completar la operación.');
    }
    return result;
  }

  function createCell(value) {
    const cell = document.createElement('td');
    cell.textContent = value == null || value === '' ? '—' : String(value);
    return cell;
  }

  function renderUsers(users) {
    rows.replaceChildren();
    if (!users.length) {
      const row = document.createElement('tr');
      const cell = createCell('No hay usuarios registrados.');
      cell.colSpan = 5;
      row.appendChild(cell);
      rows.appendChild(row);
      return;
    }

    users.forEach(function (user) {
      const row = document.createElement('tr');
      row.appendChild(createCell(user.nombre));
      row.appendChild(createCell(user.email));
      row.appendChild(createCell(user.documento));

      const roleCell = document.createElement('td');
      const roleSelect = document.createElement('select');
      roleSelect.setAttribute('aria-label', 'Nuevo rol para ' + user.nombre);
      roleSelect.dataset.roleSelect = String(user.id);
      [{ value: 2, label: 'Rol 2 · Gestión' }, { value: 3, label: 'Rol 3 · Superadministración' }]
        .forEach(function (role) {
          const option = document.createElement('option');
          option.value = String(role.value);
          option.textContent = role.label;
          option.selected = Number(user.rol_id) === role.value;
          roleSelect.appendChild(option);
        });
      roleCell.appendChild(roleSelect);
      row.appendChild(roleCell);

      const actionCell = document.createElement('td');
      const saveButton = document.createElement('button');
      saveButton.type = 'button';
      saveButton.className = 'admin-save';
      saveButton.textContent = 'Guardar';
      saveButton.dataset.saveRole = String(user.id);
      actionCell.appendChild(saveButton);
      row.appendChild(actionCell);
      rows.appendChild(row);
    });
  }

  async function loadUsers() {
    usersStatus.textContent = 'Consultando usuarios...';
    const result = await request(API);
    renderUsers(result.datos || []);
    content.classList.remove('oculto');
    usersStatus.textContent = (result.datos || []).length + ' cuenta(s) registradas.';
  }

  createForm.addEventListener('submit', async function (event) {
    event.preventDefault();
    createMessage.classList.remove('error');
    createMessage.textContent = '';
    createButton.disabled = true;
    createButton.textContent = 'Creando...';

    const formData = new FormData(createForm);
    const payload = {
      nombre: formData.get('nombre').trim(),
      email: formData.get('email').trim(),
      documento: formData.get('documento').trim() || null,
      password: formData.get('password'),
      rol_id: Number(formData.get('rol_id'))
    };

    try {
      const result = await request(API, { method: 'POST', body: JSON.stringify(payload) });
      createForm.reset();
      createMessage.textContent = result.mensaje || 'Usuario creado correctamente.';
      await loadUsers();
    } catch (error) {
      createMessage.textContent = error.message;
      createMessage.classList.add('error');
    } finally {
      createButton.disabled = false;
      createButton.textContent = 'Crear cuenta';
    }
  });

  rows.addEventListener('click', async function (event) {
    const button = event.target.closest('[data-save-role]');
    if (!button) return;
    const userId = button.dataset.saveRole;
    const select = rows.querySelector('[data-role-select="' + userId + '"]');
    button.disabled = true;
    button.textContent = 'Guardando...';
    try {
      const result = await request(API + '/' + userId + '/rol', {
        method: 'PATCH',
        body: JSON.stringify({ rol_id: Number(select.value) })
      });
      usersStatus.textContent = result.mensaje || 'Rol actualizado correctamente.';
      await loadUsers();
    } catch (error) {
      usersStatus.textContent = error.message;
    } finally {
      button.disabled = false;
      button.textContent = 'Guardar';
    }
  });

  document.getElementById('salir').addEventListener('click', function () {
    localStorage.removeItem('token');
    localStorage.removeItem('rol_id');
    location.href = '/login.html';
  });

  if (!token) {
    location.href = '/login.html';
    return;
  }

  loadUsers().catch(function (error) {
    if (!denied.classList.contains('oculto')) return;
    usersStatus.textContent = error.message;
  });
})();
