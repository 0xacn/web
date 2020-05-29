import React, { useEffect, useContext } from 'react'
import { useRouter } from 'next/router'
import cx from 'classnames'

import Dashboard, { DashboardNavbarSelection as Selection } from '..'
import Deck from 'models/Deck'
import LoadingState from 'models/LoadingState'
import DeckImageUrlsContext from 'context/DeckImageUrls'
import requiresAuth from 'hooks/requiresAuth'
import useSelectedDeck from 'hooks/useSelectedDeck'
import useDecks from 'hooks/useDecks'
import Head, { APP_DESCRIPTION } from 'components/shared/Head'
import Header from './Header'
import Sections from './Sections'
import Loader from 'components/shared/Loader'

import '../../../scss/components/Dashboard/Decks.scss'

export default () => {
	requiresAuth()
	
	const [imageUrls] = useContext(DeckImageUrlsContext)
	
	const router = useRouter()
	const { slugId, slug } = router.query as {
		slugId?: string
		slug?: string
	}
	
	const [selectedDeck, setSelectedDeck] = useSelectedDeck()
	const [decks, decksLoadingState] = useDecks()
	
	useEffect(() => {
		if (!slugId && selectedDeck)
			router.replace(
				'/decks/[slugId]/[slug]',
				`/decks/${selectedDeck.slugId}/${selectedDeck.slug}`
			)
	}, [slugId, selectedDeck]) // eslint-disable-line
	
	useEffect(() => {
		if (
			!(slugId && slug) ||
			selectedDeck?.slugId === slugId ||
			decksLoadingState !== LoadingState.Success
		)
			return
		
		const deck = decks.find(deck => deck.slugId === slugId)
		
		deck
			? setSelectedDeck(deck)
			: router.replace(
				'/d/[slugId]/[slug]',
				`/d/${slugId}/${slug}`
			)
	}, [slugId, slug, selectedDeck, decksLoadingState, decks]) // eslint-disable-line
	
	return (
		<Dashboard selection={Selection.Decks} className="decks">
			<Head
				title={
					`${selectedDeck
							? `${selectedDeck.name} | `
							: ''
					}My decks | memorize.ai`
				}
				description={
					`${selectedDeck
						? `${selectedDeck.name} - `
						: ''
					}My decks on memorize.ai. ${APP_DESCRIPTION}`
				}
				breadcrumbs={[
					[
						{
							name: 'Decks',
							url: window.location.href
						}
					]
				]}
				schemaItems={[
					{
						'@type': 'IndividualProduct',
						productID: selectedDeck?.slugId ?? '...',
						image: (selectedDeck && imageUrls[selectedDeck.id]?.url) ?? Deck.DEFAULT_IMAGE_URL,
						name: selectedDeck?.name ?? 'Deck',
						description: selectedDeck?.description ?? '',
						url: selectedDeck?.urlWithOrigin ?? 'https://memorize.ai',
						aggregateRating: {
							'@type': 'AggregateRating',
							ratingValue: selectedDeck?.averageRating ?? 0,
							reviewCount: selectedDeck?.numberOfRatings || 1,
							worstRating: selectedDeck?.worstRating ?? 0,
							bestRating: selectedDeck?.bestRating ?? 0
						}
					}
				]}
			/>
			<Header deck={selectedDeck} />
			<div className="content">
				<div className={cx('box', { loading: !selectedDeck })}>
					{selectedDeck
						? <Sections deck={selectedDeck} />
						: <Loader size="24px" thickness="4px" color="#582efe" />
					}
				</div>
			</div>
		</Dashboard>
	)
}
