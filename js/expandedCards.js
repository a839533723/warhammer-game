/**
 * 战锤40K - 扩展卡牌数据
 * 更多任务、特殊事件、随机遭遇
 */

const EXPANDED_CARDS = {
    // 扩展混沌卡（新增6张）
    chaos_extended: [
        {
            name: '可疑的仓库',
            description: '仓库里传来奇怪的声音。进去查看。',
            target: 'location',
            difficulty: 'simple',
            reward: { chaosReduction: 5, intelligence: 3 },
            penalty: { chaosIncrease: 15 },
            cluesNeeded: 1,
            special: '发现物资'
        },
        {
            name: '夜半哭声',
            description: '午夜时分，你听到女人的哭声。来源是...',
            target: 'mystery',
            difficulty: 'simple',
            reward: { chaosReduction: 8, intelligence: 5 },
            penalty: { chaosIncrease: 12 },
            cluesNeeded: 1,
            special: '幻觉还是真实？'
        },
        {
            name: '叛徒的暗号',
            description: '你截获了一份混沌暗号。破译它！',
            target: 'code',
            difficulty: 'normal',
            reward: { chaosReduction: 12, intelligence: 10 },
            penalty: { chaosIncrease: 20 },
            cluesNeeded: 2,
            special: '破译奖励'
        },
        {
            name: '秘密集会',
            description: '有传言说混沌信徒每晚在墓地集会。',
            target: 'location',
            difficulty: 'normal',
            reward: { chaosReduction: 15, intelligence: 15 },
            penalty: { chaosIncrease: 25 },
            cluesNeeded: 2,
            special: '潜入调查'
        },
        {
            name: '内鬼网络',
            description: '不只有一个内鬼...他们形成了一个网络。',
            target: 'network',
            difficulty: 'hard',
            reward: { chaosReduction: 25, intelligence: 25 },
            penalty: { chaosIncrease: 35 },
            cluesNeeded: 3,
            special: '网络奖励'
        },
        {
            name: '混沌领主',
            description: '内鬼的首领就在营地中。找出他！',
            target: 'leader',
            difficulty: 'extreme',
            reward: { chaosReduction: 40, reputation: 60 },
            penalty: { chaosIncrease: 55 },
            cluesNeeded: 4,
            special: '首领奖励'
        }
    ],

    // 扩展信仰卡（新增6张）
    faith_extended: [
        {
            name: '晨祷',
            description: '每天早晨的祈祷能净化心灵。',
            target: 'self',
            difficulty: 'simple',
            reward: { faith: 8, chaosReduction: 3 },
            penalty: { chaosIncrease: 5 }
        },
        {
            name: '忏悔',
            description: '为你的罪行忏悔。帝皇会原谅你的。',
            target: 'self',
            difficulty: 'simple',
            reward: { faith: 10, chaosReduction: 5 },
            penalty: { chaosIncrease: 8 }
        },
        {
            name: '朝圣之路',
            description: '前往圣坛的路途充满危险。',
            target: 'journey',
            difficulty: 'normal',
            reward: { faith: 25, chaosReduction: 10 },
            penalty: { chaosIncrease: 20 }
        },
        {
            name: '圣遗物',
            description: '找到失落的圣遗物，献给帝皇。',
            target: 'search',
            difficulty: 'normal',
            reward: { faith: 30, chaosReduction: 15 },
            penalty: { chaosIncrease: 25 }
        },
        {
            name: '传教',
            description: '向迷茫的战士传播帝皇的荣光。',
            target: 'crowd',
            difficulty: 'hard',
            reward: { faith: 40, chaosReduction: 20 },
            penalty: { chaosIncrease: 30 }
        },
        {
            name: '殉道',
            description: '为帝皇献身。你愿意吗？',
            target: 'self',
            difficulty: 'extreme',
            reward: { faith: 60, chaosReduction: 40 },
            penalty: { chaosIncrease: 50 }
        }
    ],

    // 扩展战斗卡（新增6张）
    combat_extended: [
        {
            name: '清理边境',
            description: '边境有零星敌人出没。清除他们。',
            target: 'border',
            difficulty: 'simple',
            reward: { materials: 20, reputation: 5 },
            penalty: { chaosIncrease: 8 },
            enemies: ['orc_scout', 'ork']
        },
        {
            name: '巡逻遇敌',
            description: '巡逻时遭遇敌人。战斗！',
            target: 'patrol',
            difficulty: 'simple',
            reward: { materials: 25, reputation: 8 },
            penalty: { chaosIncrease: 10 },
            enemies: ['chaos_marauder']
        },
        {
            name: '侦察敌营',
            description: '发现敌人营地进行侦察。',
            target: 'scout',
            difficulty: 'normal',
            reward: { materials: 40, intelligence: 10 },
            penalty: { chaosIncrease: 15 },
            enemies: ['ork_boy']
        },
        {
            name: '小型遭遇战',
            description: '遭遇一支混沌巡逻队。',
            target: 'skirmish',
            difficulty: 'normal',
            reward: { materials: 50, reputation: 15 },
            penalty: { chaosIncrease: 20 },
            enemies: ['chaos_cultist', 'chaos_cultist']
        },
        {
            name: '要塞进攻',
            description: '攻占敌人占据的要塞。',
            target: 'fortress',
            difficulty: 'hard',
            reward: { materials: 100, reputation: 30 },
            penalty: { chaosIncrease: 35 },
            enemies: ['chaos_warrior', 'ork_warboss', 'chaos_sorcerer']
        },
        {
            name: '最终决战',
            description: '混沌大军压境。这是最后一战！',
            target: 'final_battle',
            difficulty: 'extreme',
            reward: { materials: 300, reputation: 100 },
            penalty: { chaosIncrease: 60 },
            wave_battle: true,
            waves: 10
        }
    ],

    // 扩展眷属卡（新增6张）
    devotion_extended: [
        {
            name: '偶遇战友',
            description: '遇到一个受伤的战友。帮助他。',
            target: 'injured',
            difficulty: 'simple',
            reward: { trust: 5 },
            penalty: { chaosIncrease: 5 },
            follower_possible: { type: 'combat', name: '伤愈士兵', attack: 5 }
        },
        {
            name: '技术支援',
            description: '帮助机械教信徒修理设备。',
            target: 'mechanicus',
            difficulty: 'simple',
            reward: { trust: 8, intelligence: 5 },
            penalty: { chaosIncrease: 5 }
        },
        {
            name: '新兵招募',
            description: '一个新兵想加入你的队伍。',
            target: 'recruit',
            difficulty: 'normal',
            reward: { follower: { type: 'combat', name: '新兵', attack: 8 } },
            penalty: { chaosIncrease: 10 }
        },
        {
            name: '老兵归附',
            description: '一名经验丰富的老兵愿意追随你。',
            target: 'veteran',
            difficulty: 'normal',
            reward: { follower: { type: 'combat', name: '老兵', attack: 15 } },
            penalty: { chaosIncrease: 15 }
        },
        {
            name: '灵能感应',
            description: '一个灵能者感应到你的力量。',
            target: 'psychic_recruit',
            difficulty: 'hard',
            reward: { follower: { type: 'psychic', name: '灵能学徒', attack: 20, ability: '预知' } },
            penalty: { chaosIncrease: 20 }
        },
        {
            name: '组建卫队',
            description: '招募一支小型卫队。',
            target: 'squad',
            difficulty: 'hard',
            reward: {
                followers: [
                    { type: 'combat', name: '卫士', attack: 10 },
                    { type: 'combat', name: '卫士', attack: 10 },
                    { type: 'psychic', name: '护教者', attack: 15, ability: '心灵护盾' }
                ]
            },
            penalty: { chaosIncrease: 30 }
        }
    ],

    // 特殊事件卡（新增4张）
    special_events: [
        {
            name: '兽潮来袭',
            description: '大规模兽潮正在接近！',
            type: 'event',
            difficulty: 'hard',
            reward: { materials: 80, reputation: 25 },
            penalty: { chaosIncrease: 30 },
            special: '生存挑战'
        },
        {
            name: '混沌裂缝',
            description: '空间出现裂缝，混沌生物涌出！',
            type: 'event',
            difficulty: 'extreme',
            reward: { materials: 150, reputation: 50 },
            penalty: { chaosIncrease: 45 },
            special: '裂缝封印'
        },
        {
            name: '援军到达',
            description: '帝国援军即将到达！',
            type: 'event',
            difficulty: 'normal',
            reward: { materials: 100, reputation: 30 },
            penalty: { chaosIncrease: 10 },
            special: '等待还是出击？'
        },
        {
            name: '神秘礼物',
            description: '你发现了一个神秘包裹。',
            type: 'event',
            difficulty: 'simple',
            reward: { materials: 50, intelligence: 10 },
            penalty: { chaosIncrease: 5 },
            special: '礼物还是陷阱？'
        }
    ]
};

/**
 * 获取扩展卡牌（混合基础卡和扩展卡）
 */
function getExpandedCard(type) {
    // 基础卡（现有）
    const baseCards = {
        chaos: ['simple', 'normal', 'hard', 'extreme'],
        faith: ['simple', 'normal', 'hard', 'extreme'],
        combat: ['simple', 'normal', 'hard', 'extreme'],
        devotion: ['simple', 'normal', 'hard', 'extreme']
    };

    // 70%概率基础卡，30%概率扩展卡
    const useExtended = Math.random() < 0.3;

    if (useExtended) {
        const extendedPool = EXPANDED_CARDS[type + '_extended'];
        if (extendedPool) {
            const card = extendedPool[Math.floor(Math.random() * extendedPool.length)];
            return {
                id: `${type}_extended_${Date.now()}`,
                type: type,
                ...card
            };
        }
    }

    // 返回基础卡
    const difficulty = baseCards[type][Math.floor(Math.random() * baseCards[type].length)];
    return generateCard(type, difficulty);
}

/**
 * 获取随机特殊事件
 */
function getSpecialEvent() {
    const events = EXPANDED_CARDS.special_events;
    const event = events[Math.floor(Math.random() * events.length)];
    return {
        id: `special_${Date.now()}`,
        ...event
    };
}

// 导出
window.EXPANDED_CARDS = EXPANDED_CARDS;
window.getExpandedCard = getExpandedCard;
window.getSpecialEvent = getSpecialEvent;
