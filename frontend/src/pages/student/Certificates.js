import React, { useState, useEffect } from 'react';
import api from '../../utils/api';
import toast from 'react-hot-toast';
import { MdCardMembership, MdDownload, MdVerified } from 'react-icons/md';

const Certificates = () => {
  const [certificates, setCertificates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState(null);

  useEffect(() => {
    api.get('/certificates').then(res => setCertificates(res.data)).finally(() => setLoading(false));
  }, []);

  const handleDownload = async (certId) => {
    setDownloading(certId);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`http://localhost:5000/api/certificates/${certId}/download`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error('Download failed');
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `certificate-${certId}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success('Certificate downloaded!');
    } catch {
      toast.error('Download failed');
    } finally {
      setDownloading(null);
    }
  };

  if (loading) return <div className="loading-container"><div className="spinner" /></div>;

  return (
    <div>
      <div className="page-header">
        <h1>My Certificates</h1>
        <p>Download your earned certificates</p>
      </div>

      {certificates.length === 0 ? (
        <div className="empty-state">
          <MdCardMembership style={{ width: 64, height: 64 }} />
          <h3>No certificates yet</h3>
          <p>Complete a course to earn your first certificate</p>
        </div>
      ) : (
        <div className="grid-2">
          {certificates.map(cert => (
            <div key={cert.id} style={{
              background: 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)',
              border: '1px solid #6366f1',
              borderRadius: 'var(--radius)',
              padding: 28,
              position: 'relative',
              overflow: 'hidden',
            }}>
              {/* Decorative corner */}
              <div style={{
                position: 'absolute', top: 0, right: 0,
                width: 80, height: 80,
                background: 'linear-gradient(135deg, transparent 50%, rgba(99,102,241,0.15) 50%)',
              }} />

              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14, marginBottom: 20 }}>
                <div style={{
                  width: 48, height: 48, background: 'rgba(99,102,241,0.15)',
                  borderRadius: 12,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  flexShrink: 0,
                }}>
                  <MdCardMembership style={{ color: '#6366f1', fontSize: 26 }} />
                </div>
                <div>
                  <div style={{ fontSize: 12, color: '#6366f1', fontWeight: 600, marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                    Certificate of Completion
                  </div>
                  <h3 style={{ fontSize: 17, fontWeight: 800, lineHeight: 1.3 }}>{cert.course_title}</h3>
                </div>
              </div>

              <div style={{ display: 'flex', gap: 6, alignItems: 'center', marginBottom: 6, fontSize: 13, color: 'var(--text-secondary)' }}>
                <MdVerified style={{ color: '#22c55e' }} />
                Instructed by {cert.instructor_name}
              </div>

              <div style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 20 }}>
                📅 Issued: {new Date(cert.issued_at).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
              </div>

              <div style={{
                background: 'rgba(99,102,241,0.08)',
                border: '1px solid rgba(99,102,241,0.2)',
                borderRadius: 6, padding: '8px 12px', marginBottom: 20,
                display: 'flex', alignItems: 'center', gap: 8,
              }}>
                <span style={{ fontSize: 12, color: 'var(--text-muted)', fontFamily: 'monospace' }}>
                  ID: {cert.certificate_id}
                </span>
              </div>

              <button
                className="btn btn-primary"
                style={{ width: '100%', justifyContent: 'center' }}
                onClick={() => handleDownload(cert.certificate_id)}
                disabled={downloading === cert.certificate_id}
              >
                <MdDownload />
                {downloading === cert.certificate_id ? 'Generating PDF...' : 'Download Certificate'}
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Certificates;
