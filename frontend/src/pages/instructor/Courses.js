import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../../utils/api';
import toast from 'react-hot-toast';
import { MdAdd, MdEdit, MdDelete, MdPeople, MdAssignment, MdBarChart } from 'react-icons/md';

const InstructorCourses = () => {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchCourses = () => {
    api.get('/courses/my-courses').then(res => {
      setCourses(res.data);
      setLoading(false);
    }).catch(() => setLoading(false));
  };

  useEffect(() => { fetchCourses(); }, []);

  const handleDelete = async (id, title) => {
    if (!window.confirm(`Delete "${title}"? This cannot be undone.`)) return;
    try {
      await api.delete(`/courses/${id}`);
      toast.success('Course deleted');
      setCourses(prev => prev.filter(c => c.id !== id));
    } catch {
      toast.error('Failed to delete course');
    }
  };

  const togglePublish = async (course) => {
    try {
      await api.put(`/courses/${course.id}`, { is_published: !course.is_published });
      toast.success(course.is_published ? 'Course unpublished' : 'Course published!');
      fetchCourses();
    } catch {
      toast.error('Failed to update course');
    }
  };

  return (
    <div>
      <div className="page-header flex-between">
        <div>
          <h1>My Courses</h1>
          <p>Manage and organize your course content</p>
        </div>
        <Link to="/instructor/courses/new" className="btn btn-primary">
          <MdAdd /> Create Course
        </Link>
      </div>

      {loading ? (
        <div className="loading-container"><div className="spinner" /></div>
      ) : courses.length === 0 ? (
        <div className="empty-state">
          <div style={{ fontSize: 64 }}>📚</div>
          <h3>No courses yet</h3>
          <p>Create your first course to start teaching</p>
          <Link to="/instructor/courses/new" className="btn btn-primary" style={{ marginTop: 16 }}>
            <MdAdd /> Create Course
          </Link>
        </div>
      ) : (
        <div className="grid-3">
          {courses.map(course => (
            <div key={course.id} className="card" style={{ padding: 0, overflow: 'hidden' }}>
              {/* Thumbnail */}
              <div style={{
                height: 140,
                background: course.thumbnail
                  ? `url(http://localhost:5000${course.thumbnail}) center/cover`
                  : 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
                display: 'flex', alignItems: 'flex-start', justifyContent: 'flex-end', padding: 12,
              }}>
                <span className={`badge ${course.is_published ? 'badge-success' : 'badge-warning'}`}>
                  {course.is_published ? 'Published' : 'Draft'}
                </span>
              </div>

              <div style={{ padding: 20 }}>
                <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 6, lineHeight: 1.4 }}>
                  {course.title}
                </h3>
                <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 14, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                  {course.description || 'No description'}
                </p>

                <div style={{ display: 'flex', gap: 16, marginBottom: 16, fontSize: 13, color: 'var(--text-secondary)' }}>
                  <span><MdPeople style={{ verticalAlign: 'middle' }} /> {course.student_count} students</span>
                  <span>📦 {course.module_count} modules</span>
                </div>

                {/* Actions */}
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  <Link to={`/instructor/courses/${course.id}/edit`} className="btn btn-secondary btn-sm">
                    <MdEdit /> Edit
                  </Link>
                  <Link to={`/instructor/courses/${course.id}/assignments`} className="btn btn-secondary btn-sm">
                    <MdAssignment /> Assignments
                  </Link>
                  <Link to={`/instructor/courses/${course.id}/analytics`} className="btn btn-secondary btn-sm">
                    <MdBarChart /> Analytics
                  </Link>
                  <button
                    className={`btn btn-sm ${course.is_published ? 'btn-secondary' : 'btn-success'}`}
                    onClick={() => togglePublish(course)}
                  >
                    {course.is_published ? 'Unpublish' : 'Publish'}
                  </button>
                  <button className="btn btn-danger btn-sm" onClick={() => handleDelete(course.id, course.title)}>
                    <MdDelete />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default InstructorCourses;
