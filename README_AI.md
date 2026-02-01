# 启用AI功能指南

## 问题说明
由于浏览器CORS安全限制，千问API无法从浏览器直接调用。需要通过后端代理。

## 解决方案

### 方法1：在Windows电脑上运行后端（推荐）

1. **确保安装了Python**
   - 按 `Win + R`，输入 `python --version`
   - 如果没安装，从 https://python.org 下载安装

2. **安装依赖**
   ```bash
   pip install flask requests
   ```

3.**
   ```bash
   cd C **运行后端:\你的游戏目录\warhammer-game
   python ai_backend.py
   ```
   - 会显示 "Running on http://localhost:5000"
   - 保持这个窗口打开

4. **刷新游戏页面**
   - 访问 http://localhost:8080
   - AI功能应该能正常工作了！

### 方法2：完全使用预设（当前状态）
- 游戏已内置113条预设文本
- 无需后端，AI调用失败时自动使用预设
- 游戏体验依然丰富

## 后端代理说明

`ai_backend.py` 是一个简单的Flask服务器：
- 监听 http://localhost:5000/api/chat
- 接收游戏前端的请求
- 代理调用千问API
- 返回AI生成的文本

## 千问API密钥

已在代码中配置：
```
sk-7324d922204640fd87ad5ae868b82376
```

如果需要更换，可以：
1. 设置环境变量 `QWEN_API_KEY`
2. 或直接修改 `ai_backend.py`
