import { getAccessoryCategory, formatSelectedItems, isValidGun, countSelectedAccessories, canAddAccessory } from './logic.js'
import { describe, it, expect } from 'vitest'

// ТЕСТИ
describe('getAccessoryCategory', () => {
  it('повертає scopes для прицілу', () => {
    expect(getAccessoryCategory('holo_scope-v1')).toBe('scopes')
  })

  it('повертає grips для руків\'я', () => {
    expect(getAccessoryCategory('light_grip-v1')).toBe('grips')
  })

  it('повертає lasers для ліхтаря', () => {
    expect(getAccessoryCategory('flashlight-v1')).toBe('lasers')
  })

  it('повертає unknown для невідомого аксесуара', () => {
    expect(getAccessoryCategory('unknown_item')).toBe('unknown')
  })
})

describe('formatSelectedItems', () => {
  it('повертає текст коли нічого не обрано', () => {
    expect(formatSelectedItems({})).toBe('Нічого не обрано')
  })

  it('повертає список обраних аксесуарів', () => {
    const items = { scopes: 'EOTech Holographic', grips: 'Light Grip' }
    expect(formatSelectedItems(items)).toBe('Обрано: EOTech Holographic, Light Grip')
  })
})

describe('isValidGun', () => {
  it('повертає true для ak74', () => {
    expect(isValidGun('ak74')).toBe(true)
  })

  it('повертає true для m4a1', () => {
    expect(isValidGun('m4a1')).toBe(true)
  })

  it('повертає false для невідомої зброї', () => {
    expect(isValidGun('mp5')).toBe(false)
  })
})

describe('countSelectedAccessories', () => {
  it('повертає 0 коли нічого не обрано', () => {
    expect(countSelectedAccessories({})).toBe(0)
  })

  it('повертає правильну кількість', () => {
    const items = { scopes: 'EOTech', grips: 'Light Grip' }
    expect(countSelectedAccessories(items)).toBe(2)
  })
})