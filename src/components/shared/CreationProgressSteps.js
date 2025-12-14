import React from 'react';
import PropTypes from 'prop-types';
import { CheckIcon } from '@heroicons/react/24/outline';
import './CreationProgressSteps.css';

/**
 * Creation Progress Steps Component
 * Displays a multi-step progress indicator for wizard-style forms
 */
function CreationProgressSteps({ steps, currentStep }) {
  return (
    <div className="progress-steps">
      {steps.map((step, index) => (
        <div
          key={step.number}
          className={`step-item ${currentStep >= step.number ? 'active' : ''} ${
            currentStep > step.number ? 'completed' : ''
          }`}
        >
          <div className="step-indicator">
            {currentStep > step.number ? (
              <CheckIcon className="check-icon" />
            ) : (
              <span>{step.number}</span>
            )}
          </div>
          <div className="step-content">
            <div className="step-title">{step.title}</div>
            <div className="step-description">{step.description}</div>
          </div>
          {index < steps.length - 1 && <div className="step-connector"></div>}
        </div>
      ))}
    </div>
  );
}

CreationProgressSteps.propTypes = {
  /** Array of step objects */
  steps: PropTypes.arrayOf(
    PropTypes.shape({
      number: PropTypes.number.isRequired,
      title: PropTypes.string.isRequired,
      description: PropTypes.string.isRequired
    })
  ).isRequired,
  /** Current active step number */
  currentStep: PropTypes.number.isRequired
};

export default React.memo(CreationProgressSteps);
