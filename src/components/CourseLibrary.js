import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  getSavedCourses,
  saveCourseConfiguration,
  updateSavedCourse,
  deleteSavedCourse
} from '../firebase/services';
import { ArrowLeftIcon, PencilIcon, TrashIcon, PlusIcon } from '@heroicons/react/24/outline';
import './CourseLibrary.css';

const TEE_COLORS = [
  { value: 'black', label: 'Black (Championship)', color: '#1a1a1a' },
  { value: 'blue', label: 'Blue (Back)', color: '#2563eb' },
  { value: 'white', label: 'White (Regular)', color: '#ffffff', border: true },
  { value: 'gold', label: 'Gold (Senior)', color: '#fbbf24' },
  { value: 'red', label: 'Red (Forward)', color: '#dc2626' },
  { value: 'green', label: 'Green (Junior)', color: '#16a34a' }
];

function CourseLibrary() {
  const navigate = useNavigate();
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showEditor, setShowEditor] = useState(false);
  const [editingCourse, setEditingCourse] = useState(null);

  useEffect(() => {
    loadCourses();
  }, []);

  const loadCourses = async () => {
    try {
      const savedCourses = await getSavedCourses();
      setCourses(savedCourses);
      setLoading(false);
    } catch (error) {
      console.error('Error loading courses:', error);
      setLoading(false);
    }
  };

  const handleCreateNew = () => {
    setEditingCourse({
      courseName: '',
      teeBox: '',
      teeColor: 'white',
      rating: '',
      slope: 113,
      holes: Array.from({ length: 18 }, (_, i) => ({
        number: i + 1,
        par: 4,
        strokeIndex: i + 1,
        yardage: 400
      }))
    });
    setShowEditor(true);
  };

  const handleEdit = (course) => {
    setEditingCourse({ ...course });
    setShowEditor(true);
  };

  const handleDelete = async (courseId) => {
    if (window.confirm('Delete this course configuration? This cannot be undone.')) {
      try {
        await deleteSavedCourse(courseId);
        loadCourses();
      } catch (error) {
        console.error('Error deleting course:', error);
        alert('Failed to delete course. Please try again.');
      }
    }
  };

  const handleSave = async () => {
    try {
      if (editingCourse.id) {
        // Update existing
        await updateSavedCourse(editingCourse.id, {
          courseName: editingCourse.courseName,
          teeBox: editingCourse.teeBox,
          teeColor: editingCourse.teeColor,
          holes: editingCourse.holes,
          rating: editingCourse.rating ? parseFloat(editingCourse.rating) : null,
          slope: editingCourse.slope ? parseInt(editingCourse.slope) : 113
        });
      } else {
        // Create new
        await saveCourseConfiguration(editingCourse);
      }
      setShowEditor(false);
      setEditingCourse(null);
      loadCourses();
    } catch (error) {
      console.error('Error saving course:', error);
      alert('Failed to save course. Please try again.');
    }
  };

  const updateHole = (holeIndex, field, value) => {
    const updatedHoles = [...editingCourse.holes];
    updatedHoles[holeIndex] = {
      ...updatedHoles[holeIndex],
      [field]: field === 'par' || field === 'strokeIndex' || field === 'yardage'
        ? parseInt(value) || 0
        : value
    };
    setEditingCourse({ ...editingCourse, holes: updatedHoles });
  };

  const getTeeColorDisplay = (colorValue) => {
    const tee = TEE_COLORS.find(t => t.value === colorValue);
    return tee ? tee.label.split(' ')[0] : colorValue;
  };

  if (loading) {
    return (
      <div className="course-library">
        <div className="loading-spinner">
          <div className="spinner"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="course-library">
      <div className="library-header">
        <button onClick={() => navigate(-1)} className="back-button">
          <ArrowLeftIcon className="icon" />
          Back
        </button>
        <div>
          <h1>Course Library</h1>
          <p className="subtitle">Manage saved course configurations</p>
        </div>
        <button onClick={handleCreateNew} className="button primary">
          <PlusIcon className="icon" />
          New Course
        </button>
      </div>

      <div className="courses-grid">
        {courses.map(course => (
          <div key={course.id} className="course-card card">
            <div className="course-header">
              <div>
                <h3>{course.courseName}</h3>
                <div className="course-tee">
                  <span
                    className="tee-indicator"
                    style={{
                      backgroundColor: TEE_COLORS.find(t => t.value === course.teeColor)?.color || '#ccc',
                      border: course.teeColor === 'white' ? '2px solid #ccc' : 'none'
                    }}
                  ></span>
                  {course.teeBox} Tees
                </div>
              </div>
              <div className="course-actions">
                <button onClick={() => handleEdit(course)} className="button small secondary">
                  <PencilIcon className="icon" />
                  Edit
                </button>
                <button onClick={() => handleDelete(course.id)} className="button small danger">
                  <TrashIcon className="icon" />
                </button>
              </div>
            </div>

            <div className="course-stats">
              <div className="stat">
                <span className="stat-label">Par</span>
                <span className="stat-value">{course.totalPar}</span>
              </div>
              <div className="stat">
                <span className="stat-label">Meters</span>
                <span className="stat-value">{course.totalYardage?.toLocaleString() || 'N/A'}</span>
              </div>
              {course.rating && (
                <div className="stat">
                  <span className="stat-label">Rating</span>
                  <span className="stat-value">{course.rating}</span>
                </div>
              )}
              {course.slope && (
                <div className="stat">
                  <span className="stat-label">Slope</span>
                  <span className="stat-value">{course.slope}</span>
                </div>
              )}
            </div>
          </div>
        ))}

        {courses.length === 0 && (
          <div className="empty-state">
            <h3>No Saved Courses</h3>
            <p>Create your first course configuration to get started</p>
            <button onClick={handleCreateNew} className="button primary">
              <PlusIcon className="icon" />
              Create Course
            </button>
          </div>
        )}
      </div>

      {/* Course Editor Modal */}
      {showEditor && editingCourse && (
        <div className="modal-overlay" onClick={() => {}}>
          <div className="modal-large" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{editingCourse.id ? 'Edit Course' : 'New Course'}</h2>
              <button onClick={() => setShowEditor(false)} className="close-button">×</button>
            </div>

            <div className="modal-body">
              {/* Basic Info */}
              <div className="form-section">
                <h3>Course Information</h3>
                <div className="form-row">
                  <div className="form-group">
                    <label>Course Name *</label>
                    <input
                      type="text"
                      value={editingCourse.courseName}
                      onChange={(e) => setEditingCourse({ ...editingCourse, courseName: e.target.value })}
                      placeholder="e.g., Akarana Golf Club"
                      className="form-input"
                    />
                  </div>
                  <div className="form-group">
                    <label>Tee Box Name *</label>
                    <input
                      type="text"
                      value={editingCourse.teeBox}
                      onChange={(e) => setEditingCourse({ ...editingCourse, teeBox: e.target.value })}
                      placeholder="e.g., Championship, Men's"
                      className="form-input"
                    />
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label>Tee Color *</label>
                    <select
                      value={editingCourse.teeColor}
                      onChange={(e) => setEditingCourse({ ...editingCourse, teeColor: e.target.value })}
                      className="form-select"
                    >
                      {TEE_COLORS.map(tee => (
                        <option key={tee.value} value={tee.value}>{tee.label}</option>
                      ))}
                    </select>
                  </div>
                  <div className="form-group">
                    <label>Course Rating</label>
                    <input
                      type="number"
                      step="0.1"
                      value={editingCourse.rating}
                      onChange={(e) => setEditingCourse({ ...editingCourse, rating: e.target.value })}
                      placeholder="e.g., 71.8"
                      className="form-input"
                    />
                  </div>
                  <div className="form-group">
                    <label>Slope Rating</label>
                    <input
                      type="number"
                      value={editingCourse.slope}
                      onChange={(e) => setEditingCourse({ ...editingCourse, slope: e.target.value })}
                      placeholder="113 (average)"
                      className="form-input"
                    />
                  </div>
                </div>
              </div>

              {/* Holes Configuration */}
              <div className="form-section">
                <h3>Hole Configuration</h3>
                <div className="holes-table">
                  <table>
                    <thead>
                      <tr>
                        <th>Hole</th>
                        <th>Par</th>
                        <th>Stroke Index</th>
                        <th>Meters</th>
                      </tr>
                    </thead>
                    <tbody>
                      {editingCourse.holes.map((hole, index) => (
                        <tr key={index}>
                          <td>{hole.number}</td>
                          <td>
                            <input
                              type="number"
                              min="3"
                              max="5"
                              value={hole.par}
                              onChange={(e) => updateHole(index, 'par', e.target.value)}
                              className="hole-input"
                            />
                          </td>
                          <td>
                            <input
                              type="number"
                              min="1"
                              max="18"
                              value={hole.strokeIndex}
                              onChange={(e) => updateHole(index, 'strokeIndex', e.target.value)}
                              className="hole-input"
                            />
                          </td>
                          <td>
                            <input
                              type="number"
                              min="0"
                              value={hole.yardage}
                              onChange={(e) => updateHole(index, 'yardage', e.target.value)}
                              className="hole-input"
                            />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot>
                      <tr>
                        <td><strong>Total</strong></td>
                        <td><strong>{editingCourse.holes.reduce((sum, h) => sum + h.par, 0)}</strong></td>
                        <td></td>
                        <td><strong>{editingCourse.holes.reduce((sum, h) => sum + h.yardage, 0)}</strong></td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </div>
            </div>

            <div className="modal-footer">
              <button onClick={() => setShowEditor(false)} className="button secondary">
                Cancel
              </button>
              <button onClick={handleSave} className="button primary">
                Save Course
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default CourseLibrary;
