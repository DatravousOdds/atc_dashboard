console.log("Auth javascript here!");

// ============================================
// AUTH STATE (UI only — no auth backend exists yet, see CLAUDE.md "Known Gaps")
// Defaults to logged-out so the login flow can be exercised on load.
// ============================================
let isLoggedIn = false;

// Profile display name/picture are UI-only (localStorage) for now, same as
// the rest of auth — see public/js/settings.js for where they're written.
const PROFILE_DISPLAY_NAME_KEY = 'atc_profile_display_name';
const PROFILE_PICTURE_KEY = 'atc_profile_picture';
const DEFAULT_DISPLAY_NAME = 'Travous Odds';
const DEFAULT_PROFILE_PICTURE = 'assets/profile_pic.jpg';

function getStoredDisplayName() {
    return localStorage.getItem(PROFILE_DISPLAY_NAME_KEY) || DEFAULT_DISPLAY_NAME;
}

function getStoredProfilePicture() {
    return localStorage.getItem(PROFILE_PICTURE_KEY) || DEFAULT_PROFILE_PICTURE;
}

function applyAuthState(loggedIn) {
    const sidebar = document.getElementById('sidebar');
    const currentUserContainer = document.getElementById('currentUserContainer');
    const currentUserImage = document.getElementById('currentUserImage');
    const guestIcon = document.getElementById('guestIcon');
    const currentUsername = document.getElementById('currentUsername');
    const currentUserStatus = document.getElementById('currentUserStatus');
    const authTabIcon = document.getElementById('authTabIcon');
    const authTabLabel = document.getElementById('authTabLabel');
    const contentLockOverlay = document.getElementById('contentLockOverlay');

    sidebar.classList.toggle('logged-out', !loggedIn);
    currentUserContainer.classList.toggle('logged-out', !loggedIn);
    currentUserImage.classList.toggle('hidden', !loggedIn);
    guestIcon.classList.toggle('hidden', loggedIn);
    contentLockOverlay.classList.toggle('active', !loggedIn);

    if (loggedIn) {
        currentUserImage.src = getStoredProfilePicture();
        currentUserImage.onerror = function () {
            currentUserImage.classList.add('hidden');
            guestIcon.classList.remove('hidden');
        };
        currentUsername.textContent = getStoredDisplayName();
        currentUserStatus.textContent = '';
        authTabIcon.className = 'fa-solid fa-right-from-bracket';
        authTabLabel.textContent = 'Logout';
    } else {
        currentUsername.textContent = 'Guest';
        currentUserStatus.textContent = 'Not signed in';
        authTabIcon.className = 'fa-solid fa-right-to-bracket';
        authTabLabel.textContent = 'Login';
    }
}

// ============================================
// LOGIN MODAL
// ============================================
// UI + client-side validation only — no auth backend exists yet
// (see CLAUDE.md "Known Gaps").

document.addEventListener('DOMContentLoaded', async function () {
    const authTab = document.getElementById('authTab');
    const loginModalOverlay = document.getElementById('loginModalOverlay');
    const closeLoginModal = document.getElementById('closeLoginModal');
    const loginForm = document.getElementById('loginForm');
    const loginFormBanner = document.getElementById('loginFormBanner');
    const usernameField = document.getElementById('loginUsername');
    const passwordField = document.getElementById('loginPassword');
    const forgotPasswordLink = document.getElementById('forgotPasswordLink');
    const forgotPasswordNote = document.getElementById('forgotPasswordNote');
    const session = await checkSession();
    if (!loginModalOverlay || !loginForm) return;

    if (!session) {
        openLoginModal()
    } else {
        console.log("session:", session)
        applyAuthState(true);
    }

    async function createNewUser(email, password) {
        const request = await fetch('/api/login/new-user', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: email, pwd: password })
        })

        if (!request.ok) {
            throw new Error(`Error when creating account status:${request.status}`);
        }

        const result = await request.json();
        // console.log("Here is the results:", result);
    }

    async function getUser(data) {
        try {
           const response =  await fetch('/api/login', {
                method: 'POST',
                headers: {
                    'Content-Type':'application/json'
                },
                body: JSON.stringify(data)
            });

            if (!response.ok) {
                throw new Error(`Response status: ${response.status}`);
            }

            const result = await response.json()

            return result;

        } catch (error) {
            console.error('Login failed', error.message);
        }
    }

    async function checkSession() {
        try {
           const response = await fetch('/api/me');

           if (response.status === 401) {
                return null; // not logged in -
           }

           if (!response.ok) {
            throw new Error(`Failed to fetch session: ${response.statusText}`);
           }

           const session = await response.json();
           return session;

        } catch (error) {
            throw new Error(`Internal server error: ${error.message}`)
        }
    }

    function openLoginModal() {
        loginModalOverlay.classList.add('active');
        document.body.style.overflow = "hidden";
        usernameField.focus();
    }

    function closeLoginModalFn() {
        loginModalOverlay.classList.remove('active');
        document.body.style.overflow = "auto";
        loginForm.reset();
        clearErrors();
        forgotPasswordNote.classList.remove('active');
    }

    function setFieldError(field, errorEl, message) {
        field.closest('.login-form-flex').classList.add('has-error');
        errorEl.textContent = message;
    }

    function clearFieldError(field, errorEl) {
        field.closest('.login-form-flex').classList.remove('has-error');
        errorEl.textContent = '';
    }

    function clearErrors() {
        clearFieldError(usernameField, document.getElementById('loginUsernameError'));
        clearFieldError(passwordField, document.getElementById('loginPasswordError'));
        loginFormBanner.classList.remove('active');
        loginFormBanner.textContent = '';
    }

    function validateForm() {
        clearErrors();
        let isValid = true;

        const username = usernameField.value.trim();
        const password = passwordField.value;

        if (!username) {
            setFieldError(usernameField, document.getElementById('loginUsernameError'), 'Username is required.');
            isValid = false;
        }

        if (!password) {
            setFieldError(passwordField, document.getElementById('loginPasswordError'), 'Password is required.');
            isValid = false;
        } else if (password.length < 6) {
            setFieldError(passwordField, document.getElementById('loginPasswordError'), 'Password must be at least 6 characters.');
            isValid = false;
        }

        if (!isValid) {
            loginFormBanner.textContent = 'Please fix the errors below and try again.';
            loginFormBanner.classList.add('active');
        }

        return isValid;
    }

    if (authTab) {
        authTab.addEventListener('click', function () {
            // disable dashboard, show login modal
            
            // remove user session




        });
    }

    const contentLockLoginBtn = document.getElementById('contentLockLoginBtn');
    if (contentLockLoginBtn) {
        contentLockLoginBtn.addEventListener('click', openLoginModal);
    }

    closeLoginModal.addEventListener('click', closeLoginModalFn);

    loginModalOverlay.addEventListener('click', function (e) {
        if (e.target === loginModalOverlay) {
            closeLoginModalFn();
        }
    });

    document.addEventListener('keydown', function (e) {
        if (e.key === 'Escape' && loginModalOverlay.classList.contains('active')) {
            closeLoginModalFn();
        }
    });

    usernameField.addEventListener('input', function () {
        clearFieldError(usernameField, document.getElementById('loginUsernameError'));
    });

    passwordField.addEventListener('input', function () {
        clearFieldError(passwordField, document.getElementById('loginPasswordError'));
    });

    forgotPasswordLink.addEventListener('click', function (e) {
        e.preventDefault();
        forgotPasswordNote.classList.toggle('active');
    });

    loginForm.addEventListener('submit', async function (e) {
        e.preventDefault();

        if (!validateForm()) return;

        const formData = new FormData(e.target).entries();
        const data = Object.fromEntries(formData);

        const login = await getUser(data);
        if (login.success) {
            applyAuthState(true);
            closeLoginModalFn();
        }
        // console.log('Login form validated for user:', usernameField.value.trim());
        
    });
});