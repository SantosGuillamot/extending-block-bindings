<?php
/**
 * Enqueue editor scripts to extend bindings.
 */
function enqueue_ebb_editor_scripts() {
	$assets = include plugin_dir_path( __DIR__ ) . 'build/index.asset.php';
	wp_enqueue_style(
		'ebb-editor-styles',
		plugin_dir_url( __DIR__ ) . 'build/index.css',
		array(),
		$assets['version'],
	);
}
add_action( 'enqueue_block_editor_assets', 'enqueue_ebb_editor_scripts' );
