import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, it, expect, vi, afterEach } from 'vitest'
import Auth from './Auth'

// Auth habla con el backend (localhost:3000). En una prueba de componente NO
// queremos backend ni base de datos: reemplazamos fetch por una funcion falsa
// que devuelve lo que nosotros decidamos. Asi la prueba es determinista.
function simularRespuesta(ok: boolean, datos: unknown) {
  vi.stubGlobal(
    'fetch',
    vi.fn().mockResolvedValue({ ok, json: async () => datos })
  )
}

afterEach(() => {
  vi.unstubAllGlobals()
  localStorage.clear()
})

describe('Auth', () => {
  it('con credenciales correctas guarda el token y avisa al padre', async () => {
    simularRespuesta(true, {
      message: 'Login correcto',
      token: 'token-falso',
      user: { name: 'Sergio' },
    })
    const onLogin = vi.fn()
    render(<Auth onLogin={onLogin} />)
    const usuario = userEvent.setup()

    await usuario.type(screen.getByPlaceholderText('Email'), 'sergio@test.com')
    await usuario.type(screen.getByPlaceholderText('Contraseña'), '123456')
    await usuario.click(screen.getByRole('button', { name: 'Entrar' }))

    expect(onLogin).toHaveBeenCalledWith('token-falso')
    expect(localStorage.getItem('token')).toBe('token-falso')
  })

  it('con credenciales incorrectas muestra el error y no inicia sesion', async () => {
    simularRespuesta(false, { message: 'Credenciales invalidas' })
    const onLogin = vi.fn()
    render(<Auth onLogin={onLogin} />)
    const usuario = userEvent.setup()

    await usuario.type(screen.getByPlaceholderText('Email'), 'malo@test.com')
    await usuario.type(screen.getByPlaceholderText('Contraseña'), 'malo')
    await usuario.click(screen.getByRole('button', { name: 'Entrar' }))

    expect(await screen.findByText(/Credenciales invalidas/)).toBeInTheDocument()
    expect(onLogin).not.toHaveBeenCalled()
    expect(localStorage.getItem('token')).toBeNull()
  })

  it('al pulsar la pestana Crear cuenta muestra el formulario de registro', async () => {
    render(<Auth onLogin={vi.fn()} />)
    const usuario = userEvent.setup()

    await usuario.click(screen.getByRole('button', { name: 'Crear cuenta' }))

    expect(screen.getByRole('heading', { name: 'Registro' })).toBeInTheDocument()
    expect(screen.getByPlaceholderText('Nombre')).toBeInTheDocument()
  })

  it('tras un registro exitoso vuelve a la pestana de login', async () => {
    simularRespuesta(true, { message: 'Usuario creado' })
    render(<Auth onLogin={vi.fn()} />)
    const usuario = userEvent.setup()

    // 1) cambiar a la pestana de registro
    await usuario.click(screen.getByRole('button', { name: 'Crear cuenta' }))

    // 2) llenar el formulario
    await usuario.type(screen.getByPlaceholderText('Nombre'), 'Sergio')
    await usuario.type(screen.getByPlaceholderText('Email'), 'sergio@test.com')
    await usuario.type(screen.getByPlaceholderText('Contraseña'), '123456')

    // Hay DOS botones "Crear cuenta": la pestana y el de enviar.
    // El de enviar es el segundo.
    const botones = screen.getAllByRole('button', { name: 'Crear cuenta' })
    await usuario.click(botones[1])

    // 3) el componente vuelve solo a la pantalla de login
    expect(
      await screen.findByRole('heading', { name: 'Iniciar sesión' })
    ).toBeInTheDocument()
  })

  it('si el registro falla muestra el mensaje de error del backend', async () => {
    simularRespuesta(false, { message: 'El email ya esta registrado' })
    render(<Auth onLogin={vi.fn()} />)
    const usuario = userEvent.setup()

    await usuario.click(screen.getByRole('button', { name: 'Crear cuenta' }))
    await usuario.type(screen.getByPlaceholderText('Nombre'), 'Sergio')
    await usuario.type(screen.getByPlaceholderText('Email'), 'repetido@test.com')
    await usuario.type(screen.getByPlaceholderText('Contraseña'), '123456')

    const botones = screen.getAllByRole('button', { name: 'Crear cuenta' })
    await usuario.click(botones[1])

    expect(
      await screen.findByText(/El email ya esta registrado/)
    ).toBeInTheDocument()
  })
})
