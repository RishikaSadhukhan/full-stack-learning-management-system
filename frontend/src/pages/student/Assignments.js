import React, { useState, useEffect } from 'react';
import api from '../../utils/api';
import toast from 'react-hot-toast';
import { MdAssignment, MdUpload, MdGrade, MdFeedback } from 'react-icons/md';

const Assignments = () => {
  const [courses, setCourses] = useState([]);
  const [allAssignments, setAllAssignments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitModal, setSubmitModal] = useState(null); // assignment object
  const [text, setText] = useState('');
  const [file, setFile] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [activeTab, setActiveTab] = useState('pending');

  useEffect(() => {
    const fetchAll = async () => {
      try {
        const cRes = await api.get('/courses/enrolled');
        setCourses(cRes.data);
        const allA = [];
        for (const course of cRes.data) {
          try {
            const aRes = await api.get(`/courses/${course.id}/assignments`);
            allA.push(...aRes.data.map(a => ({ ...a, course_title: course.title, course_id: course.id })));
          } catch {}
        }
        setAllAssignments(allA);
      } finally { setLoading(false); }
    };
    fetchAll();
  }, []);

  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      const fd = new FormData();
      if (text) fd.append('text_content', text);
      if (file) fd.append('file', file);
      await api.post(`/assignments/${submitModal.id}/submit`, fd, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      toast.success('Assignment submitted!');
      setSubmitModal(null);
      setText('');
      setFile(null);
      // Refresh
      const updated = [];
      for (const course of courses) {
        try {
          const aRes = await api.get(`/courses/${course.id}/assignments`);
          updated.push(...aRes.data.map(a => ({ ...a, course_title: course.title, course_id: course.id })));
        } catch {}
      }
      setAllAssignments(updated);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Submission failed');
    } finally { setSubmitting(false); }
  };

  const pending = allAssignments.filter(a => !a.submission);
  const submitted = allAssignments.filter(a => a.submission);
  const graded = submitted.filter(a => a.submission?.status === 'graded');

  const formatDate = (d) => d ? new Date(d).toLocaleString() : '—';
  const isPast = (d) => d && new Date(d) < new Date();

  const displayed = activeTab === 'pending' ? pending : activeTab === 'submitted' ? submitted.filter(a => a.submission?.status !== 'graded') : graded;

  if (loading) return <div className="loading-container"><div className="spinner" /></div>;

  return (
    <div>
      <div className="page-header">
        <h1>Assignments</h1>
        <p>Track and submit your course assignments</p>
      </div>

      {/* Tabs */}
      <div className="tabs" style={{ maxWidth: 480 }}>
        <button className={`tab ${activeTab === 'pending' ? 'active' : ''}`} onClick={() => setActiveTab('pending')}>
          Pending ({pending.length})
        </button>
        <button className={`tab ${activeTab === 'submitted' ? 'active' : ''}`} onClick={() => setActiveTab('submitted')}>
          Submitted
        </button>
        <button className={`tab ${activeTab === 'graded' ? 'active' : ''}`} onClick={() => setActiveTab('graded')}>
          Graded ({graded.length})
        </button>
      </div>

      {displayed.length === 0 ? (
        <div className="empty-state">
          <div style={{ fontSize: 64 }}>
            {activeTab === 'pending' ? '✅' : activeTab === 'submitted' ? '📤' : '🏆'}
          </div>
          <h3>
            {activeTab === 'pending' ? 'No pending assignments' : activeTab === 'submitted' ? 'No submissions awaiting grading' : 'No graded assignments yet'}
          </h3>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {displayed.map(a => {
            const sub = a.submission;
            const past = isPast(a.due_date);
            return (
              <div key={a.id} className="card">
                <div className="flex-between" style={{ marginBottom: 10 }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
                      <MdAssignment style={{ color: 'var(--accent)', fontSize: 20 }} />
                      <h3 style={{ fontSize: 16, fontWeight: 700 }}>{a.title}</h3>
                      {sub?.status === 'graded' && (
                        <span className="badge badge-success">
                          Graded: {sub.score}/{a.max_score}
                        </span>
                      )}
                      {sub && sub.status !== 'graded' && <span className="badge badge-warning">Submitted</span>}
                      {!sub && past && <span className="badge badge-danger">Overdue</span>}
                      {!sub && !past && <span className="badge badge-primary">Open</span>}
                    </div>
                    <div style={{ fontSize: 13, color: 'var(--accent)', marginBottom: 6 }}>{a.course_title}</div>
                    {a.description && (
                      <p style={{ fontSize: 14, color: 'var(--text-secondary)', marginBottom: 8 }}>{a.description}</p>
                    )}
                    <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>
                      📅 Due: {formatDate(a.due_date)} · 🏆 Max: {a.max_score}
                    </div>
                  </div>

                  <div style={{ marginLeft: 20 }}>
                    {!sub ? (
                      <button className="btn btn-primary" onClick={() => setSubmitModal(a)}>
                        <MdUpload /> Submit
                      </button>
                    ) : sub.status !== 'graded' ? (
                      <button className="btn btn-secondary" onClick={() => { setSubmitModal(a); setText(sub.text_content || ''); }}>
                        Re-submit
                      </button>
                    ) : null}
                  </div>
                </div>

                {/* Graded feedback */}
                {sub?.status === 'graded' && (
                  <div style={{
                    background: 'var(--bg-primary)', borderRadius: 8,
                    padding: '14px 16px', marginTop: 12, borderLeft: '3px solid var(--success)',
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6, color: 'var(--success)', fontWeight: 600, fontSize: 14 }}>
                      <MdFeedback /> Instructor Feedback
                    </div>
                    <p style={{ color: 'var(--text-secondary)', fontSize: 14 }}>
                      {sub.feedback || 'No written feedback provided.'}
                    </p>
                    <div style={{ marginTop: 8, fontSize: 13, color: 'var(--text-muted)' }}>
                      Graded on {formatDate(sub.graded_at)}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Submit Modal */}
      {submitModal && (
        <div className="modal-overlay" onClick={() => setSubmitModal(null)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Submit Assignment</h2>
              <button className="modal-close" onClick={() => setSubmitModal(null)}>×</button>
            </div>
            <div style={{ fontSize: 14, color: 'var(--accent)', marginBottom: 16 }}>{submitModal.title}</div>
            <div className="form-group">
              <label>Your Answer / Notes</label>
              <textarea className="form-control" rows={5} placeholder="Write your answer here..."
                value={text} onChange={e => setText(e.target.value)} />
            </div>
            <div className="form-group">
              <label>Attach File (optional)</label>
              <input type="file" className="form-control" onChange={e => setFile(e.target.files[0])} />
              <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4 }}>
                Supports: PDF, DOC, DOCX, TXT, ZIP (max 500MB)
              </div>
            </div>
            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
              <button className="btn btn-secondary" onClick={() => setSubmitModal(null)}>Cancel</button>
              <button className="btn btn-primary" onClick={handleSubmit} disabled={submitting || (!text && !file)}>
                {submitting ? 'Submitting...' : 'Submit Assignment'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Assignments;
