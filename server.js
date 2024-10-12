require('dotenv').config();
const express = require('express');
const wechat = require('wechat');
const fs = require('fs');
const cors = require('cors');
const crypto = require('crypto');
const morgan = require('morgan');
const path = require('path');

const logDirectory = path.join(__dirname, 'logs');
fs.existsSync(logDirectory) || fs.mkdirSync(logDirectory);
const accessLogStream = fs.createWriteStream(path.join(logDirectory, 'running.log'), { flags: 'a' });

const app = express();
const dbPath = './codes.json';

app.use(cors({
    origin: function (origin, callback) {
        if (!origin || origin.endsWith('.itwk.cc')) {
            callback(null, true);
        } else {
            callback(new Error('Not allowed by CORS'));
        }
    }
}));

app.use(express.json());

app.use(morgan('combined', { stream: accessLogStream }));

function readData() {
    if (!fs.existsSync(dbPath)) {
        fs.writeFileSync(dbPath, JSON.stringify({}));
    }
    return JSON.parse(fs.readFileSync(dbPath));
}

function saveData(data) {
    fs.writeFileSync(dbPath, JSON.stringify(data));
}

function cleanExpiredCodes(data) {
    const currentTimestamp = Date.now();
    for (const userKey of Object.keys(data)) {
        if (currentTimestamp - data[userKey].timestamp > 12 * 60 * 60 * 1000) {
            delete data[userKey];
        }
    }
    saveData(data);
}

app.use('/', wechat({
    token: process.env.WECHAT_TOKEN,
    appid: process.env.WECHAT_APPID,
    encodingAESKey: process.env.ENCODING_AES_KEY,
    checkSignature: false
}, async (req, res, next) => {
    const { FromUserName, Content } = req.weixin;

    if (Content.trim() === '验证码') {
        const userKey = FromUserName;
        const data = readData();
        const userData = data[userKey];
        const today = new Date().toISOString().split('T')[0];

        if (userData && userData.date === today) {
            return res.reply(`今天已经获取过验证码了, 您的验证码是: ${userData.code}`);
        }

        const newCode = Math.floor(100000 + Math.random() * 900000).toString();
        const timestamp = Date.now();

        data[userKey] = {
            code: newCode,
            date: today,
            timestamp: timestamp
        };
        saveData(data);

        return res.reply(`您的验证码是: ${newCode}（12小时内有效）`);
    }

    res.reply('未知指令，请回复“验证码”获取验证码');
}));

app.post('/verify', (req, res) => {
    const { code } = req.body;
    const data = readData();
    cleanExpiredCodes(data);

    const isValid = Object.values(data).some(userData => userData.code === code);

    if (isValid) {
        return res.json({ success: true, message: '验证码有效' });
    } else {
        return res.json({ success: false, message: '验证码无效或已过期' });
    }
});

app.get('/eventCall', (req, res) => {
    const { signature, timestamp, nonce, echostr } = req.query;
    const token = process.env.WECHAT_TOKEN;
    const arr = [token, timestamp, nonce].sort();
    const str = arr.join('');
    const sha1 = crypto.createHash('sha1').update(str).digest('hex');

    if (sha1 === signature) {
        res.send(echostr);
    } else {
        res.status(403).send('Forbidden');
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server listening at http://localhost:${PORT}`);
});
