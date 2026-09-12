import { render, screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import Footer from './Footer'

describe('Footer', () => {
  it('muestra los tres contadores que recibe por props', () => {
    render(<Footer total={5} completed={2} pending={3} />)

    expect(screen.getByText('Total: 5')).toBeInTheDocument()
    expect(screen.getByText('Completadas: 2')).toBeInTheDocument()
    expect(screen.getByText('Pendientes: 3')).toBeInTheDocument()
  })
})
