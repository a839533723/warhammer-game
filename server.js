// 战锤40K游戏服务器
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const path = require('path');
const http = require('http');

// 创建Express应用
const app = express();
const server = http.createServer(app);

// 中间件
app.use(cors());
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname)));

// 游戏状态存储（内存中，生产环境应该用数据库）
let gameStates = {};

// 获取OpenClaw的session key（如果有）
const OPENCLAW_SESSION = process.env.OPENCLAW_SESSION || 'main';

// 初始化游戏状态
function initGameState(sessionId) {
    return {
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
        log: []
    };
}

// 获取或创建游戏状态
function getGameState(sessionId) {
    if (!gameStates[sessionId]) {
        gameStates[sessionId] = initGameState(sessionId);
    }
    return gameStates[sessionId];
}

// 添加日志
function addLog(state, message) {
    state.log.push({
        turn: state.turn,
        message: message,
        timestamp: new Date().toISOString()
    });
}

// API: 获取游戏状态
app.get('/api/game/:sessionId', (req, res) => {
    const state = getGameState(req.params.sessionId);
    res.json(state);
});

// API: 执行行动
app.post('/api/action', (req, res) => {
    const { sessionId, category, action, actionName } = req.body;
    const state = getGameState(sessionId);
    
    // 检查行动次数
    if (state.actionsUsed >= state.maxActions) {
        return res.json({
            success: false,
            message: '本回合行动次数已用完！',
            state: state
        });
    }
    
    // 增加行动计数
    state.actionsUsed++;
    
    // 处理不同类型的行动
    let result = null;
    
    switch(category) {
        case 'combat':
            result = handleCombatAction(state, action);
            break;
        case 'building':
            result = handleBuildingAction(state, action);
            break;
        case 'investigation':
            result = handleInvestigationAction(state, action);
            break;
        case 'exploration':
            result = handleExplorationAction(state, action);
            break;
        case 'system':
            result = handleSystemAction(state, action);
            break;
    }
    
    addLog(state, `执行行动: ${actionName}`);
    
    res.json({
        success: true,
        result: result,
        state: state
    });
});

// API: 回合结束
app.post('/api/endTurn', (req, res) => {
    const { sessionId } = req.body;
    const state = getGameState(sessionId);
    
    // 重置行动计数
    state.actionsUsed = 0;
    state.turn++;
    
    // 巢穴产出
    const baseOutput = state.base.level * 5;
    state.resources.materials += baseOutput;
    
    // 建筑产出
    state.base.buildings.forEach(building => {
        if (building.type === 'training') {
            // 训练场产出
        } else if (building.type === 'workshop') {
            // 工坊产出
        }
    });
    
    addLog(state, `回合结束，新回合开始`);
    
    res.json({
        success: true,
        message: `回合 ${state.turn} 开始！巢穴产出 +${baseOutput} 物资`,
        state: state
    });
});

// API: 获取日志
app.get('/api/log/:sessionId', (req, res) => {
    const state = getGameState(req.params.sessionId);
    res.json(state.log.slice(-20)); // 返回最近20条
});

// 战斗行动处理
function handleCombatAction(state, action) {
    const battles = {
        'attack_chaos': {
            materials: [10, 20, 30],
            reputation: [5, 10, 15],
            chaosRisk: 10,
            narration: '你遇到了混沌入侵者！\n\n你的爆弹枪喷吐出愤怒的火舌，子弹穿透混沌信徒的躯体。\n\n战斗结束，你获得了物资和声望。'
        },
        'defend_base': {
            materials: [5, 10, 15],
            reputation: [10, 15, 20],
            chaosRisk: 5,
            narration: '你成功防守了要塞入口！\n\n一波又一波的敌人被你阻挡在外，极限战士战团对你的表现赞不绝口。'
        }
    };
    
    const battle = battles[action];
    const materials = battle.materials[Math.floor(Math.random() * battle.materials.length)];
    const reputation = battle.reputation[Math.floor(Math.random() * battle.reputation.length)];
    
    state.resources.materials += materials;
    state.character.reputation += reputation;
    
    const chaosIncrease = Math.floor(Math.random() * battle.chaosRisk);
    state.character.chaos = Math.min(100, state.character.chaos + chaosIncrease);
    
    return {
        type: 'combat',
        materials: materials,
        reputation: reputation,
        chaosIncrease: chaosIncrease,
        narration: battle.narration
    };
}

// 建筑行动处理
function handleBuildingAction(state, action) {
    const costs = {
        'upgrade_base': { materials: 15 },
        'build_training': { materials: 10 },
        'build_workshop': { materials: 10 }
    };
    
    const cost = costs[action];
    
    if (state.resources.materials < cost.materials) {
        return {
            success: false,
            message: `物资不足！需要${cost.materials}物资，当前只有${state.resources.materials}。`
        };
    }
    
    state.resources.materials -= cost.materials;
    
    let result = '';
    switch(action) {
        case 'upgrade_base':
            state.base.level = Math.min(5, state.base.level + 1);
            result = `巢穴升级成功！现在等级：Lv.${state.base.level}`;
            break;
        case 'build_training':
            state.base.buildings.push({ type: 'training', name: '训练场' });
            result = '训练场建造完成！每回合可获得技能加成。';
            break;
        case 'build_workshop':
            state.base.buildings.push({ type: 'workshop', name: '工坊' });
            result = '工坊建造完成！每回合可制造道具。';
            break;
    }
    
    return {
        success: true,
        type: 'building',
        message: result,
        materialsChange: -cost.materials
    };
}

// 调查行动处理
function handleInvestigationAction(state, action) {
    const npcs = {
        'talk_tam': { name: '塔姆', suspicion: 3 },
        'talk_carl': { name: '卡尔', suspicion: 5 },
        'talk_yuri': { name: '尤里', suspicion: 4 }
    };
    
    const npc = npcs[action];
    const clues = [
        `你与${npc.name}交谈。他看起来有些紧张，但话语中似乎没有破绽。`,
        `${npc.name}的眼神闪烁了一下，但你无法确定他在隐瞒什么。`,
        `你注意到${npc.name}的手指微微颤抖...他在害怕什么？`
    ];
    
    const randomClue = clues[Math.floor(Math.random() * clues.length)];
    
    // 增加可疑度
    state.npcs[action.replace('talk_', '')].suspicion = Math.min(10, 
        state.npcs[action.replace('talk_', '')].suspicion + Math.floor(Math.random() * 2)
    );
    
    return {
        type: 'investigation',
        npc: npc.name,
        clue: randomClue,
        suspicion: state.npcs[action.replace('talk_', '')].suspicion
    };
}

// 探索行动处理
function handleExplorationAction(state, action) {
    const results = [
        { 
            found: '古代STC碎片', 
            materials: 15, 
            description: '你在废墟中发现了一块古代STC碎片，上面刻满了失落的技术。',
            soulPoint: false
        },
        { 
            found: '幸存者', 
            materials: 5, 
            description: '你发现了一位幸存的帝国平民，他愿意加入你的巢穴。',
            soulPoint: true
        },
        { 
            found: '混沌印记', 
            materials: 0, 
            description: '你在探索过程中接触到了混沌力量的残留，混沌值增加了10点。',
            soulPoint: false,
            chaos: 10
        },
        { 
            found: '稀有矿物', 
            materials: 25, 
            description: '你在北境荒野的深处发现了一处稀有矿物矿脉！',
            soulPoint: false
        }
    ];
    
    const result = results[Math.floor(Math.random() * results.length)];
    
    state.resources.materials += result.materials;
    if (result.soulPoint) {
        state.resources.soulPoints += 1;
    }
    if (result.chaos) {
        state.character.chaos = Math.min(100, state.character.chaos + result.chaos);
    }
    
    return {
        type: 'exploration',
        found: result.found,
        description: result.description,
        materials: result.materials,
        soulPoint: result.soulPoint,
        chaos: result.chaos || 0
    };
}

// 系统行动处理
function handleSystemAction(state, action) {
    switch(action) {
        case 'save':
            return {
                type: 'system',
                message: '存档成功！游戏状态已保存。',
                savedState: JSON.stringify(state)
            };
        case 'load':
            return {
                type: 'system',
                message: '读档功能就绪。',
                state: state
            };
        case 'status':
            return {
                type: 'system',
                message: '状态查询成功',
                fullState: state
            };
    }
}

// 启动服务器
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`
╔════════════════════════════════════════════════╗
║                                                ║
║   ⚔️  战锤40K：虚空黎明  ⚔️                    ║
║                                                ║
║   游戏服务器已启动！                           ║
║                                                ║
║   访问地址: http://localhost:${PORT}            ║
║                                                ║
║   API端点:                                     ║
║   - GET  /api/game/:sessionId  获取游戏状态    ║
║   - POST /api/action           执行行动        ║
║   - POST /api/endTurn          回合结束        ║
║                                                ║
╚════════════════════════════════════════════════╝
    `);
});

// 优雅关闭
process.on('SIGINT', () => {
    console.log('\n正在关闭服务器...');
    server.close(() => {
        console.log('服务器已关闭');
        process.exit(0);
    });
});
