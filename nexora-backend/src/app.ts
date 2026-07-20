import express, { Application, Request, Response } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';

dotenv.config();

const app: Application = express();
const PORT = process.env.PORT || 5000;

// Security & Request Parsing Middlewares
app.use(helmet()); 
app.use(cors());   
app.use(express.json()); 

// Base Health Check Route
app.get('/health', (req: Request, res: Response) => {
    res.status(200).json({ 
        status: 'UP', 
        service: 'Nexora Core Engine Gateway',
        timestamp: new Date().toISOString()
    });
});

app.listen(PORT, () => {
    console.log(`[Nexora Server]: Gateway running smoothly on port ${PORT}`);
});