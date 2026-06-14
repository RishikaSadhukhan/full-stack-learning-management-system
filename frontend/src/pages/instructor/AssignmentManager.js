import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../../utils/api';
import toast from 'react-hot-toast';
import { MdAdd, MdDelete, MdEdit, MdAssignment, MdPeople } from 'react-icons/md';

const AssignmentManager = () => {
  const { id: courseId } = useParams();
  const [assignments, setAssignments] = useState([]);
  const [course, setCourse] = useState(null);
  const [modal, setModal] = useState(false);
  const [form, setForm] = useState({ title: '', description: '', due_date: '', max_score: 100 });
  const [editing, setEditing] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetch = async () => {
    try {
      const [cRes, aRes] = await Promise.all([
        api.get(`/courses/${courseId}`),
        api.get(`/courses/${courseId}/assignments`),
      ]);
      setCourse(cRes.data);
      setAssignments(aRes.data);
    } finally { setLoading(false); }
  };

  useEffect(() => { fetch(); }, [courseId]);

  const openCreate = () => {
    setEditing(null);
    setForm({ title: '', description: '', due_date: '', max_score: 100 });
    setModal(true);
  };

  const openEdit = (a) => {
    setEditing(a.id);
    setForm({
      title: a.title,
      description: a.description || '',
      due_date: a.due_date?.slice(0, 16),
      max_score: a.max_score,
    });
    setModal(true);
  };

  const save = async () => {
    if (!form.title || !form.due_date) return toast.error('Title and due date are required');
    try {
      if (editing) {
        await api.put(`/assignments/${editing}`, form);
        toast.success('Assignment updated');
      } else {
        await api.post(`/courses/${courseId}/assignments`, form);
        toast.success('Assignment created');
      }
      setModal(false);
      fetch();
    } catch { toast.error('Failed to save'); }
  };

  const remove = async (id, title) => {
    if (!window.confirm(`Delete "${title}"?`)) return;
    try {
      await api.delete(`/assignments/${id}`);
      toast.success('Deleted');
      setAssignments(prev => prev.filter(a => a.id !== id));
    } catch { toast.error('Failed to delete'); }
  };

  const formatDate = (d) => d ? new Date(d).toLocaleString() : '—';
  const isPast = (d) => d && new Date(d) < new Date();

  if (loading) return <div className="loading-container"><div className="spinner" /></div>;

  return (
    <div>
      <div className="page-header flex-between">
        <div>
          <h1>Assignments</h1>
          <p style={{ color: 'var(--accent)' }}>{course?.title}</p>
        </div>
        <button className="btn btn-primary" onClick={openCreate}>
          <MdAdd /> New Assignment
        </button>
      </div>

      {assignments.length === 0 ? (
        <div className="empty-state">
          <div style={{ fontSize: 64 }}>📝</div>
          <h3>No assignments yet</h3>
          <p>Create assignments for your students</p>
          <button className="btn btn-primary" style={{ marginTop: 16 }} onClick={openCreate}>
            <MdAdd /> Create Assignment
          </button>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {assignments.map(a => (
            <div key={a.id} className="card" style={{ padding: '20px 24px' }}>
              <div className="flex-between">
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
                    <MdAssignment style={{ color: 'var(--accent)', fontSize: 20 }} />
                    <h3 style={{ fontSize: 16, fontWeight: 700 }}>{a.title}</h3>
                    <span className={`badge ${isPast(a.due_date) ? 'badge-danger' : 'badge-warning'}`}>
                      {isPast(a.due_date) ? 'Closed' : 'Open'}
                    </span>
                  </div>
                  <p style={{ color: 'var(--text-secondary)', fontSize: 14, marginBottom: 10 }}>
                    {a.description || 'No description'}
                  </p>
                  <div style={{ display: 'flex', gap: 20, fontSize: 13, color: 'var(--text-muted)' }}>
                    <span>📅 Due: {formatDate(a.due_date)}</span>
                    <span>🏆 Max Score: {a.max_score}</span>
                    <span><MdPeople style={{ verticalAlign: 'middle' }} /> {a.submission_count || 0} submitted</span>
                    <span>✅ {a.graded_count || 0} graded</span>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 8, flexShrink: 0, marginLeft: 20 }}>
                  <Link
                    to={`/instructor/courses/${courseId}/assignments/${a.id}/submissions`}
                    className="btn btn-secondary btn-sm"
                  >
                    <MdPeople /> Submissions
                  </Link>
                  <button className="btn btn-secondary btn-sm" onClick={() => openEdit(a)}>
                    <MdEdit />
                  </button>
                  <button className="btn btn-danger btn-sm" onClick={() => remove(a.id, a.title)}>
                    <MdDelete />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {modal && (
        <div className="modal-overlay" onClick={() => setModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{editing ? 'Edit Assignment' : 'New Assignment'}</h2>
              <button className="modal-close" onClick={() => setModal(false)}>×</button>
            </div>
            <div className="form-group">
              <label>Title *</label>
              <input className="form-control" placeholder="Assignment title"
                value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} />
            </div>
            <div className="form-group">
              <label>Description</label>
              <textarea className="form-control" rows={4} placeholder="Instructions for students..."
                value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div className="form-group">
                <label>Due Date *</label>
                <input type="datetime-local" className="form-control"
                  value={form.due_date} onChange={e => setForm({ ...form, due_date: e.target.value })} />
              </div>
              <div className="form-group">
                <label>Max Score</label>
                <input type="number" className="form-control"
                  value={form.max_score} onChange={e => setForm({ ...form, max_score: parseInt(e.target.value) })} />
              </div>
            </div>
            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
              <button className="btn btn-secondary" onClick={() => setModal(false)}>Cancel</button>
              <button className="btn btn-primary" onClick={save}>Save Assignment</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AssignmentManager;
