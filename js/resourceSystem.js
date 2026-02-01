/**
 * 战锤40K - 资源系统
 * 管理5个核心资源的获取、消耗、转换
 */

class ResourceSystem {
    constructor() {
        // 资源结构已在gameState中定义，这里提供操作方法
    }
    
    /**
     * 修改资源值
     */
    modify(resourceName, amount) {
        const resource = gameState.resources[resourceName];
        if (!resource) {
            console.error('资源不存在:', resourceName);
            return false;
        }
        
        // 追随者特殊处理
        if (resourceName === 'followers') {
            if (amount > 0) {
                // 添加追随者
                if (resource.list.length >= resource.max) {
                    addDialog('system', '⚠️', '追随者已达上限！');
                    return false;
                }
                // 默认追随者
                const newFollower = {
                    id: 'follower_' + Date.now(),
                    name: '新追随者',
                    type: 'combat',
                    bonus: { attack: 5, defense: 0 },
                    description: '新加入的追随者'
                };
                resource.list.push(newFollower);
            } else if (amount < 0) {
                // 移除追随者
                if (resource.list.length > 0) {
                    resource.list.pop();
                } else {
                    addDialog('system', '⚠️', '没有追随者可以移除！');
                    return false;
                }
            }
        } else {
            // 普通资源处理
            resource.value = Math.max(0, Math.min(resource.max, resource.value + amount));
        }
        
        updateUI();
        return true;
    }
    
    /**
     * 检查是否能支付资源
     */
    canAfford(cost) {
        for (const [resourceName, amount] of Object.entries(cost)) {
            const resource = gameState.resources[resourceName];
            if (!resource) return false;
            
            if (resourceName === 'followers') {
                if (resource.list.length < amount) return false;
            } else {
                if (resource.value < amount) return false;
            }
        }
        return true;
    }
    
    /**
     * 扣除资源
     */
    deduct(cost) {
        if (!this.canAfford(cost)) {
            addDialog('system', '⚠️', '资源不足！');
            return false;
        }
        
        for (const [resourceName, amount] of Object.entries(cost)) {
            this.modify(resourceName, -amount);
        }
        return true;
    }
    
    /**
     * 资源转换
     */
    convert(fromResource, toResource, rate) {
        const from = gameState.resources[fromResource];
        const to = gameState.resources[toResource];
        
        if (!from || !to) {
            addDialog('system', '⚠️', '资源转换失败：无效的资源类型');
            return false;
        }
        
        // 追随者不能转换
        if (fromResource === 'followers' || toResource === 'followers') {
            addDialog('system', '⚠️', '追随者不能进行资源转换');
            return false;
        }
        
        const amount = Math.floor(from.value * rate);
        this.modify(fromResource, -amount);
        this.modify(toResource, amount);
        
        addDialog('system', '🔄', '转换成功：-' + amount + ' ' + fromResource + '，+' + amount + ' ' + toResource);
        return true;
    }
    
    /**
     * 获取资源变化趋势
     */
    getDailyChange() {
        let totalChange = 0;
        for (const resource of Object.values(gameState.resources)) {
            if (resource.dailyChange) {
                totalChange += resource.dailyChange;
            }
        }
        return totalChange;
    }
    
    /**
     * 获取追随者加成
     */
    getFollowerBonus() {
        let attackBonus = 0;
        let defenseBonus = 0;
        let resourceBonus = { materials: 0, reputation: 0 };
        
        for (const follower of gameState.resources.followers.list) {
            if (follower.bonus) {
                attackBonus += follower.bonus.attack || 0;
                defenseBonus += follower.bonus.defense || 0;
            }
        }
        
        return {
            attack: attackBonus,
            defense: defenseBonus,
            resources: resourceBonus
        };
    }
    
    /**
     * 更新每日产出
     */
    updateDailyProduction() {
        let totalMaterials = 0;
        let resourceChanges = [];
        
        // 基地产出
        const baseOutput = gameState.base.level * 5;
        totalMaterials += baseOutput;
        resourceChanges.push('巢穴+' + baseOutput);
        
        // 建筑产出
        for (const building of gameState.base.buildings) {
            if (building.type === 'workshop') {
                totalMaterials += 5;
                resourceChanges.push('工坊+5');
            } else if (building.type === 'shrine') {
                this.modify('memoryFragments', 1);
                resourceChanges.push('灵魂殿+1记忆碎片');
            }
        }
        
        // 追随者产出
        const followerBonus = this.getFollowerBonus();
        totalMaterials += followerBonus.resources.materials;
        totalMaterials += followerBonus.resources.reputation;
        
        // 应用产出
        if (totalMaterials > 0) {
            this.modify('materials', totalMaterials);
        }
        
        return resourceChanges.join('，');
    }
    
    /**
     * 获取资源面板HTML
     */
    getResourcePanelHTML() {
        const resources = gameState.resources;
        const chaosValue = resources.chaosValue.value;
        
        // 计算混沌阶段
        let chaosPhase = '纯净';
        let chaosColor = '#8b5cf6';
        if (chaosValue >= 80) { chaosPhase = '堕落'; chaosColor = '#dc2626'; }
        else if (chaosValue >= 60) { chaosPhase = '重腐'; chaosColor = '#ef4444'; }
        else if (chaosValue >= 40) { chaosPhase = '中腐'; chaosColor = '#f97316'; }
        else if (chaosValue >= 20) { chaosPhase = '轻腐'; chaosColor = '#eab308'; }
        
        return `
            <div class="resource-panel">
                <div class="resource" data-type="materials">
                    <span class="icon">📦</span>
                    <span class="name">物资</span>
                    <span class="value">${resources.materials.value}</span>
                    <span class="limit">/${resources.materials.max}</span>
                </div>
                
                <div class="resource" data-type="reputation">
                    <span class="icon">⭐</span>
                    <span class="name">声望</span>
                    <span class="value">${resources.reputation.value}</span>
                    <span class="limit">/${resources.reputation.max}</span>
                </div>
                
                <div class="resource chaos" data-type="chaosValue" style="border-color: ${chaosColor}">
                    <span class="icon">🔮</span>
                    <span class="name">混沌值</span>
                    <span class="value" style="color: ${chaosColor}">${chaosValue}</span>
                    <span class="limit">/100</span>
                    <span class="phase" style="color: ${chaosColor}">${chaosPhase}</span>
                </div>
                
                <div class="resource" data-type="memoryFragments">
                    <span class="icon">🧩</span>
                    <span class="name">记忆碎片</span>
                    <span class="value">${resources.memoryFragments.value}</span>
                    <span class="limit">/${resources.memoryFragments.max}</span>
                </div>
                
                <div class="resource" data-type="followers">
                    <span class="icon">👥</span>
                    <span class="name">追随者</span>
                    <span class="value">${resources.followers.list.length}</span>
                    <span class="limit">/${resources.followers.max}</span>
                </div>
            </div>
        `;
    }
}

// 创建实例并导出
window.resourceSystem = new ResourceSystem();
