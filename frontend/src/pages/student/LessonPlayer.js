import React, { useState, useEffect, useRef } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import api from '../../utils/api';
import toast from 'react-hot-toast';
import { MdArrowBack, MdArrowForward, MdMenuBook, MdCheckCircle } from 'react-icons/md';

const LessonPlayer = () => {
  const { id: courseId, lessonId } = useParams();
  const navigate = useNavigate();
  const videoRef = useRef(null);
  const progressTimer = useRef(null);

  const [course, setCourse] = useState(null);
  const [lesson, setLesson] = useState(null);
  const [allLessons, setAllLessons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [completed, setCompleted] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await api.get(`/courses/${courseId}`);
        setCourse(res.data);

        const flat = [];
        (res.data.modules || []).forEach(mod => {
          (mod.lessons || []).forEach(l => flat.push({ ...l, module_title: mod.title }));
        });
        setAllLessons(flat);

        const current = flat.find(l => l.id === parseInt(lessonId));
        if (!current) { toast.error('Lesson not found'); navigate(`/student/courses/${courseId}`); return; }
        setLesson(current);

        // Restore progress
        try {
          const lpRes = await api.get(`/courses/${courseId}/lesson-progress`);
          const lp = lpRes.data[parseInt(lessonId)];
          if (lp) {
            setCompleted(lp.is_completed);
            if (videoRef.current && lp.last_position > 0) {
              videoRef.current.currentTime = lp.last_position;
            }
          }
        } catch {}
      } finally { setLoading(false); }
    };
    fetchData();

    return () => { if (progressTimer.current) clearInterval(progressTimer.current); };
  }, [courseId, lessonId]);

  // Save progress every 10 seconds while playing
  const startProgressTracking = () => {
    if (progressTimer.current) clearInterval(progressTimer.current);
    progressTimer.current = setInterval(saveProgress, 10000);
  };

  const saveProgress = async () => {
    const video = videoRef.current;
    if (!video || !lesson) return;
    try {
      const res = await api.post(`/lessons/${lessonId}/progress`, {
        watched_duration: Math.floor(video.currentTime),
        total_duration: Math.floor(video.duration) || lesson.video_duration || 0,
        last_position: Math.floor(video.currentTime),
      });
      if (res.data.is_completed && !completed) {
        setCompleted(true);
        toast.success('Lesson completed! 🎉');
      }
    } catch {}
  };

  const handleVideoEnd = async () => {
    clearInterval(progressTimer.current);
    await saveProgress();
  };

  const currentIndex = allLessons.findIndex(l => l.id === parseInt(lessonId));
  const prevLesson = currentIndex > 0 ? allLessons[currentIndex - 1] : null;
  const nextLesson = currentIndex < allLessons.length - 1 ? allLessons[currentIndex + 1] : null;

  if (loading) return <div className="loading-container"><div className="spinner" /></div>;

  return (
    <div>
      {/* Breadcrumb */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 20, fontSize: 14, color: 'var(--text-secondary)' }}>
        <Link to={`/student/courses/${courseId}`} style={{ color: 'var(--accent)' }}>
          {course?.title}
        </Link>
        <span>›</span>
        <span style={{ color: 'var(--text-primary)' }}>{lesson?.module_title}</span>
        <span>›</span>
        <span style={{ color: 'var(--text-primary)' }}>{lesson?.title}</span>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: 24, alignItems: 'start' }}>
        {/* Video + content */}
        <div>
          {/* Video player */}
          {lesson?.video_url ? (
            <div style={{
              background: '#000', borderRadius: 'var(--radius)',
              overflow: 'hidden', marginBottom: 20,
              aspectRatio: '16/9',
            }}>
              <video
                ref={videoRef}
                src={`http://localhost:5000${lesson.video_url}`}
                controls
                style={{ width: '100%', height: '100%', display: 'block' }}
                onPlay={startProgressTracking}
                onPause={() => { clearInterval(progressTimer.current); saveProgress(); }}
                onEnded={handleVideoEnd}
              />
            </div>
          ) : (
            <div style={{
              background: 'var(--bg-secondary)', border: '1px solid var(--border)',
              borderRadius: 'var(--radius)', padding: 40,
              textAlign: 'center', marginBottom: 20,
            }}>
              <MdMenuBook style={{ fontSize: 48, color: 'var(--accent)', marginBottom: 12 }} />
              <p style={{ color: 'var(--text-secondary)' }}>No video for this lesson</p>
            </div>
          )}

          {/* Lesson info */}
          <div className="card" style={{ marginBottom: 16 }}>
            <div className="flex-between" style={{ marginBottom: 12 }}>
              <h1 style={{ fontSize: 20, fontWeight: 800 }}>{lesson?.title}</h1>
              {completed && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--success)', fontSize: 14, fontWeight: 600 }}>
                  <MdCheckCircle /> Completed
                </div>
              )}
            </div>
            {lesson?.content && (
              <p style={{ color: 'var(--text-secondary)', lineHeight: 1.8, fontSize: 15 }}>
                {lesson.content}
              </p>
            )}
          </div>

          {/* Prev / Next navigation */}
          <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12 }}>
            {prevLesson ? (
              <Link
                to={`/student/courses/${courseId}/lessons/${prevLesson.id}`}
                className="btn btn-secondary"
              >
                <MdArrowBack /> {prevLesson.title}
              </Link>
            ) : <div />}
            {nextLesson ? (
              <Link
                to={`/student/courses/${courseId}/lessons/${nextLesson.id}`}
                className="btn btn-primary"
                onClick={saveProgress}
              >
                {nextLesson.title} <MdArrowForward />
              </Link>
            ) : (
              <Link to={`/student/courses/${courseId}`} className="btn btn-success">
                Back to Course <MdArrowForward />
              </Link>
            )}
          </div>
        </div>

        {/* Sidebar: lesson list */}
        <div className="card" style={{ padding: 0, overflow: 'hidden', position: 'sticky', top: 24, maxHeight: 'calc(100vh - 48px)', overflowY: 'auto' }}>
          <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border)', fontWeight: 700 }}>
            Course Content
          </div>
          {(course?.modules || []).map((mod, mi) => (
            <div key={mod.id}>
              <div style={{
                padding: '10px 20px',
                background: 'var(--bg-secondary)',
                fontSize: 12, fontWeight: 700,
                color: 'var(--text-secondary)',
                textTransform: 'uppercase', letterSpacing: '0.5px',
                borderBottom: '1px solid var(--border)',
              }}>
                M{mi + 1}: {mod.title}
              </div>
              {(mod.lessons || []).map((l, li) => {
                const isCurrent = l.id === parseInt(lessonId);
                const lFlat = allLessons.find(fl => fl.id === l.id);
                return (
                  <Link
                    key={l.id}
                    to={`/student/courses/${courseId}/lessons/${l.id}`}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 10,
                      padding: '11px 20px',
                      background: isCurrent ? 'var(--accent-light)' : 'transparent',
                      borderLeft: isCurrent ? '3px solid var(--accent)' : '3px solid transparent',
                      borderBottom: '1px solid var(--border)',
                      textDecoration: 'none',
                      fontSize: 13,
                    }}
                    onMouseEnter={e => { if (!isCurrent) e.currentTarget.style.background = 'var(--bg-hover)'; }}
                    onMouseLeave={e => { if (!isCurrent) e.currentTarget.style.background = 'transparent'; }}
                  >
                    <span style={{ fontSize: 11, color: 'var(--text-muted)', minWidth: 20 }}>{li + 1}</span>
                    <span style={{ flex: 1, color: isCurrent ? 'var(--accent)' : 'var(--text-primary)', fontWeight: isCurrent ? 600 : 400 }}>
                      {l.title}
                    </span>
                    {l.video_duration > 0 && (
                      <span style={{ fontSize: 11, color: 'var(--text-muted)', flexShrink: 0 }}>
                        {Math.floor(l.video_duration / 60)}m
                      </span>
                    )}
                  </Link>
                );
              })}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default LessonPlayer;
