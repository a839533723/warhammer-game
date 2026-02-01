#!/usr/bin/env python3
"""
战锤40K游戏 - AI后端代理
用于安全地调用千问API，避免CORS问题和密钥暴露
"""

from flask import Flask, request, jsonify
import requests
import os

app = Flask(__name__)

# API密钥（从环境变量读取，更安全）
API_KEY = os.environ.get('QWEN_API_KEY', 'sk-7324d922204640fd87ad5ae868b82376')

@app.route('/api/chat', methods=['POST', 'OPTIONS'])
def chat():
    # 处理CORS
    if request.method == 'OPTIONS':
        response = jsonify({'status': 'ok'})
        response.headers['Access-Control-Allow-Origin'] = '*'
        response.headers['Access-Control-Allow-Methods'] = 'POST'
        response.headers['Access-Control-Allow-Headers'] = 'Content-Type'
        return response
    
    try:
        data = request.json
        prompt = data.get('prompt', '')
        max_tokens = data.get('max_tokens', 500)
        
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
    app.run(port=5000, debug=True)
