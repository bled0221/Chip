require('dotenv').config();
const fs = require('node:fs');
const path = require('node:path');
const { Client, Collection, GatewayIntentBits } = require('discord.js');
// 🚀 [추가] SQLite 데이터베이스 연결을 위한 라이브러리 로드
const { open } = require('sqlite');
const sqlite3 = require('sqlite3');

const client = new Client({ 
    intents: [
        GatewayIntentBits.Guilds, 
        GatewayIntentBits.GuildMessages, 
        GatewayIntentBits.MessageContent, 
        GatewayIntentBits.GuildMembers
    ] 
});

client.commands = new Collection();
client.prefixCommands = new Collection();

// 🚀 [추가] 봇이 켜질 때 DB를 자동으로 연결하고 테이블(표)을 만드는 비동기 함수
const initDatabase = async () => {
    try {
        // 프로젝트 폴더 안에 'database.db' 파일을 생성하거나 엽니다.
        client.db = await open({
            filename: path.join(__dirname, 'database.db'),
            driver: sqlite3.Database
        });

        // 유저들의 돈통 데이터를 저장할 'users' 테이블 생성 (없을 때만 생성)
        // id: 유저 디코드 ID (기본키)
        // money: 보유 자산 (기본값 0원)
        // last_daily: 마지막으로 !돈받기(출석)를 한 시간 타임스탬프 (기본값 0)
        await client.db.exec(`
            CREATE TABLE IF NOT EXISTS users (
                id TEXT PRIMARY KEY,
                money INTEGER DEFAULT 0,
                last_daily INTEGER DEFAULT 0
            )
        `);
        console.log('🗄️ [DB] SQLite 데이터베이스 연결 및 유저 테이블 초기화 완료!');
    } catch (error) {
        console.error('❌ [DB] 데이터베이스 초기화 중 에러가 발생했습니다:');
        console.error(error);
    }
};
// DB 초기화 실행
initDatabase();

// 1. 명령어 로딩 (기존 형식 100% 유지)
const loadCommands = () => {
    const folders = ['commands', 'dev-commands']; 
    for (const folder of folders) {
        const commandsPath = path.join(__dirname, folder);
        if (!fs.existsSync(commandsPath)) continue; 
        const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));
        for (const file of commandFiles) {
            const filePath = path.join(__dirname, folder, file);
            delete require.cache[require.resolve(filePath)]; 
            const command = require(filePath);
            
            if (command.data && command.execute) {
                client.commands.set(command.data.name, command);
            } else if (command.name && command.execute) {
                client.prefixCommands.set(command.name, command);
            }
        }
    }
};
loadCommands();

// 2. 이벤트 로딩 (새롭게 추가된 자동 이벤트 등록기)
const eventsPath = path.join(__dirname, 'events');
if (fs.existsSync(eventsPath)) {
    const eventFiles = fs.readdirSync(eventsPath).filter(file => file.endsWith('.js'));
    for (const file of eventFiles) {
        const filePath = path.join(eventsPath, file);
        const event = require(filePath);
        
        if (event.once) {
            client.once(event.name, (...args) => event.execute(...args));
        } else {
            client.on(event.name, (...args) => event.execute(...args));
        }
    }
}
// ==========================================
// 4. 전역 에러 핸들링 (봇 다운 방지 시스템)
// ==========================================

// 예기치 못한 비동기 에러(Promise Rejection) 처리
process.on('unhandledRejection', (reason, promise) => {
    console.error('⚠️ [비동기 에러 발생] 코드가 올바르게 처리되지 않았습니다:');
    console.error(reason);
});

// 잡지 못한 치명적인 시스템 에러(Uncaught Exception) 처리
process.on('uncaughtException', (error) => {
    console.error('❌ [치명적 에러 발생] 봇이 꺼지는 것을 방지했습니다:');
    console.error(error);
});

client.login(process.env.TOKEN);