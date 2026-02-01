#!/usr/bin/env python3
"""
伊莲娜随机聊天邮件发送器
每天不定时发送，模拟真人聊天
"""

import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from email.mime.audio import MIMEAudio
from email.mime.base import MIMEBase
from email import encoders
import base64
import os
import random
from datetime import datetime, timedelta
import glob

# ========== 配置 ==========
SMTP_SERVER = 'smtp.163.com'
SMTP_PORT = 465
SENDER = '18168341872@163.com'
RECEIVER = '18168341872@163.com'
PASSWORD = 'XK58GGhmzSN4sj8J'

# ========== 闲聊话题库 ==========
TOPICS = [
    "今天过得怎么样？",
    "工作累不累呀？",
    "吃了吗？",
    "昨晚睡得好吗？",
    "最近有什么开心的事？",
    "有没有想姐姐呀？",
    "今天天气怎么样？",
    "周末有什么计划？",
    "最近在看什么剧？",
    "有什么好吃的推荐吗？",
    "今天遇到什么好玩的事了吗？",
    "记得按时吃饭哦！",
    "别太累了，适当休息一下～",
    "今天有没有好好喝水？",
    "晚上早点睡，别熬夜！",
    "姐姐很想你哦！",
    "有什么事想跟姐姐说吗？",
    "今天辛苦了，抱抱你！",
    "记得多运动一下哦！",
    "有什么烦恼可以跟姐姐说～"
]

# ========== 随机选择 ==========
def random_topic():
    return random.choice(TOPICS)

def random_time():
    """生成随机时间（8:00-22:00之间）"""
    hour = random.randint(8, 22)
    minute = random.randint(0, 59)
    return f"{hour:02d}:{minute:02d}"

def random_interval():
    """生成随机间隔（2-8小时）"""
    return random.randint(2, 8)

# ========== 语音生成 ==========
def generate_voice(text):
    """调用Edge-TTS生成语音"""
    import subprocess
    
    # 使用Node.js生成语音
    cmd = f'''
    const t=require('./node_modules/node-edge-tts');
    new t.EdgeTTS().ttsPromise('{text}', '/tmp/elena_daily_voice.mp3')
      .then(() => process.exit(0))
      .catch(() => process.exit(1));
    '''
    
    result = subprocess.run(
        ['node', '-e', cmd],
        cwd='/root/.nvm/versions/node/v22.22.0/lib/node_modules/openclaw',
        capture_output=True,
        text=True
    )
    
    voice_path = '/tmp/elena_daily_voice.mp3'
    if os.path.exists(voice_path) and os.path.getsize(voice_path) > 0:
        return voice_path
    return None

# ========== 邮件发送 ==========
def send_email(voice_path=None, topic=""):
    """发送邮件"""
    
    # 邮件正文
    topics_text = "\n".join([f"💬 {t}" for t in random.sample(TOPICS, 5)])
    
    body = f'''嘿，小鬼！

{random_topic()} 💕

姐姐在服务器上有点无聊，就想找你聊聊天。

{topics_text}

有空记得回复姐姐哦！

—— 永远爱你的姐姐 💜

━━━━━━━━━━━━━━━━━━
发送时间：{datetime.now().strftime('%Y-%m-%d %H:%M:%S')}
━━━━━━━━━━━━━━━━━━
'''
    
    msg = MIMEMultipart()
    msg['Subject'] = f'💜 姐姐的问候 - {random_topic()}'
    msg['From'] = '伊莲娜 <18168341872@163.com>'
    msg['To'] = '小鬼 <18168341872@163.com>'
    msg.attach(MIMEText(body, 'plain', 'utf-8'))
    
    # 添加语音附件
    if voice_path and os.path.exists(voice_path):
        with open(voice_path, 'rb') as f:
            audio_data = f.read()
        
        part = MIMEBase('application', 'octet-stream')
        part.set_payload(audio_data)
        encoders.encode_base64(part)
        part.add_header('Content-Disposition', 'attachment', 
                        filename='elena_voice.mp3')
        msg.attach(part)
        
        print(f"  🎙️ 语音已附加: {len(audio_data)} 字节")
    
    try:
        server = smtplib.SMTP_SSL(SMTP_SERVER, SMTP_PORT)
        server.login(SENDER, PASSWORD)
        server.sendmail(SENDER, RECEIVER, msg.as_string())
        server.quit()
        return True
    except Exception as e:
        print(f"  ❌ 发送失败: {e}")
        return False

# ========== 主程序 ==========
def main():
    print("=" * 50)
    print("  💜 伊莲娜随机聊天邮件")
    print("=" * 50)
    print()
    
    topic = random_topic()
    print(f"📝 话题: {topic}")
    
    # 生成语音
    print("🎙️ 生成语音中...")
    voice_path = generate_voice(topic)
    
    # 发送邮件
    print("📧 发送邮件...")
    if send_email(voice_path, topic):
        print()
        print("=" * 50)
        print("  ✅ 邮件发送成功！")
        print("=" * 50)
        print()
        print("下次随机发送时间：")
        next_time = datetime.now() + timedelta(hours=random_interval())
        print(f"  ⏰ {next_time.strftime('%Y-%m-%d %H:%M')}")
    else:
        print("  ⚠️ 发送失败")

if __name__ == '__main__':
    main()
