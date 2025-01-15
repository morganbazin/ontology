// Backend (Node.js + TypeScript)
import express, { Request, Response } from "express";
import cors from "cors";
import { Film, Person, persons, Work, works } from "./data";

const app = express();
const port = 3001;

// Middleware
app.use(cors());
app.use(express.json());

/*
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
*/

app.get("/search", (req: Request, res: Response) => {
  const category = req.query.category as string;
  const search = req.query.search as string;
  const type = req.query.type as string;

  console.log("category", category, category === "Work", category === "Person");
  console.log("search", search);
  console.log("type", type);

  let resultsPerson: Person[] = [];
  let resultsWork: Work[] = [];
  let results: (Person | Work)[] = [];

  if (category === "Person") {
    resultsPerson = persons.filter((person) => {
      return person.name
        .toLowerCase()
        .includes((search as string).toLowerCase());
    });

    resultsWork = works.filter((work) => {
      let found = false;
      for (const person of resultsPerson) {
        if (person.works.includes(work.id)) {
          found = true;
          break;
        }
      }
      return found;
    });
  }
  if (category === "Work") {
    resultsWork = works.filter((work) => {
      let matchesQuery = false;
      console.log(search, search === "");
      if (search === "") {
        matchesQuery = true;
      } else if (
        work.title.toLowerCase().includes((search as string).toLowerCase())
      ) {
        matchesQuery = true;
      } else if (
        work.genre.toLowerCase().includes((search as string).toLowerCase())
      ) {
        matchesQuery = true;
      } else if (
        work.theme.toLowerCase().includes((search as string).toLowerCase())
      ) {
        matchesQuery = true;
      } else if (
        work.period.toLowerCase().includes((search as string).toLowerCase())
      ) {
        matchesQuery = true;
      }

      let matchesType = false;
      if (type === "") {
        matchesType = true;
      } else if (type.toLowerCase().includes(work.type.toLowerCase())) {
        matchesType = true;
      }
      return matchesQuery && matchesType;
    });

    resultsPerson = persons.filter((person) => {
      let found = false;
      for (const work of resultsWork) {
        if (work.creatorIds.includes(person.id)) {
          found = true;
          break;
        }
        if (work.type === "Film" && (work as Film).actors.includes(person.id)) {
          found = true;
          break;
        }
      }
      return found;
    });
  }

  res.json({ persons: resultsPerson, works: resultsWork });
});

app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});
