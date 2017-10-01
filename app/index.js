import 'whatwg-fetch';
import data from './data.js';

// for (let i = 0; i < data.playlists[0].videos.length; i += 1) {
//   const rowItem = document.createElement('DIV');
//   rowItem.classList.add('row__item');
//   rowItem.innerHTML = data.playlists[0].videos[i].url;
//   row.appendChild(rowItem);
// }


const sectionArtists = document.querySelector('.section--artists');

// Loop through playlists
for (let i = 0; i < data.playlists.length; i += 1) {
  const artist = document.createElement('DIV');
  artist.classList.add('artist');
  sectionArtists.appendChild(artist);

  // Create artist name
  const artistName = document.createElement('H2');
  artistName.classList.add('artist__name');
  artistName.innerText = data.playlists[i].artist;

  // Create artist row
  const row = document.createElement('DIV');
  row.classList.add('artist__row');


  // add row to artist div
  artist.appendChild(artistName);
  artist.appendChild(row);

  // Loop through playlists[i].videos
  for (let j = 0; j < data.playlists[i].videos.length; j += 1) {
    const rowItem = document.createElement('DIV');
    rowItem.classList.add('artist__row__item');
    rowItem.innerHTML = data.playlists[i].videos[j].url;
    row.appendChild(rowItem);
  }
}
