@echo off
chcp 65001 >nul
echo ========================================
echo     战锤40K - AI后端启动器
echo ========================================
echo.
echo 正在检查Python...

python --version >nul 2>&1
if errorlevel 1 (
    echo ❌ 未找到Python！
    echo.
    echo 请先安装Python：
    echo 1. 访问 https://www.python.org/downloads/
    echo 2. 下载并安装Python 3.x
    echo 3. 安装时勾选"Add Python to PATH"
    echo 4. 重新运行此脚本
    echo.
    pause
    exit /b 1
)

echo ✅ Python已找到
echo.
echo 正在安装依赖（首次运行可能需要一些时间）...
echo.
pip install flask requests -q

if errorlevel 1 (
    echo ❌ 安装依赖失败！
    echo.
    echo 请手动安装：
    echo   pip install flask requests
    echo.
    pause
    exit /b 1
)

echo ✅ 依赖安装完成
echo.
echo ========================================
echo     启动AI后端...
echo ========================================
echo.
echo 后端将运行在 http://localhost:5000
echo 请保持此窗口打开
echo 按 Ctrl+C 可停止后端
echo.
echo ========================================

python "%~dp0ai_backend.py"

echo.
echo 后端已停止。
pause
