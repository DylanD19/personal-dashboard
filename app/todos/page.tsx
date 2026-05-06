'use client'

import { useState, useEffect } from 'react'
import { CheckSquare2, Plus, Trash2, Calendar, AlertCircle, ChevronDown, CheckCircle2, Circle } from 'lucide-react'
import { format } from 'date-fns'

type Priority = 'LOW' | 'MEDIUM' | 'HIGH'

type Todo = {
  id: string
  title: string
  completed: boolean
  priority: Priority
  dueDate: string | null
  createdAt: string
}

const PRIORITY_CONFIG: Record<Priority, { label: string; color: string; dot: string }> = {
  HIGH:   { label: 'High',   color: 'text-red-400',   dot: 'bg-red-400' },
  MEDIUM: { label: 'Medium', color: 'text-amber-400', dot: 'bg-amber-400' },
  LOW:    { label: 'Low',    color: 'text-zinc-500',  dot: 'bg-zinc-500' },
}

export default function TodosPage() {
  const [todos, setTodos] = useState<Todo[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'all' | 'active' | 'completed' | Priority>('active')
  const [title, setTitle] = useState('')
  const [priority, setPriority] = useState<Priority>('MEDIUM')
  const [dueDate, setDueDate] = useState('')
  const [adding, setAdding] = useState(false)

  useEffect(() => {
    fetch('/api/todos')
      .then(r => r.json())
      .then(data => { setTodos(data); setLoading(false) })
      .catch(() => setLoading(false))
  }, [])

  const addTodo = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim()) return
    setAdding(true)
    const res = await fetch('/api/todos', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: title.trim(), priority, dueDate: dueDate || null }),
    })
    if (res.ok) {
      const todo = await res.json()
      setTodos(prev => [todo, ...prev])
      setTitle('')
      setDueDate('')
    }
    setAdding(false)
  }

  const toggleTodo = async (id: string, completed: boolean) => {
    setTodos(prev => prev.map(t => t.id === id ? { ...t, completed: !completed } : t))
    await fetch(`/api/todos/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ completed: !completed }),
    })
  }

  const deleteTodo = async (id: string) => {
    setTodos(prev => prev.filter(t => t.id !== id))
    await fetch(`/api/todos/${id}`, { method: 'DELETE' })
  }

  const filtered = todos.filter(t => {
    if (filter === 'active') return !t.completed
    if (filter === 'completed') return t.completed
    if (filter === 'HIGH' || filter === 'MEDIUM' || filter === 'LOW') return t.priority === filter && !t.completed
    return true
  })

  const total = todos.length
  const completed = todos.filter(t => t.completed).length
  const high = todos.filter(t => t.priority === 'HIGH' && !t.completed).length

  const filters: { key: typeof filter; label: string }[] = [
    { key: 'active', label: 'Active' },
    { key: 'all', label: 'All' },
    { key: 'HIGH', label: 'High Priority' },
    { key: 'MEDIUM', label: 'Medium' },
    { key: 'LOW', label: 'Low' },
    { key: 'completed', label: 'Completed' },
  ]

  return (
    <div className="p-6 space-y-6 max-w-[900px]">
      {/* Header */}
      <div className="flex items-center gap-3 pt-2">
        <div className="w-9 h-9 rounded-xl bg-pink-500/10 border border-pink-500/20 flex items-center justify-center">
          <CheckSquare2 size={18} className="text-pink-400" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-zinc-100">To-Do</h1>
          <p className="text-xs text-zinc-500 mt-0.5">{total - completed} pending · {completed} done</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4">
          <p className="text-xs text-zinc-500 mb-1">Total</p>
          <p className="text-2xl font-bold text-zinc-100">{total}</p>
        </div>
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4">
          <p className="text-xs text-zinc-500 mb-1">Completed</p>
          <p className="text-2xl font-bold text-emerald-400">{completed}</p>
        </div>
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4">
          <p className="text-xs text-zinc-500 mb-1">High Priority</p>
          <p className={`text-2xl font-bold ${high > 0 ? 'text-red-400' : 'text-zinc-400'}`}>{high}</p>
        </div>
      </div>

      {/* Add Form */}
      <form onSubmit={addTodo} className="bg-zinc-900 border border-zinc-800 rounded-xl p-4">
        <div className="flex gap-3">
          <div className="flex-1">
            <input
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder="Add a new task..."
              className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2.5 text-sm text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-violet-500 transition-colors"
            />
          </div>
          <div className="relative">
            <select
              value={priority}
              onChange={e => setPriority(e.target.value as Priority)}
              className="appearance-none bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2.5 pr-7 text-sm text-zinc-300 focus:outline-none focus:border-violet-500 cursor-pointer"
            >
              <option value="HIGH">🔴 High</option>
              <option value="MEDIUM">🟡 Medium</option>
              <option value="LOW">⚪ Low</option>
            </select>
            <ChevronDown size={12} className="absolute right-2 top-3.5 text-zinc-500 pointer-events-none" />
          </div>
          <input
            type="date"
            value={dueDate}
            onChange={e => setDueDate(e.target.value)}
            className="bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2.5 text-sm text-zinc-300 focus:outline-none focus:border-violet-500 transition-colors"
          />
          <button
            type="submit"
            disabled={adding || !title.trim()}
            className="flex items-center gap-2 px-4 py-2.5 bg-violet-600 hover:bg-violet-500 disabled:bg-zinc-700 disabled:text-zinc-500 text-white text-sm font-medium rounded-lg transition-colors"
          >
            <Plus size={15} />
            Add
          </button>
        </div>
      </form>

      {/* Filter Tabs */}
      <div className="flex gap-1 flex-wrap">
        {filters.map(({ key, label }) => (
          <button
            key={key}
            onClick={() => setFilter(key)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
              filter === key
                ? 'bg-violet-600/20 text-violet-400 border border-violet-500/30'
                : 'text-zinc-500 hover:text-zinc-300 bg-zinc-900 border border-zinc-800'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Todo List */}
      <div className="space-y-2">
        {loading ? (
          Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 animate-pulse">
              <div className="h-4 bg-zinc-800 rounded w-3/4" />
            </div>
          ))
        ) : filtered.length === 0 ? (
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-10 text-center">
            <CheckCircle2 size={32} className="text-zinc-700 mx-auto mb-3" />
            <p className="text-sm text-zinc-400">
              {filter === 'active' ? 'All caught up! Nothing pending.' : 'No tasks here.'}
            </p>
          </div>
        ) : (
          filtered.map(todo => {
            const p = PRIORITY_CONFIG[todo.priority]
            const isOverdue = todo.dueDate && !todo.completed && new Date(todo.dueDate) < new Date()
            return (
              <div
                key={todo.id}
                className={`flex items-center gap-3 bg-zinc-900 border rounded-xl px-4 py-3.5 group transition-colors hover:border-zinc-700 ${
                  todo.completed ? 'border-zinc-800/50 opacity-60' : 'border-zinc-800'
                }`}
              >
                <button
                  onClick={() => toggleTodo(todo.id, todo.completed)}
                  className="flex-shrink-0 text-zinc-600 hover:text-violet-400 transition-colors"
                >
                  {todo.completed ? (
                    <CheckCircle2 size={18} className="text-emerald-500" />
                  ) : (
                    <Circle size={18} />
                  )}
                </button>

                <div className="flex-1 min-w-0">
                  <p className={`text-sm font-medium ${todo.completed ? 'line-through text-zinc-500' : 'text-zinc-200'}`}>
                    {todo.title}
                  </p>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className={`text-[10px] font-semibold flex items-center gap-1 ${p.color}`}>
                      <span className={`w-1.5 h-1.5 rounded-full inline-block ${p.dot}`} />
                      {p.label}
                    </span>
                    {todo.dueDate && (
                      <span className={`text-[10px] flex items-center gap-1 ${isOverdue ? 'text-red-400' : 'text-zinc-500'}`}>
                        {isOverdue && <AlertCircle size={10} />}
                        <Calendar size={10} />
                        {format(new Date(todo.dueDate), 'MMM d')}
                      </span>
                    )}
                  </div>
                </div>

                <button
                  onClick={() => deleteTodo(todo.id)}
                  className="flex-shrink-0 text-zinc-700 hover:text-red-400 transition-colors opacity-0 group-hover:opacity-100"
                >
                  <Trash2 size={15} />
                </button>
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}
