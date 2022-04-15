const express = require('express');
const cors = require('cors');

const { v4: uuidv4 } = require('uuid');
const res = require('express/lib/response');

const app = express();

app.use(cors());
app.use(express.json());

const users = []

function checksExistsUserAccount(request, response, next) {
  const { username } = request.headers
  const existingUser = users.find(user => user.username === username)
  if (!existingUser) {
    return response.status(404).json({
      error: 'User not found'
    })
  }

  return next()
}

function checksExistsTodo(request, response, next) {
  const { username } = request.headers
  const { id } = request.params
  const existingUser = users.find(user => user.username === username)
  const existingTodo = existingUser.todos.find(todo => todo.id === id)

  if (!existingTodo) {
    return response.status(404).json({
      error: 'Todo not found'
    })
  }

  return next()
}

app.post('/users', (request, response) => {
  const { name, username } = request.body

  const existingUser = users.find(user => user.username === username)
  if (existingUser) {
    return response.status(400).json({
      error: 'User already exists'
    })
  }

  const id = uuidv4()

  const newUser = {
    id,
    name,
    username,
    todos: []
  }

  users.push(newUser)
  return response.status(201).json(newUser)
})

app.get('/todos', checksExistsUserAccount, (request, response) => {
  const { username } = request.headers
  const { todos } = users.find(user => user.username === username)

  return response.status(200).json(todos)
});

app.post('/todos', checksExistsUserAccount, (request, response) => {
  const { username } = request.headers
  const { title, deadline } = request.body
  const indexOfUser = users.findIndex(user => user.username === username)

  const todo = {
    id: uuidv4(),
    title,
    deadline: new Date(deadline),
    done: false,
    created_at: new Date()
  }

  users[indexOfUser].todos.push(todo)

  return response.status(201).json(todo)
});

app.put('/todos/:id', checksExistsUserAccount, checksExistsTodo, (request, response) => {
  const { id } = request.params
  const { username } = request.headers
  const { title, deadline } = request.body
  const indexOfUser = users.findIndex(user => user.username === username)

  const indexOfTodo = users[indexOfUser].todos.findIndex(todo => todo.id === id)
  const todo = users[indexOfUser].todos[indexOfTodo]

  const updatedTodo = {
    ...todo,
    title,
    deadline
  }

  users[indexOfUser].todos[indexOfTodo] = updatedTodo

  return response.status(200).json(updatedTodo)
})

app.patch('/todos/:id/done', checksExistsUserAccount, checksExistsTodo, (request, response) => {
  const { id } = request.params
  const { username } = request.headers
  const indexOfUser = users.findIndex(user => user.username === username)

  const indexOfTodo = users[indexOfUser].todos.findIndex(todo => todo.id === id)
  const todo = users[indexOfUser].todos[indexOfTodo]

  const updatedTodo = {
    ...todo,
    done: true
  }

  users[indexOfUser].todos[indexOfTodo] = updatedTodo

  return response.status(200).json(updatedTodo)
});

app.delete('/todos/:id', checksExistsUserAccount, checksExistsTodo, (request, response) => {
  const { id } = request.params
  const { username } = request.headers
  const indexOfUser = users.findIndex(user => user.username === username)

  const indexOfTodo = users[indexOfUser].todos.findIndex(todo => todo.id === id)
  users[indexOfUser].todos.splice(indexOfTodo, 1)

  return response.status(204).end()
});

module.exports = app;