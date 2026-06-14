import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import api from '../../utils/api';

const StudentAnalytics = () => {
  const { id: courseId } = useParams();
  const [students, setStudents] = useState([]);
  const [course, setCourse] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api.get(`/courses/${courseId}`),
      api.get(`/courses/${courseId}/analytics`),
    ]).then(([cRes, sRes]) => {
      setCourse(cRes.data);
      setStudents(sRes.data);
    }).finally(() => setLoading(false));
  }, [courseId]);

  if (loading) return <div className="loading-container"><div className="spinner" /></div>;

  const chartData = students.map(s => ({
    name: s.name.split(' ')[0],
    progress: s.total_lessons > 0 ? Math.round((s.completed_lessons / s.total_lessons) * 100) : 0,
    grade: Math.round(s.avg_grade || 0),
  }));

  const avgProgress = students.length ? Math.round(students.reduce((sum, s) => sum + (s.total_lessons > 0 ? (s.completed_lessons / s.total_lessons) * 100 : 0), 0) / students.length) : 0;
  const avgGrade = students.length ? Math.round(students.reduce((sum, s) => sum + (s.avg_grade || 0), 0) / students.length) : 0;

  return (
    <div>
      <div className="page-header">
        <h1>Student Analytics</h1>
        <p style={{ color: 'var(--accent)' }}>{course?.title}</p>
      </div>

      {/* Summary stats */}
      <div className="grid-4" style={{ marginBottom: 32 }}>
        {[
          { label: 'Total Students', value: students.length, icon: '👥' },
          { label: 'Avg. Progress', value: `${avgProgress}%`, icon: '📈' },
          { label: 'Avg. Grade', value: `${avgGrade}%`, icon: '🏆' },
          { label: 'Total Lessons', value: students[0]?.total_lessons || 0, icon: '📚' },
        ].map(s => (
          <div key={s.label} className="stat-card">
            <div className="stat-icon" style={{ fontSize: 24 }}>{s.icon}</div>
            <div className="stat-info">
              <h3>{s.value}</h3>
              <p>{s.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Charts */}
      {chartData.length > 0 && (
        <div className="grid-2" style={{ marginBottom: 32 }}>
          <div className="card">
            <h3 style={{ fontWeight: 700, marginBottom: 20 }}>Video Progress by Student</h3>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                <XAxis dataKey="name" stroke="#94a3b8" fontSize={12} />
                <YAxis stroke="#94a3b8" fontSize={12} domain={[0, 100]} unit="%" />
                <Tooltip contentStyle={{ background: '#1e293b', border: '1px solid #334155', color: '#f1f5f9' }} />
                <Bar dataKey="progress" fill="#6366f1" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="card">
            <h3 style={{ fontWeight: 700, marginBottom: 20 }}>Average Grade by Student</h3>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                <XAxis dataKey="name" stroke="#94a3b8" fontSize={12} />
                <YAxis stroke="#94a3b8" fontSize={12} domain={[0, 100]} unit="%" />
                <Tooltip contentStyle={{ background: '#1e293b', border: '1px solid #334155', color: '#f1f5f9' }} />
                <Bar dataKey="grade" fill="#22c55e" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Student table */}
      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--border)' }}>
          <h3 style={{ fontWeight: 700 }}>Student Details</h3>
        </div>
        {students.length === 0 ? (
          <div className="empty-state">
            <div style={{ fontSize: 48 }}>👥</div>
            <h3>No students enrolled</h3>
          </div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: 'var(--bg-primary)' }}>
                {['Student', 'Enrolled', 'Lessons Completed', 'Assignments Submitted', 'Avg Grade', 'Progress'].map(h => (
                  <th key={h} style={{ padding: '12px 16px', textAlign: 'left', fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)', borderBottom: '1px solid var(--border)' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {students.map(s => {
                const progress = s.total_lessons > 0 ? Math.round((s.completed_lessons / s.total_lessons) * 100) : 0;
                return (
                  <tr key={s.id} style={{ borderBottom: '1px solid var(--border)' }}
                    onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-hover)'}
                    onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                    <td style={{ padding: '14px 16px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'var(--accent-light)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--accent)', fontWeight: 700, fontSize: 13 }}>
                          {s.name[0]}
                        </div>
                        <div>
                          <div style={{ fontWeight: 600, fontSize: 14 }}>{s.name}</div>
                          <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{s.email}</div>
                        </div>
                      </div>
                    </td>
                    <td style={{ padding: '14px 16px', fontSize: 13, color: 'var(--text-secondary)' }}>
                      {new Date(s.enrolled_at).toLocaleDateString()}
                    </td>
                    <td style={{ padding: '14px 16px', fontSize: 14 }}>
                      {s.completed_lessons}/{s.total_lessons}
                    </td>
                    <td style={{ padding: '14px 16px', fontSize: 14 }}>
                      {s.submitted_assignments}
                    </td>
                    <td style={{ padding: '14px 16px' }}>
                      {s.avg_grade !== null
                        ? <span className="badge badge-success">{Math.round(s.avg_grade)}%</span>
                        : <span style={{ color: 'var(--text-muted)', fontSize: 13 }}>N/A</span>}
                    </td>
                    <td style={{ padding: '14px 16px', minWidth: 140 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <div className="progress-bar" style={{ flex: 1 }}>
                          <div className="progress-fill" style={{ width: `${progress}%` }} />
                        </div>
                        <span style={{ fontSize: 12, color: 'var(--text-secondary)', minWidth: 34 }}>{progress}%</span>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};

export default StudentAnalytics;
