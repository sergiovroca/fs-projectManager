import { describe, it, expect } from 'vitest'
import { contarCompletadas, contarPendientes } from './tasks'
import type { Task } from './tasks'

const tarea = (id: number, completed: boolean): Task => ({
  id,
  text: `Tarea ${id}`,
  priority: 'normal',
  completed,
})

describe('contarPendientes', () => {
  it('cuenta solo las tareas no completadas', () => {
    // Arrange
    const tasks = [tarea(1, true), tarea(2, false), tarea(3, false)]
    // Act
    const resultado = contarPendientes(tasks)
    // Assert
    expect(resultado).toBe(2)
  })

  it('devuelve 0 cuando la lista esta vacia', () => {
    expect(contarPendientes([])).toBe(0)
  })
})

describe('contarCompletadas', () => {
  it('cuenta solo las tareas completadas', () => {
    expect(contarCompletadas([tarea(1, true), tarea(2, false)])).toBe(1)
  })

  it('devuelve 0 cuando la lista esta vacia', () => {
    expect(contarCompletadas([])).toBe(0)
  })
})
