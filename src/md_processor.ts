import {
	Plugin,
	MarkdownPostProcessor,
	MarkdownPostProcessorContext,
	MarkdownRenderChild
} from 'obsidian';


export function captionObserver( plugin: Plugin ) {

	return new MutationObserver( ( mutations, observer ) => {
		for ( const mutation of mutations ) {
			if ( !mutation.target.matches( 'span.image-embed' ) ) {
				return;
			}

			const caption_text = mutation.target.getAttribute( 'alt' );
			if ( caption_text === mutation.target.getAttribute( 'src' ) ) {
				// default caption, skip
				return;
			}

			if ( mutation.target.querySelector( plugin.caption_selector ) ) {
				// caption already added
				return;
			}

			addCaption( mutation.target, caption_text, plugin );
			updateFigureIndices( plugin );
		}  // end for..of

		plugin.removeObserver( observer );
	} );
}


function addCaption(
	target: HTMLElement,
	caption_text: string,
	plugin: Plugin
): HTMLElement {
	const caption = document.createElement( plugin.caption_tag );
	caption.addClass( plugin.caption_class );
	caption.innerText = caption_text;
	target.appendChild( caption );

	return caption;
}


function updateFigureIndices( plugin: Plugin ) {
	document.querySelectorAll( 'div.workspace-leaf' ).forEach(
		( container : HTMLElement ) => {
			let index = 1;
			container.querySelectorAll( plugin.caption_selector ).forEach(
				( el: HTMLElement ) => {
					el.dataset.imageCaptionIndex = index;
					index += 1;
				}
			);
		}
	);
}


export function processImageCaption(
	plugin: Plugin
): ( el: HTMLElement, ctx: MarkdownPostProcessorContext ) => void {

	return function (
		el: HTMLElement,
		ctx: MarkdownPostProcessorContext
	): void {
		el.querySelectorAll( 'span.internal-embed' ).forEach(
			( container: HTMLElement ) => {
				// must listen for class changes because images
				// may be loaded after this run
				const observer = captionObserver( plugin );
				observer.observe(
					container,
					{ attributes: true, attributesFilter: [ 'class' ] }
				);

				plugin.addObserver( observer );
			}
		);
	};
}