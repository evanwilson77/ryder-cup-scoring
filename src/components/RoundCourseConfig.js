import React, { useState, useEffect } from 'react';
import { getSavedCourses } from '../firebase/services';
import { XMarkIcon, DocumentDuplicateIcon, PencilSquareIcon } from '@heroicons/react/24/outline';
import './RoundCourseConfig.css';

function RoundCourseConfig({ round, onSave, onClose }) {
  const [savedCourses, setSavedCourses] = useState([]);
  const [configMode, setConfigMode] = useState('select'); // 'select', 'manual'
  const [courseData, setCourseData] = useState({
    holes: round.courseData?.holes || [],
    totalPar: round.courseData?.totalPar || 0
  });
  const [courseName, setCourseName] = useState(round.courseName ? String(round.courseName) : '');
  const [teeBox, setTeeBox] = useState(round.teeBox || '');
  const [teeColor, setTeeColor] = useState(round.teeColor || '');
  const [savedCourseId, setSavedCourseId] = useState(round.savedCourseId || null);

  useEffect(() => {
    loadSavedCourses();
  }, []);

  const loadSavedCourses = async () => {
    try {
      const courses = await getSavedCourses();
      setSavedCourses(courses);
    } catch (error) {
      console.error('Error loading courses:', error);
    }
  };

  const handleCopyCourse = (course) => {
    setCourseData({
      holes: course.holes,
      totalPar: course.totalPar
    });
    setCourseName(course.courseName || '');
    setTeeBox(course.teeBox || '');
    setTeeColor(course.teeColor || '');
    setSavedCourseId(course.id || null);
  };

  const handleManualConfig = () => {
    // Initialize with default 18 holes if empty
    if (courseData.holes.length === 0) {
      const defaultHoles = Array.from({ length: 18 }, (_, i) => ({
        number: i + 1,
        par: 4,
        strokeIndex: i + 1
      }));
      setCourseData({
        holes: defaultHoles,
        totalPar: 72
      });
    }
    setConfigMode('manual');
  };

  const handleHoleChange = (holeIndex, field, value) => {
    const newHoles = [...courseData.holes];
    newHoles[holeIndex] = {
      ...newHoles[holeIndex],
      [field]: parseInt(value)
    };

    // Recalculate total par
    const totalPar = newHoles.reduce((sum, hole) => sum + (hole.par || 0), 0);

    setCourseData({
      holes: newHoles,
      totalPar
    });
  };

  const handleSave = () => {
    if (!courseName.trim()) {
      alert('Please enter a course name');
      return;
    }

    if (courseData.holes.length !== 18) {
      alert('Course must have 18 holes configured');
      return;
    }

    onSave({
      savedCourseId,
      courseName,
      teeBox,
      teeColor,
      courseData
    });
  };

  const handleQuickFill = (parValue) => {
    const newHoles = courseData.holes.map(hole => ({
      ...hole,
      par: parValue
    }));

    const totalPar = parValue * 18;

    setCourseData({
      holes: newHoles,
      totalPar
    });
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content course-config-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div>
            <h2>Configure Course for {round.name}</h2>
            <p className="modal-subtitle">Set up hole details for this round</p>
          </div>
          <button onClick={onClose} className="modal-close">
            <XMarkIcon className="icon" />
          </button>
        </div>

        <div className="modal-body">
          {/* Course Name Input */}
          <div className="form-group">
            <label>Course Name</label>
            <input
              type="text"
              value={courseName}
              onChange={(e) => setCourseName(e.target.value)}
              className="form-input"
              placeholder="e.g., Akarana Golf Course"
            />
          </div>

          {/* Mode Selection */}
          {configMode === 'select' && (
            <>
              <div className="config-mode-section">
                <h3>Choose Configuration Method</h3>

                {/* Saved Courses */}
                {savedCourses.length > 0 && (
                  <div className="saved-courses-section">
                    <h4>
                      <DocumentDuplicateIcon className="section-icon" />
                      Copy from Saved Course
                    </h4>
                    <div className="saved-courses-grid">
                      {savedCourses.map(course => (
                        <div
                          key={course.id}
                          className="saved-course-card"
                          onClick={() => handleCopyCourse(course)}
                        >
                          <div className="course-card-name">{course.courseName}</div>
                          <div className="course-card-details">
                            {course.teeBox && `${course.teeBox} Tees • `}
                            Par {course.totalPar} • {course.holes.length} holes
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Manual Configuration */}
                <div className="manual-config-section">
                  <h4>
                    <PencilSquareIcon className="section-icon" />
                    Manual Configuration
                  </h4>
                  <p>Configure each hole individually</p>
                  <button onClick={handleManualConfig} className="button primary">
                    Start Manual Configuration
                  </button>
                </div>
              </div>
            </>
          )}

          {/* Manual Configuration View */}
          {configMode === 'manual' && (
            <div className="manual-config-view">
              <div className="config-header">
                <h3>Hole Configuration</h3>
                <div className="quick-fill-buttons">
                  <span className="quick-fill-label">Quick Fill Par:</span>
                  <button onClick={() => handleQuickFill(3)} className="button secondary small">All Par 3</button>
                  <button onClick={() => handleQuickFill(4)} className="button secondary small">All Par 4</button>
                  <button onClick={() => handleQuickFill(5)} className="button secondary small">All Par 5</button>
                </div>
              </div>

              <div className="course-summary">
                <div className="summary-item">
                  <span className="summary-label">Total Par:</span>
                  <span className="summary-value">{courseData.totalPar}</span>
                </div>
                <div className="summary-item">
                  <span className="summary-label">Holes:</span>
                  <span className="summary-value">{courseData.holes.length}/18</span>
                </div>
              </div>

              <div className="holes-grid">
                {courseData.holes.map((hole, index) => (
                  <div key={hole.number} className="hole-config-card">
                    <div className="hole-number">Hole {hole.number}</div>
                    <div className="hole-inputs">
                      <div className="input-group">
                        <label>Par</label>
                        <select
                          value={hole.par}
                          onChange={(e) => handleHoleChange(index, 'par', e.target.value)}
                          className="hole-select"
                        >
                          <option value="3">3</option>
                          <option value="4">4</option>
                          <option value="5">5</option>
                        </select>
                      </div>
                      <div className="input-group">
                        <label>SI</label>
                        <input
                          type="number"
                          min="1"
                          max="18"
                          value={hole.strokeIndex}
                          onChange={(e) => handleHoleChange(index, 'strokeIndex', e.target.value)}
                          className="hole-input"
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="config-actions">
                <button onClick={() => setConfigMode('select')} className="button secondary">
                  Back to Selection
                </button>
              </div>
            </div>
          )}
        </div>

        <div className="modal-footer">
          <button onClick={onClose} className="button secondary">
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="button primary"
            disabled={courseData.holes.length !== 18 || !courseName.trim()}
          >
            Save Course Configuration
          </button>
        </div>
      </div>
    </div>
  );
}

export default RoundCourseConfig;
