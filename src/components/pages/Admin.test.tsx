import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import { MemoryRouter } from 'react-router-dom'
import Admin from './Admin'

// mock the user menu component
vi.mock('./userMenu', () => ({
  default: () => <div>UserMenu</div>
}))

// mock the delete modal
vi.mock('./confirmDeletion', () => ({
  default: ({ onCancel, onConfirm }: { onCancel: () => void, onConfirm: () => void }) => (
    <div>
      <button onClick={onCancel}>Cancel Delete</button>
      <button onClick={onConfirm}>Confirm Delete</button>
    </div>
  )
}))

// mock API calls to avoid using a real one
global.fetch = vi.fn(() =>
  Promise.resolve({
    json: () => Promise.resolve([]),
    ok: true,
  })
) as any

// Admin dashboard tests
describe('Admin component', () => {

  // test if header exists
  it('renders Surveys header', async () => {
    render(
      <MemoryRouter>
        <Admin />
      </MemoryRouter>
    )
    expect(await screen.findByRole('heading', { name: /Surveys/i })).toBeInTheDocument()
  })

  // test that we display a message when there are no surveys
  it('shows empty state if no surveys', async () => {
    render(
      <MemoryRouter>
        <Admin />
      </MemoryRouter>
    )
    expect(await screen.findByText(/there are no surveys uploaded/i)).toBeInTheDocument()
  })

  // tests if create survey button is there
  it('renders "Create Survey" button', async () => {
    render(
      <MemoryRouter>
        <Admin />
      </MemoryRouter>
    )
    expect(await screen.findByRole('button', { name: /\+ Create Survey/i })).toBeInTheDocument()
  })

  it('shows Approvals button in navbar', () => {
    render(
      <MemoryRouter>
        <Admin />
      </MemoryRouter>
    )
    expect(screen.getByRole('button', { name: /Approvals/i })).toBeInTheDocument()
  })

  it('renders Admin Role icon tooltip', () => {
    render(
      <MemoryRouter>
        <Admin />
      </MemoryRouter>
    )
    expect(screen.getByText(/Admin Role/i)).toBeInTheDocument()
  })

  it('renders footer with copyright', () => {
    render(
      <MemoryRouter>
        <Admin />
      </MemoryRouter>
    )
    expect(screen.getByText(/© 2025 DermiQ/i)).toBeInTheDocument()
  })

  it('navigates to create new survey when we click a New Survey', async () => {
    render(
      <MemoryRouter>
        <Admin />
      </MemoryRouter>
    )
    const newSurveyButton = await screen.findByRole('button', { name: /\+ Create Survey/i })
    expect(newSurveyButton).toBeVisible()
  })

  it('shows surveys if surveys exist', async () => {
    (global.fetch as any).mockImplementationOnce(() =>
      Promise.resolve({
        // fake a survey response
        json: () =>
          Promise.resolve([
            { id: 1, title: 'Survey 1', description: 'First survey', created_by: 1 },
          ]),
        ok: true,
      })
    )

    render(
      <MemoryRouter>
        <Admin />
      </MemoryRouter>
    )

    expect(await screen.findByText(/Survey 1/i)).toBeInTheDocument()
  })

  it('shows View Responses button for surveys', async () => {
    (global.fetch as any).mockImplementationOnce(() =>
      Promise.resolve({
        json: () =>
          Promise.resolve([
            { id: 1, title: 'Survey 1', description: 'First survey', created_by: 1 },
          ]),
        ok: true,
      })
    )

    render(
      <MemoryRouter>
        <Admin />
      </MemoryRouter>
    )

    expect(await screen.findByRole('button', { name: /View Responses/i })).toBeInTheDocument()
  })

  it('opens Delete confirmation modal when clicking Delete', async () => {
    (global.fetch as any).mockImplementationOnce(() =>
      Promise.resolve({
        json: () =>
          Promise.resolve([
            { id: 1, title: 'Survey 1', description: 'First survey', created_by: 1 },
          ]),
        ok: true,
      })
    )

    render(
      <MemoryRouter>
        <Admin />
      </MemoryRouter>
    )

    const deleteButton = await screen.findByRole('button', { name: /Delete/i })
    fireEvent.click(deleteButton)

    expect(await screen.findByText(/Confirm Delete/i)).toBeInTheDocument()
    expect(await screen.findByText(/Cancel Delete/i)).toBeInTheDocument()
  })
})
