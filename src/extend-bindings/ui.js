/**
 * WordPress dependencies
 */
import {
	InspectorControls,
	store as blockEditorStore,
	useBlockBindingsUtils,
	useBlockEditContext,
} from '@wordpress/block-editor';
import {
	getBlockBindingsSource,
	getBlockBindingsSources,
} from '@wordpress/blocks';
import {
	Modal,
	__experimentalItemGroup as ItemGroup,
	__experimentalItem as Item,
	__experimentalText as Text,
	__experimentalToolsPanel as ToolsPanel,
	__experimentalToolsPanelItem as ToolsPanelItem,
	__experimentalVStack as VStack,
} from '@wordpress/components';
import {
	createHigherOrderComponent,
	useViewportMatch,
} from '@wordpress/compose';
import { useSelect } from '@wordpress/data';
import { DataViews, filterSortAndPaginate } from '@wordpress/dataviews/wp';
import { useMemo, useState } from '@wordpress/element';
import { addFilter } from '@wordpress/hooks';
import { __ } from '@wordpress/i18n';
import { __dangerousOptInToUnstableAPIsOnlyForCoreModules } from '@wordpress/private-apis';

import { getBindableAttributes, canBindAttribute } from './utils';

const EMPTY_OBJECT = {};

const useToolsPanelDropdownMenuProps = () => {
	const isMobile = useViewportMatch( 'medium', '<' );
	return ! isMobile
		? {
				popoverProps: {
					placement: 'left-start',
					// For non-mobile, inner sidebar width (248px) - button width (24px) - border (1px) + padding (16px) + spacing (20px)
					offset: 259,
				},
		  }
		: {};
};

function DataViewsModal( { clientId, attribute, context } ) {
	const { updateBlockBindings } = useBlockBindingsUtils( clientId );
	const defaultLayouts = {
		table: {
			layout: {
				primaryField: 'source',
				styles: {
					source: {
						minWidth: 320,
					},
					label: {
						minWidth: 320,
					},
					value: {
						width: '50%',
						minWidth: 320,
					},
				},
			},
		},
	};
	const [ view, setView ] = useState( {
		type: 'table',
		search: '',
		filters: [],
		page: 1,
		perPage: 10,
		sort: { field: 'source', direction: 'asc' },
		fields: [ 'source', 'label', 'value' ],
		layout: defaultLayouts.table.layout,
	} );
	const fields = [
		{
			id: 'source',
			label: __( 'Source' ),
			type: 'text',
			enableGlobalSearch: true,
		},
		{
			id: 'label',
			label: __( 'Label' ),
			type: 'text',
			enableGlobalSearch: true,
		},
		{
			id: 'value',
			label: __( 'Value' ),
			type: 'text',
			enableGlobalSearch: true,
		},
	];
	// TODO: Build the data array with the registered sources.
	const { data } = useSelect(
		( select ) => {
			const _data = [];
			const registeredSources = getBlockBindingsSources();
			// Iterate through each source in the sources object
			for ( const [ sourceName, sourceProps ] of Object.entries(
				registeredSources
			) ) {
				if ( sourceProps.getFieldsList ) {
					const sourceFields = sourceProps.getFieldsList( {
						select,
						context,
					} );
					for ( const [ fieldId, fieldProps ] of Object.entries(
						sourceFields
					) ) {
						_data.push( {
							id: sourceName + '// ' + fieldId,
							source: registeredSources[ sourceName ].label,
							label: fieldProps.label,
							value: fieldProps.value,
						} );
					}
				}
			}

			return {
				data: _data,
			};
		},
		[ context ]
	);
	const { data: shownData, paginationInfo } = useMemo( () => {
		return filterSortAndPaginate( data, view, fields );
	}, [ view ] );
	return (
		<DataViews
			getItemId={ ( item ) => item.id.toString() }
			paginationInfo={ paginationInfo }
			data={ shownData }
			view={ view }
			fields={ fields }
			onChangeView={ setView }
			// TODO: Check if we can use this in the table view.
			onClickItem={ ( item ) => {
				updateBlockBindings( {
					[ attribute ]: {
						source: item.source,
						args: item.args,
					},
				} );
			} }
			isItemClickable={ () => true }
			defaultLayouts={ defaultLayouts }
		/>
	);
}

function BlockBindingsAttribute( { attribute, binding, fieldsList } ) {
	const { source: sourceName, args } = binding || {};
	const sourceProps = getBlockBindingsSource( sourceName );
	const isSourceInvalid = ! sourceProps;
	return (
		<VStack className="block-editor-bindings__item" spacing={ 0 }>
			<Text truncate>{ attribute }</Text>
			{ !! binding && (
				<Text
					truncate
					variant={ ! isSourceInvalid && 'muted' }
					isDestructive={ isSourceInvalid }
				>
					{ isSourceInvalid
						? __( 'Invalid source' )
						: fieldsList?.[ sourceName ]?.[ args?.key ]?.label ||
						  sourceProps?.label ||
						  sourceName }
				</Text>
			) }
		</VStack>
	);
}

function ReadOnlyBlockBindingsPanelItems( { bindings, fieldsList } ) {
	return (
		<>
			{ Object.entries( bindings ).map( ( [ attribute, binding ] ) => (
				<Item key={ attribute }>
					<BlockBindingsAttribute
						attribute={ attribute }
						binding={ binding }
						fieldsList={ fieldsList }
					/>
				</Item>
			) ) }
		</>
	);
}

function EditableBlockBindingsPanelItems( {
	attributes,
	bindings,
	fieldsList,
	context,
} ) {
	const { updateBlockBindings } = useBlockBindingsUtils();
	const { clientId } = useBlockEditContext();
	const [ modalData, setModalData ] = useState( null );
	return (
		<>
			{ attributes.map( ( attribute ) => {
				const binding = bindings[ attribute ];
				return (
					<ToolsPanelItem
						key={ attribute }
						hasValue={ () => !! binding }
						label={ attribute }
						onDeselect={ () => {
							updateBlockBindings( {
								[ attribute ]: undefined,
							} );
						} }
					>
						<Item
							onClick={ () => {
								setModalData( { clientId, attribute } );
							} }
						>
							<BlockBindingsAttribute
								attribute={ attribute }
								binding={ binding }
								fieldsList={ fieldsList }
							/>
						</Item>
					</ToolsPanelItem>
				);
			} ) }
			{ modalData && (
				<Modal
					onRequestClose={ () => setModalData( null ) }
					__experimentalHideHeader
					className="extending-block-bindings__modal"
				>
					<DataViewsModal
						clientId={ modalData?.clientId }
						attribute={ modalData?.attribute }
						context={ context }
					/>
				</Modal>
			) }
		</>
	);
}

function BlockBindingsPanel( { name: blockName, attributes, context } ) {
	const { metadata } = attributes;
	const { removeAllBlockBindings } = useBlockBindingsUtils();
	const bindableAttributes = getBindableAttributes( blockName );
	const dropdownMenuProps = useToolsPanelDropdownMenuProps();

	// `useSelect` is used purposely here to ensure `getFieldsList`
	// is updated whenever there are updates in block context.
	// `source.getFieldsList` may also call a selector via `select`.
	const _fieldsList = {};
	const { fieldsList, canUpdateBlockBindings } = useSelect(
		( select ) => {
			if ( ! bindableAttributes || bindableAttributes.length === 0 ) {
				return EMPTY_OBJECT;
			}
			const registeredSources = getBlockBindingsSources();
			Object.entries( registeredSources ).forEach(
				( [ sourceName, { getFieldsList, usesContext } ] ) => {
					if ( getFieldsList ) {
						const sourceList = getFieldsList( {
							select,
							context,
						} );
						// Only add source if the list is not empty.
						if ( Object.keys( sourceList || {} ).length ) {
							_fieldsList[ sourceName ] = { ...sourceList };
						}
					}
				}
			);
			return {
				fieldsList:
					Object.values( _fieldsList ).length > 0
						? _fieldsList
						: EMPTY_OBJECT,
				canUpdateBlockBindings:
					select( blockEditorStore ).getSettings()
						.canUpdateBlockBindings,
			};
		},
		[ context, bindableAttributes ]
	);
	// Return early if there are no bindable attributes.
	if ( ! bindableAttributes || bindableAttributes.length === 0 ) {
		return null;
	}
	// Filter bindings to only show bindable attributes and remove pattern overrides.
	const { bindings } = metadata || {};
	const filteredBindings = { ...bindings };
	Object.keys( filteredBindings ).forEach( ( key ) => {
		if (
			! canBindAttribute( blockName, key ) ||
			filteredBindings[ key ].source === 'core/pattern-overrides'
		) {
			delete filteredBindings[ key ];
		}
	} );

	// Lock the UI when the user can't update bindings or there are no fields to connect to.
	const readOnly =
		! canUpdateBlockBindings || ! Object.keys( fieldsList ).length;

	if ( readOnly && Object.keys( filteredBindings ).length === 0 ) {
		return null;
	}

	return (
		<InspectorControls group="bindings">
			<ToolsPanel
				label={ __( 'Attributes' ) }
				resetAll={ () => {
					removeAllBlockBindings();
				} }
				dropdownMenuProps={ dropdownMenuProps }
				className="extending-block-bindings__panel"
			>
				<ItemGroup isBordered isSeparated>
					{ readOnly ? (
						<ReadOnlyBlockBindingsPanelItems
							bindings={ filteredBindings }
							fieldsList={ fieldsList }
						/>
					) : (
						<EditableBlockBindingsPanelItems
							attributes={ bindableAttributes }
							bindings={ filteredBindings }
							fieldsList={ fieldsList }
							context={ context }
						/>
					) }
				</ItemGroup>
				{ /*
                    Use a div element to make the ToolsPanelHiddenInnerWrapper
                    toggle the visibility of this help text automatically.
                */ }
				<Text as="div" variant="muted">
					<p>
						{ __(
							'Attributes connected to custom fields or other dynamic data.'
						) }
					</p>
				</Text>
			</ToolsPanel>
		</InspectorControls>
	);
}

const withInspectorControls = createHigherOrderComponent( ( BlockEdit ) => {
	return ( props ) => {
		return (
			<>
				<BlockEdit { ...props } />
				<BlockBindingsPanel { ...props } />
			</>
		);
	};
}, 'withInspectorControls' );

addFilter(
	'editor.BlockEdit',
	'my-plugin/add-inspector-controls',
	withInspectorControls
);
