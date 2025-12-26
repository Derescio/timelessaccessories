# Next.js Version Update - Merge Conflict Resolution Guide

## Current Situation
- **Local Branch**: `development`
- **Current Next.js Version**: `^15.5.9` (in package.json)
- **Remote Version**: Likely `^15.2.x` or older

## Best Strategy: Pull First, Then Resolve

### Option 1: Pull and Merge (Recommended)
This is the safest approach if you haven't pushed your changes yet:

```bash
# 1. First, commit your current changes (if not already committed)
git add package.json package-lock.json
git commit -m "chore: update Next.js to 15.5.9"

# 2. Pull latest changes from remote
git pull origin development

# 3. If there's a merge conflict in package.json:
#    - Git will mark the conflict
#    - Open package.json and look for conflict markers:
#      <<<<<<< HEAD
#      "next": "^15.5.9"
#      =======
#      "next": "^15.2.0"
#      >>>>>>> origin/development
#    - Keep your version (15.5.9) and remove conflict markers
#    - Also update package-lock.json: npm install

# 4. Resolve the conflict
git add package.json package-lock.json
git commit -m "chore: resolve merge conflict - keep Next.js 15.5.9"

# 5. Push your changes
git push origin development
```

### Option 2: Rebase (Cleaner History)
If you prefer a linear history:

```bash
# 1. Commit your changes first
git add package.json package-lock.json
git commit -m "chore: update Next.js to 15.5.9"

# 2. Rebase onto remote
git pull --rebase origin development

# 3. If conflicts occur, resolve them:
#    - Edit package.json to keep 15.5.9
#    - Run: npm install (to update package-lock.json)
#    - Run: git add package.json package-lock.json
#    - Run: git rebase --continue

# 4. Push (may need force-with-lease if rebased)
git push origin development
```

### Option 3: Separate Version Bump Commit (Best for PRs)
If you want to keep the version bump separate from your feature work:

```bash
# 1. Stash your current work (if you have uncommitted changes)
git stash

# 2. Pull latest changes
git pull origin development

# 3. Create a separate branch for version bump
git checkout -b chore/update-nextjs-version

# 4. Update package.json to 15.5.9 (if not already done)
# 5. Install dependencies to update package-lock.json
npm install

# 6. Commit the version bump
git add package.json package-lock.json
git commit -m "chore: update Next.js from 15.2 to 15.5.9"

# 7. Push the version bump branch
git push origin chore/update-nextjs-version

# 8. Create a PR for the version bump, merge it first

# 9. Then go back to your feature branch
git checkout development
git pull origin development  # Now includes the version bump

# 10. Apply your stashed changes
git stash pop
```

## Quick Resolution Script

If you're already in a conflict situation, here's a quick fix:

```bash
# After pulling and seeing conflicts:
# 1. Keep your version (newer is better)
# Edit package.json manually or use this approach:

# 2. Accept your version (theirs = remote, ours = local)
git checkout --ours package.json
npm install  # Regenerate package-lock.json
git add package.json package-lock.json
git commit -m "chore: resolve merge conflict - keep Next.js 15.5.9"
git push origin development
```

## Recommended Approach for Your Situation

Since you're on `development` branch and have already made the change:

1. **Check if you've committed it**:
   ```bash
   git status
   git log --oneline -1
   ```

2. **If NOT committed yet**:
   ```bash
   git add package.json package-lock.json
   git commit -m "chore: update Next.js to 15.5.9"
   ```

3. **Pull and handle conflicts**:
   ```bash
   git pull origin development
   # If conflicts: resolve by keeping 15.5.9, then:
   npm install
   git add package.json package-lock.json
   git commit -m "chore: resolve merge conflict - keep Next.js 15.5.9"
   ```

4. **Push**:
   ```bash
   git push origin development
   ```

## Why This Approach Works

- **Pulling first** ensures you get any remote changes
- **Resolving conflicts locally** is easier than on GitHub
- **Keeping the newer version** (15.5.9) is the right choice
- **Regenerating package-lock.json** ensures consistency

## Notes

- Always keep the **newer version** when resolving conflicts
- Run `npm install` after resolving to update `package-lock.json`
- Test your build after resolving: `npm run build`
- Consider updating other dependencies that might be affected

