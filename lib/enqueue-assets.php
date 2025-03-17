<?php
/**
 * Enqueue editor scripts to extend bindings.
 */
function enqueue_ebb_editor_scripts() {
	$assets = include plugin_dir_path( __DIR__ ) . 'build/extend-bindings.asset.php';
	wp_enqueue_style(
		'ebb-editor-styles',
		plugin_dir_url( __DIR__ ) . 'build/extend-bindings.css',
		array(),
		$assets['version'],
	);
	wp_enqueue_script(
		'ebb-editor-scripts',
		plugin_dir_url( __DIR__ ) . 'build/extend-bindings.js',
		$assets['dependencies'],
		$assets['version'],
	);
}
add_action( 'enqueue_block_editor_assets', 'enqueue_ebb_editor_scripts' );
