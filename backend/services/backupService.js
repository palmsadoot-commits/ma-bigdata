const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');
const archiver = require('archiver');
const simpleGit = require('simple-git');
const { google } = require('googleapis');
const db = require('../config/db');
const taskHistoryService = require('./taskHistoryService');

// ✅ ตรวจหา Path ของ mysqldump อัตโนมัติและรองรับค่าจาก .env
const getDumpPath = () => {
    // 1. ลองใช้ค่าจาก .env ก่อน (ถ้าผู้ใช้ตั้งค่าไว้เอง)
    if (process.env.MYSQL_DUMP_PATH && fs.existsSync(process.env.MYSQL_DUMP_PATH)) {
        return process.env.MYSQL_DUMP_PATH;
    }

    // 2. Fallback สำหรับ XAMPP
    const xamppPath = 'C:\\xampp\\mysql\\bin\\mysqldump.exe';
    if (fs.existsSync(xamppPath)) return xamppPath;

    // 3. Fallback สำหรับ MySQL Installer (standalone)
    const standalonePath = 'C:\\Program Files\\MySQL\\MySQL Server 8.0\\bin\\mysqldump.exe';
    if (fs.existsSync(standalonePath)) return standalonePath;

    return 'mysqldump';
};

const performBackup = async (triggerBy = 'System') => {
    return new Promise((resolve, reject) => {
        try {
            const thaiTime = new Date(new Date().toLocaleString("en-US", {timeZone: "Asia/Bangkok"}));
            const dd = String(thaiTime.getDate()).padStart(2, '0');
            const mm = String(thaiTime.getMonth() + 1).padStart(2, '0');
            const yyyy = thaiTime.getFullYear();
            const hh = String(thaiTime.getHours()).padStart(2, '0');
            const min = String(thaiTime.getMinutes()).padStart(2, '0');
            const ss = String(thaiTime.getSeconds()).padStart(2, '0');
            
            const fileName = `DB_${dd}-${mm}-${yyyy}_${hh}-${min}-${ss}.sql`;
            const backupDir = path.resolve(__dirname, '../../backups/database');
            
            if (!fs.existsSync(backupDir)) fs.mkdirSync(backupDir, { recursive: true });
            const filePath = path.join(backupDir, fileName);

            const dbUser = process.env.DB_USER;
            const dbPass = process.env.DB_PASSWORD || '';
            const dbName = process.env.DB_NAME;
            const dbHost = process.env.DB_HOST;
            const dumpPath = getDumpPath();
            
            // ✅ รวมทุกตารางตามความต้องการของผู้ใช้งาน (รวมทั้ง settings และ logs)
            const args = [
                '-h', dbHost,
                '-u', dbUser,
                dbPass ? `-p${dbPass}` : '', 
                dbName
            ].filter(Boolean);

            console.log(`🚀 Professional Spawn Executing: ${dumpPath} ${args.join(' ')}`);

            const dumpProcess = spawn(dumpPath, args);
            const writeStream = fs.createWriteStream(filePath);

            dumpProcess.stdout.pipe(writeStream);

            let stderrData = '';
            dumpProcess.stderr.on('data', (data) => {
                stderrData += data.toString();
            });

            dumpProcess.on('error', async (err) => {
                console.error("❌ Spawn Error (รันโปรแกรมไม่ได้):", err.message);
                if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
                await db.query(`INSERT INTO backup_logs (file_name, status, created_by) VALUES (?, 'Failed (System Error)', ?)`, [fileName, triggerBy]);
                reject(new Error(`Failed to start backup: ${err.message}`));
            });

            dumpProcess.on('close', async (code) => {
                if (code !== 0) {
                    console.error("❌ Backup Process Error (รหัสจบการทำงาน):", code, "Msg:", stderrData);
                    if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
                    await db.query(`INSERT INTO backup_logs (file_name, status, created_by) VALUES (?, 'Failed (Error Code ${code})', ?)`, [fileName, triggerBy]);
                    return reject(new Error(stderrData || `mysqldump exited with code ${code}`));
                }

                const stats = fs.statSync(filePath);
                if (stats.size === 0) {
                    if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
                    return reject(new Error('Backup produced an empty file'));
                }

                const fileSizeMB = (stats.size / (1024 * 1024)).toFixed(2) + ' MB';
                const [logResult] = await db.query(`INSERT INTO backup_logs (file_name, file_size, status, created_by) VALUES (?, ?, 'Success', ?)`, [fileName, fileSizeMB, triggerBy]);
                
                // ✅ อัปเดตสถานะในประวัติแผนงาน
                await taskHistoryService.updateTaskStatus('db', new Date(), 'success', logResult.insertId);

                console.log(`✅ Professional Backup Success: ${fileName}`);
                resolve(fileName);
            });

        } catch (e) {
            console.error("❌ Professional Service Fatal Error:", e);
            reject(e);
        }
    });
};

const performSourceBackup = async (triggerBy = 'System', targetFolders = ['frontend', 'backend'], ignoreExtensions = null) => {
    return new Promise(async (resolve, reject) => {
        try {
            // ✅ ดึงการตั้งค่าจากฐานข้อมูล
            const [rows] = await db.query('SELECT ignore_extensions, ignored_folders FROM source_backup_settings LIMIT 1');
            const settings = rows[0] || {};
            
            const isFullBackup = targetFolders.includes('node_modules'); // ใช้ node_modules เป็นตัวบ่งชี้ Full Backup
            
            const finalIgnoreExts = ignoreExtensions !== null ? ignoreExtensions : (settings.ignore_extensions || '');
            const finalIgnoredFolders = settings.ignored_folders || '.git,dist,build,backups';

            const thaiTime = new Date(new Date().toLocaleString("en-US", {timeZone: "Asia/Bangkok"}));
            const dd = String(thaiTime.getDate()).padStart(2, '0');
            const mm = String(thaiTime.getMonth() + 1).padStart(2, '0');
            const yyyy = thaiTime.getFullYear();
            const hh = String(thaiTime.getHours()).padStart(2, '0');
            const min = String(thaiTime.getMinutes()).padStart(2, '0');
            const ss = String(thaiTime.getSeconds()).padStart(2, '0');
            
            const fileName = `${isFullBackup ? 'Project_Full_' : 'src_'}${dd}-${mm}-${yyyy}_${hh}-${min}-${ss}.zip`;
            const backupDir = path.resolve(__dirname, '../../backups/source');
            if (!fs.existsSync(backupDir)) fs.mkdirSync(backupDir, { recursive: true });
            
            const filePath = path.join(backupDir, fileName);
            const output = fs.createWriteStream(filePath);
            const archive = archiver('zip', { zlib: { level: 9 } });

            output.on('close', async () => {
                const stats = fs.statSync(filePath);
                const fileSizeMB = (stats.size / (1024 * 1024)).toFixed(2) + ' MB';
                const foldersStr = isFullBackup ? 'Full' : targetFolders.join(',');
                const [logResult] = await db.query(`INSERT INTO source_backup_logs (file_name, target_folders, file_size, status, created_by) VALUES (?, ?, ?, 'Success', ?)`, [fileName, foldersStr, fileSizeMB, triggerBy]);
                
                // ✅ อัปเดตสถานะในประวัติแผนงาน
                await taskHistoryService.updateTaskStatus('source', new Date(), 'success', logResult.insertId);
                
                console.log(`✅ Source Backup Success: ${fileName} (${fileSizeMB})`);
                resolve(fileName);
            });

            archive.on('error', async (err) => {
                console.error("❌ Archive Stream Error:", err.message);
                if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
                await db.query(`INSERT INTO source_backup_logs (file_name, status, created_by) VALUES (?, 'Failed', ?)`, [fileName, triggerBy]);
                reject(err);
            });

            archive.pipe(output);

            // ✅ สร้างรายการ Ignore Pattern
            let ignorePattern = [];
            
            if (!isFullBackup) {
                // 1. ถ้าไม่ใช่ Full -> เพิ่มโฟลเดอร์ที่ต้องข้าม (จากฐานข้อมูล)
                finalIgnoredFolders.split(',').map(f => f.trim()).filter(Boolean).forEach(folder => {
                    ignorePattern.push(`**/${folder}/**`);
                });

                // 2. เพิ่มนามสกุลไฟล์ที่ต้องข้าม
                if (finalIgnoreExts) {
                    finalIgnoreExts.split(',').map(e => e.trim()).filter(Boolean).forEach(ext => {
                        const formattedExt = ext.startsWith('.') ? ext : `.${ext}`;
                        ignorePattern.push(`**/*${formattedExt}`);
                    });
                }
                
                // 3. บังคับละเว้น node_modules ในโหมดปกติ
                ignorePattern.push('**/node_modules/**');
            }

            // 4. บังคับละเว้นไฟล์ Zip ตัวมันเอง และโฟลเดอร์ backups เสมอเพื่อป้องกัน Loop
            ignorePattern.push(`**/backups/**`);
            ignorePattern.push(`**/${fileName}`);

            const projectRoot = path.resolve(__dirname, '../..'); // D:\Projects\ma-bigdata

            if (isFullBackup) {
                // 🌟 บีบอัดทุกอย่างจาก Root Project โดยข้ามแค่โฟลเดอร์ backups เพื่อไม่ให้ไฟล์ใหญ่ซ้ำซ้อน
                console.log(`📦 Performing FULL Project Backup from: ${projectRoot}`);
                archive.glob('**/*', { 
                    cwd: projectRoot, 
                    ignore: ignorePattern,
                    dot: true // รวมไฟล์ .env, .gitignore ด้วย
                });
            } else {
                // 📂 บีบอัดแยกโฟลเดอร์แบบปกติ
                const backendPath = path.resolve(__dirname, '..');
                const frontendPath = path.resolve(__dirname, '../../frontend');

                if (targetFolders.includes('backend')) {
                    archive.glob('**/*', { cwd: backendPath, ignore: ignorePattern }, { prefix: 'backend' });
                }
                if (targetFolders.includes('frontend') && fs.existsSync(frontendPath)) {
                    archive.glob('**/*', { cwd: frontendPath, ignore: ignorePattern }, { prefix: 'frontend' });
                }
            }

            archive.finalize();
        } catch (e) {
            console.error("❌ Source Backup Fatal Error:", e.message);
            reject(e);
        }
    });
};

const performGithubSync = async (triggerBy = 'System', syncTargets = ['database', 'source']) => {
    try {
        const [rows] = await db.query('SELECT * FROM github_settings WHERE id = 1');
        if (rows.length === 0 || !rows[0].github_token || !rows[0].repo_url) {
            throw new Error('กรุณาตั้งค่า GitHub Token และ Repository URL ให้ครบถ้วนก่อน');
        }
        const settings = rows[0];
        
        let cleanUrl = settings.repo_url.trim();
        if (cleanUrl.endsWith('/')) cleanUrl = cleanUrl.slice(0, -1);
        if (!cleanUrl.endsWith('.git')) cleanUrl += '.git';

        const repoUrlWithAuth = cleanUrl.replace('https://', `https://${settings.github_token}@`);
        const branchName = settings.branch_name || 'main';
        
        const syncDir = path.resolve(__dirname, '../../backups/github_sync');
        if (!fs.existsSync(syncDir)) fs.mkdirSync(syncDir, { recursive: true });

        // 🚀 ใช้ Git Binary จาก .env หรือค่ามาตรฐาน
        const git = simpleGit({
            baseDir: syncDir,
            binary: process.env.GIT_PATH || 'git',
            maxConcurrentProcesses: 6,
            unsafe: {
                allowUnsafeCustomBinary: true
            }
        });
        const isRepo = await git.checkIsRepo();
        if (!isRepo) {
            await git.init();
            await git.addRemote('origin', repoUrlWithAuth);
            await git.branch(['-M', branchName]);
        } else {
            await git.remote(['set-url', 'origin', repoUrlWithAuth]);
            const currentBranch = await git.revparse(['--abbrev-ref', 'HEAD']);
            if (currentBranch !== branchName) {
                await git.branch(['-M', branchName]);
            }
        }

        await git.addConfig('user.name', 'LMIS Auto Backup Bot');
        await git.addConfig('user.email', 'backup@lmis.local');

        // 🟢 1. จัดการไฟล์ Database (แบบไฟล์ดิบ .sql พร้อม Masking)
        if (syncTargets.includes('database')) {
            const dbBackupDir = path.resolve(__dirname, '../../backups/database');
            if (fs.existsSync(dbBackupDir)) {
                const files = fs.readdirSync(dbBackupDir).filter(f => f.endsWith('.sql'));
                if (files.length > 0) {
                    files.sort((a, b) => fs.statSync(path.join(dbBackupDir, b)).mtimeMs - fs.statSync(path.join(dbBackupDir, a)).mtimeMs);
                    const sourceFile = path.join(dbBackupDir, files[0]);
                    const destFile = path.join(syncDir, 'latest_database.sql');
                    
                    let content = fs.readFileSync(sourceFile, 'utf8');
                    content = content.replace(/ghp_[a-zA-Z0-9]{36}/g, "[GITHUB_TOKEN_MASKED]");
                    content = content.replace(/github_pat_[a-zA-Z0-9_]{82,}/g, "[GITHUB_PAT_MASKED]");
                    content = content.replace(/[0-9]+-[a-z0-9]+\.apps\.googleusercontent\.com/g, "[GOOGLE_CLIENT_ID_MASKED]");
                    content = content.replace(/(')(GOCSPX-[a-zA-Z0-9_-]{28})(')/g, "$1[GOOGLE_SECRET_MASKED]$3");
                    content = content.replace(/(')(1\/\/0[a-zA-Z0-9_-]{50,})(')/g, "$1[GOOGLE_REFRESH_TOKEN_MASKED]$3");
                    content = content.replace(/("github_token":"|'github_token':'|github_token = ')(.*?)("|')/g, "$1[MASKED]$3");
                    content = content.replace(/("client_secret":"|'client_secret':'|client_secret = ')(.*?)("|')/g, "$1[MASKED]$3");
                    content = content.replace(/("refresh_token":"|'refresh_token':'|refresh_token = ')(.*?)("|')/g, "$1[MASKED]$3");
                    
                    fs.writeFileSync(destFile, content);
                }
            }
        }

        // 🟢 2. จัดการ Source Code (แบบไฟล์ดิบ Raw Files)
        if (syncTargets.includes('source')) {
            const projectRoot = path.resolve(__dirname, '../..');
            const ignoredPatterns = ['node_modules', '.git', 'backups', 'dist', 'build', '.env'];
            
            // ฟังก์ชันช่วยคัดลอกไฟล์แบบ Recursive พร้อม Filter
            const copyRecursiveSync = (src, dest) => {
                const exists = fs.existsSync(src);
                const stats = exists && fs.statSync(src);
                const isDirectory = exists && stats.isDirectory();
                
                if (isDirectory) {
                    if (ignoredPatterns.includes(path.basename(src))) return;
                    if (!fs.existsSync(dest)) fs.mkdirSync(dest, { recursive: true });
                    fs.readdirSync(src).forEach((childItemName) => {
                        copyRecursiveSync(path.join(src, childItemName), path.join(dest, childItemName));
                    });
                } else {
                    if (ignoredPatterns.includes(path.basename(src))) return;
                    fs.copyFileSync(src, dest);
                }
            };

            // คัดลอก backend และ frontend แบบไฟล์ดิบ
            const targets = ['backend', 'frontend'];
            targets.forEach(target => {
                const srcPath = path.join(projectRoot, target);
                const destPath = path.join(syncDir, target);
                if (fs.existsSync(srcPath)) {
                    copyRecursiveSync(srcPath, destPath);
                }
            });
        }

        fs.writeFileSync(path.join(syncDir, 'sync_info.txt'), `Last Sync: ${new Date().toLocaleString()}\nBy: ${triggerBy}\nMode: Raw Files`);

        await git.add('-A');
        const status = await git.status();

        if (status.isClean()) {
            await db.query(`INSERT INTO github_sync_logs (sync_targets, status, created_by) VALUES (?, 'สำเร็จ (ไม่มีไฟล์เปลี่ยนแปลง)', ?)`, [syncTargets.join(','), triggerBy]);
            return 'No Changes';
        }

        const now = new Date().toLocaleString('th-TH');
        await git.commit(`Raw Backup Update: ${now}`);
        await git.push('origin', branchName, { '--force': null }); 

        const [logResult] = await db.query(`INSERT INTO github_sync_logs (sync_targets, status, created_by) VALUES (?, 'สำเร็จ', ?)`, [syncTargets.join(','), triggerBy]);
        await taskHistoryService.updateTaskStatus('github', new Date(), 'success', logResult.insertId);
        
        return 'Sync Success';
        
    } catch (error) {
        const errMsg = error.message.substring(0, 150);
        await db.query(`INSERT INTO github_sync_logs (sync_targets, status, created_by) VALUES (?, ?, ?)`, [syncTargets.join(','), `ล้มเหลว: ${errMsg}`, triggerBy]);
        throw error;
    }
};

/**
 * 📁 ค้นหาหรือสร้างโฟลเดอร์ย่อยตามวันที่ (DD-MM-YYYY)
 */
const getOrCreateDateFolder = async (drive, parentFolderId) => {
    const thaiTime = new Date(new Date().toLocaleString("en-US", { timeZone: "Asia/Bangkok" }));
    const dd = String(thaiTime.getDate()).padStart(2, '0');
    const mm = String(thaiTime.getMonth() + 1).padStart(2, '0');
    const yyyy = thaiTime.getFullYear();
    const folderName = `${dd}-${mm}-${yyyy}`;

    // ค้นหาโฟลเดอร์ที่มีชื่อนี้อยู่แล้วใน parent
    let query = `name = '${folderName}' and mimeType = 'application/vnd.google-apps.folder' and trashed = false`;
    if (parentFolderId) query += ` and '${parentFolderId}' in parents`;

    const res = await drive.files.list({
        q: query,
        fields: 'files(id, name)',
        spaces: 'drive'
    });

    if (res.data.files && res.data.files.length > 0) {
        return res.data.files[0].id;
    }

    // ถ้าไม่พบ ให้สร้างใหม่
    const folderMetadata = {
        name: folderName,
        mimeType: 'application/vnd.google-apps.folder'
    };
    if (parentFolderId) folderMetadata.parents = [parentFolderId];

    const folder = await drive.files.create({
        requestBody: folderMetadata,
        fields: 'id'
    });

    return folder.data.id;
};

// ✅ Helper สำหรับจัดรูปแบบวันที่ย่อและเวลา (สไตล์ไทยระดับโลก)
const formatThaiTooltip = (dateInput) => {
    const d = new Date(dateInput.toLocaleString("en-US", { timeZone: "Asia/Bangkok" }));
    const dd = d.getDate();
    const months = ["ม.ค.", "ก.พ.", "มี.ค.", "เม.ย.", "พ.ค.", "มิ.ย.", "ก.ค.", "ส.ค.", "ก.ย.", "ต.ค.", "พ.ย.", "ธ.ค."];
    const mm = months[d.getMonth()];
    const yyyy = (d.getFullYear() + 543).toString().slice(-2);
    const hh = String(d.getHours()).padStart(2, '0');
    const min = String(d.getMinutes()).padStart(2, '0');
    const ss = String(d.getSeconds()).padStart(2, '0');
    return `ไฟล์วันที่ ${dd} ${mm} ${yyyy} เวลา:${hh}:${min}:${ss}`;
};

const performGDriveSync = async (triggerBy = 'System', syncTargets = ['database', 'source']) => {
    try {
        const [rows] = await db.query('SELECT * FROM gdrive_settings WHERE id = 1');
        if (rows.length === 0 || !rows[0].client_id || !rows[0].client_secret || !rows[0].refresh_token) {
            throw new Error('กรุณาตั้งค่า Client ID, Client Secret และ Refresh Token ของ Google Drive ให้ครบถ้วนก่อน');
        }
        const settings = rows[0];

        const oauth2Client = new google.auth.OAuth2(
            settings.client_id,
            settings.client_secret,
            'https://developers.google.com/oauthplayground'
        );

        oauth2Client.setCredentials({ refresh_token: settings.refresh_token });

        const drive = google.drive({ version: 'v3', auth: oauth2Client });
        
        const rootFolderId = settings.folder_id ? settings.folder_id.trim() : null;
        
        // ✅ สร้าง/หาโฟลเดอร์วันที่ก่อน
        const targetFolderId = await getOrCreateDateFolder(drive, rootFolderId);
        
        let uploadedFiles = [];
        let gdriveFileIds = [];
        let remarks = [];

        const dbBackupDir = path.resolve(__dirname, '../../backups/database');
        const sourceBackupDir = path.resolve(__dirname, '../../backups/source');

        const nowTooltip = formatThaiTooltip(new Date());

        // 1. อัปโหลด Database (.sql) ล่าสุด
        if (syncTargets.includes('database') && fs.existsSync(dbBackupDir)) {
            const files = fs.readdirSync(dbBackupDir).filter(f => f.endsWith('.sql'));
            if (files.length > 0) {
                files.sort((a, b) => fs.statSync(path.join(dbBackupDir, b)).mtimeMs - fs.statSync(path.join(dbBackupDir, a)).mtimeMs);
                const latestDbFile = files[0];
                const filePath = path.join(dbBackupDir, latestDbFile);
                const fileStats = fs.statSync(filePath);
                const fileTooltip = formatThaiTooltip(fileStats.mtime);
                
                const fileMetadata = { 
                    name: latestDbFile,
                    parents: [targetFolderId] 
                };

                // ✅ [New] ตรวจสอบและอัปเดตไฟล์เดิมแทนการลบและสร้างใหม่ (Keep File ID)
                const existingFiles = await drive.files.list({
                    q: `name = '${latestDbFile}' and '${targetFolderId}' in parents and trashed = false`,
                    fields: 'files(id, name)'
                });

                let isDbOverwrite = false;
                let existingFileId = null;

                if (existingFiles.data.files && existingFiles.data.files.length > 0) {
                    existingFileId = existingFiles.data.files[0].id;
                    isDbOverwrite = true;
                    console.log(`🔄 Updating existing GDrive DB file: ${latestDbFile} (${existingFileId})`);
                    
                    // 🔄 อัปเดตรายการเดิมในฐานข้อมูล (แทนที่ข้อความเดิม)
                    try {
                        const [oldLogs] = await db.query("SELECT log_id, remarks FROM gdrive_sync_logs WHERE gdrive_file_ids LIKE ?", [`%${existingFileId}%`]);
                        for (const old of oldLogs) {
                            const typePrefix = "Database:";
                            const overwriteRemark = `${typePrefix} มีการอัปโหลดซ้ำ (${fileTooltip})`; // ✅ ใช้ fileTooltip เดียวกัน
                            
                            let remarkLines = old.remarks ? old.remarks.split('|').map(l => l.trim()) : [];
                            remarkLines = remarkLines.filter(line => !line.startsWith(typePrefix));
                            remarkLines.push(overwriteRemark);
                            
                            const newRemarks = remarkLines.join(' | ');
                            await db.query("UPDATE gdrive_sync_logs SET remarks = ? WHERE log_id = ?", [newRemarks, old.log_id]);
                        }
                    } catch (e) { console.error("Update old log error:", e.message); }
                }
                
                const media = {
                    mimeType: 'application/sql',
                    body: fs.createReadStream(filePath)
                };

                let res;
                if (isDbOverwrite) {
                    res = await drive.files.update({
                        fileId: existingFileId,
                        media: media,
                        fields: 'id'
                    });
                } else {
                    res = await drive.files.create({
                        requestBody: fileMetadata,
                        media: media,
                        fields: 'id'
                    });
                }
                uploadedFiles.push('DB');
                gdriveFileIds.push({ type: 'DB', id: res.data.id, name: latestDbFile });
                remarks.push(`Database: ${isDbOverwrite ? 'ไฟล์เดิม' : 'ไฟล์ใหม่'} (${fileTooltip})`);
            }
        }

        // 2. อัปโหลด Source Code (.zip) ล่าสุด
        if (syncTargets.includes('source') && fs.existsSync(sourceBackupDir)) {
            const files = fs.readdirSync(sourceBackupDir).filter(f => f.endsWith('.zip'));
            if (files.length > 0) {
                files.sort((a, b) => fs.statSync(path.join(sourceBackupDir, b)).mtimeMs - fs.statSync(path.join(sourceBackupDir, a)).mtimeMs);
                const latestSrcFile = files[0];
                const filePath = path.join(sourceBackupDir, latestSrcFile);
                const fileStats = fs.statSync(filePath);
                const fileTooltip = formatThaiTooltip(fileStats.mtime);
                
                const fileMetadata = { 
                    name: latestSrcFile,
                    parents: [targetFolderId] // ใส่ลงในโฟลเดอร์วันที่
                };

                // ✅ [New] ตรวจสอบและอัปเดตไฟล์เดิมแทนการลบและสร้างใหม่ (Keep File ID)
                const existingFiles = await drive.files.list({
                    q: `name = '${latestSrcFile}' and '${targetFolderId}' in parents and trashed = false`,
                    fields: 'files(id, name)'
                });

                let isSrcOverwrite = false;
                let existingFileId = null;

                if (existingFiles.data.files && existingFiles.data.files.length > 0) {
                    existingFileId = existingFiles.data.files[0].id;
                    isSrcOverwrite = true;
                    console.log(`🔄 Updating existing GDrive Source file: ${latestSrcFile} (${existingFileId})`);

                    // 🔄 อัปเดตรายการเดิมในฐานข้อมูล (แทนที่ข้อความใหม่ที่ใช้ fileTooltip เดียวกันเพื่อการจับคู่)
                    try {
                        const [oldLogs] = await db.query("SELECT log_id, remarks FROM gdrive_sync_logs WHERE gdrive_file_ids LIKE ?", [`%${existingFileId}%`]);
                        for (const old of oldLogs) {
                            const typePrefix = "Source Code:";
                            const overwriteRemark = `${typePrefix} มีการอัปโหลดซ้ำ (${fileTooltip})`; // ✅ ใช้ fileTooltip เดียวกัน
                            
                            let remarkLines = old.remarks ? old.remarks.split('|').map(l => l.trim()) : [];
                            remarkLines = remarkLines.filter(line => !line.startsWith(typePrefix));
                            remarkLines.push(overwriteRemark);
                            
                            const newRemarks = remarkLines.join(' | ');
                            await db.query("UPDATE gdrive_sync_logs SET remarks = ? WHERE log_id = ?", [newRemarks, old.log_id]);
                        }
                    } catch (e) { console.error("Update old log error:", e.message); }
                }
                
                const media = {
                    mimeType: 'application/zip',
                    body: fs.createReadStream(filePath)
                };

                let res;
                if (isSrcOverwrite) {
                    res = await drive.files.update({
                        fileId: existingFileId,
                        media: media,
                        fields: 'id'
                    });
                } else {
                    res = await drive.files.create({
                        requestBody: fileMetadata,
                        media: media,
                        fields: 'id'
                    });
                }
                uploadedFiles.push('Source');
                gdriveFileIds.push({ type: 'Source', id: res.data.id, name: latestSrcFile });
                remarks.push(`Source Code: ${isSrcOverwrite ? 'ไฟล์เดิม' : 'ไฟล์ใหม่'} (${fileTooltip})`);
            }
        }

        if (uploadedFiles.length === 0) {
            await db.query(`INSERT INTO gdrive_sync_logs (sync_targets, status, created_by) VALUES (?, 'สำเร็จ (ไม่พบไฟล์อัปโหลด)', ?)`, [syncTargets.join(','), triggerBy]);
            return 'No Files Uploaded';
        }

        const idsJson = JSON.stringify(gdriveFileIds);
        const finalRemarks = remarks.length > 0 ? remarks.join(' | ') : 'สำรองข้อมูลใหม่';
        const [logResult] = await db.query(`INSERT INTO gdrive_sync_logs (sync_targets, status, gdrive_file_ids, remarks, created_by) VALUES (?, 'สำเร็จ', ?, ?, ?)`, [syncTargets.join(','), idsJson, finalRemarks, triggerBy]);
        
        // ✅ อัปเดตสถานะในประวัติแผนงาน
        await taskHistoryService.updateTaskStatus('gdrive', new Date(), 'success', logResult.insertId);

        console.log(`✅ Google Drive Sync success into folder: ${uploadedFiles.join(', ')}`);
        return 'Sync Success';
        
    } catch (error) {
        console.error("❌ Google Drive Sync Error:", error.message);
        const errMsg = error.message.substring(0, 150);
        await db.query(`INSERT INTO gdrive_sync_logs (sync_targets, status, created_by) VALUES (?, ?, ?)`, [syncTargets.join(','), `ล้มเหลว: ${errMsg}`, triggerBy]);
        throw error;
    }
};

/**
 * 🗑️ ลบไฟล์บน Google Drive
 */
const deleteGDriveFileFromCloud = async (fileIdsArray) => {
    try {
        const [rows] = await db.query('SELECT * FROM gdrive_settings WHERE id = 1');
        if (rows.length === 0) return;
        const settings = rows[0];

        const oauth2Client = new google.auth.OAuth2(settings.client_id, settings.client_secret, 'https://developers.google.com/oauthplayground');
        oauth2Client.setCredentials({ refresh_token: settings.refresh_token });
        const drive = google.drive({ version: 'v3', auth: oauth2Client });

        for (const file of fileIdsArray) {
            try {
                await drive.files.delete({ fileId: file.id });
                console.log(`🗑️ Deleted file ${file.id} from GDrive`);
            } catch (err) {
                console.warn(`⚠️ Could not delete file ${file.id} from GDrive (maybe already deleted):`, err.message);
            }
        }
    } catch (error) {
        console.error("❌ GDrive Delete Error:", error.message);
    }
};

/**
 * 🔍 ตรวจสอบความคงอยู่ของไฟล์บน GDrive (Batch Check) พร้อมเช็ค Trash
 */
const verifyGDriveFiles = async (fileIdsArray) => {
    try {
        const [rows] = await db.query('SELECT * FROM gdrive_settings WHERE id = 1');
        if (rows.length === 0) return fileIdsArray.map(f => ({ ...f, exists: false, trashed: false }));
        const settings = rows[0];

        const oauth2Client = new google.auth.OAuth2(settings.client_id, settings.client_secret, 'https://developers.google.com/oauthplayground');
        oauth2Client.setCredentials({ refresh_token: settings.refresh_token });
        const drive = google.drive({ version: 'v3', auth: oauth2Client });

        const results = [];
        for (const file of fileIdsArray) {
            try {
                // ✅ เพิ่มการเรียกฟิลด์ trashed
                const res = await drive.files.get({ 
                    fileId: file.id,
                    fields: 'id, name, trashed'
                });
                results.push({ 
                    ...file, 
                    exists: true, 
                    trashed: res.data.trashed === true 
                });
            } catch (err) {
                results.push({ ...file, exists: false, trashed: false });
            }
        }
        return results;
    } catch (error) {
        return fileIdsArray.map(f => ({ ...f, exists: false, trashed: false }));
    }
};

/**
 * 🗑️ ลบไฟล์สำรองข้อมูลแบบกลุ่ม (Bulk Delete Database)
 */
const bulkDeleteBackups = async (fileNames) => {
    const backupDir = path.resolve(__dirname, '../../backups/database');
    let deletedCount = 0;

    for (const fileName of fileNames) {
        try {
            const filePath = path.join(backupDir, fileName);
            if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
            await db.query('DELETE FROM backup_logs WHERE file_name = ?', [fileName]);
            deletedCount++;
        } catch (err) {
            console.warn(`⚠️ Could not delete ${fileName}:`, err.message);
        }
    }
    return deletedCount;
};

/**
 * 🗑️ ลบไฟล์สำรอง Source Code แบบกลุ่ม (Bulk Delete Source)
 */
const bulkDeleteSourceBackups = async (fileNames) => {
    const backupDir = path.resolve(__dirname, '../../backups/source');
    let deletedCount = 0;

    for (const fileName of fileNames) {
        try {
            const filePath = path.join(backupDir, fileName);
            if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
            await db.query('DELETE FROM source_backup_logs WHERE file_name = ?', [fileName]);
            deletedCount++;
        } catch (err) {
            console.warn(`⚠️ Could not delete source ${fileName}:`, err.message);
        }
    }
    return deletedCount;
};

/**
 * 🗑️ ลบประวัติ GitHub Sync แบบกลุ่ม
 */
const bulkDeleteGithubLogs = async (logIds) => {
    if (!logIds || logIds.length === 0) return 0;
    const [result] = await db.query('DELETE FROM github_sync_logs WHERE log_id IN (?)', [logIds]);
    return result.affectedRows;
};

/**
 * 🗑️ ลบประวัติ Google Drive Sync แบบกลุ่ม (เฉพาะใน DB)
 */
const bulkDeleteGDriveLogs = async (logIds) => {
    if (!logIds || logIds.length === 0) return 0;
    const [result] = await db.query('DELETE FROM gdrive_sync_logs WHERE log_id IN (?)', [logIds]);
    return result.affectedRows;
};

const getGDriveQuota = async () => {
    try {
        const [rows] = await db.query('SELECT * FROM gdrive_settings WHERE id = 1');
        if (rows.length === 0 || !rows[0].client_id || !rows[0].client_secret || !rows[0].refresh_token) {
            return null;
        }
        const settings = rows[0];

        const oauth2Client = new google.auth.OAuth2(
            settings.client_id,
            settings.client_secret,
            'https://developers.google.com/oauthplayground'
        );

        oauth2Client.setCredentials({ refresh_token: settings.refresh_token });
        const drive = google.drive({ version: 'v3', auth: oauth2Client });
        
        const res = await drive.about.get({ fields: 'storageQuota' });
        return res.data.storageQuota;
    } catch (e) {
        console.error("GDrive Quota Error:", e.message);
        return null;
    }
};

module.exports = { 
    performBackup, 
    performSourceBackup, 
    performGithubSync, 
    performGDriveSync, 
    deleteGDriveFileFromCloud, 
    verifyGDriveFiles,
    bulkDeleteBackups,
    bulkDeleteSourceBackups,
    bulkDeleteGithubLogs,
    bulkDeleteGDriveLogs,
    getGDriveQuota
};


