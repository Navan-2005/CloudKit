import dotenv from "dotenv";
dotenv.config();
import express from "express";
import cors from "cors";
import { simpleGit } from "simple-git"; 
import { generate } from "./utils.js";
import path from "path";
import { getAllFiles } from "./file.js";
import {createClient} from "redis";
import { uploadFile } from "./aws.js";

const subscriber=createClient();
subscriber.connect();

const publisher=createClient();
publisher.connect();

const app = express();
app.use(cors());
app.use(express.json()); 

app.post('/deploy', async (req, res) => {
  try {
    const repoUrl = req.body.repoUrl;
    if (!repoUrl) {
      return res.status(400).json({ error: "Missing repoUrl" });
    }

    const git = simpleGit(); 
    const id=generate();
    await git.clone(repoUrl, path.join(__dirname,`output/${id}` ));
    
    const files=getAllFiles(path.join(__dirname,`output/${id}`))
    
    files.forEach(async file=>{
      await uploadFile(file.slice(__dirname.length+1),file);
    })

    await new Promise((resolve)=>setTimeout(resolve, 5000));

    publisher.lPush("build-queue",id);

    publisher.hSet("status",id,"uploaded");

    res.json({ id : id});
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to clone repository" });
  }
});

app.get("/status",async(req , res)=>{
    const id=req.query.id;
    const response=await subscriber.hGet("status",id as string);
    res.json({status:response});
})

app.listen(3000, () => console.log("Server started at http://localhost:3000"));
