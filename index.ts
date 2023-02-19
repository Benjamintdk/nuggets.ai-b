import * as dotenv from 'dotenv';
dotenv.config();
import { Model, DataTypes, Sequelize, QueryTypes } from 'sequelize';
import express, { RequestHandler } from 'express';
import { spawn } from 'child_process';
const app = express();
app.use(express.json());

const PORT = 3001;
const sequelize = new Sequelize(String(process.env.POSTGRESQL_DB), 
                                String(process.env.POSTGRESQL_DB_USER), 
                                String(process.env.POSTGRESQL_DB_PASSWORD), {
    host: process.env.POSTGRESQL_DB_HOST,
    dialect: "postgres",
    dialectOptions: {ssl: {
        require: true,
        rejectUnauthorized: false
      }}
});

class Link extends Model {}
Link.init({
id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
},
content: {
    type: DataTypes.TEXT,
    allowNull: false
},
link: {
    type: DataTypes.TEXT,
    allowNull: false
}
}, {
sequelize,
underscored: true,
timestamps: false,
modelName: 'link'
});

// eslint-disable-next-line @typescript-eslint/no-floating-promises
Link.sync();

// Stores words to database
app.get('/populate-db', (req, res) => {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    const links: {id: number, content: string, link: string}[] = req.body.words;
    try {
        links.map(async (link) => {
            try {
                const data = await Link.create(link);
                res.json(data);
            } catch (error) {
                console.log("There is an error: " + error);
            }
        });
    } catch (error) {
        console.error('Unable to connect to the database:', error);
    }   
});

// 1) Need to refactor to load words from database
app.get('/get-prediction', (async (req, res) => {
    let dataToSend: unknown;
    const word = String(req.body.word);
    console.log("Word: " + word);
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    const links: {id: number, content: string, link: string}[] = await sequelize.query("SELECT * FROM links", { type: QueryTypes.SELECT });
    const words = links.map(link => link.content);
    // spawn new child process to call the python script
    const python = spawn('python', ['prediction.py', word, ...words]);
    // collect data from script
    python.stdout.on('data', (data) => {
        dataToSend = String(data);
    });
    // in close event we are sure that stream from child process is closed
    python.on('close', () => {
    // send data to browser
    res.send(dataToSend);
    });
}) as RequestHandler);

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});