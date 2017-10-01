import 'whatwg-fetch';
import data from './data';
// import videos from './videos';
// videos();


const body = document.querySelector('body');

function createYoutubeVideo(i) {
  // Loop through playlist videos
  for (let j = 0; j < data.playlists[i].videos.length; j += 1) {
    // console.log(data.playlists[i].videos[j]);
    // create youtube element
    const youtube = document.createElement('DIV');
    youtube.classList.add('youtube');
    body.appendChild(youtube);

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
  }
}

for (let i = 0; i < data.playlists.length; i += 1) {
  createYoutubeVideo(i);
}
