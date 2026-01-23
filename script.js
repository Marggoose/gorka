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

    // Добавляем класс для анимации
    listItem.classList.add('new-item');
    setTimeout(() => {
        listItem.classList.remove('new-item');
    }, 400);

    // Кнопка "Стоп" - показываем подтверждение
    const stopButton = listItem.querySelector('.stopButton');
    const buttonContainer = listItem.querySelector('.stop-button-container');
    
    stopButton.addEventListener('click', function(e) {
        e.stopPropagation();
        if (!confirmDeleteMode) {
            // Входим в режим подтверждения
            enterConfirmDeleteMode(stopButton, buttonContainer, listItem);
        }
    });

    nameInput.value = '';
    updateEmptyState();
    updatePersonCount();
    // Применяем активные фильтры к новому элементу
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
            timers.delete(listItem); // Удаляем из Map
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

            // 🔴 За 10 минут
            if (timeRemaining <= 600) {
                listItem.classList.add('warning');
                timerElement.classList.add('warning');
            }

            sortList();
        }
    }, 1000);

    // Сохраняем интервал в Map
    timers.set(listItem, { interval, alertPlaying, timerElement });

    // Получаем кнопку и контейнер для режима подтверждения
    const stopButton = listItem.querySelector('.stopButton');
    const buttonContainer = listItem.querySelector('.stop-button-container');
    
    // Обновляем обработчик для кнопки в таймере
    stopButton.addEventListener('click', function(e) {
        e.stopPropagation();
        if (!confirmDeleteMode) {
            enterConfirmDeleteMode(stopButton, buttonContainer, listItem);
        }
    });
}

function enterConfirmDeleteMode(stopButton, buttonContainer, listItem) {
    confirmDeleteMode = true;
    
    // Получаем данные таймера
    const timerData = timers.get(listItem);
    
    // Заменяем кнопку на две кнопки подтверждения
    buttonContainer.innerHTML = `
        <button class="stopButton confirm-button">Да</button>
        <button class="stopButton cancel-button">Нет</button>
    `;
    
    // Добавляем обработчики для новых кнопок
    const confirmButton = buttonContainer.querySelector('.confirm-button');
    const cancelButton = buttonContainer.querySelector('.cancel-button');
    
    // Подтверждение удаления
    confirmButton.addEventListener('click', function(e) {
        e.stopPropagation();
        if (timerData) {
            clearInterval(timerData.interval);
            if (timerData.alertPlaying) {
                stopAlert();
            }
            timers.delete(listItem); // Удаляем из Map
        }
        listItem.remove();
        confirmDeleteMode = false;
        updateEmptyState();
        updatePersonCount();
    });
    
    // Отмена удаления
    cancelButton.addEventListener('click', function(e) {
        e.stopPropagation();
        // Возвращаем оригинальную кнопку
        buttonContainer.innerHTML = `<button class="stopButton">Стоп</button>`;
        
        // Добавляем обработчик заново
        const newStopButton = buttonContainer.querySelector('.stopButton');
        newStopButton.addEventListener('click', function(e) {
            e.stopPropagation();
            if (!confirmDeleteMode) {
                enterConfirmDeleteMode(newStopButton, buttonContainer, listItem);
            }
        });
        
        confirmDeleteMode = false;
    });
    
    // Автоматический выход из режима подтверждения через 5 секунд
    const timeoutId = setTimeout(() => {
        if (confirmDeleteMode && document.body.contains(buttonContainer)) {
            buttonContainer.innerHTML = `<button class="stopButton">Стоп</button>`;
            
            // Добавляем обработчик заново
            const newStopButton = buttonContainer.querySelector('.stopButton');
            newStopButton.addEventListener('click', function(e) {
                e.stopPropagation();
                if (!confirmDeleteMode) {
                    enterConfirmDeleteMode(newStopButton, buttonContainer, listItem);
                }
            });
            
            confirmDeleteMode = false;
        }
    }, 5000);
    
    // Сохраняем ID таймаута для возможной очистки
    buttonContainer.dataset.timeoutId = timeoutId;
}

function sortList() {
    const list = document.getElementById('personList');
    const items = Array.from(list.children);
    
    // Если есть new-item, не сортируем пока анимация не закончится
    const hasNewItems = items.some(item => item.classList.contains('new-item'));
    if (hasNewItems) return;
    
    const timed = items.filter(item => {
        const timer = item.querySelector('.timer');
        return timer && timer.dataset.time;
    });
    const unlimited = items.filter(item => {
        const timer = item.querySelector('.timer');
        return !timer || !timer.dataset.time;
    });

    timed.sort((a, b) => {
        const timeA = parseInt(a.querySelector('.timer').dataset.time);
        const timeB = parseInt(b.querySelector('.timer').dataset.time);
        return timeA - timeB;
    });

    // Проверяем, изменился ли порядок
    const sortedItems = [...timed, ...unlimited];
    let orderChanged = false;
    
    sortedItems.forEach((item, index) => {
        if (list.children[index] !== item) {
            orderChanged = true;
        }
    });
    
    // Если порядок изменился, плавно перестраиваем список
    if (orderChanged) {
        sortedItems.forEach(item => {
            // Временно отключаем переходы для плавной сортировки
            item.style.transition = 'none';
            list.appendChild(item);
            // Принудительный reflow для сброса анимации
            void item.offsetWidth;
            // Включаем переходы обратно
            item.style.transition = '';
        });
    }
}

function playAlert() {
    const alertSound = document.getElementById('alertSound');
    if (alertSound) {
        alertSound.loop = true;
        alertSound.play().catch(e => console.log("Ошибка воспроизведения звука:", e));
    }
}

function stopAlert() {
    const alertSound = document.getElementById('alertSound');
    if (alertSound) {
        alertSound.pause();
        alertSound.currentTime = 0;
    }
}

function applyFilters() {
    const searchValue = document.getElementById('searchInput').value.toLowerCase();
    const tariffFilter = document.getElementById('filterTariff').value;
    
    // Сохраняем активные фильтры
    activeFilters.search = searchValue;
    activeFilters.tariff = tariffFilter;
    
    // Обновляем индикатор активных фильтров
    updateFilterIndicator();
    
    const items = document.querySelectorAll('#personList li');

    items.forEach(item => {
        const nameElement = item.querySelector('.name');
        const tariff = item.dataset.tariff;

        if (!nameElement) return; // Добавляем проверку на существование элемента

        const name = nameElement.textContent.toLowerCase();
        const matchName = name.includes(searchValue);
        const matchTariff = tariffFilter === 'all' || tariff === tariffFilter;

        item.style.display = matchName && matchTariff ? 'flex' : 'none';
    });
    
    updatePersonCount();
}

function updateEmptyState() {
    const emptyState = document.getElementById('emptyState');
    const personList = document.getElementById('personList');
    
    if (!emptyState || !personList) return;
    
    if (personList.children.length === 0) {
        emptyState.style.display = 'flex';
    } else {
        emptyState.style.display = 'none';
    }
}

function updatePersonCount() {
    const personCount = document.getElementById('personCount');
    const personList = document.getElementById('personList');
    
    if (!personCount || !personList) return;
    
    const visibleItems = Array.from(personList.children).filter(item => 
        item.style.display !== 'none'
    ).length;
    
    // Показываем общее количество и количество после фильтрации
    if (activeFilters.search || activeFilters.tariff !== 'all') {
        personCount.textContent = `${visibleItems}/${personList.children.length}`;
    } else {
        personCount.textContent = personList.children.length;
    }
}

function updateFilterIndicator() {
    const filterToggle = document.getElementById('filterToggle');
    const filterIndicator = filterToggle ? filterToggle.querySelector('.filter-indicator') : null;
    
    if (!filterToggle || !filterIndicator) return;
    
    // Показываем индикатор, если есть активные фильтры
    if (activeFilters.search || activeFilters.tariff !== 'all') {
        filterIndicator.style.display = 'flex';
    } else {
        filterIndicator.style.display = 'none';
    }
}

function toggleFilterBlock() {
    const filterBlock = document.getElementById('filterBlock');
    const filterToggle = document.getElementById('filterToggle');
    
    if (!filterBlock || !filterToggle) return;
    
    filterVisible = !filterVisible;
    
    if (filterVisible) {
        filterBlock.classList.add('active');
        filterToggle.classList.add('active');
        
        // Восстанавливаем сохранённые значения фильтров
        document.getElementById('searchInput').value = activeFilters.search;
        document.getElementById('filterTariff').value = activeFilters.tariff;
    } else {
        filterBlock.classList.remove('active');
        filterToggle.classList.remove('active');
    }
}

function resetFilters() {
    // Сбрасываем значения полей
    document.getElementById('searchInput').value = '';
    document.getElementById('filterTariff').value = 'all';
    
    // Сбрасываем активные фильтры
    activeFilters.search = '';
    activeFilters.tariff = 'all';
    
    // Применяем сброшенные фильтры
    applyFilters();
    
    // Обновляем индикатор
    updateFilterIndicator();
    
    // Закрываем панель фильтров
    const filterBlock = document.getElementById('filterBlock');
    const filterToggle = document.getElementById('filterToggle');
    
    if (filterBlock && filterToggle) {
        filterBlock.classList.remove('active');
        filterToggle.classList.remove('active');
        filterVisible = false;
    }
}

// Вызвать при загрузке
document.addEventListener('DOMContentLoaded', function() {
    updateEmptyState();
    updatePersonCount();
    updateFilterIndicator();
    
    // Очистка всех таймеров при закрытии страницы
    window.addEventListener('beforeunload', function() {
        timers.forEach(timerData => {
            clearInterval(timerData.interval);
        });
        timers.clear();
    });
});