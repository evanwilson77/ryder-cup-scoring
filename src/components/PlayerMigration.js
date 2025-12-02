import React, { useState } from 'react';
import { migratePlayersToAuth } from '../utils/migratePlayersToAuth';
import { useAuth } from '../contexts/AuthContext';

function PlayerMigration() {
  const [status, setStatus] = useState('idle'); // idle, running, success, error
  const [logs, setLogs] = useState([]);
  const { isAdmin, currentUser } = useAuth();

  console.log('PlayerMigration rendering - isAdmin:', isAdmin, 'currentUser:', currentUser);

  if (!isAdmin) {
    return (
      <div style={{ padding: '20px', maxWidth: '800px', margin: '0 auto', backgroundColor: 'white', minHeight: '400px' }}>
        <div style={{
          padding: '15px',
          backgroundColor: '#fee',
          border: '1px solid #fcc',
          borderRadius: '8px'
        }}>
          <p><strong>Access Denied</strong></p>
          <p>Only admins can run player migration.</p>
          <p style={{ fontSize: '12px', color: '#666', marginTop: '10px' }}>
            Debug: isAdmin={String(isAdmin)}, currentUser={currentUser?.email || 'null'}
          </p>
        </div>
      </div>
    );
  }

  const handleMigration = async () => {
    setStatus('running');
    setLogs([]);

    // Capture console logs
    const originalLog = console.log;
    const originalError = console.error;
    const capturedLogs = [];

    console.log = (...args) => {
      const message = args.join(' ');
      capturedLogs.push({ type: 'log', message });
      originalLog(...args);
    };

    console.error = (...args) => {
      const message = args.join(' ');
      capturedLogs.push({ type: 'error', message });
      originalError(...args);
    };

    try {
      await migratePlayersToAuth();
      setStatus('success');
    } catch (error) {
      setStatus('error');
      capturedLogs.push({ type: 'error', message: `Fatal error: ${error.message}` });
    } finally {
      // Restore console
      console.log = originalLog;
      console.error = originalError;
      setLogs(capturedLogs);
    }
  };

  return (
    <div style={{ padding: '20px', maxWidth: '800px', margin: '0 auto', backgroundColor: 'white', minHeight: '400px' }}>
      <h2 style={{ marginBottom: '20px' }}>🔧 Player Authentication Migration</h2>

      <div style={{
        padding: '15px',
        backgroundColor: '#e3f2fd',
        border: '1px solid #90caf9',
        borderRadius: '8px',
        marginBottom: '20px'
      }}>
        <p><strong>What does this do?</strong></p>
        <p>This tool creates Firebase Auth accounts for existing players that don't have login accounts yet.</p>
        <ul>
          <li>Scans all players in the database</li>
          <li>Creates auth accounts for players without <code>userId</code></li>
          <li>Uses common password: <code>rydercup2025</code></li>
          <li>Email format: <code>firstname.lastname@rydercup.local</code></li>
        </ul>
      </div>

      <div style={{
        padding: '15px',
        backgroundColor: '#fff3e0',
        border: '1px solid #ffb74d',
        borderRadius: '8px',
        marginBottom: '20px'
      }}>
        <p><strong>⚠️ Before running:</strong></p>
        <ul>
          <li>Make sure you're logged in as admin</li>
          <li>This only needs to be run ONCE</li>
          <li>Safe to run multiple times (skips existing accounts)</li>
        </ul>
      </div>

      <button
        onClick={handleMigration}
        disabled={status === 'running'}
        style={{
          padding: '12px 24px',
          fontSize: '16px',
          backgroundColor: status === 'running' ? '#ccc' : '#2196F3',
          color: 'white',
          border: 'none',
          borderRadius: '6px',
          cursor: status === 'running' ? 'not-allowed' : 'pointer',
          marginBottom: '20px'
        }}
      >
        {status === 'running' ? '🔄 Running Migration...' : '▶️ Start Migration'}
      </button>

      {logs.length > 0 && (
        <div style={{
          backgroundColor: '#1e1e1e',
          color: '#d4d4d4',
          padding: '15px',
          borderRadius: '8px',
          fontFamily: 'monospace',
          fontSize: '13px',
          maxHeight: '400px',
          overflowY: 'auto'
        }}>
          {logs.map((log, index) => (
            <div
              key={index}
              style={{
                color: log.type === 'error' ? '#f48771' : '#d4d4d4',
                marginBottom: '4px'
              }}
            >
              {log.message}
            </div>
          ))}
        </div>
      )}

      {status === 'success' && (
        <div style={{
          marginTop: '20px',
          padding: '15px',
          backgroundColor: '#e8f5e9',
          border: '1px solid #81c784',
          borderRadius: '8px'
        }}>
          <p><strong>✅ Migration Complete!</strong></p>
          <p>Players should now appear on the login screen. Refresh the page to see them.</p>
        </div>
      )}

      {status === 'error' && (
        <div style={{
          marginTop: '20px',
          padding: '15px',
          backgroundColor: '#ffebee',
          border: '1px solid #ef5350',
          borderRadius: '8px'
        }}>
          <p><strong>❌ Migration encountered errors</strong></p>
          <p>Check the console output above for details.</p>
        </div>
      )}
    </div>
  );
}

export default PlayerMigration;
