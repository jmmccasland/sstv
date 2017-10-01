import 'whatwg-fetch';
import data from './data.js';

// for (let i = 0; i < data.playlists[0].videos.length; i += 1) {
//   const rowItem = document.createElement('DIV');
//   rowItem.classList.add('row__item');
//   rowItem.innerHTML = data.playlists[0].videos[i].url;
//   row.appendChild(rowItem);
// }


// Create row and add playlist to row
for (let i = 0; i < data.playlists.length; i += 1) {
  // Create row
  const row = document.createElement('DIV');
  row.classList.add('row');
  document.querySelector('.artist').appendChild(row);
  console.log('create playlist row' + i);

  for (let j = 0; j < data.playlists[i].videos.length; j += 1) {
    const rowItem = document.createElement('DIV');
    rowItem.classList.add('row__item');
    rowItem.innerHTML = data.playlists[i].videos[j].url;
    row.appendChild(rowItem);
    console.log('create video row__item' + j);
  }

  // console.log('done creating playlist & videos' + j);
}
