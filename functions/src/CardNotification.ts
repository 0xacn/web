import * as functions from 'firebase-functions'
import * as admin from 'firebase-admin'

import User from './User'
import Deck from './Deck'
import Card from './Card'
import Notification from './Notification'

const LAST_NOTIFICATION_DIFFERENCE = 86400000

const firestore = admin.firestore()

type UserNotificationData = { uid: string, tokens: string[], decksDue: number, cardsDue: number }

export const sendDueCardNotifications = functions.pubsub.schedule('every 15 minutes').onRun(_context => {
	const now = Date.now()
	return firestore.collection('users').get().then(users =>
		Promise.all(users.docs.map(user =>
			getUser(user, now).then(userDetails =>
				userDetails.cardsDue
					? User.updateLastNotification(user.id).then(_writeResult =>
						userDetails
					)
					: userDetails
			)
		))
	).then(sendNotifications)
})

function getUser(user: FirebaseFirestore.DocumentSnapshot, date: number = Date.now()): Promise<UserNotificationData> {
	const decksDue = new Set<string>()
	return User.getTokens(user.id).then(tokens =>
		(tokens.length
			? User.getLastNotificationDifference(user, date) < LAST_NOTIFICATION_DIFFERENCE
				? Promise.resolve(0)
				: firestore.collection(`users/${user.id}/decks`).where('hidden', '==', false).get().then(decks =>
					Promise.all(decks.docs.map(deck =>
						Deck.collection(deck.id, 'cards').listDocuments().then(cards =>
							Promise.all(cards.map(emptyCard =>
								firestore.doc(`users/${user.id}/decks/${deck.id}/cards/${emptyCard.id}`).get().then(card => {
									const isDue = Card.isDue(card, date)
									if (isDue) decksDue.add(deck.id)
									return (isDue ? 1 : 0) as number
								})
							)).then(addAllNumbers)
						)
					)).then(addAllNumbers)
				)
			: Promise.resolve(0)
		).then(cardsDue => ({
			uid: user.id,
			tokens,
			decksDue: decksDue.size,
			cardsDue
		}))
	)
}

function sendNotifications(users: UserNotificationData[]): Promise<admin.messaging.BatchResponse> {
	return Notification.sendAll(users.map(user => 
		user.tokens.map(token =>
			new Notification(token, `You have ${user.cardsDue} card${user.cardsDue === 1 ? '' : 's'} to review`, `You have ${user.cardsDue} card${user.cardsDue === 1 ? '' : 's'} to review in ${user.decksDue} deck${user.decksDue === 1 ? '' : 's'}`)
		)
	).flat())
}

function addAllNumbers(array: number[]): number {
	return array.reduce((acc, element) => acc + element, 0)
}