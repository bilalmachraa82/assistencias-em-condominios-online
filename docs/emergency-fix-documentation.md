# Emergency Fix Documentation - Activity Log Constraint Violation

## Problem Description
The `log_table_access()` function was inserting user emails directly into the `activity_log.actor` field, violating the `activity_log_actor_check` constraint which only allows values: 'system', 'admin', 'supplier'.

## Root Cause
- Function used `auth.jwt() ->> 'email'` directly for actor field
- Constraint required specific enum values
- No role mapping logic existed

## Solution Implemented
**Date:** 2025-07-07
**Migration:** `20250707173236-0941327c-b93a-4fa7-89b8-b711d8019f35.sql`

### Changes Made
1. **Role Mapping Logic:**
   - Admin users (via `get_user_role()`) → `'admin'`
   - Authenticated non-admin users → `'supplier'`
   - Anonymous/system operations → `'system'`

2. **Error Handling:**
   - Safe execution of `get_user_role()` with exception handling
   - Fallback to NULL if role check fails

3. **Audit Trail:**
   - Email preserved in description field for auditing
   - Actor field now compliant with constraint

### Code Changes
```sql
-- Map user role to valid actor values
IF user_role = 'admin' THEN
  mapped_actor := 'admin';
ELSIF auth.uid() IS NOT NULL THEN
  mapped_actor := 'supplier'; -- Authenticated but not admin
ELSE
  mapped_actor := 'system'; -- Anonymous or system operations
END IF;
```

## Testing Results
- ✅ Assistance creation working
- ✅ Activity logging functional
- ✅ Constraint violations resolved
- ✅ Role mapping verified

## Monitoring Setup
- `DatabaseMonitor.checkConstraintViolations()` - Checks for violations
- `DatabaseMonitor.testActivityLogging()` - Validates logging system
- `DatabaseMonitor.testRoleMapping()` - Tests role mapping

## Rollback Plan
If issues persist:
1. Use `DatabaseRollback.disableActivityTrigger()`
2. Use `DatabaseRollback.emergencyCreateAssistance()` for critical operations
3. Apply hotfix migration to disable trigger temporarily

## Prevention Measures
1. All database functions must use constraint-compliant values
2. Role validation required for all user-context operations
3. Comprehensive testing of constraints before deployment
4. Monitoring alerts for constraint violations

## Next Steps
- [ ] Implement comprehensive constraint testing
- [ ] Add monitoring alerts
- [ ] Review all database functions for similar issues
- [ ] Update development guidelines for constraint compliance