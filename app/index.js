import 'whatwg-fetch';
import data from './data.js';

const row = document.querySelector('.row');

for (let i = 0; i < data.playlists[0].videos.length; i += 1) {
  const rowItem = document.createElement('DIV');
  rowItem.classList.add('row__item');
  rowItem.innerHTML = data.playlists[0].videos[i].url;
  row.appendChild(rowItem);
}
