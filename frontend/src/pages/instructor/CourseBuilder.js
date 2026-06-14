import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../../utils/api';
import toast from 'react-hot-toast';
import { MdAdd, MdDelete, MdEdit, MdSave, MdExpandMore, MdExpandLess, MdVideoLibrary } from 'react-icons/md';

const CourseBuilder = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEdit = !!id;

  const [course, setCourse] = useState({ title: '', description: '', category: '', level: 'beginner', is_published: false });
  const [thumbnail, setThumbnail] = useState(null);
  const [modules, setModules] = useState([]);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(isEdit);
  const [expandedModule, setExpandedModule] = useState(null);

  // Module/lesson modal state
  const [moduleModal, setModuleModal] = useState(false);
  const [moduleForm, setModuleForm] = useState({ title: '', description: '', order_index: 0 });
  const [editingModule, setEditingModule] = useState(null);

  const [lessonModal, setLessonModal] = useState(null); // moduleId
  const [lessonForm, setLessonForm] = useState({ title: '', content: '', video_duration: '', order_index: 0, is_preview: false });
  const [lessonVideo, setLessonVideo] = useState(null);
  const [editingLesson, setEditingLesson] = useState(null);

  useEffect(() => {
    if (isEdit) {
      api.get(`/courses/${id}`).then(res => {
        const c = res.data;
        setCourse({ title: c.title, description: c.description, category: c.category || '', level: c.level, is_published: c.is_published });
        setModules(c.modules || []);
        setLoading(false);
      }).catch(() => { toast.error('Course not found'); navigate('/instructor/courses'); });
    }
  }, [id]);

  const saveCourse = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const fd = new FormData();
      Object.entries(course).forEach(([k, v]) => fd.append(k, v));
      if (thumbnail) fd.append('thumbnail', thumbnail);

      if (isEdit) {
        await api.put(`/courses/${id}`, fd, { headers: { 'Content-Type': 'multipart/form-data' } });
        toast.success('Course updated!');
      } else {
        const res = await api.post('/courses', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
        toast.success('Course created!');
        navigate(`/instructor/courses/${res.data.courseId}/edit`);
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save course');
    } finally {
      setSaving(false);
    }
  };

  // Module CRUD
  const saveModule = async () => {
    try {
      if (editingModule) {
        await api.put(`/modules/${editingModule}`, moduleForm);
        toast.success('Module updated');
      } else {
        await api.post(`/courses/${id}/modules`, moduleForm);
        toast.success('Module created');
      }
      const res = await api.get(`/courses/${id}`);
      setModules(res.data.modules || []);
      setModuleModal(false);
      setModuleForm({ title: '', description: '', order_index: 0 });
      setEditingModule(null);
    } catch { toast.error('Failed to save module'); }
  };

  const deleteModule = async (moduleId) => {
    if (!window.confirm('Delete this module and all its lessons?')) return;
    try {
      await api.delete(`/modules/${moduleId}`);
      setModules(prev => prev.filter(m => m.id !== moduleId));
      toast.success('Module deleted');
    } catch { toast.error('Failed to delete module'); }
  };

  // Lesson CRUD
  const saveLesson = async () => {
    try {
      const fd = new FormData();
      // Explicitly append each field to avoid type-coercion issues.
      // FormData.append converts all values to strings, so a JS boolean `false`
      // becomes the string "false". We convert is_preview to "1"/"0" so the
      // server always receives a valid integer string for the MySQL BOOLEAN column.
      fd.append('title', lessonForm.title);
      fd.append('content', lessonForm.content);
      fd.append('video_duration', lessonForm.video_duration);
      fd.append('order_index', lessonForm.order_index);
      fd.append('is_preview', lessonForm.is_preview ? '1' : '0');
      if (lessonVideo) fd.append('video', lessonVideo);

      if (editingLesson) {
        await api.put(`/lessons/${editingLesson}`, fd, { headers: { 'Content-Type': 'multipart/form-data' } });
        toast.success('Lesson updated');
      } else {
        await api.post(`/modules/${lessonModal}/lessons`, fd, { headers: { 'Content-Type': 'multipart/form-data' } });
        toast.success('Lesson created');
      }
      const res = await api.get(`/courses/${id}`);
      setModules(res.data.modules || []);
      setLessonModal(null);
      setLessonForm({ title: '', content: '', video_duration: '', order_index: 0, is_preview: false });
      setLessonVideo(null);
      setEditingLesson(null);
    } catch (err) {
      console.error('saveLesson error:', err.response?.data || err.message);
      toast.error(err.response?.data?.message || 'Failed to save lesson');
    }
  };

  const deleteLesson = async (lessonId) => {
    if (!window.confirm('Delete this lesson?')) return;
    try {
      await api.delete(`/lessons/${lessonId}`);
      const res = await api.get(`/courses/${id}`);
      setModules(res.data.modules || []);
      toast.success('Lesson deleted');
    } catch { toast.error('Failed to delete lesson'); }
  };

  if (loading) return <div className="loading-container"><div className="spinner" /></div>;

  return (
    <div>
      <div className="page-header">
        <h1>{isEdit ? 'Edit Course' : 'Create New Course'}</h1>
        <p>{isEdit ? 'Update course details, modules, and lessons' : 'Fill in the details to create your course'}</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 380px', gap: 24, alignItems: 'start' }}>
        {/* Left: Course form */}
        <form onSubmit={saveCourse}>
          <div className="card" style={{ marginBottom: 24 }}>
            <h2 style={{ fontSize: 17, fontWeight: 700, marginBottom: 20 }}>Course Details</h2>
            <div className="form-group">
              <label>Course Title *</label>
              <input className="form-control" placeholder="e.g. Java Full Stack Development"
                value={course.title} onChange={e => setCourse({ ...course, title: e.target.value })} required />
            </div>
            <div className="form-group">
              <label>Description</label>
              <textarea className="form-control" placeholder="What will students learn?"
                rows={4} value={course.description} onChange={e => setCourse({ ...course, description: e.target.value })} />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              <div className="form-group">
                <label>Category</label>
                <input className="form-control" placeholder="e.g. Programming"
                  value={course.category} onChange={e => setCourse({ ...course, category: e.target.value })} />
              </div>
              <div className="form-group">
                <label>Level</label>
                <select className="form-control" value={course.level} onChange={e => setCourse({ ...course, level: e.target.value })}>
                  <option value="beginner">Beginner</option>
                  <option value="intermediate">Intermediate</option>
                  <option value="advanced">Advanced</option>
                </select>
              </div>
            </div>
            <div className="form-group">
              <label>Thumbnail Image</label>
              <input type="file" accept="image/*" className="form-control"
                onChange={e => setThumbnail(e.target.files[0])} />
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <input type="checkbox" id="publish" checked={course.is_published}
                onChange={e => setCourse({ ...course, is_published: e.target.checked })}
                style={{ width: 16, height: 16, accentColor: 'var(--accent)' }} />
              <label htmlFor="publish" style={{ color: 'var(--text-secondary)', fontSize: 14, marginBottom: 0, cursor: 'pointer' }}>
                Publish this course (make it visible to students)
              </label>
            </div>
          </div>
          <button type="submit" className="btn btn-primary" disabled={saving}>
            <MdSave /> {saving ? 'Saving...' : (isEdit ? 'Save Changes' : 'Create Course')}
          </button>
        </form>

        {/* Right: Modules (only in edit mode) */}
        {isEdit && (
          <div>
            <div className="card">
              <div className="flex-between" style={{ marginBottom: 16 }}>
                <h2 style={{ fontSize: 17, fontWeight: 700 }}>Modules & Lessons</h2>
                <button className="btn btn-primary btn-sm" onClick={() => { setModuleModal(true); setEditingModule(null); setModuleForm({ title: '', description: '', order_index: modules.length }); }}>
                  <MdAdd /> Module
                </button>
              </div>

              {modules.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '32px 0', color: 'var(--text-secondary)' }}>
                  <div style={{ fontSize: 40, marginBottom: 8 }}>📦</div>
                  <p>No modules yet. Add your first module.</p>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {modules.map((mod, i) => (
                    <div key={mod.id} style={{ border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', overflow: 'hidden' }}>
                      <div
                        onClick={() => setExpandedModule(expandedModule === mod.id ? null : mod.id)}
                        style={{
                          display: 'flex', alignItems: 'center', gap: 10, padding: '12px 14px',
                          cursor: 'pointer', background: 'var(--bg-primary)',
                        }}
                      >
                        <span style={{ fontSize: 13, color: 'var(--text-muted)', fontWeight: 700, minWidth: 24 }}>
                          {String(i + 1).padStart(2, '0')}
                        </span>
                        <span style={{ flex: 1, fontWeight: 600, fontSize: 14 }}>{mod.title}</span>
                        <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{(mod.lessons || []).length} lessons</span>
                        <button className="btn btn-sm" style={{ padding: '3px 8px', background: 'none', color: 'var(--text-secondary)' }}
                          onClick={e => { e.stopPropagation(); setEditingModule(mod.id); setModuleForm({ title: mod.title, description: mod.description || '', order_index: mod.order_index }); setModuleModal(true); }}>
                          <MdEdit />
                        </button>
                        <button className="btn btn-sm" style={{ padding: '3px 8px', background: 'none', color: 'var(--danger)' }}
                          onClick={e => { e.stopPropagation(); deleteModule(mod.id); }}>
                          <MdDelete />
                        </button>
                        {expandedModule === mod.id ? <MdExpandLess /> : <MdExpandMore />}
                      </div>

                      {expandedModule === mod.id && (
                        <div style={{ padding: '0 14px 12px', background: 'var(--bg-secondary)' }}>
                          {(mod.lessons || []).map((lesson, j) => (
                            <div key={lesson.id} style={{
                              display: 'flex', alignItems: 'center', gap: 8,
                              padding: '8px 10px', marginTop: 6,
                              background: 'var(--bg-primary)', borderRadius: 6, fontSize: 13,
                            }}>
                              <MdVideoLibrary style={{ color: 'var(--accent)', flexShrink: 0 }} />
                              <span style={{ flex: 1 }}>{lesson.title}</span>
                              <button style={{ background: 'none', color: 'var(--text-secondary)', padding: '2px 4px', border: 'none', cursor: 'pointer' }}
                                onClick={() => { setEditingLesson(lesson.id); setLessonForm({ title: lesson.title, content: lesson.content || '', video_duration: lesson.video_duration || '', order_index: lesson.order_index, is_preview: lesson.is_preview }); setLessonModal(mod.id); }}>
                                <MdEdit style={{ fontSize: 15 }} />
                              </button>
                              <button style={{ background: 'none', color: 'var(--danger)', padding: '2px 4px', border: 'none', cursor: 'pointer' }}
                                onClick={() => deleteLesson(lesson.id)}>
                                <MdDelete style={{ fontSize: 15 }} />
                              </button>
                            </div>
                          ))}
                          <button className="btn btn-secondary btn-sm" style={{ marginTop: 8, width: '100%', justifyContent: 'center' }}
                            onClick={() => { setLessonModal(mod.id); setEditingLesson(null); setLessonForm({ title: '', content: '', video_duration: '', order_index: (mod.lessons || []).length, is_preview: false }); setLessonVideo(null); }}>
                            <MdAdd /> Add Lesson
                          </button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Module Modal */}
      {moduleModal && (
        <div className="modal-overlay" onClick={() => setModuleModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{editingModule ? 'Edit Module' : 'Add Module'}</h2>
              <button className="modal-close" onClick={() => setModuleModal(false)}>×</button>
            </div>
            <div className="form-group">
              <label>Module Title *</label>
              <input className="form-control" placeholder="e.g. Introduction to Java"
                value={moduleForm.title} onChange={e => setModuleForm({ ...moduleForm, title: e.target.value })} />
            </div>
            <div className="form-group">
              <label>Description</label>
              <textarea className="form-control" placeholder="Module overview..."
                rows={3} value={moduleForm.description} onChange={e => setModuleForm({ ...moduleForm, description: e.target.value })} />
            </div>
            <div className="form-group">
              <label>Order</label>
              <input type="number" className="form-control" value={moduleForm.order_index}
                onChange={e => setModuleForm({ ...moduleForm, order_index: parseInt(e.target.value) })} />
            </div>
            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
              <button className="btn btn-secondary" onClick={() => setModuleModal(false)}>Cancel</button>
              <button className="btn btn-primary" onClick={saveModule}>Save Module</button>
            </div>
          </div>
        </div>
      )}

      {/* Lesson Modal */}
      {lessonModal && (
        <div className="modal-overlay" onClick={() => setLessonModal(null)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{editingLesson ? 'Edit Lesson' : 'Add Lesson'}</h2>
              <button className="modal-close" onClick={() => setLessonModal(null)}>×</button>
            </div>
            <div className="form-group">
              <label>Lesson Title *</label>
              <input className="form-control" placeholder="e.g. Variables and Data Types"
                value={lessonForm.title} onChange={e => setLessonForm({ ...lessonForm, title: e.target.value })} />
            </div>
            <div className="form-group">
              <label>Content / Description</label>
              <textarea className="form-control" rows={3} placeholder="Lesson notes..."
                value={lessonForm.content} onChange={e => setLessonForm({ ...lessonForm, content: e.target.value })} />
            </div>
            <div className="form-group">
              <label>Video File</label>
              <input type="file" accept="video/*" className="form-control"
                onChange={e => setLessonVideo(e.target.files[0])} />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div className="form-group">
                <label>Duration (seconds)</label>
                <input type="number" className="form-control" placeholder="e.g. 600"
                  value={lessonForm.video_duration} onChange={e => setLessonForm({ ...lessonForm, video_duration: e.target.value })} />
              </div>
              <div className="form-group">
                <label>Order</label>
                <input type="number" className="form-control"
                  value={lessonForm.order_index} onChange={e => setLessonForm({ ...lessonForm, order_index: parseInt(e.target.value) })} />
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 20 }}>
              <input type="checkbox" id="preview" checked={lessonForm.is_preview}
                onChange={e => setLessonForm({ ...lessonForm, is_preview: e.target.checked })}
                style={{ width: 15, height: 15, accentColor: 'var(--accent)' }} />
              <label htmlFor="preview" style={{ fontSize: 14, color: 'var(--text-secondary)', marginBottom: 0 }}>
                Mark as free preview
              </label>
            </div>
            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
              <button className="btn btn-secondary" onClick={() => setLessonModal(null)}>Cancel</button>
              <button className="btn btn-primary" onClick={saveLesson}>Save Lesson</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CourseBuilder;
