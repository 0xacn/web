import { useState, useMemo, useCallback, SetStateAction, useRef } from 'react'

import PerformanceRating from '../../../models/PerformanceRating'
import { sleep } from '../../../utils'
import deck from '../../../data/preview.json'

export interface PreviewSection {
	id: string
	name: string
	index: number
	numberOfCards: number
}

export interface PreviewCard {
	id: string
	sectionId: string
	front: string
	back: string
	forgotCount?: number
}

/** `null` - Immediately after */
export interface PreviewPredictions {
	[PerformanceRating.Easy]: Date | null
	[PerformanceRating.Struggled]: Date | null
	[PerformanceRating.Forgot]: Date | null
}

export interface PreviewProgressData {
	rating: PerformanceRating
	next: Date | null
	emoji: string
	message: string
}

export type CardSide = 'front' | 'back'

const DEFAULT_EASY_INTERVAL = 1000 * 60 * 60 * 24 * 2
const DEFAULT_STRUGGLED_INTERVAL = 1000 * 60 * 60 * 24

const FLIP_ANIMATION_DURATION = 300
const PROGRESS_MODAL_SHOW_DURATION = 1000

const getPredictionMultiplier = (multiplier: number, rating: PerformanceRating) => {
	switch (rating) {
		case PerformanceRating.Easy:
			return multiplier + 0.1
		case PerformanceRating.Struggled:
			return multiplier + 0.05
		case PerformanceRating.Forgot:
			return multiplier - 0.15
	}
}

const getRandomPredictionMultiplier = () =>
	1 + Math.random() * 0.5 - 0.25

const getProgressDataForRating = (rating: PerformanceRating) => {
	switch (rating) {
		case PerformanceRating.Easy:
			return {
				emoji: '🥳',
				message: 'You\'re doing great!'
			}
		case PerformanceRating.Struggled:
			return {
				emoji: '🧐',
				message: 'You\'ll see this again soon!'
			}
		case PerformanceRating.Forgot:
			return {
				emoji: '🤕',
				message: 'Better luck next time!'
			}
	}
}

export default () => {
	const [cards, setCards] = useState(deck.cards as PreviewCard[])
	
	const [cardClassName, setCardClassName] = useState(undefined as string | undefined)
	const [currentSide, setCurrentSide] = useState('front' as CardSide)
	const [isWaitingForRating, setIsWaitingForRating] = useState(false)
	
	const [isProgressModalShowing, setIsProgressModalShowing] = useState(false)
	const [progressData, _setProgressData] = useState(null as PreviewProgressData | null)
	
	const [predictionMultiplier, setPredictionMultiplier] = useState(1)
	
	const card = useMemo(() => (
		cards.length ? cards[0] : null
	), [cards])
	
	const nextCard = useMemo(() => (
		cards.length > 1 ? cards[1] : null
	), [cards])
	
	const section = useMemo(() => (
		card && (deck.sections as Record<string, PreviewSection>)[card.sectionId]
	), [card])
	
	const predictions: PreviewPredictions | null = useMemo(() => {
		if (!card)
			return null
		
		const now = Date.now()
		const reducer = (card.forgotCount ?? 0) + 1
		
		const getDate = (interval: number) =>
			new Date(
				now + interval * predictionMultiplier * getRandomPredictionMultiplier() / reducer
			)
		
		return {
			[PerformanceRating.Easy]: getDate(DEFAULT_EASY_INTERVAL),
			[PerformanceRating.Struggled]: getDate(DEFAULT_STRUGGLED_INTERVAL),
			[PerformanceRating.Forgot]: null
		}
	}, [card, predictionMultiplier])
	
	const setProgressData = useCallback(async (data: PreviewProgressData) => {
		_setProgressData(data)
		setIsProgressModalShowing(true)
		
		await sleep(PROGRESS_MODAL_SHOW_DURATION)
		
		setIsProgressModalShowing(false)
	}, [_setProgressData, setIsProgressModalShowing])
	
	const transitionSetCurrentSide = useCallback(async (side: SetStateAction<CardSide>) => {
		setCardClassName('flip')
		
		await sleep(FLIP_ANIMATION_DURATION / 2)
		setCurrentSide(side)
		await sleep(FLIP_ANIMATION_DURATION / 2)
		
		setCardClassName(undefined)
	}, [setCardClassName, setCurrentSide])
	
	const transitionNext = useCallback((addToBack: boolean) => {
		// TODO: Transition next
	}, [])
	
	const waitForRating = useCallback(async () => {
		if (isWaitingForRating || isProgressModalShowing || !cards.length)
			return
		
		setIsWaitingForRating(true)
		transitionSetCurrentSide('back')
	}, [isWaitingForRating, isProgressModalShowing, cards, setIsWaitingForRating, transitionSetCurrentSide])
	
	const flip = useCallback(() => {
		transitionSetCurrentSide(side =>
			side === 'front' ? 'back' : 'front'
		)
	}, [transitionSetCurrentSide])
	
	const rate = useCallback(async (rating: PerformanceRating) => {
		if (!(card && predictions))
			return
		
		setIsWaitingForRating(false)
		setPredictionMultiplier(multiplier =>
			getPredictionMultiplier(multiplier, rating)
		)
		
		setProgressData({
			rating,
			next: predictions[rating],
			...getProgressDataForRating(rating)
		})
		
		const didForget = rating === PerformanceRating.Forgot
		
		if (didForget)
			card.forgotCount = (card.forgotCount ?? 0) + 1
		
		transitionNext(didForget)
	}, [card, predictions, setIsWaitingForRating, setPredictionMultiplier, setProgressData, transitionNext])
	
	return {
		cardsRemaining: cards.length,
		currentSide,
		isWaitingForRating,
		deck,
		section,
		card,
		nextCard,
		predictions,
		waitForRating,
		flip,
		rate
	}
}
