import { render, screen } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import TaskList from './TaskList'

// Una tarea de ejemplo reutilizable
const tarea = { id: 1, text: 'Comprar pan', priority: 'alta', completed: false }

describe('TaskList', () => {
  it('muestra el mensaje de lista vacia cuando no hay tareas', () => {
    render(<TaskList tasks={[]} onDeleteTask={vi.fn()} onToggleTask={vi.fn()} />)

    // Esto tambien ejecuta el componente EmptyState
    expect(
      screen.getByText('No hay tareas todavía. Agrega una nueva tarea.')
    ).toBeInTheDocument()
  })

  it('muestra una tarjeta por cada tarea recibida', () => {
    render(
      <TaskList
        tasks={[tarea, { ...tarea, id: 2, text: 'Pagar luz' }]}
        onDeleteTask={vi.fn()}
        onToggleTask={vi.fn()}
      />
    )

    expect(screen.getByText('Comprar pan')).toBeInTheDocument()
    expect(screen.getByText('Pagar luz')).toBeInTheDocument()
    expect(screen.getAllByRole('listitem')).toHaveLength(2)
  })
})
