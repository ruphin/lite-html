import { parseStrings } from '../src/lib/template-parser.js';
import { marker } from '../src/lib/markers.js';

const htmlStrings = s => s;
const input = htmlStrings`
<div>
  <style type=${1}>
    div {
      color: ${'red'};
      font-weight: ${'bold'};
    }
  </style>
  <style>
    /* <!-- ${1} --> */
  </style>
  Text <span thing attr = ${1}></span>
  <div font="fine" color='"red ${1} blue ${1} yellow' name=bob hue='cyan${1}'> More ${1}Text</div>
  ${1}<!-- Things${1} More things${1} --> After${1} <!----> Text
</div>`;

let { output, parts } = parseStrings(input);

document.getElementById('container').innerText = output.join('');
console.log(parts);

const template = document.createElement('template');
template.innerHTML = output.join('');

const printFragment = template.content.cloneNode(true);
console.log(printFragment);
document.getElementById('container').innerText = printFragment.innerHTML;

const fragment = template.content.cloneNode(true);

const walker = document.createTreeWalker(fragment, 128 /* NodeFilter.SHOW_COMMENT */, null, false);

let commentNode = walker.nextNode();
while (commentNode) {
  console.log(commentNode);
  commentNode = walker.nextNode();
}

// parts.forEach(partList => {
//   let commentNode = walker.nextNode();
//   while (commentNode.textContent !== marker) {
//     console.log(commentNode);
//     commentNode = walker.nextNode();
//   }
//   console.log(commentNode.nextSibling);
//   partList.forEach(part => {
//     new part.part({ node: commentNode, ...part }).render(1);
//   });
// });
