const express=require('express');
const app = express();
const port = 3000;
const path = require("path");


app.use(express.json());
app.use(express.static(path.join(__dirname,"..","frontend")));
app.use(cors()); // allows frontend to talk to backend
app.use(express.json()); // parses JSON body


//routes

app.get("/", (req, res) => {
    res.sendFile(path.join(__dirname,"..","home", "index.html"));
});

app.get("/video", (req,res) => {
    console.log("Video request recieved");
    res.send({msg : "Server says hi"});
});

app.listen(port, () => {console.log(`Server is live on ${port}`);
});