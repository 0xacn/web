import React, { memo } from 'react'
import cx from 'classnames'

import PerformanceRating from '../../../models/PerformanceRating'
import RateButton from './RateButton'

const CramFooter = (
	{ isWaitingForRating, rate }: {
		isWaitingForRating: boolean
		rate: (rating: PerformanceRating) => void
	}
) => (
	<footer className={cx({ 'waiting-for-rating': isWaitingForRating })}>
		<p className="message" tabIndex={-1}>
			Tap anywhere to continue
		</p>
		<div className="buttons" tabIndex={-1}>
			<RateButton
				emoji="😀"
				title="Easy"
				rate={rate}
				rating={PerformanceRating.Easy}
			/>
			<RateButton
				emoji="😕"
				title="Struggled"
				rate={rate}
				rating={PerformanceRating.Struggled}
			/>
			<RateButton
				emoji="😓"
				title="Forgot"
				rate={rate}
				rating={PerformanceRating.Forgot}
			/>
		</div>
	</footer>
)

export default memo(CramFooter)
