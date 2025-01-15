// Backend (Node.js + TypeScript)
import express, { Request, Response } from "express";
import cors from "cors";

const app = express();
const port = 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Sample Data
const works = [
  {
    id: 1,
    title: "Starry Night",
    creator: "Vincent van Gogh",
    type: "Painting",
    genre: "Post-Impressionism",
  },
  {
    id: 2,
    title: "The Persistence of Memory",
    creator: "Salvador Dalí",
    type: "Painting",
    genre: "Surrealism",
  },
  {
    id: 3,
    title: "Symphony No. 9",
    creator: "Ludwig van Beethoven",
    type: "Music",
    genre: "Classical",
  },
  {
    id: 4,
    title: "The Godfather",
    creator: "Francis Ford Coppola",
    type: "Film",
    genre: "Drama",
  },
];

// Routes
// Get all works
app.get("/works", (req: Request, res: Response) => {
  res.json(works);
});

// Get work by ID
app.get("/works/:id", (req: Request, res: Response) => {
  const work = works.find((w) => w.id === parseInt(req.params.id));
  if (work) {
    res.json(work);
  } else {
    res.status(404).json({ message: "Work not found" });
  }
});

// Get works by type
app.get("/works/type/:type", (req: Request, res: Response) => {
  const type = req.params.type;
  const filteredWorks = works.filter(
    (w) => w.type.toLowerCase() === type.toLowerCase()
  );
  res.json(filteredWorks);
});

// Get works by genre
app.get("/works/genre/:genre", (req: Request, res: Response) => {
  const genre = req.params.genre;
  const filteredWorks = works.filter(
    (w) => w.genre.toLowerCase() === genre.toLowerCase()
  );
  res.json(filteredWorks);
});

// Get works by creator
app.get("/works/creator/:creator", (req: Request, res: Response) => {
  const creator = req.params.creator;
  const filteredWorks = works.filter(
    (w) => w.creator.toLowerCase() === creator.toLowerCase()
  );
  res.json(filteredWorks);
});

app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});
