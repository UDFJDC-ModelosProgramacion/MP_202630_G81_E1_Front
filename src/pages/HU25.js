
import '../style.css'
import '../HU25.css'
import { renderStoryLinks } from '../story-navigation.js'
import { renderStorySidebar } from '../story-sidebar.js'


import {
  ReviewsError,
  escapeHtml,
  fetchAllReviews,
  fetchReviewById,
  fetchReviewsByAdopter,
  fetchReviewsByPet,
  fetchReviewsByRating,
  filterReviewsByRating,
  getApiUrl,
  renderReviewList,
} from '../workflows/HU25.js'

const $ = (selector) => document.querySelector(selector)

const elements = {
  navigation: $('#primary-navigation'),
  filters: $('#review-filters'),
  petId: $('#pet-id'),
  rating: $('#rating'),
  adopterId: $('#adopter-id'),
  clear: $('#clear-filters'),
  loading: $('#loading'),
  error: $('#error'),
  empty: $('#empty'),
  summary: $('#results-summary'),
  list: $('#review-list'),
  reviewId: $('#review-id'),
  searchById: $('#search-review-by-id'),
  singleResult: $('#single-review-result'),
}

const apiUrl = getApiUrl(import.meta.env)



elements.navigation.innerHTML = renderStoryLinks('HU25')

document.querySelector('#hu25-sidebar').innerHTML = renderStorySidebar({
  sidebarLabel: 'Información sobre reseñas',
  petStatus: 'En adopción',
  petEmoji: '🐕',
  petTitle: 'Opiniones que ayudan',
  petTag: 'HU25',
  petSubtitle: 'Consulta de reseñas',
  asideDescription: 'Las experiencias de nuestra comunidad ayudan a conocer mejor a las mascotas y sus historias.',
  helpTitle: 'Encuentra una opinión',
  helpDescription: 'Consulta las reseñas registradas y descubre las experiencias compartidas en Huellitas.',
  helpSteps: [
    ['Filtra las reseñas', 'Busca por mascota, adoptante o calificación.'],
    ['Consulta los resultados', 'Revisa las opiniones y sus puntuaciones.'],
    ['Busca por ID', 'Encuentra una reseña específica con su identificador.'],
  ],
  helpLink: {
    href: './HU24.html',
    label: 'Publicar una reseña',
  },
  asideNote: 'Cada experiencia compartida puede ayudar a otra familia.',
})

const menuToggle = document.querySelector('.menu-toggle')

menuToggle.addEventListener('click', () => {
  const expanded = menuToggle.getAttribute('aria-expanded') === 'true'

  menuToggle.setAttribute('aria-expanded', String(!expanded))
  menuToggle.setAttribute(
    'aria-label',
    expanded ? 'Abrir navegación' : 'Cerrar navegación',
  )

  elements.navigation.classList.toggle('nav-open', !expanded)
})


function showListState(state) {
  elements.loading.hidden = state !== 'loading'
  elements.error.hidden = state !== 'error'
  elements.empty.hidden = state !== 'empty'
  elements.list.hidden = state !== 'list'
}

function showError(message) {
  elements.error.textContent = message
  elements.summary.textContent = ''
  showListState('error')
}

function showReviews(reviews) {
  elements.list.innerHTML = renderReviewList(reviews)
  elements.summary.textContent =
    reviews.length === 1
      ? 'Se encontro 1 resena.'
      : `Se encontraron ${reviews.length} resenas.`

  if (reviews.length === 0) {
    elements.empty.textContent =
      'No hay resenas disponibles para esta consulta.'
    showListState('empty')
    return
  }

  showListState('list')
}

async function searchReviews() {
  const petId = elements.petId.value.trim()
  const adopterId = elements.adopterId.value.trim()
  const rating = elements.rating.value

  elements.error.textContent = ''
  elements.summary.textContent = ''
  showListState('loading')

  try {
    let reviews

    if (petId) {
      reviews = await fetchReviewsByPet(
        window.fetch.bind(window),
        petId,
        apiUrl
      )
    } else if (adopterId) {
      reviews = await fetchReviewsByAdopter(
        window.fetch.bind(window),
        adopterId,
        apiUrl
      )
    } else if (rating) {
      reviews = await fetchReviewsByRating(
        window.fetch.bind(window),
        rating,
        apiUrl
      )
    } else {
      reviews = await fetchAllReviews(
        window.fetch.bind(window),
        apiUrl
      )
    }

    if (rating && (petId || adopterId)) {
      reviews = filterReviewsByRating(reviews, rating)
    }

    showReviews(reviews)
  } catch (error) {
    showError(error.message)
  }
}

async function searchSingleReview() {
  const id = elements.reviewId.value.trim()

  elements.singleResult.textContent = 'Consultando reseña...'

  try {
    const review = await fetchReviewById(
      window.fetch.bind(window),
      id,
      apiUrl
    )

    elements.singleResult.innerHTML = renderReviewList([review])
  } catch (error) {
    elements.singleResult.textContent = error.message
  }
}

elements.filters.addEventListener('submit', (event) => {
  event.preventDefault()
  searchReviews()
})

elements.clear.addEventListener('click', () => {
  elements.filters.reset()
  searchReviews()
})

elements.searchById.addEventListener('click', searchSingleReview)

searchReviews()
