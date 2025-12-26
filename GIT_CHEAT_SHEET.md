# Git Cheat Sheet - Comprehensive Guide

A practical reference guide for common Git operations, including merge conflict resolution and workflow patterns.

---

## 📋 Table of Contents
1. [Basic Operations](#basic-operations)
2. [Branch Management](#branch-management)
3. [Merging & Conflict Resolution](#merging--conflict-resolution)
4. [Remote Operations](#remote-operations)
5. [Undoing Changes](#undoing-changes)
6. [Viewing History & Status](#viewing-history--status)
7. [Common Workflows](#common-workflows)
8. [Troubleshooting](#troubleshooting)
9. [Best Practices](#best-practices)

---

## Basic Operations

### Initialize & Clone
```bash
# Initialize a new repository
git init

# Clone a repository
git clone <repository-url>
git clone <repository-url> <directory-name>

# Clone a specific branch
git clone -b <branch-name> <repository-url>
```

### Stage & Commit
```bash
# Stage specific files
git add <file>
git add <file1> <file2> <file3>

# Stage all changes
git add .

# Stage all changes (including deletions)
git add -A

# Commit staged changes
git commit -m "Your commit message"

# Stage and commit in one step
git commit -am "Your commit message"

# Amend last commit (change message or add files)
git commit --amend -m "New commit message"
```

### View Status
```bash
# Check status
git status

# Short status
git status -s

# Check what changed (not staged)
git diff

# Check what's staged
git diff --staged
```

---

## Branch Management

### Create & Switch Branches
```bash
# Create a new branch
git branch <branch-name>

# Create and switch to new branch
git checkout -b <branch-name>
git switch -c <branch-name>  # Modern alternative

# Switch to existing branch
git checkout <branch-name>
git switch <branch-name>  # Modern alternative

# List all branches
git branch

# List all branches (including remote)
git branch -a

# List remote branches
git branch -r

# Delete local branch
git branch -d <branch-name>  # Safe delete (checks if merged)
git branch -D <branch-name>  # Force delete

# Delete remote branch
git push origin --delete <branch-name>
```

### Rename Branch
```bash
# Rename current branch
git branch -m <new-name>

# Rename other branch
git branch -m <old-name> <new-name>
```

---

## Merging & Conflict Resolution

### Basic Merging
```bash
# Merge another branch into current branch
git merge <branch-name>

# Merge with no fast-forward (creates merge commit)
git merge --no-ff <branch-name>

# Merge with fast-forward only (fails if not possible)
git merge --ff-only <branch-name>

# Abort a merge in progress
git merge --abort
```

### Resolving Merge Conflicts

#### Step 1: Identify Conflicts
```bash
# Check status (shows conflicted files)
git status

# View conflicted files
git diff
```

#### Step 2: Resolve Conflicts in Files
Conflicts appear like this:
```json
<<<<<<< HEAD
    "next": "^15.5.9",
=======
    "next": "15.2.8",
>>>>>>> branch-name
```

**Resolution Options:**
1. **Keep your version (HEAD/current branch):**
   ```bash
   git checkout --ours <file>
   ```

2. **Keep their version (incoming branch):**
   ```bash
   git checkout --theirs <file>
   ```

3. **Manual resolution:**
   - Open the file
   - Remove conflict markers (`<<<<<<<`, `=======`, `>>>>>>>`)
   - Keep the code you want
   - Save the file

#### Step 3: Mark as Resolved
```bash
# After resolving conflicts, stage the files
git add <resolved-file>
git add <file1> <file2>  # Multiple files

# Complete the merge
git commit -m "Merge branch-name and resolve conflicts"
```

### Special Case: package.json & package-lock.json Conflicts

**Scenario:** Version conflicts in Node.js projects

```bash
# 1. Resolve package.json conflict manually or:
git checkout --ours package.json  # Keep your version

# 2. Regenerate package-lock.json
npm install
# or
yarn install

# 3. Stage both files
git add package.json package-lock.json

# 4. Complete merge
git commit -m "chore: resolve merge conflict - keep Next.js 15.5.9"
```

**Best Practice:** Always regenerate lock files after resolving package.json conflicts.

### Merge Strategy: Pull Main into Feature Branch

**When:** You want to sync your feature branch with main before creating PR

```bash
# 1. Make sure you're on your feature branch
git checkout development

# 2. Fetch latest from remote
git fetch origin

# 3. Pull and merge main into your branch
git pull origin main
# OR explicitly merge
git merge origin/main

# 4. Resolve any conflicts (see conflict resolution above)

# 5. Push your updated branch
git push origin development
```

---

## Remote Operations

### Fetch & Pull
```bash
# Fetch latest changes (doesn't merge)
git fetch origin
git fetch origin <branch-name>

# Pull latest changes (fetch + merge)
git pull origin <branch-name>
git pull  # Uses current branch's upstream

# Pull with rebase (cleaner history)
git pull --rebase origin <branch-name>
```

### Push
```bash
# Push to remote
git push origin <branch-name>

# Push and set upstream
git push -u origin <branch-name>
git push --set-upstream origin <branch-name>

# Force push (use with caution!)
git push --force origin <branch-name>
git push --force-with-lease origin <branch-name>  # Safer force push

# Push all branches
git push --all origin

# Push tags
git push --tags origin
```

### Remote Management
```bash
# List remotes
git remote -v

# Add remote
git remote add <name> <url>

# Remove remote
git remote remove <name>

# Rename remote
git remote rename <old-name> <new-name>

# Update remote URL
git remote set-url <name> <new-url>
```

---

## Undoing Changes

### Unstage Files
```bash
# Unstage specific file
git reset <file>
git restore --staged <file>  # Modern alternative

# Unstage all files
git reset
git restore --staged .  # Modern alternative
```

### Discard Changes
```bash
# Discard changes in working directory
git checkout -- <file>
git restore <file>  # Modern alternative

# Discard all uncommitted changes
git checkout -- .
git restore .  # Modern alternative

# Discard all changes and untracked files
git clean -fd
```

### Undo Commits
```bash
# Undo last commit (keeps changes staged)
git reset --soft HEAD~1

# Undo last commit (keeps changes unstaged)
git reset --mixed HEAD~1
git reset HEAD~1  # Same as above

# Undo last commit (discards changes)
git reset --hard HEAD~1

# Undo multiple commits
git reset --hard HEAD~3  # Undo last 3 commits
```

### Revert (Safe for Shared Branches)
```bash
# Create new commit that undoes a previous commit
git revert <commit-hash>

# Revert last commit
git revert HEAD

# Revert multiple commits
git revert HEAD~3..HEAD
```

---

## Viewing History & Status

### Log
```bash
# View commit history
git log

# One line per commit
git log --oneline

# Graph view
git log --oneline --graph

# Show last N commits
git log -n 5

# Show commits for specific file
git log <file>

# Show commits between dates
git log --since="2024-01-01" --until="2024-12-31"

# Search commit messages
git log --grep="search term"

# Show commits by author
git log --author="name"
```

### Diff
```bash
# Show changes in working directory
git diff

# Show staged changes
git diff --staged
git diff --cached  # Alias

# Compare two branches
git diff <branch1>..<branch2>

# Compare two commits
git diff <commit1> <commit2>

# Show file changes between commits
git diff <commit1> <commit2> -- <file>
```

### Show
```bash
# Show specific commit
git show <commit-hash>

# Show last commit
git show HEAD

# Show file at specific commit
git show <commit-hash>:<file>
```

---

## Common Workflows

### Feature Branch Workflow
```bash
# 1. Create feature branch from main
git checkout main
git pull origin main
git checkout -b feature/my-feature

# 2. Make changes and commit
git add .
git commit -m "feat: add new feature"

# 3. Push feature branch
git push -u origin feature/my-feature

# 4. Sync with main before PR
git pull origin main
# Resolve conflicts if any
git push origin feature/my-feature

# 5. After PR is merged, clean up
git checkout main
git pull origin main
git branch -d feature/my-feature
git push origin --delete feature/my-feature
```

### Sync Feature Branch with Main
```bash
# Option 1: Merge main into feature branch
git checkout feature-branch
git pull origin main
# Resolve conflicts
git push origin feature-branch

# Option 2: Rebase feature branch onto main
git checkout feature-branch
git fetch origin
git rebase origin/main
# Resolve conflicts if any
git push --force-with-lease origin feature-branch
```

### GitHub PR Workflow (Manual Merge)
```bash
# 1. Pull latest from main
git pull origin main

# 2. Switch to your feature branch
git checkout development

# 3. Merge main into feature branch
git merge main

# 4. Resolve conflicts
# (See conflict resolution section)

# 5. Push updated branch
git push origin development
```

---

## Troubleshooting

### Merge Conflicts
```bash
# See what files have conflicts
git status

# Abort merge and return to pre-merge state
git merge --abort

# See conflict markers in files
git diff

# Accept all changes from one side
git checkout --ours .  # Keep your changes
git checkout --theirs .  # Keep their changes
```

### Stash (Temporary Save)
```bash
# Save uncommitted changes
git stash
git stash save "message"

# List stashes
git stash list

# Apply most recent stash
git stash apply
git stash pop  # Apply and remove

# Apply specific stash
git stash apply stash@{0}

# Drop stash
git stash drop stash@{0}

# Clear all stashes
git stash clear
```

### Recover Lost Commits
```bash
# View reflog (history of all actions)
git reflog

# Recover lost commit
git checkout <commit-hash>
git checkout -b recovery-branch

# Or reset to lost commit
git reset --hard <commit-hash>
```

### Fix Last Commit
```bash
# Change last commit message
git commit --amend -m "New message"

# Add files to last commit
git add <file>
git commit --amend --no-edit

# Change author of last commit
git commit --amend --author="Name <email>"
```

### Clean Working Directory
```bash
# Remove untracked files
git clean -f

# Remove untracked files and directories
git clean -fd

# Preview what would be removed
git clean -n
git clean -nd
```

---

## Best Practices

### Commit Messages
```bash
# Use conventional commit format
feat: add new feature
fix: fix bug
docs: update documentation
style: formatting changes
refactor: code restructuring
test: add tests
chore: maintenance tasks

# Good commit message structure
<type>(<scope>): <subject>

<body>

<footer>
```

### Branch Naming
```bash
# Feature branches
feature/user-authentication
feature/payment-integration

# Bug fixes
fix/login-error
fix/memory-leak

# Hotfixes
hotfix/security-patch

# Chores
chore/update-dependencies
chore/refactor-code
```

### Before Pushing
```bash
# 1. Check status
git status

# 2. Review changes
git diff

# 3. Run tests
npm test

# 4. Build check
npm run build

# 5. Then push
git push origin <branch>
```

### Regular Maintenance
```bash
# Fetch latest (safe, doesn't change anything)
git fetch origin

# Prune deleted remote branches
git fetch --prune

# Clean up merged branches
git branch --merged | grep -v "\*\|main\|master" | xargs -n 1 git branch -d
```

---

## Quick Reference: Common Scenarios

### "I made changes but want to start over"
```bash
git reset --hard HEAD
```

### "I committed to wrong branch"
```bash
# Move last commit to correct branch
git reset --soft HEAD~1
git checkout correct-branch
git commit -m "Your message"
```

### "I need to update my branch with latest main"
```bash
git checkout my-branch
git pull origin main
# Resolve conflicts if any
git push origin my-branch
```

### "I want to see what changed in a file"
```bash
git diff HEAD <file>
git log -p <file>
```

### "I want to undo a commit but keep changes"
```bash
git reset --soft HEAD~1
```

### "I want to undo a commit and discard changes"
```bash
git reset --hard HEAD~1
```

### "I have merge conflicts in package.json"
```bash
# 1. Resolve package.json (keep your version or merge manually)
git checkout --ours package.json  # or edit manually

# 2. Regenerate lock file
npm install

# 3. Stage and commit
git add package.json package-lock.json
git commit -m "chore: resolve package.json conflict"
```

---

## Git Aliases (Optional)

Add to `~/.gitconfig` or `.git/config`:

```bash
# Short aliases
git config --global alias.st status
git config --global alias.co checkout
git config --global alias.br branch
git config --global alias.ci commit

# Useful aliases
git config --global alias.unstage 'reset HEAD --'
git config --global alias.last 'log -1 HEAD'
git config --global alias.visual '!gitk'
git config --global alias.lg "log --color --graph --pretty=format:'%Cred%h%Creset -%C(yellow)%d%Creset %s %Cgreen(%cr) %C(bold blue)<%an>%Creset' --abbrev-commit"
```

---

## Emergency Commands

### "I need to stop everything and go back"
```bash
# Save current work
git stash

# Go back to last commit
git reset --hard HEAD

# Or go back to specific commit
git reset --hard <commit-hash>
```

### "I pushed something I shouldn't have"
```bash
# Remove last commit from remote (if no one else pulled)
git reset --hard HEAD~1
git push --force-with-lease origin <branch>
```

### "I need to completely reset my branch"
```bash
# Reset to match remote exactly
git fetch origin
git reset --hard origin/<branch-name>
```

---

## Notes

- **Always** use `--force-with-lease` instead of `--force` when force pushing
- **Never** force push to `main` or `master` branches
- **Always** pull before pushing to avoid conflicts
- **Test** your build after resolving conflicts
- **Regenerate** lock files after package.json conflicts
- **Commit** frequently with meaningful messages
- **Pull** main into feature branches before creating PRs

---

*Last updated: 2025-12-26*
*Includes: Merge conflict resolution for package.json/package-lock.json*

