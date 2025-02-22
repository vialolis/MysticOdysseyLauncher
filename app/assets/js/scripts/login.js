/**
 * Script for login.ejs
 */
// Validation Regexes.
const validUsername = /^[a-zA-Z0-9_]{1,16}$/;
const basicEmail = /^\S+@\S+\.\S+$/;

// Login Elements
const loginCancelContainer = document.getElementById('loginCancelContainer');
const loginCancelButton = document.getElementById('loginCancelButton');
const loginEmailError = document.getElementById('loginEmailError');
const loginUsername = document.getElementById('loginUsername'); // Используем loginUsername
const loginPasswordError = document.getElementById('loginPasswordError');
const loginPassword = document.getElementById('loginPassword'); // Используем loginPassword
const checkmarkContainer = document.getElementById('checkmarkContainer');
const loginRememberOption = document.getElementById('loginRememberOption');
const loginButton = document.getElementById('loginButton');
const loginForm = document.getElementById('loginForm');

// Control variables.
let lu = false, lp = false;

function showError(element, value) {
    element.innerHTML = value;
    element.style.opacity = 1;
}

function shakeError(element) {
    if (element.style.opacity == 1) {
        element.classList.remove('shake');
        void element.offsetWidth;
        element.classList.add('shake');
    }
}

function validateEmail(value) {
    if (value) {
        if (!basicEmail.test(value) && !validUsername.test(value)) {
            showError(loginEmailError, Lang.queryJS('login.error.invalidValue'));
            loginDisabled(true);
            lu = false;
        } else {
            loginEmailError.style.opacity = 0;
            lu = true;
            if (lp) {
                loginDisabled(false);
            }
        }
    } else {
        lu = false;
        showError(loginEmailError, Lang.queryJS('login.error.requiredValue'));
        loginDisabled(true);
    }
}

function validatePassword(value) {
    if (value) {
        loginPasswordError.style.opacity = 0;
        lp = true;
        if (lu) {
            loginDisabled(false);
        }
    } else {
        lp = false;
        showError(loginPasswordError, Lang.queryJS('login.error.invalidValue'));
        loginDisabled(true);
    }
}

loginUsername.addEventListener('focusout', (e) => {
    validateEmail(e.target.value);
    shakeError(loginEmailError);
});

loginPassword.addEventListener('focusout', (e) => {
    validatePassword(e.target.value);
    shakeError(loginPasswordError);
});

// Validate input for each field.
loginUsername.addEventListener('input', (e) => {
    validateEmail(e.target.value);
});

loginPassword.addEventListener('input', (e) => {
    validatePassword(e.target.value);
});

function loginDisabled(v) {
    if (loginButton.disabled !== v) {
        loginButton.disabled = v;
    }
}

/**
 * Enable or disable loading elements.
 * 
 * @param {boolean} v True to enable, false to disable.
 */
function loginLoading(v) {
    if (v) {
        loginButton.setAttribute('loading', v);
        loginButton.innerHTML = loginButton.innerHTML.replace(Lang.queryJS('login.login'), Lang.queryJS('login.loggingIn'));
    } else {
        loginButton.removeAttribute('loading');
        loginButton.innerHTML = loginButton.innerHTML.replace(Lang.queryJS('login.loggingIn'), Lang.queryJS('login.login'));
    }
}

function formDisabled(v) {
    loginDisabled(v);
    loginCancelButton.disabled = v;
    loginUsername.disabled = v;
    loginPassword.disabled = v;
    if (v) {
        checkmarkContainer.setAttribute('disabled', v);
    } else {
        checkmarkContainer.removeAttribute('disabled');
    }
    loginRememberOption.disabled = v;
}

let loginViewOnSuccess = VIEWS.landing;
let loginViewOnCancel = VIEWS.settings;
let loginViewCancelHandler;

function loginCancelEnabled(val) {
    if (val) {
        $(loginCancelContainer).show();
    } else {
        $(loginCancelContainer).hide();
    }
}

loginCancelButton.onclick = (e) => {
    switchView(getCurrentView(), loginViewOnCancel, 500, 500, () => {
        loginUsername.value = '';
        loginPassword.value = '';
        loginCancelEnabled(false);
        if (loginViewCancelHandler != null) {
            loginViewCancelHandler();
            loginViewCancelHandler = null;
        }
    });
};

// Disable default form behavior.
loginForm.onsubmit = () => { return false; };


// Bind login button behavior.
loginButton.addEventListener('click', () => {
    // Disable form.
    formDisabled(true)

    // Show loading stuff.
    loginLoading(true)

    AuthManager.addMojangAccount(loginUsername.value, loginPassword.value).then((value) => {
        updateSelectedAccount(value)
        loginButton.innerHTML = loginButton.innerHTML.replace(Lang.queryJS('login.loggingIn'), Lang.queryJS('login.success'))
        $('.circle-loader').toggleClass('load-complete')
        $('.checkmark').toggle()
        setTimeout(() => {
            switchView(VIEWS.login, loginViewOnSuccess, 500, 500, async () => {
                // Temporary workaround
                if(loginViewOnSuccess === VIEWS.settings){
                    await prepareSettings()
                }
                loginViewOnSuccess = VIEWS.landing // Reset this for good measure.
                loginCancelEnabled(false) // Reset this for good measure.
                loginViewCancelHandler = null // Reset this for good measure.
                loginUsername.value = ''
                loginPassword.value = ''
                $('.circle-loader').toggleClass('load-complete')
                $('.checkmark').toggle()
                loginLoading(false)
                loginButton.innerHTML = loginButton.innerHTML.replace(Lang.queryJS('login.success'), Lang.queryJS('login.login'))
                formDisabled(false)
            })
        }, 1000)
    }).catch((displayableError) => {
        loginLoading(false)

        let actualDisplayableError
        if(isDisplayableError(displayableError)) {
            msftLoginLogger.error('Error while logging in.', displayableError)
            actualDisplayableError = displayableError
        } else {
            // Uh oh.
            msftLoginLogger.error('Unhandled error during login.', displayableError)
            actualDisplayableError = Lang.queryJS('login.error.unknown')
        }

        setOverlayContent(actualDisplayableError.title, actualDisplayableError.desc, Lang.queryJS('login.tryAgain'))
        setOverlayHandler(() => {
            formDisabled(false)
            toggleOverlay(false)
        })
        toggleOverlay(true)
    })

})


// Функция для отключения/включения формы
// function formDisabled(isDisabled) {
//     const inputs = document.querySelectorAll('#loginForm input');
//     inputs.forEach(input => {
//         input.disabled = isDisabled;
//     });
//     document.getElementById('loginButton').disabled = isDisabled;
// }

// // Функция для показа/скрытия состояния загрузки
// function loginLoading(isLoading) {
//     const loginButton = document.getElementById('loginButton');
//     if (isLoading) {
//         loginButton.innerHTML = `<span class="loading-text">${Lang.queryJS('login.loggingIn')}</span>`;
//         loginButton.classList.add('loading');
//     } else {
//         loginButton.innerHTML = Lang.queryJS('login.login');
//         loginButton.classList.remove('loading');
//     }
// }

// Обработчик клика по кнопке входа

// document.getElementById('loginButton').addEventListener('click', async () => {
//     const username = document.getElementById('loginUsername').value.trim();
//     const password = document.getElementById('loginPassword').value.trim();

//     if (!username || !password) {
//         alert('Please enter both username and password.');
//         return;
//     }

//     try {
//         formDisabled(true);
//         loginLoading(true);

//         // Отправляем запрос на сервер для входа
//         const response = await fetch('http://127.0.0.1:5000/api/login', {
//             method: 'POST',
//             headers: { 'Content-Type': 'application/json' },
//             body: JSON.stringify({ username, password })
//         });

//         if (!response.ok) {
//             const errorData = await response.json();
//             throw new Error(errorData.msg || `HTTP error! Status: ${response.status}`);
//         }

//         const data = await response.json();
//         const accessToken = data.access_token;

//         // Проверяем, есть ли данные о пользователе
//         const userData = data.user || {}; // Если данных нет, создаем пустой объект
//         const userInfo = {
//             username: userData.username || 'Guest', // Устанавливаем имя пользователя или "Guest"
//             avatar: userData.avatar || 'default-avatar.png' // Устанавливаем аватар или URL по умолчанию
//         };

//         // Сохранение токена и данных пользователя
//         localStorage.setItem('access_token', accessToken);
//         localStorage.setItem('user_data', JSON.stringify(userInfo));

//         // Переключение представления на главную страницу
//         setTimeout(() => {
//             switchView(getCurrentView(), VIEWS.landing, 500, 500, () => {
//                 // Обновляем данные пользователя в интерфейсе
//                 updateSelectedAccount(userInfo);
//             });
//         }, 1000);
//     } catch (error) {
//         console.error('Login error:', error.message || error);
//         alert('Login failed. Please check your credentials.');
//         formDisabled(false);
//         loginLoading(false);
//     }
// });




// document.getElementById('loginButton').addEventListener('click', async () => {
    // const username = document.getElementById('loginUsername').value.trim();
    // const password = document.getElementById('loginPassword').value.trim();

    // if (!username || !password) {
    //     alert('Please enter both username and password.');
    //     return;
    // }

    // try {
    //     formDisabled(true);
    //     loginLoading(true);

    //     // Отправляем запрос на сервер для входа
    //     const response = await fetch('http://127.0.0.1:5000/api/login', {
    //         method: 'POST',
    //         headers: { 'Content-Type': 'application/json' },
    //         body: JSON.stringify({ username, password })
    //     });

    //     if (!response.ok) {
    //         const errorData = await response.json();
    //         throw new Error(errorData.msg || `HTTP error! Status: ${response.status}`);
    //     }

    //     const data = await response.json();
    //     const accessToken = data.access_token;

    //     // Проверяем, есть ли данные о пользователе
    //     const userData = data.user || {}; // Если данных нет, создаем пустой объект
    //     const userInfo = {
    //         username: userData.username || 'Guest', // Устанавливаем имя пользователя или "Guest"
    //         avatar: userData.avatar || 'default-avatar.png' // Устанавливаем аватар или URL по умолчанию
    //     };

    //     // Сохранение токена и данных пользователя
    //     localStorage.setItem('access_token', accessToken);
    //     localStorage.setItem('user_data', JSON.stringify(userInfo));

    //     // Переключение представления на главную страницу
    //     setTimeout(() => {
    //         switchView(getCurrentView(), VIEWS.landing, 500, 500, () => {
    //             // Обновляем данные пользователя в интерфейсе
    //             updateSelectedAccount(userInfo);
    //         });
    //     }, 1000);
    // } catch (error) {
    //     console.error('Login error:', error.message || error);
    //     alert('Login failed. Please check your credentials.');
    //     formDisabled(false);
    //     loginLoading(false);
    // }
// });