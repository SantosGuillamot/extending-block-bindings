// TODO: Add proper opt-in mechanism.
export const BLOCK_BINDINGS_ALLOWED_BLOCKS = {
	'ebb/test-static': [ 'content' ],
	'ebb/test-dynamic': [ 'content' ],
	'core/image': [ 'url', 'caption', 'href' ],
};
/**
 * Based on the given block name, checks if it is possible to bind the block.
 *
 * @param {string} blockName The name of the block.
 *
 * @return {boolean} Whether it is possible to bind the block to sources.
 */
export function canBindBlock( blockName ) {
	return blockName in BLOCK_BINDINGS_ALLOWED_BLOCKS;
}

/**
 * Based on the given block name and attribute name, checks if it is possible to bind the block attribute.
 *
 * @param {string} blockName     The name of the block.
 * @param {string} attributeName The name of attribute.
 *
 * @return {boolean} Whether it is possible to bind the block attribute.
 */
export function canBindAttribute( blockName, attributeName ) {
	return (
		canBindBlock( blockName ) &&
		BLOCK_BINDINGS_ALLOWED_BLOCKS[ blockName ].includes( attributeName )
	);
}

/**
 * Gets the bindable attributes for a given block.
 *
 * @param {string} blockName The name of the block.
 *
 * @return {string[]} The bindable attributes for the block.
 */
export function getBindableAttributes( blockName ) {
	return BLOCK_BINDINGS_ALLOWED_BLOCKS[ blockName ];
}
