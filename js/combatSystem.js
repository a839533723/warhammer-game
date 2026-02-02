/**
 * 战锤40K - 战斗系统增强模块
 * 伤害计算、暴击、护甲、连击系统
 */

// ============================================
// 战斗属性系统
// ============================================

/**
 * 获取角色战斗属性
 */
function getCharacterStats() {
    const char = gameState.character;
    const followers = gameState.character.followers || [];

    // 基础属性
    let attack = 10;  // 基础攻击
    let defense = 5;  // 基础防御
    let critRate = 0.1;  // 暴击率 10%
    let critDamage = 1.5;  // 暴击伤害 150%
    let comboRate = 0.05;  // 连击率 5%
    let health = char.maxHp || 100;

    // 根据职业调整
    const classBonuses = {
        '极限战士': { attack: 15, defense: 12, critRate: 0.1 },
        '狼弟子': { attack: 20, defense: 8, critRate: 0.15 },
        '刺客庭刺客': { attack: 18, defense: 6, critRate: 0.2 },
        '帝国之拳': { attack: 12, defense: 18, critRate: 0.05 },
        '灰骑士': { attack: 14, defense: 10, critRate: 0.12 },
        '机械教信徒': { attack: 10, defense: 14, critRate: 0.08 },
        '帝国军官': { attack: 13, defense: 11, critRate: 0.1 },
        '黑暗天使': { attack: 16, defense: 9, critRate: 0.15 }
    };

    const bonus = classBonuses[char.class] || { attack: 10, defense: 8, critRate: 0.1 };
    attack += bonus.attack;
    defense += bonus.bonus?.attack || 0;
    critRate += bonus.critRate || 0;

    // 等级加成（每级+2攻击，+1防御）
    attack += (char.level - 1) * 2;
    defense += (char.level - 1) * 1;

    // 追随者加成
    for (const follower of followers) {
        if (follower.type === 'combat') {
            attack += 5;
            defense += 3;
            comboRate += 0.05;
        } else if (follower.type === 'psychic') {
            critDamage += 0.2;
            critRate += 0.05;
        }
    }

    // 混沌惩罚（混沌值>50时属性下降）
    if (char.chaos > 50) {
        const chaosPenalty = (char.chaos - 50) / 100; // 0-0.5
        attack = Math.floor(attack * (1 - chaosPenalty));
        defense = Math.floor(defense * (1 - chaosPenalty));
        critRate = Math.max(0, critRate - chaosPenalty);
    }

    return {
        attack: attack,
        defense: defense,
        critRate: Math.min(0.5, critRate), // 最高50%暴击率
        critDamage: critDamage,
        comboRate: Math.min(0.3, comboRate), // 最高30%连击率
        health: health,
        maxHealth: char.maxHp || 100
    };
}

/**
 * 获取敌人战斗属性
 */
function getEnemyStats(enemyType, difficulty) {
    // 敌人基础属性
    const baseStats = {
        '混沌信徒': { attack: 8, defense: 4, health: 30 },
        '兽人步兵': { attack: 12, defense: 6, health: 50 },
        '兽人军阀': { attack: 18, defense: 10, health: 80 },
        '混沌冠军': { attack: 25, defense: 15, health: 100 },
        '灵能者': { attack: 20, defense: 5, health: 40 },
        '暗黑天使叛徒': { attack: 22, defense: 12, health: 90 }
    };

    let stats = baseStats[enemyType] || { attack: 10, defense: 5, health: 40 };

    // 难度加成
    const difficultyMultiplier = {
        'simple': 0.7,
        'normal': 1.0,
        'hard': 1.5,
        'extreme': 2.0
    };

    const multiplier = difficultyMultiplier[difficulty] || 1.0;
    stats.attack = Math.floor(stats.attack * multiplier);
    stats.defense = Math.floor(stats.defense * multiplier);
    stats.health = Math.floor(stats.health * multiplier);

    return stats;
}

// ============================================
// 战斗计算系统
// ============================================

/**
 * 计算伤害
 */
function calculateDamage(attackerStats, defenderStats, isPlayer = true) {
    // 基础伤害 = 攻击 - 防御
    let baseDamage = Math.max(1, attackerStats.attack - defenderStats.defense);

    // 随机波动 (±20%)
    const variance = (Math.random() * 0.4) + 0.8;
    baseDamage = Math.floor(baseDamage * variance);

    // 暴击判定
    const isCrit = Math.random() < attackerStats.critRate;
    if (isCrit) {
        baseDamage = Math.floor(baseDamage * attackerStats.critDamage);
    }

    // 连击判定（追加伤害）
    let comboDamage = 0;
    let comboCount = 0;
    while (Math.random() < attackerStats.comboRate && comboCount < 3) {
        comboDamage += Math.floor(baseDamage * 0.5);
        comboCount++;
    }

    const totalDamage = baseDamage + comboDamage;

    return {
        baseDamage: baseDamage,
        comboDamage: comboDamage,
        totalDamage: totalDamage,
        isCrit: isCrit,
        comboCount: comboCount,
        blocked: defenderStats.defense > attackerStats.attack,
        overkill: false
    };
}

/**
 * 执行战斗（完整回合）
 */
async function combatRound(enemyType, difficulty) {
    const player = getCharacterStats();
    const enemy = getEnemyStats(enemyType, difficulty);

    let playerHealth = player.health;
    let enemyHealth = enemy.health;
    let combatLog = [];

    // 先攻判定（玩家先手，除非敌人偷袭）
    const playerFirst = Math.random() < 0.7; // 70%先手

    if (!playerFirst) {
        // 敌人先攻击
        const enemyAttack = calculateDamage(enemy, player, false);
        playerHealth -= enemyAttack.totalDamage;
        combatLog.push({
            type: 'enemy',
            text: `敌人先发制人！对你造成 ${enemyAttack.totalDamage} 点伤害${enemyAttack.isCrit ? '（暴击）' : ''}`,
            damage: enemyAttack.totalDamage,
            crit: enemyAttack.isCrit
        });

        if (playerHealth <= 0) {
            return { victory: false, log: combatLog, damage: enemy.health - enemyHealth };
        }
    }

    // 玩家攻击
    const playerAttack = calculateDamage(player, enemy, true);
    enemyHealth -= playerAttack.totalDamage;
    combatLog.push({
        type: 'player',
        text: `你发动攻击！造成 ${playerAttack.totalDamage} 点伤害${playerAttack.isCrit ? '（暴击）' : ''}${playerAttack.comboCount > 0 ? ` + ${playerAttack.comboCount}连击` : ''}`,
        damage: playerAttack.totalDamage,
        crit: playerAttack.isCrit,
        combo: playerAttack.comboCount
    });

    if (enemyHealth <= 0) {
        return {
            victory: true,
            log: combatLog,
            damage: enemy.health - enemyHealth,
            enemyKilled: enemyType
        };
    }

    // 敌人反击
    const enemyAttack = calculateDamage(enemy, player, false);
    playerHealth -= enemyAttack.totalDamage;
    combatLog.push({
        type: 'enemy',
        text: `敌人反击！对你造成 ${enemyAttack.totalDamage} 点伤害${enemyAttack.isCrit ? '（暴击）' : ''}`,
        damage: enemyAttack.totalDamage,
        crit: enemyAttack.isCrit
    });

    if (playerHealth <= 0) {
        return { victory: false, log: combatLog, damage: enemy.health - enemyHealth };
    }

    // 返回战斗结果
    return {
        victory: enemyHealth < player.health / 2, // 敌人血量低于50%算胜利
        log: combatLog,
        damage: enemy.health - enemyHealth,
        remaining: { player: playerHealth, enemy: enemyHealth }
    };
}

/**
 * 显示战斗结果
 */
function showCombatResult(result) {
    addDialog('system', '⚔️', '=== 战斗回合 ===');

    for (const entry of result.log) {
        if (entry.type === 'player') {
            let text = entry.text;
            if (entry.crit) text = '🔥 ' + text;
            addDialog('player', '⚔️', text);
        } else {
            let text = entry.text;
            if (entry.crit) text = '☠️ ' + text;
            addDialog('npc', '👹', text);
        }
    }

    addDialog('system', '─', '─'.repeat(30));

    if (result.victory) {
        addDialog('system', '🎉', '战斗胜利！');
        if (result.enemyKilled) {
            addDialog('system', '🏆', `你击败了${result.enemyKilled}！`);
        }
        // 胜利奖励
        const materials = Math.floor(Math.random() * 20) + 10;
        gameState.resources.materials += materials;
        addDialog('system', '📦', `获得物资 +${materials}`);
    } else if (result.remaining) {
        addDialog('system', '⚖️', `战斗继续...`);
        addDialog('system', '❤️', `你剩余: ${result.remaining.player} HP`);
        addDialog('system', '👹', `敌人剩余: ${result.remaining.enemy} HP`);
    } else {
        addDialog('system', '💀', '战斗失败...');
        addDialog('system', '🩸', '你受到了伤害');

        // 扣除HP
        const damage = 20;
        gameState.character.hp = Math.max(0, gameState.character.hp - damage);
        gameState.character.chaos = Math.min(100, gameState.character.chaos + 10);

        addDialog('system', '❤️', `HP -${damage}`);
        addDialog('system', '🔮', `混沌值 +10`);
    }

    updateUI();
}

// ============================================
// 敌人类型系统
// ============================================

const ENEMY_TYPES = {
    chaos: [
        { type: '混沌信徒', difficulty: ['simple', 'normal'], description: '被混沌腐蚀的普通士兵' },
        { type: '混沌冠军', difficulty: ['normal', 'hard'], description: '混沌精英战士' },
        { type: '灵能者', difficulty: ['hard', 'extreme'], description: '使用混沌灵能的施法者' }
    ],
    ork: [
        { type: '兽人步兵', difficulty: ['simple', 'normal'], description: '绿皮的战争机器' },
        { type: '兽人军阀', difficulty: ['hard', 'extreme'], description: '强大的兽人指挥官' }
    ],
    traitor: [
        { type: '暗黑天使叛徒', difficulty: ['hard', 'extreme'], description: '堕落的前帝国骑士' }
    ]
};

/**
 * 获取随机敌人
 */
function getRandomEnemy(cardType) {
    const enemyPool = ENEMY_TYPES[cardType] || ENEMY_TYPES.chaos;
    const enemy = enemyPool[Math.floor(Math.random() * enemyPool.length)];
    const difficulty = enemy.difficulty[Math.floor(Math.random() * enemy.difficulty.length)];
    return { ...enemy, difficulty };
}

// ============================================
// 战斗UI增强
// ============================================

/**
 * 显示战斗面板
 */
function showCombatPanel(enemy) {
    const player = getCharacterStats();

    // 创建战斗面板HTML
    const combatPanel = document.createElement('div');
    combatPanel.id = 'combatPanel';
    combatPanel.className = 'combat-overlay';
    combatPanel.innerHTML = `
        <div class="combat-content">
            <div class="combat-header">
                <h2>⚔️ 战斗 - ${enemy.type}</h2>
                <p>${enemy.description}</p>
            </div>

            <div class="combat-stats">
                <div class="player-stats">
                    <h3>👤 你的属性</h3>
                    <p>攻击: ${player.attack}</p>
                    <p>防御: ${player.defense}</p>
                    <p>暴击: ${Math.round(player.critRate * 100)}%</p>
                    <p>连击: ${Math.round(player.comboRate * 100)}%</p>
                </div>

                <div class="vs">VS</div>

                <div class="enemy-stats">
                    <h3>👹 ${enemy.type}</h3>
                    <p>难度: ${enemy.difficulty}</p>
                    <p class="warning">⚠️ 敌人情报有限</p>
                </div>
            </div>

            <div class="combat-actions">
                <button class="combat-btn attack" onclick="startCombat('${enemy.type}', '${enemy.difficulty}')">
                    ⚔️ 发动攻击
                </button>
                <button class="combat-btn defend" onclick="defendAction()">
                    🛡️ 防御姿态
                </button>
                <button class="combat-btn retreat" onclick="retreatAction()">
                    🏃 撤退
                </button>
            </div>

            <button class="close-combat" onclick="closeCombatPanel()">×</button>
        </div>
    `;

    // 添加样式
    const style = document.createElement('style');
    style.textContent = `
        .combat-overlay {
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
        }

        .combat-content {
            background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
            border: 2px solid #e94560;
            border-radius: 16px;
            padding: 30px;
            max-width: 500px;
            width: 90%;
            position: relative;
        }

        .combat-header {
            text-align: center;
            margin-bottom: 20px;
        }

        .combat-header h2 {
            color: #e94560;
            margin: 0 0 10px 0;
        }

        .combat-stats {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 20px;
        }

        .player-stats, .enemy-stats {
            background: rgba(0, 0, 0, 0.3);
            padding: 15px;
            border-radius: 10px;
            flex: 1;
        }

        .player-stats h3, .enemy-stats h3 {
            color: #fff;
            margin: 0 0 10px 0;
        }

        .player-stats p, .enemy-stats p {
            color: #a0a0a0;
            margin: 5px 0;
        }

        .vs {
            font-size: 24px;
            color: #e94560;
            font-weight: bold;
            padding: 0 20px;
        }

        .combat-actions {
            display: grid;
            gap: 10px;
        }

        .combat-btn {
            padding: 15px 20px;
            border: none;
            border-radius: 8px;
            font-size: 16px;
            cursor: pointer;
            transition: all 0.3s ease;
        }

        .combat-btn.attack {
            background: linear-gradient(135deg, #e94560 0%, #c23a51 100%);
            color: #fff;
        }

        .combat-btn.defend {
            background: linear-gradient(135deg, #4a90d9 0%, #357abd 100%);
            color: #fff;
        }

        .combat-btn.retreat {
            background: rgba(255, 255, 255, 0.1);
            color: #a0a0a0;
        }

        .combat-btn:hover {
            transform: scale(1.02);
            box-shadow: 0 5px 20px rgba(233, 69, 96, 0.3);
        }

        .close-combat {
            position: absolute;
            top: 10px;
            right: 15px;
            background: none;
            border: none;
            color: #fff;
            font-size: 24px;
            cursor: pointer;
        }

        .warning {
            color: #f59e0b !important;
        }
    `;

    document.head.appendChild(style);
    document.body.appendChild(combatPanel);
}

/**
 * 开始战斗
 */
function startCombat(enemyType, difficulty) {
    closeCombatPanel();

    // 执行战斗
    const result = combatRound(enemyType, difficulty);

    // 显示结果
    showCombatResult(result);
}

/**
 * 防御姿态
 */
function defendAction() {
    addDialog('system', '🛡️', '你采取防御姿态！');
    addDialog('system', '✨', '下回合受到的伤害减少50%');

    // 设置防御标记
    gameState.combatState = {
        defending: true,
        defendingTurns: 1
    };

    closeCombatPanel();
}

/**
 * 撤退
 */
function retreatAction() {
    addDialog('system', '🏃', '你选择撤退...');
    addDialog('system', '💀', '撤退成功，但混沌值+5');
    addDialog('system', '🔮', '任务失败');

    gameState.character.chaos = Math.min(100, gameState.character.chaos + 5);
    gameState.currentCard = null;
    updateUI();

    closeCombatPanel();
}

/**
 * 关闭战斗面板
 */
function closeCombatPanel() {
    const panel = document.getElementById('combatPanel');
    if (panel) {
        panel.remove();
    }
}

// ============================================
// 导出函数到全局
// ============================================

window.getCharacterStats = getCharacterStats;
window.getEnemyStats = getEnemyStats;
window.calculateDamage = calculateDamage;
window.combatRound = combatRound;
window.showCombatResult = showCombatResult;
window.getRandomEnemy = getRandomEnemy;
window.showCombatPanel = showCombatPanel;
window.startCombat = startCombat;
window.defendAction = defendAction;
window.retreatAction = retreatAction;
window.closeCombatPanel = closeCombatPanel;

// 初始化战斗状态
gameState.combatState = {
    defending: false,
    defendingTurns: 0
};
