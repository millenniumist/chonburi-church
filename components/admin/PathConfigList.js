'use client';

import { useState } from 'react';
import { addPath, togglePath, deletePath } from '@/app/(site)/admin/(protected)/config/paths/actions';
import { useRouter } from 'next/navigation';

export default function PathConfigList({ paths, availablePaths = [] }) {
  const [isAdding, setIsAdding] = useState(false);
  const [newPath, setNewPath] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleAdd(e) {
    e.preventDefault();
    setLoading(true);
    
    try {
      const formData = new FormData();
      formData.append('path', newPath);
      
      const result = await addPath(formData);
      if (result.error) {
        alert(result.error);
      } else {
        setNewPath('');
        setIsAdding(false);
      }
    } catch (error) {
      alert('An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  }

  async function handleToggle(id, currentStatus) {
    const result = await togglePath(id, !currentStatus);
    if (result.error) {
      alert(result.error);
    }
  }

  async function handleDelete(id) {
    if (!confirm('Are you sure you want to delete this configuration? The path will be enabled by default.')) {
      return;
    }
    
    const result = await deletePath(id);
    if (result.error) {
      alert(result.error);
    }
  }

  // Filter out paths that are already configured
  const unconfiguredPaths = availablePaths.filter(
    path => !paths.some(p => p.path === path)
  );

  return (
    <div className="space-y-6">
      <div className="flex justify-end">
        <button
          onClick={() => setIsAdding(!isAdding)}
          disabled={unconfiguredPaths.length === 0 && !isAdding}
          className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isAdding ? 'Cancel' : '+ Add Path Rule'}
        </button>
      </div>

      {isAdding && (
        <form onSubmit={handleAdd} className="bg-slate-50 p-4 rounded-lg border border-slate-200">
          <div className="flex gap-4">
            <select
              value={newPath}
              onChange={(e) => setNewPath(e.target.value)}
              className="flex-1 px-3 py-2 border rounded-md"
              required
            >
              <option value="">Select a path...</option>
              {unconfiguredPaths.map((path) => (
                <option key={path} value={path}>
                  {path}
                </option>
              ))}
            </select>
            <button
              type="submit"
              disabled={loading || !newPath}
              className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50"
            >
              {loading ? 'Adding...' : 'Save Rule'}
            </button>
          </div>
        </form>
      )}

      <div className="bg-white rounded-lg border border-slate-200 shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-600">
            <thead className="bg-slate-50 text-xs uppercase font-semibold text-slate-500">
              <tr>
                <th className="px-6 py-3">Path</th>
                <th className="px-6 py-3">Status</th>
                <th className="px-6 py-3">Created At</th>
                <th className="px-6 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {paths.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-6 py-8 text-center text-slate-500">
                    No paths configured. All paths are enabled by default.
                  </td>
                </tr>
              ) : (
                paths.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50 transition">
                    <td className="px-6 py-4 font-medium text-slate-900">
                      {item.path}
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          item.isEnabled
                            ? 'bg-green-100 text-green-800'
                            : 'bg-red-100 text-red-800'
                        }`}
                      >
                        {item.isEnabled ? 'Enabled' : 'Disabled'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-slate-500">
                      {new Date(item.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 text-right space-x-2">
                       <button
                        onClick={() => handleToggle(item.id, item.isEnabled)}
                        className={`text-xs font-medium px-3 py-1 rounded transition ${
                            item.isEnabled 
                            ? 'text-red-700 hover:bg-red-50' 
                            : 'text-green-700 hover:bg-green-50'
                        }`}
                      >
                        {item.isEnabled ? 'Disable' : 'Enable'}
                      </button>
                      <button
                        onClick={() => handleDelete(item.id)}
                        className="text-xs font-medium text-slate-400 hover:text-red-600 px-3 py-1 rounded hover:bg-red-50 transition"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
