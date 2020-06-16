import * as admin from 'firebase-admin'
import { v4 as uuid } from 'uuid'

import { EmailTemplate } from '../Email'

const auth = admin.auth()
const firestore = admin.firestore()

export default class User {
	static xp = {
		deckDownload: 1,
		reviewCard: 1,
		
		rating_1: -5,
		rating_2: -2,
		rating_3: 1,
		rating_4: 4,
		rating_5: 10
	}
	
	id: string
	name: string
	email: string
	apiKey: string | null
	numberOfDecks: number
	interests: string[]
	allDecks: string[]
	
	constructor(snapshot: FirebaseFirestore.DocumentSnapshot) {
		if (!snapshot.exists)
			throw new Error(`There are no users with ID "${snapshot.id}"`)
		
		this.id = snapshot.id
		this.name = snapshot.get('name')
		this.email = snapshot.get('email')
		this.apiKey = snapshot.get('apiKey') ?? null
		this.numberOfDecks = snapshot.get('deckCount') ?? 0
		this.interests = snapshot.get('topics') ?? []
		this.allDecks = snapshot.get('allDecks') ?? []
	}
	
	static fromId = async (id: string) =>
		new User(await firestore.doc(`users/${id}`).get())
	
	static incrementDeckCount = (uid: string, amount: number = 1) =>
		firestore.doc(`users/${uid}`).update({
			deckCount: admin.firestore.FieldValue.increment(amount)
		})
	
	static decrementDeckCount = (uid: string, amount: number = 1) =>
		User.incrementDeckCount(uid, -amount)
	
	static addXP = (uid: string, amount: number = 1) =>
		firestore.doc(`users/${uid}`).update({
			xp: admin.firestore.FieldValue.increment(amount)
		})
	
	static subtractXP = (uid: string, amount: number = 1) =>
		User.addXP(uid, -amount)
	
	static incrementCounter = (amount: number = 1) =>
		firestore.doc('counters/users').update({
			value: admin.firestore.FieldValue.increment(amount)
		})
	
	static decrementCounter = (amount: number = 1) =>
		User.incrementCounter(-amount)
	
	onCreate = () => {
		const apiKey = uuid()
		
		return Promise.all([
			User.incrementCounter(),
			this.normalizeDisplayName(),
			firestore.doc(`users/${this.id}`).update({
				apiKey,
				unsubscribed: {
					[EmailTemplate.DueCardsNotification]: false
				}
			}),
			firestore.doc(`api-keys/${apiKey}`).set({
				user: this.id
			})
		])
	}
	
	onDelete = () => Promise.all([
		this.removeAuth(),
		firestore.doc(`api-keys/${this.apiKey}`).delete()
	])
	
	addDeckToAllDecks = (deckId: string) =>
		firestore.doc(`users/${this.id}`).update({
			allDecks: admin.firestore.FieldValue.arrayUnion(deckId)
		})
	
	removeDeckFromAllDecks = (deckId: string) =>
		firestore.doc(`users/${this.id}`).update({
			allDecks: admin.firestore.FieldValue.arrayRemove(deckId)
		})
	
	updateAuthDisplayName = (name: string) =>
		auth.updateUser(this.id, { displayName: name })
	
	normalizeDisplayName = () =>
		this.updateAuthDisplayName(this.name)
	
	removeAuth = () =>
		auth.deleteUser(this.id)
	
	toJSON = () => ({
		id: this.id,
		name: this.name,
		email: this.email,
		interests: this.interests,
		decks: this.numberOfDecks,
		all_decks: this.allDecks
	})
}
