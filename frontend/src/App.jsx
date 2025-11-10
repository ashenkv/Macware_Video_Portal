
import React, { useState, useEffect } from 'react';
import API from './services/api';
import VideoList from './components/VideoList';
import TeacherDashboard from './components/TeacherDashboard';

function App() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [token, setToken] = useState(null);
  const [user, setUser] = useState(null);

  useEffect(() => {
    const savedToken = localStorage.getItem('token');
    const savedUser = localStorage.getItem('user');
    if (savedToken && savedUser) {
      setToken(savedToken);
      setUser(JSON.parse(savedUser));
    }
  }, []);

  const handleLogin = async () => {
    try {
      const res = await API.post('/login', { email, password });
      const { token, user } = res.data;

      setToken(token);
      setUser(user);
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(user));

      alert(`Welcome, ${user.name}!`);
    } catch (error) {
      alert('Login failed: ' + (error.response?.data?.error || 'Invalid credentials'));
    }
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  };

  return (
    <div style={{ fontFamily: 'Arial', maxWidth: '900px', margin: '0 auto', padding: '20px' }}>
      <h1>🎓 Macware Institute Video Portal</h1>

      {!token ? (
        <div style={{ textAlign: 'center' }}>
          <h2>Login</h2>
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            style={inputStyle}
          />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            style={inputStyle}
          />
          <button onClick={handleLogin} style={btnStyle}>Login</button>
        </div>
      ) : (
        <div>
          <p>Welcome, <strong>{user.name}</strong> 👋 Role: <strong>{user.role}</strong></p>
          <button onClick={logout} style={{ ...btnStyle, backgroundColor: '#6c757d' }}>Logout</button>

          {user.role === 'teacher' && <TeacherDashboard />}

          {user.role === 'student' && (
            <div style={{ marginTop: '30px' }}>
              <VideoList />
            </div>
          )}
        </div>
      )}
    </div>
  );
}


const inputStyle = {
  display: 'block',
  width: '100%',
  maxWidth: '300px',
  margin: '10px auto',
  padding: '8px',
  border: '1px solid #ccc',
  borderRadius: '4px'
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

export default App;