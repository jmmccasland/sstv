(function () {
'use strict';

(function(self) {
  'use strict';

  if (self.fetch) {
    return
  }

  var support = {
    searchParams: 'URLSearchParams' in self,
    iterable: 'Symbol' in self && 'iterator' in Symbol,
    blob: 'FileReader' in self && 'Blob' in self && (function() {
      try {
        new Blob();
        return true
      } catch(e) {
        return false
      }
    })(),
    formData: 'FormData' in self,
    arrayBuffer: 'ArrayBuffer' in self
  };

  if (support.arrayBuffer) {
    var viewClasses = [
      '[object Int8Array]',
      '[object Uint8Array]',
      '[object Uint8ClampedArray]',
      '[object Int16Array]',
      '[object Uint16Array]',
      '[object Int32Array]',
      '[object Uint32Array]',
      '[object Float32Array]',
      '[object Float64Array]'
    ];

    var isDataView = function(obj) {
      return obj && DataView.prototype.isPrototypeOf(obj)
    };

    var isArrayBufferView = ArrayBuffer.isView || function(obj) {
      return obj && viewClasses.indexOf(Object.prototype.toString.call(obj)) > -1
    };
  }

  function normalizeName(name) {
    if (typeof name !== 'string') {
      name = String(name);
    }
    if (/[^a-z0-9\-#$%&'*+.\^_`|~]/i.test(name)) {
      throw new TypeError('Invalid character in header field name')
    }
    return name.toLowerCase()
  }

  function normalizeValue(value) {
    if (typeof value !== 'string') {
      value = String(value);
    }
    return value
  }

  // Build a destructive iterator for the value list
  function iteratorFor(items) {
    var iterator = {
      next: function() {
        var value = items.shift();
        return {done: value === undefined, value: value}
      }
    };

    if (support.iterable) {
      iterator[Symbol.iterator] = function() {
        return iterator
      };
    }

    return iterator
  }

  function Headers(headers) {
    this.map = {};

    if (headers instanceof Headers) {
      headers.forEach(function(value, name) {
        this.append(name, value);
      }, this);
    } else if (Array.isArray(headers)) {
      headers.forEach(function(header) {
        this.append(header[0], header[1]);
      }, this);
    } else if (headers) {
      Object.getOwnPropertyNames(headers).forEach(function(name) {
        this.append(name, headers[name]);
      }, this);
    }
  }

  Headers.prototype.append = function(name, value) {
    name = normalizeName(name);
    value = normalizeValue(value);
    var oldValue = this.map[name];
    this.map[name] = oldValue ? oldValue+','+value : value;
  };

  Headers.prototype['delete'] = function(name) {
    delete this.map[normalizeName(name)];
  };

  Headers.prototype.get = function(name) {
    name = normalizeName(name);
    return this.has(name) ? this.map[name] : null
  };

  Headers.prototype.has = function(name) {
    return this.map.hasOwnProperty(normalizeName(name))
  };

  Headers.prototype.set = function(name, value) {
    this.map[normalizeName(name)] = normalizeValue(value);
  };

  Headers.prototype.forEach = function(callback, thisArg) {
    for (var name in this.map) {
      if (this.map.hasOwnProperty(name)) {
        callback.call(thisArg, this.map[name], name, this);
      }
    }
  };

  Headers.prototype.keys = function() {
    var items = [];
    this.forEach(function(value, name) { items.push(name); });
    return iteratorFor(items)
  };

  Headers.prototype.values = function() {
    var items = [];
    this.forEach(function(value) { items.push(value); });
    return iteratorFor(items)
  };

  Headers.prototype.entries = function() {
    var items = [];
    this.forEach(function(value, name) { items.push([name, value]); });
    return iteratorFor(items)
  };

  if (support.iterable) {
    Headers.prototype[Symbol.iterator] = Headers.prototype.entries;
  }

  function consumed(body) {
    if (body.bodyUsed) {
      return Promise.reject(new TypeError('Already read'))
    }
    body.bodyUsed = true;
  }

  function fileReaderReady(reader) {
    return new Promise(function(resolve, reject) {
      reader.onload = function() {
        resolve(reader.result);
      };
      reader.onerror = function() {
        reject(reader.error);
      };
    })
  }

  function readBlobAsArrayBuffer(blob) {
    var reader = new FileReader();
    var promise = fileReaderReady(reader);
    reader.readAsArrayBuffer(blob);
    return promise
  }

  function readBlobAsText(blob) {
    var reader = new FileReader();
    var promise = fileReaderReady(reader);
    reader.readAsText(blob);
    return promise
  }

  function readArrayBufferAsText(buf) {
    var view = new Uint8Array(buf);
    var chars = new Array(view.length);

    for (var i = 0; i < view.length; i++) {
      chars[i] = String.fromCharCode(view[i]);
    }
    return chars.join('')
  }

  function bufferClone(buf) {
    if (buf.slice) {
      return buf.slice(0)
    } else {
      var view = new Uint8Array(buf.byteLength);
      view.set(new Uint8Array(buf));
      return view.buffer
    }
  }

  function Body() {
    this.bodyUsed = false;

    this._initBody = function(body) {
      this._bodyInit = body;
      if (!body) {
        this._bodyText = '';
      } else if (typeof body === 'string') {
        this._bodyText = body;
      } else if (support.blob && Blob.prototype.isPrototypeOf(body)) {
        this._bodyBlob = body;
      } else if (support.formData && FormData.prototype.isPrototypeOf(body)) {
        this._bodyFormData = body;
      } else if (support.searchParams && URLSearchParams.prototype.isPrototypeOf(body)) {
        this._bodyText = body.toString();
      } else if (support.arrayBuffer && support.blob && isDataView(body)) {
        this._bodyArrayBuffer = bufferClone(body.buffer);
        // IE 10-11 can't handle a DataView body.
        this._bodyInit = new Blob([this._bodyArrayBuffer]);
      } else if (support.arrayBuffer && (ArrayBuffer.prototype.isPrototypeOf(body) || isArrayBufferView(body))) {
        this._bodyArrayBuffer = bufferClone(body);
      } else {
        throw new Error('unsupported BodyInit type')
      }

      if (!this.headers.get('content-type')) {
        if (typeof body === 'string') {
          this.headers.set('content-type', 'text/plain;charset=UTF-8');
        } else if (this._bodyBlob && this._bodyBlob.type) {
          this.headers.set('content-type', this._bodyBlob.type);
        } else if (support.searchParams && URLSearchParams.prototype.isPrototypeOf(body)) {
          this.headers.set('content-type', 'application/x-www-form-urlencoded;charset=UTF-8');
        }
      }
    };

    if (support.blob) {
      this.blob = function() {
        var rejected = consumed(this);
        if (rejected) {
          return rejected
        }

        if (this._bodyBlob) {
          return Promise.resolve(this._bodyBlob)
        } else if (this._bodyArrayBuffer) {
          return Promise.resolve(new Blob([this._bodyArrayBuffer]))
        } else if (this._bodyFormData) {
          throw new Error('could not read FormData body as blob')
        } else {
          return Promise.resolve(new Blob([this._bodyText]))
        }
      };

      this.arrayBuffer = function() {
        if (this._bodyArrayBuffer) {
          return consumed(this) || Promise.resolve(this._bodyArrayBuffer)
        } else {
          return this.blob().then(readBlobAsArrayBuffer)
        }
      };
    }

    this.text = function() {
      var rejected = consumed(this);
      if (rejected) {
        return rejected
      }

      if (this._bodyBlob) {
        return readBlobAsText(this._bodyBlob)
      } else if (this._bodyArrayBuffer) {
        return Promise.resolve(readArrayBufferAsText(this._bodyArrayBuffer))
      } else if (this._bodyFormData) {
        throw new Error('could not read FormData body as text')
      } else {
        return Promise.resolve(this._bodyText)
      }
    };

    if (support.formData) {
      this.formData = function() {
        return this.text().then(decode)
      };
    }

    this.json = function() {
      return this.text().then(JSON.parse)
    };

    return this
  }

  // HTTP methods whose capitalization should be normalized
  var methods = ['DELETE', 'GET', 'HEAD', 'OPTIONS', 'POST', 'PUT'];

  function normalizeMethod(method) {
    var upcased = method.toUpperCase();
    return (methods.indexOf(upcased) > -1) ? upcased : method
  }

  function Request(input, options) {
    options = options || {};
    var body = options.body;

    if (input instanceof Request) {
      if (input.bodyUsed) {
        throw new TypeError('Already read')
      }
      this.url = input.url;
      this.credentials = input.credentials;
      if (!options.headers) {
        this.headers = new Headers(input.headers);
      }
      this.method = input.method;
      this.mode = input.mode;
      if (!body && input._bodyInit != null) {
        body = input._bodyInit;
        input.bodyUsed = true;
      }
    } else {
      this.url = String(input);
    }

    this.credentials = options.credentials || this.credentials || 'omit';
    if (options.headers || !this.headers) {
      this.headers = new Headers(options.headers);
    }
    this.method = normalizeMethod(options.method || this.method || 'GET');
    this.mode = options.mode || this.mode || null;
    this.referrer = null;

    if ((this.method === 'GET' || this.method === 'HEAD') && body) {
      throw new TypeError('Body not allowed for GET or HEAD requests')
    }
    this._initBody(body);
  }

  Request.prototype.clone = function() {
    return new Request(this, { body: this._bodyInit })
  };

  function decode(body) {
    var form = new FormData();
    body.trim().split('&').forEach(function(bytes) {
      if (bytes) {
        var split = bytes.split('=');
        var name = split.shift().replace(/\+/g, ' ');
        var value = split.join('=').replace(/\+/g, ' ');
        form.append(decodeURIComponent(name), decodeURIComponent(value));
      }
    });
    return form
  }

  function parseHeaders(rawHeaders) {
    var headers = new Headers();
    rawHeaders.split(/\r?\n/).forEach(function(line) {
      var parts = line.split(':');
      var key = parts.shift().trim();
      if (key) {
        var value = parts.join(':').trim();
        headers.append(key, value);
      }
    });
    return headers
  }

  Body.call(Request.prototype);

  function Response(bodyInit, options) {
    if (!options) {
      options = {};
    }

    this.type = 'default';
    this.status = 'status' in options ? options.status : 200;
    this.ok = this.status >= 200 && this.status < 300;
    this.statusText = 'statusText' in options ? options.statusText : 'OK';
    this.headers = new Headers(options.headers);
    this.url = options.url || '';
    this._initBody(bodyInit);
  }

  Body.call(Response.prototype);

  Response.prototype.clone = function() {
    return new Response(this._bodyInit, {
      status: this.status,
      statusText: this.statusText,
      headers: new Headers(this.headers),
      url: this.url
    })
  };

  Response.error = function() {
    var response = new Response(null, {status: 0, statusText: ''});
    response.type = 'error';
    return response
  };

  var redirectStatuses = [301, 302, 303, 307, 308];

  Response.redirect = function(url, status) {
    if (redirectStatuses.indexOf(status) === -1) {
      throw new RangeError('Invalid status code')
    }

    return new Response(null, {status: status, headers: {location: url}})
  };

  self.Headers = Headers;
  self.Request = Request;
  self.Response = Response;

  self.fetch = function(input, init) {
    return new Promise(function(resolve, reject) {
      var request = new Request(input, init);
      var xhr = new XMLHttpRequest();

      xhr.onload = function() {
        var options = {
          status: xhr.status,
          statusText: xhr.statusText,
          headers: parseHeaders(xhr.getAllResponseHeaders() || '')
        };
        options.url = 'responseURL' in xhr ? xhr.responseURL : options.headers.get('X-Request-URL');
        var body = 'response' in xhr ? xhr.response : xhr.responseText;
        resolve(new Response(body, options));
      };

      xhr.onerror = function() {
        reject(new TypeError('Network request failed'));
      };

      xhr.ontimeout = function() {
        reject(new TypeError('Network request failed'));
      };

      xhr.open(request.method, request.url, true);

      if (request.credentials === 'include') {
        xhr.withCredentials = true;
      }

      if ('responseType' in xhr && support.blob) {
        xhr.responseType = 'blob';
      }

      request.headers.forEach(function(value, name) {
        xhr.setRequestHeader(name, value);
      });

      xhr.send(typeof request._bodyInit === 'undefined' ? null : request._bodyInit);
    })
  };
  self.fetch.polyfill = true;
})(typeof self !== 'undefined' ? self : undefined);

var data = {
  playlists: [{
    artist: 'YØUTH',
    videos: [{
      title: 'Hey Carolina',
      id: 'jt1xa7uSrK4'
    }, {
      title: 'Alright, Kid',
      id: 'S1vwGCyppTE'
    }]
  }, {
    artist: 'Pocket Science',
    videos: [{
      title: 'Yesterday A Hero',
      id: 'roUOa_uYYks'
    }, {
      title: 'Cult of My Own',
      id: 'fLCyfIr37EY'
    }]
  }, {
    artist: 'Lords of Liechtenstein',
    videos: [{
      title: 'Appomattox',
      id: 'rHiPuI08SiI'
    }, {
      title: 'Bird\'s Eye View',
      id: 'S32853vXVqI'
    }, {
      title: 'Subaru',
      id: 'v5YzqzwO1eA'
    }, {
      title: 'Mattress King',
      id: 'xEIdLvEtY1A'
    }]
  }, {
    artist: 'A Will Away',
    videos: [{
      title: 'Pay Raise',
      id: 'OadUAwfjJRU'
    }, {
      title: 'Gravity',
      id: '-w5rsDa1R5M'
    }, {
      title: 'Chemicals/Crochet',
      id: 'xTNeJmxnAjM'
    }, {
      title: 'Cheap Wine',
      id: 'OCyWSOXYC14'
    }, {
      title: 'My Sitter',
      id: 'NQ5WCB5Yr0U'
    }]
  }, {
    artist: 'Holy Pinto',
    videos: [{
      title: 'Matches',
      id: 'dOlouoqyPuI'
    }, {
      title: 'Very Adult',
      id: 'wl41moj3yHg'
    }, {
      title: 'Gold Leaf',
      id: 'Ihn1vQSgdsI'
    }]
  }, {
    artist: 'Bogues',
    videos: [{
      title: 'Sometimes',
      id: 'Pwg4XFj84_Q'
    }, {
      title: 'Renting and Trashing a Uhaul Van',
      id: 'sOI_J9LNXEk'
    }, {
      title: 'Finger Lakes & The End of Things',
      id: 'mU415gpxzVA'
    }]
  }, {
    artist: 'Pale Lungs',
    videos: [{
      title: 'My Window',
      id: 'uv6FQyxqmLI'
    }, {
      title: 'Days Leave',
      id: 'NYDpa5kmAmI'
    }, {
      title: 'Sanctuaries',
      id: '7wfNWkN2kIE'
    }]
  }, {
    artist: 'American Opera',
    videos: [{
      title: 'Spoons & Knives',
      id: 'EJj62aYFZ6M'
    }, {
      title: 'Small Victories',
      id: 'FzE0z7Zl2K8'
    }, {
      title: 'Songs I Used To Sing',
      id: '9HjgxxE9WFU'
    }]
  }, {
    artist: 'Alex Fraser',
    videos: [{
      title: 'A Song For Suzanne',
      id: 'JhGd--7wpeY'
    }, {
      title: 'Carlisle',
      id: 'S_B1PPC0RXY'
    }, {
      title: 'Homecoming',
      id: 'iKv2qm1sejU'
    }, {
      title: 'Smile',
      id: 'e3W-E91A3OU'
    }]
  }, {
    artist: 'Formative Years',
    videos: [{
      title: 'Wax',
      id: 'PTG-n9NfJ_8'
    }, {
      title: 'Hospitality',
      id: 'lvtPRCCiXdw'
    }, {
      title: 'Weight',
      id: 'UVH_udbgK-o'
    }, {
      title: 'Free',
      id: 'yEzI6csRE7M'
    }, {
      title: 'Motivational Speech',
      id: 'j6Nzimkw_0s'
    }]
  }, {
    artist: 'Carter Hulsey',
    videos: [{
      title: 'NPR feat: American Opera',
      id: 'wIXXZuP_TSM'
    }, {
      title: 'Heart Still Broke',
      id: 'a1RfGXCESWU'
    }, {
      title: 'Haunt Me',
      id: 'Yf1xLnJK1RA'
    }]
  }, {
    artist: 'Fossil Youth',
    videos: [{
      title: 'Watercolor Daydream',
      id: 'zaxXYFDMrwk'
    }, {
      title: 'Common Ghost',
      id: 'zYMF7HwnhLo'
    }, {
      title: 'Sitting in a Spinning Room',
      id: 'mnRKDH3kET8'
    }, {
      title: 'Interview w/ The Local Wave',
      id: 'bCFDJUYCc9A'
    }]
  }, {
    artist: 'Looming',
    videos: [{
      title: 'Waves',
      id: 'jM_xUFMFU8Q'
    }, {
      title: 'Output',
      id: 'T61pKIEPjXA'
    }, {
      title: 'Interview w/ The Local Wave',
      id: 'Olo7MCr03DU'
    }]
  }, {
    artist: 'West Means Home',
    videos: [{
      title: 'Never Again',
      id: 'BnlTfd3RIm0'
    }, {
      title: 'Invitation',
      id: 'YsTtgJDe2LI'
    }, {
      title: 'Supposed To',
      id: 'dk1hewuRl4Q'
    }, {
      title: 'Enemies',
      id: '3CbwBTC0AnQ'
    }]
  }, {
    artist: 'Daisyhead',
    videos: [{
      title: 'Interview w/ The Local Wave',
      id: 'DWpwiFSDz5g'
    }, {
      title: 'Never Know',
      id: 'g4wgFQCONTU'
    }, {
      title: 'Take',
      id: 'c4jXzlvUwZU'
    }, {
      title: 'Bodies',
      id: 'Hd-0DORNbKY'
    }]
  }, {
    artist: 'Julia Louise',
    videos: [{
      title: 'Splinter',
      id: 'sCrs3osjTG8'
    }, {
      title: 'Haze',
      id: 'sct2Obpth1c'
    }, {
      title: 'Eaten Alive!',
      id: 'KRdH3BKDbvc'
    }]
  }, {
    artist: 'Latin Jazz Trio',
    videos: [{
      title: 'The Peanut Vendor',
      id: 'HOkUNPf2uQk'
    }, {
      title: 'In a Manner of Speaking',
      id: 'Z7BTsoLRDi4'
    }]
  }, {
    artist: 'Harper & The Bears',
    videos: [{
      title: 'Birthmark',
      id: '48HSH-qVDgY'
    }, {
      title: 'Washed Up',
      id: '6haQ3aM--Ro'
    }, {
      title: 'Ghost',
      id: '7YApuQVVCF8'
    }]
  }, {
    artist: 'The Touch',
    videos: [{
      title: 'The Connection',
      id: 'V8S_pw0OMlc'
    }, {
      title: 'New Birthday',
      id: 'o42ffZCPOD0'
    }, {
      title: 'I Think I\'m Ready',
      id: '_yyPOM-iBJc'
    }, {
      title: 'Interview',
      id: 'dj1gcmfVgzM'
    }]
  }, {
    artist: 'Backpacks',
    videos: [{
      title: 'Feels Like',
      id: 'V_MSJzjM3qU'
    }, {
      title: 'Every Night',
      id: 'RO1ZN8Hhopk'
    }, {
      title: 'Calls',
      id: 'HglMNJPjBSs'
    }]
  }, {
    artist: 'Mountains Like Wax',
    videos: [{
      title: 'Control',
      id: 'oLyXbohVvB8'
    }, {
      title: 'The Runner',
      id: 'AiNXSH6IUR0'
    }, {
      title: 'Untitled',
      id: 'mW-qkXBcJSU'
    }, {
      title: 'Interview',
      id: 'J1Eelw8c36U'
    }, {
      title: 'Contingency',
      id: 'cEVcieqDXoo'
    }]
  }]
};

var getVideos = function () {
  function createYoutubeVideo(i, j) {
    // create youtube element
    var youtube = document.createElement('DIV');
    youtube.classList.add('youtube');

    // create and add playbutton
    var playBtn = document.createElement('DIV');
    playBtn.classList.add('play-button');
    youtube.appendChild(playBtn);

    // thumbnail image source.
    var source = 'https://img.youtube.com/vi/' + data.playlists[i].videos[j].id + '/sddefault.jpg';

    // Load the image asynchronously
    var image = new Image();
    image.src = source;
    image.addEventListener('load', function () {
      // debugger;
      youtube.appendChild(image);
    }(i));

    // Create iframe on click
    youtube.addEventListener('click', function () {
      var iframe = document.createElement('iframe');
      iframe.setAttribute('frameborder', '0');
      iframe.setAttribute('allowfullscreen', '');
      iframe.setAttribute('src', 'https://www.youtube.com/embed/' + data.playlists[i].videos[j].id + '?rel=0&showinfo=0&autoplay=1');
      this.innerHTML = '';
      this.appendChild(iframe);
    });

    return youtube;
  }

  var sectionArtists = document.querySelector('.section--artists');

  for (var i = 0; i < data.playlists.length; i += 1) {
    // create artist container row
    var artist = document.createElement('DIV');
    artist.classList.add('artist');
    sectionArtists.appendChild(artist);

    // Create artist name
    var artistName = document.createElement('H2');
    artistName.classList.add('artist__name');
    artistName.innerText = data.playlists[i].artist;

    // Create artist row
    var row = document.createElement('DIV');
    row.classList.add('artist__row');

    // add row to artist div
    artist.appendChild(artistName);
    artist.appendChild(row);

    // Loop through playlists[i].videos
    for (var j = 0; j < data.playlists[i].videos.length; j += 1) {
      var rowItem = document.createElement('DIV');
      rowItem.classList.add('artist__row__item');
      row.appendChild(rowItem);

      var video = createYoutubeVideo(i, j);
      rowItem.appendChild(video);
    }
  }
};

getVideos();

}());

//# sourceMappingURL=app.js.map
