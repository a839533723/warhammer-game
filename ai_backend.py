#!/usr/bin/env python3
"""
战锤40K游戏 - AI后端代理
安全调用千问API，支持公网访问
"""

from flask import Flask, request, jsonify
import requests
import os
import time
import hashlib

app = Flask(__name__)

# API密钥
API_KEY = os.environ.get('QWEN_API_KEY', 'sk-7324d922204640fd87ad5ae868b82376')

# 速率限制（每分钟最多20次调用）
call_times = []
RATE_LIMIT = 20  # 每分钟
RATE_WINDOW = 60  # 秒

def check_rate_limit():
    """检查速率限制"""
    now = time.time()
    # 清理过期的时间戳
    global call_times
    call_times = [t for t in call_times if now - t < RATE_WINDOW]
    
    if len(call_times) >= RATE_LIMIT:
        return False
    
    call_times.append(now)
    return True

@app.route('/api/chat', methods=['POST', 'GET'])
def chat():
    """AI聊天接口"""
    # 处理CORS
    if request.method == 'GET':
        return jsonify({
            'status': 'ok',
            'message': '战锤40K AI后端运行中',
            'docs': 'POST /api/chat with {"prompt": "你的问题", "max_tokens": 500}'
        })
    
    # 速率限制
    if not check_rate_limit():
        return jsonify({
            'success': False,
            'error': 'Rate limit exceeded. Please wait a moment.'
        }), 429
    
    try:
        data = request.json or {}
        prompt = data.get('prompt', '')
        max_tokens = data.get('max_tokens', 500)
        
        if not prompt:
            return jsonify({
                'success': False,
                'error': 'No prompt provided'
            })
        
        # 调用千问API
        response = requests.post(
            'https://dashscope.aliyuncs.com/api/v1/services/aigc/text-generation/generation',
            headers={
                'Authorization': f'Bearer {API_KEY}',
                'Content-Type': 'application/json'
            },
            json={
                'model': 'qwen-turbo',
                'input': {
                    'messages': [{'role': 'user', 'content': prompt}]
                },
                'parameters': {
                    'max_tokens': max_tokens,
                    'temperature': 0.7
                }
            },
            timeout=30
        )
        
        result = response.json()
        
        if 'output' in result and 'text' in result['output']:
            return jsonify({
                'success': True,
                'text': result['output']['text']
            })
        else:
            return jsonify({
                'success': False,
                'error': result.get('error', 'Unknown error')
            })
            
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        })

if __name__ == '__main__':
    # 运行在 0.0.0.0:5000，监听所有网卡
    print("=" * 50)
    print("  战锤40K AI后端启动中...")
    print("  监听地址: http://0.0.0.0:5000")
    print("  速率限制: 20次/分钟")
    print("=" * 50)
    app.run(host='0.0.0.0', port=5000, debug=False, threaded=True)
