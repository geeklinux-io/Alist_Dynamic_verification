const express = require('express');
const fs = require('fs');
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = 4001;

// JSON 文件路径
const DB_PATH = path.resolve('./codes.json');

// 允许跨域
app.use(cors());
app.use(express.json()); // 解析 JSON 请求体

// 确保 JSON 文件存在
if (!fs.existsSync(DB_PATH)) {
    fs.writeFileSync(DB_PATH, JSON.stringify({}));
}

// 读取 JSON 数据
function readData() {
    const data = fs.readFileSync(DB_PATH, 'utf-8');
    return JSON.parse(data);
}

// 保存 JSON 数据
function saveData(data) {
    fs.writeFileSync(DB_PATH, JSON.stringify(data, null, 2));
}

// 清理过期的验证码（超过 12 小时）
function cleanExpiredCodes(data) {
    const currentTimestamp = Date.now(); // 当前时间戳（毫秒）
    for (const userKey of Object.keys(data)) {
        if (currentTimestamp - data[userKey].timestamp > 12 * 60 * 60 * 1000) {
            delete data[userKey]; // 删除过期数据
        }
    }
}

// 验证验证码的接口
app.post('/verify', (req, res) => {
    const { code } = req.body;

    if (!code) {
        return res.status(400).json({ code: 0, msg: '验证码不能为空' });
    }

    const data = readData();
    cleanExpiredCodes(data); // 清理过期验证码

    // 检查验证码是否存在
    const isValid = Object.values(data).some(userData => userData.code === code);

    if (isValid) {
        return res.json({ code: 200, msg: 'ok' });
    } else {
        return res.json({ code: 0, msg: 'err' });
    }
});

// 启动服务器
app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
