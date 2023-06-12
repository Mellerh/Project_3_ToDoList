(function(){

    // GLOBALS

    let todos = [];
    let users = [];

    // получаем ul, куда будем сохранять новые li
    const todoList = document.getElementById('todo-list');

    // получем список пользователей
    const userTodo = document.getElementById('user-todo');

    // получаем form 
    const form = document.querySelector('form');




    // ATTACH EVENTS (привязываем событие). 
    
    document.addEventListener('DOMContentLoaded', initApp);
    // вешаем на неё обработчик сабмит (отправка формы)
    form.addEventListener('submit', handleSubmit);





    // BASIC LOGIC

    // создаём функцию, которая будет возвращать имя пользователя по его идентификатору. функция вызывается в функции printTodo
    function getUserName(userdId) {
        const nameOfUser = users.find(user => user.id === userdId);
        return nameOfUser.name;
    }

    // отрисовываем li. функция получает все ключи, которые есть у объекта с сервера с задачами. тспользуем деструктуризацию объекта
    function printTodo({userId, id, title, completed}) {
        const li = document.createElement('li');
        li.className = 'todo-item';

        // для li добавляем dataset атрибут с id, чтобы отличать их
        li.dataset.id = id;

        // создаём разметку внутри li. <i>-курсив. <b>-жирный
        li.innerHTML = `<span>${title} <i>by</i> <b>${getUserName(userId)}</b></span>`;

        // добавляем чекбокс
        const status = document.createElement('input')
        status.type = 'checkbox';
        // comleted содержит true/false. от этого будет зависите галочка на чекбоксе
        status.checked = completed;
        status.dataset.idstatus = id

        // добавляем событие клик на статус, при на жатии на который мы будем отправлять обновлённый статус кнопки (задачи)
        status.addEventListener('click', handleStatusClick);

        // создаём кнопку закрытия
        const closet = document.createElement('span')
        closet.innerHTML = '&times;';
        closet.className = 'close';

        // добавляем обработчик на крестик для удаления задачи с сервера и из DOM
        closet.addEventListener('click', handeleRemoveClick);
        

        // добавляем чекбокс в начало li
        li.prepend(status);
        // добавляем кнопку закрытия в конец li
        li.append(closet);

        // добавляем li в начало списка ul
        todoList.prepend(li)

    }

    // отрисовываем пользователей в <select>
    function addUsers({id, name}) {
        const option = document.createElement('option');
        option.innerText = name;
        option.value = id;

        userTodo.append(option);
    }

    // получаем задачу, которую ввёл пользователь. а также получаем id юзера, которого выбрал пользователь
    function handleSubmit(event) {
        event.preventDefault();

        // с помощью form.todo.value мы получаем значение в input
        const inputValue = form.todo.value;
        // с помощью form.user.value мы получаем выбранного пользователя
        const userId = form.user.value;

        addTodo({
            userId: Number(userId),
            title: inputValue,
            completed: false
        });
    }


    // находим id родительского элемента крестика и отправляем этот id в асинхронную функцию для удаления всего элемента с сервера.
    function handeleRemoveClick() {
        // получаем родительский элемент(li) у дочернего крестика(span)
        const toDoLi = this.parentElement;

        // передаём в асинхронную функцию id родительского li для удаления todo с сервера
        removeTodo(toDoLi.dataset.id);
    }


    // если на сервере todo удалилась, (response=ok), то удаляем todo из DOM
    function removeTodoDom(todoId) {
        
        // находим элемент li по его data-id 
        const todoLi = document.querySelector(`[data-id="${todoId}"]`)
        
        // удаляем элемент из DOM
        todoLi.remove();
    }


    // функция вызовется, если случится какая-то ошибка
    function alertError(error) {
        alert(`Сервер недоступен. ${error}`);
    }





    // EVENT LOGIC

    // функция получает задачи и пользователей и сохраняет их в переменные. также функция отправляет полученные данные для отрисовки в ul
    function initApp() { 

        // используем метод Promise.all
        Promise.all([getTodos(), getTUsers()]).then(function(values) {
            // получаем массив массивов и диструктурируем эти массивы по переменным
            [todos, users] = values;

            // отправляем данные в разметку. черз forEach применяем фукнцию ко всем объектам массива. printTodo принимает 4 параметра - все они ключи объекта todo
            todos.forEach((todo) => printTodo(todo));

            // к каждому объекту массива с пользователями применяем addUsers для отрисовки пользователей в списке
            users.forEach(user => addUsers(user));
        })
    }


    // асинхронно получаем все задачи
    async function getTodos() {

        // создаём обработчик ошибок
        try {
            let response = await fetch('https://jsonplaceholder.typicode.com/todos?_limit=15');
            let data = await response.json();
        
            return data
            
        } catch (error) {
            alertError(error);
        }
    }

    // асинхронно получаем всех пользователей
    async function getTUsers() {

        // создаём обработчик ошибок
        try {
            let response = await fetch('https://jsonplaceholder.typicode.com/users?_limit=5');
            let data = await response.json();
        
            return data
            
        } catch (error) {
            alertError(error);
        }
    }

    // асинхронно отправляем новые задачи на сервер
    async function addTodo(todo) {

        const response = await fetch('https://jsonplaceholder.typicode.com/todos', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            // преобразовываем полученный объект в json-формат для сервера
            body: JSON.stringify(todo),
        })

        // с помощью await говорим, что распирсим response только тогда, когда придёт ответ из fetch
        const newUser = await response.json();
        
        printTodo(newUser);
    }

    // обрабатываем изменение статуса при нажатии на кнопку и асинхронно отправляем обновлённый статус на сервер
    async function handleStatusClick() {

        // получаем номер чекбокса для передачи его в url
        const idOfCheckbox = this.dataset.idstatus;
        
        const response = await fetch(`https://jsonplaceholder.typicode.com/todos/${idOfCheckbox}`, {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({completed: this.checked}),
        })

        // статус чекбокса изменяется при нажатии
        // const newStatus = await response.json().then(data => console.log(data))
    }


    // пишем асинхронную функцию для удаления toDo с сервера. функция получает в качестве агрумента id родительского li
    async function removeTodo(todoId) {

        const response = await fetch(`https://jsonplaceholder.typicode.com/todos/${todoId}`, {
            method: 'DELETE'
        })

        const data = await response.json();
        // убеждаемся, что нам пришёл пустой объект. значит, сервер удалил объект с сервера
        console.log(data);
        
        // если на сервере задача удалилась, то удаляем задачу из списка на сайте
        if (response.ok) {
            removeTodoDom(todoId);
        }
    }

}) ()

