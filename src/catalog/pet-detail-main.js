// HU33 - Pet detail: wires the DOM to the logic in catalog.js.
import './catalog.css'
import { PET_NOT_FOUND, fetchPet, getApiUrl, parsePetId, renderPetDetail } from './catalog.js'

const $ = (selector) => document.querySelector(selector)
const elements = {
  title: $('#detail-title'),
  loading: $('#loading'),
  error: $('#error'),
  errorText: $('#error-text'),
  retry: $('#retry'),
  detail: $('#pet-detail'),
}

const petId = parsePetId(window.location.search)

function showOnly(section) {
  elements.loading.hidden = section !== 'loading'
  elements.error.hidden = section !== 'error'
  elements.detail.hidden = section !== 'detail'
}

function showError(message, canRetry) {
  elements.errorText.textContent = message
  elements.retry.hidden = !canRetry
  showOnly('error')
}

async function loadPet() {
  if (petId === null) {
    showError(PET_NOT_FOUND, false)
    return
  }

  showOnly('loading')
  try {
    const pet = await fetchPet(window.fetch.bind(window), petId, getApiUrl(import.meta.env))
    elements.title.textContent = pet.name
    document.title = `${pet.name} | AdoptaPet`
    elements.detail.innerHTML = renderPetDetail(pet)
    showOnly('detail')
  } catch (error) {
    showError(error.message, error.status !== 404)
  }
}

elements.retry.addEventListener('click', loadPet)

loadPet()
