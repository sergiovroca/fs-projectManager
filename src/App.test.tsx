import { render, screen } from '@testing-library/react'
import { describe, it, expect, vi, afterEach } from 'vitest'
import App from './App'

afterEach(() => {
  vi.unstubAllGlobals()
  localStorage.clear()
})

describe('App', () => {
  it('sin sesion iniciada muestra la pantalla de login', () => {
    render(<App />)

    expect(
      screen.getByRole('heading', { name: 'Administrador de tareas' })
    ).toBeInTheDocument()
    expect(
      screen.getByRole('heading', { name: 'Iniciar sesión' })
    ).toBeInTheDocument()
    // El gestor de tareas NO debe verse todavia
    expect(
      screen.queryByPlaceholderText('Escribe una nueva tarea')
    ).not.toBeInTheDocument()
  })

  it('con sesion iniciada pide las tareas al backend y las muestra', async () => {
    localStorage.setItem('token', 'token-falso')
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => [
          { id: 1, text: 'Comprar pan', priority: 'alta', completed: false },
        ],
      })
    )

    render(<App />)

    expect(await screen.findByText('Comprar pan')).toBeInTheDocument()
    expect(
      screen.getByPlaceholderText('Escribe una nueva tarea')
    ).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Cerrar sesión' })).toBeInTheDocument()
  })

  it('si el token es invalido cierra la sesion y vuelve al login', async () => {
    localStorage.setItem('token', 'token-vencido')
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({ ok: false, json: async () => ({}) })
    )

    render(<App />)

    // El backend responde 401 -> App borra el token y muestra el login
    expect(
      await screen.findByRole('heading', { name: 'Iniciar sesión' })
    ).toBeInTheDocument()
    expect(localStorage.getItem('token')).toBeNull()
  })
})
