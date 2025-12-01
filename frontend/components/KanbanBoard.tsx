'use client';

import { useEffect, useState } from 'react';
import api from '@/lib/auth';

interface Task {
  _id: string;
  title: string;
  description: string;
  status: string;
  priority: string;
  assignee?: any;
  dueDate?: string;
  order: number;
}

const STATUSES = ['todo', 'in-progress', 'review', 'done'];

export function KanbanBoard({ projectId }: { projectId: string }) {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [draggedTask, setDraggedTask] = useState<Task | null>(null);
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [activeStatus, setActiveStatus] = useState('');

  useEffect(() => {
    fetchTasks();
  }, [projectId]);

  const fetchTasks = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/api/tasks/project/${projectId}`);
      setTasks(response.data.tasks);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to fetch tasks');
    } finally {
      setLoading(false);
    }
  };

  const createTask = async (status: string) => {
    if (!newTaskTitle.trim()) return;

    try {
      const response = await api.post('/api/tasks', {
        projectId,
        title: newTaskTitle,
        status
      });
      setTasks([...tasks, response.data.task]);
      setNewTaskTitle('');
      setActiveStatus('');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to create task');
    }
  };

  const updateTaskStatus = async (taskId: string, newStatus: string) => {
    try {
      const response = await api.put(`/api/tasks/${taskId}`, { status: newStatus });
      setTasks(tasks.map(t => t._id === taskId ? response.data.task : t));
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to update task');
    }
  };

  const deleteTask = async (taskId: string) => {
    try {
      await api.delete(`/api/tasks/${taskId}`);
      setTasks(tasks.filter(t => t._id !== taskId));
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to delete task');
    }
  };

  const handleDragStart = (task: Task) => {
    setDraggedTask(task);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (status: string) => {
    if (draggedTask && draggedTask.status !== status) {
      updateTaskStatus(draggedTask._id, status);
    }
    setDraggedTask(null);
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'bg-red-100 text-red-800 border-red-300';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800 border-yellow-300';
      case 'low':
        return 'bg-green-100 text-green-800 border-green-300';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  if (loading) {
    return <div className="flex justify-center py-8">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[--color-primary]"></div>
    </div>;
  }

  return (
    <div className="space-y-4">
      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {STATUSES.map((status) => (
          <div
            key={status}
            onDragOver={handleDragOver}
            onDrop={() => handleDrop(status)}
            className="bg-[--color-surface] p-4 rounded-lg border border-[--color-border] min-h-96"
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-[--color-foreground] capitalize">
                {status.replace('-', ' ')}
              </h3>
              <span className="text-xs font-medium text-[--color-muted] bg-white px-2 py-1 rounded">
                {tasks.filter(t => t.status === status).length}
              </span>
            </div>

            <div className="space-y-3 mb-4">
              {tasks
                .filter(t => t.status === status)
                .sort((a, b) => a.order - b.order)
                .map((task) => (
                  <div
                    key={task._id}
                    draggable
                    onDragStart={() => handleDragStart(task)}
                    className="bg-white p-3 rounded-lg border border-[--color-border] cursor-move hover:shadow-md transition"
                  >
                    <div className="flex justify-between items-start gap-2 mb-2">
                      <h4 className="font-medium text-[--color-foreground] text-sm flex-1">
                        {task.title}
                      </h4>
                      <button
                        onClick={() => deleteTask(task._id)}
                        className="text-[--color-error] hover:bg-red-50 p-1 rounded text-sm"
                      >
                        ×
                      </button>
                    </div>

                    {task.description && (
                      <p className="text-xs text-[--color-muted] mb-2 line-clamp-2">
                        {task.description}
                      </p>
                    )}

                    <div className="flex items-center justify-between gap-2">
                      <span className={`text-xs px-2 py-1 rounded border ${getPriorityColor(task.priority)}`}>
                        {task.priority}
                      </span>
                      {task.assignee && (
                        <div className="w-6 h-6 bg-[--color-primary] rounded-full flex items-center justify-center text-white text-xs font-bold">
                          {task.assignee.name?.charAt(0).toUpperCase()}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
            </div>

            {activeStatus === status ? (
              <div className="space-y-2">
                <input
                  type="text"
                  value={newTaskTitle}
                  onChange={(e) => setNewTaskTitle(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') createTask(status);
                    if (e.key === 'Escape') {
                      setNewTaskTitle('');
                      setActiveStatus('');
                    }
                  }}
                  autoFocus
                  className="w-full px-3 py-2 border border-[--color-border] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[--color-primary]"
                  placeholder="Add new task..."
                />
                <div className="flex gap-2">
                  <button
                    onClick={() => createTask(status)}
                    className="flex-1 px-3 py-1 bg-[--color-primary] text-white rounded text-sm hover:bg-blue-600 transition"
                  >
                    Add
                  </button>
                  <button
                    onClick={() => {
                      setNewTaskTitle('');
                      setActiveStatus('');
                    }}
                    className="flex-1 px-3 py-1 border border-[--color-border] rounded text-sm hover:bg-[--color-surface]"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <button
                onClick={() => setActiveStatus(status)}
                className="w-full px-3 py-2 border border-dashed border-[--color-border] rounded-lg text-[--color-muted] hover:text-[--color-foreground] hover:border-[--color-primary] transition text-sm"
              >
                + Add task
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
