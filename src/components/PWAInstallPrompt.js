import React from 'react';

function PWAInstallPrompt({ onInstall, onDismiss }) {
  return (
    <div className="pwa-install-prompt">
      <div className="icon">⛳</div>
      <div className="content">
        <h3>Install Ryder Cup App</h3>
        <p>Add to your home screen for quick access</p>
      </div>
      <div className="actions">
        <button className="install-btn" onClick={onInstall}>
          Install
        </button>
        <button className="dismiss-btn" onClick={onDismiss}>
          Not Now
        </button>
      </div>
    </div>
  );
}

export default PWAInstallPrompt;
