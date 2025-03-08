# Database Configuration

## Overview
This project uses Neon PostgreSQL with database branching for different environments. This approach provides efficient database management across development, staging, and production environments.

## Database Structure
- **Main Branch**: Production database
- **Staging Branch**: Created dynamically for staging deployments
- **PR Branches**: Created automatically for pull request testing

## Branch Naming Convention
- Production: Main branch
- Staging: `staging-{YYYYMMDD-HHMMSS}`
- PR Testing: `pr-{PR_NUMBER}-{YYYYMMDD-HHMMSS}`
- Deployment Snapshots: `deploy-{YYYYMMDD-HHMMSS}`

## Environment Configuration
```env
# Main Database URL (Production Branch)
DATABASE_URL="postgresql://user:pass@host/database?sslmode=require"

# Shadow Database URL (for Prisma migrations)
SHADOW_DATABASE_URL="postgresql://user:pass@host/database?sslmode=require"
```

## Branch Management
### Automatic Branch Creation
- **Staging**: New branch created for each staging deployment
- **PR Testing**: Dedicated branch for each pull request
- **Production**: Snapshot branch created before each production deployment

### Branch Lifecycle
1. **Development**
   - Local development uses main branch or developer-specific branches
   - Changes tested locally before pushing

2. **Pull Request**
   - Dedicated database branch created
   - Migrations run automatically
   - Branch deleted after PR is merged/closed

3. **Staging**
   - New branch created from production
   - Used for staging environment testing
   - Refreshed with each staging deployment

4. **Production**
   - Uses main database branch
   - Snapshot created before each deployment
   - Migrations run automatically

## CI/CD Integration
### GitHub Actions Workflow
- Automatically creates appropriate database branches
- Runs migrations in isolated environments
- Creates safety snapshots before production deployments

### Environment Variables in CI/CD
```yaml
env:
  NEON_DB_NAME: 'dwshop'
  NEON_PROJECT_ID: 'dark-scene-a59y6uw3'
```

### Branch Creation in CI/CD
```bash
# Staging Branch
BRANCH_ID="staging-$(date +%Y%m%d-%H%M%S)"
DATABASE_URL="$BASE_URL?branch=$BRANCH_ID"

# PR Testing Branch
BRANCH_ID="pr-$PR_NUMBER-$(date +%Y%m%d-%H%M%S)"
DATABASE_URL="$BASE_URL?branch=$BRANCH_ID"
```

## Migration Management
### Development
```bash
# Create a new migration
npx prisma migrate dev --name your_migration_name

# Apply migrations
npx prisma migrate deploy
```

### Production
- Migrations are automatically applied during deployment
- Snapshot created before migration for safety
- Uses `prisma migrate deploy` for safe deployment

## Backup and Recovery
- Automatic snapshots before production deployments
- Branch-based isolation prevents data corruption
- Easy rollback by switching to snapshot branch

## Best Practices
1. **Never modify production branch directly**
2. **Test migrations in staging first**
3. **Use meaningful branch names**
4. **Clean up unused branches regularly**
5. **Monitor branch usage and storage**

## Troubleshooting
### Common Issues
1. **Migration Failed**
   - Check migration history
   - Verify branch exists
   - Ensure proper permissions

2. **Branch Creation Failed**
   - Verify Neon API access
   - Check branch name format
   - Confirm storage limits

3. **Connection Issues**
   - Verify SSL configuration
   - Check credentials
   - Confirm network access

### Support
For additional support:
- Check Neon documentation
- Review Prisma migration guides
- Contact database administrator 