#!/usr/bin/env python3
"""
战锤40K - 系统完整性修复
为缺失的关键函数添加实现
"""

from pathlib import Path
from datetime import datetime

GAME_DIR = Path("/root/.openclaw/workspace/warhammer-game")

# 1. 修复 combatSystem.js - 添加缺失函数
def fix_combat_system():
    filepath = GAME_DIR / "js" / "combatSystem.js"
    content = filepath.read_text()
    
    # 在导出之前添加缺失的函数
    missing_functions = '''
// ============================================
// 缺失函数实现 - 2026-02-02
// ============================================

/**
 * 玩家攻击
 */
function playerAttack(targetIndex = 0) {
    if (!gameState.combatState.active) {
        addDialog('system', '⚠️', '战斗未开始！');
        return false;
    }
    
    const stats = getCharacterStats();
    const enemy = gameState.combatState.enemies[targetIndex];
    
    if (!enemy || enemy.hp <= 0) {
        addDialog('system', '⚠️', '目标不存在或已死亡！');
        return false;
    }
    
    // 计算伤害
    const baseDamage = calculateDamage(stats.attack, enemy.defense);
    const isCrit = Math.random() < stats.critRate;
    const finalDamage = isCrit ? baseDamage * stats.critDamage : baseDamage;
    
    // 应用伤害
    enemy.hp -= Math.floor(finalDamage);
    
    // 叙事
    const critText = ' ⚡暴击！' if isCrit else '';
    addDialog('combat', '⚔️', f'你攻击{enemy.name}！{critText}造成{finalDamage:.1f}点伤害');
    
    // 检查敌人是否死亡
    if (enemy.hp <= 0) {
        addDialog('combat', '💀', f'{enemy.name}被你击败！');
        gameState.combatState.defeatedCount++;
    }
    
    updateCombatUI();
    return checkCombatEnd();
}

/**
 * 敌人回合
 */
function enemyTurn() {
    if (!gameState.combatState.active) return false;
    
    const enemy = gameState.combatState.currentEnemy;
    const stats = getCharacterStats();
    
    if (!enemy || enemy.hp <= 0) return true;
    
    // 敌人攻击
    const baseDamage = calculateDamage(enemy.attack, stats.defense);
    let finalDamage = baseDamage;
    
    // 防御姿态减伤
    if (gameState.combatState.defending) {
        finalDamage *= 0.5;
        addDialog('combat', '🛡️', f'防御姿态生效！伤害减半至{finalDamage:.1f}');
    }
    
    // 应用伤害
    gameState.character.hp -= Math.floor(finalDamage);
    
    // 叙事
    addDialog('combat', '💢', f'{enemy.name}攻击你！造成{finalDamage:.1f}点伤害');
    
    // 检查玩家是否死亡
    if (gameState.character.hp <= 0) {
        addDialog('combat', '💀', '你被击败了！');
        gameState.combatState.playerDefeated = true;
    }
    
    updateCombatUI();
    return checkCombatEnd();
}

/**
 * 检查战斗是否结束
 */
function checkCombatEnd() {
    if (gameState.combatState.playerDefeated) {
        // 玩家失败
        gameState.combatState.active = false;
        addDialog('combat', '☠️', '战斗失败...混沌值+10');
        gameState.character.chaos = Math.min(100, gameState.character.chaos + 10);
        showCombatResult({ victory: false, damage: 0 });
        return false;
    }
    
    // 检查是否所有敌人死亡
    const aliveEnemies = gameState.combatState.enemies.filter(e => e.hp > 0);
    if (aliveEnemies.length === 0) {
        // 胜利
        gameState.combatState.active = false;
        const rewards = calculateRewards();
        addDialog('combat', '🏆', '战斗胜利！');
        addDialog('combat', '📦', f'获得：{rewards.materials}物资，+{rewards.faith}信仰');
        showCombatResult({ victory: true, ...rewards });
        return true;
    }
    
    return true; // 继续战斗
}

/**
 * 计算战斗奖励
 */
function calculateRewards() {
    const enemy = gameState.combatState.currentEnemy;
    const baseMaterials = enemy?.materials || 20;
    const baseFaith = enemy?.faith || 5;
    
    return {
        materials: Math.floor(baseMaterials * (1 + Math.random() * 0.5)),
        faith: Math.floor(baseFaith * (1 + Math.random() * 0.5))
    };
}

/**
 * 更新战斗UI
 */
function updateCombatUI() {
    const combatPanel = document.getElementById('combatPanel');
    if (!combatPanel) return;
    
    // 更新玩家血量
    const playerHpEl = combatPanel.querySelector('.player-hp');
    if (playerHpEl) {
        const maxHp = gameState.character.maxHp || 100;
        playerHpEl.innerHTML = f'❤️ 生命: {gameState.character.hp}/{maxHp}';
    }
    
    // 更新敌人血量
    const enemyList = combatPanel.querySelector('.enemy-list');
    if (enemyList) {
        const enemies = gameState.combatState.enemies || [];
        enemyList.innerHTML = enemies.map((e, i) => `
            <div class="enemy-item ${e.hp <= 0 ? 'defeated' : ''}">
                <span>${e.name}</span>
                <span class="enemy-hp">${e.hp}/{e.maxHp}</span>
                ${e.hp > 0 ? `<button onclick="playerAttack(${i})">攻击</button>` : '<span>已死亡</span>'}
            </div>
        `).join('');
    }
}

'''
    
    # 在导出之前添加
    export_marker = "// 初始化战斗状态"
    if export_marker in content:
        content = content.replace(export_marker, missing_functions + "\n" + export_marker)
        filepath.write_text(content)
        print("✅ combatSystem.js - 已添加缺失函数")
        return True
    else:
        print("❌ combatSystem.js - 未找到插入点")
        return False

# 2. 修复 chaosSystem.js - 添加缺失函数别名
def fix_chaos_system():
    filepath = GAME_DIR / "js" / "chaosSystem.js"
    content = filepath.read_text()
    
    # 添加缺失函数的别名
    missing_aliases = '''
// ============================================
// 缺失函数别名 - 2026-02-02
// ============================================

/**
 * 更新混沌值（别名）
 */
function updateChaos(amount) {
    if (amount > 0) {
        chaosSystem.addChaos(amount);
    } else {
        chaosSystem.purify(-amount);
    }
    return chaosSystem.chaosValue;
}

/**
 * 应用混沌效果
 */
function applyChaosEffect(effectType) {
    const effects = {
        '幻觉': () => {
            const hallucination = chaosSystem.generateHallucination();
            addDialog('npc', '👁️', hallucination);
        },
        '属性下降': () => {
            addDialog('system', '⚠️', '混沌侵蚀！攻击和防御暂时下降');
            gameState.character.attack = (gameState.character.attack || 10) - 3;
        },
        '信仰动摇': () => {
            addDialog('npc', '💀', '你的信仰正在动摇...');
            gameState.character.faith = Math.max(0, gameState.character.faith - 5);
        }
    };
    
    if (effects[effectType]) {
        effects[effectType]();
        return true;
    }
    return false;
}

/**
 * 检查混沌状态
 */
function checkChaosState() {
    const phase = chaosSystem.checkPhase();
    const penalties = chaosSystem.getPenalties();
    const phaseInfo = chaosSystem.getPhaseInfo();
    
    return {
        phase: phase,
        value: chaosSystem.chaosValue,
        phaseInfo: phaseInfo,
        penalties: penalties,
        warnings: chaosSystem.generateHallucination()
    };
}

'''
    
    # 在创建实例之前添加
    export_marker = "// 创建实例并导出"
    if export_marker in content:
        content = content.replace(export_marker, missing_aliases + "\n" + export_marker)
        filepath.write_text(content)
        print("✅ chaosSystem.js - 已添加缺失函数")
        return True
    else:
        print("❌ chaosSystem.js - 未找到插入点")
        return False

# 3. 修复 aiSystem.js - 添加缺失函数
def fix_ai_system():
    filepath = GAME_DIR / "js" / "aiSystem.js"
    content = filepath.read_text()
    
    # 添加缺失函数
    missing_functions = '''
// ============================================
// 缺失函数实现 - 2026-02-02
// ============================================

/**
 * 获取剧情响应
 */
function getStoryResponse(storyEvent, context = {}) {
    const eventDialogues = PRESETS.events[storyEvent];
    if (eventDialogues) {
        const options = eventDialogues[context.subtype] || eventDialogues;
        return Array.isArray(options) ? options[Math.floor(Math.random() * options.length)] : options;
    }
    return getPreset('default_story');
}

/**
 * 生成响应（AI风格包装）
 */
async function generateResponse(input, context = {}) {
    // 由于是预设系统，使用预设对话
    // 未来可以接入真实AI API
    const keywords = extractKeywords(input);
    const response = getNPCDialogue(context.npcId || 'generic', context.trustLevel || 5);
    return response;
}

/**
 * 提取关键词
 */
function extractKeywords(text) {
    const keywords = [];
    const keywordPatterns = ['战斗', '混沌', '追随者', '建筑', '任务', '调查'];
    
    for (const pattern of keywordPatterns) {
        if (text.includes(pattern)) {
            keywords.push(pattern);
        }
    }
    return keywords;
}

/**
 * 更新剧情进度
 */
function updateStoryProgress(event, value = 1) {
    if (!storyProgress[event]) {
        storyProgress[event] = 0;
    }
    storyProgress[event] += value;
    
    // 检查剧情里程碑
    checkStoryProgress();
    
    return storyProgress[event];
}

'''
    
    # 在导出之前添加
    export_marker = "// 导出进度系统"
    if export_marker in content:
        content = content.replace(export_marker, missing_functions + "\n" + export_marker)
        filepath.write_text(content)
        print("✅ aiSystem.js - 已添加缺失函数")
        return True
    else:
        print("❌ aiSystem.js - 未找到插入点")
        return False

# 4. 修复 presetDialogues.js - 添加缺失函数
def fix_preset_system():
    filepath = GAME_DIR / "js" / "presetDialogues.js"
    content = filepath.read_text()
    
    # 检查是否已有这些函数
    if 'getRandomEvent' in content and 'getChaosHallucination' in content and 'getTrialDialogue' in content:
        print("✅ presetDialogues.js - 函数已存在")
        return True
    
    # 添加缺失函数
    missing_functions = '''
// ============================================
// 缺失函数实现 - 2026-02-02
// ============================================

/**
 * 获取随机事件
 */
function getRandomEvent(excludeTypes = []) {
    const eventTypes = Object.keys(RANDOM_EVENTS).filter(t => !excludeTypes.includes(t));
    const type = eventTypes[Math.floor(Math.random() * eventTypes.length)];
    const events = RANDOM_EVENTS[type];
    return {
        type: type,
        ...events[Math.floor(Math.random() * events.length)]
    };
}

/**
 * 获取混沌幻觉
 */
function getChaosHallucination(chaosValue) {
    if (chaosValue < 20) {
        return '一切正常。';
    } else if (chaosValue < 40) {
        const light = CHAOS_HALLUCINATIONS.light || [];
        return light[Math.floor(Math.random() * light.length)];
    } else if (chaosValue < 60) {
        const corrupt = CHAOS_HALLUCINATIONS.corrupt || [];
        return corrupt[Math.floor(Math.random() * corrupt.length)];
    } else if (chaosValue < 80) {
        const heavy = CHAOS_HALLUCINATIONS.heavy || [];
        return heavy[Math.floor(Math.random() * heavy.length)];
    } else {
        return '你的视野被混沌吞噬...';
    }
}

/**
 * 获取审判对话
 */
function getTrialDialogue(trialType, outcome = 'pending') {
    if (outcome !== 'pending') {
        return TRIAL_DIALOGUES[outcome] || '审判结束。';
    }
    return TRIAL_DIALOGUES[trialType] || TRIAL_DIALOGUES.chaos || '接受审判吧，堕落者！';
}

'''
    
    # 在文件末尾添加
    content += "\n" + missing_functions
    filepath.write_text(content)
    print("✅ presetDialogues.js - 已添加缺失函数")
    return True

# 5. 修复 buildingSystem.js - 添加 collectResources
def fix_building_system():
    filepath = GAME_DIR / "js" / "buildingSystem.js"
    content = filepath.read_text()
    
    if 'collectResources' in content:
        print("✅ buildingSystem.js - collectResources已存在")
        return True
    
    # 添加函数
    missing_function = '''
// ============================================
// 缺失函数 - 2026-02-02
// ============================================

/**
 * 收集建筑产出
 */
function collectResources() {
    if (!gameState.buildings || Object.keys(gameState.buildings).length === 0) {
        addDialog('system', '⚠️', '还没有建造任何建筑！');
        return false;
    }
    
    let collected = {
        materials: 0,
        faith: 0,
        intelligence: 0,
        followers: 0
    };
    
    for (const [buildingId, level] of Object.entries(gameState.buildings)) {
        if (level <= 0) continue;
        
        const building = BUILDINGS[buildingId];
        if (building && building.production) {
            const amount = (building.production[level - 1] || 0);
            const type = building.type || 'materials';
            
            collected[type] = (collected[type] || 0) + amount;
            
            if (amount > 0) {
                resourceSystem.modify(type, amount);
            }
        }
    }
    
    // 显示收集结果
    const results = Object.entries(collected)
        .filter(([_, v]) => v > 0)
        .map(([k, v]) => `${v}${getResourceIcon(k)}`)
        .join(' ');
    
    if (results) {
        addDialog('system', '📦', `建筑产出：${results}`);
    } else {
        addDialog('system', '📦', '本周期的建筑产出较少。');
    }
    
    return collected;
}

/**
 * 获取资源图标
 */
function getResourceIcon(type) {
    const icons = {
        'materials': '📦',
        'faith': '✨',
        'intelligence': '🔍',
        'followers': '👥'
    };
    return icons[type] || '';
}

'''
    
    # 在导出之前添加
    export_marker = "// 导出"
    if export_marker in content:
        content = content.replace(export_marker, missing_function + "\n" + export_marker)
        filepath.write_text(content)
        print("✅ buildingSystem.js - 已添加collectResources")
        return True
    else:
        print("❌ buildingSystem.js - 未找到插入点")
        return False

def main():
    print("=" * 60)
    print("🔧 修复系统完整性")
    print("=" * 60)
    print(f"时间: {datetime.now().strftime('%Y-%m-%d %H:%M')}")
    print()
    
    results = []
    results.append(("combatSystem.js", fix_combat_system()))
    results.append(("chaosSystem.js", fix_chaos_system()))
    results.append(("aiSystem.js", fix_ai_system()))
    results.append(("presetDialogues.js", fix_preset_system()))
    results.append(("buildingSystem.js", fix_building_system()))
    
    print()
    print("=" * 60)
    print("📊 修复结果")
    print("=" * 60)
    
    success = sum(1 for _, r in results if r)
    for name, result in results:
        status = "✅" if result else "❌"
        print(f"{status} {name}")
    
    print(f"\n总计: {success}/{len(results)} 个系统已修复")
    
    return 0 if success == len(results) else 1

if __name__ == "__main__":
    exit(main())
