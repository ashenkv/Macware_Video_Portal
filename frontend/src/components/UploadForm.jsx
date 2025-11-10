
import React, { useState } from 'react';
import API from '../services/api';

function UploadForm() {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [courseId, setCourseId] = useState(1);
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [success, setSuccess] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!file || !title) {
      alert('Please fill all fields and select a video');
      return;
    }

    setUploading(true);
    setSuccess('');

    const formData = new FormData();
    formData.append('video', file);
    formData.append('title', title);
    formData.append('description', description);
    formData.append('courseId', courseId);

    try {
      const res = await API.post('/videos/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      setSuccess('✅ Video uploaded successfully!');
      setTitle('');
      setDescription('');
      setFile(null);
      document.getElementById('fileInput').value = '';

    } catch (err) {
      alert('Upload failed: ' + (err.response?.data?.error || err.message));
    } finally {
      setUploading(false);
    }
  };

  return (
    <div style={{ padding: '20px', fontFamily: 'Arial' }}>
      <h2>📤 Upload Video</h2>

      {success && <p style={{ color: 'green' }}>{success}</p>}

      <form onSubmit={handleSubmit}>
        <div style={{ marginBottom: '10px' }}>
          <label>Title *</label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Math Lesson 1"
            style={{ width: '100%', padding: '8px', marginTop: '5px' }}
            required
          />
        </div>

        <div style={{ marginBottom: '10px' }}>
          <label>Description</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Brief description"
            style={{ width: '100%', padding: '8px', marginTop: '5px', height: 80 }}
          />
        </div>

        <div style={{ marginBottom: '10px' }}>
          <label>Course ID *</label>
          <input
            type="number"
            value={courseId}
            onChange={(e) => setCourseId(e.target.value)}
            style={{ width: '100%', padding: '8px', marginTop: '5px' }}
            required
          />
        </div>

        <div style={{ marginBottom: '10px' }}>
          <label>Video File (MP4/MKV) *</label>
          <input
            id="fileInput"
            type="file"
            accept="video/*"
            onChange={(e) => setFile(e.target.files[0])}
            style={{ width: '100%', padding: '8px', marginTop: '5px' }}
            required
          />
        </div>

        <button
          type="submit"
          disabled={uploading}
          style={{
            backgroundColor: uploading ? '#888' : '#007bff',
            color: 'white',
            padding: '10px 15px',
            border: 'none',
            cursor: uploading ? 'not-allowed' : 'pointer',
          }}
        >
          {uploading ? 'Uploading...' : 'Upload Video'}
        </button>
      </form>
    </div>
  );
}

export default UploadForm;