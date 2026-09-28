// src/services/api.js
// Client API service for CampusBite

const API_URL = "http://localhost:8000/api"

async function fetchAPI(endpoint, options = {}) {
  // If we need auth, we should include credentials or headers
  const token = sessionStorage.getItem('access_token')
  const headers = {
    'Content-Type': 'application/json',
    ...options.headers,
  }
  
  if (token) {
    headers['Authorization'] = `Bearer ${token}`
  }
  
  const response = await fetch(`${API_URL}${endpoint}`, {
    ...options,
    headers
  })
  
  if (!response.ok) {
    let message = "An error occurred"
    try {
      const errData = await response.json()
      message = errData.detail || message
    } catch(e) {}
    throw new Error(message)
  }
  
  return response.json()
}

// ----------------------------------------------------
// Menu & Category Management
// ----------------------------------------------------

export async function getMenu() {
  return fetchAPI("/menu/")
}

export async function getAdminMenu() {
  return fetchAPI("/menu/?admin=true")
}

export async function getMenuItem(id) {
  // Use admin fetch to ensure we can get inactive items too
  const menu = await getAdminMenu()
  return menu.find(m => m.id === id) || null
}

export async function saveMenuItem(updatedItem) {
  return fetchAPI(`/menu/${updatedItem.id}`, {
    method: "PATCH",
    body: JSON.stringify(updatedItem)
  })
}

export async function getCategories() {
  return fetchAPI("/menu/categories")
}

export async function uploadImage(file) {
  const token = sessionStorage.getItem('access_token')
  const formData = new FormData()
  formData.append('file', file)

  const headers = {}
  if (token) {
    headers['Authorization'] = `Bearer ${token}`
  }

  const response = await fetch(`${API_URL}/upload/`, {
    method: "POST",
    headers,
    body: formData
  })

  if (!response.ok) {
    let message = "Upload failed"
    try {
      const errData = await response.json()
      message = errData.detail || message
    } catch(e) {}
    throw new Error(message)
  }

  return response.json()
}

export async function updateCategories(categories) {
  console.warn("updateCategories not yet backed by API")
}

export function getEffectiveState(item, date = new Date()) {
  // Backend returns pre-calculated effective state for consumers
  // We can just rely on item.is_available and item.is_special
  return { available: item.is_available, special: item.is_special }
}

export async function getTodaysSpecial() {
  const menu = await getMenu()
  return menu.filter(item => item.is_special)
}

// ----------------------------------------------------
// Settings & Audit Logs (MOCK)
// ----------------------------------------------------

const DEFAULT_SETTINGS = {
  cafeteriaName: 'CampusBite',
  upiVpa: 'campusbite@upi',
  hours: {
    Monday: { isOpen: true, open: '08:00', close: '20:00' },
    Tuesday: { isOpen: true, open: '08:00', close: '20:00' },
    Wednesday: { isOpen: true, open: '08:00', close: '20:00' },
    Thursday: { isOpen: true, open: '08:00', close: '20:00' },
    Friday: { isOpen: true, open: '08:00', close: '20:00' },
    Saturday: { isOpen: true, open: '09:00', close: '15:00' },
    Sunday: { isOpen: false, open: '08:00', close: '20:00' }
  }
}

export function getSettings() {
  const data = localStorage.getItem('campusbite_settings')
  return data ? JSON.parse(data) : DEFAULT_SETTINGS
}

export function saveSettings(settings) {
  localStorage.setItem('campusbite_settings', JSON.stringify(settings))
}

export function isWithinOperatingHours() {
  return true // Unlocked for development
}

export function getNextOpening() {
  return 'today at 08:00'
}

export function logAuditEvent(actor, action, entity, details = {}) {
  console.log(`[AUDIT] ${actor} did ${action} on ${entity}`, details)
}

export function getAuditLogs() {
  return []
}

// ----------------------------------------------------
// Workers Management (MOCK fallback)
// ----------------------------------------------------

export function getWorkers() {
  return []
}
export function saveWorkers(workers) {}

// ----------------------------------------------------
// Daily Closing Management (MOCK fallback)
// ----------------------------------------------------

export function getClosings() {
  return []
}
export function saveClosing(closing) {}
export function addCorrection(date, correction) { return false }

// ----------------------------------------------------
// Order Management
// ----------------------------------------------------

export async function createOrder({ customerName, paymentMethod, items }) {
  // Convert structure
  const payload = {
    customerName,
    paymentMethod,
    items: items.map(i => ({ id: i.id, quantity: i.quantity }))
  }
  return fetchAPI("/orders/", {
    method: "POST",
    body: JSON.stringify(payload)
  })
}

export async function getOrderByToken(token) {
  return fetchAPI(`/orders/${token}`)
}

export async function confirmPayment(token, confirmedBy = 'system') {
  return fetchAPI(`/orders/${token}/status`, {
    method: "PATCH",
    body: JSON.stringify({ paymentStatus: "PAID", orderStatus: "PREPARING" })
  })
}

export async function completeOrder(token) {
  return fetchAPI(`/orders/${token}/status`, {
    method: "PATCH",
    body: JSON.stringify({ orderStatus: "COMPLETED" })
  })
}

export async function getAllOrders() {
  return fetchAPI("/orders/")
}

export async function loginWorker(username, password) {
  const response = await fetch(`${API_URL}/auth/login`, {
    method: "POST",
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password })
  })
  
  if (!response.ok) {
    let message = "Invalid credentials"
    try {
      const errData = await response.json()
      message = errData.detail || message
    } catch(e) {}
    throw new Error(message)
  }
  
  const data = await response.json()
  // Save token for future requests
  sessionStorage.setItem('access_token', data.access_token)
  return data.user
}

export async function expireOrder(token) {
  return fetchAPI(`/orders/${token}/status`, {
    method: "PATCH",
    body: JSON.stringify({ paymentStatus: "EXPIRED", orderStatus: "CANCELLED" })
  })
}

export async function cancelOrder(token) {
  return fetchAPI(`/orders/${token}/status`, {
    method: "PATCH",
    body: JSON.stringify({ orderStatus: "CANCELLED" })
  })
}
