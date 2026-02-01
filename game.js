// 战锤40K游戏 - 纯静态版本
// 所有逻辑都在前端运行，不需要后端服务器

let gameState = {
    turn: 1,
    actionsUsed: 0,
    maxActions: 3,
    character: {
        name: '钛-7',
        class: '极限战士',
        level: 1,
        hp: 100,
        maxHp: 100,
        chaos: 0,
        reputation: 0
    },
    resources: {
        materials: 20,
        soulPoints: 0
    },
    base: {
        level: 1,
        buildings: []
    },
    npcs: {
        tam: { name: '塔姆', suspicion: 3, trust: 5, joined: false },
        carl: { name: '卡尔', suspicion: 5, trust: 3, joined: false },
        yuri: { name: '尤里', suspicion: 4, trust: 2, joined: false }
    },
    selectedCategory: null
};

function saveGame() {
    localStorage.setItem('warhammer_game_state', JSON.stringify(gameState));
    addDialog('system', '💾', '游戏已保存！');
}

function loadGame() {
    const saved = localStorage.getItem('warhammer_game_state');
    if (saved) {
        try {
            const parsed = JSON.parse(saved);
            gameState = { ...gameState, ...parsed };
            updateUI();
            addDialog('system', '📂', '存档加载成功！');
        } catch (e) {
            addDialog('system', '⚠️', '存档已损坏，无法加载。');
        }
    } else {
        addDialog('system', '⚠️', '没有找到存档。');
    }
}

function resetGame() {
    if (confirm('确定要重置游戏吗？所有进度将丢失！')) {
        localStorage.removeItem('warhammer_game_state');
        location.reload();
    }
}

document.addEventListener('DOMContentLoaded', () => {
    console.log('战锤40K已启动');
    loadGame();
    addDialog('system', '🌌', '欢迎回来，战士！你是极限战士钛-7，在荷鲁斯之乱的动荡时期醒来。');
});

function showCategory(category) {
    document.querySelectorAll('.action-list').forEach(list => list.style.display = 'none');
    document.querySelectorAll('.action-category').forEach(btn => btn.classList.remove('active'));
    const actionList = document.getElementById(category + '-actions');
    if (actionList) actionList.style.display = 'grid';
    const categoryBtn = document.querySelector('.action-category[onclick="showCategory(\'' + category + '\')"]');
    if (categoryBtn) categoryBtn.classList.add('active');
    gameState.selectedCategory = category;
}

function performAction(category, action) {
    if (action !== 'endTurn' && gameState.actionsUsed >= gameState.maxActions) {
        addDialog('system', '⚠️', '本回合行动次数已用完！');
        return;
    }
    const actionName = getActionName(category, action);
    addDialog('player', '🦾', '执行行动：' + actionName);
    gameState.actionsUsed++;
    setTimeout(() => {
        let result = null;
        if (category === 'combat') result = handleCombatAction(action);
        else if (category === 'building') result = handleBuildingAction(action);
        else if (category === 'investigation') result = handleInvestigationAction(action);
        else if (category === 'exploration') result = handleExplorationAction(action);
        else if (category === 'system') result = handleSystemAction(action);
        if (result) showActionResult(result);
        updateUI();
        saveGame();
    }, 500);
}

function showActionResult(result) {
    setTimeout(() => {
        if (result.type === 'combat') {
            addDialog('npc', '⚔️', result.narration);
            addDialog('system', '📊', '战斗结果：获得物资+' + result.materials + '，声望+' + result.reputation + '，混沌+' + result.chaosIncrease);
        } else if (result.type === 'building') {
            if (!result.success) addDialog('system', '⚠️', result.message);
            else { addDialog('system', '🏗️', result.message); addDialog('system', '📊', '物资' + result.materialsChange); }
        } else if (result.type === 'investigation') {
            addDialog('npc', '💬', result.clue);
            addDialog('system', '🔍', '对' + result.npc + '的可疑度：' + result.suspicion + '/10');
        } else if (result.type === 'exploration') {
            addDialog('npc', '🗺️', result.description);
            let txt = '探索结果：发现' + result.found + '，物资+' + result.materials;
            if (result.soulPoint) txt += '，灵魂点+1';
            if (result.chaos) txt += '，混沌+' + result.chaos;
            addDialog('system', '📊', txt);
        } else if (result.type === 'system') {
            if (result.message) addDialog('system', '⚙️', result.message);
            if (result.fullStatus) showFullStatus();
        }
    }, 300);
}

function handleCombatAction(action) {
    const battles = {
        'attack_chaos': { materials: [10, 20, 30], reputation: [5, 10, 15], chaosRisk: 10, narration: '你遇到了混沌入侵者！战斗结束，你获得了物资和声望。' },
        'defend_base': { materials: [5, 10, 15], reputation: [10, 15, 20], chaosRisk: 5, narration: '你成功防守了要塞入口！极限战士战团对你的表现赞不绝口。' }
    };
    const battle = battles[action];
    const materials = battle.materials[Math.floor(Math.random() * battle.materials.length)];
    const reputation = battle.reputation[Math.floor(Math.random() * battle.reputation.length)];
    gameState.resources.materials += materials;
    gameState.character.reputation += reputation;
    const chaosIncrease = Math.floor(Math.random() * battle.chaosRisk);
    gameState.character.chaos = Math.min(100, gameState.character.chaos + chaosIncrease);
    return { type: 'combat', materials: materials, reputation: reputation, chaosIncrease: chaosIncrease, narration: battle.narration };
}

function handleBuildingAction(action) {
    const costs = { 'upgrade_base': { materials: 15 }, 'build_training': { materials: 10 }, 'build_workshop': { materials: 10 }, 'build_shrine': { materials: 15 } };
    const cost = costs[action];
    if (gameState.resources.materials < cost.materials) {
        return { type: 'building', success: false, message: '物资不足！需要' + cost.materials + '物资，当前只有' + gameState.resources.materials + '。' };
    }
    gameState.resources.materials -= cost.materials;
    let message = '';
    if (action === 'upgrade_base') {
        gameState.base.level = Math.min(5, gameState.base.level + 1);
        message = '巢穴升级成功！现在等级：Lv.' + gameState.base.level + '，每回合产出：+' + (gameState.base.level * 5) + ' 物资';
    } else {
        let building = null;
        if (action === 'build_training') { if (gameState.base.buildings.some(b => b.type === 'training')) return { type: 'building', success: false, message: '训练场已经存在！' }; building = { type: 'training', name: '训练场' }; message = '训练场建造完成！每回合可获得技能加成。'; }
        else if (action === 'build_workshop') { if (gameState.base.buildings.some(b => b.type === 'workshop')) return { type: 'building', success: false, message: '工坊已经存在！' }; building = { type: 'workshop', name: '工坊' }; message = '工坊建造完成！每回合可制造道具。'; }
        else if (action === 'build_shrine') { if (gameState.base.buildings.some(b => b.type === 'shrine')) return { type: 'building', success: false, message: '灵魂圣殿已经存在！' }; building = { type: 'shrine', name: '灵魂圣殿' }; message = '灵魂圣殿建造完成！每回合可获得灵魂点。'; }
        if (building) gameState.base.buildings.push(building);
    }
    return { type: 'building', success: true, message: message, materialsChange: '-' + cost.materials };
}

function handleInvestigationAction(action) {
    const npcKey = action.replace('talk_', '');
    const npc = gameState.npcs[npcKey];
    if (!npc) return { type: 'investigation', npc: '未知', clue: '错误：找不到该NPC', suspicion: 0, trust: 0 };
    const clues = ['你与' + npc.name + '交谈。他看起来有些紧张，但话语中似乎没有破绽。', npc.name + '的眼神闪烁了一下，但你无法确定他在隐瞒什么。', '你注意到' + npc.name + '的手指微微颤抖...他在害怕什么？', npc.name + '主动提及了一些无关的话题，似乎在转移话题。', '你问起' + npc.name + '昨晚的行踪，他犹豫了一下，然后给出了一个模糊的回答。'];
    const randomClue = clues[Math.floor(Math.random() * clues.length)];
    if (Math.random() > 0.5) npc.suspicion = Math.min(10, npc.suspicion + Math.floor(Math.random() * 2 + 1));
    else npc.trust = Math.min(10, npc.trust + Math.floor(Math.random() * 2));
    if (npc.trust >= 8) npc.suspicion = Math.max(1, npc.suspicion - 1);
    return { type: 'investigation', npc: npc.name, clue: randomClue, suspicion: npc.suspicion, trust: npc.trust };
}

function handleExplorationAction(action) {
    const results = [{ found: '古代STC碎片', materials: 15, description: '你在废墟中发现了一块古代STC碎片。', soulPoint: false, chaos: 0 }, { found: '幸存者', materials: 5, description: '你发现了一位幸存的帝国平民，他愿意加入你的巢穴。', soulPoint: true, chaos: 0 }, { found: '混沌印记', materials: 0, description: '你在探索过程中接触到了混沌力量的残留...', soulPoint: false, chaos: 10 }, { found: '稀有矿物', materials: 25, description: '你在北境荒野的深处发现了一处稀有矿物矿脉！', soulPoint: false, chaos: 0 }, { found: '废弃军械库', materials: 20, description: '你发现了一个废弃的军械库，里面还有不少武器弹药。', soulPoint: false, chaos: 0 }, { found: '神秘符文', materials: 0, description: '你墙壁上发现了神秘的符文，似乎是某种古老的封印。', soulPoint: true, chaos: 5 }];
    const result = results[Math.floor(Math.random() * results.length)];
    gameState.resources.materials += result.materials;
    if (result.soulPoint) gameState.resources.soulPoints += 1;
    gameState.character.chaos = Math.min(100, gameState.character.chaos + result.chaos);
    return { type: 'exploration', found: result.found, description: result.description, materials: result.materials, soulPoint: result.soulPoint, chaos: result.chaos };
}

function handleSystemAction(action) {
    if (action === 'save') { saveGame(); return { type: 'system', message: null }; }
    if (action === 'load') { loadGame(); return { type: 'system', message: null }; }
    if (action === 'status') return { type: 'system', fullStatus: true };
    if (action === 'endTurn') return handleEndTurn();
    if (action === 'reset') { resetGame(); return { type: 'system', message: null }; }
}

function handleEndTurn() {
    gameState.actionsUsed = 0;
    gameState.turn++;
    const baseOutput = gameState.base.level * 5;
    gameState.resources.materials += baseOutput;
    let buildingOutput = '';
    gameState.base.buildings.forEach(building => {
        if (building.type === 'training') buildingOutput = buildingOutput + '，训练场就绪';
        else if (building.type === 'workshop') { gameState.resources.materials += 5; buildingOutput = buildingOutput + '，工坊制造道具'; }
        else if (building.type === 'shrine') { gameState.resources.soulPoints += 1; buildingOutput = buildingOutput + '，灵魂点+1'; }
    });
    const randomEvent = Math.random();
    let eventMessage = '';
    if (randomEvent < 0.15) {
        const goodEvents = [{ text: '意外收获：路过商队送了你一些物资。', materials: 10 }, { text: '好消息：你的英勇事迹传开了，声望+5！', reputation: 5 }, { text: '发现：工坊里找到了隐藏的工具箱。', materials: 8 }];
        const event = goodEvents[Math.floor(Math.random() * goodEvents.length)];
        eventMessage = eventMessage + '。' + event.text;
        if (event.materials) gameState.resources.materials += event.materials;
        if (event.reputation) gameState.character.reputation += event.reputation;
    } else if (randomEvent < 0.25) {
        const badEvents = [{ text: '袭击：一小股混沌信徒袭击了你的巢穴！', chaos: 5 }, { text: '损失：一些物资在仓库中腐烂了。', materials: -5 }, { text: '监视：你感觉到有人在暗中监视你...', chaos: 0 }];
        const event = badEvents[Math.floor(Math.random() * badEvents.length)];
        eventMessage = eventMessage + '。' + event.text;
        if (event.chaos) gameState.character.chaos = Math.min(100, gameState.character.chaos + event.chaos);
        if (event.materials) gameState.resources.materials = Math.max(0, gameState.resources.materials + event.materials);
    }
    if (gameState.character.chaos > 0 && Math.random() < 0.1) { gameState.character.chaos = Math.max(0, gameState.character.chaos - 2); eventMessage = eventMessage + '。净化仪式生效：混沌值-2'; }
    let chaosWarning = '';
    if (gameState.character.chaos >= 50) chaosWarning = '。警告：你的混沌值已达到' + gameState.character.chaos + '！继续这样下去，你会堕落。';
    return { type: 'system', message: '回合 ' + gameState.turn + ' 开始！巢穴产出 +' + baseOutput + ' 物资' + buildingOutput + eventMessage + chaosWarning + '。物资：' + gameState.resources.materials + '，混沌值：' + gameState.character.chaos + '/100' };
}

function showFullStatus() {
    const npcStatus = Object.values(gameState.npcs).map(npc => npc.name + '：可疑度' + npc.suspicion + '/10，信任度' + npc.trust + '/10').join('\n');
    const buildings = gameState.base.buildings.length > 0 ? gameState.base.buildings.map(b => b.name).join(', ') : '无';
    const statusText = '角色状态\n名称：' + gameState.character.name + '\n职业：' + gameState.character.class + ' Lv.' + gameState.character.level + '\n生命值：' + gameState.character.hp + '/' + gameState.character.maxHp + '\n混沌值：' + gameState.character.chaos + '/100\n声望：' + gameState.character.reputation + '\n\n资源\n物资：' + gameState.resources.materials + '\n灵魂点：' + gameState.resources.soulPoints + '\n巢穴等级：' + gameState.base.level + '\n建筑：' + buildings + '\n\nNPC\n' + npcStatus + '\n\n回合信息\n当前回合：' + gameState.turn + '\n已用行动：' + gameState.actionsUsed + '/' + gameState.maxActions;
    addDialog('system', '📊', statusText);
}

function getActionName(category, action) {
    const names = { 'combat': { 'attack_chaos': '迎击混沌入侵者', 'defend_base': '防守要塞入口' }, 'building': { 'upgrade_base': '升级巢穴', 'build_training': '建造训练场', 'build_workshop': '建造工坊', 'build_shrine': '建造灵魂圣殿' }, 'investigation': { 'talk_tam': '与塔姆对话', 'talk_carl': '与卡尔对话', 'talk_yuri': '与尤里对话' }, 'exploration': { 'explore_wilderness': '探索北境荒野', 'searchruins': '搜索古代遗迹' }, 'system': { 'save': '存档', 'load': '读档', 'status': '查看状态', 'endTurn': '回合结束', 'reset': '重置游戏' } };
    return names[category] && names[category][action] ? names[category][action] : action;
}

function addDialog(type, avatar, text) {
    const dialogContent = document.getElementById('dialogContent');
    const messageDiv = document.createElement('div');
    messageDiv.className = 'dialog-message ' + type;
    messageDiv.innerHTML = '<span class="dialog-avatar">' + avatar + '</span><div class="dialog-text">' + text.replace(/\n/g, '<br>') + '</div>';
    dialogContent.appendChild(messageDiv);
    const dialogPanel = document.getElementById('dialogPanel');
    dialogPanel.querySelector('.dialog-content').scrollTop = dialogPanel.querySelector('.dialog-content').scrollHeight;
}

function updateUI() {
    document.getElementById('charName').textContent = gameState.character.name;
    document.getElementById('charClass').textContent = gameState.character.class + ' Lv.' + gameState.character.level;
    document.getElementById('hpValue').textContent = gameState.character.hp;
    document.getElementById('hpMax').textContent = gameState.character.maxHp;
    document.getElementById('chaosValue').textContent = gameState.character.chaos;
    document.getElementById('reputationValue').textContent = gameState.character.reputation;
    document.getElementById('materialValue').textContent = gameState.resources.materials;
    document.getElementById('soulValue').textContent = gameState.resources.soulPoints;
    document.getElementById('baseLevel').textContent = 'Lv.' + gameState.base.level;
    document.getElementById('turnNumber').textContent = gameState.turn;
    document.getElementById('actionsUsed').textContent = gameState.actionsUsed;
    const chaosFill = document.getElementById('chaosFill');
    chaosFill.style.width = gameState.character.chaos + '%';
    if (gameState.character.chaos >= 80) chaosFill.style.background = 'linear-gradient(90deg, #dc2626 0%, #ef4444 100%)';
    else if (gameState.character.chaos >= 50) chaosFill.style.background = 'linear-gradient(90deg, #d97706 0%, #f59e0b 100%)';
    else chaosFill.style.background = 'linear-gradient(90deg, #8b5cf6 0%, #a78bfa 100%)';
}
