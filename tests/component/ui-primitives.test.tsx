import { fireEvent, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useState } from 'react'
import { describe, expect, it, vi } from 'vitest'

import {
  Button,
  Dialog,
  SectionTitle,
  StateMessage,
  StatTile,
  StatusBadge,
  TextField,
  TicketCard,
  ToastProvider,
} from '../../src/components/ui'
import { useToast } from '../../src/components/ui/toast-context'

describe('shared UI primitives', () => {
  it('renders semantic content primitives', () => {
    render(
      <TicketCard aria-label="Warqadda ciyaaryahanka">
        <SectionTitle eyebrow="Kooxda">Ciyaartoyda</SectionTitle>
        <StatTile label="Xadir" value={12} detail="Maanta" />
        <StatusBadge tone="success">La ansixiyey</StatusBadge>
      </TicketCard>,
    )

    expect(
      screen.getByRole('region', { name: 'Warqadda ciyaaryahanka' }),
    ).toBeInTheDocument()
    expect(
      screen.getByRole('heading', { name: 'Ciyaartoyda', level: 2 }),
    ).toBeInTheDocument()
    expect(screen.getByText('12')).toBeInTheDocument()
    expect(screen.getByText('La ansixiyey')).toHaveClass('ui-status-success')
  })

  it('connects field help and errors accessibly', () => {
    render(
      <TextField
        description="Geli magaca oo dhan"
        error="Magaca waa waajib"
        label="Magaca"
        required
      />,
    )

    const input = screen.getByRole('textbox', { name: /Magaca/ })
    expect(input).toBeRequired()
    expect(input).toHaveAttribute('aria-invalid', 'true')
    expect(input.getAttribute('aria-describedby')).toContain('description')
    expect(input.getAttribute('aria-describedby')).toContain('error')
    expect(screen.getByRole('alert')).toHaveTextContent('Magaca waa waajib')
  })

  it('disables a busy button and exposes its state', () => {
    render(<Button busy>Kaydinaya</Button>)

    expect(screen.getByRole('button', { name: 'Kaydinaya' })).toBeDisabled()
    expect(screen.getByRole('button')).toHaveAttribute('aria-busy', 'true')
  })

  it('closes a dialog with Escape and restores focus', async () => {
    const user = userEvent.setup()

    function DialogExample() {
      const [open, setOpen] = useState(false)
      return (
        <>
          <Button onClick={() => setOpen(true)}>Fur</Button>
          <Dialog
            actions={<Button onClick={() => setOpen(false)}>Xir</Button>}
            onClose={() => setOpen(false)}
            open={open}
            title="Xaqiiji"
          >
            Ma hubtaa?
          </Dialog>
        </>
      )
    }

    render(<DialogExample />)
    const trigger = screen.getByRole('button', { name: 'Fur' })
    await user.click(trigger)

    expect(screen.getByRole('dialog', { name: 'Xaqiiji' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Xir' })).toHaveFocus()
    fireEvent.keyDown(document, { key: 'Escape' })
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    expect(trigger).toHaveFocus()
  })

  it('announces and dismisses toast messages', async () => {
    const user = userEvent.setup()

    function ToastExample() {
      const { notify } = useToast()
      return (
        <Button onClick={() => notify('Waa la keydiyey', 'success')}>
          Kaydi
        </Button>
      )
    }

    render(
      <ToastProvider>
        <ToastExample />
      </ToastProvider>,
    )
    await user.click(screen.getByRole('button', { name: 'Kaydi' }))

    expect(screen.getByRole('status')).toHaveTextContent('Waa la keydiyey')
    await user.click(screen.getByRole('button', { name: 'Xir fariinta' }))
    expect(screen.queryByText('Waa la keydiyey')).not.toBeInTheDocument()
  })

  it('offers retry only for recoverable error states', async () => {
    const retry = vi.fn()
    const user = userEvent.setup()
    const { rerender } = render(
      <StateMessage
        kind="error"
        message="Xogta lama helin"
        onRetry={retry}
        title="Waxbaa khaldamay"
      />,
    )

    await user.click(screen.getByRole('button', { name: 'Mar kale isku day' }))
    expect(retry).toHaveBeenCalledOnce()

    rerender(<StateMessage kind="empty" title="Wax xog ah ma jirto" />)
    expect(screen.queryByRole('button')).not.toBeInTheDocument()
  })
})
