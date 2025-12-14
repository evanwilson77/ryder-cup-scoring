import React from 'react';
import PropTypes from 'prop-types';
import './AutoSaveIndicator.css';

/**
 * Simple auto-save indicator component
 * Displays "Saving..." when data is being saved
 *
 * @param {boolean} isSaving - Whether data is currently being saved
 * @param {string} text - Custom text to display (default: "Saving...")
 * @param {string} className - Additional CSS classes
 */
function AutoSaveIndicator({ isSaving, text = 'Saving...', className = '' }) {
  if (!isSaving) {
    return null;
  }

  return (
    <span className={`auto-save-indicator ${className}`}>
      {text}
    </span>
  );
}

AutoSaveIndicator.propTypes = {
  /** Whether data is currently being saved */
  isSaving: PropTypes.bool.isRequired,
  /** Custom text to display when saving */
  text: PropTypes.string,
  /** Additional CSS class names */
  className: PropTypes.string
};

export default React.memo(AutoSaveIndicator);
