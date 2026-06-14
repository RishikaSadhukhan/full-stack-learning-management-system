import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import api from '../../utils/api';
import { MdMenuBook, MdAssignment, MdCardMembership, MdArrowForward, MdPlayCircle } from 'react-icons/md';

const StudentDashboard = () => {
  const { user } = useAuth();
  const [courses, setCourses] = useState([]);
  const [assignments, setAssignments] = useState([]);
  const [certificates, setCertificates] = useState([]);
  const [progress, setProgress] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAll = async () => {
      try {
        const [cRes, certRes] = await Promise.all([
          api.get('/courses/enrolled'),
          api.get('/certificates'),
        ]);
        setCourses(cRes.data);
        setCertificates(certRes.data);

        // Fetch assignments for each enrolled course
        const allAssignments = [];
        for (const course of cRes.data.slice(0, 5)) {
          try {
            const aRes = await api.get(`/courses/${course.id}/assignments`);
            allAssignments.push(...aRes.data.map(a => ({ ...a, course_title: course.title, course_id: course.id })));
          } catch {}
        }
        const upcoming = allAssignments
          .filter(a => !a.submission && new Date(a.due_date) > new Date())
          .sort((a, b) => new Date(a.due_date) - new Date(b.due_date));
        setAssignments(upcoming.slice(0, 5));

        // Fetch progress for each course
        const progressMap = {};
        for (const course of cRes.data.slice(0, 6)) {
          try {
            const pRes = await api.get(`/courses/${course.id}/progress`);
            progressMap[course.id] = pRes.data;
          } catch {}
        }
        setProgress(progressMap);
      } finally {
        setLoading(false);
      }
    };
    fetchAll();
  }, []);

  const stats = [
    { icon: <MdMenuBook />, label: 'Enrolled Courses', value: courses.length },
    { icon: <MdAssignment />, label: 'Upcoming Assignments', value: assignments.length },
    { icon: <MdCardMembership />, label: 'Certificates Earned', value: certificates.length },
  ];

  if (loading) return <div className="loading-container"><div className="spinner" /></div>;

  return (
    <div>
      <div className="page-header">
        <h1>Welcome back, {user?.name?.split(' ')[0]}! 🎓</h1>
        <p>Continue your learning journey</p>
      </div>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 20, marginBottom: 32 }}>
        {stats.map(s => (
          <div className="stat-card" key={s.label}>
            <div className="stat-icon">{s.icon}</div>
            <div className="stat-info">
              <h3>{s.value}</h3>
              <p>{s.label}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="grid-2">
        {/* Continue Learning */}
        <div className="card">
          <div className="flex-between" style={{ marginBottom: 20 }}>
            <h2 style={{ fontSize: 17, fontWeight: 700 }}>Continue Learning</h2>
            <Link to="/student/courses" className="btn btn-secondary btn-sm">
              Browse <MdArrowForward />
            </Link>
          </div>
          {courses.length === 0 ? (
            <div className="empty-state" style={{ padding: '32px 0' }}>
              <div style={{ fontSize: 40 }}>📚</div>
              <h3 style={{ fontSize: 16 }}>No courses yet</h3>
              <Link to="/student/courses" className="btn btn-primary btn-sm" style={{ marginTop: 12 }}>
                Browse Courses
              </Link>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {courses.slice(0, 4).map(course => {
                const p = progress[course.id];
                const pct = p?.overallProgress || 0;
                return (
                  <Link to={`/student/courses/${course.id}`} key={course.id} style={{
                    display: 'flex', alignItems: 'center', gap: 14,
                    padding: '12px 14px',
                    background: 'var(--bg-primary)',
                    borderRadius: 'var(--radius-sm)',
                    border: '1px solid var(--border)',
                    textDecoration: 'none',
                    transition: 'var(--transition)',
                  }}
                    onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--accent)'}
                    onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border)'}
                  >
                    <div style={{
                      width: 44, height: 44, borderRadius: 8, flexShrink: 0,
                      background: course.thumbnail ? `url(http://localhost:5000${course.thumbnail}) center/cover` : 'var(--accent-light)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>
                      {!course.thumbnail && <MdPlayCircle style={{ color: 'var(--accent)', fontSize: 22 }} />}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 6, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {course.title}
                      </div>
                      <div className="progress-bar" style={{ height: 6 }}>
                        <div className="progress-fill" style={{ width: `${pct}%` }} />
                      </div>
                    </div>
                    <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--accent)', flexShrink: 0 }}>{pct}%</span>
                  </Link>
                );
              })}
            </div>
          )}
        </div>

        {/* Upcoming Assignments */}
        <div className="card">
          <div className="flex-between" style={{ marginBottom: 20 }}>
            <h2 style={{ fontSize: 17, fontWeight: 700 }}>Upcoming Assignments</h2>
            <Link to="/student/assignments" className="btn btn-secondary btn-sm">
              View All <MdArrowForward />
            </Link>
          </div>
          {assignments.length === 0 ? (
            <div className="empty-state" style={{ padding: '32px 0' }}>
              <div style={{ fontSize: 40 }}>✅</div>
              <h3 style={{ fontSize: 16 }}>All caught up!</h3>
              <p style={{ fontSize: 13 }}>No upcoming assignments</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {assignments.map(a => {
                const daysLeft = Math.ceil((new Date(a.due_date) - new Date()) / (1000 * 60 * 60 * 24));
                return (
                  <div key={a.id} style={{
                    padding: '12px 14px',
                    background: 'var(--bg-primary)',
                    borderRadius: 'var(--radius-sm)',
                    border: `1px solid ${daysLeft <= 2 ? 'var(--danger)' : 'var(--border)'}`,
                  }}>
                    <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 4 }}>{a.title}</div>
                    <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginBottom: 6 }}>{a.course_title}</div>
                    <span className={`badge ${daysLeft <= 2 ? 'badge-danger' : daysLeft <= 5 ? 'badge-warning' : 'badge-primary'}`}>
                      {daysLeft === 0 ? 'Due today' : daysLeft === 1 ? 'Due tomorrow' : `${daysLeft} days left`}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default StudentDashboard;
