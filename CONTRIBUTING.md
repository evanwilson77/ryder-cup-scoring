# Contributing to Ryder Cup Scoring App

Thank you for your interest in contributing! This document provides guidelines and instructions for contributing to the project.

## Table of Contents

- [Code of Conduct](#code-of-conduct)
- [Getting Started](#getting-started)
- [Development Workflow](#development-workflow)
- [Code Standards](#code-standards)
- [Testing Guidelines](#testing-guidelines)
- [Commit Guidelines](#commit-guidelines)
- [Pull Request Process](#pull-request-process)
- [Architecture Guidelines](#architecture-guidelines)

## Code of Conduct

### Our Pledge

We are committed to providing a welcoming and inclusive experience for everyone. We expect all contributors to:

- Be respectful and considerate
- Accept constructive criticism gracefully
- Focus on what's best for the community
- Show empathy towards others

### Unacceptable Behavior

- Harassment or discriminatory language
- Trolling or insulting comments
- Publishing others' private information
- Other conduct that could be considered inappropriate

## Getting Started

### Prerequisites

- Node.js v14 or higher
- npm or yarn
- Firebase account
- Git
- Code editor (VS Code recommended)

### Setting Up Development Environment

1. **Fork the Repository**
   ```bash
   # Visit https://github.com/your-repo/ryder-cup-scoring
   # Click "Fork" button
   ```

2. **Clone Your Fork**
   ```bash
   git clone https://github.com/YOUR_USERNAME/ryder-cup-scoring.git
   cd ryder-cup-scoring
   ```

3. **Add Upstream Remote**
   ```bash
   git remote add upstream https://github.com/original-repo/ryder-cup-scoring.git
   ```

4. **Install Dependencies**
   ```bash
   npm install
   ```

5. **Configure Firebase**
   - Copy `.env.example` to `.env`
   - Add your Firebase configuration
   - See README.md for detailed Firebase setup

6. **Start Development Server**
   ```bash
   npm start
   ```

## Development Workflow

### Creating a Feature Branch

Always create a new branch for your work:

```bash
# Update your local main branch
git checkout main
git pull upstream main

# Create feature branch
git checkout -b feature/your-feature-name
# or for bug fixes
git checkout -b fix/bug-description
```

### Branch Naming Conventions

- `feature/description` - New features
- `fix/description` - Bug fixes
- `docs/description` - Documentation changes
- `refactor/description` - Code refactoring
- `test/description` - Adding tests
- `chore/description` - Maintenance tasks

### Making Changes

1. **Write Code**
   - Follow code standards (see below)
   - Add tests for new functionality
   - Update documentation if needed

2. **Test Your Changes**
   ```bash
   npm test            # Run tests
   npm run build       # Ensure build succeeds
   npm start          # Manual testing
   ```

3. **Commit Your Changes**
   ```bash
   git add .
   git commit -m "feat: add new scoring format"
   ```

4. **Push to Your Fork**
   ```bash
   git push origin feature/your-feature-name
   ```

### Keeping Your Branch Updated

Regularly sync with upstream:

```bash
git fetch upstream
git rebase upstream/main
```

If conflicts occur, resolve them and continue:

```bash
# Fix conflicts in your editor
git add .
git rebase --continue
```

## Code Standards

### JavaScript Style Guide

#### General Rules

- Use ES6+ features
- Prefer `const` over `let`, avoid `var`
- Use arrow functions for callbacks
- Use template literals for string interpolation
- Use destructuring where appropriate

#### Example:

```javascript
// Good
const calculateTotal = (scores) => {
  const { gross, net } = scores;
  return gross + net;
};

// Bad
var calculateTotal = function(scores) {
  return scores.gross + scores.net;
};
```

### React Component Guidelines

#### Functional Components

Always use functional components with hooks:

```javascript
// Good
import React, { useState, useEffect } from 'react';

function MyComponent({ prop1, prop2 }) {
  const [state, setState] = useState(initialValue);

  useEffect(() => {
    // Effect logic
    return () => {
      // Cleanup
    };
  }, [dependencies]);

  return <div>Content</div>;
}

export default MyComponent;
```

#### Component Structure

Organize components in this order:

1. Imports
2. Component definition
3. State declarations
4. Effects
5. Event handlers
6. Render helpers
7. Return statement

```javascript
import React, { useState, useEffect } from 'react';
import { someUtil } from '../utils';

function MyComponent({ initialValue }) {
  // 1. State
  const [value, setValue] = useState(initialValue);
  const [loading, setLoading] = useState(false);

  // 2. Effects
  useEffect(() => {
    loadData();
  }, []);

  // 3. Event handlers
  const handleChange = (e) => {
    setValue(e.target.value);
  };

  // 4. Render helpers
  const renderContent = () => {
    if (loading) return <div>Loading...</div>;
    return <div>{value}</div>;
  };

  // 5. Return
  return (
    <div className="my-component">
      {renderContent()}
    </div>
  );
}
```

#### Props Validation

While not using TypeScript, document expected props:

```javascript
/**
 * Tournament card component
 * @param {Object} tournament - Tournament object
 * @param {Function} onSelect - Selection callback
 * @param {boolean} selected - Whether card is selected
 */
function TournamentCard({ tournament, onSelect, selected }) {
  // ...
}
```

### File Organization

#### Component Files

```
ComponentName/
├── ComponentName.js       # Main component
├── ComponentName.css      # Styles
├── ComponentName.test.js  # Tests
└── index.js              # Export (optional)
```

#### Shared Components

Place reusable components in `src/components/shared/`:

```
src/components/shared/
├── HoleInfo.js
├── ScoreCard.js
├── PlayerScoreEntry.js
└── index.js  # Barrel export
```

### CSS Guidelines

#### Class Naming

Use BEM-like naming:

```css
/* Component */
.tournament-card { }

/* Element */
.tournament-card__header { }
.tournament-card__title { }

/* Modifier */
.tournament-card--selected { }
.tournament-card--draft { }
```

#### Mobile-First Approach

Write mobile styles first, then add desktop breakpoints:

```css
/* Mobile (default) */
.component {
  padding: 0.5rem;
  font-size: 0.875rem;
}

/* Desktop */
@media (min-width: 768px) {
  .component {
    padding: 1rem;
    font-size: 1rem;
  }
}
```

### Firebase Guidelines

#### Firestore Operations

Always handle errors:

```javascript
try {
  const doc = await getDoc(docRef);
  if (!doc.exists()) {
    throw new Error('Document not found');
  }
  return doc.data();
} catch (error) {
  console.error('Firestore error:', error);
  throw error;
}
```

#### Subscriptions

Always clean up subscriptions:

```javascript
useEffect(() => {
  const unsubscribe = subscribeToTournament(id, setTournament);

  return () => {
    unsubscribe();
  };
}, [id]);
```

#### Security

- Never commit Firebase credentials
- Use environment variables for configuration
- Follow principle of least privilege for security rules

## Testing Guidelines

### Writing Tests

#### Component Tests

```javascript
import { render, screen, fireEvent } from '@testing-library/react';
import MyComponent from './MyComponent';

describe('MyComponent', () => {
  it('renders correctly', () => {
    render(<MyComponent value="test" />);
    expect(screen.getByText('test')).toBeInTheDocument();
  });

  it('handles user interaction', () => {
    const handleClick = jest.fn();
    render(<MyComponent onClick={handleClick} />);

    fireEvent.click(screen.getByRole('button'));
    expect(handleClick).toHaveBeenCalledTimes(1);
  });
});
```

#### Utility Function Tests

```javascript
import { calculateStablefordPoints } from './stablefordCalculations';

describe('calculateStablefordPoints', () => {
  it('calculates points for par', () => {
    const points = calculateStablefordPoints(4, 4, 0, 1);
    expect(points).toBe(2);
  });

  it('calculates points for birdie', () => {
    const points = calculateStablefordPoints(3, 4, 0, 1);
    expect(points).toBe(3);
  });

  it('handles handicap strokes', () => {
    const points = calculateStablefordPoints(5, 4, 18, 1);
    expect(points).toBe(2); // 5 - 1 stroke = 4 (par)
  });
});
```

### Running Tests

```bash
# Run all tests
npm test

# Run tests once (CI)
npm run test:once

# Run with coverage
npm run test:coverage

# Run specific test file
npm test -- MyComponent.test.js
```

### Test Coverage Goals

- **Utility Functions**: 90%+ coverage
- **Components**: 70%+ coverage
- **Critical Paths**: 100% coverage (scoring, handicap calculations)

## Commit Guidelines

### Commit Message Format

Follow Conventional Commits:

```
<type>(<scope>): <subject>

<body>

<footer>
```

#### Types

- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `style`: Code style changes (formatting, no logic change)
- `refactor`: Code refactoring
- `test`: Adding or updating tests
- `chore`: Maintenance tasks

#### Examples

```bash
# Feature
git commit -m "feat(scoring): add shamble format support"

# Bug fix
git commit -m "fix(leaderboard): correct sorting for tied scores"

# Documentation
git commit -m "docs(api): update Firebase service documentation"

# Refactoring
git commit -m "refactor(components): extract shared ScoreCard component"
```

#### Detailed Commit

```
feat(analytics): add hole difficulty analysis

Implement hole difficulty calculation based on average scores
across all rounds in a tournament. Categorizes holes as easy,
medium, or hard based on score vs par.

- Add calculateHoleDifficulty utility function
- Create TournamentAnalytics component
- Add hole difficulty visualization
- Include tests for calculation logic

Closes #123
```

### Atomic Commits

Make commits logical and atomic:

✅ **Good:**
```bash
git commit -m "feat: add player statistics page"
git commit -m "test: add tests for statistics calculations"
git commit -m "docs: update README with statistics feature"
```

❌ **Bad:**
```bash
git commit -m "add feature, fix bugs, update docs"
```

## Pull Request Process

### Before Submitting

- [ ] Code follows project style guidelines
- [ ] Tests pass (`npm test`)
- [ ] Build succeeds (`npm run build`)
- [ ] Documentation updated (if needed)
- [ ] Commit messages follow guidelines
- [ ] Branch is up to date with main

### Creating Pull Request

1. **Push Your Branch**
   ```bash
   git push origin feature/your-feature
   ```

2. **Open Pull Request on GitHub**
   - Go to your fork on GitHub
   - Click "New Pull Request"
   - Select your branch
   - Fill out PR template

### PR Template

```markdown
## Description
Brief description of changes

## Type of Change
- [ ] Bug fix
- [ ] New feature
- [ ] Breaking change
- [ ] Documentation update

## Testing
How to test these changes

## Screenshots (if applicable)
Add screenshots for UI changes

## Checklist
- [ ] Tests pass
- [ ] Build succeeds
- [ ] Documentation updated
- [ ] No console errors
```

### Review Process

1. **Automated Checks**
   - Build must pass
   - Tests must pass
   - No linting errors

2. **Code Review**
   - At least one approval required
   - Address all review comments
   - Make requested changes

3. **Merge**
   - Maintainer will merge when approved
   - Squash commits if needed

### After Merge

1. **Delete Branch**
   ```bash
   git branch -d feature/your-feature
   git push origin --delete feature/your-feature
   ```

2. **Update Local Main**
   ```bash
   git checkout main
   git pull upstream main
   ```

## Architecture Guidelines

### Component Structure

#### When to Extract Components

Extract when:
- Logic is reused in 3+ places
- Component exceeds 300 lines
- Functionality is self-contained
- Testing would be easier independently

#### Shared vs Feature Components

**Shared Components** (`src/components/shared/`):
- Used across multiple features
- Generic and reusable
- Minimal business logic
- Examples: HoleInfo, ScoreCard, Button

**Feature Components** (`src/components/`):
- Feature-specific
- Contains business logic
- Examples: TournamentDashboard, Scoring

### State Management

#### Local State

Use `useState` for component-local state:

```javascript
const [isOpen, setIsOpen] = useState(false);
```

#### Context

Use Context for cross-cutting concerns:

```javascript
// src/contexts/AuthContext.js
export const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);

  return (
    <AuthContext.Provider value={{ currentUser, setCurrentUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
```

#### Firebase State

Use subscriptions for real-time data:

```javascript
useEffect(() => {
  const unsubscribe = subscribeToTournaments(setTournaments);
  return () => unsubscribe();
}, []);
```

### Custom Hooks

Create custom hooks for reusable logic:

```javascript
// src/hooks/useDebounce.js
export function useDebounce(value, delay) {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => clearTimeout(timer);
  }, [value, delay]);

  return debouncedValue;
}
```

### Performance Optimization

#### Memoization

Use `useMemo` for expensive calculations:

```javascript
const sortedPlayers = useMemo(() => {
  return players.sort((a, b) => a.handicap - b.handicap);
}, [players]);
```

Use `useCallback` for function references:

```javascript
const handleSubmit = useCallback((data) => {
  saveToFirebase(data);
}, []);
```

#### Code Splitting

Lazy load routes:

```javascript
const TournamentDetail = lazy(() => import('./components/TournamentDetail'));

<Suspense fallback={<Loading />}>
  <Route path="/tournaments/:id" element={<TournamentDetail />} />
</Suspense>
```

## Common Pitfalls

### 1. Infinite Loops

❌ **Bad:**
```javascript
useEffect(() => {
  setData([...data, newItem]);
}, [data]); // Causes infinite loop
```

✅ **Good:**
```javascript
useEffect(() => {
  if (shouldUpdate) {
    setData([...data, newItem]);
  }
}, [shouldUpdate]); // Only updates when flag changes
```

### 2. Memory Leaks

❌ **Bad:**
```javascript
useEffect(() => {
  subscribeToData(setData);
  // No cleanup!
}, []);
```

✅ **Good:**
```javascript
useEffect(() => {
  const unsubscribe = subscribeToData(setData);
  return () => unsubscribe();
}, []);
```

### 3. Prop Drilling

❌ **Bad:**
```javascript
<A data={data}>
  <B data={data}>
    <C data={data}>
      <D data={data} />
    </C>
  </B>
</A>
```

✅ **Good:**
```javascript
// Use Context
<DataProvider value={data}>
  <A>
    <B>
      <C>
        <D /> {/* Uses useData() hook */}
      </C>
    </B>
  </A>
</DataProvider>
```

## Getting Help

- **Questions**: Open a GitHub Discussion
- **Bugs**: Create an Issue with reproduction steps
- **Feature Requests**: Create an Issue with use case
- **Security Issues**: Email maintainer directly

## Recognition

Contributors are recognized in:
- README.md Contributors section
- Release notes
- Git commit history

Thank you for contributing! 🎉

---

**Happy Coding! ⛳**
