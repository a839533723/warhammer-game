/**
 * 战锤40K - 混沌系统
 * 管理混沌值、混沌阶段、混沌抉择、混沌审判
 */

class ChaosSystem {
    constructor() {
        this.chaosValue = 0;
        this.phase = 'pure';
        this.chaosTimer = 0;      // 混沌抉择倒计时
        this.judgmentTimer = 0;   // 混沌审判倒计时
        this.willpower = 0;       // 意志力（对抗混沌）
    }
    
    /**
     * 增加混沌值
     */
    addChaos(amount) {
        this.chaosValue = Math.min(100, this.chaosValue + amount);
        this.checkPhase();
        updateUI();
        
        // 混沌值变化提示
        if (amount > 0) {
            addDialog('system', '🔮', '混沌值+' + amount + '！当前：' + this.chaosValue + '/100');
        }
        
        return this.chaosValue;
    }
    
    /**
     * 净化混沌值
     */
    purify(amount) {
        if (this.chaosValue <= 0) {
            addDialog('system', '✨', '你的灵魂已经非常纯净了。');
            return false;
        }
        
        this.chaosValue = Math.max(0, this.chaosValue - amount);
        this.checkPhase();
        updateUI();
        
        addDialog('system', '✨', '净化仪式生效：混沌值-' + amount + '。当前：' + this.chaosValue + '/100');
        return true;
    }
    
    /**
     * 检查混沌阶段
     */
    checkPhase() {
        const oldPhase = this.phase;
        
        if (this.chaosValue >= 80) {
            this.phase = 'fallen';
        } else if (this.chaosValue >= 60) {
            this.phase = 'heavy';
        } else if (this.chaosValue >= 40) {
            this.phase = 'corrupt';
        } else if (this.chaosValue >= 20) {
            this.phase = 'light';
        } else {
            this.phase = 'pure';
        }
        
        // 阶段变化时提示
        if (oldPhase !== this.phase) {
            this.showPhaseWarning();
        }
        
        // 检查是否触发混沌抉择
        if (this.phase === 'corrupt' || this.phase === 'heavy') {
            this.checkChaosChoice();
        }
        
        // 检查是否触发混沌审判
        if (this.phase === 'heavy') {
            this.checkJudgment();
        }
        
        return this.phase;
    }
    
    /**
     * 显示阶段警告
     */
    showPhaseWarning() {
        const warnings = {
            'light': '🔮 你开始产生轻微的幻觉...',
            'corrupt': '⚠️ 混沌力量正在侵蚀你的意志！你必须做出选择。',
            'heavy': '💀 混沌审判即将到来！你的灵魂正在崩溃！',
            'fallen': '☠️ 你已经堕落了...混沌吞噬了你。'
        };
        
        if (warnings[this.phase]) {
            addDialog('system', this.phase === 'fallen' ? '☠️' : '⚠️', warnings[this.phase]);
        }
    }
    
    /**
     * 获取混沌阶段信息
     */
    getPhaseInfo() {
        const phases = {
            'pure': {
                name: '纯净',
                color: '#8b5cf6',
                effects: ['无惩罚'],
                threshold: 20
            },
            'light': {
                name: '轻腐',
                color: '#eab308',
                effects: ['偶尔幻觉（线索可能假）', '混沌卡效果+30%'],
                threshold: 40
            },
            'corrupt': {
                name: '中腐',
                color: '#f97316',
                effects: ['每2回合必须混沌抉择', '混沌卡效果+50%'],
                threshold: 60
            },
            'heavy': {
                name: '重腐',
                color: '#ef4444',
                effects: ['每周混沌审判', '所有检定-10'],
                threshold: 80
            },
            'fallen': {
                name: '堕落',
                color: '#dc2626',
                effects: ['游戏结束'],
                threshold: 100
            }
        };
        
        return phases[this.phase] || phases['pure'];
    }
    
    /**
     * 检查混沌抉择
     */
    checkChaosChoice() {
        // 中腐阶段每2回合触发一次
        if (this.phase === 'corrupt') {
            if (gameState.turn % 2 === 0 && this.chaosTimer <= 0) {
                this.triggerChaosChoice();
            }
        }
        // 重腐阶段每回合都可能触发
        else if (this.phase === 'heavy') {
            if (Math.random() < 0.3 && this.chaosTimer <= 0) {
                this.triggerChaosChoice();
            }
        }
    }
    
    /**
     * 触发混沌抉择
     */
    triggerChaosChoice() {
        this.chaosTimer = 2; // 重置倒计时
        
        const choices = [
            {
                name: '献祭追随者',
                description: '献祭一个追随者来平息混沌',
                cost: { followers: 1 },
                reward: { chaosValue: -15 },
                narrative: '你将一个追随者献祭给混沌之神...力量暂时平息了。'
            },
            {
                name: '献祭物资',
                description: '消耗大量物资来净化混沌',
                cost: { materials: 30 },
                reward: { chaosValue: -10 },
                narrative: '你用大量物资进行了净化仪式...混沌暂时退去了。'
            },
            {
                name: '混沌契约',
                description: '接受混沌力量，但会变得更强大',
                cost: {},
                reward: { chaosValue: 10, temporaryBuff: '混沌之怒' },
                narrative: '你接受了混沌的恩赐...力量涌入你的身体，但代价是什么？'
            },
            {
                name: '净化仪式',
                description: '使用圣物进行净化',
                cost: { memoryFragments: 1 },
                reward: { chaosValue: -20, reputation: -10 },
                narrative: '你使用了珍贵的记忆碎片进行净化...灵魂恢复了纯净，但人们认为你软弱。'
            }
        ];
        
        // 随机选择一个
        const choice = choices[Math.floor(Math.random() * choices.length)];
        
        addDialog('system', '⚡', '【混沌抉择】');
        addDialog('npc', '👁️', '混沌在你耳边低语："' + choice.description + '"');
        
        return choice;
    }
    
    /**
     * 执行混沌抉择
     */
    executeChoice(choiceIndex) {
        const choices = this.getCurrentChoices();
        const choice = choices[choiceIndex];
        
        if (!choice) return false;
        
        // 检查资源
        if (!resourceSystem.canAfford(choice.cost)) {
            addDialog('system', '⚠️', '资源不足，无法执行此抉择！');
            return false;
        }
        
        // 扣除资源
        if (choice.cost.followers) resourceSystem.modify('followers', -choice.cost.followers);
        if (choice.cost.materials) resourceSystem.modify('materials', -choice.cost.materials);
        if (choice.cost.memoryFragments) resourceSystem.modify('memoryFragments', -choice.cost.memoryFragments);
        
        // 应用奖励
        if (choice.reward.chaosValue) this.purify(-choice.reward.chaosValue);
        if (choice.reputation) resourceSystem.modify('reputation', -choice.reputation);
        
        // 显示叙事
        addDialog('system', '✨', choice.narrative);
        
        return true;
    }
    
    /**
     * 获取当前可用的混沌抉择
     */
    getCurrentChoices() {
        return [
            {
                name: '献祭追随者',
                costText: '-1追随者',
                effectText: '混沌值-15'
            },
            {
                name: '献祭物资',
                costText: '-30物资',
                effectText: '混沌值-10'
            },
            {
                name: '混沌契约',
                costText: '混沌值+10',
                effectText: '获得"混沌之怒"3回合'
            },
            {
                name: '净化仪式',
                costText: '-1记忆碎片, -10声望',
                effectText: '混沌值-20'
            }
        ];
    }
    
    /**
     * 检查混沌审判
     */
    checkJudgment() {
        if (this.phase === 'heavy' && this.judgmentTimer <= 0) {
            // 30%概率触发
            if (Math.random() < 0.3) {
                this.triggerJudgment();
            }
        }
    }
    
    /**
     * 触发混沌审判
     */
    triggerJudgment() {
        this.judgmentTimer = 1; // 下一回合执行
        
        addDialog('system', '⚖️', '【混沌审判即将降临】');
        addDialog('npc', '💀', '混沌审判者：你已经沉沦太久了！接受审判吧！');
    }
    
    /**
     * 执行混沌审判
     */
    executeJudgment() {
        // 掷骰子 + 意志 vs 混沌值
        const roll = Math.floor(Math.random() * 20) + 1;
        const total = roll + this.willpower;
        const target = this.chaosValue;
        
        addDialog('system', '🎲', '混沌审判！掷骰子：' + roll + ' + 意志力' + this.willpower + ' = ' + total);
        addDialog('system', '🎯', '需要 > ' + target + '，当前 ' + total);
        
        if (total > target) {
            // 胜利
            this.chaosValue = Math.max(0, this.chaosValue - 30);
            this.willpower += 5;
            addDialog('system', '✨', '你成功抵抗了混沌审判！混沌值-30，获得"混沌抗性"buff。');
        } else {
            // 失败
            this.judgmentTimer = 5;
            addDialog('system', '💀', '混沌审判失败！你进入了"堕落倒计时"（5回合）。');
            addDialog('system', '⏰', '如果倒计时归零，你将彻底堕落...');
        }
        
        this.checkPhase();
        updateUI();
    }
    
    /**
     * 获取混沌惩罚
     */
    getPenalties() {
        const penalties = [];
        
        if (this.phase === 'light') {
            penalties.push({ type: '幻觉', effect: '线索可能为假', severity: '低' });
        } else if (this.phase === 'corrupt') {
            penalties.push({ type: '幻觉', effect: '线索可能为假', severity: '中' });
            penalties.push({ type: '抉择', effect: '每2回合混沌抉择', severity: '高' });
        } else if (this.phase === 'heavy') {
            penalties.push({ type: '幻觉', effect: '持续幻觉', severity: '高' });
            penalties.push({ type: '审判', effect: '混沌审判风险', severity: '极高' });
            penalties.push({ type: '检定', effect: '所有检定-10', severity: '中' });
        } else if (this.phase === 'fallen') {
            penalties.push({ type: '结束', effect: '游戏结束', severity: '致命' });
        }
        
        return penalties;
    }
    
    /**
     * 获取混沌进度条HTML
     */
    getChaosBarHTML() {
        const phaseInfo = this.getPhaseInfo();
        const percentage = this.chaosValue;
        
        // 计算各阶段位置
        const phases = [
            { name: '纯净', color: '#8b5cf6', threshold: 0 },
            { name: '轻腐', color: '#eab308', threshold: 20 },
            { name: '中腐', color: '#f97316', threshold: 40 },
            { name: '重腐', color: '#ef4444', threshold: 60 },
            { name: '堕落', color: '#dc2626', threshold: 80 }
        ];
        
        return `
            <div class="chaos-bar-container">
                <div class="chaos-bar-label">
                    <span>混沌侵蚀度</span>
                    <span class="chaos-value">${this.chaosValue}/100</span>
                </div>
                <div class="chaos-bar">
                    <div class="chaos-fill" style="width: ${percentage}%; background: ${phaseInfo.color};"></div>
                    ${phases.map(p => `
                        <div class="chaos-marker" style="left: ${p.threshold}%; color: ${p.color}">
                            ${p.name}
                        </div>
                    `).join('')}
                </div>
                <div class="chaos-phase-label" style="color: ${phaseInfo.color}">
                    当前阶段：${phaseInfo.name}
                </div>
            </div>
        `;
    }
    
    /**
     * 生成幻觉文本
     */
    generateHallucination() {
        const hallucinations = {
            'light': [
                '你看到墙上的影子在移动...',
                '你听到远处传来低语声...',
                '你的视野边缘出现了一些模糊...',
                '你似乎看到了一个不存在的影子...'
            ],
            'corrupt': [
                'NPC的脸变成了恶魔的模样，然后又变了回来...',
                '你看到了帝皇的幻象，但他在嘲笑你...',
                '空气中弥漫着腐朽的气味...',
                '你的追随者在低声诅咒你，但你听不清内容...'
            ],
            'heavy': [
                '你的灵魂正在被撕裂...',
                '混沌之神在你耳边低语，承诺无尽的力量...',
                '你看到了自己堕落后的模样...',
                '整个世界都在扭曲，边界变得模糊...'
            ]
        };
        
        const texts = hallucinations[this.phase] || hallucinations['light'];
        return texts[Math.floor(Math.random() * texts.length)];
    }
}

// 创建实例并导出
window.chaosSystem = new ChaosSystem();
