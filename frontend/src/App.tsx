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
  const [selectedNode, setSelectedNode] = useState<any | null>(null);
  const [data, setData] = useState<IData | null>(null);

  const [category, setCategory] = useState<"Work" | "Person">("Work");
  const [search, setSearch] = useState<string>("");
  const [type, setType] = useState<string>("");

  const svgRef = useRef<SVGSVGElement | null>(null);

  const handleNodeClick = (node: any) => {
    setSelectedNode(node); // Mettre à jour le nœud sélectionné
  };

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
        setData(response.data);
      });
  }, [category, search, type]);

  useEffect(() => {
    const svg = d3.select(svgRef.current);
    const width = 2000;
    const height = 2000;

    svg.selectAll("*").remove();
    const g = svg.append("g");

    const links: any[] = [];
    const nodes: any[] = [];

    for (const person of data?.persons ?? []) {
      for (const work of data?.works ?? []) {
        if (work.creatorIds.includes(person.id)) {
          links.push({
            source: "person" + person.id,
            target: "work" + work.id,
          });
        } else if (
          work.type === "Film" &&
          (work as Film).actors.includes(person.id)
        ) {
          links.push({
            source: "person" + person.id,
            target: "work" + work.id,
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

    const zoom = d3
      .zoom()
      .on("zoom", (event) => g.attr("transform", event.transform));
    svg.call(zoom);

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

    g.append("g")
      .selectAll("line")
      .data(links)
      .enter()
      .append("line")
      .attr("stroke", "#999")
      .attr("stroke-width", 2);

    g.append("g")
      .selectAll("circle")
      .data(nodes)
      .enter()
      .append("circle")
      .attr("r", 10)
      .attr("fill", (d) => (d.type === "Person" ? "blue" : "green"))
      .on("click", (_, d) => handleNodeClick(d)); // Attache les données au clic

    g.append("g")
      .selectAll("text")
      .data(nodes)
      .enter()
      .append("text")
      .text((d: any) => d.label)
      .attr("x", 15)
      .attr("y", 5);

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

  return (
    <div className="bg-white w-full h-full min-h-screen flex">
      {/* Section gauche : Graphe */}
      <div className="w-2/3 h-full flex justify-center items-center bg-gray-100 container">
        <svg ref={svgRef} width="100%" height="100%" />
      </div>

      {/* Section droite : Détails */}
      <div className="w-1/3 h-full p-4 bg-white border-l">
        {selectedNode ? (
          <div>
            <h2 className="text-xl font-bold mb-4">{selectedNode.label}</h2>
            <p>
              <strong>Type:</strong> {selectedNode.type}
            </p>
            {selectedNode.type === "Person" && (
              <p>
                <strong>Roles:</strong> {selectedNode.roles?.join(", ")}
              </p>
            )}
            {selectedNode.type === "Work" && (
              <p>
                <strong>Genre:</strong> {selectedNode.genre}
              </p>
            )}
          </div>
        ) : (
          <p className="text-gray-500">
            Cliquez sur un élément du graphe pour afficher les détails ici.
          </p>
        )}
      </div>
    </div>
  );
};

export default App;
