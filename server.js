// Import the express npm package from the node_modules directory
import express from 'express';

// Import the fetchJson function from the ./helpers directory
import fetchJson from './helpers/fetch-json.js';

// Set the base API endpoint
const redpers_url = 'https://redpers.nl/wp-json/wp/v2';
const directus_url = 'https://fdnd-agency.directus.app/items/redpers_shares'

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
    const categoriesURL = `${redpers_url}/categories?per_page=100`;
    const postsUrl = `${redpers_url}/posts`;
    const sharesUrl = `${directus_url}`;

    // Fetch posts, categories, and shares concurrently
    Promise.all([fetchJson(categoriesURL), fetchJson(postsUrl), fetchJson(sharesUrl)])
        .then(([categoriesData, postsData, sharesData]) => {
            // Map over the postsData array and add shares information to each article
            postsData.forEach((article) => {
                const shareInfo = sharesData.data.find((share) => share.slug === article.slug);
                article.shares = shareInfo ? shareInfo.shares : 0;
            });

            // Render index.ejs and pass the fetched data as 'posts' and 'categories' variables
            response.render('index', { categories: categoriesData, posts: postsData });
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

    fetchJson(`${redpers_url}/categories?slug=${categorySlug}`)
        .then((categoriesData) => {
            if (categoriesData.length === 0) {
                // If no category found, return 404
                response.status(404).send('Category not found');
                return;
            }

            const categoryId = categoriesData[0].id;

            // Fetch posts from the API based on category id
            fetchJson(`${redpers_url}/posts?categories=${categoryId}`)
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
    const currentUrl = `${request.protocol}://${request.get('host')}${request.originalUrl}`; // Get the URL of the current post

    fetchJson(`${redpers_url}/categories?slug=${categorySlug}`)
        .then((categoriesData) => {
            if (categoriesData.length === 0) {
                // If no category found, return 404
                response.status(404).send('Category not found');
                return;
            }

            // Fetch the post with the given slug from the API
            fetchJson(`${redpers_url}/posts?slug=${postSlug}`)
                .then((postsData) => {
                    if (postsData.length === 0) {
                        // If no post found, return 404
                        response.status(404).send('Post not found');
                        return;
                    }

                    // Fetch shares data from Directus API
                    fetchJson(`${directus_url}?filter[slug][_eq]=${postSlug}`)
                        .then(({ data }) => {
                            const shares = data.length > 0 ? data[0].shares : 0;

                            // Render post.ejs and pass the fetched data
                            response.render('post', { post: postsData[0], categories: categoriesData, currentUrl, shares });
                        })
                        .catch((error) => {
                            console.error('Error fetching shares data:', error);
                            // Render post.ejs even if shares data cannot be fetched
                            response.render('post', { post: postsData[0], categories: categoriesData, currentUrl, shares: 0 });
                        });
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

// POST route to increment shares count
app.post('/:categorySlug/:postSlug', (request, response) => {
    const postSlug = request.params.postSlug;

    fetchJson(`${directus_url}?filter[slug][_eq]=${postSlug}`)
        .then(({ data }) => {
            // Perform a PATCH request on Directus API to update shares count
            fetchJson(`${directus_url}/${data[0]?.id ? data[0].id : ''}`, {
                method: data[0]?.id ? 'PATCH' : 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    slug: postSlug,
                    shares: data.length > 0 ? data[0].shares + 1 : 1,
                }),
            })
            .then((result) => {
                // Redirect to the article page after updating shares count
                response.redirect(301, `/${request.params.categorySlug}/${postSlug}`);
            })
            .catch((error) => {
                console.error('Error updating shares count:', error);
                // Redirect to the article page even if shares count cannot be updated
                response.redirect(301, `/${request.params.categorySlug}/${postSlug}`);
            });
        })
        .catch((error) => {
            console.error('Error fetching shares data:', error);
            // Redirect to the article page if shares data cannot be fetched
            response.redirect(301, `/${request.params.categorySlug}/${postSlug}`);
        });
});


// Set the port number for express to listen on
app.set('port', process.env.PORT || 8000);

// Start express and listen on the specified port
app.listen(app.get('port'), function () {
    // Log a message to the console with the port number
    console.log(`Application started on http://localhost:${app.get('port')}`);
});
