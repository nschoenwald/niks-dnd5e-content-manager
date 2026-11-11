const FEAT_TYPES = new Map([
    ["epicBoon", "DCM.Feat.EpicBoon"],
    ["fightingStyle", "DCM.Feat.FightingStyle"],
    ["general", "DCM.Feat.General"],
    ["origin", "DCM.Feat.Origin"],
])

function getFeatTypeV3(ident) {
    if (FEAT_TYPES.has(ident)) {
        return game.i18n.localize(FEAT_TYPES.get(ident))
    }
    return game.i18n.localize("DCM.Feat.Feat")
}

function getFeatTypeV4(ident) {
    if (ident in CONFIG.DND5E.featureTypes.feat.subtypes) {
        return game.i18n.localize(CONFIG.DND5E.featureTypes.feat.subtypes[ident])
    }
    return game.i18n.localize("DCM.Feat.Unspecified")
}

export function getFeatType(ident) {
    if (CONFIG.dndContentManager.systemV3) {
        return getFeatTypeV3(ident)
    } else {
        return getFeatTypeV4(ident)
    }
}
