import { useState, useEffect } from 'react';
import axios from 'axios';
import ChatInterface from './ChatInterface';
import LoginPage from './LoginPage';
import { API_BASE_URL } from './config';

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [sessionId, setSessionId] = useState(null);
  const [userEmail, setUserEmail] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  // Check authentication status on mount
  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    const savedSessionId = localStorage.getItem('email_agent_session_id');

    if (!savedSessionId) {
      setIsLoading(false);
      return;
    }

    try {
      const response = await axios.get(`${API_BASE_URL}/api/auth/user`, {
        headers: {
          'x-session-id': savedSessionId
        }
      });

      if (response.data.authenticated) {
        setIsAuthenticated(true);
        setSessionId(savedSessionId);
        setUserEmail(response.data.email);
      } else {
        localStorage.removeItem('email_agent_session_id');
      }
    } catch (error) {
      console.error('Auth check failed:', error);
      localStorage.removeItem('email_agent_session_id');
    } finally {
      setIsLoading(false);
    }
  };

  const handleLoginSuccess = (newSessionId, email) => {
    setSessionId(newSessionId);
    setUserEmail(email);
    setIsAuthenticated(true);
    localStorage.setItem('email_agent_session_id', newSessionId);
  };

  const handleLogout = async () => {
    try {
      await axios.post(`${API_BASE_URL}/api/auth/logout`, {}, {
        headers: {
          'x-session-id': sessionId
        }
      });
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      setIsAuthenticated(false);
      setSessionId(null);
      setUserEmail(null);
      localStorage.removeItem('email_agent_session_id');
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gpt-gray flex items-center justify-center">
        <div className="text-gpt-textDim">Loading...</div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <LoginPage onLoginSuccess={handleLoginSuccess} />;
  }

  return (
    <ChatInterface
      sessionId={sessionId}
      userEmail={userEmail}
      onLogout={handleLogout}
    />
  );
}

export default App;
