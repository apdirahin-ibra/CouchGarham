import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

function SampleCard({ title }: { title: string }) {
  return <section aria-label={title}>{title}</section>
}

describe('component test runner', () => {
  it('renders React content in jsdom', () => {
    render(<SampleCard title="Tijaabada qaybta" />)

    expect(
      screen.getByRole('region', { name: 'Tijaabada qaybta' }),
    ).toBeInTheDocument()
  })
})
