const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');

/**
 * ฟังก์ชันสำหรับรัน Shell Command (จำกัดความปลอดภัยเบื้องต้น)
 */
const runCommand = (command) => {
    return new Promise((resolve, reject) => {
        // จำกัดคำสั่งอันตราย (ตัวอย่างเบื้องต้น)
        const forbidden = ['rm -rf /', 'format', 'mkfs'];
        if (forbidden.some(f => command.includes(f))) {
            return reject(new Error("Command forbidden for security reasons."));
        }

        exec(command, { cwd: path.join(__dirname, '../../') }, (error, stdout, stderr) => {
            if (error) {
                resolve({ error: error.message, stderr });
            } else {
                resolve({ stdout, stderr });
            }
        });
    });
};

/**
 * ฟังก์ชันสำหรับอ่านไฟล์ในโปรเจค
 */
const readFile = (filePath) => {
    try {
        const fullPath = path.resolve(__dirname, '../../', filePath);
        if (!fullPath.startsWith(path.resolve(__dirname, '../../'))) {
            throw new Error("Access denied: Outside of project scope.");
        }
        const content = fs.readFileSync(fullPath, 'utf8');
        return { content };
    } catch (error) {
        return { error: error.message };
    }
};

/**
 * ฟังก์ชันสำหรับเขียนไฟล์ในโปรเจค
 */
const writeFile = (filePath, content) => {
    try {
        const fullPath = path.resolve(__dirname, '../../', filePath);
        if (!fullPath.startsWith(path.resolve(__dirname, '../../'))) {
            throw new Error("Access denied: Outside of project scope.");
        }
        // Backup ก่อนเขียน
        if (fs.existsSync(fullPath)) {
            const backupPath = fullPath + '.bak';
            fs.copyFileSync(fullPath, backupPath);
        }
        fs.writeFileSync(fullPath, content, 'utf8');
        return { success: true };
    } catch (error) {
        return { error: error.message };
    }
};

module.exports = {
    runCommand,
    readFile,
    writeFile
};
