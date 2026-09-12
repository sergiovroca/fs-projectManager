import { render, screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import Header from './Header'

describe('Header', () => {
  it('muestra el titulo y el subtitulo de la aplicacion', () => {
    render(<Header />)

    expect(
      screen.getByRole('heading', { name: 'Administrador de tareas' })
    ).toBeInTheDocument()
    expect(
      screen.getByText('Organiza tus tareas por prioridad')
    ).toBeInTheDocument()
  })
})
