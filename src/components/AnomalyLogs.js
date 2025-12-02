import React, { useState, useEffect } from 'react';
import { collection, query, orderBy, limit, getDocs, where } from 'firebase/firestore';
import { db } from '../firebase/config';
import { useAuth } from '../contexts/AuthContext';
import './AnomalyLogs.css';

function AnomalyLogs() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all'); // all, unauthorized_scoring, auth, data
  const [timeRange, setTimeRange] = useState('7days');
  const { isAdmin } = useAuth();

  useEffect(() => {
    if (!isAdmin) return;
    loadLogs();
  }, [isAdmin, filter, timeRange]);

  const loadLogs = async () => {
    setLoading(true);
    try {
      let q = query(
        collection(db, 'anomalyLogs'),
        orderBy('timestamp', 'desc'),
        limit(100)
      );

      // Apply filters
      if (filter !== 'all') {
        const typeMap = {
          'unauthorized_scoring': 'UNAUTHORIZED_SCORING',
          'auth': 'AUTH_ANOMALY',
          'data': 'DATA_MODIFICATION'
        };
        q = query(q, where('type', '==', typeMap[filter]));
      }

      const snapshot = await getDocs(q);
      const logsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        timestamp: doc.data().timestamp?.toDate() || new Date()
      }));

      // Filter by time range
      const now = new Date();
      const filtered = logsData.filter(log => {
        const logDate = new Date(log.timestamp);
        const daysDiff = (now - logDate) / (1000 * 60 * 60 * 24);

        if (timeRange === '24hours') return daysDiff <= 1;
        if (timeRange === '7days') return daysDiff <= 7;
        if (timeRange === '30days') return daysDiff <= 30;
        return true; // all
      });

      setLogs(filtered);
    } catch (error) {
      console.error('Error loading anomaly logs:', error);
    } finally {
      setLoading(false);
    }
  };

  const getSeverityColor = (severity) => {
    switch (severity) {
      case 'HIGH': return '#ef5350';
      case 'MEDIUM': return '#ff9800';
      case 'LOW': return '#ffc107';
      default: return '#9e9e9e';
    }
  };

  const getTypeIcon = (type) => {
    switch (type) {
      case 'UNAUTHORIZED_SCORING': return '⚠️';
      case 'AUTH_ANOMALY': return '🔐';
      case 'DATA_MODIFICATION': return '📝';
      case 'RAPID_CHANGES': return '⚡';
      case 'SUSPICIOUS_PATTERN': return '🔍';
      default: return '📋';
    }
  };

  if (!isAdmin) {
    return (
      <div className="anomaly-logs-container">
        <div className="access-denied">
          <p><strong>Access Denied</strong></p>
          <p>Only admins can view anomaly logs.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="anomaly-logs-container">
      <div className="anomaly-logs-header">
        <h2>🔍 Anomaly Logs</h2>
        <p>Monitor suspicious activities and unusual patterns</p>
      </div>

      <div className="anomaly-filters">
        <div className="filter-group">
          <label>Type:</label>
          <select value={filter} onChange={(e) => setFilter(e.target.value)}>
            <option value="all">All Types</option>
            <option value="unauthorized_scoring">Unauthorized Scoring</option>
            <option value="auth">Authentication</option>
            <option value="data">Data Modifications</option>
          </select>
        </div>

        <div className="filter-group">
          <label>Time Range:</label>
          <select value={timeRange} onChange={(e) => setTimeRange(e.target.value)}>
            <option value="24hours">Last 24 Hours</option>
            <option value="7days">Last 7 Days</option>
            <option value="30days">Last 30 Days</option>
            <option value="all">All Time</option>
          </select>
        </div>

        <button onClick={loadLogs} className="refresh-btn">
          🔄 Refresh
        </button>
      </div>

      {loading ? (
        <div className="loading-state">
          <div className="spinner"></div>
          <p>Loading logs...</p>
        </div>
      ) : logs.length === 0 ? (
        <div className="empty-state">
          <p>✅ No anomalies detected!</p>
          <p style={{ fontSize: '14px', color: '#666' }}>
            This is good - no suspicious activity in the selected time range.
          </p>
        </div>
      ) : (
        <div className="anomaly-logs-list">
          {logs.map(log => (
            <div key={log.id} className="anomaly-log-item">
              <div className="log-header">
                <span className="log-icon">{getTypeIcon(log.type)}</span>
                <span className="log-type">{log.type}</span>
                <span
                  className="log-severity"
                  style={{ backgroundColor: getSeverityColor(log.severity) }}
                >
                  {log.severity}
                </span>
                <span className="log-time">
                  {log.timestamp.toLocaleString()}
                </span>
              </div>

              <div className="log-description">
                {log.description || 'No description'}
              </div>

              <div className="log-details">
                {log.userEmail && (
                  <div className="log-detail">
                    <strong>User:</strong> {log.userEmail}
                    {log.playerName && ` (${log.playerName})`}
                  </div>
                )}
                {log.action && (
                  <div className="log-detail">
                    <strong>Action:</strong> {log.action}
                  </div>
                )}
                {log.targetType && (
                  <div className="log-detail">
                    <strong>Target:</strong> {log.targetType}
                    {log.targetName && ` - ${log.targetName}`}
                  </div>
                )}
              </div>

              {log.metadata && Object.keys(log.metadata).length > 0 && (
                <details className="log-metadata">
                  <summary>View Metadata</summary>
                  <pre>{JSON.stringify(log.metadata, null, 2)}</pre>
                </details>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default AnomalyLogs;
