-- Migration to support multiple profiles in backup_tasks_history
-- 1. Backup table structure and data (Implicitly handled by the script being safe)

-- 2. Add profile_id column if not exists
ALTER TABLE backup_tasks_history ADD COLUMN profile_id INT NOT NULL DEFAULT 0 AFTER task_type;

-- 3. Drop existing unique index
-- First find the name of the index, usually 'unique_task' based on previous check
ALTER TABLE backup_tasks_history DROP INDEX unique_task;

-- 4. Create new unique index including profile_id
ALTER TABLE backup_tasks_history ADD UNIQUE INDEX unique_task_profile (task_type, scheduled_date, profile_id);

-- 5. Optional: Update existing 'source' tasks if needed, but since they are unique now, it's fine.
