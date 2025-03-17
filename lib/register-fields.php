<?php
/**
 * Register testing custom fields for development.
 */
register_meta(
	'post',
	'text_custom_field',
	array(
		'show_in_rest'      => true,
		'single'            => true,
		'type'              => 'string',
		'default'           => 'Text field value',
		'label'             => 'Text field label',
		'revisions_enabled' => true,
	)
);
register_meta(
	'post',
	'url_custom_field',
	array(
		'show_in_rest' => true,
		'single'       => true,
		'type'         => 'string',
		'default'      => 'https://wpmovies.dev/wp-content/uploads/2023/04/goncharov-poster-original-1-682x1024.jpeg',
		'label'        => 'URL field label',
	)
);
