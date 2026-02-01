// 战锤40K游戏 - 纯静态版本
// 所有逻辑都在前端运行，不需要后端服务器

// 游戏状态
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
        tam: { name: '塔姆', suspicion: 3, trust: 5, joined: false, description: '极限战士要塞接待员，热情友善，负责引导新人。' },
        carl: { name: '卡尔', suspicion: 5, trust: 3, joined: false, description: '极限战士军需官，严肃务实，负责物资分配。' },
        yuri: { name: '尤里', suspicion: 4, trust: 2, joined: false, description: '机械教神甫，沉默寡言，技术精湛。' }
    },
    logs: [],
    selectedCategory: null
};

// 保存到本地存储
function saveGame() {
    localStorage.setItem('warhammer_game_state', JSON.stringify(gameState));
    addDialog('system', '💾', '✅ 游戏已保存到本地存储！');
}

// 从本地存储加载
function loadGame() {
    const saved = localStorage.getItem('warhammer_game_state');
    if (saved) {
        try {
            const parsed = JSON.parse(saved);
            gameState = { ...gameState, ...parsed };
            updateUI();
            addDialog('system', '📂', `✅ 存档加载成功！\n存档时间：${new Date().toLocaleString()}`);
        } catch (e) {
            addDialog('system', '⚠️', '存档已损坏，无法加载。');
        }
    } else {
        addDialog('system', '⚠️', '没有找到存档。');
    }
}

// 重置游戏
function resetGame() {
    if (confirm('确定要重置游戏吗？所有进度将丢失！')) {
        localStorage.removeItem('warhammer_game_state');
        location.reload();
    }
}

// 初始化
document.addEventListener('DOMContentLoaded', () => {
    console.log('⚔️ 战锤40K：虚空黎明 已启动');
    
    // 尝试加载存档
    loadGame();
    
    // 显示欢迎信息
    addDialog('system', '🌌', `欢迎回来，战士！

【当前状态】
• 回合：${gameState.turn}
• 物资：${gameState.resources.materials}
• 巢穴：Lv.${gameState.base.level}
• 混沌值：${gameState.character.chaos}/100

【操作提示】
• 点击左侧按钮选择行动类别
• 每个回合最多3个行动
• 记得存档！

准备开始行动吧！`);
});

// 显示行动类别
function showCategory(category) {
    document.querySelectorAll('.action-list').forEach(list => {
        list.style.display = 'none';
    });
    
    document.querySelectorAll('.action-category').forEach(btn => {
        btn.classList.remove('active');
    });
    
    const actionList = document.getElementById(`${category}-actions`);
    if (actionList) {
        actionList.style.display = 'grid';
    }
    
    const categoryBtn = document.querySelector(`.action-category[onclick="showCategory('${category}')"]`);
    if (categoryBtn) {
        categoryBtn.classList.add('active');
    }
    
    gameState.selectedCategory = category;
}

// 执行行动
function performAction(category, action) {
    if (gameState.actionsUsed >= gameState.maxActions) {
        addDialog('system', '⚠️', '本回合行动次数已用完！\n\n请回合结束后继续。');
        return;
    }
    
    const actionName = getActionName(category, action);
    addDialog('player', '🦾', `执行行动：${actionName}`);
    
    gameState.actionsUsed++;
    
    // 根据行动类型处理
    setTimeout(() => {
        let result = null;
        
        switch(category) {
            case 'combat':
                result = handleCombatAction(action);
                break;
            case 'building':
                result = handleBuildingAction(action);
                break;
            case 'investigation':
                result = handleInvestigationAction(action);
                break;
            case 'exploration':
                result = handleExplorationAction(action);
                break;
            case 'system':
                result = handleSystemAction(action);
                break;
        }
        
        if (result) {
            showActionResult(result);
        }
        
        updateUI();
        saveGame();
    }, 500);
}

// 显示行动结果
function showActionResult(result) {
    setTimeout(() => {
        switch(result.type) {
            case 'combat':
                addDialog('npc', '⚔️', result.narration);
                addDialog('system', '📊', `战斗结果：
• 获得物资：+${result.materials}
• 获得声望：+${result.reputation}
• 混沌值变化：+${result.chaosIncrease}`);
                break;
                
            case 'building':
                if (!result.success) {
                    addDialog('system', '⚠️', result.message);
                } else {
                    addDialog('system', '🏗️', result.message);
                    addDialog('system', '📊', `物资变化：${result.materialsChange}`);
                }
                break;
                
            case 'investigation':
                addDialog('npc', '💬', result.clue);
                addDialog('system', '🔍', `对${result.npc}的可疑度评估：${result.suspicion}/10
信任度：${result.trust}/10
${result.suspicion >= 7 ? '\n⚠️ 警告：此人非常可疑！' : result.suspicion >= 5 ? '\n⚡ 需要进一步调查。' : '\n✅ 目前暂无明显可疑迹象。'}`);
                break;
                
            case 'exploration':
                addDialog('npc', '🗺️', result.description);
                let resultText = `探索结果：
• 发现：${result.found}
• 获得物资：+${result.materials}`;
                if (result.soulPoint) resultText += '\n• 获得灵魂点：+1';
                if (result.chaos) resultText += `\n• 混沌值：+${result.chaos}`;
                addDialog('system', '📊', resultText);
                break;
                
            case 'system':
                if (result.message) {
                    addDialog('system', '⚙️', result.message);
                }
                if (result.fullStatus) {
                    showFullStatus(result.fullStatus);
                }
                break;
        }
    }, 300);
}

// 战斗行动
function handleCombatAction(action) {
    const battles = {
        'attack_chaos': {
            materials: [10, 20, 30],
            reputation: [5, 10, 15],
            chaosRisk: 10,
            narration: `你遇到了混沌入侵者！

你的爆弹枪喷吐出愤怒的火舌，子弹穿透混沌信徒的躯体。

战斗结束，你获得了物资和声望。`
        },
        'defend_base': {
            materials: [5, 10, 15],
            reputation: [10, 15, 20],
            chaosRisk: 5,
            narration: `你成功防守了要塞入口！

一波又一波的混沌信徒被你阻挡在外。

极限战士战团对你的表现赞不绝口。`
        }
    };
    
    const battle = battles[action];
    const materials = battle.materials[Math.floor(Math.random() * battle.materials.length)];
    const reputation = battle.reputation[Math.floor(Math.random() * battle.reputation.length)];
    
    gameState.resources.materials += materials;
    gameState.character.reputation += reputation;
    
    const chaosIncrease = Math.floor(Math.random() * battle.chaosRisk);
    gameState.character.chaos = Math.min(100, gameState.character.chaos + chaosIncrease);
    
    return {
        type: 'combat',
        materials: materials,
        reputation: reputation,
        chaosIncrease: chaosIncrease,
        narration: battle.narration
    };
}

// 建筑行动
function handleBuildingAction(action) {
    const costs = {
        'upgrade_base': { materials: 15 },
        'build_training': { materials: 10 },
        'build_workshop': { materials: 10 },
        'build_shrine': { materials: 15 }
    };
    
    const cost = costs[action];
    
    if (gameState.resources.materials < cost.materials) {
        return {
            type: 'building',
            success: false,
            message: `物资不足！需要${cost.materials}物资，当前只有${gameState.resources.materials}。`
        };
    }
    
    gameState.resources.materials -= cost.materials;
    
    let message = '';
    let building = null;
    
    switch(action) {
        case 'upgrade_base':
            gameState.base.level = Math.min(5, gameState.base.level + 1);
            message = `🏗️ 巢穴升级成功！

现在等级：Lv.${gameState.base.level}
每回合产出：+${gameState.base.level * 5} 物资`;
            break;
            
        case 'build_training':
            if (gameState.base.buildings.some(b => b.type === 'training')) {
                return { type: 'building', success: false, message: '训练场已经存在！' };
            }
            building = { type: 'training', name: '训练场', description: '每回合+1技能点' };
            message = '🎯 训练场建造完成！

每回合可获得1技能点用于升级战斗技能。';
            break;
            
        case 'build_workshop':
            if (gameState.base.buildings.some(b => b.type === 'workshop')) {
                return { type: 'building', success: false, message: '工坊已经存在！' };
            }
            building = { type: 'workshop', name: '工坊', description: '每回合可制造道具' };
            message = '⚙️ 工坊建造完成！

每回合可制造1件随机道具。';
            break;
            
        case 'build_shrine':
            if (gameState.base.buildings.some(b => b.type === 'shrine')) {
                return { type: 'building', success: false, message: '灵魂圣殿已经存在！' };
            }
            building = { type: 'shrine', name: '灵魂圣殿', description: '每回合+1灵魂点' };
            message = '🔮 灵魂圣殿建造完成！

每回合可获得1灵魂点，用于特殊能力。';
            break;
    }
    
    if (building) {
        gameState.base.buildings.push(building);
    }
    
    return {
        type: 'building',
        success: true,
        message: message,
        materialsChange: `-${cost.materials}`
    };
}

// 调查行动
function handleInvestigationAction(action) {
    const npcKey = action.replace('talk_', '');
    const npc = gameState.npcs[npcKey];
    
    if (!npc) {
        return { type: 'investigation', npc: '未知', clue: '错误：找不到该NPC', suspicion: 0, trust: 0 };
    }
    
    const clues = [
        `你与${npc.name}交谈。他看起来有些紧张，但话语中似乎没有破绽。`,
        `${npc.name}的眼神闪烁了一下，但你无法确定他在隐瞒什么。`,
        `你注意到${npc.name}的手指微微颤抖...他在害怕什么？`,
        `${npc.name}主动提及了一些无关的话题，似乎在转移话题。`,
        `你问起${npc.name}昨晚的行踪，他犹豫了一下，然后给出了一个模糊的回答。`
    ];
    
    const randomClue = clues[Math.floor(Math.random() * clues.length)];
    
    // 随机增加可疑度或信任度
    if (Math.random() > 0.5) {
        npc.suspicion = Math.min(10, npc.suspicion + Math.floor(Math.random() * 2 + 1));
    } else {
        npc.trust = Math.min(10, npc.trust + Math.floor(Math.random() * 2));
    }
    
    // 如果信任度很高，减少可疑度
    if (npc.trust >= 8) {
        npc.suspicion = Math.max(1, npc.suspicion - 1);
    }
    
    return {
        type: 'investigation',
        npc: npc.name,
        clue: randomClue,
        suspicion: npc.suspicion,
        trust: npc.trust
    };
}

// 探索行动
function handleExplorationAction(action) {
    const results = [
        { 
            found: '古代STC碎片', 
            materials: 15, 
            description: '你在废墟中发现了一块古代STC碎片，上面刻满了失落的技术。',
            soulPoint: false,
            chaos: 0
        },
        { 
            found: '幸存者', 
            materials: 5, 
            description: '你发现了一位幸存的帝国平民，他愿意加入你的巢穴。',
            soulPoint: true,
            chaos: 0
        },
        { 
            found: '混沌印记', 
            materials: 0, 
            description: '你在探索过程中接触到了混沌力量的残留，混沌之语在你脑海中回响...',
            soulPoint: false,
            chaos: 10
        },
        { 
            found: '稀有矿物', 
            materials: 25, 
            description: '你在北境荒野的深处发现了一处稀有矿物矿脉！这次收获颇丰！',
            soulPoint: false,
            chaos: 0
        },
        { 
            found: '废弃军械库', 
            materials: 20, 
            description: '你发现了一个废弃的军械库，里面还有不少武器弹药。',
            soulPoint: false,
            chaos: 0
        },
        { 
            found: '神秘符文', 
            materials: 0, 
            description: '你墙壁上发现了神秘的符文，似乎是某种古老的封印。',
            soulPoint: true,
            chaos: 5
        }
    ];
    
    const result = results[Math.floor(Math.random() * results.length)];
    
    gameState.resources.materials += result.materials;
    if (result.soulPoint) {
        gameState.resources.soulPoints += 1;
    }
    gameState.character.chaos = Math.min(100, gameState.character.chaos + result.chaos);
    
    return {
        type: 'exploration',
        found: result.found,
        description: result.description,
        materials: result.materials,
        soulPoint: result.soulPoint,
        chaos: result.chaos
    };
}

// 系统行动
function handleSystemAction(action) {
    switch(action) {
        case 'save':
            saveGame();
            return { type: 'system', message: null };
            
        case 'load':
            loadGame();
            return { type: 'system', message: null };
            
        case 'status':
            return {
                type: 'system',
                fullStatus: true
            };
            
        case 'endTurn':
            return handleEndTurn();
            
        case 'reset':
            resetGame();
            return { type: 'system', message: null };
    }
}

// 回合结束
function handleEndTurn() {
    // 重置行动计数
    gameState.actionsUsed = 0;
    gameState.turn++;
    
    // 巢穴产出
    const baseOutput = gameState.base.level * 5;
    gameState.resources.materials += baseOutput;
    
    // 建筑产出
    let buildingOutput = '';
    gameState.base.buildings.forEach(building => {
        if (building.type === 'training') {
            // 训练场产出（未来扩展）
            buildingOutput += '\n• 训练场：准备就绪';
        } else if (building.type === 'workshop') {
            // 工坊产出
            const item = getRandomItem();
            gameState.resources.materials += 5;
            buildingOutput += `\n• 工坊：制造了 ${item}`;
        } else if (building.type === 'shrine') {
            // 灵魂圣殿产出
            gameState.resources.soulPoints += 1;
            buildingOutput += '\n• 灵魂圣殿：+1灵魂点';
        }
    });
    
    // 随机事件
    const randomEvent = Math.random();
    let eventMessage = '';
    
    if (randomEvent < 0.15) {
        // 好事件
        const goodEvents = [
            { text: '🎁 意外收获：一个路过商队送了你一些物资。', materials: 10 },
            { text: '🌟 好消息：你的英勇事迹传开了，声望+5！', reputation: 5 },
            { text: '🔧 发现：工坊里找到了隐藏的工具箱。', materials: 8 }
        ];
        const event = goodEvents[Math.floor(Math.random() * goodEvents.length)];
        eventMessage = '\n\n' + event.text;
        if (event.materials) gameState.resources.materials += event.materials;
        if (event.reputation) gameState.character.reputation += event.reputation;
    } else if (randomEvent < 0.25) {
        // 坏事件
        const badEvents = [
            { text: '💀 袭击：一小股混沌信徒袭击了你的巢穴！混沌值+5', chaos: 5 },
            { text: '📦 损失：一些物资在仓库中腐烂了。', materials: -5 },
            { text: '👁️ 监视：你感觉到有人在暗中监视你...' }
        ];
        const event = badEvents[Math.floor(Math.random() * badEvents.length)];
        eventMessage = '\n\n' + event.text;
        if (event.chaos) gameState.character.chaos = Math.min(100, gameState.character.chaos + event.chaos);
        if (event.materials) gameState.resources.materials = Math.max(0, gameState.resources.materials + event.materials);
    }
    
    // 混沌值自然增长
    if (gameState.character.chaos > 0 && Math.random() < 0.1) {
        gameState.character.chaos = Math.max(0, gameState.character.chaos - 2);
        eventMessage += '\n✨ 净化仪式生效：混沌值-2';
    }
    
    // 混沌值过高警告
    let chaosWarning = '';
    if (gameState.character.chaos >= 50) {
        chaosWarning = '\n\n⚠️ 警告：你的混沌值已达到 ' + gameState.character.chaos + '！
混沌的力量正在侵蚀你的意志...
继续这样下去，你会堕落。';
    }
    
    return {
        type: 'system',
        message: `🔄 回合 ${gameState.turn} 开始！

巢穴产出 +${baseOutput} 物资${buildingOutput}
${eventMessage}${chaosWarning}

当前状态：
• 物资：${gameState.resources.materials}
• 混沌值：${gameState.character.chaos}/100
• 建筑：${gameState.base.buildings.length > 0 ? gameState.base.buildings.map(b => b.name).join(', ') : '无'}`
    };
}

// 随机道具
function getRandomItem() {
    const items = ['弹药', '医疗包', '工具', '零件', '香料'];
    return items[Math.floor(Math.random() * items.length)];
}

// 显示完整状态
function showFullStatus() {
    const npcStatus = Object.values(gameState.npcs).map(npc => 
        `• ${npc.name}: 可疑度${npc.suspicion}/10, 信任度${npc.trust}/10`
    ).join('\n');
    
    const statusText = `【角色状态】
━━━━━━━━━━━━━━━━━━━━
名称：${gameState.character.name}
职业：${gameState.character.class} Lv.${gameState.character.level}

生命值：${gameState.character.hp}/${gameState.character.maxHp}
混沌值：${gameState.character.chaos}/100
声望：${gameState.character.reputation}

【资源】
━━━━━━━━━━━━━━━━━━━━
物资：${gameState.resources.materials}
灵魂点：${gameState.resources.soulPoints}

【势力】
━━━━━━━━━━━━━━━━━━━━
巢穴等级：${gameState.base.level}
建筑：${gameState.base.buildings.length > 0 ? gameState.base.buildings.map(b => b.name).join(', ') : '无'}

【NPC】
━━━━━━━━━━━━━━━━━━━━
${npcStatus}

【回合信息】
━━━━━━━━━━━━━━━━━━━━
当前回合：${gameState.turn}
已用行动：${gameState.actionsUsed}/${gameState.maxActions}

【游戏进度】
━━━━━━━━━━━━━━━━━━━━
${gameState.character.chaos >= 80 ? '🔴 危险：接近堕落边缘' : 
  gameState.character.chaos >= 50 ? '🟡 警告：混沌正在侵蚀' : 
  '🟢 正常：保持纯净'}
`;
    
    addDialog('system', '📊', statusText);
}

// 获取行动名称
function getActionName(category, action) {
    const names = {
        'combat': {
            'attack_chaos': '迎击混沌入侵者',
            'defend_base': '防守要塞入口'
        },
        'building': {
            'upgrade_base': '升级巢穴',
            'build_training': '建造训练场',
            'build_workshop': '建造工坊',
            'build_shrine': '建造灵魂圣殿'
        },
        'investigation': {
            'talk_tam': '与塔姆对话',
            'talk_carl': '与卡尔对话',
            'talk_yuri': '与尤里对话'
        },
        'exploration': {
            'explore_wilderness': '探索北境荒野',
            'searchruins': '搜索古代遗迹'
        },
        'system': {
            'save': '💾 存档',
            'load': '📂 读档',
            'status': '📊 查看状态',
            'endTurn': '⏭️ 回合结束',
            'reset': '🗑️ 重置游戏'
        }
    };
    
    return names[category]?.[action] || action;
}

// 添加对话框消息
function addDialog(type, avatar, text) {
    const dialogContent = document.getElementById('dialogContent');
    
    const messageDiv = document.createElement('div');
    messageDiv.className = `dialog-message ${type}`;
    
    messageDiv.innerHTML = `
        <span class="dialog-avatar">${avatar}</span>
        <div class="dialog-text">${text.replace(/\n/g, '<br>')}</div>
    `;
    
    dialogContent.appendChild(messageDiv);
    
    const dialogPanel = document.getElementById('dialogPanel');
    dialogPanel.querySelector('.dialog-content').scrollTop = dialogPanel.querySelector('.dialog-content').scrollHeight;
}

// 更新UI
function updateUI() {
    document.getElementById('charName').textContent = gameState.character.name;
    document.getElementById('charClass').textContent = `${gameState.character.class} Lv.${gameState.character.level}`;
    document.getElementById('hpValue').textContent = gameState.character.hp;
    document.getElementById('hpMax').textContent = gameState.character.maxHp;
    document.getElementById('chaosValue').textContent = gameState.character.chaos;
    document.getElementById('reputationValue').textContent = gameState.character.reputation;
    
    document.getElementById('materialValue').textContent = gameState.resources.materials;
    document.getElementById('soulValue').textContent = gameState.resources.soulPoints;
    document.getElementById('baseLevel').textContent = `Lv.${gameState.base.level}`;
    
    document.getElementById('turnNumber').textContent = gameState.turn;
    document.getElementById('actionsUsed').textContent = gameState.actionsUsed;
    
    document.getElementById('chaosFill').style.width = `${gameState.character.chaos}%`;
    
    // 根据混沌值改变颜色
    const chaosFill = document.getElementById('chaosFill');
    if (gameState.character.chaos >= 80) {
        chaosFill.style.background = 'linear-gradient(90deg, #dc2626 0%, #ef4444 100%)';
    } else if (gameState.character.chaos >= 50) {
        chaosFill.style.background = 'linear-gradient(90deg, #d97706 0%, #f59e0b 100%)';
    } else {
        chaosFill.style.background = 'linear-gradient(90deg, #8b5cf6 0%, #a78bfa 100%)';
    }
}
