<?php
/**
 * Hooks necessary to process block bindings in the server.
 */
require 'html-api/class-ebb-html-tag-processor.php';
require 'html-api/class-ebb-html-processor.php';
require 'html-api/class-ebb-css-selectors.php';

$supported_block_attributes = array(
	'core/image' => array( 'caption', 'href' ),
);

/**
 * Extends block uses_context.
 *
 * @param array $metadata Block metadata.
 */
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

function process_block_bindings( $block ) {
	global $supported_block_attributes;
	$parsed_block        = $block->parsed_block;
	$computed_attributes = array();

	// If the block doesn't have the bindings property, isn't one of the supported
	// block types, or the bindings property is not an array, return the block content.
	if (
		! isset( $supported_block_attributes[ $block->name ] ) ||
		empty( $parsed_block['attrs']['metadata']['bindings'] ) ||
		! is_array( $parsed_block['attrs']['metadata']['bindings'] )
	) {
		return $computed_attributes;
	}

	$bindings = $parsed_block['attrs']['metadata']['bindings'];

	/*
	 * If the default binding is set for pattern overrides, replace it
	 * with a pattern override binding for all supported attributes.
	 */
	if (
		isset( $bindings['__default']['source'] ) &&
		'core/pattern-overrides' === $bindings['__default']['source']
	) {
		$updated_bindings = array();

		/*
		 * Build a binding array of all supported attributes.
		 * Note that this also omits the `__default` attribute from the
		 * resulting array.
		 */
		foreach ( $supported_block_attributes[ $parsed_block['blockName'] ] as $attribute_name ) {
			// Retain any non-pattern override bindings that might be present.
			$updated_bindings[ $attribute_name ] = isset( $bindings[ $attribute_name ] )
				? $bindings[ $attribute_name ]
				: array( 'source' => 'core/pattern-overrides' );
		}
		$bindings = $updated_bindings;
		/*
		 * Update the bindings metadata of the computed attributes.
		 * This ensures the block receives the expanded __default binding metadata when it renders.
		 */
		$computed_attributes['metadata'] = array_merge(
			$parsed_block['attrs']['metadata'],
			array( 'bindings' => $bindings )
		);
	}

	foreach ( $bindings as $attribute_name => $block_binding ) {
		// If the attribute is not in the supported list, process next attribute.
		if ( ! in_array( $attribute_name, $supported_block_attributes[ $block->name ], true ) ) {
			continue;
		}
		// If no source is provided, or that source is not registered, process next attribute.
		if ( ! isset( $block_binding['source'] ) || ! is_string( $block_binding['source'] ) ) {
			continue;
		}

		$block_binding_source = get_block_bindings_source( $block_binding['source'] );
		if ( null === $block_binding_source ) {
			continue;
		}

		$source_args  = ! empty( $block_binding['args'] ) && is_array( $block_binding['args'] ) ? $block_binding['args'] : array();
		$source_value = $block_binding_source->get_value( $source_args, $block, $attribute_name );

		// If the value is not null, process the HTML based on the block and the attribute.
		if ( ! is_null( $source_value ) ) {
			$computed_attributes[ $attribute_name ] = $source_value;
		}
	}

	return $computed_attributes;
}

function replace_html( string $block_content, string $attribute_name, $source_value, $block_type ) {
	if ( ! isset( $block_type->attributes[ $attribute_name ]['source'] ) ) {
		return $block_content;
	}

	$block_reader = EBB_HTML_Processor::create_fragment( $block_content );
	$selector     = $block_type->attributes[ $attribute_name ]['selector'];
	// Depending on the attribute source, the processing will be different.
	switch ( $block_type->attributes[ $attribute_name ]['source'] ) {
		case 'html':
		case 'rich-text':
			if ( $block_reader->select( $selector ) ) {
				$block_reader->set_inner_html( wp_kses_post( $source_value ) );
			}
			return $block_reader->get_updated_html();
		case 'attribute':
			if ( $block_reader->select( $selector ) ) {
				$block_reader->set_attribute( $block_type->attributes[ $attribute_name ]['attribute'], $source_value );
			}
			return $block_reader->get_updated_html();

		default:
			return $block_content;
	}
}


// Update the block content of static blocks.
function ebb_update_static_blocks( $block_content, $parsed_block, $block ) {
	// Get value from bindings.
	$computed_attributes = process_block_bindings( $block );

	// Replace HTML if needed.
	$registry   = WP_Block_Type_Registry::get_instance();
	$block_type = $registry->get_registered( $parsed_block['blockName'] );
	if ( ! empty( $computed_attributes ) && ! empty( $block_content ) ) {
		foreach ( $computed_attributes as $attribute_name => $source_value ) {
			$block_content = replace_html( $block_content, $attribute_name, $source_value, $block_type );
		}
	}
	return $block_content;
}
add_filter( 'render_block', 'ebb_update_static_blocks', 10, 3 );

