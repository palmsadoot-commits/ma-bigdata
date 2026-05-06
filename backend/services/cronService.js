const cron = require('node-cron');
const db = require('../config/db');
const dayjs = require('dayjs');
const backupService = require('./backupService');
const taskHistoryService = require('./taskHistoryService');

// ✅ [New] Sequential Task Queue เพื่อป้องกันการรัน Backup ซ้อนกัน
let isProcessing = false;
const backupQueue = [];

const processQueue = async () => {
    if (isProcessing || backupQueue.length === 0) return;
    
    isProcessing = true;
    const { taskFn, taskName, resolve, reject } = backupQueue.shift();
    
    try {
        console.log(`⏳ [Queue] Starting Task: ${taskName}`);
        const result = await taskFn();
        console.log(`✅ [Queue] Finished Task: ${taskName}`);
        if (resolve) resolve(result);
    } catch (err) {
        console.error(`❌ [Queue] Failed Task: ${taskName} -`, err.message);
        if (reject) reject(err);
    } finally {
        isProcessing = false;
        // รันงานถัดไปทันที
        setTimeout(processQueue, 1000); 
    }
};

const addToQueue = (taskFn, taskName) => {
    return new Promise((resolve, reject) => {
        backupQueue.push({ taskFn, taskName, resolve, reject });
        processQueue();
    });
};

let activeCronJob = null; 
const setupCronJob = async () => {
    try {
        if (activeCronJob) { activeCronJob.stop(); }

        const [rows] = await db.query('SELECT * FROM backup_settings WHERE id = 1 AND is_active = 1');
        if (rows.length === 0) return;

        const setting = rows[0];
        const [hour, minute] = setting.schedule_time.split(':');
        
        let cronExp = `${minute} ${hour} * * *`;
        if (setting.schedule_type === 'weekly' && setting.schedule_days) {
            cronExp = `${minute} ${hour} * * ${setting.schedule_days}`; 
        } else if (setting.schedule_type === 'monthly' && setting.schedule_days) {
            cronExp = `${minute} ${hour} ${setting.schedule_days} * *`; 
        }

        activeCronJob = cron.schedule(cronExp, () => {
            addToQueue(() => backupService.performBackup('Auto Schedule'), 'DB Backup');
        });
        console.log(`⏱️ Auto DB Backup Scheduled: ${cronExp}`);

    } catch (err) { console.error('❌ Failed to setup DB Cron Job:', err.message); }
};

let activeSourceCronJobs = []; // ✅ เปลี่ยนเป็น Array เพื่อรองรับหลาย Profile
const setupSourceCronJob = async () => {
    try {
        // ✅ หยุดงานเก่าทั้งหมด
        activeSourceCronJobs.forEach(job => job.stop());
        activeSourceCronJobs = [];

        const [rows] = await db.query('SELECT * FROM source_backup_settings WHERE is_active = 1');
        if (rows.length === 0) return;

        for (const setting of rows) {
            const [hour, minute] = setting.schedule_time.split(':');
            
            let cronExp = `${minute} ${hour} * * *`;
            if (setting.schedule_type === 'weekly' && setting.schedule_days) {
                cronExp = `${minute} ${hour} * * ${setting.schedule_days}`; 
            } else if (setting.schedule_type === 'monthly' && setting.schedule_days) {
                cronExp = `${minute} ${hour} ${setting.schedule_days} * *`; 
            }

            const job = cron.schedule(cronExp, () => {
                const folders = setting.target_folders ? setting.target_folders.split(',') : ['frontend', 'backend'];
                const profileName = setting.id === 2 ? 'Source Full' : 'Source Selective';
                addToQueue(() => backupService.performSourceBackup(`Auto Schedule (${profileName})`, folders), `Source Backup (${profileName})`);
            });
            
            activeSourceCronJobs.push(job);
            console.log(`⏱️ Auto Source Backup Profile ${setting.id} Scheduled: ${cronExp}`);
        }

    } catch (err) { console.error('❌ Failed to setup Source Cron Job:', err.message); }
};

let activeGithubCronJob = null; 
const setupGithubCronJob = async () => {
    try {
        if (activeGithubCronJob) { activeGithubCronJob.stop(); }
        const [rows] = await db.query('SELECT * FROM github_settings WHERE id = 1 AND is_active = 1');
        if (rows.length === 0) return;
        const setting = rows[0];
        const [hour, minute] = setting.schedule_time.split(':');
        let cronExp = `${minute} ${hour} * * *`;
        if (setting.schedule_type === 'weekly' && setting.schedule_days) cronExp = `${minute} ${hour} * * ${setting.schedule_days}`; 
        else if (setting.schedule_type === 'monthly' && setting.schedule_days) cronExp = `${minute} ${hour} ${setting.schedule_days} * *`; 
        
        activeGithubCronJob = cron.schedule(cronExp, () => {
            const targets = setting.sync_targets ? setting.sync_targets.split(',') : ['database', 'source'];
            addToQueue(() => backupService.performGithubSync('Auto Schedule', targets), 'GitHub Sync');
        });
        console.log(`⏱️ Auto GitHub Sync Scheduled: ${cronExp}`);
    } catch (err) { console.error('❌ Failed to setup GitHub Cron Job:', err.message); }
};

let activeGDriveCronJob = null;
const setupGDriveCronJob = async () => {
    try {
        if (activeGDriveCronJob) { activeGDriveCronJob.stop(); }
        const [rows] = await db.query('SELECT * FROM gdrive_settings WHERE id = 1 AND is_active = 1');
        if (rows.length === 0) return;
        const setting = rows[0];
        const [hour, minute] = setting.schedule_time.split(':');
        let cronExp = `${minute} ${hour} * * *`;
        if (setting.schedule_type === 'weekly' && setting.schedule_days) cronExp = `${minute} ${hour} * * ${setting.schedule_days}`;
        else if (setting.schedule_type === 'monthly' && setting.schedule_days) cronExp = `${minute} ${hour} ${setting.schedule_days} * *`;
        
        activeGDriveCronJob = cron.schedule(cronExp, () => {
            const targets = setting.sync_targets ? setting.sync_targets.split(',') : ['database', 'source'];
            addToQueue(() => backupService.performGDriveSync('Auto Schedule', targets), 'GDrive Sync');
        });
        console.log(`⏱️ Auto GDrive Sync Scheduled: ${cronExp}`);
    } catch (err) { console.error('❌ Failed to setup GDrive Cron Job:', err.message); }
};

let activeCleanupCronJob = null;
const setupCleanupCronJob = async () => {
    try {
        if (activeCleanupCronJob) { activeCleanupCronJob.stop(); }
        const [rows] = await db.query('SELECT * FROM cleanup_settings WHERE id = 1 AND is_active = 1');
        if (rows.length === 0) return;
        const setting = rows[0];
        const [hour, minute] = setting.schedule_time.split(':');
        let cronExp = `${minute} ${hour} * * *`;
        if (setting.schedule_type === 'weekly' && setting.schedule_days) cronExp = `${minute} ${hour} * * ${setting.schedule_days}`;
        else if (setting.schedule_type === 'monthly' && setting.schedule_days) cronExp = `${minute} ${hour} ${setting.schedule_days} * *`;
        
        activeCleanupCronJob = cron.schedule(cronExp, () => {
            const cleanupService = require('./cleanupService');
            addToQueue(() => cleanupService.performCleanup('Auto Schedule'), 'Auto Cleanup');
        });
        console.log(`⏱️ Auto Cleanup Service Scheduled: ${cronExp}`);
    } catch (err) { console.error('❌ Failed to setup Cleanup Cron Job:', err.message); }
};

const setupTaskHistoryCronJob = async () => {
    // 1. ตรวจสอบและสร้างแผนงานล่วงหน้า 7 วัน (รันทุกวัน เวลา 00:01 น.)
    cron.schedule('1 0 * * *', async () => {
        console.log('📅 [Task History] Generating future tasks...');
        for (let i = 0; i <= 7; i++) {
            const targetDate = dayjs().add(i, 'day');
            await taskHistoryService.generateTasksForDate(targetDate);
        }
    });

    // 2. ตรวจสอบรายการที่ Missed (รันทุกชั่วโมง)
    cron.schedule('0 * * * *', async () => {
        console.log('🕵️ [Task History] Syncing missed tasks...');
        await taskHistoryService.syncMissedTasks();
    });

    // 3. บันทึกสถิติพื้นที่จัดเก็บ (รันทุกวัน เวลา 23:55 น.)
    cron.schedule('55 23 * * *', async () => {
        console.log('📊 [Storage Analytics] Recording daily snapshot...');
        await backupService.takeStorageSnapshot();
    });

    // ✅ รันครั้งแรกทันทีเมื่อเปิด Server
    console.log('🚀 [Task History] Initializing task history...');
    await backupService.takeStorageSnapshot(); // ✅ บันทึกสถิติทันทีที่เริ่มระบบ
    
    for (let i = 0; i <= 7; i++) { // สร้างเฉพาะวันนี้และล่วงหน้า 7 วัน (ไม่ย้อนหลังเพื่อรักษาประวัติเดิม)
        const targetDate = dayjs().add(i, 'day');
        await taskHistoryService.generateTasksForDate(targetDate);
    }
    await taskHistoryService.syncMissedTasks();
};

module.exports = { 
    setupCronJob, 
    setupSourceCronJob, 
    setupGithubCronJob, 
    setupGDriveCronJob,
    setupCleanupCronJob,
    setupTaskHistoryCronJob
};
