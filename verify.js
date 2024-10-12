require('dotenv').config();
const express = require('express');
const fs = require('fs');
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = process.env.VERIFY_PORT || 4001;

const DB_PATH = path.resolve('./codes.json');

app.use(cors());
app.use(express.json());

if (!fs.existsSync(DB_PATH)) {
    fs.writeFileSync(DB_PATH, JSON.stringify({}));
}

function readData() {
    const data = fs.readFileSync(DB_PATH, 'utf-8');
    return JSON.parse(data);
}

function saveData(data) {
    fs.writeFileSync(DB_PATH, JSON.stringify(data, null, 2));
}

function cleanExpiredCodes(data) {
    const currentTimestamp = Date.now();
    for (const userKey of Object.keys(data)) {
        if (currentTimestamp - data[userKey].timestamp > 12 * 60 * 60 * 1000) {
            delete data[userKey];
        }
    }
}

app.post('/verify', (req, res) => {
    const { code } = req.body;

    if (!code) {
        return res.status(400).json({ code: 0, msg: '验证码不能为空' });
    }

    const data = readData();
    cleanExpiredCodes(data);

    const isValid = Object.values(data).some(userData => userData.code === code);

    if (isValid) {
        return res.json({ code: 200, msg: 'ok' });
    } else {
        return res.json({ code: 0, msg: 'err' });
    }
});

app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
