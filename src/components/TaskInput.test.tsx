import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, it, expect, vi } from 'vitest'
import TaskInput from './TaskInput'

describe('TaskInput', () => {
  it('llama a onAddTask con el texto escrito por el usuario', async () => {
    // Arrange
    const onAddTask = vi.fn()
    render(<TaskInput onAddTask={onAddTask} />)
    const usuario = userEvent.setup()

    // Act
    const input = screen.getByPlaceholderText('Escribe una nueva tarea')
    await usuario.type(input, 'Comprar pan')
    await usuario.click(screen.getByText('Agregar'))

    // Assert
    expect(onAddTask).toHaveBeenCalledWith('Comprar pan', 'normal')
  })

  it('no llama a onAddTask si el campo esta vacio', async () => {
    const onAddTask = vi.fn()
    render(<TaskInput onAddTask={onAddTask} />)
    const usuario = userEvent.setup()

    await usuario.click(screen.getByText('Agregar'))

    expect(onAddTask).not.toHaveBeenCalled()
  })
  it('envia la prioridad elegida en el selector', async () => {
    const onAddTask = vi.fn()
    render(<TaskInput onAddTask={onAddTask} />)
    const usuario = userEvent.setup()

    await usuario.type(
      screen.getByPlaceholderText('Escribe una nueva tarea'),
      'Pagar la luz'
    )
    // Esto ejecuta el onChange del <select>, la unica linea que faltaba cubrir
    await usuario.selectOptions(screen.getByRole('combobox'), 'alta')
    await usuario.click(screen.getByText('Agregar'))

    expect(onAddTask).toHaveBeenCalledWith('Pagar la luz', 'alta')
  })
})
