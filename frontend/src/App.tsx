// Frontend (React + TypeScript)
import React, { useEffect, useRef, useState } from "react";
import axios from "axios";
import * as d3 from "d3";

// Ontology Model Definition
export interface BaseWork {
  id: number;
  title: string;
  creatorIds: number[]; // References to Person IDs
  type: "Film" | "Book" | "Painting";
  genre: string;
  theme: string;
  period: string;
  relatedWorks: number[]; // References to related work IDs
}

// différents type d'oeuvre avec différentes propriétés
export interface Film extends BaseWork {
  type: "Film";
  duration: number;
  studio: string;
  actors: number[];
}

export interface Book extends BaseWork {
  type: "Book";
  narrativeType: string;
  pageCount: number;
}

export interface Painting extends BaseWork {
  type: "Painting";
  medium: string;
  dimensions: { width: number; height: number };
  location: string;
}

// Personne
export interface Person {
  id: number;
  name: string;
  birthYear?: number;
  deathYear?: number;
  roles: ("Author" | "Actor" | "Director" | "Painter")[];
  works: number[];
}

interface IData {
  persons: Person[];
  works: Work[];
}

export type Work = Film | Book | Painting;

const App: React.FC = () => {
  const [works, setWorks] = useState<Work[]>([]);
  const [selectedWork, setSelectedWork] = useState<Work | null>(null);
  const [data, setData] = useState<IData | null>(null);

  const [category, setCategory] = useState<"Work" | "Person">("Work");
  const [search, setSearch] = useState<string>("");
  const [type, setType] = useState<string>("");

  const svgRef = useRef<SVGSVGElement | null>(null);

  useEffect(() => {
    axios
      .get(`http://localhost:3001/search`, {
        params: {
          category: category,
          type: type,
          search: search,
        },
      })
      .then((response) => {
        console.log(response);
        setData(response.data);
      });
  }, [category, search, type]);

  useEffect(() => {
    const svg = d3.select(svgRef.current);
    const width = 2000;
    const height = 2000;

    // Clear previous SVG content to avoid duplication
    svg.selectAll("*").remove();

    // Create a group to hold all zoomable elements
    const g = svg.append("g");

    const links: any[] = [];
    const nodes: any[] = [];

    // Populate links and nodes
    for (const person of data?.persons ?? []) {
      for (const work of data?.works ?? []) {
        if (work.creatorIds.includes(person.id)) {
          links.push({
            source: "person" + person.id,
            target: "work" + work.id,
            type: "a créé",
          });
        } else if (
          work.type === "Film" &&
          (work as Film).actors.includes(person.id)
        ) {
          links.push({
            source: "person" + person.id,
            target: "work" + work.id,
            type: "a joué dans",
          });
        }
      }
    }

    for (const person of data?.persons ?? []) {
      nodes.push({
        id: "person" + person.id,
        label: person.name,
        type: "Person",
      });
    }

    for (const work of data?.works ?? []) {
      nodes.push({ id: "work" + work.id, label: work.title, type: work.type });
    }

    // Define zoom behavior
    const zoom = d3.zoom().on("zoom", (event) => {
      g.attr("transform", event.transform); // Apply zoom and pan transformations
    });

    // Apply zoom behavior to the SVG
    svg.call(zoom);

    // Create simulation
    const simulation = d3
      .forceSimulation(nodes)
      .force(
        "link",
        d3
          .forceLink(links)
          .id((d: any) => d.id)
          .distance(100)
      )
      .force("charge", d3.forceManyBody().strength(-300))
      .force("center", d3.forceCenter(width / 2, height / 2));

    // Draw links
    g.append("g")
      .selectAll("line")
      .data(links)
      .enter()
      .append("line")
      .attr("stroke", "#999")
      .attr("stroke-width", 2);

    // Draw nodes
    g.append("g")
      .selectAll("circle")
      .data(nodes)
      .enter()
      .append("circle")
      .attr("r", 10)
      .attr("fill", (d) => (d.type === "Person" ? "blue" : "green"));

    // Draw labels
    g.append("g")
      .selectAll("text")
      .data(nodes)
      .enter()
      .append("text")
      .text((d: any) => d.label)
      .attr("x", 15)
      .attr("y", 5);

    // Update positions on simulation tick
    simulation.on("tick", () => {
      g.selectAll("line")
        .attr("x1", (d: any) => d.source.x)
        .attr("y1", (d: any) => d.source.y)
        .attr("x2", (d: any) => d.target.x)
        .attr("y2", (d: any) => d.target.y);

      g.selectAll("circle")
        .attr("cx", (d: any) => d.x)
        .attr("cy", (d: any) => d.y);

      g.selectAll("text")
        .attr("x", (d: any) => d.x + 15)
        .attr("y", (d: any) => d.y + 5);
    });
  }, [data]);

  const handleSelectWork = (id: number) => {
    axios.get(`http://localhost:3001/works/${id}`).then((response) => {
      setSelectedWork(response.data);
    });
  };

  return (
    <div
      className="App"
      style={{ fontFamily: "Arial, sans-serif", padding: "20px" }}
    >
      <h1>Ontology of Cultural Works</h1>
      <svg ref={svgRef} width="100%" height="600px"></svg>
      <h2>List of Works</h2>
      <ul>
        {works.map((work) => (
          <li key={work.id}>
            <button
              style={{
                background: "lightblue",
                border: "none",
                padding: "5px",
                cursor: "pointer",
              }}
              onClick={() => handleSelectWork(work.id)}
            >
              {work.title}
            </button>
          </li>
        ))}
      </ul>
      {selectedWork && (
        <div
          style={{
            marginTop: "20px",
            padding: "10px",
            border: "1px solid gray",
          }}
        >
          <h2>Details</h2>
          <p>
            <strong>Title:</strong> {selectedWork.title}
          </p>
          <p>
            <strong>Creator:</strong> {selectedWork.creatorIds.join(", ")}
          </p>
          <p>
            <strong>Type:</strong> {selectedWork.type}
          </p>
          <p>
            <strong>Genre:</strong> {selectedWork.genre}
          </p>
        </div>
      )}
    </div>
  );
};

export default App;
