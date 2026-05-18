const taskHistoryService = require('../services/taskHistoryService');
const dayjs = require('dayjs');

async function run() {
    console.log('Regenerating task history for the next 15 days...');
    for (let i = 0; i <= 15; i++) {
        const targetDate = dayjs().add(i, 'day');
        await taskHistoryService.generateTasksForDate(targetDate);
    }
    console.log('Done!');
    process.exit(0);
}

run();
