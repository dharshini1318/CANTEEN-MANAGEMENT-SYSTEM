// src/utils/format.js

export function formatPrice(pricePaise) {
  if (typeof pricePaise !== 'number' || isNaN(pricePaise)) return "₹0"
  return `₹${(pricePaise / 100).toFixed(0)}`
}

export function parsePrice(formattedOrString) {
  if (!formattedOrString) return 0
  const numericStr = String(formattedOrString).replace(/[^\d.]/g, '')
  if (!numericStr) return 0
  const floatValue = parseFloat(numericStr)
  return Math.round(floatValue * 100)
}
