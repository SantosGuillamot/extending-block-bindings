<?php
/**
 * Plugin Name:       Extending Block Bindings
 * Version:           0.1.0
 * Requires at least: 6.7
 * Requires PHP:      7.4
 * Description:       Experimental plugin that extend core block bindings API.
 * Author:            Automattic
 * License:           GPL-3.0-or-later
 * License URI:       https://www.gnu.org/licenses/gpl-3.0.html
 * Text Domain:       ebb
 */

$supported_block_attributes = array(
	'core/image' => array( 'caption' ),
);

// Extend block uses_context.
function ebb_extend_block_uses_context( $metadata ) {
	global $supported_block_attributes;
	if ( array_key_exists( $metadata['name'], $supported_block_attributes ) ) {
		$registered_sources = get_all_registered_block_bindings_sources();
		if ( ! empty( $registered_sources ) ) {
			foreach ( $registered_sources as $source ) {
				if ( $source->uses_context ) {
					$metadata['usesContext'] = array_unique( array_merge( $metadata['usesContext'], $source->uses_context ) );
				}
			}
		}
	}
	return $metadata;
}
add_filter( 'block_type_metadata', 'ebb_extend_block_uses_context' );
