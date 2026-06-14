import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import api from '../../utils/api';
import toast from 'react-hot-toast';
import { MdPlayCircle, MdLock, MdExpandMore, MdExpandLess, MdCheckCircle, MdAssignment } from 'react-icons/md';

const CourseView = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [course, setCourse] = useState(null);
  const [progress, setProgress] = useState(null);
  const [lessonProgress, setLessonProgress] = useState({});
  const [expandedModule, setExpandedModule] = useState(null);
  const [enrolling, setEnrolling] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await api.get(`/courses/${id}`);
        setCourse(res.data);
        if (res.data.isEnrolled) {
          const [pRes, lpRes] = await Promise.all([
            api.get(`/courses/${id}/progress`),
            api.get(`/courses/${id}/lesson-progress`),
          ]);
          setProgress(pRes.data);
          setLessonProgress(lpRes.data);
          if (res.data.modules?.length) setExpandedModule(res.data.modules[0].id);
        }
      } catch { toast.error('Course not found'); navigate('/student/courses'); }
      finally { setLoading(false); }
    };
    fetchData();
  }, [id]);

  const handleEnroll = async () => {
    setEnrolling(true);
    try {
      await api.post(`/courses/${id}/enroll`);
      toast.success('Enrolled successfully!');
      window.location.reload();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Enrollment failed');
    } finally { setEnrolling(false); }
  };

  const handleCertificate = async () => {
    try {
      const res = await api.post(`/courses/${id}/certificate`);
      toast.success('Certificate issued!');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Not eligible yet');
    }
  };

  if (loading) return <div className="loading-container"><div className="spinner" /></div>;
  if (!course) return null;

  const totalLessons = course.modules?.reduce((sum, m) => sum + (m.lessons?.length || 0), 0) || 0;

  return (
    <div>
      {/* Header */}
      <div style={{
        background: 'linear-gradient(135deg, var(--bg-secondary) 0%, var(--bg-primary) 100%)',
        border: '1px solid var(--border)', borderRadius: 'var(--radius)',
        padding: 32, marginBottom: 28,
        display: 'grid', gridTemplateColumns: '1fr auto', gap: 24, alignItems: 'start',
      }}>
        <div>
          <div style={{ display: 'flex', gap: 10, marginBottom: 12 }}>
            <span className="badge badge-primary" style={{ textTransform: 'capitalize' }}>{course.level}</span>
            {course.category && <span className="badge badge-primary">{course.category}</span>}
          </div>
          <h1 style={{ fontSize: 26, fontWeight: 800, marginBottom: 10 }}>{course.title}</h1>
          <p style={{ color: 'var(--text-secondary)', marginBottom: 16, lineHeight: 1.7 }}>{course.description}</p>
          <div style={{ display: 'flex', gap: 20, fontSize: 14, color: 'var(--text-secondary)' }}>
            <span>👨‍🏫 {course.instructor_name}</span>
            <span>📦 {course.modules?.length || 0} modules</span>
            <span>🎥 {totalLessons} lessons</span>
          </div>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, minWidth: 180 }}>
          {!course.isEnrolled ? (
            <button className="btn btn-primary btn-lg" onClick={handleEnroll} disabled={enrolling}>
              {enrolling ? 'Enrolling...' : 'Enroll Now — Free'}
            </button>
          ) : (
            <>
              <div style={{ textAlign: 'center', marginBottom: 4 }}>
                <div style={{ fontSize: 28, fontWeight: 800, color: 'var(--accent)' }}>
                  {progress?.overallProgress || 0}%
                </div>
                <div style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 8 }}>Overall Progress</div>
                <div className="progress-bar">
                  <div className="progress-fill" style={{ width: `${progress?.overallProgress || 0}%` }} />
                </div>
              </div>
              {(progress?.overallProgress || 0) >= 90 && (
                <button className="btn btn-success" onClick={handleCertificate}>
                  🏆 Get Certificate
                </button>
              )}
            </>
          )}
        </div>
      </div>

      {/* Progress summary (enrolled) */}
      {course.isEnrolled && progress && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 16, marginBottom: 28 }}>
          {[
            { label: 'Video Progress', value: `${progress.videoProgress}%` },
            { label: 'Assignment Progress', value: `${progress.assignmentProgress}%` },
            { label: 'Lessons Done', value: `${progress.completedLessons}/${progress.totalLessons}` },
            { label: 'Assignments Done', value: `${progress.completedAssignments}/${progress.totalAssignments}` },
          ].map(s => (
            <div key={s.label} style={{
              background: 'var(--bg-secondary)', border: '1px solid var(--border)',
              borderRadius: 'var(--radius-sm)', padding: '16px 20px', textAlign: 'center',
            }}>
              <div style={{ fontSize: 22, fontWeight: 800, color: 'var(--accent)' }}>{s.value}</div>
              <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 4 }}>{s.label}</div>
            </div>
          ))}
        </div>
      )}

      {/* Curriculum */}
      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--border)' }}>
          <h2 style={{ fontWeight: 700 }}>Course Curriculum</h2>
        </div>
        {(course.modules || []).map((mod, i) => (
          <div key={mod.id} style={{ borderBottom: '1px solid var(--border)' }}>
            <div
              onClick={() => setExpandedModule(expandedModule === mod.id ? null : mod.id)}
              style={{
                display: 'flex', alignItems: 'center', gap: 14,
                padding: '16px 24px', cursor: 'pointer', background: 'var(--bg-secondary)',
              }}
              onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-hover)'}
              onMouseLeave={e => e.currentTarget.style.background = 'var(--bg-secondary)'}
            >
              <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-muted)', minWidth: 28 }}>
                M{i + 1}
              </span>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 700, fontSize: 15 }}>{mod.title}</div>
                {mod.description && <div style={{ fontSize: 13, color: 'var(--text-secondary)', marginTop: 2 }}>{mod.description}</div>}
              </div>
              <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
                {(mod.lessons || []).length} lessons
              </span>
              {expandedModule === mod.id ? <MdExpandLess /> : <MdExpandMore />}
            </div>

            {expandedModule === mod.id && (
              <div>
                {(mod.lessons || []).map((lesson, j) => {
                  const lp = lessonProgress[lesson.id];
                  const isCompleted = lp?.is_completed;
                  const canAccess = course.isEnrolled || lesson.is_preview;

                  return (
                    <div key={lesson.id} style={{
                      display: 'flex', alignItems: 'center', gap: 14,
                      padding: '13px 24px 13px 56px',
                      borderTop: '1px solid var(--border)',
                      background: 'var(--bg-primary)',
                    }}>
                      {isCompleted
                        ? <MdCheckCircle style={{ color: 'var(--success)', fontSize: 20, flexShrink: 0 }} />
                        : canAccess
                          ? <MdPlayCircle style={{ color: 'var(--accent)', fontSize: 20, flexShrink: 0 }} />
                          : <MdLock style={{ color: 'var(--text-muted)', fontSize: 18, flexShrink: 0 }} />
                      }
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 14, fontWeight: 500, marginBottom: 2 }}>{lesson.title}</div>
                        {lp && (
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <div className="progress-bar" style={{ width: 80, height: 4 }}>
                              <div className="progress-fill" style={{ width: `${lp.completion_percentage}%` }} />
                            </div>
                            <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                              {Math.round(lp.completion_percentage)}%
                            </span>
                          </div>
                        )}
                      </div>
                      {lesson.video_duration > 0 && (
                        <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                          {Math.floor(lesson.video_duration / 60)}m
                        </span>
                      )}
                      {lesson.is_preview && !course.isEnrolled && (
                        <span className="badge badge-primary">Preview</span>
                      )}
                      {canAccess && (
                        <Link
                          to={`/student/courses/${id}/lessons/${lesson.id}`}
                          className="btn btn-secondary btn-sm"
                        >
                          {isCompleted ? 'Rewatch' : lp ? 'Continue' : 'Start'}
                        </Link>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default CourseView;
