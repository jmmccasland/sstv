import 'whatwg-fetch';
import data from './data.js';

function createYoutubeVideo(i, j) {
  // create youtube element
  const youtube = document.createElement('DIV');
  youtube.classList.add('youtube');

  // thumbnail image source.
  const source = `https://img.youtube.com/vi/${data.playlists[i].videos[j].id}/sddefault.jpg`;

  // Load the image asynchronously
  const image = new Image();
  image.src = source;
  image.addEventListener('load', function () {
    youtube.appendChild(image);
  }(i));

  youtube.addEventListener('click', function () {
    const iframe = document.createElement('iframe');
    iframe.setAttribute('frameborder', '0');
    iframe.setAttribute('allowfullscreen', '');
    iframe.setAttribute('src', `https://www.youtube.com/embed/${data.playlists[i].videos[0].id}?rel=0&showinfo=0&autoplay=1`);
    this.innerHTML = '';
    this.appendChild(iframe);
  });

  return youtube;
}

const sectionArtists = document.querySelector('.section--artists');

for (let i = 0; i < data.playlists.length; i += 1) {
  // create artist container row
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
    // rowItem.innerHTML = data.playlists[i].videos[j].url;
    row.appendChild(rowItem);

    const video = createYoutubeVideo(i, j);
    rowItem.appendChild(video);
  }
}
