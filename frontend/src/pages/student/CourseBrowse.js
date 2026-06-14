import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../../utils/api';
import { MdSearch, MdPeople, MdMenuBook } from 'react-icons/md';

const CourseBrowse = () => {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [level, setLevel] = useState('');
  const [enrolled, setEnrolled] = useState([]);

  useEffect(() => {
    Promise.all([
      api.get('/courses', { params: { search, level } }),
      api.get('/courses/enrolled'),
    ]).then(([cRes, eRes]) => {
      setCourses(cRes.data);
      setEnrolled(eRes.data.map(e => e.id));
    }).finally(() => setLoading(false));
  }, [search, level]);

  return (
    <div>
      <div className="page-header">
        <h1>Browse Courses</h1>
        <p>Discover courses and start learning today</p>
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 28 }}>
        <div style={{ flex: 1, position: 'relative' }}>
          <MdSearch style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', fontSize: 20 }} />
          <input
            className="form-control"
            style={{ paddingLeft: 42 }}
            placeholder="Search courses..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
        <select className="form-control" style={{ width: 160 }} value={level} onChange={e => setLevel(e.target.value)}>
          <option value="">All Levels</option>
          <option value="beginner">Beginner</option>
          <option value="intermediate">Intermediate</option>
          <option value="advanced">Advanced</option>
        </select>
      </div>

      {loading ? (
        <div className="loading-container"><div className="spinner" /></div>
      ) : courses.length === 0 ? (
        <div className="empty-state">
          <div style={{ fontSize: 64 }}>🔍</div>
          <h3>No courses found</h3>
          <p>Try adjusting your search or filters</p>
        </div>
      ) : (
        <div className="grid-3">
          {courses.map(course => {
            const isEnrolled = enrolled.includes(course.id);
            return (
              <div key={course.id} className="card" style={{ padding: 0, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
                <div style={{
                  height: 160,
                  background: course.thumbnail
                    ? `url(http://localhost:5000${course.thumbnail}) center/cover`
                    : 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
                  display: 'flex', alignItems: 'flex-start',
                  justifyContent: 'space-between', padding: 12,
                }}>
                  <span className={`badge badge-primary`} style={{ textTransform: 'capitalize' }}>
                    {course.level}
                  </span>
                  {isEnrolled && <span className="badge badge-success">Enrolled</span>}
                </div>
                <div style={{ padding: 20, flex: 1, display: 'flex', flexDirection: 'column' }}>
                  <div style={{ fontSize: 12, color: 'var(--accent)', fontWeight: 600, marginBottom: 6 }}>
                    {course.category || 'General'}
                  </div>
                  <h3 style={{ fontSize: 15, fontWeight: 700, marginBottom: 8, lineHeight: 1.4 }}>{course.title}</h3>
                  <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 14, flex: 1,
                    display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                    {course.description || 'No description available'}
                  </p>
                  <div style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 16 }}>
                    👨‍🏫 {course.instructor_name}
                  </div>
                  <div style={{ display: 'flex', gap: 16, fontSize: 12, color: 'var(--text-muted)', marginBottom: 16 }}>
                    <span><MdPeople style={{ verticalAlign: 'middle' }} /> {course.student_count} students</span>
                    <span><MdMenuBook style={{ verticalAlign: 'middle' }} /> {course.module_count} modules</span>
                  </div>
                  <Link
                    to={`/student/courses/${course.id}`}
                    className={`btn ${isEnrolled ? 'btn-secondary' : 'btn-primary'}`}
                    style={{ justifyContent: 'center' }}
                  >
                    {isEnrolled ? 'Continue Learning' : 'View Course'}
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default CourseBrowse;
