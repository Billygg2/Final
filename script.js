  /**
   * ============================================================
   * Módulo: Estado de la aplicación (AppState)
   * Descripción: Almacena el estado global en memoria.
   * ============================================================
   * 
   * Para entrar como Admin
   * email: admin@eventos.com | password: admin123
   */
  const AppState = {
    currentUser: null,       // Usuario autenticado
    users: [],               // Lista de usuarios registrados
    events: [],              // Lista de eventos
    editingEventId: null,    // ID del evento en edición (null = nuevo)
  };

  // Datos de ejemplo: usuario administrador por defecto
  AppState.users.push({ id: uid(), name: 'Administrador', email: 'admin@eventos.com', password: 'admin123', role: 'admin' });

  // Eventos de muestra
  AppState.events = [
    { id: uid(), title: 'Conferencia de Inteligencia Artificial', category: 'academico', date: '2025-06-15', place: 'Auditorio Central', desc: 'Ponentes internacionales abordarán los últimos avances en IA.', createdBy: 'admin@eventos.com' },
    { id: uid(), title: 'Torneo Interuniversitario de Fútbol', category: 'deportivo', date: '2025-07-02', place: 'Cancha Principal', desc: 'Competencia entre universidades de la región.', createdBy: 'admin@eventos.com' },
    { id: uid(), title: 'Asamblea Institucional Anual', category: 'institucional', date: '2025-06-30', place: 'Sala de Sesiones', desc: 'Presentación de resultados y planificación estratégica.', createdBy: 'admin@eventos.com' },
  ];

  /** Genera un ID único simple */
  function uid() { return Date.now().toString(36) + Math.random().toString(36).slice(2, 7); }

  // ─────────────────────────────────────────────
  // Módulo: Utilidades de UI
  // ─────────────────────────────────────────────

  /** Muestra un mensaje en el elemento dado */
  function showMsg(id, text, type) {
    const el = document.getElementById(id);
    el.textContent = text;
    el.className = `msg ${type} show`;
    setTimeout(() => el.classList.remove('show'), 4000);
  }

  /** Activa una pantalla y oculta las demás */
  function showScreen(id) {
    document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
    document.getElementById(id).classList.add('active');
  }

  // ─────────────────────────────────────────────
  // Módulo: Autenticación
  // ─────────────────────────────────────────────

  /** Alterna entre los formularios de login y registro */
  function switchAuthTab(tab) {
    document.getElementById('form-login').style.display = tab === 'login' ? 'block' : 'none';
    document.getElementById('form-register').style.display = tab === 'register' ? 'block' : 'none';
    document.querySelectorAll('.auth-tab').forEach((el, i) => {
      el.classList.toggle('active', (tab === 'login' && i === 0) || (tab === 'register' && i === 1));
    });
  }

  /**
   * RF-01: Registro de usuarios
   * Valida campos, verifica duplicados y crea cuenta.
   */
  function handleRegister() {
    const name  = document.getElementById('reg-name').value.trim();
    const email = document.getElementById('reg-email').value.trim();
    const pass  = document.getElementById('reg-pass').value;
    const pass2 = document.getElementById('reg-pass2').value;

    // Validaciones de entrada
    if (!name || !email || !pass || !pass2) return showMsg('auth-msg', 'Todos los campos son obligatorios.', 'error');
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return showMsg('auth-msg', 'Ingresa un correo válido.', 'error');
    if (pass.length < 6) return showMsg('auth-msg', 'La contraseña debe tener al menos 6 caracteres.', 'error');
    if (pass !== pass2) return showMsg('auth-msg', 'Las contraseñas no coinciden.', 'error');
    if (AppState.users.find(u => u.email === email)) return showMsg('auth-msg', 'Este correo ya está registrado.', 'error');

    AppState.users.push({ id: uid(), name, email, password: pass, role: 'user' });
    showMsg('auth-msg', '¡Cuenta creada! Ahora inicia sesión.', 'success');
    switchAuthTab('login');
    document.getElementById('login-email').value = email;
  }

  /**
   * RF-02: Inicio de sesión
   * Verifica credenciales y carga la pantalla principal.
   */
  function handleLogin() {
    const email = document.getElementById('login-email').value.trim();
    const pass  = document.getElementById('login-pass').value;

    if (!email || !pass) return showMsg('auth-msg', 'Completa todos los campos.', 'error');

    const user = AppState.users.find(u => u.email === email && u.password === pass);
    if (!user) return showMsg('auth-msg', 'Correo o contraseña incorrectos.', 'error');

    AppState.currentUser = user;
    loadApp();
  }

  /** Cierra sesión y regresa a pantalla de autenticación */
  function handleLogout() {
    AppState.currentUser = null;
    AppState.editingEventId = null;
    document.getElementById('header-user').style.display = 'none';
    showScreen('screen-auth');
  }

  // ─────────────────────────────────────────────
  // Módulo: Carga de la aplicación
  // ─────────────────────────────────────────────

  /** Inicializa la interfaz principal después del login */
  function loadApp() {
    const u = AppState.currentUser;
    // Cabecera
    document.getElementById('header-user').style.display = 'flex';
    document.getElementById('lbl-user-header').textContent = u.name;
    // Sidebar
    document.getElementById('sb-name').textContent  = u.name;
    document.getElementById('sb-email').textContent = u.email;
    document.getElementById('sb-role').innerHTML    = u.role === 'admin' ? '<span class="badge-admin">Administrador</span>' : 'Usuario';
    // Visibilidad de pestaña Usuarios (solo admin)
    document.getElementById('tab-users').style.display = u.role === 'admin' ? 'block' : 'none';

    renderEvents();
    renderUsers();
    updateStats();
    showScreen('screen-app');
    switchView('events', document.querySelector('.view-tab'));
  }

  // ─────────────────────────────────────────────
  // Módulo: Gestión de Eventos (RF-03)
  // ─────────────────────────────────────────────

  /** Renderiza las tarjetas de eventos en la grilla */
  function renderEvents() {
    const grid = document.getElementById('events-grid');
    const isAdmin = AppState.currentUser?.role === 'admin';

    if (AppState.events.length === 0) {
      grid.innerHTML = `<div class="empty-state" style="grid-column:1/-1"><div class="icon">📭</div><p>No hay eventos registrados aún.</p></div>`;
      return;
    }

    grid.innerHTML = AppState.events.map(ev => {
      const catClass = { academico: 'cat-academico', institucional: 'cat-institucional', deportivo: 'cat-deportivo', cultural: 'cat-cultural' }[ev.category] || '';
      const catLabel = { academico: 'Académico', institucional: 'Institucional', deportivo: 'Deportivo', cultural: 'Cultural' }[ev.category] || ev.category;
      const actions = isAdmin
        ? `<button class="btn btn-secondary btn-sm" onclick="editEvent('${ev.id}')">✏️ Editar</button>
           <button class="btn btn-danger btn-sm" onclick="deleteEvent('${ev.id}')">🗑 Eliminar</button>`
        : '';
      return `
        <div class="event-card">
          <div class="event-card-header">
            <span class="event-category ${catClass}">${catLabel}</span>
          </div>
          <h4>${ev.title}</h4>
          <div class="event-meta">
            <span>${ev.date}</span>
            <span>${ev.place}</span>
          </div>
          ${ev.desc ? `<p class="event-desc">${ev.desc}</p>` : ''}
          ${actions ? `<div class="event-actions">${actions}</div>` : ''}
        </div>`;
    }).join('');
  }

  /** Abre el modal para crear un nuevo evento */
  function openModal() {
    AppState.editingEventId = null;
    document.getElementById('modal-title').textContent = 'Nuevo Evento';
    ['ev-titulo','ev-lugar','ev-desc'].forEach(id => document.getElementById(id).value = '');
    document.getElementById('ev-cat').value = '';
    document.getElementById('ev-fecha').value = '';
    document.getElementById('modal-overlay').classList.add('open');
  }

  /** Cierra el modal */
  function closeModal() {
    document.getElementById('modal-overlay').classList.remove('open');
  }

  /** Carga un evento existente en el modal para edición */
  function editEvent(id) {
    const ev = AppState.events.find(e => e.id === id);
    if (!ev) return;
    AppState.editingEventId = id;
    document.getElementById('modal-title').textContent = 'Editar Evento';
    document.getElementById('ev-titulo').value = ev.title;
    document.getElementById('ev-cat').value    = ev.category;
    document.getElementById('ev-fecha').value  = ev.date;
    document.getElementById('ev-lugar').value  = ev.place;
    document.getElementById('ev-desc').value   = ev.desc;
    document.getElementById('modal-overlay').classList.add('open');
  }

  /**
   * Guarda (crea o actualiza) un evento.
   * Incluye validación completa de campos.
   */
  function saveEvent() {
    const title    = document.getElementById('ev-titulo').value.trim();
    const category = document.getElementById('ev-cat').value;
    const date     = document.getElementById('ev-fecha').value;
    const place    = document.getElementById('ev-lugar').value.trim();
    const desc     = document.getElementById('ev-desc').value.trim();

    // Validaciones (RF-03, NF-01)
    if (!title)    return showMsg('modal-msg', 'El título es obligatorio.', 'error');
    if (!category) return showMsg('modal-msg', 'Selecciona una categoría.', 'error');
    if (!date)     return showMsg('modal-msg', 'La fecha es obligatoria.', 'error');
    if (!place)    return showMsg('modal-msg', 'El lugar es obligatorio.', 'error');
    if (title.length < 4) return showMsg('modal-msg', 'El título debe tener al menos 4 caracteres.', 'error');

    if (AppState.editingEventId) {
      // Actualizar evento existente
      const idx = AppState.events.findIndex(e => e.id === AppState.editingEventId);
      AppState.events[idx] = { ...AppState.events[idx], title, category, date, place, desc };
    } else {
      // Crear nuevo evento
      AppState.events.push({ id: uid(), title, category, date, place, desc, createdBy: AppState.currentUser.email });
    }

    closeModal();
    renderEvents();
    updateStats();
    showMsg('events-msg', AppState.editingEventId ? 'Evento actualizado.' : 'Evento creado exitosamente.', 'success');
  }

  /** Elimina un evento por su ID */
  function deleteEvent(id) {
    if (!confirm('¿Eliminar este evento?')) return;
    AppState.events = AppState.events.filter(e => e.id !== id);
    renderEvents();
    updateStats();
  }

  // ─────────────────────────────────────────────
  // Módulo: Gestión de Usuarios (solo admin)
  // ─────────────────────────────────────────────

  /** Renderiza la lista de usuarios registrados */
  function renderUsers() {
    const list = document.getElementById('users-list');
    list.innerHTML = AppState.users.map(u => `
      <div class="user-row">
        <div class="user-info">
          <div class="avatar">${u.name.charAt(0).toUpperCase()}</div>
          <div>
            <div class="user-name">${u.name} ${u.role === 'admin' ? '<span class="badge-admin">Admin</span>' : ''}</div>
            <div class="user-email">${u.email}</div>
          </div>
        </div>
      </div>`).join('');
  }

  /** Actualiza las estadísticas del sidebar */
  function updateStats() {
    document.getElementById('stat-total').textContent = AppState.events.length;
    document.getElementById('stat-acad').textContent  = AppState.events.filter(e => e.category === 'academico').length;
    document.getElementById('stat-inst').textContent  = AppState.events.filter(e => e.category === 'institucional').length;
    document.getElementById('stat-users').textContent = AppState.users.length;
  }

  /** Cambia entre las vistas de la aplicación */
  function switchView(view, btn) {
    document.getElementById('view-events').style.display = view === 'events' ? 'block' : 'none';
    document.getElementById('view-users').style.display  = view === 'users'  ? 'block' : 'none';
    document.querySelectorAll('.view-tab').forEach(t => t.classList.remove('active'));
    if (btn) btn.classList.add('active');
  }

  // ─────────────────────────────────────────────
  // Módulo: Listeners globales
  // ─────────────────────────────────────────────
  document.getElementById('btn-logout').addEventListener('click', handleLogout);

  // Cerrar modal al clic fuera
  document.getElementById('modal-overlay').addEventListener('click', function(e) {
    if (e.target === this) closeModal();
  });

  // Enter en login
  document.getElementById('login-pass').addEventListener('keydown', e => { if (e.key === 'Enter') handleLogin(); });