import { __ } from '@wordpress/i18n';
import { RichText, useBlockProps } from '@wordpress/block-editor';

export default function Edit( { attributes, setAttributes } ) {
	const { content } = attributes;
	const blockProps = useBlockProps();

	return (
		<RichText
			identifier="content"
			tagName="p"
			{ ...blockProps }
			value={ content }
			onChange={ ( newContent ) =>
				setAttributes( { content: newContent } )
			}
			aria-label={
				RichText.isEmpty( content )
					? __(
							'Empty block; start writing or type forward slash to choose a block'
					  )
					: __( 'Block: Testing static' )
			}
			data-empty={ RichText.isEmpty( content ) }
			placeholder={ __( 'Type to fill the block' ) }
			__unstableEmbedURLOnPaste
			__unstableAllowPrefixTransformations
		/>
	);
}
