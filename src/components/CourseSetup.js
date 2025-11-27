import React, { useEffect, useState } from 'react';
import {
  subscribeToHoles,
  updateCourse,
  getCourse,
  setHole,
  saveCourseConfiguration,
  loadCourseConfiguration,
  subscribeToSavedCourses,
  deleteSavedCourse
} from '../firebase/services';
import { COURSE_TEMPLATES, parseScorecardText } from '../utils/courseSearch';
import './CourseSetup.css';

function CourseSetup() {
  const [holes, setHoles] = useState([]);
  const [courseName, setCourseName] = useState('Default Course');
  const [editing, setEditing] = useState(false);
  const [savedCourses, setSavedCourses] = useState([]);
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [showLoadDialog, setShowLoadDialog] = useState(false);
  const [showTemplates, setShowTemplates] = useState(false);
  const [showPasteDialog, setShowPasteDialog] = useState(false);
  const [saveCourseName, setSaveCourseName] = useState('');
  const [pasteText, setPasteText] = useState('');

  useEffect(() => {
    const unsubscribeHoles = subscribeToHoles(setHoles);
    const unsubscribeCourses = subscribeToSavedCourses(setSavedCourses);

    getCourse().then(course => {
      if (course) {
        setCourseName(course.name || 'Default Course');
      }
    });

    return () => {
      unsubscribeHoles();
      unsubscribeCourses();
    };
  }, []);

  const handleHoleUpdate = async (holeId, field, value) => {
    const hole = holes.find(h => h.id === holeId);
    if (hole) {
      await setHole(holeId, {
        ...hole,
        [field]: parseInt(value) || 0
      });
    }
  };

  const handleSaveCourseName = async () => {
    await updateCourse({
      name: courseName,
      totalPar: holes.reduce((sum, h) => sum + (h.par || 0), 0),
      holesCount: 18
    });
    setEditing(false);
  };

  const handleSaveCourse = async () => {
    if (!saveCourseName.trim()) {
      alert('Please enter a course name');
      return;
    }

    try {
      await saveCourseConfiguration(saveCourseName, holes);
      alert('Course configuration saved!');
      setShowSaveDialog(false);
      setSaveCourseName('');
    } catch (error) {
      console.error('Error saving course:', error);
      alert('Error saving course: ' + error.message);
    }
  };

  const handleLoadCourse = async (courseId) => {
    try {
      await loadCourseConfiguration(courseId, holes);
      const loadedCourse = savedCourses.find(c => c.id === courseId);
      if (loadedCourse) {
        setCourseName(loadedCourse.name);
      }
      setShowLoadDialog(false);
      alert('Course loaded successfully!');
    } catch (error) {
      console.error('Error loading course:', error);
      alert('Error loading course: ' + error.message);
    }
  };

  const handleLoadTemplate = async (templateKey) => {
    const template = COURSE_TEMPLATES[templateKey];
    if (!template) return;

    try {
      // Update all holes with template data
      const updatePromises = template.holes.map((holeData) => {
        const holeId = `hole${holeData.number}`;
        return setHole(holeId, holeData);
      });

      await Promise.all(updatePromises);

      // Update course info
      await updateCourse({
        name: template.name,
        totalPar: template.holes.reduce((sum, h) => sum + (h.par || 0), 0),
        holesCount: 18
      });

      setCourseName(template.name);
      setShowTemplates(false);
      alert(`Loaded ${template.name} template!`);
    } catch (error) {
      console.error('Error loading template:', error);
      alert('Error loading template: ' + error.message);
    }
  };

  const handleParseScorecardText = async () => {
    const result = parseScorecardText(pasteText);

    if (!result.success) {
      alert(`Could only parse ${result.found} holes. Please ensure format is correct.\n\nExpected format:\nHole 1: Par 4, SI 7\nOr simple numbers: hole numbers, then pars, then stroke indexes`);
      return;
    }

    try {
      // Update all holes with parsed data
      const updatePromises = result.holes.map((holeData) => {
        const holeId = `hole${holeData.number}`;
        return setHole(holeId, holeData);
      });

      await Promise.all(updatePromises);

      const totalPar = result.holes.reduce((sum, h) => sum + (h.par || 0), 0);
      await updateCourse({
        name: courseName,
        totalPar: totalPar,
        holesCount: 18
      });

      setShowPasteDialog(false);
      setPasteText('');
      alert('Scorecard data loaded successfully!');
    } catch (error) {
      console.error('Error loading scorecard:', error);
      alert('Error loading scorecard: ' + error.message);
    }
  };

  const handleDeleteSavedCourse = async (courseId, courseName) => {
    if (window.confirm(`Delete saved course "${courseName}"?`)) {
      try {
        await deleteSavedCourse(courseId);
      } catch (error) {
        console.error('Error deleting course:', error);
        alert('Error deleting course: ' + error.message);
      }
    }
  };

  const totalPar = holes.reduce((sum, h) => sum + (h.par || 0), 0);
  const frontNinePar = holes.slice(0, 9).reduce((sum, h) => sum + (h.par || 0), 0);
  const backNinePar = holes.slice(9, 18).reduce((sum, h) => sum + (h.par || 0), 0);

  return (
    <div className="course-setup">
      <div className="card">
        <div className="course-header">
          <div>
            <h2>Course Setup</h2>
            <p className="description">Configure hole details including par and stroke index</p>
          </div>
          <div className="course-actions">
            {editing ? (
              <div className="course-name-edit">
                <input
                  type="text"
                  value={courseName}
                  onChange={(e) => setCourseName(e.target.value)}
                  autoFocus
                />
                <button className="button small" onClick={handleSaveCourseName}>
                  Save
                </button>
              </div>
            ) : (
              <div className="course-name">
                <h3>{courseName}</h3>
                <button className="button small secondary" onClick={() => setEditing(true)}>
                  Edit Name
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="card">
        <div className="course-stats">
          <div className="stat">
            <span className="stat-label">Total Par</span>
            <span className="stat-value">{totalPar}</span>
          </div>
          <div className="stat">
            <span className="stat-label">Front 9</span>
            <span className="stat-value">{frontNinePar}</span>
          </div>
          <div className="stat">
            <span className="stat-label">Back 9</span>
            <span className="stat-value">{backNinePar}</span>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="card">
        <h3>Quick Actions</h3>
        <div className="quick-actions-grid">
          <button className="button" onClick={() => setShowTemplates(true)}>
            📋 Load Template
          </button>
          <button className="button" onClick={() => setShowPasteDialog(true)}>
            📝 Paste Scorecard
          </button>
          <button className="button" onClick={() => setShowSaveDialog(true)}>
            💾 Save Configuration
          </button>
          <button className="button secondary" onClick={() => setShowLoadDialog(true)}>
            📂 Load Saved Course
          </button>
        </div>
      </div>

      <div className="holes-container">
        <div className="card">
          <h3>Front Nine</h3>
          <div className="holes-table">
            <div className="table-header">
              <div>Hole</div>
              <div>Par</div>
              <div>Stroke Index</div>
            </div>
            {holes.slice(0, 9).map(hole => (
              <div key={hole.id} className="hole-row">
                <div className="hole-number">{hole.number}</div>
                <div>
                  <input
                    type="number"
                    value={hole.par || 0}
                    onChange={(e) => handleHoleUpdate(hole.id, 'par', e.target.value)}
                    min="3"
                    max="6"
                    className="hole-input"
                  />
                </div>
                <div>
                  <input
                    type="number"
                    value={hole.strokeIndex || 0}
                    onChange={(e) => handleHoleUpdate(hole.id, 'strokeIndex', e.target.value)}
                    min="1"
                    max="18"
                    className="hole-input"
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="card">
          <h3>Back Nine</h3>
          <div className="holes-table">
            <div className="table-header">
              <div>Hole</div>
              <div>Par</div>
              <div>Stroke Index</div>
            </div>
            {holes.slice(9, 18).map(hole => (
              <div key={hole.id} className="hole-row">
                <div className="hole-number">{hole.number}</div>
                <div>
                  <input
                    type="number"
                    value={hole.par || 0}
                    onChange={(e) => handleHoleUpdate(hole.id, 'par', e.target.value)}
                    min="3"
                    max="6"
                    className="hole-input"
                  />
                </div>
                <div>
                  <input
                    type="number"
                    value={hole.strokeIndex || 0}
                    onChange={(e) => handleHoleUpdate(hole.id, 'strokeIndex', e.target.value)}
                    min="1"
                    max="18"
                    className="hole-input"
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="card info-box">
        <h4>ℹ️ About Stroke Index</h4>
        <p>
          Stroke index determines the order of difficulty for handicap allocation.
          Index 1 is the hardest hole, 18 is the easiest. A player with handicap 10
          receives strokes on holes with stroke index 1-10.
        </p>
      </div>

      {/* Save Dialog */}
      {showSaveDialog && (
        <div className="modal-overlay" onClick={() => setShowSaveDialog(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h3>Save Course Configuration</h3>
            <p>Save the current course setup to reuse later</p>
            <div className="input-group">
              <label>Course Name</label>
              <input
                type="text"
                value={saveCourseName}
                onChange={(e) => setSaveCourseName(e.target.value)}
                placeholder="e.g., Pines Golf Club"
                autoFocus
              />
            </div>
            <div className="modal-actions">
              <button className="button secondary" onClick={() => setShowSaveDialog(false)}>
                Cancel
              </button>
              <button className="button" onClick={handleSaveCourse}>
                Save
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Load Dialog */}
      {showLoadDialog && (
        <div className="modal-overlay" onClick={() => setShowLoadDialog(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h3>Load Saved Course</h3>
            {savedCourses.length === 0 ? (
              <p>No saved courses yet. Save your current configuration first!</p>
            ) : (
              <div className="saved-courses-list">
                {savedCourses.map(course => (
                  <div key={course.id} className="saved-course-item">
                    <div>
                      <h4>{course.name}</h4>
                      <p>Par {course.totalPar} • Saved {new Date(course.savedAt).toLocaleDateString()}</p>
                    </div>
                    <div className="saved-course-actions">
                      <button
                        className="button small"
                        onClick={() => handleLoadCourse(course.id)}
                      >
                        Load
                      </button>
                      <button
                        className="button small danger"
                        onClick={() => handleDeleteSavedCourse(course.id, course.name)}
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
            <div className="modal-actions">
              <button className="button secondary" onClick={() => setShowLoadDialog(false)}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Templates Dialog */}
      {showTemplates && (
        <div className="modal-overlay" onClick={() => setShowTemplates(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h3>Course Templates</h3>
            <p>Load pre-configured course layouts</p>
            <div className="templates-grid">
              {Object.entries(COURSE_TEMPLATES).map(([key, template]) => (
                <div key={key} className="template-card">
                  <h4>{template.name}</h4>
                  <p>Par {template.holes.reduce((sum, h) => sum + h.par, 0)}</p>
                  <button
                    className="button small"
                    onClick={() => handleLoadTemplate(key)}
                  >
                    Load Template
                  </button>
                </div>
              ))}
            </div>
            <div className="modal-actions">
              <button className="button secondary" onClick={() => setShowTemplates(false)}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Paste Scorecard Dialog */}
      {showPasteDialog && (
        <div className="modal-overlay" onClick={() => setShowPasteDialog(false)}>
          <div className="modal large" onClick={(e) => e.stopPropagation()}>
            <h3>Paste Scorecard Data</h3>
            <p>Paste scorecard text from a website or PDF. Supported formats:</p>
            <ul className="format-list">
              <li>Hole 1: Par 4, SI 7</li>
              <li>1 | 4 | 7 (hole, par, stroke index)</li>
              <li>Or paste three rows of numbers (holes, pars, stroke indexes)</li>
            </ul>
            <div className="input-group">
              <label>Scorecard Text</label>
              <textarea
                value={pasteText}
                onChange={(e) => setPasteText(e.target.value)}
                placeholder="Paste scorecard data here..."
                rows={10}
                style={{ width: '100%', padding: '0.75rem', fontFamily: 'monospace' }}
              />
            </div>
            <div className="modal-actions">
              <button className="button secondary" onClick={() => setShowPasteDialog(false)}>
                Cancel
              </button>
              <button className="button" onClick={handleParseScorecardText}>
                Parse & Load
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default CourseSetup;
