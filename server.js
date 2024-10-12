require('dotenv').config();
const express = require('express');
const wechat = require('wechat');
const fs = require('fs');
const cors = require('cors');
const crypto = require('crypto');

const app = express();
const dbPath = './codes.json'; // 验证码存储文件

// CORS 中间件
app.use(cors({
    origin: function (origin, callback) {
        if (!origin || origin.endsWith('.itwk.cc')) {
            callback(null, true);
        } else {
            callback(new Error('Not allowed by CORS'));
        }
    }
}));

app.use(express.json()); // 允许解析JSON请求体

// 读JSON数据
function readData() {
    if (!fs.existsSync(dbPath)) {
        fs.writeFileSync(dbPath, JSON.stringify({}));
    }
    return JSON.parse(fs.readFileSync(dbPath));
}

// 保存JSON数据
function saveData(data) {
    fs.writeFileSync(dbPath, JSON.stringify(data));
}

// 清理过期验证码（12小时内有效）
function cleanExpiredCodes(data) {
    const currentTimestamp = Date.now();
    for (const userKey of Object.keys(data)) {
        if (currentTimestamp - data[userKey].timestamp > 12 * 60 * 60 * 1000) {
            delete data[userKey]; // 删除过期数据
        }
    }
    saveData(data);
}

// 处理微信请求
app.use('/', wechat({
    token: process.env.WECHAT_TOKEN,
    appid: process.env.WECHAT_APPID,
    encodingAESKey: process.env.ENCODING_AES_KEY,
    checkSignature: false
}, async (req, res, next) => {
    const { FromUserName, Content } = req.weixin;

    // 处理“验证码”请求
    if (Content.trim() === '验证码') {
        const userKey = FromUserName;
        const data = readData();

        // 检查是否已经生成过验证码
        const userData = data[userKey];
        const today = new Date().toISOString().split('T')[0];

        if (userData && userData.date === today) {
            return res.reply(`今天已经获取过验证码了, 您的验证码是: ${userData.code}`);
        }

        // 生成新的验证码
        const newCode = Math.floor(100000 + Math.random() * 900000).toString(); // 生成6位随机数字
        const timestamp = Date.now();

        // 插入或更新验证码
        data[userKey] = {
            code: newCode,
            date: today,
            timestamp: timestamp
        };
        saveData(data);

        return res.reply(`您的验证码是: ${newCode}（12小时内有效）`);
    }

    // 处理其他消息
    res.reply('未知指令，请回复“验证码”获取验证码');
}));

// 验证验证码的接口
app.post('/verify', (req, res) => {
    const { code } = req.body;
    const data = readData();
    cleanExpiredCodes(data); // 清理过期验证码

    // 检查验证码是否存在
    const isValid = Object.values(data).some(userData => userData.code === code);

    if (isValid) {
        return res.json({ success: true, message: '验证码有效' });
    } else {
        return res.json({ success: false, message: '验证码无效或已过期' });
    }
});

// 处理微信服务器的 GET 请求，验证接口配置信息
app.get('/eventCall', (req, res) => {
    const { signature, timestamp, nonce, echostr } = req.query;

    // 验证签名
    const token = process.env.WECHAT_TOKEN;
    const arr = [token, timestamp, nonce].sort();
    const str = arr.join('');
    const sha1 = crypto.createHash('sha1').update(str).digest('hex');

    if (sha1 === signature) {
        res.send(echostr); // 验证通过，返回 echostr
    } else {
        res.status(403).send('Forbidden'); // 验证失败
    }
});

// 启动服务器
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server listening at http://localhost:${PORT}`);
});
