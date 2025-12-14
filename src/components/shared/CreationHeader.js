import React from 'react';
import PropTypes from 'prop-types';
import { ArrowLeftIcon } from '@heroicons/react/24/outline';
import './CreationHeader.css';

/**
 * Creation Header Component
 * Displays header with back button for creation wizards
 */
function CreationHeader({ title, subtitle, onBack }) {
  return (
    <div className="creation-header">
      <button onClick={onBack} className="back-button">
        <ArrowLeftIcon className="icon" />
        Back to Tournaments
      </button>
      <h1>{title}</h1>
      <p>{subtitle}</p>
    </div>
  );
}

CreationHeader.propTypes = {
  /** Header title */
  title: PropTypes.string.isRequired,
  /** Header subtitle */
  subtitle: PropTypes.string.isRequired,
  /** Callback when back button is clicked */
  onBack: PropTypes.func.isRequired
};

export default CreationHeader;
