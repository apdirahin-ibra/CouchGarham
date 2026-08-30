import { describe, expect, it } from 'vitest'

function add(left: number, right: number) {
  return left + right
}

describe('unit test runner', () => {
  it('executes a deterministic calculation in Node', () => {
    expect(add(20, 22)).toBe(42)
  })
})
