const axios = require('axios');

const client_id = '414df719f85e45c9bd0ee5e83d08b501';
const client_secret = 'fa7e159a0b904b8b8505bf59b6458d3a';

// Function to get access token
const getAccessToken = async () => {
  const tokenUrl = 'https://accounts.spotify.com/api/token';
  const authOptions = {
    headers: {
      'Authorization': 'Basic ' + Buffer.from(client_id + ':' + client_secret).toString('base64'),
      'Content-Type': 'application/x-www-form-urlencoded'
    },
    data: 'grant_type=client_credentials'
  };

  try {
    const response = await axios.post(tokenUrl, authOptions.data, { headers: authOptions.headers });
    return response.data.access_token;
  } catch (error) {
    console.error('Failed to get access token', error.response.data);
    throw error;
  }
};

// Function to search for a track
const searchTrack = async (accessToken, query) => {
  const searchUrl = 'https://api.spotify.com/v1/search';
  const options = {
    headers: {
      'Authorization': `Bearer ${accessToken}`
    },
    params: {
      q: query,
      type: 'track',
      limit: 1
    }
  };

  try {
    const response = await axios.get(searchUrl, options);
    return response.data;
  } catch (error) {
    console.error('Failed to search track', error.response.data);
    throw error;
  }
};

// Function to get Spotify details from URL
const getSpotifyDetails = async (spotifyUrl) => {
  try {
    const response = await axios.get(`https://spotifydownloaders.com/api/getSpotifyDetails?url=${encodeURIComponent(spotifyUrl)}`);
    return response.data;
  } catch (error) {
    console.error('Failed to get Spotify details', error.response.data);
    throw error;
  }
};

// Function to get second download link from external API
const getSecondDownloadLink = async (query) => {
  const apiUrl = `https://music-api-rouge-rho.vercel.app/apiurl?songname=${encodeURIComponent(query)}`;

  try {
    const response = await axios.get(apiUrl);
    return response.data.download_link;
  } catch (error) {
    console.error('Failed to get second download link', error.response.data);
    throw new Error(`Error in making second link: ${error.message}`);
  }
};

// Function to get third download link from external API
const getThirdDownloadLink = async (query) => {
  const apiUrl = `https://yagami-kira.000webhostapp.com/zawspotify.php?text=${encodeURIComponent(query)}`;

  try {
    const response = await axios.get(apiUrl);
    const firstResult = response.data.results[0];
    return firstResult.url;
  } catch (error) {
    console.error('Failed to get third download link', error.response.data);
    throw new Error(`Error in making third link: ${error.message}`);
  }
};

module.exports = async (req, res) => {
  const query = req.query.q;

  if (!query) {
    return res.status(400).json({ error: 'Query parameter "q" is required' });
  }

  try {
    const accessToken = await getAccessToken();
    const searchResults = await searchTrack(accessToken, query);

    const tracks = searchResults.tracks.items;
    if (tracks.length > 0) {
      const track = tracks[0];
      const spotifyUrl = track.external_urls.spotify;
      const spotifyDetails = await getSpotifyDetails(spotifyUrl);

      // Extracting duration, audio link, and image from spotifyDetails
      const { duration, audio, image, download_url } = spotifyDetails.preview;

      // Fetching second download link
      let secondDownloadLink;
      try {
        secondDownloadLink = await getSecondDownloadLink(query);
      } catch (error) {
        secondDownloadLink = `Error in making second link: ${error.message}`;
      }

      // Fetching third download link
      let thirdDownloadLink;
      try {
        thirdDownloadLink = await getThirdDownloadLink(query);
      } catch (error) {
        thirdDownloadLink = `Error in making third link: ${error.message}`;
      }

      return res.status(200).json({
        trackName: track.name,
        artist: track.artists.map(artist => artist.name).join(', '),
        album: track.album.name,
        spotifyUrl: track.external_urls.spotify,
        duration, // Adding duration to the JSON response
        audio, // Adding audio link to the JSON response
        image, // Adding image link to the JSON response
        download_url: `https://hello-eordh.uk325346.workers.dev/?url=${encodeURIComponent(spotifyUrl)}`, // Adding download URL to the JSON response
        second_downloadlink2: secondDownloadLink, // Adding second download link or error message to the JSON response
        third_downloadlink: thirdDownloadLink, // Adding third download link or error message to the JSON response
        developerCredit: 'https://t.me/TryToLiveAlon' // Developer credit URL
      });
    } else {
      return res.status(404).json({ error: 'No tracks found' });
    }
  } catch (error) {
    return res.status(500).json({ error: 'Internal Server Error' });
  }
};
