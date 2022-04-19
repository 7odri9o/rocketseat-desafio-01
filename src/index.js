const express = require('express');
const cors = require('cors');

const { v4: uuidv4, validate: isValidUuidV4 } = require('uuid');
const res = require('express/lib/response');

const app = express();

app.use(cors());
app.use(express.json());

const users = []

function checksCreateTodosUserAvailability(request, response, next) {
  const { user } = request

  if (user.todos.length < 10 || user.pro) {
    return next()
  }

  return response.status(403).json({
    error: 'Become pro to create more than ten todo\'s'
  })
}

function findUserById(request, response, next) {
  const { id } = request.params
  const existingUser = users.find(user => user.id === id)

  if (!existingUser) {
    return response.status(404).json({
      error: 'User not found'
    })
  }

  request.user = existingUser

  return next()
}

function checksExistsUserAccount(request, response, next) {
  const { username } = request.headers
  const existingUser = users.find(user => user.username === username)
  if (!existingUser) {
    return response.status(404).json({
      error: 'User not found'
    })
  }

  request.user = existingUser

  return next()
}

function checksTodoExists(request, response, next) {
  const { username } = request.headers
  const { id } = request.params

  if (!isValidUuidV4(id)) {
    return response.status(400).json({
      error: 'Invalid id'
    })
  }

  const existingUser = users.find(user => user.username === username)

  if (!existingUser) {
    return response.status(404).json({
      error: 'User not found'
    })
  }

  const existingTodo = existingUser.todos.find(todo => todo.id === id)

  if (!existingTodo) {
    return response.status(404).json({
      error: 'Todo not found'
    })
  }

  request.user = existingUser
  request.todo = existingTodo

  return next()
}

app.get('/users/:id', findUserById, (request, response) => {
  const { user } = request

  return response.status(200).json(user);
});

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
    pro: false,
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

app.post('/todos', checksExistsUserAccount, checksCreateTodosUserAvailability, (request, response) => {
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

app.put('/todos/:id', checksExistsUserAccount, checksTodoExists, (request, response) => {
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

app.patch('/todos/:id/done', checksExistsUserAccount, checksTodoExists, (request, response) => {
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

app.delete('/todos/:id', checksExistsUserAccount, checksTodoExists, (request, response) => {
  const { id } = request.params
  const { username } = request.headers
  const indexOfUser = users.findIndex(user => user.username === username)

  const indexOfTodo = users[indexOfUser].todos.findIndex(todo => todo.id === id)
  users[indexOfUser].todos.splice(indexOfTodo, 1)

  return response.status(204).end()
});

module.exports = {
  app,
  users,
  checksExistsUserAccount,
  checksCreateTodosUserAvailability,
  checksTodoExists,
  findUserById
};