import React from 'react';
import PropTypes from 'prop-types';
import './BasicInfoStep.css';

/**
 * Basic Information Step Component
 * First step in tournament creation - captures basic tournament details
 */
function BasicInfoStep({ formData, errors, series, onChange }) {
  return (
    <div className="form-step">
      <h2>Basic Information</h2>
      <p className="step-subtitle">Enter the essential details for your tournament</p>

      <div className="form-group">
        <label>Tournament Series</label>
        <select
          value={formData.seriesId || ''}
          onChange={(e) => onChange({ ...formData, seriesId: e.target.value || null })}
          className="form-select"
        >
          <option value="">No Series (Standalone Tournament)</option>
          {series.map(s => (
            <option key={s.id} value={s.id}>{s.name}</option>
          ))}
        </select>
        <p className="field-hint">Optional: Assign to a tournament series or leave standalone</p>
      </div>

      <div className="form-group">
        <label>Tournament Name *</label>
        <input
          type="text"
          value={formData.name}
          onChange={(e) => onChange({ ...formData, name: e.target.value })}
          className={`form-input ${errors.name ? 'error' : ''}`}
          placeholder="e.g., Autumn Classic 2025"
        />
        {errors.name && <p className="error-message">{errors.name}</p>}
      </div>

      <div className="form-group">
        <label>Edition / Year</label>
        <input
          type="text"
          value={formData.edition}
          onChange={(e) => onChange({ ...formData, edition: e.target.value })}
          className="form-input"
          placeholder="e.g., 2025, October 2025"
        />
        <p className="field-hint">Optional: Specify the edition or year for this tournament</p>
      </div>

      <div className="form-row">
        <div className="form-group">
          <label>Start Date *</label>
          <input
            type="date"
            value={formData.startDate}
            onChange={(e) => onChange({ ...formData, startDate: e.target.value })}
            className={`form-input ${errors.startDate ? 'error' : ''}`}
          />
          {errors.startDate && <p className="error-message">{errors.startDate}</p>}
        </div>

        <div className="form-group">
          <label>End Date *</label>
          <input
            type="date"
            value={formData.endDate}
            onChange={(e) => onChange({ ...formData, endDate: e.target.value })}
            className={`form-input ${errors.endDate ? 'error' : ''}`}
          />
          {errors.endDate && <p className="error-message">{errors.endDate}</p>}
        </div>
      </div>

      <div className="form-group">
        <label>Tournament Type *</label>
        <div className="radio-group">
          <label className="radio-option">
            <input
              type="radio"
              name="tournamentType"
              checked={!formData.hasTeams}
              onChange={() => onChange({ ...formData, hasTeams: false })}
            />
            <span>Individual Tournament</span>
            <p className="radio-hint">Players compete individually</p>
          </label>
          <label className="radio-option">
            <input
              type="radio"
              name="tournamentType"
              checked={formData.hasTeams}
              onChange={() => onChange({ ...formData, hasTeams: true })}
            />
            <span>Team Tournament</span>
            <p className="radio-hint">Players compete in teams (e.g., Ryder Cup, Scramble)</p>
          </label>
        </div>
        <p className="field-hint">Round formats will be configured in the next step</p>
      </div>
    </div>
  );
}

BasicInfoStep.propTypes = {
  /** Current form data */
  formData: PropTypes.shape({
    seriesId: PropTypes.string,
    name: PropTypes.string.isRequired,
    edition: PropTypes.string,
    startDate: PropTypes.string.isRequired,
    endDate: PropTypes.string.isRequired,
    hasTeams: PropTypes.bool.isRequired
  }).isRequired,
  /** Validation errors */
  errors: PropTypes.object.isRequired,
  /** Available tournament series */
  series: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.string.isRequired,
      name: PropTypes.string.isRequired
    })
  ).isRequired,
  /** Callback when form data changes */
  onChange: PropTypes.func.isRequired
};

export default BasicInfoStep;
