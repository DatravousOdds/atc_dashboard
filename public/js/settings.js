// ============================================
// SETTINGS TAB — profile picture + display name
// UI-only for now (localStorage), same as the rest of auth — see auth.js.
// ============================================

const MAX_PROFILE_PICTURE_BYTES = 2 * 1024 * 1024; // 2MB, keeps base64 well under localStorage quota

document.addEventListener('DOMContentLoaded', function () {
    const profileImage = document.getElementById('settingsProfileImage');
    const guestIcon = document.getElementById('settingsGuestIcon');
    const changePictureBtn = document.getElementById('settingsChangePictureBtn');
    const pictureInput = document.getElementById('settingsProfilePictureInput');
    const displayNameInput = document.getElementById('settingsDisplayName');
    const displayNameError = document.getElementById('settingsDisplayNameError');
    const saveBtn = document.getElementById('settingsSaveBtn');
    const saveNote = document.getElementById('settingsSaveNote');

    if (!profileImage || !saveBtn) return;

    let pendingPictureDataUrl = null;

    function showSaveNote(message, isError) {
        saveNote.textContent = message;
        saveNote.classList.toggle('error', !!isError);
        saveNote.classList.add('active');
    }

    function clearDisplayNameError() {
        displayNameInput.closest('.login-form-flex').classList.remove('has-error');
        displayNameError.textContent = '';
    }

    // Populate current values on load
    profileImage.src = getStoredProfilePicture();
    profileImage.onerror = function () {
        profileImage.classList.add('hidden');
        guestIcon.classList.remove('hidden');
    };
    displayNameInput.value = getStoredDisplayName();

    changePictureBtn.addEventListener('click', function () {
        pictureInput.click();
    });

    pictureInput.addEventListener('change', function () {
        const file = pictureInput.files[0];
        if (!file) return;

        if (!file.type.startsWith('image/')) {
            showSaveNote('Please choose an image file.', true);
            pictureInput.value = '';
            return;
        }

        if (file.size > MAX_PROFILE_PICTURE_BYTES) {
            showSaveNote('Image is too large — please choose one under 2MB.', true);
            pictureInput.value = '';
            return;
        }

        const reader = new FileReader();
        reader.onload = function () {
            pendingPictureDataUrl = reader.result;
            profileImage.src = pendingPictureDataUrl;
            profileImage.classList.remove('hidden');
            guestIcon.classList.add('hidden');
            saveNote.classList.remove('active');
        };
        reader.readAsDataURL(file);
    });

    displayNameInput.addEventListener('input', clearDisplayNameError);

    saveBtn.addEventListener('click', function () {
        const displayName = displayNameInput.value.trim();

        clearDisplayNameError();
        saveNote.classList.remove('active');

        if (!displayName) {
            displayNameInput.closest('.login-form-flex').classList.add('has-error');
            displayNameError.textContent = 'Display name is required.';
            return;
        }

        localStorage.setItem(PROFILE_DISPLAY_NAME_KEY, displayName);
        if (pendingPictureDataUrl) {
            localStorage.setItem(PROFILE_PICTURE_KEY, pendingPictureDataUrl);
            pendingPictureDataUrl = null;
        }

        applyAuthState(isLoggedIn);
        showSaveNote('Changes saved.', false);
    });
});
