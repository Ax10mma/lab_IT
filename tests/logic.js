export function getAccessoryCategory(accessoryId) {
  if (accessoryId.includes('scope')) return 'scopes'
  if (accessoryId.includes('grip')) return 'grips'
  if (accessoryId.includes('stock')) return 'stocks'
  if (accessoryId.includes('laser') || accessoryId.includes('flashlight')) return 'lasers'
  if (accessoryId.includes('mag')) return 'magazines'
  if (accessoryId.includes('hider') || accessoryId.includes('silencer')) return 'barrel'
  return 'unknown'
}

export function formatSelectedItems(items) {
  if (!items || Object.keys(items).length === 0) return 'Нічого не обрано'
  return `Обрано: ${Object.values(items).join(', ')}`
}

export function isValidGun(gunId) {
  const validGuns = ['ak74', 'm4a1']
  return validGuns.includes(gunId)
}

export function countSelectedAccessories(selectedItems) {
  return Object.keys(selectedItems).length
}

export function canAddAccessory(category, selectedItems) {
  return !selectedItems.hasOwnProperty(category)
}