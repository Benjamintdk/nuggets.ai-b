import express from 'express';
import { spawn } from 'child_process';
const app = express();
app.use(express.json());

const PORT = 3000;

app.get('/', (_req, res) => {
    let dataToSend: unknown;
    // spawn new child process to call the python script
    const python = spawn('python', ['prediction.py']);
    // collect data from script
    python.stdout.on('data', (data) => {
     // eslint-disable-next-line @typescript-eslint/no-unsafe-call
     dataToSend = data.toString();
    });
    // in close event we are sure that stream from child process is closed
    python.on('close', () => {
    // send data to browser
    res.send(dataToSend);
    });
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});