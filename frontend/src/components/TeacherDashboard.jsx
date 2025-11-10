
import React, { useState } from 'react';
import API from '../services/api';

function TeacherDashboard() {
  const [courseTitle, setCourseTitle] = useState('');
  const [videoTitle, setVideoTitle] = useState('');
  const [videoDesc, setVideoDesc] = useState('');
  const [courseId, setCourseId] = useState('');
  const [videoFile, setVideoFile] = useState(null);
  const [studentData, setStudentData] = useState({
    firstName: '',
    lastName: '',
    nic: '',
    email: '',
    password: '',
    courseId: ''
  });


  const handleAddCourse = async (e) => {
    e.preventDefault();
    try {
      await API.post('/courses', { title: courseTitle });
      alert('✅ Course created!');
      setCourseTitle('');
    } catch (err) {
      alert('Failed: ' + (err.response?.data?.error || err.message));
    }
  };


  const handleRegisterStudent = async (e) => {
    e.preventDefault();
    try {
      await API.post('/students/register', studentData);
      alert('✅ Student registered and enrolled!');
      setStudentData({
        firstName: '', lastName: '', nic: '', email: '', password: '', courseId: ''
      });
    } catch (err) {
      alert('Failed: ' + (err.response?.data?.error || err.message));
    }
  };

  const handleUploadVideo = async (e) => {
    e.preventDefault();
    if (!videoFile) return alert('Select a video file');

    const formData = new FormData();
    formData.append('video', videoFile);
    formData.append('title', videoTitle);
    formData.append('description', videoDesc);
    formData.append('courseId', courseId);

    try {
      await API.post('/videos/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      alert('✅ Video uploaded!');
      setVideoTitle('');
      setVideoDesc('');
      setCourseId('');
      setVideoFile(null);
      document.getElementById('videoInput').value = '';
    } catch (err) {
      alert('Upload failed: ' + (err.response?.data?.error || err.message));
    }
  };

  return (
    <div style={{ padding: '20px', fontFamily: 'Arial', maxWidth: '800px', margin: '0 auto' }}>
      <h2>👨‍🏫 Teacher Dashboard</h2>

      {/* Add Course */}
      <div style={cardStyle}>
        <h3>➕ Add Course</h3>
        <form onSubmit={handleAddCourse}>
          <input
            type="text"
            placeholder="Course Title"
            value={courseTitle}
            onChange={(e) => setCourseTitle(e.target.value)}
            required
            style={inputStyle}
          />
          <button type="submit" style={btnStyle}>Create Course</button>
        </form>
      </div>

      {/* Register Student */}
      <div style={cardStyle}>
        <h3>🎓 Register Student</h3>
        <form onSubmit={handleRegisterStudent}>
          <div style={gridStyle}>
            <input
              type="text"
              placeholder="First Name"
              value={studentData.firstName}
              onChange={(e) => setStudentData({ ...studentData, firstName: e.target.value })}
              required
              style={inputStyle}
            />
            <input
              type="text"
              placeholder="Last Name"
              value={studentData.lastName}
              onChange={(e) => setStudentData({ ...studentData, lastName: e.target.value })}
              required
              style={inputStyle}
            />
            <input
              type="text"
              placeholder="NIC"
              value={studentData.nic}
              onChange={(e) => setStudentData({ ...studentData, nic: e.target.value })}
              style={inputStyle}
            />
            <input
              type="email"
              placeholder="Email"
              value={studentData.email}
              onChange={(e) => setStudentData({ ...studentData, email: e.target.value })}
              required
              style={inputStyle}
            />
            <input
              type="password"
              placeholder="Password"
              value={studentData.password}
              onChange={(e) => setStudentData({ ...studentData, password: e.target.value })}
              required
              style={inputStyle}
            />
            <input
              type="number"
              placeholder="Course ID"
              value={studentData.courseId}
              onChange={(e) => setStudentData({ ...studentData, courseId: e.target.value })}
              required
              style={inputStyle}
            />
          </div>
          <button type="submit" style={btnStyle}>Register Student</button>
        </form>
      </div>

      {/* Upload Video */}
      <div style={cardStyle}>
        <h3>🎥 Upload Video</h3>
        <form onSubmit={handleUploadVideo}>
          <input
            type="text"
            placeholder="Video Title"
            value={videoTitle}
            onChange={(e) => setVideoTitle(e.target.value)}
            required
            style={inputStyle}
          />
          <textarea
            placeholder="Description"
            value={videoDesc}
            onChange={(e) => setVideoDesc(e.target.value)}
            style={{ ...inputStyle, height: 60 }}
          />
          <input
            type="number"
            placeholder="Course ID"
            value={courseId}
            onChange={(e) => setCourseId(e.target.value)}
            required
            style={inputStyle}
          />
          <input
            id="videoInput"
            type="file"
            accept="video/*"
            onChange={(e) => setVideoFile(e.target.files[0])}
            required
            style={inputStyle}
          />
          <button type="submit" style={btnStyle}>Upload Video</button>
        </form>
      </div>
    </div>
  );
}

const cardStyle = {
  border: '1px solid #ddd',
  borderRadius: '8px',
  padding: '15px',
  marginBottom: '20px',
  backgroundColor: '#f9f9f9'
};

const inputStyle = {
  width: '100%',
  padding: '8px',
  margin: '5px 0',
  border: '1px solid #ccc',
  borderRadius: '4px'
};

const gridStyle = {
  display: 'grid',
  gridTemplateColumns: '1fr 1fr',
  gap: '10px'
};

const btnStyle = {
  backgroundColor: '#007bff',
  color: 'white',
  padding: '10px 15px',
  border: 'none',
  borderRadius: '4px',
  cursor: 'pointer',
  marginTop: '10px'
};

export default TeacherDashboard;