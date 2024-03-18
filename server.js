// Import the express npm package from the node_modules directory
import express from 'express';

// Import the fetchJson function from the ./helpers directory
import fetchJson from './helpers/fetch-json.js';

// Set the base API endpoint
const apiUrl = 'https://redpers.nl/wp-json/wp/v2';

// Create a new express app
const app = express();

// Set ejs as the template engine
app.set('view engine', 'ejs');

// Make working with request data easier
app.use(express.urlencoded({ extended: true }));

// Set the directory for ejs templates
app.set('views', './views');

// Use the 'public' directory for static resources
app.use(express.static('public'));

// GET route for the index page
app.get('/', function (request, response) {
    // Fetch posts from the API
    const categoriesURL = `${apiUrl}/categories?per_page=100`;
    const postsUrl = `${apiUrl}/posts?per_page=10`;
    const usersUrl = `${apiUrl}/users`;

    // Fetch posts and users concurrently
    Promise.all([fetchJson(categoriesURL), fetchJson(postsUrl), fetchJson(usersUrl)])
        .then(([categoriesData, postsData, usersData]) => {
            // Render index.ejs and pass the fetched data as 'posts' and 'users' variables
            response.render('index', { categories: categoriesData, posts: postsData, users: usersData });
        })
        .catch((error) => {
            // Handle error if fetching data fails
            console.error('Error fetching data:', error);
            response.status(500).send('Error fetching data');
        });
});

// GET route for displaying all posts in a category
app.get('/:categorySlug', function (request, response) {
    const categorySlug = request.params.categorySlug;

    fetchJson(`${apiUrl}/categories?slug=${categorySlug}`)
        .then((categoriesData) => {
            if (categoriesData.length === 0) {
                // If no category found, return 404
                response.status(404).send('Category not found');
                return;
            }

            const categoryId = categoriesData[0].id;

            // Fetch posts from the API based on category id
            fetchJson(`${apiUrl}/posts?categories=${categoryId}`)
                .then((postsData) => {
                    // Render category.ejs and pass the fetched data as 'category' and 'posts' variables
                    response.render('category', { category: categoriesData[0], posts: postsData });
                })
                .catch((error) => {
                    // Handle error if fetching data fails
                    console.error('Error fetching data:', error);
                    response.status(500).send('Error fetching data');
                });
        })
        .catch((error) => {
            // Handle error if fetching data fails
            console.error('Error fetching data:', error);
            response.status(500).send('Error fetching data');
        });
});

// GET route for detail page with request parameters categorySlug and postSlug
app.get('/:categorySlug/:postSlug', function (request, response) {
    const categorySlug = request.params.categorySlug;
    const postSlug = request.params.postSlug;

    fetchJson(`${apiUrl}/categories?slug=${categorySlug}`)
        .then((categoriesData) => {
            if (categoriesData.length === 0) {
                // If no category found, return 404
                response.status(404).send('Category not found');
                return;
            }

            // Fetch the post with the given slug from the API
            fetchJson(`${apiUrl}/posts?slug=${postSlug}`)
                .then((postsData) => {
                    if (postsData.length === 0) {
                        // If no post found, return 404
                        response.status(404).send('Post not found');
                        return;
                    }

                    response.render('post', { post: postsData[0], categories: categoriesData });
                })
                .catch((error) => {
                    // Handle error if fetching data fails
                    console.error('Error fetching data:', error);
                    response.status(404).send('Post not found');
                });
        })
        .catch((error) => {
            // Handle error if fetching data fails
            console.error('Error fetching data:', error);
            response.status(500).send('Error fetching data');
        });
});

// Set the port number for express to listen on
app.set('port', process.env.PORT || 8000);

// Start express and listen on the specified port
app.listen(app.get('port'), function () {
    // Log a message to the console with the port number
    console.log(`Application started on http://localhost:${app.get('port')}`);
});
