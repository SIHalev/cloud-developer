import express from 'express';
import bodyParser from 'body-parser';
import {deleteLocalFiles, filterImageFromURL} from './util/util';

(async () => {

    // Init the Express application
    const app = express();

    // Set the network port
    const port = process.env.PORT || 8080;

    // Use the body parser middleware for post requests
    app.use(bodyParser.json());

    /**************************************************************************** */
    app.get("/filteredimage", async (req, res) => {
        let {image_url} = req.query;

        // Check if there is an image
        if (!image_url) {
            return res.status(400).send("Please provide image_url as query parameter");
        }

        // If it's not an image, we stop the request to go further
        // This can lead to problems with redirecting urls and unsupported file format
        if (!image_url.match(/\.(jpeg|jpg|gif|png|svg)$/)) {
            return res.status(400).send("Please provide image_url with the following formats: jpeg,jpg,gif,png,svg");
        }

        let filterImagePath: string;
        try {
            filterImagePath = await filterImageFromURL(image_url);
            res.status(200).sendFile(filterImagePath)
        } catch (err) {
            res.status(422).send("Please provide correct image url");
        } finally {
            if (filterImagePath) {
                console.log("Deleting files...");
                res.on('finish', () => deleteLocalFiles([filterImagePath]));
            }
        }
    });

    //! END @TODO1

    // Root Endpoint
    // Displays a simple message to the user
    app.get("/", async (req, res) => {
        res.send("try GET /filteredimage?image_url=https://upload.wikimedia.org/wikipedia/commons/7/75/Cute_grey_kitten.jpg")
    });


    // Start the Server
    app.listen(port, () => {
        console.log(`server running http://localhost:${port}`);
        console.log(`press CTRL+C to stop server`);
    });
})();
