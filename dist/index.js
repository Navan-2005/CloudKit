import express from "express";
import cors from "cors";
import { simpleGit } from "simple-git"; // ✅ named import
import { generate } from "./utils.js";
const app = express();
app.use(cors());
app.use(express.json()); // ✅ needed to parse JSON bodies
app.post('/deploy', async (req, res) => {
    try {
        const repoUrl = req.body.repoUrl;
        if (!repoUrl) {
            return res.status(400).json({ error: "Missing repoUrl" });
        }
        const git = simpleGit(); // ✅ initialize simpleGit
        const id = generate();
        await git.clone(repoUrl, `output/${id}`);
        res.json({ message: "Repository cloned successfully!" });
    }
    catch (err) {
        console.error(err);
        res.status(500).json({ error: "Failed to clone repository" });
    }
});
app.listen(3000, () => console.log("Server started at http://localhost:3000"));
//# sourceMappingURL=index.js.map