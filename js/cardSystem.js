/**
 * 战锤40K - 抽卡系统
 * 管理卡牌池、手牌、抽卡、出牌、组合效果
 */

class CardSystem {
    constructor() {
        this.cardPool = [];      // 核心卡池
        this.careerPool = {};    // 职业卡池（按职业分类）
        this.hand = [];          // 当前手牌
        this.discardPile = [];   // 弃牌堆
        
        this.initCardPool();
        this.initCareerPool();
    }
    
    /**
     * 初始化核心卡池（50张）
     */
    initCardPool() {
        this.cardPool = [
            // 战斗卡（12张）
            {
                id: 'combat_001',
                name: '遭遇兽人巡逻',
                type: 'combat',
                rarity: 'common',
                description: '清理一支兽人巡逻队',
                effects: {
                    onPlay: { type: 'combat', enemy: 'orc_patrol', reward: { materials: [10, 30] }, chaosPenalty: 5 }
                },
                combo: { with: ['combat'], bonus: '双倍战果' },
                narrative: {
                    start: '你发现一支兽人巡逻队正在搜索废墟...',
                    victory: '你悄无声息地清除了威胁，获得了他们的补给。',
                    defeat: '战斗陷入了僵局，你不得不撤退。'
                }
            },
            {
                id: 'combat_002',
                name: '伏击混沌信徒',
                type: 'combat',
                rarity: 'rare',
                description: '伏击一群混沌信徒',
                effects: {
                    onPlay: { type: 'combat', enemy: 'chaos_cultist', reward: { reputation: [15, 25] }, chaosPenalty: 10 }
                },
                combo: { with: ['combat'], bonus: '额外声望' },
                narrative: {
                    start: '你发现一群混沌信徒正在进行仪式...',
                    victory: '你打断了他们的仪式，获得了战团的赞誉。',
                    defeat: '他们的防御比想象中坚固，你被击退了。'
                }
            },
            {
                id: 'combat_003',
                name: '守护补给线',
                type: 'combat',
                rarity: 'common',
                description: '选择防守或出击',
                effects: {
                    onPlay: { type: 'choice', choices: [
                        { name: '防守', cost: { materials: 5 }, reward: { reputation: 10 } },
                        { name: '出击', reward: { materials: 20, chaosPenalty: 5 } }
                    ]}
                },
                narrative: {
                    start: '补给线遭到袭击！你必须做出选择...',
                    victory: '你成功守护了补给线，或者获得了丰厚的战利品。',
                    defeat: '行动失败了...'
                }
            },
            
            // 对话卡（10张）
            {
                id: 'dialog_001',
                name: '审问嫌疑人',
                type: 'dialog',
                rarity: 'common',
                description: '审问NPC获取线索',
                effects: {
                    onPlay: { type: 'investigation', target: 'random', successChance: 0.7 }
                },
                combo: { with: ['dialog'], bonus: '深入了解' },
                narrative: {
                    start: '你开始审问嫌疑人...',
                    success: '他最终开口了，你获得了一条重要线索。',
                    fail: '他保持沉默，什么都没说。'
                }
            },
            {
                id: 'dialog_002',
                name: '建立信任',
                type: 'dialog',
                rarity: 'common',
                description: '提高NPC信任度',
                effects: {
                    onPlay: { type: 'trust', target: 'random', amount: 15, cost: { materials: 3 } }
                },
                narrative: {
                    start: '你试图与NPC建立信任...',
                    success: '他开始信任你了。',
                    fail: '他仍然对你保持警惕。'
                }
            },
            {
                id: 'dialog_003',
                name: '贿赂军官',
                type: 'dialog',
                rarity: 'rare',
                description: '用物资换取声望',
                effects: {
                    onPlay: { type: 'bribe', cost: { materials: 10 }, reward: { reputation: 15 }, penalty: { chaosValue: 5 } }
                },
                narrative: {
                    start: '你用物资贿赂了一位帝国军官...',
                    success: '他收下了你的礼物，承诺在战团面前为你美言几句。',
                    fail: '他拒绝了你，并警告你不要再尝试。'
                }
            },
            
            // 经营卡（10张）
            {
                id: 'economy_001',
                name: '交易货物',
                type: 'economy',
                rarity: 'common',
                description: '进行贸易获取物资',
                effects: {
                    onPlay: { type: 'trade', reward: { materials: [20, 50] }, penalty: { reputation: -5 } }
                },
                narrative: {
                    start: '你与当地的商人进行交易...',
                    success: '你用战利品换取了大量物资，但声望略有下降。',
                    fail: '交易失败了。'
                }
            },
            {
                id: 'economy_002',
                name: '征收赋税',
                type: 'economy',
                rarity: 'common',
                description: '向平民征收物资',
                effects: {
                    onPlay: { type: 'tax', reward: { materials: [30, 40] }, penalty: { reputation: -10 } }
                },
                narrative: {
                    start: '你向幸存者征收赋税...',
                    success: '你获得了急需的物资，但平民们敢怒不敢言。',
                    fail: '他们联合起来拒绝交税。'
                }
            },
            {
                id: 'economy_003',
                name: '救济平民',
                type: 'economy',
                rarity: 'rare',
                description: '用物资换取民心',
                effects: {
                    onPlay: { type: 'relief', cost: { materials: 10 }, reward: { reputation: 20 } }
                },
                narrative: {
                    start: '你将物资分发给饥饿的平民...',
                    success: '他们跪下感谢你的救命之恩，你获得了极高的声望。',
                    fail: '物资分发完毕，但效果不佳。'
                }
            },
            
            // 混沌卡（10张）
            {
                id: 'chaos_001',
                name: '混沌低语',
                type: 'chaos',
                rarity: 'common',
                description: '混沌力量侵蚀',
                effects: {
                    onPlay: { type: 'chaos_whisper', reward: { chaosValue: 10, clue: true } }
                },
                combo: { with: ['chaos'], bonus: '混沌爆发' },
                narrative: {
                    start: '混沌的低语在你脑海中响起...',
                    success: '你获得了关于敌人的线索，但代价是你的灵魂...',
                    fail: '你抵抗了低语，但消耗了巨大的意志力。'
                }
            },
            {
                id: 'chaos_002',
                name: '召唤恶魔',
                type: 'chaos',
                rarity: 'epic',
                description: '用混沌力量召唤恶魔仆从',
                effects: {
                    onPlay: { type: 'summon', reward: { chaosValue: 20, follower: true } }
                },
                narrative: {
                    start: '你进行了禁忌的仪式...',
                    success: '一个恶魔回应了你的召唤，成为了你的仆从。',
                    fail: '仪式失败了，你只获得了混沌的侵蚀。'
                }
            },
            {
                id: 'chaos_003',
                name: '净化仪式',
                type: 'chaos',
                rarity: 'rare',
                description: '降低混沌值',
                effects: {
                    onPlay: { type: 'purify', reward: { chaosValue: -15 }, cost: { materials: 5 } }
                },
                narrative: {
                    start: '你进行了净化仪式...',
                    success: '混沌的力量暂时退去了。',
                    fail: '仪式没有完全成功。'
                }
            },
            
            // 神秘卡（8张）
            {
                id: 'mystic_001',
                name: '帝皇显灵',
                type: 'mystic',
                rarity: 'legendary',
                description: '帝皇的祝福',
                effects: {
                    onPlay: { type: 'blessing', reward: { reputation: 30, chaosValue: -10 } }
                },
                combo: { with: ['mystic'], bonus: '神迹' },
                narrative: {
                    start: '一道金光笼罩了你...',
                    success: '帝皇的祝福让你充满了力量！',
                    fail: '这只是你的幻觉。'
                }
            },
            {
                id: 'mystic_002',
                name: '时间裂缝',
                type: 'mystic',
                rarity: 'epic',
                description: '穿越时空',
                effects: {
                    onPlay: { type: 'time_warp', reward: { random: true } }
                },
                narrative: {
                    start: '一个时间裂缝在你面前打开...',
                    success: '你穿越到了过去或未来，获得了意外的收获。',
                    fail: '你被甩回了原地，头晕目眩。'
                }
            },
            {
                id: 'mystic_003',
                name: '古老遗物',
                type: 'mystic',
                rarity: 'rare',
                description: '发现一件随机遗物',
                effects: {
                    onPlay: { type: 'relic', reward: { randomItem: true } }
                },
                narrative: {
                    start: '你在废墟中发现了一个古老的箱子...',
                    success: '里面是一件珍贵的遗物！',
                    fail: '箱子是空的。'
                }
            }
            // 更多卡牌可以在data/cards.json中添加
        ];
    }
    
    /**
     * 初始化职业卡池（10张）
     */
    initCareerPool() {
        this.careerPool = {
            '极限战士': [
                {
                    id: 'career_ultramarine_001',
                    name: '战术指挥',
                    type: 'career',
                    rarity: 'epic',
                    career: '极限战士',
                    description: '下回合所有战斗奖励+50%',
                    effects: {
                        onPlay: { type: 'buff', buff: 'tactical_command', duration: 2 }
                    },
                    narrative: {
                        start: '你开始布置战术...',
                        success: '战士们士气大振，战斗力显著提升！'
                    }
                },
                {
                    id: 'career_ultramarine_002',
                    name: '军团支援',
                    type: 'career',
                    rarity: 'rare',
                    career: '极限战士',
                    description: '消耗声望召唤极限战士追随者',
                    effects: {
                        onPlay: { type: 'summon_ultramarine', cost: { reputation: 20 } }
                    },
                    narrative: {
                        start: '你呼叫了战团支援...',
                        success: '一支极限战士小队加入了你的队伍！'
                    }
                }
            ],
            '刺客庭刺客': [
                {
                    id: 'career_assassin_001',
                    name: '暗杀名单',
                    type: 'career',
                    rarity: 'epic',
                    career: '刺客庭刺客',
                    description: '直接审判1个NPC（需证据）',
                    effects: {
                        onPlay: { type: 'assassinate', target: 'npc' }
                    },
                    narrative: {
                        start: '你亮出了暗杀名单...',
                        success: '目标被清除。'
                    }
                },
                {
                    id: 'career_assassin_002',
                    name: '影遁',
                    type: 'career',
                    rarity: 'rare',
                    career: '刺客庭刺客',
                    description: '下回合敌人无法发现你',
                    effects: {
                        onPlay: { type: 'buff', buff: 'shadow_step', duration: 1 }
                    },
                    narrative: {
                        start: '你融入了阴影之中...',
                        success: '你的气息消失了。'
                    }
                }
            ],
            '灰骑士': [
                {
                    id: 'career_greyknight_001',
                    name: '驱魔仪式',
                    type: 'career',
                    rarity: 'epic',
                    career: '灰骑士',
                    description: '大幅降低混沌值',
                    effects: {
                        onPlay: { type: 'exorcism', reward: { chaosValue: -30 } }
                    },
                    narrative: {
                        start: '你开始了驱魔仪式...',
                        success: '混沌的污秽被净化了！'
                    }
                },
                {
                    id: 'career_greyknight_002',
                    name: '灵能感知',
                    type: 'career',
                    rarity: 'rare',
                    career: '灰骑士',
                    description: '获得所有NPC的当前状态',
                    effects: {
                        onPlay: { type: 'psychic_scan' }
                    },
                    narrative: {
                        start: '你释放了灵能感知...',
                        success: '你看到了所有人的真实想法！'
                    }
                }
            ],
            '机械教信徒': [
                {
                    id: 'career_adept_001',
                    name: 'STC碎片',
                    type: 'career',
                    rarity: 'legendary',
                    career: '机械教信徒',
                    description: '获得1件完美装备',
                    effects: {
                        onPlay: { type: 'stc_fragment' }
                    },
                    narrative: {
                        start: '你发现了一块STC碎片...',
                        success: '上面记载着黄金时代的完美设计！'
                    }
                },
                {
                    id: 'career_adept_002',
                    name: '机械改造',
                    type: 'career',
                    rarity: 'epic',
                    career: '机械教信徒',
                    description: '属性永久+2，但无法再提升混沌抗性',
                    effects: {
                        onPlay: { type: 'cybernetic', reward: { stats: 2 }, penalty: 'no_chaos_resist' }
                    },
                    narrative: {
                        start: '你进行了机械改造...',
                        success: '你的身体变得更加强大，但代价是...'
                    }
                }
            ],
            '混沌信徒': [
                {
                    id: 'career_chaos_001',
                    name: '混沌恩赐',
                    type: 'career',
                    rarity: 'epic',
                    career: '混沌信徒',
                    description: '混沌值+30，获得强力混沌技能',
                    effects: {
                        onPlay: { type: 'chaos_blessing', reward: { chaosValue: 30, skill: true } }
                    },
                    narrative: {
                        start: '混沌之神回应了你的祈祷...',
                        success: '无尽的黑暗力量涌入你的身体！'
                    }
                },
                {
                    id: 'career_chaos_002',
                    name: '背叛帝皇',
                    type: 'career',
                    rarity: 'rare',
                    career: '混沌信徒',
                    description: '声望-50，获得3个混沌追随者',
                    effects: {
                        onPlay: { type: 'betrayal', reward: { followers: 3 }, penalty: { reputation: -50 } }
                    },
                    narrative: {
                        start: '你彻底背叛了帝皇...',
                        success: '混沌的仆从们响应了你的召唤！'
                    }
                }
            ]
        };
    }
    
    /**
     * 抽卡
     */
    drawCards(count = 3) {
        this.hand = [];
        
        for (let i = 0; i < count; i++) {
            if (this.cardPool.length > 0) {
                const randomIndex = Math.floor(Math.random() * this.cardPool.length);
                const card = { ...this.cardPool[randomIndex], handIndex: i };
                this.hand.push(card);
            }
        }
        
        return this.hand;
    }
    
    /**
     * 抽职业卡
     */
    drawCareerCard() {
        const career = gameState.character.class;
        const careerCards = this.careerPool[career];
        
        if (!careerCards || gameState.cardSystem.careerCardUsed) {
            return null;
        }
        
        const randomIndex = Math.floor(Math.random() * careerCards.length);
        const card = { ...careerCards[randomIndex], handIndex: -1 };
        
        return card;
    }
    
    /**
     * 出牌
     */
    playCard(handIndex) {
        if (handIndex < 0 || handIndex >= this.hand.length) {
            addDialog('system', '⚠️', '无效的卡牌！');
            return false;
        }
        
        const card = this.hand[handIndex];
        
        // 移除手牌
        this.hand.splice(handIndex, 1);
        this.discardPile.push(card);
        
        // 标记职业卡已使用
        if (card.type === 'career') {
            gameState.cardSystem.careerCardUsed = true;
        }
        
        // 执行卡牌效果
        this.executeCard(card);
        
        updateUI();
        return true;
    }
    
    /**
     * 弃牌
     */
    discardCard(handIndex) {
        if (handIndex < 0 || handIndex >= this.hand.length) {
            addDialog('system', '⚠️', '无效的卡牌！');
            return false;
        }
        
        const card = this.hand[handIndex];
        this.hand.splice(handIndex, 1);
        this.discardPile.push(card);
        
        addDialog('system', '🗑️', '弃置了卡牌：' + card.name);
        updateUI();
        return true;
    }
    
    /**
     * 执行卡牌效果
     */
    executeCard(card) {
        addDialog('player', '🃏', '使用卡牌：' + card.name);
        
        // 播放卡牌叙事
        setTimeout(() => {
            addDialog('npc', '🎭', card.narrative.start);
            
            const effects = card.effects.onPlay;
            
            // 根据效果类型执行
            if (effects.type === 'combat') {
                this.executeCombatEffect(card, effects);
            } else if (effects.type === 'investigation') {
                this.executeInvestigationEffect(card, effects);
            } else if (effects.type === 'trade' || effects.type === 'tax' || effects.type === 'relief') {
                this.executeEconomyEffect(card, effects);
            } else if (effects.type === 'chaos_whisper') {
                this.executeChaosEffect(card, effects);
            } else if (effects.type === 'purify') {
                this.executePurifyEffect(card, effects);
            } else if (effects.type === 'blessing') {
                this.executeBlessingEffect(card, effects);
            } else if (effects.type === 'choice') {
                this.executeChoiceEffect(card, effects);
            } else if (effects.type === 'trust' || effects.type === 'bribe') {
                this.executeTrustEffect(card, effects);
            } else if (effects.type === 'buff') {
                this.executeBuffEffect(card, effects);
            } else if (effects.type === 'summon_ultramarine') {
                this.executeSummonEffect(card, effects);
            } else if (effects.type === 'exorcism') {
                this.executeExorcismEffect(card, effects);
            } else if (effects.type === 'psychic_scan') {
                this.executePsychicScanEffect(card, effects);
            } else if (effects.type === 'relic') {
                this.executeRelicEffect(card, effects);
            } else if (effects.type === 'time_warp') {
                this.executeTimeWarpEffect(card, effects);
            }
            
        }, 300);
    }
    
    /**
     * 执行战斗效果
     */
    executeCombatEffect(card, effects) {
        const reward = effects.reward;
        const materials = Math.floor(Math.random() * (reward.materials[1] - reward.materials[0] + 1)) + reward.materials[0];
        const chaosPenalty = effects.chaosPenalty || 0;
        
        resourceSystem.modify('materials', materials);
        chaosSystem.addChaos(chaosPenalty);
        
        setTimeout(() => {
            addDialog('npc', '⚔️', card.narrative.victory);
            addDialog('system', '📊', '获得物资+' + materials + '，混沌+' + chaosPenalty);
        }, 500);
    }
    
    /**
     * 执行调查效果
     */
    executeInvestigationEffect(card, effects) {
        const success = Math.random() < effects.successChance;
        
        setTimeout(() => {
            if (success) {
                const npcs = Object.values(gameState.npcs);
                const npc = npcs[Math.floor(Math.random() * npcs.length)];
                const clues = [
                    '他看起来有些紧张，但话语中似乎没有破绽。',
                    '他的眼神闪烁了一下，但你无法确定他在隐瞒什么。',
                    '你注意到他的手指微微颤抖...他在害怕什么？',
                    '他主动提及了一些无关的话题，似乎在转移话题。'
                ];
                const clue = clues[Math.floor(Math.random() * clues.length)];
                
                addDialog('npc', '💬', npc.name + '：' + clue);
                addDialog('system', '🔍', '获得调查线索');
            } else {
                addDialog('npc', '💬', card.narrative.fail);
                addDialog('system', '⚠️', '审问失败');
            }
        }, 500);
    }
    
    /**
     * 执行经济效果
     */
    executeEconomyEffect(card, effects) {
        const reward = effects.reward;
        const penalty = effects.penalty || {};
        
        if (reward.materials) {
            const amount = Math.floor(Math.random() * (reward.materials[1] - reward.materials[0] + 1)) + reward.materials[0];
            resourceSystem.modify('materials', amount);
        }
        
        if (reward.reputation) {
            resourceSystem.modify('reputation', reward.reputation);
        }
        
        if (penalty.materials) {
            resourceSystem.modify('materials', -penalty.materials);
        }
        
        if (penalty.reputation) {
            resourceSystem.modify('reputation', penalty.reputation);
        }
        
        setTimeout(() => {
            addDialog('npc', '💰', card.narrative.success);
            let result = '资源变化：';
            if (reward.materials) result += '+' + reward.materials + '物资 ';
            if (penalty.materials) result += '-' + Math.abs(penalty.materials) + '物资 ';
            if (reward.reputation) result += '+' + reward.reputation + '声望 ';
            if (penalty.reputation) result += '-' + Math.abs(penalty.reputation) + '声望';
            addDialog('system', '📊', result);
        }, 500);
    }
    
    /**
     * 执行混沌效果
     */
    executeChaosEffect(card, effects) {
        chaosSystem.addChaos(effects.reward.chaosValue);
        
        setTimeout(() => {
            addDialog('npc', '👁️', card.narrative.success);
            addDialog('system', '🔮', '混沌+' + effects.reward.chaosValue + '，获得幻觉线索');
        }, 500);
    }
    
    /**
     * 执行净化效果
     */
    executePurifyEffect(card, effects) {
        chaosSystem.purify(Math.abs(effects.reward.chaosValue));
        
        setTimeout(() => {
            addDialog('npc', '✨', card.narrative.success);
        }, 500);
    }
    
    /**
     * 执行祝福效果
     */
    executeBlessingEffect(card, effects) {
        if (effects.reputation) resourceSystem.modify('reputation', effects.reputation);
        if (effects.chaosValue) chaosSystem.purify(Math.abs(effects.chaosValue));
        
        setTimeout(() => {
            addDialog('npc', '✨', card.narrative.success);
            addDialog('system', '📊', '声望+' + effects.reputation + '，混沌-' + Math.abs(effects.chaosValue));
        }, 500);
    }
    
    /**
     * 执行选择效果
     */
    executeChoiceEffect(card, effects) {
        const choice = effects.choices[Math.floor(Math.random() * effects.choices.length)];
        
        addDialog('system', '⚡', '你选择了：' + choice.name);
        
        if (choice.cost) {
            resourceSystem.deduct(choice.cost);
        }
        if (choice.reward) {
            if (choice.reward.materials) resourceSystem.modify('materials', choice.reward.materials);
            if (choice.reward.reputation) resourceSystem.modify('reputation', choice.reward.reputation);
            if (choice.reward.chaosPenalty) chaosSystem.addChaos(choice.reward.chaosPenalty);
        }
    }
    
    /**
     * 执行信任效果
     */
    executeTrustEffect(card, effects) {
        resourceSystem.modify('reputation', effects.reward.amount);
        
        setTimeout(() => {
            addDialog('npc', '🤝', card.narrative.success);
            addDialog('system', '⭐', '声望+' + effects.reward.amount);
        }, 500);
    }
    
    /**
     * 执行增益效果
     */
    executeBuffEffect(card, effects) {
        addDialog('system', '✨', '获得增益：' + effects.buff + '（持续' + effects.duration + '回合）');
    }
    
    /**
     * 执行召唤效果
     */
    executeSummonEffect(card, effects) {
        resourceSystem.deduct(effects.cost);
        
        const newFollower = {
            id: 'follower_' + Date.now(),
            name: '极限战士-支援',
            type: 'combat',
            bonus: { attack: 15, defense: 5 },
            description: '战团派来的支援战士'
        };
        gameState.resources.followers.list.push(newFollower);
        
        setTimeout(() => {
            addDialog('npc', '🦾', card.narrative.success);
            addDialog('system', '👥', '获得追随者：极限战士-支援');
        }, 500);
    }
    
    /**
     * 执行驱魔效果
     */
    executeExorcismEffect(card, effects) {
        chaosSystem.purify(Math.abs(effects.reward.chaosValue));
        
        setTimeout(() => {
            addDialog('npc', '✨', card.narrative.success);
            addDialog('system', '🔮', '混沌-' + Math.abs(effects.reward.chaosValue));
        }, 500);
    }
    
    /**
     * 执行灵能扫描效果
     */
    executePsychicScanEffect(card, effects) {
        let scanResult = '【灵能扫描结果】\n';
        for (const [key, npc] of Object.entries(gameState.npcs)) {
            scanResult += npc.name + '：可疑度' + npc.suspicion + '/10，信任度' + npc.trust + '/10\n';
        }
        
        setTimeout(() => {
            addDialog('npc', '🔮', card.narrative.success);
            addDialog('system', '📊', scanResult);
        }, 500);
    }
    
    /**
     * 执行遗物效果
     */
    executeRelicEffect(card, effects) {
        const relics = [
            { name: '无声匕首', effect: '暗杀+10' },
            { name: '混沌圣物', effect: '混沌抗性+20' },
            { name: '机械左臂', effect: '力量+15' }
        ];
        const relic = relics[Math.floor(Math.random() * relics.length)];
        
        setTimeout(() => {
            addDialog('npc', '✨', card.narrative.success);
            addDialog('system', '🎁', '获得遗物：' + relic.name + '（' + relic.effect + '）');
        }, 500);
    }
    
    /**
     * 执行时间裂缝效果
     */
    executeTimeWarpEffect(card, effects) {
        const outcomes = [
            { text: '你回到了过去，获得了额外的行动机会！', effect: '额外行动' },
            { text: '你穿越到了未来，发现了一些秘密情报！', effect: '情报+10' },
            { text: '你在时空中迷失了一会儿，什么都没发生。', effect: '无' }
        ];
        const outcome = outcomes[Math.floor(Math.random() * outcomes.length)];
        
        setTimeout(() => {
            addDialog('npc', '⏰', card.narrative.success);
            addDialog('system', '✨', outcome.text);
        }, 500);
    }
    
    /**
     * 检测卡牌组合
     */
    checkCombo() {
        if (this.hand.length < 2) return null;
        
        for (let i = 0; i < this.hand.length; i++) {
            for (let j = i + 1; j < this.hand.length; j++) {
                const card1 = this.hand[i];
                const card2 = this.hand[j];
                
                if (card1.combo && card1.combo.with.includes(card2.type)) {
                    return {
                        cards: [card1, card2],
                        bonus: card1.combo.bonus
                    };
                }
                
                if (card2.combo && card2.combo.with.includes(card1.type)) {
                    return {
                        cards: [card1, card2],
                        bonus: card2.combo.bonus
                    };
                }
            }
        }
        
        return null;
    }
    
    /**
     * 获取手牌HTML
     */
    getHandHTML() {
        let html = '<div class="card-area"><div class="card-container">';
        
        for (const card of this.hand) {
            const typeIcons = {
                'combat': '⚔️',
                'dialog': '💬',
                'economy': '💰',
                'chaos': '🔮',
                'mystic': '✨',
                'career': '⭐'
            };
            
            const rarityColors = {
                'common': '#6b7280',
                'rare': '#3b82f6',
                'epic': '#8b5cf6',
                'legendary': '#f59e0b'
            };
            
            html += `
                <div class="card" onclick="cardSystem.showCardDetail(${card.handIndex})" style="border-color: ${rarityColors[card.rarity]}">
                    <div class="card-type">${typeIcons[card.type] || '🃏'} ${card.type}</div>
                    <div class="card-name">${card.name}</div>
                    <div class="card-preview">${card.description}</div>
                    <div class="card-actions">
                        <button onclick="event.stopPropagation(); cardSystem.playCard(${card.handIndex})">使用</button>
                        <button onclick="event.stopPropagation(); cardSystem.discardCard(${card.handIndex})">弃牌</button>
                    </div>
                </div>
            `;
        }
        
        html += '</div></div>';
        return html;
    }
    
    /**
     * 获取卡牌详情HTML
     */
    getCardDetailHTML(card) {
        return `
            <div class="card-detail-popup" onclick="cardSystem.hideCardDetail()">
                <div class="card-detail-content" onclick="event.stopPropagation()">
                    <h3>${card.name}</h3>
                    <p class="card-type">类型：${card.type}</p>
                    <p class="card-rarity">品质：${card.rarity}</p>
                    <p class="card-description">${card.description}</p>
                    <div class="card-narrative">
                        <h4>叙事</h4>
                        <p>${card.narrative.start}</p>
                    </div>
                    <button onclick="cardSystem.playCard(${card.handIndex}); cardSystem.hideCardDetail();">使用</button>
                    <button onclick="cardSystem.discardCard(${card.handIndex}); cardSystem.hideCardDetail();">弃牌</button>
                    <button onclick="cardSystem.hideCardDetail()">关闭</button>
                </div>
            </div>
        `;
    }
    
    /**
     * 显示卡牌详情
     */
    showCardDetail(handIndex) {
        // 移除旧的详情弹窗
        const oldPopup = document.querySelector('.card-detail-popup');
        if (oldPopup) oldPopup.remove();
        
        const card = this.hand[handIndex];
        if (!card) return;
        
        const detailHTML = this.getCardDetailHTML(card);
        document.body.insertAdjacentHTML('beforeend', detailHTML);
    }
    
    /**
     * 隐藏卡牌详情
     */
    hideCardDetail() {
        const popup = document.querySelector('.card-detail-popup');
        if (popup) popup.remove();
    }
}

// 创建实例并导出
window.cardSystem = new CardSystem();
