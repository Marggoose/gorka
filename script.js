// Добавляем объект для хранения всех таймеров 
let timers = new Map();

// Инициализация обработчиков событий
document.getElementById('addButton').addEventListener('click', addPerson);
document.getElementById('searchInput').addEventListener('input', applyFilters);
document.getElementById('filterTariff').addEventListener('change', applyFilters);
document.getElementById('filterToggle').addEventListener('click', toggleFilterBlock);
document.getElementById('resetFilters').addEventListener('click', resetFilters);

// Глобальные переменные
let confirmDeleteMode = false;
let filterVisible = false;
let activeFilters = {
    search: '',
    tariff: 'all'
};

function addPerson() { 
    const nameInput = document.getElementById('nameInput');
    const tariffSelect = document.getElementById('tariffSelect');
    const name = nameInput.value.trim();
    const tariff = tariffSelect.value;

    if (!name) return;

    const personList = document.getElementById('personList');
    const listItem = document.createElement('li');

    // 🟢 БЕЗЛИМИТ
    if (tariff === 'unlimited') {
        listItem.dataset.tariff = 'unlimited';
        listItem.classList.add('unlimited');
        listItem.innerHTML = `
            <span class="name">${name}</span>
            <span class="timer">Безлимит</span>
            <div class="stop-button-container">
                <button class="stopButton">Стоп</button>
            </div>
        `;
        personList.appendChild(listItem);
    } 
    // ⏱ ТАЙМЕРНЫЕ ТАРИФЫ
    else {
        const seconds = parseInt(tariff) * 60;

        listItem.dataset.tariff = tariff;
        listItem.innerHTML = `
            <span class="name">${name}</span>
            <span class="timer" data-time="${seconds}">${formatTime(seconds)}</span>
            <div class="stop-button-container">
                <button class="stopButton">Стоп</button>
            </div>
        `;

        personList.appendChild(listItem);
        startTimer(listItem.querySelector('.timer'), seconds, listItem);
    }

    listItem.classList.add('new-item');
    setTimeout(() => listItem.classList.remove('new-item'), 400);

    const stopButton = listItem.querySelector('.stopButton');
    const buttonContainer = listItem.querySelector('.stop-button-container');
    
    stopButton.addEventListener('click', e => {
        e.stopPropagation();
        if (!confirmDeleteMode) {
            enterConfirmDeleteMode(stopButton, buttonContainer, listItem);
        }
    });

    nameInput.value = '';
    updateEmptyState();
    updatePersonCount();
    applyFilters();
}

function formatTime(seconds) {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${String(minutes).padStart(2, '0')}:${String(remainingSeconds).padStart(2, '0')}`;
}

function startTimer(timerElement, duration, listItem) {
    let timeRemaining = duration;
    let alertPlaying = false;

    timerElement.dataset.time = timeRemaining;

    const interval = setInterval(() => {
        if (timeRemaining <= 0) {
            clearInterval(interval);
            timers.delete(listItem);
            listItem.classList.add('expired');
            timerElement.classList.add('expired');

            if (!alertPlaying) {
                playAlert();
                alertPlaying = true;
            }
        } else {
            timeRemaining--;
            timerElement.dataset.time = timeRemaining;
            timerElement.textContent = formatTime(timeRemaining);

            // 🟡 За 2 минуты до окончания (120 секунд)
            if (timeRemaining <= 120) {
                listItem.classList.add('warning');
                timerElement.classList.add('warning');
            }

            sortList();
        }
    }, 1000);

    timers.set(listItem, { interval, alertPlaying, timerElement });

    const stopButton = listItem.querySelector('.stopButton');
    const buttonContainer = listItem.querySelector('.stop-button-container');

    stopButton.addEventListener('click', e => {
        e.stopPropagation();
        if (!confirmDeleteMode) {
            enterConfirmDeleteMode(stopButton, buttonContainer, listItem);
        }
    });
}

/* остальной код без изменений */

document.addEventListener('DOMContentLoaded', function() {
    updateEmptyState();
    updatePersonCount();
    updateFilterIndicator();

    window.addEventListener('beforeunload', function() {
        timers.forEach(timerData => clearInterval(timerData.interval));
        timers.clear();
    });
});
