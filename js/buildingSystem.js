/**
 * 战锤40K - 建筑系统
 * 建筑建造、资源产出、升级系统
 */

// ============================================
// 建筑定义
// ============================================

const BUILDINGS = {
    // 基础建筑
    barracks: {
        name: '兵营',
        icon: '🏛️',
        description: '训练士兵的场所',
        cost: { materials: 50 },
        maxLevel: 5,
        effects: [
            { level: 1, text: '每回合+5物资', effect: { materials: 5 } },
            { level: 2, text: '每回合+8物资', effect: { materials: 8 } },
            { level: 3, text: '每回合+12物资', effect: { materials: 12 } },
            { level: 4, text: '每回合+18物资', effect: { materials: 18 } },
            { level: 5, text: '每回合+25物资', effect: { materials: 25 } }
        ]
    },

    armory: {
        name: '军械库',
        icon: '⚔️',
        description: '存放武器装备',
        cost: { materials: 40 },
        maxLevel: 5,
        effects: [
            { level: 1, text: '战斗奖励+10%', effect: { combatBonus: 0.1 } },
            { level: 2, text: '战斗奖励+15%', effect: { combatBonus: 0.15 } },
            { level: 3, text: '战斗奖励+20%', effect: { combatBonus: 0.2 } },
            { level: 4, text: '战斗奖励+30%', effect: { combatBonus: 0.3 } },
            { level: 5, text: '战斗奖励+50%', effect: { combatBonus: 0.5 } }
        ]
    },

    shrine: {
        name: '圣殿',
        icon: '✨',
        description: '祈祷和净化混沌的场所',
        cost: { materials: 60 },
        maxLevel: 5,
        effects: [
            { level: 1, text: '每回合-1混沌值', effect: { chaosReduction: 1 } },
            { level: 2, text: '每回合-2混沌值', effect: { chaosReduction: 2 } },
            { level: 3, text: '每回合-3混沌值', effect: { chaosReduction: 3 } },
            { level: 4, text: '每回合-5混沌值', effect: { chaosReduction: 5 } },
            { level: 5, text: '每回合-8混沌值', effect: { chaosReduction: 8 } }
        ]
    },

    intelligence: {
        name: '情报局',
        icon: '🕵️',
        description: '收集敌人情报',
        cost: { materials: 45 },
        maxLevel: 5,
        effects: [
            { level: 1, text: '每回合+1情报', effect: { intelligence: 1 } },
            { level: 2, text: '每回合+2情报', effect: { intelligence: 2 } },
            { level: 3, text: '每回合+3情报', effect: { intelligence: 3 } },
            { level: 4, text: '每回合+5情报', effect: { intelligence: 5 } },
            { level: 5, text: '每回合+8情报', effect: { intelligence: 8 } }
        ]
    },

    hospital: {
        name: '医院',
        icon: '🏥',
        description: '治疗受伤的士兵',
        cost: { materials: 55 },
        maxLevel: 5,
        effects: [
            { level: 1, text: '每回合+5 HP上限', effect: { hpBonus: 5 } },
            { level: 2, text: '每回合+10 HP上限', effect: { hpBonus: 10 } },
            { level: 3, text: '每回合+15 HP上限', effect: { hpBonus: 15 } },
            { level: 4, text: '每回合+25 HP上限', effect: { hpBonus: 25 } },
            { level: 5, text: '每回合+40 HP上限', effect: { hpBonus: 40 } }
        ]
    },

    wall: {
        name: '城墙',
        icon: '🏰',
        description: '防御敌人进攻',
        cost: { materials: 80 },
        maxLevel: 5,
        effects: [
            { level: 1, text: '防御+5', effect: { defense: 5 } },
            { level: 2, text: '防御+10', effect: { defense: 10 } },
            { level: 3, text: '防御+15', effect: { defense: 15 } },
            { level: 4, text: '防御+25', effect: { defense: 25 } },
            { level: 5, text: '防御+40', effect: { defense: 40 } }
        ]
    }
};

// ============================================
// 建筑状态管理
// ============================================

/**
 * 初始化建筑系统
 */
function initBuildings() {
    if (!gameState.buildings) {
        gameState.buildings = {};
    }
}

/**
 * 建造建筑
 */
function constructBuilding(buildingId) {
    const building = BUILDINGS[buildingId];
    if (!building) {
        addDialog('system', '⚠️', '不存在的建筑类型');
        return false;
    }

    // 检查是否已存在
    if (gameState.buildings[buildingId]) {
        addDialog('system', '⚠️', `${building.name}已存在，请升级`);
        return false;
    }

    // 检查资源
    const cost = building.cost.materials || 0;
    if (gameState.resources.materials < cost) {
        addDialog('system', '⚠️', `物资不足！需要${cost}物资`);
        return false;
    }

    // 扣除资源
    gameState.resources.materials -= cost;

    // 创建建筑
    gameState.buildings[buildingId] = {
        level: 1,
        constructedAt: gameState.turn
    };

    addDialog('system', '🏗️', `建造完成：${building.icon} ${building.name}`);
    addDialog('system', '✨', building.effects[0].text);

    updateUI();
    return true;
}

/**
 * 升级建筑
 */
function upgradeBuilding(buildingId) {
    const building = BUILDINGS[buildingId];
    if (!building) {
        addDialog('system', '⚠️', '不存在的建筑类型');
        return false;
    }

    // 检查是否存在
    if (!gameState.buildings[buildingId]) {
        addDialog('system', '⚠️', `${building.name}未建造`);
        return false;
    }

    const currentLevel = gameState.buildings[buildingId].level;
    if (currentLevel >= building.maxLevel) {
        addDialog('system', '⚠️', `${building.name}已满级`);
        return false;
    }

    // 计算升级费用（每级+50%）
    const baseCost = building.cost.materials || 50;
    const upgradeCost = Math.floor(baseCost * Math.pow(1.5, currentLevel));

    if (gameState.resources.materials < upgradeCost) {
        addDialog('system', '⚠️', `升级物资不足！需要${upgradeCost}物资`);
        return false;
    }

    // 扣除资源并升级
    gameState.resources.materials -= upgradeCost;
    gameState.buildings[buildingId].level++;

    const newLevel = gameState.buildings[buildingId].level;
    const effect = building.effects[newLevel - 1];

    addDialog('system', '⬆️', `${building.icon} ${building.name} 升至 ${newLevel}级`);
    addDialog('system', '✨', effect.text);

    updateUI();
    return true;
}

/**
 * 获取建筑产出
 */
function getBuildingProduction() {
    const production = {
        materials: 0,
        intelligence: 0,
        chaosReduction: 0,
        hpBonus: 0,
        defense: 0,
        combatBonus: 0
    };

    for (const buildingId in gameState.buildings) {
        const state = gameState.buildings[buildingId];
        const building = BUILDINGS[buildingId];
        if (!building) continue;

        const effect = building.effects[state.level - 1];
        if (!effect) continue;

        const e = effect.effect;
        if (e.materials) production.materials += e.materials;
        if (e.intelligence) production.intelligence += e.intelligence;
        if (e.chaosReduction) production.chaosReduction += e.chaosReduction;
        if (e.hpBonus) production.hpBonus += e.hpBonus;
        if (e.defense) production.defense += e.defense;
        if (e.combatBonus) production.combatBonus += e.combatBonus;
    }

    return production;
}

/**
 * 应用建筑产出
 */
function applyBuildingProduction() {
    const production = getBuildingProduction();

    if (production.materials > 0) {
        gameState.resources.materials += production.materials;
    }
    if (production.intelligence > 0) {
        gameState.resources.intelligence += production.intelligence;
    }
    if (production.chaosReduction > 0) {
        gameState.character.chaos = Math.max(0, gameState.character.chaos - production.chaosReduction);
    }
    if (production.hpBonus > 0) {
        gameState.character.maxHp += production.hpBonus;
    }
}

// ============================================
// 建筑UI系统
// ============================================

/**
 * 显示建筑面板
 */
function showBuildingPanel() {
    // 移除已存在的面板
    const existing = document.getElementById('buildingPanel');
    if (existing) existing.remove();

    const panel = document.createElement('div');
    panel.id = 'buildingPanel';
    panel.className = 'building-overlay';

    let buildingsHTML = '';
    for (const buildingId in BUILDINGS) {
        const building = BUILDINGS[buildingId];
        const state = gameState.buildings[buildingId];
        const canBuild = !state && gameState.resources.materials >= (building.cost.materials || 0);
        const canUpgrade = state && state.level < building.maxLevel &&
            gameState.resources.materials >= Math.floor((building.cost.materials || 50) * Math.pow(1.5, state.level));

        const currentEffect = state ? building.effects[state.level - 1] : null;
        const nextEffect = state && state.level < building.maxLevel ? building.effects[state.level] : null;

        buildingsHTML += `
            <div class="building-card ${state ? 'built' : ''} ${canBuild ? 'can-build' : ''}">
                <div class="building-icon">${building.icon}</div>
                <div class="building-info">
                    <h4>${building.name}</h4>
                    <p class="building-desc">${building.description}</p>
                    ${state ? `
                        <p class="building-level">等级: ${state.level}/${building.maxLevel}</p>
                        <p class="building-effect">${currentEffect?.text || ''}</p>
                        ${nextEffect ? `<p class="building-next">下一级: ${nextEffect.text}</p>` : ''}
                    ` : `
                        <p class="building-cost">建造: ${building.cost.materials} 物资</p>
                    `}
                </div>
                <div class="building-actions">
                    ${state ? `
                        <button class="upgrade-btn" ${canUpgrade ? '' : 'disabled'}
                            onclick="upgradeBuilding('${buildingId}')">
                            ${canUpgrade ? '升级' : '材料不足'}
                        </button>
                    ` : `
                        <button class="build-btn" ${canBuild ? '' : 'disabled'}
                            onclick="constructBuilding('${buildingId}')">
                            ${canBuild ? '建造' : '材料不足'}
                        </button>
                    `}
                </div>
            </div>
        `;
    }

    // 建筑产出统计
    const production = getBuildingProduction();
    let productionHTML = '';
    if (production.materials > 0) productionHTML += `<span>📦 +${production.materials}/回合</span> `;
    if (production.intelligence > 0) productionHTML += `<span>🕵️ +${production.intelligence}/回合</span> `;
    if (production.chaosReduction > 0) productionHTML += `<span>✨ -${production.chaosReduction}/回合</span> `;
    if (production.defense > 0) productionHTML += `<span>🛡️ +${production.defense}</span> `;

    panel.innerHTML = `
        <div class="building-content">
            <div class="building-header">
                <h2>🏗️ 建筑系统</h2>
                <p>建造建筑获得持续产出</p>
                ${productionHTML ? `<div class="production-summary">${productionHTML}</div>` : ''}
            </div>
            <div class="building-list">
                ${buildingsHTML}
            </div>
            <button class="close-building" onclick="closeBuildingPanel()">×</button>
        </div>
    `;

    // 添加样式
    const style = document.createElement('style');
    style.textContent = `
        .building-overlay {
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

        .building-content {
            background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
            border: 2px solid #4ade80;
            border-radius: 16px;
            padding: 30px;
            max-width: 600px;
            width: 90%;
            max-height: 80vh;
            overflow-y: auto;
            position: relative;
        }

        .building-header {
            text-align: center;
            margin-bottom: 20px;
        }

        .building-header h2 {
            color: #4ade80;
            margin: 0 0 10px 0;
        }

        .production-summary {
            background: rgba(74, 222, 128, 0.1);
            padding: 10px;
            border-radius: 8px;
            margin-top: 10px;
            display: flex;
            justify-content: center;
            gap: 15px;
            flex-wrap: wrap;
        }

        .building-list {
            display: flex;
            flex-direction: column;
            gap: 15px;
        }

        .building-card {
            background: rgba(0, 0, 0, 0.3);
            border: 2px solid #333;
            border-radius: 12px;
            padding: 15px;
            display: flex;
            align-items: center;
            gap: 15px;
            transition: all 0.3s ease;
        }

        .building-card.built {
            border-color: #4ade80;
        }

        .building-card.can-build:hover {
            border-color: #4ade80;
            transform: translateX(5px);
        }

        .building-icon {
            font-size: 40px;
            width: 60px;
            height: 60px;
            background: rgba(74, 222, 128, 0.1);
            border-radius: 10px;
            display: flex;
            align-items: center;
            justify-content: center;
        }

        .building-info {
            flex: 1;
        }

        .building-info h4 {
            color: #fff;
            margin: 0 0 5px 0;
        }

        .building-desc {
            color: #a0a0a0;
            font-size: 12px;
            margin: 0 0 5px 0;
        }

        .building-level {
            color: #4ade80;
            font-size: 12px;
            margin: 0;
        }

        .building-effect {
            color: #fbbf24;
            font-size: 12px;
            margin: 2px 0;
        }

        .building-next {
            color: #a78bfa;
            font-size: 11px;
            margin: 2px 0;
        }

        .building-cost {
            color: #f87171;
            font-size: 12px;
            margin: 0;
        }

        .build-btn, .upgrade-btn {
            padding: 10px 20px;
            border: none;
            border-radius: 8px;
            cursor: pointer;
            font-weight: bold;
            transition: all 0.3s ease;
        }

        .build-btn {
            background: linear-gradient(135deg, #4ade80 0%, #22c55e 100%);
            color: #000;
        }

        .upgrade-btn {
            background: linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%);
            color: #000;
        }

        .build-btn:disabled, .upgrade-btn:disabled {
            background: #333;
            color: #666;
            cursor: not-allowed;
        }

        .close-building {
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

/**
 * 关闭建筑面板
 */
function closeBuildingPanel() {
    const panel = document.getElementById('buildingPanel');
    if (panel) {
        panel.remove();
    }
}

// ============================================
// 回合结束时的建筑产出
// ============================================

/**
 * 执行回合结束的建筑产出
 */
function processBuildingProduction() {
    initBuildings();

    const production = getBuildingProduction();
    if (production.materials === 0 &&
        production.intelligence === 0 &&
        production.chaosReduction === 0 &&
        production.hpBonus === 0) {
        return; // 没有建筑，不显示
    }

    let output = [];
    if (production.materials > 0) {
        gameState.resources.materials += production.materials;
        output.push(`📦 +${production.materials}物资`);
    }
    if (production.intelligence > 0) {
        gameState.resources.intelligence += production.intelligence;
        output.push(`🕵️ +${production.intelligence}情报`);
    }
    if (production.chaosReduction > 0) {
        gameState.character.chaos = Math.max(0, gameState.character.chaos - production.chaosReduction);
        output.push(`✨ -${production.chaosReduction}混沌值`);
    }
    if (production.hpBonus > 0) {
        gameState.character.maxHp += production.hpBonus;
    }

    if (output.length > 0) {
        addDialog('system', '🏗️', '建筑产出: ' + output.join(' | '));
    }
}

// ============================================
// 导出函数到全局
// ============================================

window.BUILDINGS = BUILDINGS;
window.initBuildings = initBuildings;
window.constructBuilding = constructBuilding;
window.upgradeBuilding = upgradeBuilding;
window.getBuildingProduction = getBuildingProduction;
window.applyBuildingProduction = applyBuildingProduction;
window.showBuildingPanel = showBuildingPanel;
window.closeBuildingPanel = closeBuildingPanel;
window.processBuildingProduction = processBuildingProduction;

// 初始化建筑系统
initBuildings();
