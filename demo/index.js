import { html, render } from '../src/lite-html.js';

let todos = [];
const container = document.getElementById('container');

const add = () => {
  const input = document.getElementById('input');
  if (input.value) {
    todos.push({ id: Math.random(), text: input.value });
    input.value = '';
    render(template(), container);
  }
};

const remove = e => {
  const removedTodo = e.target.parentNode.todo;
  todos = todos.filter(todo => todo.id !== removedTodo);
  render(template(), container);
};

const template = () => {
  return html`
      <!-- ${'todo-app'}> -->
      <input id="input"></input>
      <button attribute=${'something'} @click=${add}>Add todo</button>
      ${todos.map(
        todo => html`
        <p .todo=${todo.id}>
          <button @click=${remove}>X</button> - ${todo.text}
        </p>`
      )}
    `;
};

render(template(), container);
