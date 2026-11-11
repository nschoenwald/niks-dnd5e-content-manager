
function getMonsterTypeV3(type) {
    return `${type.slice(0, 1).toUpperCase()}${type.slice(1, type.length)}`
}

function getMonsterTypeV4(type) {
    if (type in CONFIG.DND5E.creatureTypes) {
        return game.i18n.localize(CONFIG.DND5E.creatureTypes[type].label)
    }
    else {
        return `${type.slice(0, 1).toUpperCase()}${type.slice(1, type.length)}`
    }
}

export function getMonsterType(type) {

    if (!type) {
        return game.i18n.localize("DCM.Monster.Unknown")
    }

    if (CONFIG.dndContentManager.systemV3) {
        return getMonsterTypeV3(type)
    } else {
        return getMonsterTypeV4(type)
    }
}
