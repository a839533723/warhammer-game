@echo off
chcp 65001 >nul
echo ========================================
echo     战锤40K - AI后端启动器
echo ========================================
echo.

REM 检查Python
echo [1/3] 检查Python...
python --version >nul 2>&1
if errorlevel 1 (
    echo ❌ Python未找到！
    echo.
    echo 请先安装Python:
    echo   https://www.python.org/downloads/
    echo.
    echo 安装时务必勾选 "Add Python to PATH"
    echo.
    pause
    exit /b 1
)
echo ✅ Python已找到

REM 检查Flask
echo [2/3] 检查Flask...
python -c "import flask" >nul 2>&1
if errorlevel 1 (
    echo ⚠️ Flask未安装，正在安装...
    pip install flask requests -q
    if errorlevel 1 (
        echo ❌ 安装Flask失败！
        echo.
        echo 请手动运行: pip install flask requests
        echo.
        pause
        exit /b 1
    )
    echo ✅ Flask安装完成
) else (
    echo ✅ Flask已安装
)

echo [3/3] 启动后端...
echo.
echo ========================================
echo     AI后端启动中...
echo ========================================
echo.
echo 后端地址: http://localhost:5000
echo 请保持此窗口打开
echo 按 Ctrl+C 可停止
echo.
echo ========================================
echo.

REM 运行后端
python "%~dp0ai_backend.py"

echo.
echo 后端已停止。
pause
