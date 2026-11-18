const stories = [
  ['HU01', 'Galería de fotos'],
  ['HU02', 'Gestionar fotografías'],
  ['HU03', 'Eventos de vida'],
  ['HU04', 'Línea de tiempo'],
  ['HU05', 'Historias de éxito'],
  ['HU18', 'Solicitud de adopción'],
  ['HU19', 'Formalizar adopción'],
  ['HU20', 'Prueba de convivencia'],
  ['HU21', 'Devolución'],
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