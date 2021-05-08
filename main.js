// Tabs
let tabButtons = document.querySelectorAll('footer button');
let tabElements = document.querySelectorAll('#tab');
let currentTab = 0; // 0 by default

let mainPagesGenerates = 1; // кол-во сгенерированных сетов карточек (по mainPageLength)
let mainPageLength = 10;

let data;

// элементы настроек
let settings_dailygoal_input = document.querySelector('#settings-dailygoal-input');
let settings_json = document.querySelector('#settings-json');

// version
let version = 1; //0.0.1
if (!localStorage.getItem('version')) {
    localStorage.setItem('version', version)
}
if (version > Number(localStorage.getItem('version'))) {
    console.warn('Переход на новую версию (' + version + ')');
    localStorage.setItem('version', version)
}
//


// LocalStorage ('favourite')
let favTab = document.querySelector('#tab[data-index="2"]');
let lsFavourite;
let lsHidden; // скрытые карточки
let lsDaily = [0, 100];

function favouriteLS() {
    if (!localStorage.getItem('favourite')) {
        localStorage.setItem('favourite', '-1')
    }
    lsFavourite = localStorage.getItem('favourite').split(',');
    lsFavourite = [...new Set(lsFavourite)];
    console.log(`Favourite: [${lsFavourite}]`);
}

function generateFavouriteTab() {
    // Генерирует карточки
    if (lsFavourite.length == 1) {
    }
    if (lsFavourite.length > 1) {
        for (let index of lsFavourite) {
            if (index != '-1') {
                favTab.innerHTML += generateBox(data[index], 'fav');
            }
        }
    }
}


/* Переключение между вкладками */
let trainingLoaded = false;

function changeTab(id) {
    if (id == 1 && !trainingLoaded) {
        loadTrainingTasks();
    }

    for (let i of tabButtons) {
        i.classList.remove('current');
        if (i.dataset.index == id) {
            i.classList.add('current');
        }

        // переключение вкладок
        for (let k of tabElements) {
            k.style.display = 'none';
            if (k.dataset.index == id) {
                k.style.display = '';
            }
            if (k.dataset.index == currentTab) {
                window.scrollTo(0, 0);
            }
        }
    }
}
changeTab(currentTab);

for (let j of tabButtons) {
    j.addEventListener('click', () => {
        changeTab(j.dataset.index);
    })
}



// Генерирует главную страницу
let mainTab = document.querySelector('#tab[data-index="0"]');
let trainingTab = document.querySelector('#tab[data-index="1"]');

// Загружает json
fetch ('/data/paronyms.json')
        .then(response => response.json())
        .then(commit => {
            data = commit})
        .then(() => {
            favouriteLS();
        })
        .then(() => {
            for (let i of data.slice(0, mainPageLength)) {

                let params = [];
                // если в избранных
                if (lsFavourite.includes(data.indexOf(i).toString())) {
                    params.push('fav');
                }
                mainTab.innerHTML += generateBox(i, 'main', params);
            }
            mainTab.innerHTML += '<button id="show-more-button" onclick="mainLoadMore()">Показать ещё</button>';
        })
        .then(() => {
            generateFavouriteTab()
        });

// Создаёт карточку с паронимами
function generateBox(obj, tab, params) {
    let result = '<div class="paronym-box grid" data-index="' + data.indexOf(obj) + '">';

    for (let w of obj) {
        if (obj.indexOf(w) < obj.length-1) {
            result += '<div class="border"><p><b>' + w.title + '</b></p>';
        }
        else {
            result += '<div><p><b>' + w.title + '</b></p>';
        }

        let definitions = '';
        for (let x of w.def) {
            definitions += '<details><summary>' + x[0] + '</summary>';
            if (typeof x[1] == 'string') {
                definitions += '<p class="paronym-box-example">' + x[1] + '</p></details>';
            }
            else {
                let examplesList = '<ul class="paronym-box-example">';
                for (let y of x[1]) {
                    examplesList += '<li>' + y + '</li>';
                }
                examplesList += '</ul></details>';
                definitions += examplesList;
            }
        }

        result += definitions + '</div>';
    }
    
    result += '<div class="paronym-box-actions">';

    // favourite
    if (tab == 'main') {
        result += '<button onclick="favourite(' + data.indexOf(obj) + ')">Добавить в избранное</button>';
    }
    if (tab == 'fav') {
        result += '<button id="favourite" onclick="removeFavourite(' + data.indexOf(obj) + ')">Удалить из избранного</button>';
    }

    result += '';

    return result;
}

// Кнопка "Показать ещё"
function mainLoadMore() {
    let loadMoreButton = document.querySelector('#show-more-button');
    loadMoreButton.remove();
    for (let elem of data.slice(mainPagesGenerates * mainPageLength, (mainPagesGenerates + 1) * mainPageLength)) {
        mainTab.innerHTML += generateBox(elem, 'main');
    }
    mainPagesGenerates += 1;

    if (mainPagesGenerates * mainPageLength < data.length) {
        mainTab.innerHTML += '<button id="show-more-button" onclick="mainLoadMore()">Показать ещё</button>';
    }
    
}



/* ИЗБРАННОЕ */
// Добавить в избранное
function favourite(index) {
    for (let i of document.querySelectorAll('#tab[data-index="0"] .paronym-box.grid')) {
        if (i.dataset.index == index && !lsFavourite.includes(index)) {

            lsFavourite.push(index);
            console.log(index)
            localStorage.setItem('favourite', [...new Set(lsFavourite)].join(','));
            console.log(lsFavourite);
            favTab.innerHTML += generateBox(data[index], 'fav');
        }
    }
}

function removeFavourite(index) {
    for (let i of document.querySelectorAll('#tab[data-index="2"] .paronym-box.grid')) {
        if (i.dataset.index == index) {
            i.remove();
            let indexToRemove = lsFavourite.indexOf(index);
            lsFavourite = lsFavourite.splice(indexToRemove + 1, 1);
            localStorage.setItem('favourite', lsFavourite.join(','));
        }
    }
}


/* ТРЕНИРОВКА */
let trainingTasks;

let trainMain;
let trainTask;
let trainButtons;
let trainExplain;
let trainExplainBox;

function loadTrainingTasks() {
    fetch('/data/train.json')
        .then(response => response.json())
        .then(commit => {
            trainingTasks = commit;
            trainingTab.innerHTML = '<div id="train-main"><div><p class="train-task"></p><div id="train-buttons"></div></div></div><div id="train-explain"><details><summary>Подробнее</summary><div id="train-explain-box"></div></details></div>';
            trainMain = document.querySelector('#train-main');
            trainTask = document.querySelector('.train-task');
            trainButtons = document.querySelector('#train-buttons');
            trainExplain = document.querySelector('#train-explain');
            trainExplainBox = document.querySelector('#train-explain-box');
        })
        .then(() => {
            generateTraining();
        })
        .then(() => {
            trainingLoaded = true;
        });
}

// Генерирует задание
let currentTask;

function generateTraining() {
    trainButtons.innerHTML = '';
    currentTask = trainingTasks[Math.floor(Math.random() * trainingTasks.length)];
    
    console.log(`ID: ${currentTask.id}`)

    trainMain.classList.remove('checked');
    trainExplain.style.display = 'none';

    trainTask.innerText = (currentTask.text).replace('_','________');

    const variantButtons = JSON.parse(JSON.stringify(currentTask.vars)).sort(() => .5 - Math.random());
    
    for (let i of variantButtons) {
        trainButtons.innerHTML += '<button onclick="trainingCheckAnswer(\'' + i + '\')">' + i + '</button>';
    }
}

// Проверяет ответ
function trainingCheckAnswer(index) {
    trainTask.innerHTML = trainTask.innerHTML.replace('________', '<span style="color: var(--active-color)">' + currentTask.vars[0] + '</span>');
    if (currentTask.id) {
        trainExplainBox.innerHTML = generateBox(data[currentTask.id], 'main');
        trainMain.classList.add('checked');
    trainExplain.style.display = '';
    }
    
    if (index == currentTask.vars[0]) {
        trainButtons.innerHTML = '<button onclick="generateTraining()">Продолжить</button><p style="color: green;">Верно!</p>'
    }
    else {
        trainButtons.innerHTML = '<button onclick="generateTraining()">Продолжить</button><p style="color: red;">Неверно!</p>'
    }
}

/* Настройки */
function saveSettings() {
    lsDaily[1] = settings_dailygoal_input.value;
    localStorage.setItem('dailygoal', lsDaily.join(','));
}

function clearData() {
    localStorage.setItem('favourite', '-1');
    localStorage.setItem('dailygoal', '0,15');
    favouriteLS();
}