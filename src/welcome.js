if (window.localStorage.getItem('userData') && !window.localStorage.getItem('onboarding')) {
	window.location.href = '/';
	throw new Error('User already registered');
}

// Set onboarding flag
window.localStorage.setItem('onboarding', 'true');

let userProfileStep = 0;
let userData = {
	name: '',
	dob: '',
	gender: '',
	createdAt: '',
	avatar: '',
	userLevel: 1,
};

const newUserProfileSplashscreenContainer = document.getElementById('newUserProfileSplashscreenContainer');
const newUserProfileFormContainer = document.getElementById('newUserProfileFormContainer');

newUserProfileSplashscreenContainer.innerHTML = `
	<p style="font-size: 14px; font-weight: 300;">Hi, This is</p>

	<span style="display: flex; flex-direction: row; align-items: center; justify-content: center; gap: 15px;">
		<img src="assets/images/logo.svg" alt="Nova Logo" style="height: 58px; object-fit: contain; margin-top: 6px;">
		<h1 style="font-size: 85px;">NOVA</h1>
	</span>

	<h1 style="font-size: 18px; font-weight: 400; margin-top: 30px;">Your Own Personal Assistant</h1>
`;

newUserProfileFormContainer.innerHTML = `
	<form id="newUserProfileForm" style="width: 100%; display: flex; flex-direction: row; align-items: center; justify-content: center;">
		<button type="button" id="newUserProfileFormStepBtn" style="display: flex; align-items: center; justify-content: center; gap: 10px;">
			Let's Start
			<svg  xmlns="http://www.w3.org/2000/svg"  width="13px"  height="13px"  viewBox="0 0 24 24"  fill="none"  stroke="currentColor"  stroke-width="3"  stroke-linecap="round"  stroke-linejoin="round"  class="icon icon-tabler icons-tabler-outline icon-tabler-chevron-right"><path stroke="none" d="M0 0h24v24H0z" fill="none"/><path d="M9 6l6 6l-6 6" /></svg>
		</button>
	</form>

	<p style="font-size: 10px; font-weight: 300; user-select: none;">Nova can make mistakes, so please double check important information</p>
`;

// Step handler function
function newUserProfileFormStep(step) {
	const newUserProfileSplashscreenContainer = document.getElementById('newUserProfileSplashscreenContainer');
	const newUserProfileFormContainer = document.getElementById('newUserProfileFormContainer');

	// Animation reset
	newUserProfileSplashscreenContainer.classList.remove('fadeIn');
	void newUserProfileSplashscreenContainer.offsetWidth;
	newUserProfileSplashscreenContainer.classList.add('fadeIn');

	switch (step) {
		case 0:
			break;

		case 1:
			newUserProfileSplashscreenContainer.innerHTML = `
				<span style="display: flex; flex-direction: row; align-items: center; justify-content: center; gap: 15px;">
					<img src="assets/images/logo.svg" alt="Nova Logo" style="height: 58px; object-fit: contain; margin-top: 6px;">
					<h1 style="font-size: 85px;">NOVA</h1>
				</span>

				<h1 style="font-size: 18px; font-weight: 400; margin-top: 30px;">What should I call you?</h1>
			`;

			newUserProfileFormContainer.innerHTML = `
				<form id="newUserProfileForm" style="width: 100%; display: flex; flex-direction: row; align-items: center; justify-content: center;">
					<input type="text" id="newUserProfileName" name="firstName" autocomplete="off" spellcheck="false" placeholder="Your Nickname" required>

					<button type="submit" id="newUserProfileFormSubmitBtn">
						<svg  xmlns="http://www.w3.org/2000/svg"  width="13px"  height="13px"  viewBox="0 0 24 24"  fill="none"  stroke="currentColor"  stroke-width="3"  stroke-linecap="round"  stroke-linejoin="round"  class="icon icon-tabler icons-tabler-outline icon-tabler-chevron-right"><path stroke="none" d="M0 0h24v24H0z" fill="none"/><path d="M9 6l6 6l-6 6" /></svg>
					</button>
				</form>

				<p style="font-size: 10px; font-weight: 300; user-select: none;">Nova can make mistakes, so please double check important information</p>
			`;

			const nameForm = document.getElementById('newUserProfileForm');

			const nameInput = document.getElementById('newUserProfileName');
			nameInput.focus();

			nameForm.addEventListener('submit', (e) => {
				e.preventDefault();
				userData.name = document.getElementById('newUserProfileName').value;
				userProfileStep++;
				newUserProfileFormStep(userProfileStep);
			});
			break;

		case 2:
			newUserProfileSplashscreenContainer.innerHTML = `
				<span style="display: flex; flex-direction: row; align-items: center; justify-content: center; gap: 15px;">
					<img src="assets/images/logo.svg" alt="Nova Logo" style="height: 58px; object-fit: contain; margin-top: 6px;">
					<h1 style="font-size: 85px;">NOVA</h1>
				</span>

				<h1 style="font-size: 18px; font-weight: 400; margin-top: 30px;">When did you born, <span style="font-weight: 700;">${userData.name}</span>?</h1>
			`;

			newUserProfileFormContainer.innerHTML = `
				<form id="newUserProfileForm" style="width: 100%; display: flex; flex-direction: row; align-items: center; justify-content: center;">
					<input type="date" id="newUserProfileDOB" name="dob" required>

					<button type="submit" id="newUserProfileFormSubmitBtn">
						<svg  xmlns="http://www.w3.org/2000/svg"  width="13px"  height="13px"  viewBox="0 0 24 24"  fill="none"  stroke="currentColor"  stroke-width="3"  stroke-linecap="round"  stroke-linejoin="round"  class="icon icon-tabler icons-tabler-outline icon-tabler-chevron-right"><path stroke="none" d="M0 0h24v24H0z" fill="none"/><path d="M9 6l6 6l-6 6" /></svg>
					</button>
				</form>

				<p style="font-size: 10px; font-weight: 300; user-select: none;">Nova can make mistakes, so please double check important information</p>
			`;

			const dobForm = document.getElementById('newUserProfileForm');

			const dobInput = document.getElementById('newUserProfileDOB');
			dobInput.focus();

			dobForm.addEventListener('submit', (e) => {
				e.preventDefault();
				userData.dob = document.getElementById('newUserProfileDOB').value;
				userProfileStep++;
				newUserProfileFormStep(userProfileStep);
			});
			break;

		case 3:
			newUserProfileSplashscreenContainer.innerHTML = `
				<span style="display: flex; flex-direction: row; align-items: center; justify-content: center; gap: 15px;">
					<img src="assets/images/logo.svg" alt="Nova Logo" style="height: 58px; object-fit: contain; margin-top: 6px;">
					<h1 style="font-size: 85px;">NOVA</h1>
				</span>

				<h1 style="font-size: 18px; font-weight: 400; margin-top: 30px;">What's your gender, <span style="font-weight: 700;">${userData.name}</span>?</h1>
			`;

			newUserProfileFormContainer.innerHTML = `
				<form id="newUserProfileForm" style="width: 100%; display: flex; flex-direction: row; align-items: center; justify-content: center;">
					<select id="newUserProfileGender">
						<option value="Male">Male</option>
						<option value="Female">Female</option>
						<option value="Other">Other</option>
					</select>

					<button type="submit" id="newUserProfileFormSubmitBtn">
						<svg  xmlns="http://www.w3.org/2000/svg"  width="13px"  height="13px"  viewBox="0 0 24 24"  fill="none"  stroke="currentColor"  stroke-width="3"  stroke-linecap="round"  stroke-linejoin="round"  class="icon icon-tabler icons-tabler-outline icon-tabler-chevron-right"><path stroke="none" d="M0 0h24v24H0z" fill="none"/><path d="M9 6l6 6l-6 6" /></svg>
					</button>
				</form>

				<p style="font-size: 10px; font-weight: 300; user-select: none;">Nova can make mistakes, so please double check important information</p>
			`;

			const genderForm = document.getElementById('newUserProfileForm');

			const genderInput = document.getElementById('newUserProfileGender');
			genderInput.focus();

			genderForm.addEventListener('submit', (e) => {
				e.preventDefault();
				userData.gender = document.getElementById('newUserProfileGender').value;
				userProfileStep++;
				newUserProfileFormStep(userProfileStep);
			});
			break;

		case 4:
			newUserProfileSplashscreenContainer.innerHTML = `
				<span style="display: flex; flex-direction: row; align-items: center; justify-content: center; gap: 15px;">
					<img src="assets/images/logo.svg" alt="Nova Logo" style="height: 58px; object-fit: contain; margin-top: 6px;">
					<h1 style="font-size: 85px;">NOVA</h1>
				</span>

				<h1 style="font-size: 18px; font-weight: 400; margin-top: 30px;">Choose your avatar, <span style="font-weight: 700;">${userData.name}</span></h1>

				<div id="newUserProfileAvatarContainer" style="display: grid; grid-template-columns: repeat(10, 1fr); margin-top: 40px; gap: 15px;">
					<img src="assets/images/useravatars/thumbs1.svg" alt="Avatar 1" style="height: 55px; object-fit: contain; border-radius: 50px; cursor: pointer;">
					<img src="assets/images/useravatars/thumbs2.svg" alt="Avatar 2" style="height: 55px; object-fit: contain; border-radius: 50px; cursor: pointer;">
					<img src="assets/images/useravatars/thumbs3.svg" alt="Avatar 3" style="height: 55px; object-fit: contain; border-radius: 50px; cursor: pointer;">
					<img src="assets/images/useravatars/thumbs4.svg" alt="Avatar 4" style="height: 55px; object-fit: contain; border-radius: 50px; cursor: pointer;">
					<img src="assets/images/useravatars/thumbs5.svg" alt="Avatar 5" style="height: 55px; object-fit: contain; border-radius: 50px; cursor: pointer;">
					<img src="assets/images/useravatars/thumbs6.svg" alt="Avatar 6" style="height: 55px; object-fit: contain; border-radius: 50px; cursor: pointer;">
					<img src="assets/images/useravatars/thumbs7.svg" alt="Avatar 7" style="height: 55px; object-fit: contain; border-radius: 50px; cursor: pointer;">
					<img src="assets/images/useravatars/thumbs8.svg" alt="Avatar 8" style="height: 55px; object-fit: contain; border-radius: 50px; cursor: pointer;">
					<img src="assets/images/useravatars/thumbs9.svg" alt="Avatar 9" style="height: 55px; object-fit: contain; border-radius: 50px; cursor: pointer;">
					<img src="assets/images/useravatars/thumbs10.svg" alt="Avatar 10" style="height: 55px; object-fit: contain; border-radius: 50px; cursor: pointer;">
					<img src="assets/images/useravatars/thumbs11.svg" alt="Avatar 11" style="height: 55px; object-fit: contain; border-radius: 50px; cursor: pointer;">
					<img src="assets/images/useravatars/thumbs12.svg" alt="Avatar 12" style="height: 55px; object-fit: contain; border-radius: 50px; cursor: pointer;">
					<img src="assets/images/useravatars/thumbs13.svg" alt="Avatar 13" style="height: 55px; object-fit: contain; border-radius: 50px; cursor: pointer;">
					<img src="assets/images/useravatars/thumbs14.svg" alt="Avatar 14" style="height: 55px; object-fit: contain; border-radius: 50px; cursor: pointer;">
					<img src="assets/images/useravatars/thumbs15.svg" alt="Avatar 15" style="height: 55px; object-fit: contain; border-radius: 50px; cursor: pointer;">
					<img src="assets/images/useravatars/thumbs16.svg" alt="Avatar 16" style="height: 55px; object-fit: contain; border-radius: 50px; cursor: pointer;">
					<img src="assets/images/useravatars/thumbs17.svg" alt="Avatar 17" style="height: 55px; object-fit: contain; border-radius: 50px; cursor: pointer;">
					<img src="assets/images/useravatars/thumbs18.svg" alt="Avatar 18" style="height: 55px; object-fit: contain; border-radius: 50px; cursor: pointer;">
					<img src="assets/images/useravatars/thumbs19.svg" alt="Avatar 19" style="height: 55px; object-fit: contain; border-radius: 50px; cursor: pointer;">
					<img src="assets/images/useravatars/thumbs20.svg" alt="Avatar 20" style="height: 55px; object-fit: contain; border-radius: 50px; cursor: pointer;">
				</div>
			`;

			newUserProfileFormContainer.innerHTML = `
				<button type="button" id="newUserProfileFormStepBtn" style="display: flex; align-items: center; justify-content: center; gap: 10px;">
					Next
					<svg  xmlns="http://www.w3.org/2000/svg"  width="13px"  height="13px"  viewBox="0 0 24 24"  fill="none"  stroke="currentColor"  stroke-width="3"  stroke-linecap="round"  stroke-linejoin="round"  class="icon icon-tabler icons-tabler-outline icon-tabler-chevron-right"><path stroke="none" d="M0 0h24v24H0z" fill="none"/><path d="M9 6l6 6l-6 6" /></svg>
				</button>

				<p style="font-size: 10px; font-weight: 300; user-select: none;">Nova can make mistakes, so please double check important information</p>
			`;

			let selectedAvatar = null;

			const avatarContainer = document.getElementById('newUserProfileAvatarContainer');
			const avatarStepBtn = document.getElementById('newUserProfileFormStepBtn');

			avatarStepBtn.disabled = true;

			avatarContainer.addEventListener('click', (e) => {
				if (e.target.tagName === 'IMG') {
					if (selectedAvatar) {
						selectedAvatar.style.outline = 'none';
					}

					selectedAvatar = e.target;
					selectedAvatar.style.outline = '2px solid var(--accent)';
					avatarStepBtn.disabled = false;

					let imgsrc = e.target.src;
					userData.avatar = imgsrc.replace('http://127.0.0.1:1430/', '');
				} else {
					if (selectedAvatar) {
						selectedAvatar.style.outline = 'none';
						selectedAvatar = null;
						avatarStepBtn.disabled = true;
					}
				}
			});

			avatarStepBtn.addEventListener('click', () => {
				userProfileStep++;
				newUserProfileFormStep(userProfileStep);
			});
			break;

		case 5:
			newUserProfileSplashscreenContainer.innerHTML = `
				<span style="display: flex; flex-direction: row; align-items: center; justify-content: center; gap: 15px;">
					<img src="assets/images/logo.svg" alt="Nova Logo" style="height: 58px; object-fit: contain; margin-top: 6px;">
					<h1 style="font-size: 85px;">NOVA</h1>
				</span>

				<span style="display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 20px; margin-top: 30px;">
					<h1 style="font-size: 18px; font-weight: 400;">Welcome Aboard, <span style="font-weight: 700;">${userData.name}</span> 🥳</h1>
					<h2 style="font-weight: 300;">I'm super excited to meet you!</h2>
				</span>
			`;

			newUserProfileFormContainer.innerHTML = `
				<button type="button" id="newUserProfileFormStepBtn" style="display: flex; align-items: center; justify-content: center; gap: 10px;">
					Explore Nova
					<svg  xmlns="http://www.w3.org/2000/svg"  width="13px"  height="13px"  viewBox="0 0 24 24"  fill="none"  stroke="currentColor"  stroke-width="3"  stroke-linecap="round"  stroke-linejoin="round"  class="icon icon-tabler icons-tabler-outline icon-tabler-chevron-right"><path stroke="none" d="M0 0h24v24H0z" fill="none"/><path d="M9 6l6 6l-6 6" /></svg>
				</button>

				<p style="font-size: 10px; font-weight: 300; user-select: none;">Nova can make mistakes, so please double check important information</p>
			`;

			newUserProfileFormContainer.style.display = 'flex';

			const stepBtn = document.getElementById('newUserProfileFormStepBtn');

			stepBtn.addEventListener('click', () => {
				completeUserRegistration(userData);
			});
			userData.createdAt = Date.now();
			break;

		default:
			break;
	}
}

function completeUserRegistration(userData) {
    if (!userData || !userData.avatar) {
        console.error('Invalid user data');
        return;
    }
    
    // Remove onboarding flag
    window.localStorage.removeItem('onboarding');
    
    // Save complete user data
    window.localStorage.setItem('userData', JSON.stringify(userData));
    
    // Redirect to main page
    window.location.href = 'main.html';
}

window.addEventListener('load', () => {
	const stepBtn = document.getElementById('newUserProfileFormStepBtn');
	stepBtn.addEventListener('click', () => {
		userProfileStep++;
		if (userProfileStep >= 5) { // Assuming totalSteps is 5
			// On final step, complete registration
			completeUserRegistration(userData);
		} else {
			newUserProfileFormStep(userProfileStep);
		}
	});
});