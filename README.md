# Alist_Dynamic_verification
这是一个基于 Node.js 的动态验证码验证系统，主要用于通过微信获取验证码，并通过 REST API 验证这些验证码。

演示地址：[主页 | AList (itwk.cc)](https://pan.itwk.cc/)

## 特性

- 通过微信请求生成动态验证码
- 验证验证码有效性
- 清理过期验证码
- 支持跨域请求

## 目录结构

.
├── LICENSE
├── logs
├── node_modules
├── package.json
├── package-lock.json
├── README.md
├── server.js        # 微信请求处理和验证码生成的主服务器
├── verify.js        # 验证验证码的接口服务器
└── codes.json       # 存储验证码的 JSON 文件

## 环境要求

- Node.js >= 18.x +

## 安装

1. 克隆这个仓库：

   ```bash
   git clone https://github.com/geeklinux-io/Alist_Dynamic_verification
   cd Alist_Dynamic_verification

2. 安装依赖：

   ```bash
   npm install
   ```

3. 编辑 `.env` 配置相关信息

   ```plaintext
   WECHAT_APPID=
   WECHAT_SECRET=
   WECHAT_TOKEN=
   ENCODING_AES_KEY=
   PORT=4000 # 后端运行端口，对接微信
   VERIFY_PORT=4001 # 验证接口的端口，对接前端验证验证码用的
   ```

## 启动服务器

1. 启动验证码服务器：

   ```bash
   node server.js
   ```

2. 启动验证服务器：

   ```bash
   node verify.js
   ```

3. 同时启动

   ```bash
   node run serve
   ```

   详情请查看 [package.json](https://github.com/geeklinux-io/Alist_Dynamic_verification/blob/main/package.json)中的定义

## API 接口

### 1. 获取验证码

- **请求方式**: POST
- **请求路径**: `/`
- **请求体**: 发送微信消息内容为“验证码”
- **返回示例**:

  ```json
  {
    "msg": "您的验证码是: 123456（12小时内有效）"
  }
  ```

### 2. 验证验证码

- **请求方式**: POST
- **请求路径**: `/verify`
- **请求体**:

  ```json
  {
    "code": "123456"
  }
  ```

- **返回示例**:

  - 验证成功：

  ```json
  {
    "code": 200,
    "msg": "ok"
  }
  ```

  - 验证失败：

  ```json
  {
    "code": 0,
    "msg": "err"
  }
  ```

## 许可证

此项目遵循 MIT 许可证。详细信息请参阅 [LICENSE](LICENSE) 文件。

## 贡献

欢迎提出建议和贡献代码！请提交问题或请求合并请求。

## 联系

如有任何问题，请联系 [admin@wanghaoyu.com.cn]。
