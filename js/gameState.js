/**
 * 战锤40K - 游戏状态管理
 * 包含所有游戏数据结构和状态操作
 */

// 游戏状态
let gameState = {
    // 回合信息
    turn: 1,
    actionsUsed: 0,
    maxActions: 3,
    
    // 角色信息
    character: {
        name: '钛-7',
        class: '极限战士',
        level: 1,
        hp: 100,
        maxHp: 100,
        chaos: 0,
        reputation: 0
    },
    
    // 资源系统（5核心资源）
    resources: {
        materials: { value: 50, max: 100, dailyChange: 0 },
        reputation: { value: 25, max: 100, dailyChange: 0 },
        chaosValue: { value: 0, max: 100, dailyChange: 0 },
        memoryFragments: { value: 0, max: 10, dailyChange: 0 },
        followers: { value: 1, max: 5, list: [] }
    },
    
    // 基地系统
    base: {
        level: 1,
        buildings: []
    },
    
    // NPC系统
    npcs: {
        tam: { name: '塔姆', suspicion: 3, trust: 5, joined: false },
        carl: { name: '卡尔', suspicion: 5, trust: 3, joined: false },
        yuri: { name: '尤里', suspicion: 4, trust: 2, joined: false }
    },
    
    // 抽卡系统
    cardSystem: {
        hand: [],              // 当前手牌
        discardPile: [],       // 弃牌堆
        careerCardUsed: false  // 职业卡是否已使用
    },
    
    // UI状态
    selectedCategory: null
};

// 初始化默认追随者
gameState.resources.followers.list = [
    {
        id: 'follower_001',
        name: '极限战士-钛',
        type: 'combat',
        bonus: { attack: 10, defense: 0 },
        description: '忠诚的极限战士战士'
    }
];

/**
 * 保存游戏
 */
function saveGame() {
    localStorage.setItem('warhammer_game_state', JSON.stringify(gameState));
    addDialog('system', '💾', '游戏已保存！');
}

/**
 * 加载游戏
 */
function loadGame() {
    const saved = localStorage.getItem('warhammer_game_state');
    if (saved) {
        try {
            const parsed = JSON.parse(saved);
            // 合并状态，保留新字段
            gameState = { ...gameState, ...parsed };
            
            // 确保resources结构正确
            if (parsed.resources && typeof parsed.resources.materials === 'number') {
                // 旧版存档兼容：转换为新结构
                gameState.resources = {
                    materials: { value: parsed.resources.materials, max: 100, dailyChange: 0 },
                    reputation: { value: gameState.character.reputation || 25, max: 100, dailyChange: 0 },
                    chaosValue: { value: gameState.character.chaos || 0, max: 100, dailyChange: 0 },
                    memoryFragments: { value: 0, max: 10, dailyChange: 0 },
                    followers: gameState.resources.followers.list || []
                };
            }
            
            updateUI();
            addDialog('system', '📂', '存档加载成功！');
        } catch (e) {
            addDialog('system', '⚠️', '存档已损坏，无法加载。');
            console.error('存档加载错误:', e);
        }
    } else {
        addDialog('system', '⚠️', '没有找到存档。');
    }
}

/**
 * 重置游戏
 */
function resetGame() {
    if (confirm('确定要重置游戏吗？所有进度将丢失！')) {
        localStorage.removeItem('warhammer_game_state');
        location.reload();
    }
}

/**
 * 获取游戏状态摘要
 */
function getGameSummary() {
    return {
        turn: gameState.turn,
        character: gameState.character.name + ' (' + gameState.character.class + ' Lv.' + gameState.character.level + ')',
        resources: {
            materials: gameState.resources.materials.value + '/' + gameState.resources.materials.max,
            reputation: gameState.resources.reputation.value + '/' + gameState.resources.reputation.max,
            chaosValue: gameState.resources.chaosValue.value + '/' + gameState.resources.chaosValue.max,
            memoryFragments: gameState.resources.memoryFragments.value + '/' + gameState.resources.memoryFragments.max,
            followers: gameState.resources.followers.list.length + '/' + gameState.resources.followers.max
        },
        base: 'Lv.' + gameState.base.level,
        npcs: Object.keys(gameState.npcs).length
    };
}

// 导出到全局
window.gameState = gameState;
window.saveGame = saveGame;
window.loadGame = loadGame;
window.resetGame = resetGame;
window.getGameSummary = getGameSummary;
