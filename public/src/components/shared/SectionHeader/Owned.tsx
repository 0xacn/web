import React, { useState, useCallback, memo } from 'react'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faUnlock, faLock, faEllipsisV, faAngleUp, faAngleDown, faTrash } from '@fortawesome/free-solid-svg-icons'
import cx from 'classnames'

import Deck from '../../../models/Deck'
import Section from '../../../models/Section'
import useCurrentUser from '../../../hooks/useCurrentUser'
import ToggleExpandedButton from './ToggleExpandedButton'
import Dropdown, { DropdownShadow } from '../Dropdown'
import { formatNumber } from '../../../utils'

import { ReactComponent as ShareIcon } from '../../../images/icons/share.svg'
import { ReactComponent as PencilIcon } from '../../../images/icons/pencil.svg'

import '../../../scss/components/SectionHeader/Owned.scss'

const OwnedSectionHeader = memo((
	{ deck, section, isExpanded, toggleExpanded, onUnlock, onRename, onDelete, onShare, numberOfSections, reorder }: {
		deck: Deck
		section: Section
		isExpanded: boolean
		toggleExpanded: () => void
		onUnlock: () => void
		onRename: () => void
		onDelete: () => void
		onShare: () => void
		numberOfSections: number
		reorder: (delta: number) => void
	}
) => {
	const [currentUser] = useCurrentUser()
	
	const [isHoveringLock, setIsHoveringLock] = useState(false)
	const [degrees, setDegrees] = useState(0)
	const [isOptionsDropdownShowing, setIsOptionsDropdownShowing] = useState(false)
	
	const isUnlocked = deck.isSectionUnlocked(section)
	const numberOfDueCards = deck.numberOfCardsDueForSection(section)
	const isOwner = deck.creatorId === currentUser?.id
	
	const canReorderUp = section.index > 0
	const canReorderDown = section.index < numberOfSections - 1
	
	const onClick = useCallback(() => {
		toggleExpanded()
		setDegrees(degrees => degrees + 180)
	}, [toggleExpanded, setDegrees])
	
	return (
		<div
			className={cx('section-header', 'owned', { due: numberOfDueCards > 0 })}
			onClick={onClick}
		>
			{isUnlocked || (
				<button
					className="unlock"
					onClick={event => {
						event.stopPropagation()
						onUnlock()
					}}
					onMouseEnter={() => setIsHoveringLock(true)}
					onMouseLeave={() => setIsHoveringLock(false)}
				>
					<FontAwesomeIcon icon={isHoveringLock ? faUnlock : faLock} />
				</button>
			)}
			{isOwner && !section.isUnsectioned && (canReorderUp || canReorderDown) && (
				<div className="reorder">
					{canReorderUp && (
						<button onClick={event => {
							event.stopPropagation()
							reorder(-1)
						}}>
							<FontAwesomeIcon icon={faAngleUp} />
						</button>
					)}
					{canReorderDown && (
						<button onClick={event => {
							event.stopPropagation()
							reorder(1)
						}}>
							<FontAwesomeIcon icon={faAngleDown} />
						</button>
					)}
				</div>
			)}
			<div className="name">
				<p>{section.name}</p>
				{numberOfDueCards > 0 && (
					<p className="badge">
						{formatNumber(numberOfDueCards)} due
					</p>
				)}
			</div>
			<div className="divider" />
			<p className="card-count">
				({formatNumber(section.numberOfCards)} card{section.numberOfCards === 1 ? '' : 's'})
			</p>
			<ToggleExpandedButton degrees={degrees}>
				{isExpanded}
			</ToggleExpandedButton>
			{section.isUnsectioned || (
				<>
					<button
						className="share"
						onClick={event => {
							event.stopPropagation()
							onShare()
						}}
					>
						<ShareIcon />
					</button>
					{(isOwner || !isUnlocked) && (
						<Dropdown
							className="options"
							shadow={DropdownShadow.Around}
							trigger={<FontAwesomeIcon icon={faEllipsisV} />}
							isShowing={isOptionsDropdownShowing}
							setIsShowing={setIsOptionsDropdownShowing}
						>
							{isUnlocked || (
								<button
									onClick={onUnlock}
									onMouseEnter={() => setIsHoveringLock(true)}
									onMouseLeave={() => setIsHoveringLock(false)}
								>
									<FontAwesomeIcon
										icon={isHoveringLock ? faUnlock : faLock}
										className="unlock"
									/>
									<p>Unlock</p>
								</button>
							)}
							{isOwner && !isUnlocked && (
								<div className="divider" />
							)}
							{isOwner && (
								<>
									<button onClick={onRename}>
										<PencilIcon className="rename" />
										<p>Rename</p>
									</button>
									<button onClick={onDelete}>
										<FontAwesomeIcon icon={faTrash} className="delete" />
										<p>Delete</p>
									</button>
								</>
							)}
						</Dropdown>
					)}
				</>
			)}
		</div>
	)
})

export default OwnedSectionHeader
