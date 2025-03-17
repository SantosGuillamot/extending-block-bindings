import { RichText, useBlockProps } from '@wordpress/block-editor';

export default function save( { attributes } ) {
	const { content } = attributes;

	return (
		<p { ...useBlockProps.save() }>
			<RichText.Content value={ content } />
		</p>
	);
}
