//Custom code for enriching source - very heavily based on the version in DND5E core. Will remove this once v3.3.1 support no longer needed

// Get book from module metadata
function getModuleBook(pkg) {
    if ( !pkg ) return null;
    const sourceBooks = pkg.flags?.dnd5e?.sourceBooks;
    const keys = Object.keys(sourceBooks ?? {});
    if ( keys.length !== 1 ) return null;
    return keys[0];
  }

/**
 * Get the package (module, system or world) that a compendium belongs to.
 * @param {object} [metadata] - The compendium's metadata
 * @returns {object|null}
 */
export function getPackageFromMetadata(metadata) {
  switch ( metadata?.packageType ) {
    case "module": return game.modules.get(metadata.packageName);
    case "system": return game.system;
    case "world": return game.world;
  }
  return null;
}

/**
 * Prepare the source label. Look the package up once per compendium with
 * getPackageFromMetadata and pass it in, rather than parsing every entry's UUID.
 * @param {object} source - The source data to fill in (book, custom, label, value)
 * @param {object|null} pkg - The package the document's compendium belongs to
 */
export function enrichSource(source, pkg) {
    if ( !source.book ) {
        source.book = getModuleBook(pkg) ?? "";
    }

    if ( source.custom ) {
        source.label = source.custom;
    }
    else {
        source.label = source.book;
    }

    source.value = source.book || (pkg?.title ?? "");
}
