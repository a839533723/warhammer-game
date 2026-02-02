/**
 * 战锤40K - 完整战斗系统
 * 真正的战斗过程、奖励、结算
 */

// ============================================
// 敌人数据库
// ============================================

const ENEMY_DATABASE = {
    // 混沌敌人
    chaos: {
        '混沌信徒': {
            hp: 30, attack: 8, defense: 3,
            description: '被混沌腐蚀的信徒，眼中燃烧着疯狂',
            rewards: { materials: 15, faith: 5, chaos: 2 },
            attackText: ['挥舞着腐蚀的剑', '发出刺耳的咆哮', '试图用混沌魔法侵蚀你']
        },
        '混沌武士': {
            hp: 50, attack: 12, defense: 6,
            description: '强大的混沌战士，装备着被腐蚀的盔甲',
            rewards: { materials: 30, faith: 10, chaos: 5 },
            attackText: ['猛烈劈砍', '召唤混沌闪电', '用盾牌猛击']
        },
        '混沌冠军': {
            hp: 100, attack: 18, defense: 10,
            description: '混沌力量的化身，体型巨大的战士',
            rewards: { materials: 80, faith: 25, chaos: 10 },
            attackText: ['释放混沌爆发', '召唤恶魔仆从', '愤怒的粉碎攻击']
        }
    },
    // 异形敌人
    alien: {
        '兽人小子': {
            hp: 25, attack: 10, defense: 2,
            description: '矮小但凶悍的兽人，手里拿着生锈的武器',
            rewards: { materials: 10, scrap: 5 },
            attackText: ['冲锋', '用武器乱砍', '发出战吼']
        },
        '兽人军阀': {
            hp: 60, attack: 15, defense: 8,
            description: '体型巨大的兽人首领，装备着高科技武器',
            rewards: { materials: 40, scrap: 15 },
            attackText: ['重型射击', '近战猛击', '呼叫支援']
        },
        '太空亡灵': {
            hp: 40, attack: 14, defense: 4,
            description: '不死族的战士，没有任何痛觉',
            rewards: { materials: 20, soulFragment: 1 },
            attackText: ['灵魂冲击', '吸取生命力', '制造亡灵仆从']
        }
    },
    // 帝国敌人（特殊情况）
    imperial: {
        '堕落骑士': {
            hp: 80, attack: 16, defense: 12,
            description: '曾经伟大的骑士，现在成为了叛徒',
            rewards: { materials: 50, holyRelic: 1 },
            attackText: ['荣耀斩击', '神圣审判', '愤怒冲锋']
        }
    }
};

// ============================================
// 战斗主函数
// ============================================

function startCombat(enemyType, difficulty = 'normal') {
    // 获取敌人
    const enemyData = getRandomEnemy(enemyType);
    if (!enemyData) {
        addDialog('system', '⚠️', '没有找到敌人！');
        return;
    }

    // 根据难度调整
    const difficultyMod = getDifficultyMod(difficulty);
    
    const enemy = {
        ...enemyData,
        maxHp: Math.floor(enemyData.hp * difficultyMod.hp),
        hp: Math.floor(enemyData.hp * difficultyMod.hp),
        attack: Math.floor(enemyData.attack * difficultyMod.attack),
        defense: Math.floor(enemyData.defense * difficultyMod.defense),
        difficulty: difficulty,
        round: 1,
        maxRound: 5  // 最多5回合
    };

    // 保存到游戏状态
    gameState.combatState = {
        active: true,
        enemy: enemy,
        player: {
            hp: gameState.character.hp,
            maxHp: gameState.character.maxHp,
            attack: getPlayerAttack(),
            defense: getPlayerDefense()
        },
        round: 1,
        log: [],
        defending: false
    };

    // 显示战斗界面
    showCombatInterface(enemy);

    // 战斗开始叙事
    addDialog('combat', '⚔️', '═══════════════════════════════════');
    addDialog('combat', '💀', `遭遇敌人：${enemy.name}`);
    addDialog('combat', '📝', enemy.description);
    addDialog('combat', '⚔️', '═══════════════════════════════════');

    // 第一回合
    startCombatRound();
}

function getDifficultyMod(difficulty) {
    const mods = {
        'easy': { hp: 0.7, attack: 0.7, defense: 0.7 },
        'normal': { hp: 1.0, attack: 1.0, defense: 1.0 },
        'hard': { hp: 1.3, attack: 1.3, defense: 1.3 }
    };
    return mods[difficulty] || mods['normal'];
}

function getPlayerAttack() {
    const char = gameState.character;
    const baseAttack = 10 + char.level * 2;
    const classBonus = {
        '极限战士': 5, '狼弟子': 10, '刺客庭刺客': 8,
        '帝国之拳': 2, '灰骑士': 6, '机械教信徒': 4,
        '帝国军官': 5, '黑暗天使': 7
    };
    return baseAttack + (classBonus[char.class] || 0);
}

function getPlayerDefense() {
    const char = gameState.character;
    const baseDefense = 5 + char.level;
    const classBonus = {
        '极限战士': 5, '狼弟子': 2, '刺客庭刺客': 3,
        '帝国之拳': 10, '灰骑士': 4, '机械教信徒': 6,
        '帝国军官': 4, '黑暗天使': 3
    };
    return baseDefense + (classBonus[char.class] || 0);
}

function getRandomEnemy(type) {
    const pool = ENEMY_DATABASE[type] || ENEMY_DATABASE.chaos;
    const keys = Object.keys(pool);
    const key = keys[Math.floor(Math.random() * keys.length)];
    return { name: key, ...pool[key] };
}

// ============================================
// 战斗回合
// ============================================

function startCombatRound() {
    const state = gameState.combatState;
    if (!state.active) return;

    const enemy = state.enemy;

    // 回合限制
    if (state.round > enemy.maxRound) {
        addDialog('combat', '⏰', `战斗超时！你和${enemy.name}都筋疲力尽...`);
        endCombat(false, 'timeout');
        return;
    }

    // 显示回合
    addDialog('combat', '🔄', `--- 第 ${state.round} 回合 ---`);

    // 玩家先手
    playerTurn();
}

function playerTurn() {
    const state = gameState.combatState;
    if (!state.active) return;

    const enemy = state.enemy;
    const player = state.player;

    // 防御重置
    state.defending = false;

    // 计算伤害
    const damage = calculatePlayerDamage(player.attack, enemy.defense);
    const isCrit = Math.random() < 0.15;  // 15%暴击
    const finalDamage = isCrit ? Math.floor(damage * 1.5) : damage;

    // 应用伤害
    enemy.hp -= finalDamage;

    // 叙事
    const critText = isCrit ? ' ⚡暴击！' : '';
    const killText = enemy.hp <= 0 ? ' 🏆 致命一击！' : '';
    addDialog('combat', '⚔️', `你攻击${enemy.name}！${critText}${killText}造成 ${finalDamage} 点伤害`);

    // 记录
    state.log.push({ round: state.round, type: 'player', damage: finalDamage, crit: isCrit });

    // 检查敌人是否死亡
    if (enemy.hp <= 0) {
        enemy.hp = 0;
        addDialog('combat', '💀', `☠️ ${enemy.name}被你击杀！`);
        endCombat(true, 'victory');
        return;
    }

    // 敌人回合
    setTimeout(() => enemyTurn(), 800);
}

function enemyTurn() {
    const state = gameState.combatState;
    if (!state.active) return;

    const enemy = state.enemy;
    const player = state.player;

    // 获取敌人攻击文本
    const attackTexts = enemy.attackText || ['攻击'];
    const attackText = attackTexts[Math.floor(Math.random() * attackTexts.length)];

    // 计算伤害
    let damage = calculateEnemyDamage(enemy.attack, player.defense);

    // 防御减半
    if (state.defending) {
        damage = Math.floor(damage * 0.5);
        addDialog('combat', '🛡️', '防御姿态生效！伤害减半');
    }

    // 应用伤害
    player.hp -= damage;

    // 叙事
    addDialog('combat', '💢', `${enemy.name} ${attackText}！对你造成 ${damage} 点伤害`);

    // 记录
    state.log.push({ round: state.round, type: 'enemy', damage: damage });

    // 检查玩家是否死亡
    if (player.hp <= 0) {
        player.hp = 0;
        addDialog('combat', '💀', `☠️ 你被${enemy.name}击败了！`);
        endCombat(false, 'defeat');
        return;
    }

    // 回合结束
    state.round++;
    updateCombatUI();

    // 下一回合
    setTimeout(() => startCombatRound(), 800);
}

function calculatePlayerDamage(attack, defense) {
    const base = attack - defense;
    const variance = Math.floor(Math.random() * 5) - 2;  // -2到+2
    return Math.max(1, base + variance);
}

function calculateEnemyDamage(attack, defense) {
    const base = attack - defense;
    const variance = Math.floor(Math.random() * 8) - 4;  // -4到+4
    return Math.max(1, base + variance);
}

// ============================================
// 战斗结束
// ============================================

function endCombat(victory, reason) {
    const state = gameState.combatState;
    if (!state) return;

    state.active = false;
    state.victory = victory;
    state.reason = reason;

    if (victory) {
        // 发放奖励
        const rewards = giveCombatRewards(state.enemy);
        
        // 更新游戏状态
        gameState.character.hp = state.player.hp;
        gameState.stats = gameState.stats || {};
        gameState.stats.wins = (gameState.stats.wins || 0) + 1;
        
        addDialog('combat', '🏆', '═══════════════════════════════════');
        addDialog('combat', '✅', '战斗胜利！');
        addDialog('combat', '📦', `获得：${rewards}`);
        addDialog('combat', '🏆', '═══════════════════════════════════');
        
        // 检查成就
        if (typeof checkAchievements === 'function') {
            checkAchievements(gameState);
        }
    } else {
        // 失败惩罚
        const chaosPenalty = reason === 'defeat' ? 10 : 5;
        gameState.character.chaos = Math.min(100, gameState.character.chaos + chaosPenalty);
        gameState.character.hp = Math.max(10, state.player.hp);  // 不会死
        
        addDialog('combat', '💀', '═══════════════════════════════════');
        addDialog('combat', '❌', '战斗失败...');
        addDialog('combat', '🔮', `混沌值+${chaosPenalty}`);
        addDialog('combat', '💀', '═══════════════════════════════════');
    }

    // 保存
    saveGame();

    // 关闭战斗界面
    setTimeout(() => closeCombatPanel(), 2000);
}

function giveCombatRewards(enemy) {
    const rewards = enemy.rewards || { materials: 10 };
    let rewardText = [];
    
    // 应用难度修改器
    const difficulty = getDifficultyModifier ? getDifficultyModifier('resourceGain') : 1.0;
    
    for (const [type, amount] of Object.entries(rewards)) {
        const finalAmount = Math.floor(amount * (0.8 + Math.random() * 0.4) * difficulty);
        
        if (type === 'materials') {
            gameState.resources.materials = (gameState.resources.materials || 0) + finalAmount;
            rewardText.push(`${finalAmount}📦`);
        } else if (type === 'faith') {
            gameState.character.faith = (gameState.character.faith || 0) + finalAmount;
            rewardText.push(`${finalAmount}✨`);
        } else if (type === 'scrap') {
            gameState.resources.scrap = (gameState.resources.scrap || 0) + finalAmount;
            rewardText.push(`${finalAmount}🔧`);
        } else if (type === 'soulFragment') {
            gameState.resources.soulFragments = (gameState.resources.soulFragments || 0) + finalAmount;
            rewardText.push(`${finalAmount}💎`);
        } else if (type === 'holyRelic') {
            gameState.resources.holyRelics = (gameState.resources.holyRelics || 0) + finalAmount;
            rewardText.push(`${finalAmount}⚱️`);
        } else if (type === 'chaos') {
            // 混沌敌人会污染你
            gameState.character.chaos = Math.min(100, gameState.character.chaos + finalAmount);
            rewardText.push(`混沌+${finalAmount}`);
        }
    }
    
    return rewardText.join(' ');
}

// ============================================
// 战斗界面
// ============================================

function showCombatInterface(enemy) {
    // 移除旧界面
    closeCombatPanel();

    const panel = document.createElement('div');
    panel.id = 'combatPanel';
    panel.className = 'combat-panel';

    panel.innerHTML = `
        <div class="combat-header">
            <h2>⚔️ 战斗</h2>
            <button class="close-btn" onclick="closeCombatPanel()">×</button>
        </div>
        
        <div class="combat-arena">
            <!-- 敌人 -->
            <div class="combat-enemy">
                <div class="enemy-avatar">${getEnemyEmoji(enemy.name)}</div>
                <div class="enemy-info">
                    <h3>${enemy.name}</h3>
                    <div class="hp-bar">
                        <div class="hp-fill" id="enemy-hp-fill" style="width: 100%"></div>
                    </div>
                    <div class="hp-text" id="enemy-hp-text">${enemy.hp}/${enemy.maxHp}</div>
                    <div class="enemy-stats">
                        ⚔️${enemy.attack} 🛡️${enemy.defense}
                    </div>
                </div>
            </div>

            <!-- VS -->
            <div class="combat-vs">VS</div>

            <!-- 玩家 -->
            <div class="combat-player">
                <div class="player-avatar">👤</div>
                <div class="player-info">
                    <h3>${gameState.character.class || '战士'}</h3>
                    <div class="hp-bar">
                        <div class="hp-fill player" id="player-hp-fill" style="width: 100%"></div>
                    </div>
                    <div class="hp-text" id="player-hp-text">${gameState.character.hp}/${gameState.character.maxHp}</div>
                </div>
            </div>
        </div>

        <!-- 战斗日志 -->
        <div class="combat-log" id="combat-log"></div>

        <!-- 行动按钮 -->
        <div class="combat-actions">
            <button class="combat-btn attack" onclick="playerTurn()">
                ⚔️ 攻击
            </button>
            <button class="combat-btn defend" onclick="defendAction()">
                🛡️ 防御
            </button>
            <button class="combat-btn retreat" onclick="retreatAction()">
                🏃 撤退
            </button>
        </div>
    `;

    // 添加样式
    const style = document.createElement('style');
    style.textContent = `
        .combat-panel {
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: linear-gradient(180deg, #1a0a0a 0%, #0a0a0a 100%);
            z-index: 1000;
            display: flex;
            flex-direction: column;
            font-family: 'Microsoft YaHei', sans-serif;
        }

        .combat-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 15px 20px;
            background: rgba(139, 0, 0, 0.3);
            border-bottom: 2px solid #8b0000;
        }

        .combat-header h2 {
            color: #ff4444;
            margin: 0;
            font-size: 24px;
        }

        .close-btn {
            background: none;
            border: none;
            color: #fff;
            font-size: 32px;
            cursor: pointer;
        }

        .combat-arena {
            flex: 1;
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 20px;
            padding: 20px;
        }

        .combat-enemy, .combat-player {
            text-align: center;
            padding: 20px;
            background: rgba(255, 255, 255, 0.05);
            border-radius: 15px;
            min-width: 180px;
        }

        .enemy-avatar, .player-avatar {
            font-size: 64px;
            margin-bottom: 10px;
        }

        .enemy-info h3, .player-info h3 {
            color: #fff;
            margin: 0 0 10px 0;
            font-size: 18px;
        }

        .hp-bar {
            background: rgba(0, 0, 0, 0.5);
            height: 20px;
            border-radius: 10px;
            overflow: hidden;
            margin-bottom: 5px;
        }

        .hp-fill {
            height: 100%;
            background: linear-gradient(90deg, #ff4444, #cc0000);
            transition: width 0.3s ease;
        }

        .hp-fill.player {
            background: linear-gradient(90deg, #44ff44, #00cc00);
        }

        .hp-text {
            color: #aaa;
            font-size: 14px;
        }

        .enemy-stats {
            color: #888;
            font-size: 14px;
            margin-top: 5px;
        }

        .combat-vs {
            font-size: 32px;
            font-weight: bold;
            color: #ff4444;
        }

        .combat-log {
            height: 150px;
            background: rgba(0, 0, 0, 0.3);
            padding: 10px;
            overflow-y: auto;
            font-size: 14px;
            color: #ddd;
            border-top: 1px solid #333;
            border-bottom: 1px solid #333;
        }

        .combat-log .log-entry {
            padding: 3px 0;
            border-bottom: 1px solid rgba(255, 255, 255, 0.1);
        }

        .combat-log .log-entry.combat {
            color: #ff6666;
        }

        .combat-log .log-entry.system {
            color: #ffff66;
        }

        .combat-actions {
            display: flex;
            gap: 10px;
            padding: 15px;
            background: rgba(0, 0, 0, 0.5);
        }

        .combat-btn {
            flex: 1;
            padding: 15px;
            border: none;
            border-radius: 10px;
            font-size: 18px;
            cursor: pointer;
            transition: all 0.2s;
        }

        .combat-btn.attack {
            background: linear-gradient(135deg, #8b0000, #cc0000);
            color: #fff;
        }

        .combat-btn.defend {
            background: linear-gradient(135deg, #004400, #006600);
            color: #fff;
        }

        .combat-btn.retreat {
            background: linear-gradient(135deg, #444, #666);
            color: #fff;
        }

        .combat-btn:hover {
            transform: scale(1.02);
            filter: brightness(1.2);
        }
    `;

    document.head.appendChild(style);
    document.body.appendChild(panel);

    // 添加日志
    addCombatLog(`遭遇 ${enemy.name}！`, 'system');
}

function getEnemyEmoji(name) {
    const emojis = {
        '混沌信徒': '👹', '混沌武士': '💀', '混沌冠军': '👺',
        '兽人小子': '👺', '兽人军阀': '👿', '太空亡灵': '💀',
        '堕落骑士': '🗡️'
    };
    return emojis[name] || '👾';
}

function addCombatLog(text, type = 'combat') {
    const log = document.getElementById('combat-log');
    if (!log) return;

    const entry = document.createElement('div');
    entry.className = `log-entry ${type}`;
    entry.textContent = text;
    log.appendChild(entry);
    log.scrollTop = log.scrollHeight;
}

function updateCombatUI() {
    const panel = document.getElementById('combatPanel');
    if (!panel) return;

    const state = gameState.combatState;
    if (!state) return;

    // 更新敌人血量
    const enemy = state.enemy;
    const enemyFill = panel.querySelector('#enemy-hp-fill');
    const enemyText = panel.querySelector('#enemy-hp-text');
    if (enemyFill && enemyText) {
        const hpPercent = Math.max(0, enemy.hp / enemy.maxHp * 100);
        enemyFill.style.width = hpPercent + '%';
        enemyText.textContent = `${Math.max(0, enemy.hp)}/${enemy.maxHp}`;
    }

    // 更新玩家血量
    const player = state.player;
    const playerFill = panel.querySelector('#player-hp-fill');
    const playerText = panel.querySelector('#player-hp-text');
    if (playerFill && playerText) {
        const hpPercent = Math.max(0, player.hp / player.maxHp * 100);
        playerFill.style.width = hpPercent + '%';
        playerText.textContent = `${Math.max(0, player.hp)}/${player.maxHp}`;
    }
}

function defendAction() {
    if (!gameState.combatState?.active) return;

    gameState.combatState.defending = true;
    addCombatLog('🛡️ 你进入防御姿态', 'system');

    // 跳到敌人回合
    setTimeout(() => enemyTurn(), 500);
}

function retreatAction() {
    if (!gameState.combatState?.active) return;

    addCombatLog('🏃 你选择了撤退...', 'system');
    addCombatLog('💀 混沌值+10', 'system');

    gameState.character.chaos = Math.min(100, gameState.character.chaos + 10);
    endCombat(false, 'retreat');
}

function closeCombatPanel() {
    const panel = document.getElementById('combatPanel');
    if (panel) {
        panel.remove();
    }
}

// ============================================
// 导出
// ============================================

window.startCombat = startCombat;
window.getRandomEnemy = getRandomEnemy;
window.playerTurn = playerTurn;
window.enemyTurn = enemyTurn;
window.endCombat = endCombat;
window.closeCombatPanel = closeCombatPanel;
window.defendAction = defendAction;
window.retreatAction = retreatAction;
window.updateCombatUI = updateCombatUI;
window.ENEMY_DATABASE = ENEMY_DATABASE;
