import { initializeApp   } from "https://www.gstatic.com/firebasejs/9.6.6/firebase-app.js"
import { getFirestore, collection, onSnapshot, addDoc, getDoc, setDoc, doc, query, where } from "https://www.gstatic.com/firebasejs/9.6.6/firebase-firestore.js"
import { getAuth, signInWithPopup, GoogleAuthProvider, signOut, onAuthStateChanged, getRedirectResult, signInWithRedirect  } from "https://www.gstatic.com/firebasejs/9.6.6/firebase-auth.js"

const formAddPhrase = document.querySelector('[data-modal="add-phrase"]')
const ulPhrasesList = document.querySelector('[data-js="phrases-list"]')   
const loginWithGoogleButton = document.querySelector('[data-js="button-form"]')
const logOutButton = document.querySelector('[data-js="logout"]')
const accountDetailsContainer = document.querySelector('[data-js="account-details"]')

const accountDetails = document.createElement('p') 

const firebaseConfig = {
    apiKey: "AIzaSyA_xOndhy7rmN8xlAjmHVcDGAN5AktQ97U",
    authDomain: "jeidencw-auth.firebaseapp.com",
    projectId: "jeidencw-auth",
    storageBucket: "jeidencw-auth.appspot.com",
    messagingSenderId: "407413216804",
    appId: "1:407413216804:web:99cd7c38b12d5e61b5eab1",
    measurementId: "G-H2T01WFFEE"
}

const app = initializeApp(firebaseConfig)
const db = getFirestore(app)
const provider = new GoogleAuthProvider()
const auth = getAuth()
const collectionPhrases = collection(db, 'withId')

const login = async () => {
    try {
        await signInWithRedirect(auth, provider)
    } catch (error) {
        alert('Erro no login')
    }
}

const logOut = async unsubscribe => {
    try {
        await signOut(auth)
        unsubscribe()
    } catch (error) {
        alert('Erro ao deslogar')
    }
}

const to = promise => promise
    .then(result => [null, result])
    .catch(error => [error])

const addPhrase = async (e, user) => {
    e.preventDefault()

    const [error] = await to(addDoc(collectionPhrases, {
        movieTitle: DOMPurify.sanitize(e.target.title.value),
        phrase: DOMPurify.sanitize(e.target.phrase.value),
        userID: user.uid
    }))

    if(error){
        alert('Não foi possivel adicionar a frase')
        return
    }
    
    e.target.reset()
    closeModal(formAddPhrase)
}

const handleRedirectResult = async () => {
    try {
        await getRedirectResult(auth)
    } catch (error) {
        alert('Houve um problema no redirecionamento')
    }
}

const renderLinks = ({ userExist }) => {
    const ulList = [...document.querySelector('[data-js="nav-ul"]').children]

    ulList.forEach(li =>{
        const liToBeVisible = li.dataset.js.includes(userExist ? 'logged-in' : 'logged-out')

        if(liToBeVisible){
            li.classList.remove('hide')
            return
        }

        li.classList.add('hide')
    })
}

const removeLoginMessage = () => {
    const loginMessageExist = document.querySelector('[data-js="login-message"]')
    loginMessageExist?.remove()   
}

const handleAnonymousUser = () => {
    const phraseContainer = document.querySelector('[data-js="phrases-container"]')    
    const loginMessage = document.createElement('h5')

    loginMessage.textContent = 'Faça login para ver as frases'
    loginMessage.classList.add('center-align', 'white-text')
    loginMessage.setAttribute('data-js', 'login-message')
    phraseContainer.append(loginMessage)

    loginWithGoogleButton.addEventListener('click', login)
    formAddPhrase.onsubmit = ''
    logOutButton.onclick = null

    accountDetailsContainer.innerHTML = ''
    ulPhrasesList.innerHTML = ''
    return
}

const createUserDocument = async user => {
    try {
        const userDocRef = doc(db, 'users', user.uid)
        const docSnapshot = await getDoc(userDocRef)

        if(!docSnapshot.exist){
            await setDoc(userDocRef, {
                name: user.displayName,
                email: user.email,
                userID: user.uid
            })
        }
    } catch (error) {
        alert('Erro ao registrar usuário')
    }
}

const renderPhrases = (user) => {
    const queryPhrase = query(collectionPhrases, where('userID', '==', user.uid))
    
    return onSnapshot(queryPhrase, snapshot => {
        const documentFragment = document.createDocumentFragment()

        snapshot.docChanges().forEach(docChange => {
            const liMovie = document.createElement('li')
            const titleDiv = document.createElement('div')
            const phraseDiv = document.createElement('div')
            const { movieTitle, phrase } = docChange.doc.data()

            
            titleDiv.textContent = DOMPurify.sanitize(movieTitle)
            titleDiv.setAttribute('class', 'collapsible-header blue-grey-text text-lighten-5 blue-grey darken-4')
            phraseDiv.textContent = DOMPurify.sanitize(phrase)
            phraseDiv.setAttribute('class', 'collapsible-body blue-grey-text text-lighten-5 blue-grey darken-3')

            liMovie.append(titleDiv, phraseDiv)
            documentFragment.append(liMovie)
        })
        ulPhrasesList.append(documentFragment)
    })
}

const handleSignedUser = async user => {
    const unsubscribe = renderPhrases(user)
    createUserDocument(user)
    
    accountDetails.textContent = `${user.displayName} | ${user.email}`
    accountDetailsContainer.append(accountDetails)
    
    loginWithGoogleButton.removeEventListener('click', login)
    logOutButton.onclick = () => logOut(unsubscribe)
    formAddPhrase.onsubmit = e => addPhrase(e, user)
}

const handleAuthStateChanged = async user => {  
    handleRedirectResult()
    renderLinks({ userExist: !!user })
    removeLoginMessage()

    if(!user){
        handleAnonymousUser()
        return
    }

    handleSignedUser({
        displayName: DOMPurify.sanitize(user.displayName),
        email: DOMPurify.sanitize(user.email),
        uid: DOMPurify.sanitize(user.uid)
    })    
}

const initModals = () => {
    const modals = document.querySelectorAll('.modal')
    M.Modal.init(modals)
}

const initCollapsibles = collapsibles => M.Collapsible.init(collapsibles)

const closeModal = modalName => M.Modal.getInstance(modalName).close()

onAuthStateChanged(auth, handleAuthStateChanged)

initModals()
initCollapsibles(ulPhrasesList)