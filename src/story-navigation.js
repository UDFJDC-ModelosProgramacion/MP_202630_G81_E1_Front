const stories = [
  ['HU01', 'Galería de fotos'],
  ['HU02', 'Gestionar fotografías'],
  ['HU03', 'Eventos de vida'],
  ['HU04', 'Línea de tiempo'],
  ['HU05', 'Historias de éxito'],
  ['HU06', 'Consultar historias'],
  ['HU07', 'Mensajes'],
  ['HU08', 'Organizar mensajes'],
  ['HU09', 'Registro de adoptante'],
  ['HU10', 'Mi perfil'],
  ['HU11', 'Adoptantes'],
  ['HU12', 'Catálogo de vacunas'],
  ['HU13', 'Gestionar vacunas'],
  ['HU14', 'Registrar vacunación'],
  ['HU15', 'Historial de vacunación'],
  ['HU16', 'Corregir vacunación'],
  ['HU17', 'Notificaciones'],
  ['HU18', 'Solicitud de adopción'],
  ['HU19', 'Formalizar adopción'],
  ['HU20', 'Prueba de convivencia'],
  ['HU21', 'Devolución'],
  ['HU23', 'Actualizaciones'],
  ['HU24', 'Reseñas'],
  ['HU25', 'Consultar reseñas'],
  ['HU26', 'Generar notificaciones'],
  ['HU27', 'Gestionar notificaciones'],
  ['HU28', 'Eventos médicos'],
  ['HU29', 'Historial médico'],
  ['HU30', 'Gestionar refugios'],
  ['HU31', 'Detalle de un refugio'],
  ['HU32', 'Registrar una mascota'],
  ['HU33', 'Catálogo de mascotas'],
  ['HU34', 'Registrar veterinarios'],
  ['HU35', 'Seguimientos veterinarios'],
]

export function renderStoryLinks(activeStory) {
  return stories.map(([id, label]) => `
    <a href="./${id}.html"${id === activeStory ? ' aria-current="page"' : ''}>${id} · ${label}</a>
  `).join('')
}