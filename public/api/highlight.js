document.addEventListener('DOMContentLoaded', () => {
	const UID_COOKIE = '__memorize-ai-uid'
	const NAME_COOKIE = '__memorize-ai-name'
	const TOKEN_COOKIE = '__memorize-ai-token'
	const MODAL_DIMENSIONS = MEMORIZE_AI_CREATE_CARD_MODAL_DIMENSIONS
		? { width: MEMORIZE_AI_CREATE_CARD_MODAL_DIMENSIONS.width || 100, height: MEMORIZE_AI_CREATE_CARD_MODAL_DIMENSIONS.height || 100 }
		: { width: 100, height: 100 }

	let token

	function getCookie(name) {
		const cookies = document.cookie.match(`(^|[^;]+)\\s*${name}\\s*=\\s*([^;]+)`)
		return cookies ? cookies.pop() : undefined
	}
	
	function setCookie(name, value) {
		document.cookie = `${name}=${value}; expires=Thu, 01 Jan 3000 00:00:00 GMT`
	}
	
	function removeCookie(name) {
		document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 GMT`
	}
	
	function mouseUp(event) {
		const selectedText = getSelectedText()
		if (!selectedText.length) return
		showModal(selectedText, event)
	}

	function callOnModals(fn) {
		document.querySelectorAll('div.__memorize-ai-highlight-modal.__memorize-ai-protected').forEach(fn)
	}

	function showModal(text, event) {
		hideModal()
		const div = document.createElement('div')
		div.classList.add('__memorize-ai-highlight-modal')
		div.classList.add('__memorize-ai-protected')
		if (getCookie(UID_COOKIE)) {
			
		} else {
			div.innerHTML = `
			<button class="__memorize-ai-create-card-close-modal __memorize-ai-protected">Close</button>
			<button class="__memorize-ai-create-card-disable-modal __memorize-ai-protected">Disable</button>
			<a href="https://memorize.ai/sign-up?from-action=create-card&from-url=${encodeURIComponent(location.href)}" target="_blank">Sign up</a
			<br><br>
			<a class="__memorize-ai-create-card-sign-in __memorize-ai-protected" href="#">Sign in</a>`
		}
		
		div.style.padding = '30px'
		div.style.zIndex = 9999
		div.style.backgroundColor = 'white'
		div.style.border = '5px black'
		div.style.left = `${event.clientX - MODAL_DIMENSIONS.width / 2}px`
		div.style.top = `${event.clientY + 20}px`
		div.style.position = 'absolute'
		div.style.width = `${MODAL_DIMENSIONS.width}px`
		div.style.height = `${MODAL_DIMENSIONS.height}px`
		document.querySelector('*').append(div)
		document.querySelectorAll('.__memorize-ai-create-card-close-modal.__memorize-ai-protected').forEach(element => element.addEventListener('click', hideModal))
		document.querySelectorAll('.__memorize-ai-create-card-disable-modal.__memorize-ai-protected').forEach(element => element.addEventListener('click', disableModal))
	}

	function hideModal() {
		callOnModals(element => document.querySelector('*').removeChild(element))
	}

	function disableModal() {
		hideModal()
		document.querySelectorAll('.memorize-ai-highlightable').forEach(element => element.onmouseup = null)
	}

	function getSelectedText() {
		return (document.all ? document.selection.createRange().text : document.getSelection()).toString()
	}

	function signIn(email, password) {
		return fetch(`https://cors-anywhere.herokuapp.com/https://us-central1-memorize-ai.cloudfunctions.net/getUserSignInToken?password=${encodeURIComponent(btoa(password))}&email=${encodeURIComponent(email)}`).then(response => {
			switch (response.status) {
			case 200:
				return response.json()
			case 401:
				return Promise.reject('Invalid password')
			case 403:
				return Promise.reject(`No user with email ${email}. Would you like to <a href="https://memorize.ai/sign-up?from-action=create-card&from-url=${encodeURIComponent(location.href)}" target="_blank">sign up</a>?`)
			default:
				return Promise.reject('An unknown error occurred. Please try again')
			}
		})
	}

	function getUserFromToken(uid, token) {
		return fetch(`https://cors-anywhere.herokuapp.com/https://us-central1-memorize-ai.cloudfunctions.net/checkUserSignInToken?uid=${encodeURIComponent(uid)}&token=${encodeURIComponent(token)}`).then(response => {
			switch (response.status) {
			case 200:
				return response.json()
			case 404:
				return Promise.reject('invalid-token')
			default:
				return Promise.reject('unknown-error')
			}
		})
	}

	function getDecks(uid, token) {
		return fetch(`https://cors-anywhere.herokuapp.com/https://us-central1-memorize-ai.cloudfunctions.net/getUserDecks?uid=${encodeURIComponent(uid)}&token=${encodeURIComponent(token)}`).then(response => {
			switch (response.status) {
			case 200:
				return response.json()
			case 404:
				return Promise.reject('invalid-token')
			default:
				return Promise.reject('unknown-error')
			}
		})
	}

	function createCard(uid, token, deckId, front, back) {
		return fetch(`https://cors-anywhere.herokuapp.com/https://us-central1-memorize-ai.cloudfunctions.net/createCardWithSignInToken?uid=${encodeURIComponent(uid)}&token=${encodeURIComponent(token)}`)
	}

	if (MEMORIZE_AI_HIGHLIGHT_ENABLED === undefined ? true : MEMORIZE_AI_HIGHLIGHT_ENABLED)
		document.querySelectorAll('.memorize-ai-highlightable').forEach(element => element.onmouseup = mouseUp)
	document.querySelectorAll('.memorize-ai-show-create-card-modal').forEach(element => element.addEventListener('click', event => showModal(null, event)))
})