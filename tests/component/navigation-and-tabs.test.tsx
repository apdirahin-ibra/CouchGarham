import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import {
  ADMIN_TABS,
  BottomNav,
  PLAYER_TABS,
} from '#/components/layout/BottomNav'
import { TopBar } from '#/components/layout/TopBar'
import { AuthProvider } from '#/lib/auth-client'

describe('BottomNav component', () => {
  it('renders all 11 Admin tabs with Somali labels', () => {
    render(
      <BottomNav
        tabs={ADMIN_TABS}
        activeTab="dashboard"
        onSelectTab={() => {}}
      />,
    )

    expect(screen.getByText('Xogtaada')).toBeInTheDocument()
    expect(screen.getByText('Ciyaartoy')).toBeInTheDocument()
    expect(screen.getByText('Xaadiris')).toBeInTheDocument()
    expect(screen.getByText('Natiijo')).toBeInTheDocument()
    expect(screen.getByText('Codsi')).toBeInTheDocument()
    expect(screen.getByText('Jadwal')).toBeInTheDocument()
    expect(screen.getByText('Wadahadal')).toBeInTheDocument()
    expect(screen.getByText('Sawiro')).toBeInTheDocument()
    expect(screen.getByText('Lacagta')).toBeInTheDocument()
    expect(screen.getByText('Waano')).toBeInTheDocument()
    expect(screen.getByText('Sharci')).toBeInTheDocument()
  })

  it('renders all 10 Player tabs with Somali labels', () => {
    render(
      <BottomNav
        tabs={PLAYER_TABS}
        activeTab="dashboard"
        onSelectTab={() => {}}
      />,
    )

    expect(screen.getByText('Xogtaada')).toBeInTheDocument()
    expect(screen.getByText('Xaadiris')).toBeInTheDocument()
    expect(screen.getByText('Jadwal')).toBeInTheDocument()
    expect(screen.getByText('Fasax')).toBeInTheDocument()
    expect(screen.getByText('Fikrad')).toBeInTheDocument()
    expect(screen.getByText('Wadahadal')).toBeInTheDocument()
    expect(screen.getByText('Sawiro')).toBeInTheDocument()
    expect(screen.getByText('Lacagta')).toBeInTheDocument()
    expect(screen.getByText('Waano')).toBeInTheDocument()
    expect(screen.getByText('Sharci')).toBeInTheDocument()
  })
})

describe('TopBar component', () => {
  it('renders brand crest and title', () => {
    render(
      <AuthProvider>
        <TopBar />
      </AuthProvider>,
    )

    expect(screen.getByText('Best Official')).toBeInTheDocument()
    expect(screen.getByText('Youth Football Club')).toBeInTheDocument()
  })
})
