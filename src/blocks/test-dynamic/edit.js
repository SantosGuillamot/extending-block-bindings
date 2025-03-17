import { __ } from '@wordpress/i18n';
import { useBlockProps } from '@wordpress/block-editor';

export default function Edit( { attributes } ) {
	const { content } = attributes;
	const blockProps = useBlockProps();

	return (
		<div { ...blockProps }>
			<span dangerouslySetInnerHTML={ { __html: content } } />
		</div>
	);
}
