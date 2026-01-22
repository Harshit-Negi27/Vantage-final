# Git Guide for Vantage

Quick reference for Git commands and workflows.

## Initial Setup

### First Time Setup

```bash
# Configure Git (if not already done)
git config --global user.name "Your Name"
git config --global user.email "your.email@example.com"

# Initialize repository (if not already done)
git init

# Add remote repository
git remote add origin https://github.com/yourusername/vantage.git

# Verify remote
git remote -v
```

## Basic Workflow

### Check Status

```bash
# See what files have changed
git status

# See what files are ignored
git status --ignored
```

### Stage Files

```bash
# Stage all files
git add .

# Stage specific file
git add README.md

# Stage specific directory
git add docs/

# Stage files by pattern
git add "*.md"
```

### Commit Changes

```bash
# Commit with message
git commit -m "Add comprehensive documentation"

# Commit with detailed message
git commit -m "Add documentation" -m "- Added setup guides
- Added API reference
- Added architecture docs"

# Amend last commit (if you forgot something)
git add forgotten-file.md
git commit --amend --no-edit
```

### Push to GitHub

```bash
# Push to main branch
git push origin main

# Push and set upstream (first time)
git push -u origin main

# Force push (use with caution!)
git push --force origin main
```

## Branching

### Create and Switch Branches

```bash
# Create new branch
git branch feature/new-feature

# Switch to branch
git checkout feature/new-feature

# Create and switch in one command
git checkout -b feature/new-feature

# List all branches
git branch -a
```

### Merge Branches

```bash
# Switch to main
git checkout main

# Merge feature branch
git merge feature/new-feature

# Delete merged branch
git branch -d feature/new-feature
```

## Viewing History

```bash
# View commit history
git log

# View compact history
git log --oneline

# View history with graph
git log --graph --oneline --all

# View changes in last commit
git show

# View changes in specific file
git log -p README.md
```

## Undoing Changes

### Unstage Files

```bash
# Unstage all files
git reset

# Unstage specific file
git reset README.md
```

### Discard Changes

```bash
# Discard changes in working directory
git checkout -- README.md

# Discard all changes
git checkout -- .

# Restore file from specific commit
git checkout abc123 -- README.md
```

### Revert Commits

```bash
# Revert last commit (creates new commit)
git revert HEAD

# Revert specific commit
git revert abc123

# Reset to previous commit (dangerous!)
git reset --hard HEAD~1
```

## Working with Remote

### Fetch and Pull

```bash
# Fetch changes from remote
git fetch origin

# Pull changes from remote
git pull origin main

# Pull with rebase
git pull --rebase origin main
```

### Update Remote URL

```bash
# Change remote URL
git remote set-url origin https://github.com/newusername/vantage.git

# Verify change
git remote -v
```

## Checking for Sensitive Data

### Before Committing

```bash
# Search for API keys
grep -r "sk-" . --exclude-dir={node_modules,venv,.git,.next}
grep -r "API_KEY" . --exclude-dir={node_modules,venv,.git,.next}

# Search for passwords
grep -r "password" . --exclude-dir={node_modules,venv,.git,.next}

# Check what will be committed
git diff --cached
```

### After Committing (Before Push)

```bash
# View files in last commit
git show --name-only

# View content of last commit
git show

# Search commit history for sensitive data
git log -S "sk-" --all
```

## .gitignore Best Practices

### Check if File is Ignored

```bash
# Check specific file
git check-ignore -v .env

# List all ignored files
git status --ignored
```

### Remove Tracked File

If you accidentally committed a file that should be ignored:

```bash
# Remove from Git but keep locally
git rm --cached .env

# Remove directory from Git but keep locally
git rm -r --cached node_modules/

# Commit the removal
git commit -m "Remove .env from tracking"
```

## Tags and Releases

### Create Tags

```bash
# Create lightweight tag
git tag v0.1.0

# Create annotated tag
git tag -a v0.1.0 -m "Initial release"

# List tags
git tag

# Push tag to remote
git push origin v0.1.0

# Push all tags
git push origin --tags
```

## Useful Aliases

Add these to your `~/.gitconfig`:

```ini
[alias]
    st = status
    co = checkout
    br = branch
    ci = commit
    unstage = reset HEAD --
    last = log -1 HEAD
    visual = log --graph --oneline --all
    amend = commit --amend --no-edit
```

Usage:

```bash
git st          # Instead of git status
git co main     # Instead of git checkout main
git visual      # View graph
```

## Common Workflows

### Feature Development

```bash
# 1. Create feature branch
git checkout -b feature/new-feature

# 2. Make changes and commit
git add .
git commit -m "Add new feature"

# 3. Push to remote
git push origin feature/new-feature

# 4. Create Pull Request on GitHub

# 5. After merge, update main
git checkout main
git pull origin main

# 6. Delete feature branch
git branch -d feature/new-feature
```

### Hotfix

```bash
# 1. Create hotfix branch from main
git checkout main
git checkout -b hotfix/critical-bug

# 2. Fix and commit
git add .
git commit -m "Fix critical bug"

# 3. Merge to main
git checkout main
git merge hotfix/critical-bug

# 4. Push
git push origin main

# 5. Delete hotfix branch
git branch -d hotfix/critical-bug
```

### Sync Fork

```bash
# 1. Add upstream remote (once)
git remote add upstream https://github.com/original/vantage.git

# 2. Fetch upstream changes
git fetch upstream

# 3. Merge upstream changes
git checkout main
git merge upstream/main

# 4. Push to your fork
git push origin main
```

## Troubleshooting

### Merge Conflicts

```bash
# 1. Pull latest changes
git pull origin main

# 2. If conflicts, Git will tell you which files

# 3. Open conflicted files and resolve
# Look for <<<<<<< HEAD markers

# 4. Stage resolved files
git add resolved-file.js

# 5. Complete merge
git commit -m "Resolve merge conflicts"
```

### Accidentally Committed to Wrong Branch

```bash
# 1. Create new branch from current state
git branch feature/correct-branch

# 2. Reset current branch
git reset --hard HEAD~1

# 3. Switch to correct branch
git checkout feature/correct-branch
```

### Undo Last Push

```bash
# 1. Reset local branch
git reset --hard HEAD~1

# 2. Force push (dangerous!)
git push --force origin main
```

## GitHub Specific

### Create Repository on GitHub

1. Go to https://github.com/new
2. Enter repository name: `vantage`
3. Add description
4. Choose public or private
5. Don't initialize with README (you already have one)
6. Click "Create repository"

### Connect Local to GitHub

```bash
# Add remote
git remote add origin https://github.com/yourusername/vantage.git

# Push
git push -u origin main
```

### Clone Repository

```bash
# Clone via HTTPS
git clone https://github.com/yourusername/vantage.git

# Clone via SSH
git clone git@github.com:yourusername/vantage.git

# Clone specific branch
git clone -b develop https://github.com/yourusername/vantage.git
```

## Best Practices

1. **Commit Often**: Small, focused commits are better than large ones
2. **Write Clear Messages**: Describe what and why, not how
3. **Use Branches**: Keep main stable, develop in branches
4. **Pull Before Push**: Always pull latest changes before pushing
5. **Review Before Commit**: Use `git diff` to review changes
6. **Never Commit Secrets**: Use .env files and .gitignore
7. **Tag Releases**: Use semantic versioning (v1.0.0)
8. **Keep History Clean**: Use rebase for feature branches

## Commit Message Format

Good commit messages:

```
Add user authentication feature

- Implement JWT token generation
- Add login and signup endpoints
- Create authentication middleware
```

Bad commit messages:

```
fixed stuff
update
changes
wip
```

## Resources

- [Git Documentation](https://git-scm.com/doc)
- [GitHub Guides](https://guides.github.com)
- [Git Cheat Sheet](https://education.github.com/git-cheat-sheet-education.pdf)
- [Conventional Commits](https://www.conventionalcommits.org)

## Quick Reference

```bash
# Status and info
git status              # Check status
git log                 # View history
git diff                # View changes

# Basic workflow
git add .               # Stage all
git commit -m "msg"     # Commit
git push origin main    # Push

# Branching
git branch              # List branches
git checkout -b name    # Create branch
git merge name          # Merge branch

# Undo
git reset               # Unstage
git checkout -- file    # Discard changes
git revert HEAD         # Revert commit

# Remote
git pull                # Pull changes
git fetch               # Fetch changes
git remote -v           # View remotes
```

---

For more help: `git help <command>`
