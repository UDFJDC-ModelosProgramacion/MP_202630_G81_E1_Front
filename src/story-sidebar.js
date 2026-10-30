export function renderStorySidebar(config) {
  const steps = config.helpSteps?.length
    ? `<ol>${config.helpSteps.map(([title, description], index) => `
        <li><span>${index + 1}</span><div><strong>${title}</strong><small>${description}</small></div></li>
      `).join('')}</ol>`
    : ''
  const link = config.helpLink ?? {
    href: './HU18.html',
    label: 'Volver a la solicitud de adopción',
  }
  const helpLink = `<a href="${link.href}">${link.label} <span aria-hidden="true">↗</span></a>`

  return `
    <aside class="application-aside story-sidebar" aria-label="${config.sidebarLabel ?? 'Información de la historia'}">
      <div class="pet-card">
        <div class="pet-photo workflow-photo">
          <span class="photo-sun" aria-hidden="true"></span>
          <span class="pet-badge"><span></span> ${config.petStatus}</span>
          <span class="pet-emoji" role="img" aria-label="Ilustración de una mascota">${config.petEmoji}</span>
        </div>
        <div class="pet-details">
          <div class="pet-title-row"><h2>${config.petTitle}</h2><span class="pet-age">${config.petTag}</span></div>
          <p class="pet-breed">${config.petSubtitle}</p>
          <p class="pet-location"><span aria-hidden="true">⌖</span> Refugio Huellitas · Bogotá</p>
          <p class="pet-description">${config.asideDescription}</p>
        </div>
      </div>
      <div class="process-card workflow-help">
        <div class="process-icon" aria-hidden="true">✳</div>
        <h3>${config.helpTitle}</h3>
        <p>${config.helpDescription}</p>
        ${steps}
        ${helpLink}
      </div>
      <p class="aside-note"><span aria-hidden="true">✦</span> ${config.asideNote}</p>
    </aside>
  `
}