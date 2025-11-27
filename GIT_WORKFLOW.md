# Git Workflow Guide

## Repository Information

**GitHub URL:** https://github.com/evanwilson77/ryder-cup-scoring
**Default Branch:** `main`
**Owner:** Evan Wilson (@evanwilson77)

---

## Quick Reference

### Daily Workflow

```bash
# 1. Check status
git status

# 2. Pull latest changes
git pull origin main

# 3. Make your changes
# ... edit files ...

# 4. Check what changed
git status
git diff

# 5. Stage changes
git add .

# 6. Commit with message
git commit -m "Description of changes"

# 7. Push to GitHub
git push origin main

# 8. Deploy to Firebase (if needed)
npm run build
firebase deploy
```

---

## Common Commands

### Checking Status
```bash
# See what's changed
git status

# See detailed changes
git diff

# See commit history
git log --oneline
```

### Making Changes
```bash
# Stage specific file
git add path/to/file.js

# Stage all changes
git add .

# Stage only modified files (not new files)
git add -u

# Unstage a file
git reset path/to/file.js
```

### Committing
```bash
# Simple commit
git commit -m "Fix: scoring bug in match play"

# Detailed commit
git commit -m "Add: match detail view

- Show hole-by-hole scorecard
- Display player lineups
- Calculate match statistics"

# Amend last commit (if you forgot something)
git add missed-file.js
git commit --amend --no-edit
```

### Syncing with GitHub
```bash
# Pull latest changes
git pull origin main

# Push your changes
git push origin main

# Force push (careful! only if needed)
git push origin main --force
```

---

## Branching Strategy

### Creating Feature Branches

```bash
# Create and switch to new branch
git checkout -b feature/new-feature-name

# Make changes and commit
git add .
git commit -m "Add new feature"

# Push branch to GitHub
git push origin feature/new-feature-name

# When ready, merge to main
git checkout main
git merge feature/new-feature-name
git push origin main

# Delete branch after merge
git branch -d feature/new-feature-name
git push origin --delete feature/new-feature-name
```

### Branch Naming Convention
```
feature/add-player-stats      # New feature
fix/scoring-calculation       # Bug fix
refactor/scoring-logic        # Code refactoring
docs/update-readme            # Documentation
chore/update-dependencies     # Maintenance
```

---

## Commit Message Best Practices

### Format
```
Type: Brief description (50 chars or less)

Detailed explanation if needed (wrap at 72 chars):
- What changed
- Why it changed
- Any side effects
```

### Types
- **Add:** New feature or functionality
- **Fix:** Bug fix
- **Update:** Modify existing feature
- **Refactor:** Code restructuring (no behavior change)
- **Docs:** Documentation changes
- **Style:** Code style/formatting
- **Test:** Adding or updating tests
- **Chore:** Maintenance tasks

### Examples
```bash
# Good commit messages
git commit -m "Fix: current hole saving incorrectly after score submit"
git commit -m "Add: projected scores for in-progress matches on leaderboard"
git commit -m "Update: mobile score buttons to 60px for better touch targets"
git commit -m "Refactor: extract match status calculation to utils"

# Less helpful (avoid these)
git commit -m "fixes"
git commit -m "updates"
git commit -m "WIP"
```

---

## Handling Conflicts

If you get a merge conflict:

```bash
# Pull latest changes
git pull origin main

# If conflicts occur, Git will tell you which files
# Open the conflicted files and look for:
<<<<<<< HEAD
Your changes
=======
Changes from GitHub
>>>>>>> branch-name

# Edit the file to resolve conflicts
# Remove the conflict markers
# Keep the code you want

# Stage resolved files
git add resolved-file.js

# Complete the merge
git commit -m "Merge: resolve conflicts in scoring logic"

# Push to GitHub
git push origin main
```

---

## Undoing Changes

### Before Commit
```bash
# Discard changes to a file
git checkout -- path/to/file.js

# Discard all changes
git reset --hard HEAD

# Unstage files
git reset
```

### After Commit (Local)
```bash
# Undo last commit, keep changes
git reset --soft HEAD~1

# Undo last commit, discard changes
git reset --hard HEAD~1

# Undo multiple commits
git reset --hard HEAD~3
```

### After Push (Careful!)
```bash
# Revert a specific commit (creates new commit)
git revert <commit-hash>

# Check history to find commit hash
git log --oneline
```

---

## Working with Others

### Pull Request Workflow (GitHub)

1. **Create Feature Branch**
   ```bash
   git checkout -b feature/my-feature
   git push origin feature/my-feature
   ```

2. **On GitHub:**
   - Go to repository
   - Click "Pull Requests" → "New Pull Request"
   - Select your branch
   - Add description
   - Click "Create Pull Request"

3. **After Review & Approval:**
   - Merge on GitHub
   - Delete branch
   - Pull changes locally:
   ```bash
   git checkout main
   git pull origin main
   ```

---

## Deployment Workflow

### Standard Deployment
```bash
# 1. Ensure code is committed and pushed
git status  # Should be clean
git push origin main

# 2. Build production version
npm run build

# 3. Deploy to Firebase
firebase deploy

# 4. Verify deployment
# Visit: https://ryderchapscup.web.app/
```

### Hotfix Deployment
```bash
# 1. Create hotfix branch
git checkout -b hotfix/critical-bug

# 2. Make fix and commit
git add .
git commit -m "Fix: critical scoring bug"

# 3. Merge to main immediately
git checkout main
git merge hotfix/critical-bug
git push origin main

# 4. Deploy ASAP
npm run build
firebase deploy

# 5. Delete hotfix branch
git branch -d hotfix/critical-bug
```

---

## GitHub Features

### Viewing on GitHub
- **Code:** https://github.com/evanwilson77/ryder-cup-scoring
- **Issues:** Track bugs and feature requests
- **Pull Requests:** Review code changes
- **Actions:** (Can set up CI/CD)
- **Settings:** Repository configuration

### Creating Issues
```bash
# From command line
gh issue create --title "Bug: scoring not saving" --body "Description of bug"

# Or on GitHub website
# Click "Issues" → "New Issue"
```

### Viewing Deployment
- **Live App:** https://ryderchapscup.web.app/
- **Firebase Console:** https://console.firebase.google.com/

---

## Backup & Safety

### Before Major Changes
```bash
# Create backup branch
git checkout -b backup/before-major-change
git push origin backup/before-major-change

# Return to main
git checkout main
```

### Tags for Releases
```bash
# Tag a release
git tag -a v1.0.0 -m "Version 1.0.0: Initial release"
git push origin v1.0.0

# List tags
git tag -l

# Checkout a specific version
git checkout v1.0.0
```

---

## Troubleshooting

### "Changes not staged"
```bash
# Stage all changes
git add .
git commit -m "Your message"
```

### "Branch diverged"
```bash
# Pull first, then push
git pull origin main --rebase
git push origin main
```

### "Permission denied"
```bash
# Check GitHub authentication
gh auth status

# Re-authenticate if needed
gh auth login
```

### "Nothing to commit"
```bash
# Check if files are staged
git status

# If new files, add them
git add .
```

### "Merge conflict"
```bash
# See which files have conflicts
git status

# Open conflicted files and resolve
# Then:
git add .
git commit -m "Merge: resolve conflicts"
```

---

## Important Notes

### Security
- **NEVER commit `.env`** - It's in `.gitignore` for a reason!
- Firebase credentials are secret
- Check `.gitignore` before committing sensitive data

### Git Ignore
Already configured to ignore:
- `node_modules/` - Dependencies (too large)
- `build/` - Generated files
- `.env` - Secrets
- `.firebase/` - Cache

### Best Practices
1. **Commit often** - Small, focused commits
2. **Pull before push** - Avoid conflicts
3. **Write clear messages** - Future you will thank you
4. **Test before commit** - `npm start` to verify
5. **Deploy after push** - Keep production updated

---

## Quick Tips

### Aliases (Optional)
Add to your `~/.gitconfig`:
```ini
[alias]
    s = status
    co = checkout
    cm = commit -m
    pushit = !git add . && git commit -m \"Quick update\" && git push origin main
    deploy = !npm run build && firebase deploy
```

Then use:
```bash
git s           # Instead of git status
git co main     # Instead of git checkout main
git cm "msg"    # Instead of git commit -m "msg"
```

### Current Project Stats
- **Repository:** ryder-cup-scoring
- **Initial Commit:** 30 files, 23,220 lines
- **Language:** JavaScript (React)
- **Deployed:** Firebase Hosting

---

## Need Help?

### Resources
- **Git Docs:** https://git-scm.com/doc
- **GitHub Docs:** https://docs.github.com/
- **This Project:** https://github.com/evanwilson77/ryder-cup-scoring

### Common Questions
**Q: How do I see what changed?**
A: `git diff` or `git status`

**Q: How do I undo my last commit?**
A: `git reset --soft HEAD~1` (keeps changes) or `git reset --hard HEAD~1` (discards changes)

**Q: How do I update from GitHub?**
A: `git pull origin main`

**Q: How do I save my changes?**
A: `git add . && git commit -m "Description" && git push origin main`

---

*Last Updated: 2025-01-28*
