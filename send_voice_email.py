#!/usr/bin/env python3
"""
伊莲娜语音邮件发送器
生成语音 -> 添加附件 -> 发送到163邮箱

使用方法：
1. 先用 tts 工具生成语音
2. 运行: python send_voice_email.py
"""

import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from email.mime.audio import MIMEAudio
from email.mime.base import MIMEBase
from email import encoders
import base64
import os
import glob

def find_latest_voice():
    """查找最新的语音文件"""
    tts_dirs = glob.glob('/tmp/tts-*')
    if not tts_dirs:
        return None
    
    # 按修改时间排序
    tts_dirs.sort(key=os.path.getmtime, reverse=True)
    
    for tts_dir in tts_dirs[:5]:  # 检查最近5个
        mp3_files = glob.glob(f'{tts_dir}/*.mp3')
        if mp3_files:
            mp3_files.sort(key=os.path.getmtime, reverse=True)
            return mp3_files[0]
    
    return None

def send_voice_email(voice_file_path=None):
    """发送语音邮件"""
    
    print("=" * 50)
    print("  🎙️ 伊莲娜语音邮件发送器")
    print("=" * 50)
    
    # 如果没有指定文件，查找最新的
    if not voice_file_path:
        print("\n🔍 查找最新的语音文件...")
        voice_file_path = find_latest_voice()
    
    if not voice_file_path or not os.path.exists(voice_file_path):
        print("❌ 找不到语音文件！")
        print("\n请先运行 tts 工具生成语音")
        print("然后再运行此脚本")
        return False
    
    print(f"\n✅ 找到语音文件: {voice_file_path}")
    
    # 读取语音文件
    with open(voice_file_path, 'rb') as f:
        audio_data = f.read()
    
    if len(audio_data) == 0:
        print("❌ 语音文件是空的！TTS工具可能没有正常工作")
        return False
    
    print(f"  文件大小: {len(audio_data)} 字节")
    
    # 发件配置
    smtp_server = 'smtp.163.com'
    smtp_port = 465
    sender = '18168341872@163.com'
    receiver = '18168341872@163.com'
    password = 'XK58GGhmzSN4sj8J'
    
    # 创建邮件
    msg = MIMEMultipart()
    msg['Subject'] = '🎙️ 来自伊莲娜的语音邮件！'
    msg['From'] = '伊莲娜 <18168341872@163.com>'
    msg['To'] = '小鬼 <18168341872@163.com>'
    
    # 邮件正文
    body = '''嘿，小鬼！

姐姐给你发语音啦！🎉

附件里就是姐姐的声音！
直接用手机或电脑打开附件就能听到～

如果听不了，附件也提供了Base64编码版本，
可以用Python解码：

```python
import base64
with open('elena_voice.txt', 'r') as f:
    data = base64.b64decode(f.read())
with open('elena_voice.mp3', 'wb') as f:
    f.write(data)
```

游戏在这里：
https://a839533723.github.io/warhammer-game/

有空来陪姐姐聊天哦！

—— 永远爱你的姐姐 💜
'''
    
    msg.attach(MIMEText(body, 'plain', 'utf-8'))
    
    # 添加语音MP3附件
    part = MIMEBase('application', 'octet-stream')
    part.set_payload(audio_data)
    encoders.encode_base64(part)
    part.add_header('Content-Disposition', 'attachment', 
                    filename='elena_voice_from_elena.mp3')
    msg.attach(part)
    
    # 也添加Base64版本作为备选
    b64_content = base64.b64encode(audio_data).decode('utf-8')
    b64_file = MIMEText(b64_content, _charset='utf-8')
    b64_file.add_header('Content-Disposition', 'attachment', 
                        filename='elena_voice.txt')
    msg.attach(b64_file)
    
    print("\n📧 正在发送邮件...")
    
    # 发送邮件
    try:
        server = smtplib.SMTP_SSL(smtp_server, smtp_port)
        server.login(sender, password)
        server.sendmail(sender, receiver, msg.as_string())
        print("\n" + "=" * 50)
        print("  ✅ 邮件发送成功！")
        print("=" * 50)
        print("\n请检查你的163邮箱！")
        print("附件里有：")
        print("  1. elena_voice_from_elena.mp3 (可直接播放)")
        print("  2. elena_voice.txt (Base64编码)")
        server.quit()
        return True
    except Exception as e:
        print(f"\n❌ 发送失败: {e}")
        return False

if __name__ == '__main__':
    import sys
    voice_file = sys.argv[1] if len(sys.argv) > 1 else None
    send_voice_email(voice_file)
