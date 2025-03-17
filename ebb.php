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

require 'lib/enqueue-assets.php';
require 'lib/register-fields.php';
require 'lib/server-processing.php';

/**
 * Auto register all blocks found in the `build/blocks` folder.
 */
function auto_register_block_types() {
	if ( file_exists( __DIR__ . '/build/blocks/' ) ) {
		$block_json_files = glob( __DIR__ . '/build/blocks/*/block.json' );

		// auto register all blocks that were found.
		foreach ( $block_json_files as $filename ) {
			$block_folder = dirname( $filename );
			register_block_type( $block_folder );
		};
	};
}
add_action( 'init', 'auto_register_block_types' );
