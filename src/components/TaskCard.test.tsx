import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, it, expect, vi } from 'vitest'
import TaskCard from './TaskCard'

const tarea = { id: 7, text: 'Comprar pan', priority: 'alta', completed: false }

describe('TaskCard', () => {
  it('muestra el texto y la prioridad de la tarea', () => {
    render(<TaskCard task={tarea} onDeleteTask={vi.fn()} onToggleTask={vi.fn()} />)

    expect(screen.getByText('Comprar pan')).toBeInTheDocument()
    expect(screen.getByText('alta')).toBeInTheDocument()
    expect(screen.getByRole('checkbox')).not.toBeChecked()
  })

  it('avisa al padre con el id correcto al pulsar Eliminar', async () => {
    const onDeleteTask = vi.fn()
    render(
      <TaskCard task={tarea} onDeleteTask={onDeleteTask} onToggleTask={vi.fn()} />
    )
    const usuario = userEvent.setup()

    await usuario.click(screen.getByRole('button', { name: 'Eliminar' }))

    expect(onDeleteTask).toHaveBeenCalledWith(7)
  })

  it('avisa al padre con el id correcto al marcar la casilla', async () => {
    const onToggleTask = vi.fn()
    render(
      <TaskCard task={tarea} onDeleteTask={vi.fn()} onToggleTask={onToggleTask} />
    )
    const usuario = userEvent.setup()

    await usuario.click(screen.getByRole('checkbox'))

    expect(onToggleTask).toHaveBeenCalledWith(7)
  })

  it('muestra la tarea marcada cuando completed es true', () => {
    render(
      <TaskCard
        task={{ ...tarea, completed: true }}
        onDeleteTask={vi.fn()}
        onToggleTask={vi.fn()}
      />
    )

    expect(screen.getByRole('checkbox')).toBeChecked()
  })
})
