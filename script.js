document.getElementById('addButton').addEventListener('click', addPerson);

function addPerson() {
    const nameInput = document.getElementById('nameInput');
    const tariffSelect = document.getElementById('tariffSelect');
    const name = nameInput.value.trim();
    const tariff = parseInt(tariffSelect.value);

    if (name) {
        const personList = document.getElementById('personList');
        const listItem = document.createElement('li');
        listItem.innerHTML = `${name} <span class="timer" data-time="${tariff * 60}">00:00</span> <button class="stopButton">Стоп</button>`;
        personList.appendChild(listItem);

        startTimer(listItem.querySelector('.timer'), tariff * 60, listItem);
        nameInput.value = '';
    }
}

function startTimer(timerElement, duration, listItem) {
    let timeRemaining = duration;
    let alertPlaying = false; // Флаг для отслеживания, воспроизводится ли звук

    const interval = setInterval(() => {
        if (timeRemaining <= 0) {
            clearInterval(interval);
            timerElement.parentElement.classList.add('expired');
            if (!alertPlaying) {
                playAlert();
                alertPlaying = true; // Устанавливаем флаг, чтобы звук не воспроизводился повторно
            }
        } else {
            timeRemaining--;
            const minutes = Math.floor(timeRemaining / 60);
            const seconds = timeRemaining % 60;
            timerElement.textContent = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
        }
    }, 1000);

    // Обработчик события для кнопки "Стоп"
    listItem.querySelector('.stopButton').addEventListener('click', () => {
        clearInterval(interval); // Остановить таймер
        if (alertPlaying) {
            stopAlert(); // Остановить звук
        }
        listItem.remove(); // Удалить запись из списка
    });
}

function playAlert() {
    const alertSound = document.getElementById('alertSound');
    alertSound.loop = true; // Установить зацикливание звука
    alertSound.play();
}

function stopAlert() {
    const alertSound = document.getElementById('alertSound');
    alertSound.pause();
    alertSound.currentTime = 0; // Сбросить время воспроизведения
}
