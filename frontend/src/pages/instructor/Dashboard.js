import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import api from '../../utils/api';
import toast from 'react-hot-toast';
import {
  MdMenuBook, MdPeople, MdAssignment, MdAdd, MdArrowForward,
  MdCardMembership, MdCheckCircle, MdVerified,
} from 'react-icons/md';

const InstructorDashboard = () => {
  const { user } = useAuth();
  const [courses, setCourses] = useState([]);
  const [completions, setCompletions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [completionsLoading, setCompletionsLoading] = useState(true);
  const [issuingCert, setIssuingCert] = useState(null); // "courseId-studentId"

  useEffect(() => {
    api.get('/courses/my-courses').then(res => {
      setCourses(res.data);
      setLoading(false);
    }).catch(() => setLoading(false));

    api.get('/instructor/completions').then(res => {
      setCompletions(res.data);
      setCompletionsLoading(false);
    }).catch(() => setCompletionsLoading(false));
  }, []);

  const handleIssueCertificate = async (courseId, studentId, key) => {
    setIssuingCert(key);
    try {
      await api.post(`/instructor/courses/${courseId}/students/${studentId}/certificate`);
      toast.success('Certificate issued! Student has been notified.');
      // Mark as issued in local state immediately
      setCompletions(prev =>
        prev.map(c =>
          c.course_id === courseId && c.student_id === studentId
            ? { ...c, certificate_id: 'ISSUED', cert_issued_at: new Date().toISOString() }
            : c
        )
      );
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to issue certificate');
    } finally {
      setIssuingCert(null);
    }
  };

  const totalStudents = courses.reduce((sum, c) => sum + (c.student_count || 0), 0);
  const published = courses.filter(c => c.is_published).length;
  const pendingCerts = completions.filter(c => !c.certificate_id).length;

  const stats = [
    { icon: <MdMenuBook />, label: 'Total Courses', value: courses.length, color: '#6366f1' },
    { icon: <MdPeople />, label: 'Total Students', value: totalStudents, color: '#22c55e' },
    { icon: <MdAssignment />, label: 'Published', value: published, color: '#f59e0b' },
    { icon: <MdCardMembership />, label: 'Pending Certs', value: loading ? '—' : pendingCerts, color: '#ec4899' },
  ];

  // Group completions by course for display
  const completionsByCourse = completions.reduce((acc, c) => {
    const key = c.course_id;
    if (!acc[key]) acc[key] = { title: c.course_title, students: [] };
    acc[key].students.push(c);
    return acc;
  }, {});

  return (
    <div>
      <div className="page-header flex-between">
        <div>
          <h1>Welcome back, {user?.name?.split(' ')[0]}! 👋</h1>
          <p>Here's what's happening with your courses today.</p>
        </div>
        <Link to="/instructor/courses/new" className="btn btn-primary">
          <MdAdd /> New Course
        </Link>
      </div>

      {/* Stats */}
      <div className="grid-4" style={{ marginBottom: 32 }}>
        {stats.map((s) => (
          <div className="stat-card" key={s.label}>
            <div className="stat-icon" style={{ color: s.color }}>{s.icon}</div>
            <div className="stat-info">
              <h3>{loading ? '—' : s.value}</h3>
              <p>{s.label}</p>
            </div>
          </div>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24, alignItems: 'start' }}>
        {/* Recent Courses */}
        <div className="card">
          <div className="flex-between" style={{ marginBottom: 20 }}>
            <h2 style={{ fontSize: 18, fontWeight: 700 }}>Your Courses</h2>
            <Link to="/instructor/courses" className="btn btn-secondary btn-sm">
              View All <MdArrowForward />
            </Link>
          </div>

          {loading ? (
            <div className="loading-container"><div className="spinner" /></div>
          ) : courses.length === 0 ? (
            <div className="empty-state">
              <div style={{ fontSize: 48 }}>📚</div>
              <h3>No courses yet</h3>
              <p>Create your first course to get started</p>
              <Link to="/instructor/courses/new" className="btn btn-primary" style={{ marginTop: 16 }}>
                <MdAdd /> Create Course
              </Link>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {courses.slice(0, 5).map(course => (
                <div key={course.id} style={{
                  display: 'flex', alignItems: 'center', gap: 16,
                  padding: '14px 16px',
                  background: 'var(--bg-primary)',
                  borderRadius: 'var(--radius-sm)',
                  border: '1px solid var(--border)',
                }}>
                  <div style={{
                    width: 48, height: 48, borderRadius: 8,
                    background: course.thumbnail ? 'transparent' : 'var(--accent-light)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    flexShrink: 0, overflow: 'hidden',
                  }}>
                    {course.thumbnail
                      ? <img src={`http://localhost:5000${course.thumbnail}`} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      : <MdMenuBook style={{ color: 'var(--accent)', fontSize: 24 }} />
                    }
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 600, marginBottom: 2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {course.title}
                    </div>
                    <div style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
                      {course.student_count} students · {course.module_count} modules
                    </div>
                  </div>
                  <span className={`badge ${course.is_published ? 'badge-success' : 'badge-warning'}`}>
                    {course.is_published ? 'Published' : 'Draft'}
                  </span>
                  <Link to={`/instructor/courses/${course.id}/edit`} className="btn btn-secondary btn-sm">
                    Manage
                  </Link>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Certificate Completions Panel */}
        <div className="card">
          <div className="flex-between" style={{ marginBottom: 20 }}>
            <div>
              <h2 style={{ fontSize: 18, fontWeight: 700 }}>🏆 Course Completions</h2>
              <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginTop: 4 }}>
                Students who completed ≥ 90% of lessons
              </p>
            </div>
            {pendingCerts > 0 && (
              <span style={{
                background: 'rgba(236,72,153,0.15)',
                color: '#ec4899',
                fontSize: 12, fontWeight: 700,
                padding: '4px 10px', borderRadius: 20,
                border: '1px solid rgba(236,72,153,0.3)',
              }}>
                {pendingCerts} pending
              </span>
            )}
          </div>

          {completionsLoading ? (
            <div className="loading-container"><div className="spinner" /></div>
          ) : completions.length === 0 ? (
            <div className="empty-state" style={{ padding: '32px 0' }}>
              <div style={{ fontSize: 40 }}>🎓</div>
              <h3 style={{ fontSize: 16 }}>No completions yet</h3>
              <p style={{ fontSize: 13 }}>Students who finish 90%+ of a course will appear here.</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {Object.values(completionsByCourse).map((group) => (
                <div key={group.title}>
                  {/* Course header */}
                  <div style={{
                    fontSize: 12, fontWeight: 700, color: 'var(--text-muted)',
                    textTransform: 'uppercase', letterSpacing: '0.5px',
                    marginBottom: 8, paddingBottom: 6,
                    borderBottom: '1px solid var(--border)',
                  }}>
                    {group.title}
                  </div>

                  {/* Student rows */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {group.students.map((s) => {
                      const certKey = `${s.course_id}-${s.student_id}`;
                      const alreadyIssued = !!s.certificate_id;
                      return (
                        <div key={certKey} style={{
                          display: 'flex', alignItems: 'center', gap: 12,
                          padding: '10px 14px',
                          background: alreadyIssued ? 'rgba(34,197,94,0.05)' : 'var(--bg-primary)',
                          borderRadius: 'var(--radius-sm)',
                          border: `1px solid ${alreadyIssued ? 'rgba(34,197,94,0.2)' : 'var(--border)'}`,
                        }}>
                          {/* Avatar */}
                          <div style={{
                            width: 34, height: 34, borderRadius: '50%',
                            background: 'var(--accent-light)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            color: 'var(--accent)', fontWeight: 700, fontSize: 14, flexShrink: 0,
                          }}>
                            {s.student_name?.[0]?.toUpperCase()}
                          </div>

                          {/* Info */}
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ fontWeight: 600, fontSize: 13, marginBottom: 1 }}>{s.student_name}</div>
                            <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{s.student_email}</div>
                          </div>

                          {/* Completion % */}
                          <div style={{ textAlign: 'right', flexShrink: 0 }}>
                            <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--accent)' }}>
                              {s.video_completion}%
                            </div>
                            <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>completed</div>
                          </div>

                          {/* Action */}
                          {alreadyIssued ? (
                            <div style={{
                              display: 'flex', alignItems: 'center', gap: 4,
                              fontSize: 12, color: '#22c55e', fontWeight: 600, flexShrink: 0,
                            }}>
                              <MdCheckCircle style={{ fontSize: 16 }} /> Issued
                            </div>
                          ) : (
                            <button
                              className="btn btn-primary btn-sm"
                              style={{ flexShrink: 0, fontSize: 12 }}
                              disabled={issuingCert === certKey}
                              onClick={() => handleIssueCertificate(s.course_id, s.student_id, certKey)}
                            >
                              <MdCardMembership />
                              {issuingCert === certKey ? 'Issuing...' : 'Issue Cert'}
                            </button>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default InstructorDashboard;
