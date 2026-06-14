import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import api from '../../utils/api';
import toast from 'react-hot-toast';
import { MdGrade, MdPerson, MdOpenInNew } from 'react-icons/md';

const GradeSubmissions = () => {
  const { id: courseId, assignmentId } = useParams();
  const [submissions, setSubmissions] = useState([]);
  const [assignment, setAssignment] = useState(null);
  const [loading, setLoading] = useState(true);
  const [grading, setGrading] = useState({}); // { [subId]: { score, feedback } }
  const [saving, setSaving] = useState(null);

  useEffect(() => {
    Promise.all([
      api.get(`/courses/${courseId}/assignments`),
      api.get(`/assignments/${assignmentId}/submissions`),
    ]).then(([aRes, sRes]) => {
      const asgn = aRes.data.find(a => a.id === parseInt(assignmentId));
      setAssignment(asgn);
      setSubmissions(sRes.data);
      const init = {};
      sRes.data.forEach(s => { init[s.id] = { score: s.score ?? '', feedback: s.feedback ?? '' }; });
      setGrading(init);
    }).finally(() => setLoading(false));
  }, [assignmentId]);

  const handleGrade = async (submissionId) => {
    const g = grading[submissionId];
    if (g.score === '' || g.score === null) return toast.error('Enter a score');
    setSaving(submissionId);
    try {
      await api.put(`/submissions/${submissionId}/grade`, { score: parseInt(g.score), feedback: g.feedback });
      toast.success('Graded successfully');
      setSubmissions(prev => prev.map(s => s.id === submissionId ? { ...s, score: parseInt(g.score), feedback: g.feedback, status: 'graded' } : s));
    } catch { toast.error('Failed to grade'); } finally { setSaving(null); }
  };

  if (loading) return <div className="loading-container"><div className="spinner" /></div>;

  return (
    <div>
      <div className="page-header">
        <h1>Grade Submissions</h1>
        <p style={{ color: 'var(--accent)' }}>{assignment?.title} · Max Score: {assignment?.max_score}</p>
      </div>

      {submissions.length === 0 ? (
        <div className="empty-state">
          <div style={{ fontSize: 64 }}>📭</div>
          <h3>No submissions yet</h3>
          <p>Students haven't submitted this assignment yet</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {submissions.map(sub => (
            <div key={sub.id} className="card">
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
                <div style={{
                  width: 40, height: 40, borderRadius: '50%',
                  background: 'var(--accent-light)', display: 'flex',
                  alignItems: 'center', justifyContent: 'center', color: 'var(--accent)', fontWeight: 700,
                }}>
                  {sub.student_name?.[0]?.toUpperCase()}
                </div>
                <div>
                  <div style={{ fontWeight: 600 }}>{sub.student_name}</div>
                  <div style={{ fontSize: 13, color: 'var(--text-secondary)' }}>{sub.student_email}</div>
                </div>
                <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 10 }}>
                  <span className={`badge ${sub.status === 'graded' ? 'badge-success' : 'badge-warning'}`}>
                    {sub.status === 'graded' ? `Graded: ${sub.score}/${assignment?.max_score}` : 'Pending'}
                  </span>
                  <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                    {new Date(sub.submitted_at).toLocaleString()}
                  </span>
                </div>
              </div>

              {sub.text_content && (
                <div style={{ background: 'var(--bg-primary)', borderRadius: 8, padding: '12px 14px', marginBottom: 14, fontSize: 14, color: 'var(--text-secondary)', lineHeight: 1.7 }}>
                  {sub.text_content}
                </div>
              )}

              {sub.file_url && (
                <a href={`http://localhost:5000${sub.file_url}`} target="_blank" rel="noreferrer"
                  className="btn btn-secondary btn-sm" style={{ marginBottom: 14, display: 'inline-flex' }}>
                  <MdOpenInNew /> View Submitted File
                </a>
              )}

              <div style={{ display: 'grid', gridTemplateColumns: '120px 1fr auto', gap: 12, alignItems: 'end' }}>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label>Score / {assignment?.max_score}</label>
                  <input type="number" className="form-control" min={0} max={assignment?.max_score}
                    value={grading[sub.id]?.score}
                    onChange={e => setGrading(prev => ({ ...prev, [sub.id]: { ...prev[sub.id], score: e.target.value } }))} />
                </div>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label>Feedback</label>
                  <input className="form-control" placeholder="Write feedback for student..."
                    value={grading[sub.id]?.feedback}
                    onChange={e => setGrading(prev => ({ ...prev, [sub.id]: { ...prev[sub.id], feedback: e.target.value } }))} />
                </div>
                <button className="btn btn-primary" style={{ height: 44 }}
                  disabled={saving === sub.id} onClick={() => handleGrade(sub.id)}>
                  <MdGrade /> {saving === sub.id ? 'Saving...' : 'Grade'}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default GradeSubmissions;
