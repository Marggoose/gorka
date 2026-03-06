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
    
    // Сортируем после добавления
    sortList();
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
            
            // Сортируем при истечении времени
            sortList();
        } else {
            timeRemaining--;
            timerElement.dataset.time = timeRemaining;
            timerElement.textContent = formatTime(timeRemaining);

            // 🟡 За 2 минуты до окончания (120 секунд)
            if (timeRemaining <= 120) {
                listItem.classList.add('warning');
                timerElement.classList.add('warning');
            }
            
            // НЕ вызываем сортировку здесь!
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

// ЕДИНСТВЕННАЯ функция сортировки (оптимизированная)
function sortList() {
    const list = document.getElementById('personList');
    const items = Array.from(list.children);
    
    // Если элементов меньше 2, сортировка не нужна
    if (items.length < 2) return;
    
    // Сортировка: по времени (от меньшего к большему), безлимит внизу
    items.sort((a, b) => {
        // Безлимит всегда внизу
        if (a.classList.contains('unlimited') && !b.classList.contains('unlimited')) return 1;
        if (!a.classList.contains('unlimited') && b.classList.contains('unlimited')) return -1;
        
        // Если оба безлимита - они равны
        if (a.classList.contains('unlimited') && b.classList.contains('unlimited')) return 0;
        
        // Если оба с таймером - сортируем по времени (меньше времени - выше)
        const timeA = parseInt(a.querySelector('.timer').dataset.time || 0);
        const timeB = parseInt(b.querySelector('.timer').dataset.time || 0);
        
        return timeA - timeB;
    });
    
    // Оптимизированное обновление DOM - только измененные позиции
    for (let i = 0; i < items.length; i++) {
        if (list.children[i] !== items[i]) {
            // Вставляем элемент на правильную позицию
            list.insertBefore(items[i], list.children[i]);
        }
    }
}

function enterConfirmDeleteMode(stopButton, container, listItem) {
    confirmDeleteMode = true;
    
    // Сохраняем оригинальную кнопку
    stopButton.style.display = 'none';
    
    // Создаем кнопки подтверждения
    const confirmBtn = document.createElement('button');
    confirmBtn.className = 'stopButton confirm-button';
    confirmBtn.title = 'Подтвердить удаление';
    
    const cancelBtn = document.createElement('button');
    cancelBtn.className = 'stopButton cancel-button';
    cancelBtn.title = 'Отмена';
    
    container.appendChild(confirmBtn);
    container.appendChild(cancelBtn);
    
    // Обработчики
    confirmBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        deletePerson(listItem);
    });
    
    cancelBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        exitConfirmDeleteMode(container, stopButton);
    });
    
    // Автоматический выход через 5 секунд
    setTimeout(() => {
        if (confirmDeleteMode && container.contains(confirmBtn)) {
            exitConfirmDeleteMode(container, stopButton);
        }
    }, 5000);
}

function exitConfirmDeleteMode(container, stopButton) {
    confirmDeleteMode = false;
    
    // Удаляем все кнопки кроме оригинальной
    const buttons = container.querySelectorAll('.stopButton');
    buttons.forEach(btn => {
        if (btn !== stopButton) btn.remove();
    });
    
    stopButton.style.display = 'flex';
}

function deletePerson(listItem) {
    // Останавливаем таймер если есть
    if (timers.has(listItem)) {
        clearInterval(timers.get(listItem).interval);
        timers.delete(listItem);
    }
    
    // Удаляем элемент
    listItem.remove();
    
    confirmDeleteMode = false;
    updateEmptyState();
    updatePersonCount();
    
    // Сортируем после удаления
    sortList();
}

function toggleFilterBlock() {
    const filterBlock = document.getElementById('filterBlock');
    const filterToggle = document.getElementById('filterToggle');
    
    filterVisible = !filterVisible;
    
    if (filterVisible) {
        filterBlock.classList.add('active');
        filterToggle.classList.add('active');
    } else {
        filterBlock.classList.remove('active');
        filterToggle.classList.remove('active');
    }
}

function applyFilters() {
    const searchTerm = document.getElementById('searchInput').value.toLowerCase().trim();
    const tariffFilter = document.getElementById('filterTariff').value;
    
    activeFilters.search = searchTerm;
    activeFilters.tariff = tariffFilter;
    
    const items = document.querySelectorAll('#personList li');
    let visibleCount = 0;
    
    items.forEach(item => {
        const name = item.querySelector('.name').textContent.toLowerCase();
        const tariff = item.dataset.tariff;
        
        const matchesSearch = name.includes(searchTerm);
        const matchesTariff = tariffFilter === 'all' || tariff === tariffFilter;
        
        if (matchesSearch && matchesTariff) {
            item.style.display = 'flex';
            visibleCount++;
        } else {
            item.style.display = 'none';
        }
    });
    
    // Обновляем счетчик видимых элементов
    document.getElementById('personCount').textContent = visibleCount;
    updateFilterIndicator();
}

function resetFilters() {
    document.getElementById('searchInput').value = '';
    document.getElementById('filterTariff').value = 'all';
    applyFilters();
}

function playAlert() {
    const audio = document.getElementById('alertSound');
    if (audio) {
        audio.play().catch(e => console.log('Audio play failed:', e));
    }
}

function updateEmptyState() {
    const list = document.getElementById('personList');
    const emptyState = document.getElementById('emptyState');
    
    if (list.children.length === 0) {
        emptyState.style.display = 'block';
    } else {
        emptyState.style.display = 'none';
    }
}

function updatePersonCount() {
    const count = document.querySelectorAll('#personList li').length;
    document.getElementById('personCount').textContent = count;
    updateEmptyState();
}

function updateFilterIndicator() {
    const indicator = document.querySelector('.filter-indicator');
    const hasActiveFilters = activeFilters.search !== '' || activeFilters.tariff !== 'all';
    
    if (hasActiveFilters) {
        indicator.style.display = 'flex';
    } else {
        indicator.style.display = 'none';
    }
}

// Инициализация при загрузке страницы
document.addEventListener('DOMContentLoaded', function() {
    updateEmptyState();
    updatePersonCount();
    updateFilterIndicator();

    // Очистка таймеров при уходе со страницы
    window.addEventListener('beforeunload', function() {
        timers.forEach(timerData => clearInterval(timerData.interval));
        timers.clear();
    });
});