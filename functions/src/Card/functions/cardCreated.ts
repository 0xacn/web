import * as functions from 'firebase-functions'
import * as admin from 'firebase-admin'

import Card from '..'
import Deck from '../../Deck'
import Batch from '../../Utils/Batch'

const firestore = admin.firestore()

export default functions.firestore
	.document('decks/{deckId}/cards/{cardId}')
	.onCreate((snapshot, { params: { deckId } }) => {
		const card = new Card(snapshot)
		
		return Promise.all([
			card.incrementSectionCardCount(deckId),
			card.incrementDeckCardCount(deckId),
			createUserNodeCards(deckId, card)
		])
	})

const createUserNodeCards = (deckId: string, card: Card) =>
	Deck.currentUsers(deckId).then(currentUserIds => {
		const batch = new Batch
		
		for (const uid of currentUserIds) {
			batch.set(
				firestore.doc(`users/${uid}/decks/${deckId}/cards/${card.id}`),
				{ new: true, section: card.sectionId, due: new Date }
			)
			batch.update(
				firestore.doc(`users/${uid}/decks/${deckId}`),
				{ unlockedCardCount: admin.firestore.FieldValue.increment(1) }
			)
		}
		
		return batch.commit()
	})
