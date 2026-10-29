const stories = [
  ['HU01', 'Galería de fotos'],
  ['HU18', 'Solicitud de adopción'],
  ['HU19', 'Formalizar adopción'],
  ['HU20', 'Prueba de convivencia'],
  ['HU21', 'Devolución'],
  ['HU33', 'Catálogo de mascotas'],
]

export function renderStoryLinks(activeStory) {
  return stories.map(([id, label]) => `
    <a href="./${id}.html"${id === activeStory ? ' aria-current="page"' : ''}>${id} · ${label}</a>
  `).join('')
}