/**
 * 战锤40K - 成就系统
 * 游戏目标、成就解锁、进度追踪
 */

// ============================================
// 成就定义
// ============================================

const ACHIEVEMENTS = {
    // 生存成就
    survival: {
        title: "生存大师",
        icon: "🏃",
        description: "在混沌中生存",
        tier: "bronze",
        condition: (state) => state.turn >= 3,
        reward: { materials: 20 }
    },
    survival_7: {
        title: "持久战士",
        icon: "💪",
        description: "存活7回合",
        tier: "silver",
        condition: (state) => state.turn >= 7,
        reward: { materials: 50 }
    },
    survival_14: {
        title: "坚不可摧",
        icon: "🛡️",
        description: "完成14回合生存",
        tier: "gold",
        condition: (state) => state.turn >= 14,
        reward: { materials: 100, reputation: 50 }
    },

    // 混沌成就
    chaos_purity: {
        title: "纯净灵魂",
        icon: "✨",
        description: "混沌值始终低于20",
        tier: "silver",
        condition: (state) => state.character.chaos < 20,
        reward: { faith: 30 }
    },
    chaos_slayer: {
        title: "混沌杀手",
        icon: "⚔️",
        description: "击败混沌敌人10次",
        tier: "gold",
        condition: (state) => (state.stats?.chaosKills || 0) >= 10,
        reward: { materials: 100, attack: 5 }
    },

    // 战斗成就
    first_blood: {
        title: "初战告捷",
        icon: "🩸",
        description: "赢得第一场战斗",
        tier: "bronze",
        condition: (state) => state.stats?.wins >= 1,
        reward: { materials: 15 }
    },
    war_hero: {
        title: "战争英雄",
        icon: "🏆",
        description: "赢得10场战斗",
        tier: "gold",
        condition: (state) => (state.stats?.wins || 0) >= 10,
        reward: { materials: 150, attack: 10 }
    },

    // 追随者成就
    leader: {
        title: "天生领袖",
        icon: "👑",
        description: "招募5名追随者",
        tier: "silver",
        condition: (state) => (state.character.followers?.length || 0) >= 5,
        reward: { materials: 50, leadership: 5 }
    },
    legion: {
        title: "军团领袖",
        icon: "⚔️",
        description: "招募10名追随者",
        tier: "gold",
        condition: (state) => (state.character.followers?.length || 0) >= 10,
        reward: { materials: 200, leadership: 10 }
    },

    // 建筑成就
    builder: {
        title: "建造者",
        icon: "🏗️",
        description: "建造3座建筑",
        tier: "bronze",
        condition: (state) => (Object.keys(state.buildings || {}).length >= 3),
        reward: { materials: 30 }
    },
    metropolis: {
        title: "都市建设者",
        icon: "🏰",
        description: "建造6座建筑（每种一座）",
        tier: "gold",
        condition: (state) => {
            const buildings = state.buildings || {};
            const types = ['barracks', 'armory', 'shrine', 'intelligence', 'hospital', 'wall'];
            return types.every(t => buildings[t]);
        },
        reward: { materials: 200, all_stats: 5 }
    },

    // 调查成就
    detective: {
        title: "侦探",
        icon: "🔍",
        description: "完成3个混沌任务",
        tier: "bronze",
        condition: (state) => (state.stats?.chaosTasks || 0) >= 3,
        reward: { intelligence: 20 }
    },
    truth_seeker: {
        title: "真相追寻者",
        icon: "🕵️",
        description: "完成10个混沌任务",
        tier: "silver",
        condition: (state) => (state.stats?.chaosTasks || 0) >= 10,
        reward: { intelligence: 50, perception: 5 }
    },
    inquisitor: {
        title: "大审判官",
        icon: "⚖️",
        description: "正确处决5个内鬼",
        tier: "gold",
        condition: (state) => (state.stats?.correctVotes || 0) >= 5,
        reward: { reputation: 100, holy: 10 }
    },

    // 隐藏成就
    hidden_1: {
        title: "堕落边缘",
        icon: "🔮",
        description: "混沌值达到90但未堕落",
        tier: "silver",
        hidden: True,
        condition: (state) => state.character.chaos >= 90 && state.character.chaos < 100,
        reward: { chaos_resistance: 10 }
    },
    hidden_2: {
        title: "完美主义者",
        icon: "💎",
        description: "14回合混沌值始终低于30",
        tier: "gold",
        hidden: True,
        condition: (state) => state.turn >= 14 && state.character.chaos < 30,
        reward: { all_stats: 15 }
    }
};

// 成就等级
const ACHIEVEMENT_TIERS = {
    bronze: { name: "青铜", color: "#cd7f32", points: 10 },
    silver: { name: "白银", color: "#c0c0c0", points: 25 },
    gold: { name: "黄金", color: "#ffd700", points: 50 }
};

// ============================================
// 成就状态管理
// ============================================

class AchievementSystem {
    constructor() {
        this.achievements = {};
        this.unlocked = [];
        this.stats = {
            wins: 0,
            losses: 0,
            chaosKills: 0,
            chaosTasks: 0,
            correctVotes: 0,
            wrongVotes: 0
        };
    }

    // 初始化玩家成就状态
    init(state) {
        if (!state.achievements) {
            state.achievements = {};
        }
        if (!state.stats) {
            state.stats = this.stats;
        }
        this.achievements = state.achievements;
        this.stats = state.stats;
    }

    // 检查成就
    checkAchievements(state) {
        const newlyUnlocked = [];

        for (const [id, achievement] of Object.entries(ACHIEVEMENTS)) {
            // 跳过已解锁和隐藏成就（除非满足条件）
            if (this.achievements[id]) continue;
            if (achievement.hidden && !achievement.condition(state)) continue;

            try {
                if (achievement.condition(state)) {
                    this.unlockAchievement(id, state);
                    newlyUnlocked.push(id);
                }
            } catch (e) {
                console.warn(`成就检查错误 ${id}:`, e);
            }
        }

        return newlyUnlocked;
    }

    // 解锁成就
    unlockAchievement(id, state) {
        const achievement = ACHIEVEMENTS[id];
        if (!achievement) return;

        this.achievements[id] = {
            unlockedAt: Date.now(),
            tier: achievement.tier
        };
        this.unlocked.push(id);

        // 应用奖励
        if (achievement.reward) {
            this.applyReward(achievement.reward, state);
        }

        // 保存到gameState
        state.achievements = this.achievements;
        state.stats = this.stats;

        return achievement;
    }

    // 应用奖励
    applyReward(reward, state) {
        if (reward.materials) {
            state.resources.materials += reward.materials;
        }
        if (reward.faith) {
            state.character.faith += reward.faith;
        }
        if (reward.reputation) {
            state.character.faith += reward.reputation;  // 使用faith作为声望
        }
        if (reward.intelligence) {
            state.resources.intelligence += reward.intelligence;
        }
        if (reward.attack) {
            // 临时攻击加成（需要修改战斗系统支持）
        }
    }

    // 获取成就进度
    getProgress() {
        const total = Object.keys(ACHIEVEMENTS).length;
        const unlocked = this.unlocked.length;

        return {
            unlocked,
            total,
            percentage: Math.round(unlocked / total * 100),
            points: this.calculatePoints()
        };
    }

    // 计算成就点数
    calculatePoints() {
        let points = 0;
        for (const id of this.unlocked) {
            const achievement = ACHIEVEMENTS[id];
            if (achievement) {
                points += ACHIEVEMENT_TIERS[achievement.tier]?.points || 0;
            }
        }
        return points;
    }

    // 获取已解锁成就列表
    getUnlockedList() {
        return this.unlocked.map(id => ({
            id,
            ...ACHIEVEMENTS[id]
        }));
    }

    // 获取未解锁成就列表
    getLockedList() {
        return Object.entries(ACHIEVEMENTS)
            .filter(([id]) => !this.unlocked.includes(id) && !ACHIEVEMENTS[id].hidden)
            .map(([id, achievement]) => ({
                id,
                ...achievement,
                locked: true
            }));
    }
}

// ============================================
// 成就UI系统
// ============================================

function showAchievements() {
    const panel = document.createElement('div');
    panel.id = 'achievementsPanel';
    panel.className = 'achievements-overlay';

    const achievementSystem = new AchievementSystem();
    achievementSystem.init(gameState);

    const progress = achievementSystem.getProgress();
    const unlocked = achievementSystem.getUnlockedList();
    const locked = achievementSystem.getLockedList();

    let unlockedHTML = unlocked.map(a => `
        <div class="achievement-card unlocked tier-${a.tier}">
            <div class="achievement-icon">${a.icon}</div>
            <div class="achievement-info">
                <h4>${a.title}</h4>
                <p>${a.description}</p>
                <span class="achievement-tier">${ACHIEVEMENT_TIERS[a.tier].name}</span>
            </div>
        </div>
    `).join('') || '<p class="empty-text">还没有解锁任何成就...</p>';

    let lockedHTML = locked.slice(0, 6).map(a => `
        <div class="achievement-card locked">
            <div class="achievement-icon">❓</div>
            <div class="achievement-info">
                <h4>???</h4>
                <p>完成特定条件解锁</p>
            </div>
        </div>
    `).join('') || '<p class="empty-text">所有可见成就已解锁！</p>';

    panel.innerHTML = `
        <div class="achievements-content">
            <div class="achievements-header">
                <h2>🏆 成就系统</h2>
                <div class="achievements-progress">
                    <span>${progress.unlocked}/${progress.total}</span>
                    <span class="achievement-points">${progress.points} pts</span>
                </div>
            </div>

            <div class="progress-bar">
                <div class="progress-fill" style="width: ${progress.percentage}%"></div>
            </div>

            <div class="achievements-section">
                <h3>已解锁 (${unlocked.length})</h3>
                <div class="achievements-grid">
                    ${unlockedHTML}
                </div>
            </div>

            <div class="achievements-section">
                <h3>待解锁</h3>
                <div class="achievements-grid">
                    ${lockedHTML}
                </div>
            </div>

            <button class="close-achievements" onclick="closeAchievementsPanel()">×</button>
        </div>
    `;

    // 添加样式
    const style = document.createElement('style');
    style.textContent = `
        .achievements-overlay {
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0, 0, 0, 0.9);
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 1000;
            overflow-y: auto;
        }

        .achievements-content {
            background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
            border: 2px solid #ffd700;
            border-radius: 16px;
            padding: 30px;
            max-width: 700px;
            width: 90%;
            max-height: 80vh;
            overflow-y: auto;
            position: relative;
        }

        .achievements-header {
            text-align: center;
            margin-bottom: 20px;
        }

        .achievements-header h2 {
            color: #ffd700;
            margin: 0 0 10px 0;
        }

        .achievements-progress {
            display: flex;
            justify-content: center;
            gap: 20px;
            font-size: 18px;
        }

        .achievement-points {
            color: #ffd700;
            font-weight: bold;
        }

        .progress-bar {
            background: rgba(255, 255, 255, 0.1);
            height: 8px;
            border-radius: 4px;
            margin-bottom: 20px;
            overflow: hidden;
        }

        .progress-fill {
            height: 100%;
            background: linear-gradient(90deg, #ffd700 0%, #ffed4a 100%);
            border-radius: 4px;
            transition: width 0.5s ease;
        }

        .achievements-section {
            margin-bottom: 20px;
        }

        .achievements-section h3 {
            color: #fff;
            margin: 0 0 15px 0;
            border-bottom: 1px solid rgba(255, 255, 255, 0.1);
            padding-bottom: 10px;
        }

        .achievements-grid {
            display: grid;
            grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
            gap: 10px;
        }

        .achievement-card {
            background: rgba(0, 0, 0, 0.3);
            border: 2px solid #333;
            border-radius: 10px;
            padding: 12px;
            display: flex;
            align-items: center;
            gap: 12px;
            transition: all 0.3s ease;
        }

        .achievement-card.unlocked {
            border-color: #ffd700;
            background: rgba(255, 215, 0, 0.1);
        }

        .achievement-card.locked {
            opacity: 0.5;
        }

        .achievement-card.tier-bronze { border-color: #cd7f32; }
        .achievement-card.tier-silver { border-color: #c0c0c0; }
        .achievement-card.tier-gold { border-color: #ffd700; }

        .achievement-icon {
            font-size: 32px;
            width: 50px;
            height: 50px;
            display: flex;
            align-items: center;
            justify-content: center;
            background: rgba(255, 255, 255, 0.1);
            border-radius: 50%;
        }

        .achievement-info {
            flex: 1;
        }

        .achievement-info h4 {
            color: #fff;
            margin: 0 0 5px 0;
            font-size: 14px;
        }

        .achievement-info p {
            color: #a0a0a0;
            margin: 0;
            font-size: 12px;
        }

        .achievement-tier {
            display: inline-block;
            padding: 2px 8px;
            border-radius: 10px;
            font-size: 10px;
            margin-top: 5px;
            background: rgba(255, 255, 255, 0.1);
        }

        .tier-bronze .achievement-tier { background: rgba(205, 127, 50, 0.3); color: #cd7f32; }
        .tier-silver .achievement-tier { background: rgba(192, 192, 192, 0.3); color: #c0c0c0; }
        .tier-gold .achievement-tier { background: rgba(255, 215, 0, 0.3); color: #ffd700; }

        .close-achievements {
            position: absolute;
            top: 10px;
            right: 15px;
            background: none;
            border: none;
            color: #fff;
            font-size: 24px;
            cursor: pointer;
        }
    `;

    document.head.appendChild(style);
    document.body.appendChild(panel);
}

function closeAchievementsPanel() {
    const panel = document.getElementById('achievementsPanel');
    if (panel) {
        panel.remove();
    }
}

// ============================================
// 难度选择系统
// ============================================

const DIFFICULTIES = {
    easy: {
        name: "简单",
        icon: "🟢",
        description: "适合新手玩家",
        modifiers: {
            enemyDamage: 0.7,
            playerDamage: 1.3,
            chaosGrowth: 0.7,
            resourceGain: 1.3
        }
    },
    normal: {
        name: "普通",
        icon: "🟡",
        description: "标准游戏体验",
        modifiers: {
            enemyDamage: 1.0,
            playerDamage: 1.0,
            chaosGrowth: 1.0,
            resourceGain: 1.0
        }
    },
    hard: {
        name: "困难",
        icon: "🔴",
        description: "挑战硬核玩家",
        modifiers: {
            enemyDamage: 1.3,
            playerDamage: 0.8,
            chaosGrowth: 1.3,
            resourceGain: 0.8
        }
    }
};

let currentDifficulty = 'normal';

// 选择难度
function selectDifficulty(difficulty) {
    currentDifficulty = difficulty;
    const mod = DIFFICULTIES[difficulty].modifiers;

    // 应用难度修改器到游戏状态
    if (!gameState.difficulty) {
        gameState.difficulty = {};
    }
    gameState.difficulty = mod;

    addDialog('system', '🎯', `难度已选择: ${DIFFICULTIES[difficulty].icon} ${DIFFICULTIES[difficulty].name}`);
    addDialog('system', '📝', DIFFICULTIES[difficulty].description);

    saveGame();
}

// 获取难度修改器
function getDifficultyModifier(type) {
    if (gameState.difficulty && gameState.difficulty[type]) {
        return gameState.difficulty[type];
    }
    return 1.0;
}

// ============================================
// 导出函数
// ============================================

window.ACHIEVEMENTS = ACHIEVEMENTS;
window.ACHIEVEMENT_TIERS = ACHIEVEMENT_TIERS;
window.AchievementSystem = AchievementSystem;
window.showAchievements = showAchievements;
window.closeAchievementsPanel = closeAchievementsPanel;
window.selectDifficulty = selectDifficulty;
window.getDifficultyModifier = getDifficultyModifier;
window.DIFFICULTIES = DIFFICULTIES;
