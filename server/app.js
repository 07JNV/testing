import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import bodyParser from "body-parser";
import { Server } from "socket.io";
import http from "http";

dotenv.config();


const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: [
      "http://localhost:3000", 
      
    ],
    methods: ["GET", "POST"],
    credentials: true,
  },
});

// CORS configuration
const corsOptions = {
  origin: function (origin, callback) {
    const allowedOrigins = [
      "http://localhost:3000",
      
    ];
    if (allowedOrigins.indexOf(origin) !== -1 || !origin) {
      callback(null, true);
    } else {
      callback(new Error("Not allowed by CORS"));
    }
  },
  methods: "GET,HEAD,PUT,PATCH,POST,DELETE",
  credentials: true,
  optionsSuccessStatus: 204,
};

app.use(cors(corsOptions));
app.use(express.json({ limit: "30mb", extended: true }));
app.use(express.urlencoded({ limit: "30mb", extended: true }));

app.get("/", (req, res) => {
  res.send("hello");
});

app.use(bodyParser.json());


const PORT = process.env.PORT || 8080;



const users = {}; 

io.on('connection', socket => {
  console.log('New client connected');

  socket.on('register', email => {
    users[email] = socket.id; 
    console.log('User registered:', email, 'with socket ID:', socket.id);
    socket.emit('me', socket.id); 
  });

  socket.on('callUser', (data) => {
    const targetSocketId = users[data.userToCall];
    if (targetSocketId) {
      io.to(targetSocketId).emit('callUser', {
        signal: data.signalData,
        from: data.from,
      });
    }
  });

  socket.on('answerCall', (data) => {
    const targetSocketId = users[data.to];
    if (targetSocketId) {
      io.to(targetSocketId).emit('callAccepted', data.signal);
    }
  });

  socket.on('screenShare', (data) => {
    const { to, signalData,from} = data;
    const targetSocketId = users[to]; 
    if (targetSocketId) {
      io.to(targetSocketId).emit('screenReceived', {
        signal: signalData,
        from: data.from,
      });
    }
  });
  

  socket.on('inresponse', (data) => {
    const targetSocketId = users[data.to]; 
    console.log(data)
    if (targetSocketId) {
      io.to(targetSocketId).emit('responsefromreceiver', data.signal);
    }
  });

  socket.on('disconnect', () => {
    for (let email in users) {
      if (users[email] === socket.id) {
        delete users[email];
        break;
      }
    }
    console.log('Client disconnected');
  });
});

server.listen(PORT, () => {
  console.log(`Server Running on the PORT ${PORT}`);
});
